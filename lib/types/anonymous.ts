import type { YourToolName } from '../ai/tools/tools';
import type { AvailableProviderModels } from '../ai/all-models';

export interface AnonymousSession {
  id: string;
  messageCount: number;
  createdAt: Date;
  maxMessages: number;
}

// Anonymous chat structure matching the DB chat structure
export interface AnonymousChat {
  id: string;
  createdAt: Date;
  title: string;
  sessionId: string;
  visibility: 'private' | 'public';
}

// Anonymous message structure matching the DB message structure
export interface AnonymousMessage {
  id: string;
  chatId: string;
  role: string;
  parts: any;
  attachments: any;
  createdAt: Date;
  annotations?: any;
  isPartial: boolean;
}

export const ANONYMOUS_LIMITS = {
  MAX_MESSAGES: 10,
  AVAILABLE_MODELS: [
    'openai/gpt-3.5-turbo',
    'xai/grok-3-mini-beta',
    'openai/gpt-4o-mini',
  ] as const satisfies readonly AvailableProviderModels[],
  AVAILABLE_TOOLS: [] as YourToolName[],
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;
