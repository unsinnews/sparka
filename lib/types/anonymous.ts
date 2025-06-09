import type { YourToolName } from '../ai/tools/tools';

export interface AnonymousSession {
  id: string;
  messageCount: number;
  createdAt: Date;
  maxMessages: number;
}

export const ANONYMOUS_LIMITS = {
  MAX_MESSAGES: 10,
  AVAILABLE_MODELS: [
    'openai/gpt-3.5-turbo',
    'xai/grok-3-mini-beta',
    'openai/gpt-4o-mini',
  ],
  AVAILABLE_TOOLS: [] as YourToolName[],
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;
