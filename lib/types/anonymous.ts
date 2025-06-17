import type { YourToolName } from '../ai/tools/tools';
import type { AvailableProviderModels } from '../ai/all-models';
import type { DBMessage } from '../db/schema';
import type { UIChat } from './ui';

export interface AnonymousSession {
  id: string;
  messageCount: number;
  createdAt: Date;
  maxMessages: number;
}

// Anonymous chat structure matching the DB chat structure
export interface AnonymousChat extends UIChat {}

// Anonymous message structure matching the DB message structure
export interface AnonymousMessage extends DBMessage {}

export const ANONYMOUS_LIMITS = {
  MAX_MESSAGES: process.env.NODE_ENV === 'production' ? 10 : 1000,
  AVAILABLE_MODELS: [
    'openai/gpt-3.5-turbo',
    'xai/grok-3-mini-beta',
    'openai/gpt-4o-mini',
  ] as const satisfies readonly AvailableProviderModels[],
  AVAILABLE_TOOLS: [] as YourToolName[],
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  // Rate limiting for anonymous users based on IP
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: process.env.NODE_ENV === 'production' ? 5 : 60,
    REQUESTS_PER_MONTH: process.env.NODE_ENV === 'production' ? 10 : 1000, // Same as MAX_MESSAGES
    WINDOW_SIZE_MINUTE: 60, // seconds
    WINDOW_SIZE_MONTH: 30 * 24 * 60 * 60, // 30 days in seconds
  },
} as const;
