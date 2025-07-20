'use client';

import { generateUUID } from '@/lib/utils';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  useCallback,
} from 'react';
import { useParams, usePathname } from 'next/navigation';

interface ChatIdContextType {
  chatId: string | null;
  sharedChatId: string | null;
  provisionalChatId: string | null;
  isShared: boolean;
  refreshChatID: () => void;
  setChatId: (chatId: string | null) => void;
}

const ChatIdContext = createContext<ChatIdContextType | undefined>(undefined);

export function ChatIdProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams();

  // Use useMemo to derive state from pathname and params
  const { chatId: urlChatId, sharedChatId } = useMemo(() => {
    if (pathname?.startsWith('/chat/')) {
      return {
        chatId: (params?.id as string) || null,
        sharedChatId: null,
      };
    } else if (pathname?.startsWith('/share/')) {
      return {
        chatId: null,
        sharedChatId: (params?.id as string) || null,
      };
    } else {
      return {
        chatId: null,
        sharedChatId: null,
      };
    }
  }, [pathname, params?.id]);

  // State for manual chatId updates (like after replaceState)
  const [manualChatId, setManualChatId] = useState<string | null>(null);

  const [provisionalChatId, setProvisionalChatId] = useState<string | null>(
    () => (urlChatId ? null : generateUUID()),
  );

  // Clear manual override when pathname actually changes through navigation
  useEffect(() => {
    setManualChatId(null);
  }, [pathname]);

  const chatId = manualChatId ?? urlChatId;

  const setChatId = useCallback((id: string | null) => {
    setManualChatId(id);
  }, []);

  const refreshChatID = useCallback(() => {
    setProvisionalChatId(generateUUID());
  }, []);

  const value = useMemo(
    () => ({
      chatId,
      sharedChatId,
      provisionalChatId,
      refreshChatID,
      isShared: sharedChatId !== null,
      setChatId,
    }),
    [chatId, sharedChatId, setChatId, provisionalChatId, refreshChatID],
  );

  return (
    <ChatIdContext.Provider value={value}>{children}</ChatIdContext.Provider>
  );
}

export function useChatId() {
  const context = useContext(ChatIdContext);
  if (context === undefined) {
    throw new Error('useChatId must be used within a ChatIdProvider');
  }
  return context;
}
