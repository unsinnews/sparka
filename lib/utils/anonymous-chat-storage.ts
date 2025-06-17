import type { AnonymousChat, AnonymousMessage } from '@/lib/types/anonymous';
import { getAnonymousSession } from '@/lib/anonymous-session-client';
import { generateUUID } from '../utils';

const ANONYMOUS_CHATS_KEY = 'anonymous-chats';
const ANONYMOUS_MESSAGES_KEY = 'anonymous-messages';

export async function loadAnonymousMessagesFromStorage(): Promise<
  AnonymousMessage[]
> {
  try {
    const session = getAnonymousSession();
    if (!session) {
      return [];
    }

    const savedMessages = localStorage.getItem(ANONYMOUS_MESSAGES_KEY);
    if (!savedMessages) {
      return [];
    }

    const parsedMessages = JSON.parse(savedMessages) as AnonymousMessage[];
    // Convert dates for all messages
    const messagesWithDates = parsedMessages.map((message) => ({
      ...message,
      createdAt: new Date(message.createdAt),
    }));

    return messagesWithDates;
  } catch (error) {
    console.error('Error loading anonymous messages:', error);
    return [];
  }
}

export async function deleteAnonymousChat(chatId: string): Promise<boolean> {
  try {
    const session = getAnonymousSession();
    if (!session) return false;

    // Remove chat from localStorage
    const existingChats = JSON.parse(
      localStorage.getItem(ANONYMOUS_CHATS_KEY) || '[]',
    );
    const filteredChats = existingChats.filter(
      (c: AnonymousChat) => !(c.id === chatId && c.userId === session.id),
    );
    localStorage.setItem(ANONYMOUS_CHATS_KEY, JSON.stringify(filteredChats));

    // Remove messages for this chat
    const existingMessages = JSON.parse(
      localStorage.getItem(ANONYMOUS_MESSAGES_KEY) || '[]',
    );
    const filteredMessages = existingMessages.filter(
      (m: AnonymousMessage) => m.chatId !== chatId,
    );
    localStorage.setItem(
      ANONYMOUS_MESSAGES_KEY,
      JSON.stringify(filteredMessages),
    );

    return true;
  } catch (error) {
    console.error('Error deleting anonymous chat:', error);
    return false;
  }
}

