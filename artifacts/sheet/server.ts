import { DEFAULT_ARTIFACT_MODEL } from '@/lib/ai/all-models';
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { getLanguageModel } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { streamObject } from 'ai';
import { z } from 'zod';

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title, description, dataStream, prompt }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: getLanguageModel(DEFAULT_ARTIFACT_MODEL),
      system: sheetPrompt,
      experimental_telemetry: { isEnabled: true },
      prompt,
      schema: z.object({
        csv: z.string().describe('CSV data'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { csv } = object;

        if (csv) {
          dataStream.writeData({
            type: 'sheet-delta',
            content: csv,
          });

          draftContent = csv;
        }
      }
    }

    dataStream.writeData({
      type: 'sheet-delta',
      content: draftContent,
    });

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: getLanguageModel(DEFAULT_ARTIFACT_MODEL),
      system: updateDocumentPrompt(document.content, 'sheet'),
      experimental_telemetry: { isEnabled: true },
      prompt: description,
      schema: z.object({
        csv: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { csv } = object;

        if (csv) {
          dataStream.writeData({
            type: 'sheet-delta',
            content: csv,
          });

          draftContent = csv;
        }
      }
    }

    return draftContent;
  },
});
