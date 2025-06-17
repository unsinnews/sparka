'use client';

// Hooks that are used to mutate the chat store
// They use local storage functions from '@/lib/utils/anonymous-chat-storage' for anonymous users
// They use tRPC mutations for authenticated users

import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCallback, useMemo } from 'react';

import { useTRPC } from '@/trpc/react';
import {
  messageToDbMessage,
  messageToYourUIMessage,
} from '@/lib/message-conversion';
import { useChatId } from '@/providers/chat-id-provider';
import type { YourUIMessage, UIChat } from '@/lib/types/ui';
import {
  loadLocalAnonymousMessagesByChatId,
  saveAnonymousMessage,
  deleteAnonymousChat,
  renameAnonymousChat,
  saveAnonymousChatToStorage,
  deleteAnonymousTrailingMessages,
} from '@/lib/utils/anonymous-chat-storage';
import type { Message } from 'ai';
import { getAnonymousSession } from '@/lib/anonymous-session-client';
import type { AnonymousChat } from '@/lib/types/anonymous';

// Custom hook for chat mutations
export function useSaveChat() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const generateTitleMutation = useMutation(
    trpc.chat.generateTitle.mutationOptions({
      onError: (error) => {
        console.error('Failed to generate title:', error);
      },
    }),
  );

  const saveChatMutation = useMutation({
    mutationFn: async ({
      chatId,
      message,
    }: { chatId: string; message: string }) => {
      // Save chat with temporary title first
      const tempChat = {
        id: chatId,
        title: 'Untitled',
        createdAt: new Date(),
        visibility: 'private' as const,
      };

      await saveAnonymousChatToStorage(tempChat);
      return { tempChat, message };
    },
    onSuccess: async ({ tempChat, message }) => {
      // Generate proper title asynchronously after successful save
      const data = await generateTitleMutation.mutateAsync({ message });
      if (data?.title) {
        // Update the chat with the generated title
        await saveAnonymousChatToStorage({
          ...tempChat,
          title: data.title,
        });

        // Invalidate chats to refresh the UI
        queryClient.invalidateQueries({
          queryKey: trpc.chat.getAllChats.queryKey(),
        });
      }
    },
    onError: (error) => {
      console.error('Failed to save chat:', error);
      toast.error('Failed to save chat');
    },
  });

  const saveChat = useCallback(
    (chatId: string, message: string, isAuthenticated: boolean) => {
      // Skip if authenticated (API handles it)
      if (isAuthenticated) {
        return;
      }

      return saveChatMutation.mutate({ chatId, message });
    },
    [saveChatMutation],
  );

  return {
    saveChat,
    isSaving: saveChatMutation.isPending,
    isGeneratingTitle: generateTitleMutation.isPending,
  };
}

export function useMessagesQuery() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const trpc = useTRPC();
  const { chatId } = useChatId();

  // Memoize the tRPC query options for messages by chat ID
  const getMessagesByChatIdQueryOptions = useMemo(() => {
    const options = trpc.chat.getMessagesByChatId.queryOptions({
      chatId: chatId || '',
    });
    if (isAuthenticated) {
      return {
        ...options,
        enabled: !!chatId,
      };
    } else {
      return {
        queryKey: options.queryKey, // Include chatId in query key for proper caching
        queryFn: async () => {
          // Load from localStorage for anonymous users
          try {
            // TODO: Replace with the actual function
            const restoredMessages = (await loadLocalAnonymousMessagesByChatId(
              chatId || '',
            )) as unknown as YourUIMessage[];
            return restoredMessages;
          } catch (error) {
            console.error('Error loading anonymous messages:', error);
            return [] as YourUIMessage[];
          }
        },
        enabled: !!chatId,
      };
    }
  }, [trpc.chat.getMessagesByChatId, isAuthenticated, chatId]);

  // Query for messages by chat ID (only when chatId is available)
  return useQuery(getMessagesByChatIdQueryOptions);
}

