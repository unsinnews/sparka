'use client';

import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCallback, useMemo } from 'react';

import { useTRPC } from '@/trpc/react';
import { useAnonymousChats } from '@/lib/hooks/use-anonymous-chats';
import { useAnonymousMessagesStorage } from '@/lib/hooks/use-anonymous-messages';
import type { Chat } from '@/lib/db/schema';
import type { UIChat } from '@/lib/types/ui';
import { dbChatToUIChat } from '@/lib/types/ui';
import { generateUUID } from '@/lib/utils';
import { updateChatVisibility } from '@/app/(chat)/actions';
import type { VisibilityType } from '@/components/visibility-selector';

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

  // Anonymous messages hook (only used for anonymous users)
  const {
    isLoading: isLoadingAnonymousMessages,
    saveMessage: saveAnonymousMessage,
    deleteMessage: deleteAnonymousMessage,
    deleteTrailingMessages: deleteAnonymousTrailingMessages,
    getMessagesForChat: getAnonymousMessagesForChat,
    deleteMessagesForChat: deleteAnonymousMessagesForChat,
  } = useAnonymousMessagesStorage();

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

  // Credits query
  const { data: creditsData, isLoading: isLoadingCredits } = useQuery({
    ...trpc.credits.getAvailableCredits.queryOptions(),
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

  // Delete trailing messages mutation
  const deleteTrailingMessagesMutation = useMutation(
    trpc.chat.deleteTrailingMessages.mutationOptions({
      onSuccess: () => {
        // Invalidate chats to refresh the UI
        queryClient.invalidateQueries({
          queryKey: getAllChatsQueryKey,
        });
      },
      onError: (err) => {
        toast.error('Failed to delete messages');
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
    return isAuthenticated
      ? isLoadingAuth
      : isLoadingAnonymous || isLoadingAnonymousMessages;
  }, [
    isAuthenticated,
    isLoadingAuth,
    isLoadingAnonymous,
    isLoadingAnonymousMessages,
  ]);

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
          deleteAnonymousMessagesForChat(chatId);
        }
        options?.onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error : new Error('Unknown error');
        options?.onError?.(errorMessage);
        throw errorMessage;
      }
    },
    [
      isAuthenticated,
      refetchAuthChats,
      deleteAnonymousChat,
      deleteAnonymousMessagesForChat,
    ],
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
    (chatId: string, message: AssistantMessage) => {
      if (isAuthenticated) {
        // Authenticated user - invalidate chats and credits
        invalidateChats();
        queryClient.invalidateQueries({
          queryKey: trpc.credits.getAvailableCredits.queryKey(),
        });
      } else {
        // Anonymous user - save the assistant message
        saveAnonymousMessage({
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
    },
    [
      isAuthenticated,
      invalidateChats,
      queryClient,
      trpc.credits.getAvailableCredits,
      saveAnonymousMessage,
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

        saveAnonymousMessage(userMessage);

        // Generate title from first user message if this is a new chat
        const isFirstMessage =
          initialMessagesLength === 0 && messagesLength === 0;
        if (isFirstMessage && generateAnonymousTitle && input.trim()) {
          // Save chat with temporary title first
          saveChat({
            id: chatId,
            title: 'Untitled',
            createdAt: new Date(),
            visibility: 'private',
          } as UIChat);

          // Generate proper title asynchronously
          generateAnonymousTitle(chatId, input.trim());
        }
      }
      // For authenticated users, the API handles message saving and title generation
    },
    [isAuthenticated, generateAnonymousTitle, saveChat, saveAnonymousMessage],
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

  // Chat visibility management
  const createChatVisibility = useCallback(
    (chatId: string, initialVisibility: VisibilityType) => {
      const getChatVisibility = () => {
        if (!authChats) return initialVisibility;
        const chat = authChats.find((chat: Chat) => chat.id === chatId);
        if (!chat) return 'private';
        return chat.visibility;
      };

      const setChatVisibility = (updatedVisibilityType: VisibilityType) => {
        updateChatInCache(chatId, { visibility: updatedVisibilityType });
        updateChatVisibility({
          chatId: chatId,
          visibility: updatedVisibilityType,
        });
      };

      return { getChatVisibility, setChatVisibility };
    },
    [authChats, updateChatInCache],
  );

  // Memoized delete trailing messages function
  const deleteTrailingMessages = useCallback(
    async (messageId: string, options?: ChatMutationOptions) => {
      try {
        if (isAuthenticated) {
          await deleteTrailingMessagesMutation.mutateAsync({ messageId });
        } else {
          deleteAnonymousTrailingMessages(messageId);
        }
        options?.onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error : new Error('Unknown error');
        options?.onError?.(errorMessage);
        throw errorMessage;
      }
    },
    [
      isAuthenticated,
      deleteTrailingMessagesMutation,
      deleteAnonymousTrailingMessages,
    ],
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      chats,
      isLoading,
      deleteChat,
      renameChat,
      deleteTrailingMessages,
      onAssistantMessageFinish,
      userMessageSubmit,
      createChatVisibility,
      credits: creditsData?.totalCredits,
      isLoadingCredits,
      getMessagesForChat: getAnonymousMessagesForChat,
    }),
    [
      chats,
      isLoading,
      deleteChat,
      renameChat,
      deleteTrailingMessages,
      onAssistantMessageFinish,
      userMessageSubmit,
      createChatVisibility,
      creditsData?.totalCredits,
      isLoadingCredits,
      getAnonymousMessagesForChat,
    ],
  );
}
