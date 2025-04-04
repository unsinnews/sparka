import { z } from 'zod';

const BaseStreamUpdateSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  message: z.string(),
  title: z.string().optional(),
  overwrite: z.boolean().optional(),
});
const PlanSchema = BaseStreamUpdateSchema.extend({
  type: z.literal('plan'),
  status: z.enum(['running', 'completed']),
  plan: z
    .object({
      search_queries: z.array(
        z.object({
          query: z.string(),
          rationale: z.string(),
          source: z.enum(['web', 'academic', 'both', 'x', 'all']),
          priority: z.number(),
        }),
      ),
      required_analyses: z.array(
        z.object({
          type: z.string(),
          description: z.string(),
          importance: z.number(),
        }),
      ),
    })
    .optional(),
  totalSteps: z.number().optional(),
});

export type PlanUpdate = z.infer<typeof PlanSchema>;

const BaseSearchSchema = BaseStreamUpdateSchema.extend({
  status: z.enum(['running', 'completed']),
  query: z.string(),
  results: z
    .array(
      z.object({
        url: z.string(),
        title: z.string(),
        content: z.string(),
        source: z.enum(['web', 'academic', 'x']),
        tweetId: z.string().optional(),
      }),
    )
    .optional(),
});

export const WebSearchSchema = BaseSearchSchema.extend({
  type: z.literal('web'),
});
export type WebSearchUpdate = z.infer<typeof WebSearchSchema>;

export const AcademicSearchSchema = BaseSearchSchema.extend({
  type: z.literal('academic'),
});
export type AcademicSearchUpdate = z.infer<typeof AcademicSearchSchema>;

export const XSearchSchema = BaseSearchSchema.extend({
  type: z.literal('x'),
});
export type XSearchUpdate = z.infer<typeof XSearchSchema>;
const AnalysisSchema = BaseStreamUpdateSchema.extend({
  type: z.literal('analysis'),
  status: z.enum(['running', 'completed']),
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
  status: z.literal('completed'),
  completedSteps: z.number(),
  totalSteps: z.number(),
  isComplete: z.boolean(),
});

export type ProgressUpdate = z.infer<typeof ProgressSchema>;

export const StreamUpdateSchema = z.discriminatedUnion('type', [
  PlanSchema,
  WebSearchSchema,
  AcademicSearchSchema,
  XSearchSchema,
  AnalysisSchema,
  ProgressSchema,
]);

export type StreamUpdate = z.infer<typeof StreamUpdateSchema>;

export const ResearchUpdateSchema = z.object({
  type: z.enum(['research_update']),
  data: StreamUpdateSchema,
});
