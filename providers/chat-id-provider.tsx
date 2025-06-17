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

  useEffect(() => {
    if (location.pathname) {
      setChatId(location.pathname.split('/')[2] || null);
    } else {
      setChatId(null);
    }
  }, [location.pathname]);

  const value = useMemo(() => ({ chatId, setChatId }), [chatId, setChatId]);

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
