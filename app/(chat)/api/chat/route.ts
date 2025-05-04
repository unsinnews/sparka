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
  updateUserCredits,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import type { YourToolName } from '@/lib/ai/tools/tools';
import { myProvider } from '@/lib/ai/providers';
import { AnnotationDataStreamWriter } from '@/lib/ai/tools/annotation-stream';
import { getTools, toolsDefinitions } from '@/lib/ai/tools/tools';
import type { YourUIMessage } from '@/lib/ai/tools/annotations';
import { determineActiveTools } from '@/lib/ai/tools/utils';
import type { NextRequest } from 'next/server';
import { modelCosts } from '@/lib/config/credits';
import type { AvailableModels } from '@/lib/ai/providers';

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
      selectedChatModel: tmpSelectedChatModel,
      data,
    }: {
      id: string;
      messages: Array<YourUIMessage>;
      selectedChatModel: AvailableModels;
      data: ChatRequestData;
    } = await request.json();

    const selectedChatModel = 'gpt-4o';

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = await getUserById({ userId: session.user.id });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    const baseModelCost = modelCosts[selectedChatModel] ?? 1;

    if (user.credits < baseModelCost) {
      return new Response('Insufficient credits for selected model', {
        status: 402,
      });
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

    let activeTools: YourToolName[];
    try {
      activeTools = determineActiveTools({
        userCredits: user.credits,
        selectedChatModel,
        explicitlyRequestedTool,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Response(error.message, { status: 402 });
      }
      return new Response('Error determining available tools', { status: 500 });
    }

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
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, activeTools }),
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
          onFinish: async ({ response, toolResults, toolCalls }) => {
            // TODO: Create a better cost calculation
            const totalCost =
              toolCalls.reduce((acc, toolCall) => {
                return acc + toolsDefinitions[toolCall.toolName].cost;
              }, 0) + baseModelCost;

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

                await updateUserCredits({
                  userId: session.user.id,
                  creditsChange: -totalCost,
                });
              } catch (_) {
                console.error('Failed to save chat or deduct credits');
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
        return 'Oops, an error occured!';
      },
    });
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
