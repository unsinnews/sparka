import { smoothStream, streamText } from 'ai';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';
import { getLanguageModel } from '@/lib/ai/providers';

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({
    title,
    description,
    dataStream,
    prompt,
    selectedModel,
  }) => {
    let draftContent = '';

    const { fullStream } = streamText({
      model: getLanguageModel(selectedModel),
      providerOptions: {
        telemetry: { isEnabled: true },
      },
      system:
        'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
      transform: smoothStream({ chunking: 'word' }),
      prompt,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;

        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({
    document,
    description,
    dataStream,
    selectedModel,
  }) => {
    let draftContent = '';

    const { fullStream } = streamText({
      model: getLanguageModel(selectedModel),
      system: updateDocumentPrompt(document.content, 'text'),
      transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      telemetry: {
        isEnabled: true,
        functionId: 'refine-text',
      },
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: 'content',
            content: document.content,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;
        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
});
