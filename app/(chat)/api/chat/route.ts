import {
  appendResponseMessages,
  convertToCoreMessages,
  createDataStream,
  smoothStream,
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
  saveStreamId,
  getStreamsByChatId,
  getMessagesByChatId,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import type { YourToolName } from '@/lib/ai/tools/tools';
import { AnnotationDataStreamWriter } from '@/lib/ai/tools/annotation-stream';
import { getTools, toolsDefinitions } from '@/lib/ai/tools/tools';
import type { YourUIMessage } from '@/lib/ai/tools/annotations';
import type { NextRequest } from 'next/server';
import {
  determineStepTools,
  getBaseModelCost,
} from '@/lib/credits/credits-utils';
import { getModelProvider, getModelProviderOptions } from '@/lib/ai/providers';
import { reserveCreditsWithCleanup } from '@/lib/credits/credit-reservation';
import {
  getModelDefinition,
  type AvailableProviderModels,
  type ModelDefinition,
} from '@/lib/ai/all-models';
import { createResumableStreamContext } from 'resumable-stream';
import { after } from 'next/server';

export const maxDuration = 60;

const streamContext = createResumableStreamContext({
  waitUntil: after,
  // For production, you would configure Redis here
  keyPrefix: 'parlagen:resumable-stream',
  // Uses process.env.REDIS_URL
});

export type ChatRequestData = {
  deepResearch: boolean;
  reason: boolean;
  webSearch: boolean;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
  }

  const session = await auth();

  try {
    // First check if chat exists and is public
    const chat = await getChatById({ id: chatId });

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    // If chat is not public, require authentication and ownership
    if (chat.visibility !== 'public') {
      if (!session || !session.user || !session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }

      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const streamIds = await getStreamsByChatId({ chatId });

    if (!streamIds.length) {
      return new Response('No streams found', { status: 404 });
    }

    const recentStreamId = streamIds.at(-1);

    if (!recentStreamId) {
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
      return new Response(stream, { status: 200 });
    }

    /*
     * For when the generation is "active" during SSR but the
     * resumable stream has concluded after reaching this point.
     */

    const messages = await getMessagesByChatId({ id: chatId });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage || mostRecentMessage.role !== 'assistant') {
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

    return new Response(streamWithMessage, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/chat:', error);
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

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = await getUserById({ userId: session.user.id });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    const deepResearch = data.deepResearch;
    const webSearch = data.webSearch;
    const reason = data.reason;

    let modelDefinition: ModelDefinition;
    try {
      modelDefinition = getModelDefinition(selectedChatModel);
    } catch (error) {
      return new Response('Model not found', { status: 404 });
    }
    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // TODO: Do something smarter by truncating the context to a numer of tokens (maybe even based on setting)
    const contextForLLM = convertToCoreMessages(messages.slice(-5));

    const chat = await getChatById({ id: chatId });

    if (chat && chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id: chatId, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const [exsistentMessage] = await getMessageById({ id: userMessage.id });

    if (exsistentMessage && exsistentMessage.chatId !== chatId) {
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
        },
      });
    }
    let explicitlyRequestedTool: YourToolName | null = null;
    if (deepResearch) explicitlyRequestedTool = 'deepResearch';
    // else if (reason) explicitlyRequestedTool = 'reasonSearch';
    else if (webSearch) explicitlyRequestedTool = 'webSearch';

    const baseModelCost = getBaseModelCost(selectedChatModel);
    const reservedCredits = await reserveCreditsWithCleanup(
      session.user.id,
      baseModelCost,
      5,
    );

    if (!reservedCredits.success) {
      return new Response(reservedCredits.error, {
        status: 402,
      });
    }

    // Now we know reservedCredits.success is true
    const { reservation } = reservedCredits;

    const toolsResult = determineStepTools({
      toolBudget: reservation.budget - baseModelCost,
      explicitlyRequestedTool,
    });

    if (!toolsResult.success) {
      await reservation.cleanup();
      return new Response(toolsResult.error || 'Cannot determine tools', {
        status: 402,
      });
    }

    const activeTools = toolsResult.activeTools;

    // Create AbortController with 55s timeout for credit cleanup
    const abortController = new AbortController();
    const timeoutId = setTimeout(async () => {
      await reservation.cleanup();
      abortController.abort();
    }, 55000); // 55 seconds

    // Ensure cleanup on any unhandled errors
    try {
      // Add context of user selection to the user message
      // TODO: Consider doing this in the system prompt instead
      if (userMessage.parts[0].type === 'text') {
        if (explicitlyRequestedTool) {
          userMessage.content = `${userMessage.content} (I want to use ${explicitlyRequestedTool})`;
          userMessage.parts[0].text = `${userMessage.parts[0].text} (I want to use ${explicitlyRequestedTool})`;
        }
      }

      const messageId = generateUUID();
      const streamId = generateUUID();

      // Record this new stream so we can resume later
      await saveStreamId({ chatId, streamId });

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
        },
      });

      // Build the data stream that will emit tokens
      const stream = createDataStream({
        execute: (dataStream) => {
          const annotationStream = new AnnotationDataStreamWriter(dataStream);

          const result = streamText({
            model: getModelProvider(selectedChatModel),
            system: systemPrompt({ activeTools }),
            messages: contextForLLM,
            maxSteps: 5,
            experimental_activeTools: activeTools,
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: () => messageId,
            experimental_telemetry: {
              isEnabled: true,
              functionId: 'chat-response',
            },
            tools: getTools({
              dataStream: annotationStream,
              session,
              contextForLLM,
              messageId,
            }),
            abortSignal: abortController.signal, // Pass abort signal to streamText
            ...(modelDefinition.features?.fixedTemperature
              ? {
                  temperature: modelDefinition.features.fixedTemperature,
                }
              : {}),

            providerOptions: getModelProviderOptions(selectedChatModel),

            onFinish: async ({ response, toolResults, toolCalls, steps }) => {
              // Clear timeout since we finished successfully
              clearTimeout(timeoutId);

              const actualCost =
                baseModelCost +
                steps
                  .flatMap((step) => step.toolResults)
                  .reduce((acc, toolResult) => {
                    return acc + toolsDefinitions[toolResult.toolName].cost;
                  }, 0);

              if (session.user?.id) {
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
                    },
                  });

                  // Finalize credit usage: deduct actual cost, release reservation
                  await reservation.finalize(actualCost);
                } catch (error) {
                  console.error(
                    'Failed to save chat or finalize credits:',
                    error,
                  );
                  // Still release the reservation on error
                  await reservation.cleanup();
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
          if (session.user?.id) {
            reservation.cleanup();
          }
          return 'Oops, an error occured!';
        },
      });

      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } catch (error) {
      clearTimeout(timeoutId);
      await reservation.cleanup();
      throw error;
    }
  } catch (error) {
    console.error(error);
    return new Response('An error occurred while processing your request!', {
      status: 404,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