export async function renameAnonymousChat(
  chatId: string,
  title: string,
): Promise<void> {
  try {
    const session = getAnonymousSession();
    if (!session) return;

    // Update chat in localStorage
    const existingChats = JSON.parse(
      localStorage.getItem(ANONYMOUS_CHATS_KEY) || '[]',
    );
    const updatedChats = existingChats.map((c: AnonymousChat) =>
      c.id === chatId && c.userId === session.id ? { ...c, title } : c,
    );
    localStorage.setItem(ANONYMOUS_CHATS_KEY, JSON.stringify(updatedChats));
  } catch (error) {
    console.error('Error renaming anonymous chat:', error);
  }
} // Module-level functions for chat operations
export async function saveAnonymousChatToStorage(
  chat: Omit<AnonymousChat, 'userId'>,
): Promise<void> {
  try {
    const session = getAnonymousSession();
    if (!session) throw new Error('No anonymous session');

    const savedChats = localStorage.getItem('anonymous-chats');
    const chats = savedChats ? JSON.parse(savedChats) : [];

    const chatToSave = {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt.toISOString(),
      visibility: chat.visibility,
      userId: session.id,
    };

    const existingIndex = chats.findIndex(
      (c: AnonymousChat) => c.id === chat.id,
    );
    if (existingIndex >= 0) {
      chats[existingIndex] = chatToSave;
    } else {
      chats.push(chatToSave);
    }

    localStorage.setItem('anonymous-chats', JSON.stringify(chats));
  } catch (error) {
    console.error('Error saving anonymous chat:', error);
    throw error;
  }
}
export async function deleteAnonymousTrailingMessages(
  messageId: string,
): Promise<void> {
  try {
    const session = getAnonymousSession();
    if (!session) {
      throw new Error('No anonymous session found');
    }

    const allMessages = await loadAnonymousMessagesFromStorage();

    console.log('Found ', allMessages);
    // Find the message with the given ID
    const targetMessage = allMessages.find(
      (m: AnonymousMessage) => m.id === messageId,
    );
    if (!targetMessage) {
      console.warn(
        'Target message not found for deleteAnonymousTrailingMessages',
      );
      return;
    }

    // Get all messages for the same chat, sorted by creation time
    const chatMessages = allMessages
      .filter((m: AnonymousMessage) => m.chatId === targetMessage.chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Find the index of the target message in the sorted chat messages
    const targetIndex = chatMessages.findIndex((m) => m.id === messageId);

    if (targetIndex === -1) {
      console.warn('Target message not found in chat messages');
      return;
    }

    // Get messages to keep: all messages from other chats + messages up to and NOT including the target message
    const messagesToKeep = chatMessages.slice(0, targetIndex);
    const messageIdsToKeep = new Set(messagesToKeep.map((m) => m.id));

    // Filter to keep messages from other chats and messages up to the target message
    const updated = allMessages.filter((m: AnonymousMessage) => {
      if (m.chatId !== targetMessage.chatId) {
        return true; // Keep messages from other chats
      }
      return messageIdsToKeep.has(m.id); // Keep only messages up to and including target
    });

    // Update cache and save to localStorage
    localStorage.setItem(ANONYMOUS_MESSAGES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error deleting anonymous trailing messages:', error);
    throw error;
  }
}
export async function saveAnonymousMessage(
  message: AnonymousMessage,
): Promise<void> {
  try {
    const session = getAnonymousSession();
    if (!session) {
      throw new Error('No anonymous session found');
    }

    const allMessages = await loadAnonymousMessagesFromStorage();
    allMessages.push(message);

    localStorage.setItem(ANONYMOUS_MESSAGES_KEY, JSON.stringify(allMessages));
  } catch (error) {
    console.error('Error saving anonymous message:', error);
    throw error;
  }
}
export async function loadLocalAnonymousMessagesByChatId(
  chatId: string,
): Promise<AnonymousMessage[]> {
  const messages = await loadAnonymousMessagesFromStorage();
  return messages
    .filter((message) => message.chatId === chatId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function copyAnonymousChat(
  sourceChatId: string,
  newChatId: string,
): Promise<void> {
  try {
    const session = getAnonymousSession();
    if (!session) {
      throw new Error('No anonymous session found');
    }

    // Load all messages from the source chat
    const sourceMessages =
      await loadLocalAnonymousMessagesByChatId(sourceChatId);

    if (sourceMessages.length === 0) {
      throw new Error('Source chat has no messages to copy');
    }

    // Create new messages with the new chat ID
    const copiedMessages = sourceMessages.map((message) => ({
      ...message,
      id: generateUUID(),
      chatId: newChatId,
      createdAt: new Date(),
    }));

    // Save all copied messages
    const allMessages = await loadAnonymousMessagesFromStorage();
    const updatedMessages = [...allMessages, ...copiedMessages];
    localStorage.setItem(
      ANONYMOUS_MESSAGES_KEY,
      JSON.stringify(updatedMessages),
    );

    // Create a new chat entry
    const firstMessage = sourceMessages[0];
    const firstMessageContent =
      Array.isArray(firstMessage.parts) && firstMessage.parts.length > 0
        ? (firstMessage.parts[0] as any)?.text || 'New Chat'
        : 'New Chat';
    const newChat = {
      id: newChatId,
      title: `Copy of ${firstMessageContent.substring(0, 50)}...`,
      createdAt: new Date(),
      visibility: 'private' as const,
    };

    await saveAnonymousChatToStorage(newChat);
  } catch (error) {
    console.error('Error copying anonymous chat:', error);
    throw error;
  }
}
