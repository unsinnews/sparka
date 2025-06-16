'use client';

import { createContext, useContext, type ReactNode, useMemo } from 'react';
import type { YourUIMessage } from '@/lib/ai/tools/annotations';

interface ActiveThreadContextType {
  messages: YourUIMessage[];
  isLoadingMessages: boolean;
}

const ActiveThreadContext = createContext<ActiveThreadContextType | undefined>(
  undefined,
);

export function ActiveThreadProvider({ children }: { children: ReactNode }) {
  const fetchedMessages: YourUIMessage[] = [];
  const isLoadingMessages = false;
  //   const { chatId } = useChatId();
  //   console.log('chatId', chatId);

  const contextValue = useMemo(
    () => ({
      messages: fetchedMessages || [],
      isLoadingMessages,
    }),
    [fetchedMessages, isLoadingMessages],
  );

  return (
    <ActiveThreadContext.Provider value={contextValue}>
      {children}
    </ActiveThreadContext.Provider>
  );
}

export function useActiveThread() {
  const context = useContext(ActiveThreadContext);
  if (context === undefined) {
    throw new Error(
      'useActiveThread must be used within an ActiveThreadProvider',
    );
  }
  return context;
}
