'use client';

import type { VisibilityType } from '@/components/visibility-selector';
import { useMemo, useState } from 'react';
import { useChatStoreContext } from '@/providers/chat-store-provider';
import { useVisibilityContext } from '@/contexts/visibility-context';

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string;
  initialVisibility: VisibilityType;
}) {
  const { createChatVisibility } = useChatStoreContext();
  const { getVisibility, setVisibility } = useVisibilityContext();

  const [localVisibility, setLocalVisibility] = useState(initialVisibility);

  const { getChatVisibility, setChatVisibility } = useMemo(
    () => createChatVisibility(chatId, initialVisibility),
    [createChatVisibility, chatId, initialVisibility],
  );

  const visibilityType = useMemo(() => {
    const contextVisibility = getVisibility(chatId);
    const actualVisibility = getChatVisibility();

    if (contextVisibility !== undefined) {
      return contextVisibility;
    }

    return actualVisibility !== initialVisibility
      ? actualVisibility
      : localVisibility;
  }, [
    getChatVisibility,
    initialVisibility,
    localVisibility,
    getVisibility,
    chatId,
  ]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    if (updatedVisibilityType === visibilityType) {
      return;
    }

    setLocalVisibility(updatedVisibilityType);
    setChatVisibility(updatedVisibilityType);
    setVisibility(chatId, updatedVisibilityType, initialVisibility);
  };

  return { visibilityType, setVisibilityType };
}
