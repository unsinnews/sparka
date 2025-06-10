'use client';

import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCallback, useMemo } from 'react';

import { useTRPC } from '@/trpc/react';
import { useAnonymousChats } from '@/lib/hooks/use-anonymous-chats';
import type { Chat } from '@/lib/db/schema';
import type { UIChat } from '@/lib/types/ui';
import { dbChatToUIChat } from '@/lib/types/ui';
import { generateUUID } from '@/lib/utils';

interface ChatMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface AssistantMessage {
  id: string;
  role: string;
  parts?: any;
  experimental_attachments?: any;
  createdAt?: Date;
  annotations?: any;
}

export function useChatStore() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Anonymous hooks
  const {
    chats: anonymousChats,
    isLoading: isLoadingAnonymous,
    deleteChat: deleteAnonymousChat,
    renameChat: renameAnonymousChat,
    saveChat: saveAnonymousChat,
    generateTitleFromMessage: generateAnonymousTitle,
    isGeneratingTitle,
  } = useAnonymousChats(!isAuthenticated);

  // Memoize the tRPC query options to prevent recreation
  const queryOptions = useMemo(
    () => trpc.chat.getAllChats.queryOptions(),
    [trpc.chat.getAllChats],
  );

  // Memoize the tRPC query key to prevent recreation
  const getAllChatsQueryKey = useMemo(
    () => trpc.chat.getAllChats.queryKey(),
    [trpc.chat.getAllChats],
  );

  // Authenticated query with stable options
  const {
    data: authChats,
    isLoading: isLoadingAuth,
    refetch: refetchAuthChats,
  } = useQuery({
    ...queryOptions,
    enabled: isAuthenticated,
  });

  // Authenticated rename mutation
  const renameMutation = useMutation(
    trpc.chat.renameChat.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: getAllChatsQueryKey,
        });

        const previousChats = queryClient.getQueryData(getAllChatsQueryKey);

        queryClient.setQueryData(
          getAllChatsQueryKey,
          (old: Chat[] | undefined) => {
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
    }),
  );

  // Memoize the unified chat list
  const chats: UIChat[] = useMemo(() => {
    return isAuthenticated
      ? authChats?.map(dbChatToUIChat) || []
      : anonymousChats;
  }, [isAuthenticated, authChats, anonymousChats]);

  // Memoize loading state
  const isLoading = useMemo(() => {
    return isAuthenticated ? isLoadingAuth : isLoadingAnonymous;
  }, [isAuthenticated, isLoadingAuth, isLoadingAnonymous]);

  // Memoized delete function
  const deleteChat = useCallback(
    async (chatId: string, options?: ChatMutationOptions) => {
      try {
        if (isAuthenticated) {
          const response = await fetch(`/api/chat?id=${chatId}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete chat');
          await refetchAuthChats();
        } else {
          deleteAnonymousChat(chatId);
        }
        options?.onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error : new Error('Unknown error');
        options?.onError?.(errorMessage);
        throw errorMessage;
      }
    },
    [isAuthenticated, refetchAuthChats, deleteAnonymousChat],
  );

  // Memoized rename function
  const renameChat = useCallback(
    async (chatId: string, title: string, options?: ChatMutationOptions) => {
      try {
        if (isAuthenticated) {
          await renameMutation.mutateAsync({ chatId, title });
        } else {
          renameAnonymousChat(chatId, title);
        }
        options?.onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error : new Error('Unknown error');
        options?.onError?.(errorMessage);
        throw errorMessage;
      }
    },
    [isAuthenticated, renameMutation, renameAnonymousChat],
  );

  // Memoized save function - remove automatic refetch to prevent excessive calls
  const saveChat = useCallback(
    (chat: UIChat) => {
      if (isAuthenticated) {
        // For authenticated users, chats are automatically saved via API
        // Don't automatically refetch - let the component decide when to refetch
        console.log(
          'Chat saved, but not auto-refetching to prevent excessive calls',
        );
      } else {
        saveAnonymousChat(chat);
      }
    },
    [isAuthenticated, saveAnonymousChat],
  );

  // Memoized invalidate function
  const invalidateChats = useCallback(() => {
    console.log('Invalidating chats!');
    if (isAuthenticated) {
      queryClient.invalidateQueries({
        queryKey: getAllChatsQueryKey,
      });
    }
  }, [isAuthenticated, queryClient, getAllChatsQueryKey]);

  // Combined function for handling assistant message finish
  const onAssistantMessageFinish = useCallback(
    (
      chatId: string,
      message: AssistantMessage,
      saveMessage?: (message: any) => void,
    ) => {
      if (isAuthenticated) {
        // Authenticated user - invalidate chats and credits
        invalidateChats();
        queryClient.invalidateQueries({
          queryKey: trpc.credits.getAvailableCredits.queryKey(),
        });
      } else {
        // Anonymous user - save the assistant message
        if (saveMessage) {
          saveMessage({
            id: message.id,
            chatId,
            role: message.role,
            parts: message.parts || [],
            attachments: message.experimental_attachments || [],
            createdAt: message.createdAt || new Date(),
            annotations: message.annotations || [],
            isPartial: false,
          });
        }
      }
    },
    [
      isAuthenticated,
      invalidateChats,
      queryClient,
      trpc.credits.getAvailableCredits,
    ],
  );

  // Combined function for handling user message submission
  const userMessageSubmit = useCallback(
    (
      chatId: string,
      input: string,
      initialMessagesLength: number,
      messagesLength: number,
      attachments: any[] = [],
      saveMessage?: (message: any) => void,
    ) => {
      if (!isAuthenticated && input.trim()) {
        // Anonymous user - create and save the user message
        const userMessage = {
          id: generateUUID(),
          chatId,
          role: 'user' as const,
          parts: [{ type: 'text' as const, text: input }],
          attachments,
          createdAt: new Date(),
          annotations: [],
          isPartial: false as const,
        };

        if (saveMessage) {
          saveMessage(userMessage);
        }

        // Generate title from first user message if this is a new chat
        const isFirstMessage =
          initialMessagesLength === 0 && messagesLength === 0;
        if (isFirstMessage && generateAnonymousTitle && input.trim()) {
          // Save chat with temporary title first
          saveChat({
            id: chatId,
            title: 'New Chat',
            createdAt: new Date(),
            visibility: 'private',
          } as UIChat);

          // Generate proper title asynchronously
          generateAnonymousTitle(chatId, input.trim());
        }
      }
      // For authenticated users, the API handles message saving and title generation
    },
    [isAuthenticated, generateAnonymousTitle, saveChat],
  );

  // Memoized get chat function
  const getChatFromCache = useCallback(
    (chatId: string): UIChat | undefined => {
      return chats.find((chat) => chat.id === chatId);
    },
    [chats],
  );

  // Memoized update cache function
  const updateChatInCache = useCallback(
    (chatId: string, updates: Partial<UIChat>) => {
      if (isAuthenticated) {
        queryClient.setQueryData(
          getAllChatsQueryKey,
          (oldData: Chat[] | undefined) => {
            return oldData
              ? oldData.map((chat) => {
                  if (chat.id === chatId) {
                    return { ...chat, ...updates };
                  }
                  return chat;
                })
              : [];
          },
        );
      }
    },
    [isAuthenticated, queryClient, getAllChatsQueryKey],
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      chats,
      isLoading,
      isAuthenticated,
      deleteChat,
      renameChat,
      onAssistantMessageFinish,
      userMessageSubmit,
      getChatFromCache,
      updateChatInCache,
      // Expose raw data for components that need it
      rawAuthChats: authChats,
      queryClient,
      trpcQueryKey: getAllChatsQueryKey,
    }),
    [
      chats,
      isLoading,
      isAuthenticated,
      deleteChat,
      renameChat,
      onAssistantMessageFinish,
      userMessageSubmit,
      getChatFromCache,
      updateChatInCache,
      authChats,
      queryClient,
      getAllChatsQueryKey,
    ],
  );
}
