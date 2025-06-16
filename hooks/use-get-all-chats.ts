'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useTRPC } from '@/trpc/react';
import type { UIChat } from '@/lib/types/ui';
import { getAnonymousSession } from '@/lib/anonymous-session-client';
import type { AnonymousChat } from '@/lib/types/anonymous';

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
            console.log('parsedChats', parsedChats, session.id);
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
