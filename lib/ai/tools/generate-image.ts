import { z } from 'zod';
import { tool } from 'ai';
import { experimental_generateImage } from 'ai';
import { getImageModel } from '@/lib/ai/providers';
import { DEFAULT_IMAGE_MODEL } from '@/lib/ai/all-models';
import { uploadFile } from '@/lib/blob';

export const generateImage = tool({
  description: `Generate images from text descriptions.

Usage:
- Create images, artwork, illustrations from descriptive prompts
- Generate visual content based on user requests
- Support various art styles and subjects
- Be as detailed as possible in the description
"`,
  parameters: z.object({
    prompt: z
      .string()
      .describe('Detailed description of the image to generate'),
  }),
  execute: async ({ prompt }) => {
    const { image } = await experimental_generateImage({
      model: getImageModel(DEFAULT_IMAGE_MODEL),
      prompt,
      n: 1,
      providerOptions: {
        experimental_telemetry: { isEnabled: true },
      },
    });

    // Convert base64 to buffer and upload to blob storage
    const buffer = Buffer.from(image.base64, 'base64');
    const timestamp = Date.now();
    const filename = `generated-image-${timestamp}.png`;

    const result = await uploadFile(filename, buffer);

    return {
      imageUrl: result.url,
      prompt,
    };
  },
});
