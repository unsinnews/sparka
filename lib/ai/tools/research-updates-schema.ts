import { z } from 'zod';

// There are 2 entities:
// 1. Task
// 2. Tool Action
// Task can contain multiple Tool Actions, also explanations, etc.
// Tool Action is a single action that can be completed by a tool

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

const AnalysisSchema = TaskUpdateSchema.extend({
  type: z.literal('analysis'),
  advancedSteps: z.number().optional(),
  analysisType: z.string(),
  completedSteps: z.number().optional(),
  totalSteps: z.number().optional(),
  isComplete: z.boolean().optional(),
  findings: z
    .array(
      z.object({
        insight: z.string(),
        evidence: z.array(z.string()),
        confidence: z.number(),
      }),
    )
    .optional(),
  gaps: z
    .array(
      z.object({
        topic: z.string(),
        reason: z.string(),
        additional_queries: z.array(z.string()),
      }),
    )
    .optional(),
  recommendations: z
    .array(
      z.object({
        action: z.string(),
        rationale: z.string(),
        priority: z.number(),
      }),
    )
    .optional(),
  uncertainties: z.array(z.string()).optional(),
});

export type AnalysisUpdate = z.infer<typeof AnalysisSchema>;

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
  // PlanSchema,
  WebSearchSchema,
  // AcademicSearchSchema,
  // XSearchSchema,
  AnalysisSchema,
  ProgressSchema,
  ThoughtsSchema,
]);

export type StreamUpdate = z.infer<typeof StreamUpdateSchema>;

export const ResearchUpdateSchema = z.object({
  type: z.enum(['research_update']),
  data: StreamUpdateSchema,
});
