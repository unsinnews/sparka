import {
  appendResponseMessages,
  convertToCoreMessages,
  createDataStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  getUserById,
  saveMessage,
  updateMessage,
  getMessageById,
  getAllMessagesByChatId,
} from '@/lib/db/queries';
import { getDefaultThread } from '@/lib/thread-utils';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import type { YourToolName } from '@/lib/ai/tools/tools';
import { AnnotationDataStreamWriter } from '@/lib/ai/tools/annotation-stream';
import { getTools, toolsDefinitions, allTools } from '@/lib/ai/tools/tools';
import type { YourUIMessage } from '@/lib/types/ui';
import type { NextRequest } from 'next/server';
import {
  filterAffordableTools,
  getBaseModelCost,
} from '@/lib/credits/credits-utils';
import { getLanguageModel, getModelProviderOptions } from '@/lib/ai/providers';
import {
  reserveCreditsWithCleanup,
  type CreditReservation,
} from '@/lib/credits/credit-reservation';
import {
  getModelDefinition,
  type AvailableProviderModels,
  type ModelDefinition,
} from '@/lib/ai/all-models';
import { createResumableStreamContext } from 'resumable-stream';
import { after } from 'next/server';
import {
  getAnonymousSession,
  createAnonymousSession,
  setAnonymousSession,
} from '@/lib/anonymous-session-server';
import type { AnonymousSession } from '@/lib/types/anonymous';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';
import { markdownJoinerTransform } from '@/lib/ai/markdown-joiner-transform';
import { checkAnonymousRateLimit, getClientIP } from '@/lib/utils/rate-limit';

export const maxDuration = 60;

function filterReasoningParts<T extends { parts: any[] }>(messages: T[]): T[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.filter((part) => {
      // Filter out reasoning parts to prevent cross-model compatibility issues
      // https://github.com/vercel/ai/discussions/5480
      return part.type !== 'reasoning';
    }),
  }));
}

async function getCreditReservation(userId: string, baseModelCost: number) {
  const reservedCredits = await reserveCreditsWithCleanup(
    userId,
    baseModelCost,
    5,
  );

  if (!reservedCredits.success) {
    return { reservation: null, error: reservedCredits.error };
  }

  return { reservation: reservedCredits.reservation, error: null };
}

// Create shared Redis clients for resumable stream and cleanup
let redisPublisher: any = null;
let redisSubscriber: any = null;

if (process.env.REDIS_URL) {
  (async () => {
    const redis = await import('redis');
    redisPublisher = redis.createClient({ url: process.env.REDIS_URL });
    redisSubscriber = redis.createClient({ url: process.env.REDIS_URL });
    await Promise.all([redisPublisher.connect(), redisSubscriber.connect()]);
  })();
}

const streamContext = createResumableStreamContext({
  waitUntil: after,
  keyPrefix: 'sparka-ai:resumable-stream',
  ...(redisPublisher && redisSubscriber
    ? {
        publisher: redisPublisher,
        subscriber: redisSubscriber,
      }
    : {}),
});

