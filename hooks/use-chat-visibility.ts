'use client';

import type { VisibilityType } from '@/components/visibility-selector';
import { useMemo } from 'react';
import useSWR from 'swr';
import { useChatStoreContext } from '@/providers/chat-store-provider';

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string;
  initialVisibility: VisibilityType;
}) {
  const { createChatVisibility } = useChatStoreContext();

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibility,
    },
  );

  const { getChatVisibility, setChatVisibility } = useMemo(
    () => createChatVisibility(chatId, initialVisibility),
    [createChatVisibility, chatId, initialVisibility],
  );

  const visibilityType = useMemo(() => {
    const actualVisibility = getChatVisibility();
    return actualVisibility !== initialVisibility
      ? actualVisibility
      : localVisibility;
  }, [getChatVisibility, initialVisibility, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);
    setChatVisibility(updatedVisibilityType);
  };

  return { visibilityType, setVisibilityType };
}
