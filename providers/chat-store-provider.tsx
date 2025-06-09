'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useChatStore } from '@/hooks/use-chat-store';

// Create the context with the return type of useChatStore
const ChatStoreContext = createContext<ReturnType<typeof useChatStore> | null>(
  null,
);

interface ChatStoreProviderProps {
  children: ReactNode;
}

export function ChatStoreProvider({ children }: ChatStoreProviderProps) {
  const chatStore = useChatStore();

  return (
    <ChatStoreContext.Provider value={chatStore}>
      {children}
    </ChatStoreContext.Provider>
  );
}

export function useChatStoreContext() {
  const context = useContext(ChatStoreContext);
  if (!context) {
    throw new Error(
      'useChatStoreContext must be used within a ChatStoreProvider',
    );
  }
  return context;
}
