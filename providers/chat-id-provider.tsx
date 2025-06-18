'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router';

interface ChatIdContextType {
  chatId: string | null;
  sharedChatId: string | null;
  setChatId: (chatId: string | null) => void;
}

const ChatIdContext = createContext<ChatIdContextType | undefined>(undefined);

export function ChatIdProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  // Extract chat ID from path: /chat/[id] -> id, / -> null
  const [chatId, setChatId] = useState<string | null>(
    location.pathname.startsWith('/chat/')
      ? location.pathname.split('/')[2] || null
      : null,
  );

  // Extract shared chat ID from path: /share/[id] -> id, otherwise null
  const [sharedChatId, setSharedChatId] = useState<string | null>(
    location.pathname.startsWith('/share/')
      ? location.pathname.split('/')[2] || null
      : null,
  );

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname?.startsWith('/chat/')) {
      setChatId(pathname.split('/')[2] || null);
      setSharedChatId(null);
    } else if (pathname?.startsWith('/share/')) {
      setSharedChatId(pathname.split('/')[2] || null);
      setChatId(null);
    } else {
      setChatId(null);
      setSharedChatId(null);
    }
  }, [location.pathname]);

  const value = useMemo(
    () => ({ chatId, sharedChatId, setChatId }),
    [chatId, sharedChatId, setChatId],
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
