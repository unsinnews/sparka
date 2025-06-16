// Unified UI types that abstract away storage implementation details

import type { Attachment, UIMessage } from 'ai';
import type { MessageAnnotation, YourUIMessage } from '../ai/tools/annotations';
import type { DBMessage } from '../db/schema';

export interface UIChat {
  id: string;
  createdAt: Date;
  title: string;
  visibility: 'private' | 'public';
}

// Helper functions for type conversion
export function dbChatToUIChat(chat: {
  id: string;
  createdAt: Date;
  title: string;
  visibility: 'private' | 'public';
}): UIChat {
  return {
    id: chat.id,
    createdAt: chat.createdAt,
    title: chat.title,
    visibility: chat.visibility,
  };
}

export function dbMessageToUIMessage(message: DBMessage): YourUIMessage {
  return {
    id: message.id,
    parts: message.parts as UIMessage['parts'],
    role: message.role as UIMessage['role'],
    // Note: content will soon be deprecated in @ai-sdk/react
    content: '',
    createdAt: message.createdAt,
    experimental_attachments: (message.attachments as Array<Attachment>) ?? [],
    annotations: message.annotations as MessageAnnotation[],
    isPartial: message.isPartial,
  };
}
