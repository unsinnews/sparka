import { z } from 'zod';
import {
  ResearchPlanSchema,
  SearchStepSchema,
  AnalysisStepSchema,
  GapAnalysisSchema,
  FinalSynthesisSchema,
  ResearchProgressSchema,
} from './reason-search';
import { QueryCompletionSchema } from './web-search';
import type { UIMessage } from 'ai';

export const MessageAnnotationSchema = z.discriminatedUnion('type', [
  ResearchPlanSchema,
  SearchStepSchema,
  AnalysisStepSchema,
  GapAnalysisSchema,
  FinalSynthesisSchema,
  ResearchProgressSchema,
  QueryCompletionSchema,
]);

export type MessageAnnotation = z.infer<typeof MessageAnnotationSchema>;

export type YourUIMessage = Omit<UIMessage, 'annotations'> & {
  annotations: MessageAnnotation[];
};
