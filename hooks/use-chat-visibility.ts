'use client';

import { updateChatVisibility } from '@/app/(chat)/actions';
import type { VisibilityType } from '@/components/visibility-selector';
import type { Chat } from '@/lib/db/schema';
import { useMemo } from 'react';
import useSWR from 'swr';
import { useTRPC } from '@/trpc/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string;
  initialVisibility: VisibilityType;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: history } = useQuery(trpc.chat.getAllChats.queryOptions());

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibility,
    },
  );

  const visibilityType = useMemo(() => {
    if (!history) return localVisibility;
    const chat = history.find((chat: Chat) => chat.id === chatId);
    if (!chat) return 'private';
    return chat.visibility;
  }, [history, chatId, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);

    queryClient.setQueryData(
      trpc.chat.getAllChats.queryKey(),
      (oldData: Chat[] | undefined) => {
        return oldData
          ? oldData.map((chat) => {
              if (chat.id === chatId) {
                return {
                  ...chat,
                  visibility: updatedVisibilityType,
                };
              }
              return chat;
            })
          : [];
      },
    );

    updateChatVisibility({
      chatId: chatId,
      visibility: updatedVisibilityType,
    });
  };

  return { visibilityType, setVisibilityType };
}
