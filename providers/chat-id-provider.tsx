'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useLocation } from 'react-router';

interface ChatIdContextType {
  chatId: string | null;
}

const ChatIdContext = createContext<ChatIdContextType | undefined>(undefined);

export function ChatIdProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  // Extract chat ID from path: /chat/[id] -> id, / -> null
  const chatId = location.pathname.startsWith('/chat/')
    ? location.pathname.split('/')[2] || null
    : null;

  return (
    <ChatIdContext.Provider value={{ chatId }}>
      {children}
    </ChatIdContext.Provider>
  );
}

export function useChatId() {
  const context = useContext(ChatIdContext);
  if (context === undefined) {
    throw new Error('useChatId must be used within a ChatIdProvider');
  }
  return context;
}
