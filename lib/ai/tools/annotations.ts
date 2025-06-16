import { z } from 'zod';
import { ResearchUpdateSchema } from './research-updates-schema';
import { QueryCompletionSchema } from './web-search';

export const MessageAnnotationSchema = z.discriminatedUnion('type', [
  ResearchUpdateSchema,
  QueryCompletionSchema, // TODO: Remove this
]);

export type MessageAnnotation = z.infer<typeof MessageAnnotationSchema>;
