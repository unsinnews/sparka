// Unified UI types that abstract away storage implementation details

import type { Attachment, Message } from 'ai';
import type { UIChat, YourUIMessage } from '@/lib/types/ui';
import type { DBMessage } from '@/lib/db/schema';

// Helper functions for type conversion
export function dbChatToUIChat(chat: {
  id: string;
  createdAt: Date;
  title: string;
  visibility: 'private' | 'public';
  userId: string;
  isPinned: boolean;
}): UIChat {
  return {
    id: chat.id,
    createdAt: chat.createdAt,
    title: chat.title,
    visibility: chat.visibility,
    userId: chat.userId,
    isPinned: chat.isPinned,
  };
}

export function dbMessageToUIMessage(message: DBMessage): YourUIMessage {
  return {
    id: message.id,
    parts: message.parts as YourUIMessage['parts'],
    role: message.role as YourUIMessage['role'],
    // Note: content will soon be deprecated in @ai-sdk/react
    content: '',
    createdAt: message.createdAt,
    experimental_attachments: (message.attachments as Array<Attachment>) ?? [],
    annotations: message.annotations as YourUIMessage['annotations'],
    isPartial: message.isPartial,
    parentMessageId: message.parentMessageId,
  };
}

export function messageToYourUIMessage(
  message: Message,
  parentMessageId: string | null,
  isPartial: boolean,
): YourUIMessage {
  return {
    id: message.id,
    parts: message.parts as YourUIMessage['parts'],
    role: message.role as YourUIMessage['role'],
    // Note: content will soon be deprecated in @ai-sdk/react
    content: '',
    createdAt: message.createdAt || new Date(),
    experimental_attachments: message.experimental_attachments ?? [],
    annotations: message.annotations as YourUIMessage['annotations'],
    parentMessageId: parentMessageId,
    isPartial: isPartial,
  };
}

export function messageToDbMessage(
  message: Message,
  chatId: string,
  parentMessageId: string | null,
  isPartial: boolean,
): DBMessage {
  return {
    id: message.id,
    chatId: chatId,
    role: message.role,
    parts: message.parts,
    attachments: message.experimental_attachments || [],
    createdAt: message.createdAt || new Date(),
    annotations: message.annotations || [],
    isPartial: isPartial,
    parentMessageId: parentMessageId,
  };
}
