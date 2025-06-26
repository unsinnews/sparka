'use client';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  useCallback,
} from 'react';
import { useLocation } from 'react-router';

interface ChatIdContextType {
  chatId: string | null;
  sharedChatId: string | null;
  isShared: boolean;
  setChatId: (chatId: string | null) => void;
}

const ChatIdContext = createContext<ChatIdContextType | undefined>(undefined);

export function ChatIdProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  // Initialize chatId from location, then manage independently
  const [chatId, setChatIdState] = useState<string | null>(() => {
    const pathname = location.pathname;
    if (pathname?.startsWith('/chat/')) {
      return pathname.split('/')[2] || null;
    }
    return null;
  });

  // Parse pathname only for isShared state
  const isShared = useMemo(() => {
    return location.pathname?.startsWith('/share/') ?? false;
  }, [location.pathname]);

  // Extract sharedChatId independently from share URL
  const sharedChatId = useMemo(() => {
    if (location.pathname?.startsWith('/share/')) {
      return location.pathname.split('/')[2] || null;
    }
    return null;
  }, [location.pathname]);

  const setChatId = useCallback((newChatId: string | null) => {
    setChatIdState(newChatId);

    // Handle URL updates internally
    if (newChatId) {
      window.history.replaceState({}, '', `/chat/${newChatId}`);
    } else {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const value = useMemo(
    () => ({
      chatId,
      sharedChatId,
      isShared,
      setChatId,
    }),
    [chatId, sharedChatId, isShared, setChatId],
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
