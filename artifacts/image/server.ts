import { getImageModel } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { experimental_generateImage } from 'ai';

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title, description, dataStream, prompt }) => {
    let draftContent = '';

    const { image } = await experimental_generateImage({
      model: getImageModel('alias/image-model'),
      prompt,
      n: 1,
      providerOptions: {
        experimental_telemetry: { isEnabled: true },
      },
    });

    draftContent = image.base64;

    dataStream.writeData({
      type: 'image-delta',
      content: image.base64,
    });

    return draftContent;
  },
  onUpdateDocument: async ({ description, dataStream }) => {
    let draftContent = '';

    const { image } = await experimental_generateImage({
      model: getImageModel('alias/image-model'),
      prompt: description,
      n: 1,
      providerOptions: {
        experimental_telemetry: { isEnabled: true },
      },
    });

    draftContent = image.base64;

    dataStream.writeData({
      type: 'image-delta',
      content: image.base64,
    });

    return draftContent;
  },
});
