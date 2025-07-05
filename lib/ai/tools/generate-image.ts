import { z } from 'zod';
import { tool, experimental_generateImage } from 'ai';
import { getImageModel } from '@/lib/ai/providers';
import { DEFAULT_IMAGE_MODEL } from '@/lib/ai/all-models';
import type { Attachment } from 'ai';
import OpenAI, { toFile } from 'openai';
import { uploadFile } from '@/lib/blob';

interface GenerateImageProps {
  userAttachments?: Array<Attachment>;
  lastGeneratedImage?: { imageUrl: string; name: string } | null;
}

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateImageTool = ({
  userAttachments = [],
  lastGeneratedImage = null,
}: GenerateImageProps = {}) =>
  tool({
    description: `Generate images from text descriptions. Can optionally use attached images as reference.

Usage:
- Create images, artwork, illustrations from descriptive prompts
- Generate visual content based on user requests
- Support various art styles and subjects
- Be as detailed as possible in the description
- Use attached images as visual reference when available`,
    parameters: z.object({
      prompt: z
        .string()
        .describe(
          'Detailed description of the image to generate. Include style, composition, colors, mood, and any other relevant details.',
        ),
    }),
    execute: async ({ prompt }) => {
      // Filter only image attachments for reference
      const imageAttachments = userAttachments.filter((attachment) =>
        attachment.contentType?.startsWith('image/'),
      );

      const hasLastGeneratedImage = lastGeneratedImage !== null;
      const isEdit = imageAttachments.length > 0 || hasLastGeneratedImage;
      console.log('CAlling generateImageTool with isEdit', isEdit);
      if (isEdit) {
        console.log(
          'Using OpenAI edit mode with images:',
          `lastGenerated: ${hasLastGeneratedImage ? 1 : 0}, attachments: ${imageAttachments.length}`,
        );

        // Convert attachments and lastGeneratedImage to the format expected by OpenAI
        const inputImages = [];

        // Add lastGeneratedImage first if it exists
        if (lastGeneratedImage) {
          const response = await fetch(lastGeneratedImage.imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const lastGenImage = await toFile(buffer, lastGeneratedImage.name, {
            type: 'image/png',
          });
          inputImages.push(lastGenImage);
        }

        // Add user attachments
        const attachmentImages = await Promise.all(
          imageAttachments.map(async (attachment) => {
            const response = await fetch(attachment.url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Use toFile to create the proper format for OpenAI
            return await toFile(buffer, attachment.name || 'image.png', {
              type: attachment.contentType || 'image/png',
            });
          }),
        );

        inputImages.push(...attachmentImages);

        const rsp = await openaiClient.images.edit({
          model: 'gpt-image-1',
          image: inputImages, // Pass all images to OpenAI
          prompt,
        });

        // Convert base64 to buffer and upload to blob storage
        const buffer = Buffer.from(rsp.data?.[0]?.b64_json || '', 'base64');
        const timestamp = Date.now();
        const filename = `generated-image-${timestamp}.png`;

        const result = await uploadFile(filename, buffer);

        return {
          imageUrl: result.url,
          prompt,
        };
      }

      // Non-edit case: use experimental_generateImage
      const res = await experimental_generateImage({
        model: getImageModel(DEFAULT_IMAGE_MODEL),
        prompt,
        n: 1,
        providerOptions: {
          telemetry: { isEnabled: true },
        },
      });

      console.log('res', res);

      // Convert base64 to buffer and upload to blob storage
      const buffer = Buffer.from(res.images[0].base64, 'base64');
      const timestamp = Date.now();
      const filename = `generated-image-${timestamp}.png`;

      const result = await uploadFile(filename, buffer);

      return {
        imageUrl: result.url,
        prompt,
      };
    },
  });
