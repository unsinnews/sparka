import { z } from 'zod';

const BaseStreamUpdateSchema = z.object({
  title: z.string(),
});

const TaskUpdateSchema = BaseStreamUpdateSchema.extend({
  status: z.enum(['running', 'completed']),
});

const WebSearchSchema = TaskUpdateSchema.extend({
  type: z.literal('web'),
  queries: z.array(z.string()),
  results: z
    .array(
      z.object({
        url: z.string(),
        title: z.string(),
        content: z.string(),
        source: z.enum(['web', 'academic', 'x']),
        // tweetId: z.string().optional(),
      }),
    )
    .optional(),
});

export type WebSearchUpdate = z.infer<typeof WebSearchSchema>;

export type SearchResultItem = NonNullable<WebSearchUpdate['results']>[number];

const ProgressSchema = BaseStreamUpdateSchema.extend({
  type: z.literal('progress'),
  status: z.union([z.literal('completed'), z.literal('started')]),
  timestamp: z.number(),
  completedSteps: z.number().optional(),
  totalSteps: z.number().optional(),
});

export type ProgressUpdate = z.infer<typeof ProgressSchema>;

const ThoughtsSchema = TaskUpdateSchema.extend({
  type: z.literal('thoughts'),
  message: z.string(),
});

export type ThoughtsUpdate = z.infer<typeof ThoughtsSchema>;

export const ResearchUpdateSchema = z.discriminatedUnion('type', [
  WebSearchSchema,
  ProgressSchema,
  ThoughtsSchema,
]);

export type ResearchUpdate = z.infer<typeof ResearchUpdateSchema>;
