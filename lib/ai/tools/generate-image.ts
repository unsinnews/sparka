import { z } from 'zod';
import { tool } from 'ai';
import { experimental_generateImage } from 'ai';
import { getImageModel } from '@/lib/ai/providers';
import { DEFAULT_IMAGE_MODEL } from '@/lib/ai/all-models';
import type { Attachment } from 'ai';

interface GenerateImageProps {
  userAttachments?: Array<Attachment>;
}

export const generateImageTool = ({
  userAttachments = [],
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

      // Convert attachments to the format expected by experimental_generateImage
      const referenceImages = imageAttachments.map((attachment) => ({
        url: attachment.url,
      }));

      const { image } = await experimental_generateImage({
        model: getImageModel(DEFAULT_IMAGE_MODEL),
        images: referenceImages,
        prompt,
        n: 1,
        providerOptions: {
          experimental_telemetry: { isEnabled: true },
        },
      });

      return {
        imageBase64: image.base64,
        prompt,
        referencedImages:
          imageAttachments.length > 0
            ? imageAttachments.map((img) => img.name).filter(Boolean)
            : undefined,
      };
    },
  });

// Export the default tool for backward compatibility
export const generateImage = generateImageTool();
