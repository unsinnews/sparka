'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useParams } from 'next/navigation';

interface ChatIdContextType {
  chatId: string | null;
}

const ChatIdContext = createContext<ChatIdContextType | undefined>(undefined);

export function ChatIdProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const chatId = (params?.id as string) || null;

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
