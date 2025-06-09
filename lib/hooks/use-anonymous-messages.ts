'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AnonymousMessage } from '@/lib/types/anonymous';
import { getAnonymousSession } from '@/lib/anonymous-session-client';

const ANONYMOUS_MESSAGES_KEY = 'anonymous-messages';

// Global state to store all messages once loaded
let allMessagesCache: AnonymousMessage[] | null = null;
let isLoadingCache = false;

export function useAnonymousMessages(chatId: string) {
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

  // Filter messages for current chat
  const messages = useMemo(() => {
    return allMessages
      .filter((message) => message.chatId === chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [allMessages, chatId]);

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

  return {
    messages,
    isLoading,
    saveMessage,
    deleteMessage,
  };
}
