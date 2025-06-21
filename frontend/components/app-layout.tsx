'use client';

import { useSession } from 'next-auth/react';
import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ChatIdProvider } from '@/providers/chat-id-provider';
import { MessageTreeProvider } from '@/providers/message-tree-provider';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/react';
import { useGetAllChats } from '@/hooks/use-chat-store';
import { loadLocalAnonymousMessagesByChatId } from '@/lib/utils/anonymous-chat-storage';
import type { YourUIMessage } from '@/lib/types/ui';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Custom hook to prefetch messages for all chats in history (runs once)
function usePrefetchChatMessages() {
  const { data: chats } = useGetAllChats();
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
              const restoredMessages =
                (await loadLocalAnonymousMessagesByChatId(
                  chatId,
                )) as unknown as YourUIMessage[];
              return restoredMessages;
            } catch (error) {
              console.error('Error loading anonymous messages:', error);
              return [] as YourUIMessage[];
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

export function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();

  // Prefetch messages for all chats in the background (runs once)
  usePrefetchChatMessages();

  return (
    <>
      <ChatIdProvider>
        <MessageTreeProvider>
          <AppSidebar user={session?.user} />
          <SidebarInset>{children}</SidebarInset>
        </MessageTreeProvider>
      </ChatIdProvider>
    </>
  );
}
