import {
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  getUserById,
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
import { getModelProvider, type AvailableModels } from '@/lib/ai/providers';
import { reserveCreditsWithCleanup } from '@/lib/credits/credit-reservation';

export const maxDuration = 60;

export type ChatRequestData = {
  deepResearch: boolean;
  reason: boolean;
  webSearch: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
      data,
    }: {
      id: string;
      messages: Array<YourUIMessage>;
      selectedChatModel: AvailableModels;
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

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: userMessage.id,
          role: userMessage.role,
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
          annotations: userMessage.annotations,
        },
      ],
    });
    let explicitlyRequestedTool: YourToolName | null = null;
    if (deepResearch) explicitlyRequestedTool = 'deepResearch';
    else if (reason) explicitlyRequestedTool = 'reasonSearch';
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

      return createDataStreamResponse({
        execute: (dataStream) => {
          const annotationStream = new AnnotationDataStreamWriter(dataStream);

          const result = streamText({
            model: getModelProvider(selectedChatModel),
            system: systemPrompt({ activeTools }),
            messages,
            maxSteps: 5,
            experimental_activeTools: activeTools,
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            experimental_telemetry: {
              isEnabled: true,
              functionId: 'chat-response',
            },
            tools: getTools({
              dataStream: annotationStream,
              session,
            }),

            onFinish: async ({ response, toolResults, toolCalls, steps }) => {
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

                  await saveMessages({
                    messages: [
                      {
                        id: assistantId,
                        chatId: id,
                        role: assistantMessage.role,
                        parts: assistantMessage.parts,
                        attachments:
                          assistantMessage.experimental_attachments ?? [],
                        createdAt: new Date(),
                        annotations: annotationStream.getAnnotations(),
                      },
                    ],
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
          });

          result.consumeStream();

          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          });
        },
        onError: (error) => {
          console.error(error);
          // Release reserved credits on error (fire and forget)
          if (session.user?.id) {
            reservation.cleanup();
          }
          return 'Oops, an error occured!';
        },
      });
    } catch (error) {
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
