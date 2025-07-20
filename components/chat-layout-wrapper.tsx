'use client';

import type { User } from 'next-auth';
import { useSession } from 'next-auth/react';
import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ChatIdProvider } from '@/providers/chat-id-provider';
import { MessageTreeProvider } from '@/providers/message-tree-provider';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/react';
import { useGetAllChats } from '@/hooks/chat-sync-hooks';
import { loadLocalAnonymousMessagesByChatId } from '@/lib/utils/anonymous-chat-storage';
import { dbMessageToChatMessage } from '@/lib/message-conversion';

interface ChatLayoutWrapperProps {
  children: React.ReactNode;
  user: User | undefined;
}

// Custom hook to prefetch messages for all chats in history (runs once)
function usePrefetchChatMessages() {
  const { data: chats } = useGetAllChats(10);
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Only run once and only if we have chats
    if (hasPrefetched.current || !chats?.length) return;

    console.log(
      'Prefetching chat messages for',
      isAuthenticated ? 'authenticated' : 'anonymous',
      'user',
    );
    hasPrefetched.current = true;

    // Prefetch messages for each chat in the background
    const prefetchPromises = chats.map(async (chat) => {
      const chatId = chat.id;

      if (isAuthenticated) {
        // Use tRPC query options for authenticated users
        const queryOptions = trpc.chat.getChatMessages.queryOptions({
          chatId,
        });

        return queryClient.prefetchQuery(queryOptions);
      } else {
        // Use localStorage query for anonymous users
        const queryKey = trpc.chat.getChatMessages.queryKey({ chatId });

        return queryClient.prefetchQuery({
          queryKey,
          queryFn: async () => {
            try {
              const restoredMessages = (
                await loadLocalAnonymousMessagesByChatId(chatId)
              ).map(dbMessageToChatMessage);
              return restoredMessages;
            } catch (error) {
              console.error('Error loading anonymous messages:', error);
              return [];
            }
          },
          staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        });
      }
    });

    // Execute all prefetch operations in parallel
    Promise.allSettled(prefetchPromises)
      .then(() => {
        console.log(
          `Successfully prefetched messages for ${chats.length} chats`,
        );
      })
      .catch((error) => {
        console.error('Error prefetching chat messages:', error);
      });
  }, [chats, isAuthenticated, queryClient, trpc.chat.getChatMessages]);
}

export function ChatLayoutWrapper({ children, user }: ChatLayoutWrapperProps) {
  // Prefetch messages for all chats in the background (runs once)
  usePrefetchChatMessages();

  return (
    <ChatIdProvider>
      <MessageTreeProvider>
        <AppSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </MessageTreeProvider>
    </ChatIdProvider>
  );
}