interface ChatMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
// Custom hook for deleting chats
export function useDeleteChat() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const getAllChatsQueryKey = useMemo(
    () => trpc.chat.getAllChats.queryKey(),
    [trpc.chat.getAllChats],
  );

  const deleteChat = useCallback(
    async (chatId: string, options?: ChatMutationOptions) => {
      try {
        if (isAuthenticated) {
          const response = await fetch(`/api/chat?id=${chatId}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete chat');
        } else {
          await deleteAnonymousChat(chatId);
        }
        options?.onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error : new Error('Unknown error');
        options?.onError?.(errorMessage);
        throw errorMessage;
      } finally {
        queryClient.invalidateQueries({
          queryKey: getAllChatsQueryKey,
        });
      }
    },
    [isAuthenticated, queryClient, getAllChatsQueryKey],
  );

  return { deleteChat };
}

// Custom hook for renaming chats
export function useRenameChat() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const getAllChatsQueryKey = useMemo(
    () => trpc.chat.getAllChats.queryKey(),
    [trpc.chat.getAllChats],
  );

  const renameMutation = useMutation({
    mutationFn: isAuthenticated
      ? trpc.chat.renameChat.mutationOptions().mutationFn
      : async ({ chatId, title }: { chatId: string; title: string }) => {
          await renameAnonymousChat(chatId, title);
        },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: getAllChatsQueryKey,
      });

      const previousChats = queryClient.getQueryData(getAllChatsQueryKey);

      queryClient.setQueryData(
        getAllChatsQueryKey,
        (old: UIChat[] | undefined) => {
          if (!old) return old;
          return old.map((c) =>
            c.id === variables.chatId ? { ...c, title: variables.title } : c,
          );
        },
      );

      return { previousChats };
    },
    onError: (err, variables, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(getAllChatsQueryKey, context.previousChats);
      }
      toast.error('Failed to rename chat');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getAllChatsQueryKey,
      });
    },
  });

  return renameMutation;
}

// Custom hook for deleting trailing messages
export function useDeleteTrailingMessages() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteTrailingMutationOptions = useMemo(
    () => trpc.chat.deleteTrailingMessages.mutationOptions(),
    [trpc.chat.deleteTrailingMessages],
  );

  const invalidateMessagesByChatId = useCallback(
    (chatId: string) => {
      queryClient.invalidateQueries({
        queryKey: trpc.chat.getMessagesByChatId.queryKey({ chatId }),
      });
    },
    [queryClient, trpc.chat.getMessagesByChatId],
  );

  // Delete trailing messages mutation
  const deleteTrailingMessagesMutation = useMutation({
    mutationFn: isAuthenticated
      ? async ({ messageId, chatId }: { messageId: string; chatId: string }) =>
          await deleteTrailingMutationOptions?.mutationFn?.({
            messageId,
          })
      : async ({
          messageId,
          chatId,
        }: { messageId: string; chatId: string }) => {
          await deleteAnonymousTrailingMessages(messageId);
        },
    onMutate: async (variables) => {
      const { messageId, chatId } = variables;
      const messagesQueryKey = trpc.chat.getMessagesByChatId.queryKey({
        chatId,
      });

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: messagesQueryKey });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(messagesQueryKey);

      // Optimistically update cache - keep only messages before the messageId
      queryClient.setQueryData(
        messagesQueryKey,
        (old: YourUIMessage[] | undefined) => {
          if (!old) return old;
          const messageIndex = old.findIndex((msg) => msg.id === messageId);
          if (messageIndex === -1) return old;
          return old.slice(0, messageIndex);
        },
      );

      return { previousMessages, messagesQueryKey };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          context.messagesQueryKey,
          context.previousMessages,
        );
      }
      toast.error('Failed to delete messages');
    },
    onSuccess: (_, variables) => {
      invalidateMessagesByChatId(variables.chatId);
      toast.success('Messages deleted');
    },
  });

  return deleteTrailingMessagesMutation;
}

export function useSaveMessageMutation() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { saveChat: saveChatWithTitle } = useSaveChat();

  return useMutation({
    mutationFn: async ({
      message,
      chatId,
      parentMessageId,
    }: {
      message: Message;
      chatId: string;
      parentMessageId: string | null;
    }) => {
      if (!isAuthenticated) {
        // Save message for anonymous users when completed (not partial)

        await saveAnonymousMessage(
          messageToDbMessage(message, chatId, parentMessageId, false),
        );
      }
      // For authenticated users, the API handles saving
    },
    onMutate: async ({ message, chatId, parentMessageId }) => {
      // Get the query key for messages
      const messagesQueryKey = trpc.chat.getMessagesByChatId.queryKey({
        chatId: chatId,
      });

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: messagesQueryKey });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(messagesQueryKey);

      // Optimistically update cache
      queryClient.setQueryData(
        messagesQueryKey,
        (old: YourUIMessage[] | undefined) => {
          const newMessage = messageToYourUIMessage(
            message,
            parentMessageId,
            false,
          );
          if (!old) return [newMessage];
          return [...old, newMessage];
        },
      );

      return { previousMessages, messagesQueryKey };
    },
    onError: (err, message, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          context.messagesQueryKey,
          context.previousMessages,
        );
      }
      console.error('Failed to save message:', err);
      toast.error('Failed to save message');
    },
    onSuccess: (data, { message, chatId }) => {
      if (isAuthenticated) {
        // Update credits
        queryClient.invalidateQueries({
          queryKey: trpc.credits.getAvailableCredits.queryKey(),
        });

        // Invalidate chats (for chat title)
        queryClient.invalidateQueries({
          queryKey: trpc.chat.getAllChats.queryKey(),
        });
      } else {
        // Check if this this the fist message in the cache
        const messagesQueryKey = trpc.chat.getMessagesByChatId.queryKey({
          chatId: chatId,
        });
        const messages = queryClient.getQueryData(messagesQueryKey);
        if (messages?.length === 1) {
          saveChatWithTitle(chatId, message.content, isAuthenticated);
        }
      }
    },
  });
}

export function useSetVisibility() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const getAllChatsQueryKey = useMemo(
    () => trpc.chat.getAllChats.queryKey(),
    [trpc.chat.getAllChats],
  );

  return useMutation({
    mutationFn: isAuthenticated
      ? trpc.chat.setVisibility.mutationOptions().mutationFn
      : async ({
          chatId,
          visibility,
        }: { chatId: string; visibility: 'private' | 'public' }) => {
          throw new Error('Not implemented');
        },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: getAllChatsQueryKey,
      });

      const previousChats = queryClient.getQueryData(getAllChatsQueryKey);

      queryClient.setQueryData(
        getAllChatsQueryKey,
        (old: UIChat[] | undefined) => {
          if (!old) return old;
          return old.map((c) =>
            c.id === variables.chatId
              ? { ...c, visibility: variables.visibility }
              : c,
          );
        },
      );

      return { previousChats };
    },
    onError: (err, variables, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(getAllChatsQueryKey, context.previousChats);
      }
      toast.error('Failed to update chat visibility');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getAllChatsQueryKey,
      });
    },
    onSuccess: (_, variables) => {
      const message =
        variables.visibility === 'public'
          ? 'Chat is now public - anyone with the link can access it'
          : 'Chat is now private - only you can access it';

      toast.success(message);
    },
  });
}
export function useGetAllChats() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const trpc = useTRPC();

  // Memoize the tRPC query options to prevent recreation
  const getAllChatsQueryOptions = useMemo(() => {
    const options = trpc.chat.getAllChats.queryOptions();
    if (isAuthenticated) {
      return {
        ...options,
        select: (data: UIChat[]) => data.slice(0, 10),
      };
    } else {
      return {
        queryKey: options.queryKey,
        select: (data: UIChat[]) => data.slice(0, 10),
        queryFn: async () => {
          // Load from localStorage for anonymous users
          try {
            const session = getAnonymousSession();
            if (!session) return [];

            const savedChats = localStorage.getItem('anonymous-chats');
            if (!savedChats) return [];

            const parsedChats = JSON.parse(savedChats) as AnonymousChat[];
            return parsedChats
              .filter((chat: any) => chat.userId === session.id)
              .map((chat: any) => ({
                id: chat.id,
                createdAt: new Date(chat.createdAt),
                title: chat.title,
                visibility: chat.visibility,
                userId: '',
              }))
              .sort(
                (a: any, b: any) =>
                  b.createdAt.getTime() - a.createdAt.getTime(),
              );
          } catch (error) {
            console.error('Error loading anonymous chats:', error);
            return [];
          }
        },
      };
    }
  }, [trpc.chat.getAllChats, isAuthenticated]);

  // Combined query for both authenticated and anonymous chats
  return useQuery(getAllChatsQueryOptions);
}
