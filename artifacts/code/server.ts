import { z } from 'zod';
import { streamObject } from 'ai';
import { getLanguageModel } from '@/lib/ai/providers';
import { codePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { DEFAULT_ARTIFACT_MODEL } from '@/lib/ai/all-models';

export const codeDocumentHandler = createDocumentHandler<'code'>({
  kind: 'code',
  onCreateDocument: async ({ title, description, dataStream, prompt }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: getLanguageModel(DEFAULT_ARTIFACT_MODEL),
      system: codePrompt,
      prompt,
      experimental_telemetry: { isEnabled: true },
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { code } = object;

        if (code) {
          dataStream.writeData({
            type: 'code-delta',
            content: code ?? '',
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: getLanguageModel(DEFAULT_ARTIFACT_MODEL),
      system: updateDocumentPrompt(document.content, 'code'),
      experimental_telemetry: { isEnabled: true },
      prompt: description,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { code } = object;

        if (code) {
          dataStream.writeData({
            type: 'code-delta',
            content: code ?? '',
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
});
