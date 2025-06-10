'use client';

import type { VisibilityType } from '@/components/visibility-selector';
import { useMemo } from 'react';
import useSWR from 'swr';
import { useChatStoreContext } from '@/providers/chat-store-provider';
import { toast } from 'sonner';

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
    if (updatedVisibilityType === visibilityType) {
      return;
    }

    setLocalVisibility(updatedVisibilityType);
    setChatVisibility(updatedVisibilityType);

    const message =
      updatedVisibilityType === 'public'
        ? 'Chat is now public - anyone with the link can access it'
        : 'Chat is now private - only you can access it';

    toast.success(message);
  };

  return { visibilityType, setVisibilityType };
}
