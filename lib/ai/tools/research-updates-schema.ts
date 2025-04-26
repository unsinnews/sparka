import { z } from 'zod';

const BaseStreamUpdateSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  message: z.string(),
  title: z.string().optional(),
  overwrite: z.boolean().optional(),
});

const TaskUpdateSchema = BaseStreamUpdateSchema.extend({
  status: z.enum(['running', 'completed']),
});

const BaseSearchSchema = TaskUpdateSchema.extend({
  query: z.string(),
  subqueries: z.array(z.string()).optional(),
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

export const WebSearchSchema = BaseSearchSchema.extend({
  type: z.literal('web'),
});
export type WebSearchUpdate = z.infer<typeof WebSearchSchema>;

export type SearchResultItem = NonNullable<WebSearchUpdate['results']>[number];

const ProgressSchema = BaseStreamUpdateSchema.extend({
  type: z.literal('progress'),
  status: z.union([z.literal('completed'), z.literal('started')]),
  completedSteps: z.number().optional(),
  totalSteps: z.number().optional(),
  isComplete: z.boolean().optional(),
});

export type ProgressUpdate = z.infer<typeof ProgressSchema>;

const ThoughtItemSchema = z.object({
  header: z.string(),
  body: z.string(),
});

const ThoughtsSchema = TaskUpdateSchema.extend({
  type: z.literal('thoughts'),
  thoughtItems: z.array(ThoughtItemSchema),
});

export type ThoughtsUpdate = z.infer<typeof ThoughtsSchema>;

export const StreamUpdateSchema = z.discriminatedUnion('type', [
  WebSearchSchema,
  ProgressSchema,
  ThoughtsSchema,
]);

export type StreamUpdate = z.infer<typeof StreamUpdateSchema>;

export const ResearchUpdateSchema = z.object({
  type: z.enum(['research_update']),
  data: StreamUpdateSchema,
});
