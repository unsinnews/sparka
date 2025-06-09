'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AnonymousChat, AnonymousMessage } from '@/lib/types/anonymous';
import type { UIChat } from '@/lib/types/ui';
import { getAnonymousSession } from '@/lib/anonymous-session-client';
import { useTRPC } from '@/trpc/react';
import { useMutation } from '@tanstack/react-query';

const ANONYMOUS_CHATS_KEY = 'anonymous-chats';
const ANONYMOUS_MESSAGES_KEY = 'anonymous-messages';

export function useAnonymousChats(enabled = true) {
  const [chats, setChats] = useState<UIChat[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const trpc = useTRPC();

  // Title generation mutation
  const generateTitleMutation = useMutation(
    trpc.chat.generateTitle.mutationOptions({
      onError: (error) => {
        console.error('Failed to generate title:', error);
      },
    }),
  );

  // Load chats from localStorage on mount
  useEffect(() => {
    if (!enabled) {
      setChats([]);
      setIsLoading(false);
      return;
    }

    const loadChats = () => {
      try {
        const session = getAnonymousSession();
        if (!session) {
          setChats([]);
          setIsLoading(false);
          return;
        }

        const savedChats = localStorage.getItem(ANONYMOUS_CHATS_KEY);
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats) as AnonymousChat[];
          // Filter chats for current session and convert to UIChat format
          const sessionChats = parsedChats
            .filter((chat) => chat.sessionId === session.id)
            .map(
              (chat) =>
                ({
                  id: chat.id,
                  createdAt: new Date(chat.createdAt),
                  title: chat.title,
                  visibility: chat.visibility,
                }) as UIChat,
            )
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          setChats(sessionChats);
        }
      } catch (error) {
        console.error('Error loading anonymous chats:', error);
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, [enabled]);

  const saveChat = useCallback(
    (chat: UIChat) => {
      if (!enabled) return;

      const session = getAnonymousSession();
      if (!session) return;

      // Convert UIChat to AnonymousChat for storage
      const storageChat: AnonymousChat = {
        ...chat,
        sessionId: session.id,
      };

      setChats((prev) => {
        const updated = [chat, ...prev.filter((c) => c.id !== chat.id)];

        // Save to localStorage
        try {
          const existingChats = JSON.parse(
            localStorage.getItem(ANONYMOUS_CHATS_KEY) || '[]',
          );
          const otherSessionChats = existingChats.filter(
            (c: AnonymousChat) => c.sessionId !== session.id,
          );
          const currentSessionStorageChats = updated.map((uiChat) => ({
            ...uiChat,
            sessionId: session.id,
          }));
          const allChats = [
            ...otherSessionChats,
            ...currentSessionStorageChats,
          ];
          localStorage.setItem(ANONYMOUS_CHATS_KEY, JSON.stringify(allChats));
        } catch (error) {
          console.error('Error saving anonymous chat:', error);
        }

        return updated;
      });
    },
    [enabled],
  );

  const deleteChat = useCallback(
    (chatId: string) => {
      if (!enabled) return;

      const session = getAnonymousSession();
      if (!session) return;

      setChats((prev) => {
        const updated = prev.filter((c) => c.id !== chatId);

        // Save to localStorage
        try {
          const existingChats = JSON.parse(
            localStorage.getItem(ANONYMOUS_CHATS_KEY) || '[]',
          );
          const otherSessionChats = existingChats.filter(
            (c: AnonymousChat) => c.sessionId !== session.id,
          );
          const currentSessionStorageChats = updated.map((uiChat) => ({
            ...uiChat,
            sessionId: session.id,
          }));
          const allChats = [
            ...otherSessionChats,
            ...currentSessionStorageChats,
          ];
          localStorage.setItem(ANONYMOUS_CHATS_KEY, JSON.stringify(allChats));

          // Also delete messages for this chat
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
        } catch (error) {
          console.error('Error deleting anonymous chat:', error);
        }

        return updated;
      });
    },
    [enabled],
  );

  const renameChat = useCallback(
    (chatId: string, title: string) => {
      if (!enabled) return;

      const session = getAnonymousSession();
      if (!session) return;

      setChats((prev) => {
        const updated = prev.map((c) =>
          c.id === chatId ? { ...c, title } : c,
        );

        // Save to localStorage
        try {
          const existingChats = JSON.parse(
            localStorage.getItem(ANONYMOUS_CHATS_KEY) || '[]',
          );
          const otherSessionChats = existingChats.filter(
            (c: AnonymousChat) => c.sessionId !== session.id,
          );
          const currentSessionStorageChats = updated.map((uiChat) => ({
            ...uiChat,
            sessionId: session.id,
          }));
          const allChats = [
            ...otherSessionChats,
            ...currentSessionStorageChats,
          ];
          localStorage.setItem(ANONYMOUS_CHATS_KEY, JSON.stringify(allChats));
        } catch (error) {
          console.error('Error renaming anonymous chat:', error);
        }

        return updated;
      });
    },
    [enabled],
  );

  // Generate title from first user message
  const generateTitleFromMessage = useCallback(
    async (chatId: string, userMessage: string) => {
      if (!enabled) return;

      try {
        const result = await generateTitleMutation.mutateAsync({
          message: userMessage,
        });

        if (result?.title) {
          // Update the chat with the generated title
          renameChat(chatId, result.title);
        }
      } catch (error) {
        console.error('Failed to generate and save title:', error);
        // Fallback to truncated message as title
        const fallbackTitle =
          userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
        renameChat(chatId, fallbackTitle);
      }
    },
    [enabled, generateTitleMutation, renameChat],
  );

  return {
    chats,
    isLoading,
    saveChat,
    deleteChat,
    renameChat,
    generateTitleFromMessage,
    isGeneratingTitle: generateTitleMutation.isPending,
  };
}
