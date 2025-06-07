import { z } from 'zod';
import { ResearchUpdateSchema } from './research-updates-schema';
import { QueryCompletionSchema } from './web-search';
import type { UIMessage } from 'ai';

export const MessageAnnotationSchema = z.discriminatedUnion('type', [
  ResearchUpdateSchema,
  QueryCompletionSchema, // TODO: Remove this
]);

export type MessageAnnotation = z.infer<typeof MessageAnnotationSchema>;

export type YourUIMessage = Omit<UIMessage, 'annotations'> & {
  annotations?: MessageAnnotation[];
  isPartial?: boolean;
};
