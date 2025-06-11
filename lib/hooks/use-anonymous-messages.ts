'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AnonymousMessage } from '@/lib/types/anonymous';
import { getAnonymousSession } from '@/lib/anonymous-session-client';

const ANONYMOUS_MESSAGES_KEY = 'anonymous-messages';

// Global state to store all messages once loaded
let allMessagesCache: AnonymousMessage[] | null = null;
let isLoadingCache = false;

export function useAnonymousMessagesStorage() {
  const [allMessages, setAllMessages] = useState<AnonymousMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all messages from localStorage once
  useEffect(() => {
    const loadAllMessages = () => {
      if (allMessagesCache !== null) {
        // Use cached data
        setAllMessages(allMessagesCache);
        setIsLoading(false);
        return;
      }

      if (isLoadingCache) {
        // Another instance is already loading
        return;
      }

      isLoadingCache = true;

      try {
        const session = getAnonymousSession();
        if (!session) {
          allMessagesCache = [];
          setAllMessages([]);
          setIsLoading(false);
          isLoadingCache = false;
          return;
        }

        const savedMessages = localStorage.getItem(ANONYMOUS_MESSAGES_KEY);
        if (savedMessages) {
          const parsedMessages = JSON.parse(
            savedMessages,
          ) as AnonymousMessage[];
          // Convert dates for all messages
          const messagesWithDates = parsedMessages.map((message) => ({
            ...message,
            createdAt: new Date(message.createdAt),
          }));

          allMessagesCache = messagesWithDates;
          setAllMessages(messagesWithDates);
        } else {
          allMessagesCache = [];
          setAllMessages([]);
        }
      } catch (error) {
        console.error('Error loading anonymous messages:', error);
        allMessagesCache = [];
        setAllMessages([]);
      } finally {
        setIsLoading(false);
        isLoadingCache = false;
      }
    };

    loadAllMessages();
  }, []);

  const saveMessage = useCallback((message: AnonymousMessage) => {
    setAllMessages((prev: AnonymousMessage[]) => {
      const updated = [
        ...prev.filter((m: AnonymousMessage) => m.id !== message.id),
        message,
      ];

      // Update cache
      allMessagesCache = updated;

      // Save to localStorage
      try {
        localStorage.setItem(ANONYMOUS_MESSAGES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving anonymous message:', error);
      }

      return updated;
    });
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setAllMessages((prev: AnonymousMessage[]) => {
      const updated = prev.filter((m: AnonymousMessage) => m.id !== messageId);

      // Update cache
      allMessagesCache = updated;

      // Save to localStorage
      try {
        localStorage.setItem(ANONYMOUS_MESSAGES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error deleting anonymous message:', error);
      }

      return updated;
    });
  }, []);

  const deleteTrailingMessages = useCallback((messageId: string) => {
    setAllMessages((prev: AnonymousMessage[]) => {
      // Find the message with the given ID
      const targetMessage = prev.find(
        (m: AnonymousMessage) => m.id === messageId,
      );
      if (!targetMessage) {
        console.warn('Target message not found for deleteTrailingMessages');
        return prev;
      }

      // Get all messages for the same chat, sorted by creation time
      const chatMessages = prev
        .filter((m: AnonymousMessage) => m.chatId === targetMessage.chatId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Find the index of the target message in the sorted chat messages
      const targetIndex = chatMessages.findIndex((m) => m.id === messageId);

      if (targetIndex === -1) {
        console.warn('Target message not found in chat messages');
        return prev;
      }

      // Get messages to keep: all messages from other chats + messages up to and including the target message
      const messagesToKeep = chatMessages.slice(0, targetIndex + 1);
      const messageIdsToKeep = new Set(messagesToKeep.map((m) => m.id));

      // Filter to keep messages from other chats and messages up to the target message
      const updated = prev.filter((m: AnonymousMessage) => {
        if (m.chatId !== targetMessage.chatId) {
          return true; // Keep messages from other chats
        }
        return messageIdsToKeep.has(m.id); // Keep only messages up to and including target
      });

      // Update cache
      allMessagesCache = updated;

      // Save to localStorage
      try {
        localStorage.setItem(ANONYMOUS_MESSAGES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error deleting anonymous trailing messages:', error);
      }

      return updated;
    });
  }, []);

  const getMessagesForChat = useCallback(
    (chatId: string): AnonymousMessage[] => {
      return allMessages
        .filter((message) => message.chatId === chatId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },
    [allMessages],
  );

  const deleteAnonymousMessagesForChat = useCallback((chatId: string) => {
    setAllMessages((prev: AnonymousMessage[]) => {
      const updated = prev.filter((m: AnonymousMessage) => m.chatId !== chatId);
      return updated;
    });
  }, []);

  return {
    allMessages,
    isLoading,
    saveMessage,
    deleteMessage,
    deleteTrailingMessages,
    getMessagesForChat,
    deleteMessagesForChat: deleteAnonymousMessagesForChat,
  };
}
