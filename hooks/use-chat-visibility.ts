'use client';

import { updateChatVisibility } from '@/app/(chat)/actions';
import type { VisibilityType } from '@/components/visibility-selector';
import { useMemo } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useChatStoreContext } from '@/providers/chat-store-provider';
import type { Chat } from '@/lib/db/schema';

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string;
  initialVisibility: VisibilityType;
}) {
  const { data: session } = useSession();
  const { rawAuthChats, updateChatInCache } = useChatStoreContext();

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibility,
    },
  );

  const visibilityType = useMemo(() => {
    if (!rawAuthChats) return localVisibility;
    const chat = rawAuthChats.find((chat: Chat) => chat.id === chatId);
    if (!chat) return 'private';
    return chat.visibility;
  }, [rawAuthChats, chatId, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);

    updateChatInCache(chatId, { visibility: updatedVisibilityType });

    updateChatVisibility({
      chatId: chatId,
      visibility: updatedVisibilityType,
    });
  };

  return { visibilityType, setVisibilityType };
}
