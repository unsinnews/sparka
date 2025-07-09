import type { AvailableProviderModels } from '../ai/all-models';
import type { ToolNames } from '../ai/types';
import type { DBMessage } from '../db/schema';
import type { UIChat } from './uiChat';

export interface AnonymousSession {
  id: string;
  remainingCredits: number;
  createdAt: Date;
}

// Anonymous chat structure matching the DB chat structure
export interface AnonymousChat extends UIChat {}

// Anonymous message structure matching the DB message structure
export interface AnonymousMessage extends DBMessage {}

export const ANONYMOUS_LIMITS = {
  CREDITS: process.env.NODE_ENV === 'production' ? 10 : 1000,
  AVAILABLE_MODELS: [
    'openai/gpt-3.5-turbo',
    'xai/grok-3-mini-beta',
    'openai/gpt-4o-mini',
  ] as const satisfies readonly AvailableProviderModels[],
  AVAILABLE_TOOLS: ['createDocument', 'updateDocument'] satisfies ToolNames[],
  SESSION_DURATION: 2147483647, // Max session time
  // Rate limiting for anonymous users based on IP
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: process.env.NODE_ENV === 'production' ? 5 : 60,
    REQUESTS_PER_MONTH: process.env.NODE_ENV === 'production' ? 10 : 1000, // Same as MAX_MESSAGES
  },
} as const;
