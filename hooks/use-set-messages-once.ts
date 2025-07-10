import { useEffect, useRef } from 'react';
import { chatStore } from '@/lib/stores/chat-store';
import type { ChatMessage } from '@/lib/ai/types';

export function useSetMessagesOnce(
  initialThreadMessages: ChatMessage[],
  id: string,
) {
  const hasSetMessagesRef = useRef(false);
  const currentIdRef = useRef<string>();

  // Reset ref when id changes
  if (currentIdRef.current !== id) {
    hasSetMessagesRef.current = false;
    currentIdRef.current = id;
  }

  useEffect(() => {
    if (initialThreadMessages.length > 0 && !hasSetMessagesRef.current) {
      chatStore.getState().setMessages(initialThreadMessages);
      hasSetMessagesRef.current = true;
    }
  }, [initialThreadMessages]);
}