export type ChatRequestToolsConfig = {
  deepResearch: boolean;
  reason: boolean;
  webSearch: boolean;
  generateImage: boolean;
  writeOrCode: boolean;
};
export type ChatRequestData = ChatRequestToolsConfig & {
  parentMessageId: string | null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    console.log('RESPONSE > GET /api/chat: chatId is required');
    return new Response('chatId is required', { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id || null;
  const isAnonymous = userId === null;

  try {
    let streamIds: string[] = [];

    // For authenticated users, check DB permissions first
    if (!isAnonymous) {
      const chat = await getChatById({ id: chatId });

      if (!chat) {
        console.log('RESPONSE > GET /api/chat: Chat not found');
        return new Response('Chat not found', { status: 404 });
      }

      // If chat is not public, require authentication and ownership
      if (chat.visibility !== 'public') {
        if (!session || !session.user || !session.user.id) {
          console.log(
            'RESPONSE > GET /api/chat: Unauthorized - no session or user',
          );
          return new Response('Unauthorized', { status: 401 });
        }

        if (chat.userId !== session.user.id) {
          console.log(
            'RESPONSE > GET /api/chat: Unauthorized - chat ownership mismatch',
          );
          return new Response('Unauthorized', { status: 401 });
        }
      }
    }

    // Get streams from Redis for all users
    if (redisPublisher) {
      const keyPattern = isAnonymous
        ? `sparka-ai:anonymous-stream:${chatId}:*`
        : `sparka-ai:stream:${chatId}:*`;

      const keys = await redisPublisher.keys(keyPattern);
      streamIds = keys
        .map((key: string) => {
          const parts = key.split(':');
          return parts[parts.length - 1] || '';
        })
        .filter(Boolean);
    }

    if (!streamIds.length) {
      console.log('RESPONSE > GET /api/chat: No streams found');
      return new Response('No streams found', { status: 404 });
    }

    const recentStreamId = streamIds.at(-1);

    if (!recentStreamId) {
      console.log('RESPONSE > GET /api/chat: No recent stream found');
      return new Response('No recent stream found', { status: 404 });
    }

    const emptyDataStream = createDataStream({
      execute: () => {},
    });

    const stream = await streamContext.resumableStream(
      recentStreamId,
      () => emptyDataStream,
    );

    if (stream) {
      console.log('RESPONSE > GET /api/chat: Returning resumable stream');
      return new Response(stream, { status: 200 });
    }

    /*
     * For when the generation is "active" during SSR but the
     * resumable stream has concluded after reaching this point.
     */

    const allMessages = await getAllMessagesByChatId({ chatId });
    const messages = getDefaultThread(allMessages);
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage || mostRecentMessage.role !== 'assistant') {
      console.log(
        'RESPONSE > GET /api/chat: No recent assistant message, returning empty stream',
      );
      return new Response(emptyDataStream, { status: 200 });
    }

    const streamWithMessage = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        });
      },
    });

    console.log(
      'RESPONSE > GET /api/chat: Returning stream with most recent message',
    );
    return new Response(streamWithMessage, { status: 200 });
  } catch (error) {
    console.error('RESPONSE > Error in GET /api/chat:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      id: chatId,
      messages,
      selectedChatModel,
      data,
    }: {
      id: string;
      messages: Array<YourUIMessage>;
      selectedChatModel: AvailableProviderModels;
      data: ChatRequestData;
    } = await request.json();

    const session = await auth();

    const userId = session?.user?.id || null;
    const isAnonymous = userId === null;
    let anonymousSession: AnonymousSession | null = null;

    // Check for anonymous users

    if (userId) {
      // TODO: Consider if checking if user exists is really needed
      const user = await getUserById({ userId });
      if (!user) {
        console.log('RESPONSE > POST /api/chat: User not found');
        return new Response('User not found', { status: 404 });
      }
    } else {
      // Apply rate limiting for anonymous users
      const clientIP = getClientIP(request);
      const rateLimitResult = await checkAnonymousRateLimit(
        clientIP,
        redisPublisher,
      );

      if (!rateLimitResult.success) {
        console.log(
          `RESPONSE > POST /api/chat: Rate limit exceeded for IP ${clientIP}`,
        );
        return new Response(
          JSON.stringify({
            error: rateLimitResult.error,
            type: 'RATE_LIMIT_EXCEEDED',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...(rateLimitResult.headers || {}),
            },
          },
        );
      }

      anonymousSession = await getAnonymousSession();
      if (!anonymousSession) {
        anonymousSession = await createAnonymousSession();
      }

      // Check message limits
      if (anonymousSession.remainingCredits <= 0) {
        console.log(
          'RESPONSE > POST /api/chat: Anonymous message limit reached',
        );
        return new Response(
          JSON.stringify({
            error: `You've used all ${ANONYMOUS_LIMITS.CREDITS} free messages. Sign up to continue chatting with unlimited access!`,
            type: 'ANONYMOUS_LIMIT_EXCEEDED',
            maxMessages: ANONYMOUS_LIMITS.CREDITS,
            suggestion:
              'Create an account to get unlimited messages and access to more AI models',
          }),
          {
            status: 402,
            headers: {
              'Content-Type': 'application/json',
              ...(rateLimitResult.headers || {}),
            },
          },
        );
      }

      // Validate model for anonymous users
      if (
        !ANONYMOUS_LIMITS.AVAILABLE_MODELS.includes(selectedChatModel as any)
      ) {
        console.log(
          'RESPONSE > POST /api/chat: Model not available for anonymous users',
        );
        return new Response(
          JSON.stringify({
            error: 'Model not available for anonymous users',
            availableModels: ANONYMOUS_LIMITS.AVAILABLE_MODELS,
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...(rateLimitResult.headers || {}),
            },
          },
        );
      }
    }

    const deepResearch = data.deepResearch;
    const webSearch = data.webSearch;
    const reason = data.reason;
    const generateImage = data.generateImage;
    const writeOrCode = data.writeOrCode;

    let modelDefinition: ModelDefinition;
    try {
      modelDefinition = getModelDefinition(selectedChatModel);
    } catch (error) {
      console.log('RESPONSE > POST /api/chat: Model not found');
      return new Response('Model not found', { status: 404 });
    }
    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      console.log('RESPONSE > POST /api/chat: No user message found');
      return new Response('No user message found', { status: 400 });
    }

    // Skip database operations for anonymous users
    if (!isAnonymous) {
      const chat = await getChatById({ id: chatId });

      if (chat && chat.userId !== userId) {
        console.log(
          'RESPONSE > POST /api/chat: Unauthorized - chat ownership mismatch',
        );
        return new Response('Unauthorized', { status: 401 });
      }

      if (!chat) {
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        });

        await saveChat({ id: chatId, userId, title });
      } else {
        if (chat.userId !== userId) {
          console.log(
            'RESPONSE > POST /api/chat: Unauthorized - chat ownership mismatch',
          );
          return new Response('Unauthorized', { status: 401 });
        }
      }

      const [exsistentMessage] = await getMessageById({ id: userMessage.id });

      if (exsistentMessage && exsistentMessage.chatId !== chatId) {
        console.log(
          'RESPONSE > POST /api/chat: Unauthorized - message chatId mismatch',
        );
        return new Response('Unauthorized', { status: 401 });
      }

      if (!exsistentMessage) {
        // If the message does not exist, save it
        await saveMessage({
          _message: {
            id: userMessage.id,
            chatId: chatId,
            role: userMessage.role,
            parts: userMessage.parts,
            attachments: userMessage.experimental_attachments ?? [],
            createdAt: new Date(),
            annotations: userMessage.annotations,
            isPartial: false,
            parentMessageId: data.parentMessageId,
          },
        });
      }
    }

    let explicitlyRequestedTools: YourToolName[] | null = null;
    if (deepResearch) explicitlyRequestedTools = ['deepResearch'];
    // else if (reason) explicitlyRequestedTool = 'reasonSearch';
    else if (webSearch) explicitlyRequestedTools = ['webSearch'];
    else if (generateImage) explicitlyRequestedTools = ['generateImage'];
    else if (writeOrCode)
      explicitlyRequestedTools = ['createDocument', 'updateDocument'];

    const baseModelCost = getBaseModelCost(selectedChatModel);

    let reservation: CreditReservation | null = null;

    if (!isAnonymous) {
      const { reservation: res, error: creditError } =
        await getCreditReservation(userId, baseModelCost);

      if (creditError) {
        console.log(
          'RESPONSE > POST /api/chat: Credit reservation error:',
          creditError,
        );
        return new Response(creditError, {
          status: 402,
        });
      }

      reservation = res;
    } else if (anonymousSession) {
      // Increment message count and update session
      anonymousSession.remainingCredits -= baseModelCost;
      await setAnonymousSession(anonymousSession);
    }

    const activeTools = filterAffordableTools(
      isAnonymous ? ANONYMOUS_LIMITS.AVAILABLE_TOOLS : allTools,
      isAnonymous
        ? ANONYMOUS_LIMITS.CREDITS
        : reservation
          ? reservation.budget - baseModelCost
          : 0,
    );

    if (
      explicitlyRequestedTools &&
      explicitlyRequestedTools.length > 0 &&
      !activeTools.some((tool) => explicitlyRequestedTools.includes(tool))
    ) {
      console.log(
        'RESPONSE > POST /api/chat: Insufficient budget for requested tool:',
        explicitlyRequestedTools,
      );
      return new Response(
        `Insufficient budget for requested tool: ${explicitlyRequestedTools}.`,
        {
          status: 402,
        },
      );
    } else if (
      explicitlyRequestedTools &&
      explicitlyRequestedTools.length > 0
    ) {
      // Add context of user selection to the user message
      // TODO: Consider doing this in the system prompt instead
      if (userMessage.parts[0].type === 'text') {
        userMessage.content = `${userMessage.content} (I want to use ${explicitlyRequestedTools.join(', or ')})`;
        userMessage.parts[0].text = `${userMessage.parts[0].text} (I want to use ${explicitlyRequestedTools.join(', or ')})`;
      }
    }

    // Filter out reasoning parts to ensure compatibility between different models
    const messagesWithoutReasoning = filterReasoningParts(messages.slice(-5));

    // TODO: Do something smarter by truncating the context to a numer of tokens (maybe even based on setting)
    const contextForLLM = convertToCoreMessages(messagesWithoutReasoning);

    // Extract the last generated image for use as reference (only from the immediately previous message)
    let lastGeneratedImage: { imageUrl: string; name: string } | null = null;

    // Find the last assistant message (should be the one right before the current user message)
    const lastAssistantMessage = messages.findLast(
      (message) => message.role === 'assistant',
    );

    if (lastAssistantMessage?.parts && lastAssistantMessage?.parts.length > 0) {
      for (const part of lastAssistantMessage.parts) {
        if (part.type !== 'tool-invocation') {
          continue;
        }

        const invocation = part.toolInvocation;

        if (
          invocation.toolName === 'generateImage' &&
          invocation.state === 'result' &&
          invocation.result?.imageUrl
        ) {
          lastGeneratedImage = {
            imageUrl: invocation.result.imageUrl,
            name: `generated-image-${invocation.toolCallId}.png`,
          };
          break;
        }
      }
    }

    // Create AbortController with 55s timeout for credit cleanup
    const abortController = new AbortController();
    const timeoutId = setTimeout(async () => {
      if (reservation) {
        await reservation.cleanup();
      }
      abortController.abort();
    }, 290000); // 290 seconds

    // Ensure cleanup on any unhandled errors
    try {
      const messageId = generateUUID();
      const streamId = generateUUID();

      // Record this new stream so we can resume later - use Redis for all users
      if (redisPublisher) {
        const keyPrefix = isAnonymous
          ? `sparka-ai:anonymous-stream:${chatId}:${streamId}`
          : `sparka-ai:stream:${chatId}:${streamId}`;

        await redisPublisher.setEx(
          keyPrefix,
          600, // 10 minutes TTL
          JSON.stringify({ chatId, streamId, createdAt: Date.now() }),
        );
      }

      if (!isAnonymous) {
        // Save placeholder assistant message immediately (needed for document creation)
        await saveMessage({
          _message: {
            id: messageId,
            chatId: chatId,
            role: 'assistant',
            parts: [], // Empty placeholder
            attachments: [],
            createdAt: new Date(),
            annotations: [],
            isPartial: true,
            parentMessageId: userMessage.id,
          },
        });
      }

      // Build the data stream that will emit tokens
      const stream = createDataStream({
        execute: (dataStream) => {
          const annotationStream = new AnnotationDataStreamWriter(dataStream);

          const result = streamText({
            model: getLanguageModel(selectedChatModel as any),
            system: systemPrompt(),
            messages: contextForLLM,
            maxSteps: 5,
            experimental_activeTools: activeTools,
            experimental_transform: markdownJoinerTransform(),
            experimental_generateMessageId: () => messageId,
            experimental_telemetry: {
              isEnabled: true,
              functionId: 'chat-response',
            },
            tools: getTools({
              dataStream: annotationStream,
              session: {
                user: {
                  id: userId || undefined,
                },
                expires: 'noop',
              },
              contextForLLM,
              messageId,
              selectedModel: selectedChatModel,
              userAttachments: userMessage.experimental_attachments || [],
              lastGeneratedImage,
            }),
            abortSignal: abortController.signal, // Pass abort signal to streamText
            ...(modelDefinition.features?.fixedTemperature
              ? {
                  temperature: modelDefinition.features.fixedTemperature,
                }
              : {}),

            providerOptions: getModelProviderOptions(selectedChatModel),

            onFinish: async ({
              response,
              finishReason,
              toolResults,
              toolCalls,
              steps,
              warnings,
            }) => {
              // Clear timeout since we finished successfully
              clearTimeout(timeoutId);

              if (userId) {
                const actualCost =
                  baseModelCost +
                  steps
                    .flatMap((step) => step.toolResults)
                    .reduce((acc, toolResult) => {
                      return acc + toolsDefinitions[toolResult.toolName].cost;
                    }, 0);

                try {
                  const assistantId = getTrailingMessageId({
                    messages: response.messages.filter(
                      (message) => message.role === 'assistant',
                    ),
                  });

                  if (!assistantId) {
                    throw new Error('No assistant message found!');
                  }

                  const [, assistantMessage] = appendResponseMessages({
                    messages: [userMessage],
                    responseMessages: response.messages,
                  });

                  if (!isAnonymous) {
                    await updateMessage({
                      _message: {
                        id: assistantId,
                        chatId: chatId,
                        role: assistantMessage.role,
                        parts: assistantMessage.parts,
                        attachments:
                          assistantMessage.experimental_attachments ?? [],
                        createdAt: new Date(),
                        annotations: annotationStream.getAnnotations(),
                        isPartial: false,
                        parentMessageId: userMessage.id,
                      },
                    });
                  }

                  // Finalize credit usage: deduct actual cost, release reservation
                  if (reservation) {
                    await reservation.finalize(actualCost);
                  }
                } catch (error) {
                  console.error(
                    'Failed to save chat or finalize credits:',
                    error,
                  );
                  // Still release the reservation on error
                  if (reservation) {
                    await reservation.cleanup();
                  }
                }
              }
            },
            onError: (error) => {
              // Clear timeout on error
              clearTimeout(timeoutId);
              console.error('StreamText error:', error);
            },
          });

          result.consumeStream();

          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          });
        },

        onError: (error) => {
          // Clear timeout on error
          clearTimeout(timeoutId);
          console.error(error);
          // Release reserved credits on error (fire and forget)
          if (reservation) {
            reservation.cleanup();
          }
          if (anonymousSession) {
            anonymousSession.remainingCredits += baseModelCost;
            setAnonymousSession(anonymousSession);
          }
          return 'Oops, an error occured!';
        },
      });

      after(async () => {
        // Cleanup to happen after the POST response is sent
        // Set TTL on Redis keys to auto-expire after 10 minutes
        if (redisPublisher) {
          try {
            const keyPattern = `sparka-ai:resumable-stream:rs:sentinel:${streamId}*`;
            const keys = await redisPublisher.keys(keyPattern);
            if (keys.length > 0) {
              // Set 5 minute expiration on all stream-related keys
              await Promise.all(
                keys.map((key: string) => redisPublisher.expire(key, 300)),
              );
            }
          } catch (error) {
            console.error('Failed to set TTL on stream keys:', error);
          }
        }

        try {
          // Clean up stream info from Redis for all users
          if (redisPublisher) {
            const keyPrefix = isAnonymous
              ? `sparka-ai:anonymous-stream:${chatId}:${streamId}`
              : `sparka-ai:stream:${chatId}:${streamId}`;

            await redisPublisher.expire(keyPrefix, 300);
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup stream record:', cleanupError);
        }
      });

      console.log('RESPONSE > POST /api/chat: Returning resumable stream');
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } catch (error) {
      clearTimeout(timeoutId);
      if (reservation) {
        await reservation.cleanup();
      }
      if (anonymousSession) {
        anonymousSession.remainingCredits += baseModelCost;
        setAnonymousSession(anonymousSession);
      }
      throw error;
    }
  } catch (error) {
    console.error('RESPONSE > POST /api/chat error:', error);
    return new Response('An error occurred while processing your request!', {
      status: 404,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    console.log('RESPONSE > DELETE /api/chat: id is required');
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    console.log(
      'RESPONSE > DELETE /api/chat: Unauthorized - no session or user',
    );
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      console.log(
        'RESPONSE > DELETE /api/chat: Unauthorized - chat ownership mismatch',
      );
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    console.log('RESPONSE > DELETE /api/chat: Chat deleted');
    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    console.error('RESPONSE > DELETE /api/chat error:', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
