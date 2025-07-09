'use client';

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from 'react';
import {
  buildThreadFromLeaf,
  findLeafDfsToRightFromMessageId,
} from '@/lib/thread-utils';
import { useTRPC } from '@/trpc/react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatId } from './chat-id-provider';
import type { ChatMessage } from '@/lib/ai/types';
import { chatStore } from '@/lib/stores/chat-store';

interface MessageSiblingInfo {
  siblings: ChatMessage[];
  siblingIndex: number;
}

interface MessageTreeContextType {
  getMessageSiblingInfo: (messageId: string) => MessageSiblingInfo | null;
  navigateToSibling: (messageId: string, direction: 'prev' | 'next') => void;
  getLastMessageId: () => string | null;
  setLastMessageId: (messageId: string | null) => void;
  getParentMessage: (messageId: string) => ChatMessage | null;
}

const MessageTreeContext = createContext<MessageTreeContextType | undefined>(
  undefined,
);

interface MessageTreeProviderProps {
  children: React.ReactNode;
}

export function MessageTreeProvider({ children }: MessageTreeProviderProps) {
  const { chatId, sharedChatId, isShared } = useChatId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const lastMessageIdRef = useRef<string | null>(null);

  // Select the appropriate chat ID based on isShared flag
  const effectiveChatId = isShared ? sharedChatId : chatId;

  // Subscribe to query cache changes for the specific chat messages query
  useEffect(() => {
    if (!effectiveChatId) {
      // New chat
      setAllMessages([]);
      lastMessageIdRef.current = null;
      return;
    }

    const queryKey = isShared
      ? trpc.chat.getPublicChatMessages.queryKey({ chatId: effectiveChatId })
      : trpc.chat.getChatMessages.queryKey({ chatId: effectiveChatId });

    // Get initial data
    const initialData = queryClient.getQueryData<ChatMessage[]>(queryKey);
    if (initialData) {
      console.log('initialData', initialData);
      setAllMessages(initialData);
      // Initialize lastMessageId with the last message of the initial data
      const lastMessage = initialData[initialData.length - 1];
      lastMessageIdRef.current = lastMessage?.id || null;
    }

    // Subscribe to cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Check if this event is for our specific query
      if (event.type === 'updated' && event.query.queryKey) {
        const eventQueryKey = event.query.queryKey;

        // Get current query key to avoid stale closure issues
        const currentQueryKey = isShared
          ? trpc.chat.getPublicChatMessages.queryKey({
              chatId: effectiveChatId,
            })
          : trpc.chat.getChatMessages.queryKey({ chatId: effectiveChatId });

        // Compare query keys (simple deep comparison for this case)
        if (JSON.stringify(eventQueryKey) === JSON.stringify(currentQueryKey)) {
          console.log('event.query.state.data', event.query.state.data);
          const newData = event.query.state.data as ChatMessage[] | undefined;
          if (newData) {
            setAllMessages(newData);
            // Update lastMessageId when data changes
            const lastMessage = newData[newData.length - 1];
            lastMessageIdRef.current = lastMessage?.id || null;
          }
        }
      }
    });

    return unsubscribe;
  }, [
    effectiveChatId,
    isShared,
    trpc.chat.getChatMessages,
    trpc.chat.getPublicChatMessages,
    queryClient,
  ]);

  const getLastMessageId = useCallback(() => {
    return lastMessageIdRef.current;
  }, []);

  const setLastMessageId = useCallback((messageId: string | null) => {
    lastMessageIdRef.current = messageId;
  }, []);

  // Build parent->children mapping once
  const childrenMap = useMemo(() => {
    const map = new Map<string | null, ChatMessage[]>();
    if (!allMessages) return map;
    allMessages.forEach((message) => {
      const parentId = message.metadata?.parentMessageId || null;

      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      const siblings = map.get(parentId);
      if (siblings) {
        siblings.push(message);
      }
    });

    // Sort siblings by createdAt
    map.forEach((siblings) => {
      siblings.sort(
        (a, b) =>
          new Date(a.metadata?.createdAt || new Date()).getTime() -
          new Date(b.metadata?.createdAt || new Date()).getTime(),
      );
    });

    return map;
  }, [allMessages]);

  const getMessageSiblingInfo = useCallback(
    (messageId: string): MessageSiblingInfo | null => {
      if (!allMessages) return null;
      const message = allMessages.find((m) => m.id === messageId);
      if (!message) return null;

      const siblings =
        childrenMap.get(message.metadata?.parentMessageId || null) || [];
      const siblingIndex = siblings.findIndex((s) => s.id === messageId);

      return {
        siblings,
        siblingIndex,
      };
    },
    [allMessages, childrenMap],
  );

  const navigateToSibling = useCallback(
    (messageId: string, direction: 'prev' | 'next') => {
      if (!allMessages || !effectiveChatId) return;
      const siblingInfo = getMessageSiblingInfo(messageId);
      if (!siblingInfo || siblingInfo.siblings.length <= 1) return;

      const { siblings, siblingIndex } = siblingInfo;
      const nextIndex =
        direction === 'next'
          ? (siblingIndex + 1) % siblings.length
          : (siblingIndex - 1 + siblings.length) % siblings.length;

      const targetSibling = siblings[nextIndex];
      const leaf = findLeafDfsToRightFromMessageId(
        childrenMap,
        targetSibling.id,
      );
      const newThread = buildThreadFromLeaf(
        allMessages,
        leaf ? leaf.id : targetSibling.id,
      );

      // Use the chat store directly instead of registered setMessages
      chatStore.getState().setMessages(newThread);
      setLastMessageId(newThread[newThread.length - 1]?.id || null);
    },
    [
      allMessages,
      getMessageSiblingInfo,
      childrenMap,
      effectiveChatId,
      setLastMessageId,
    ],
  );

  const getParentMessage = useCallback(
    (messageId: string): ChatMessage | null => {
      if (!allMessages) return null;
      const message = allMessages.find((m) => m.id === messageId);
      if (!message) return null;

      const parentId = message.metadata?.parentMessageId || null;
      if (!parentId) return null;

      const parentMessage = allMessages.find((m) => m.id === parentId);
      return parentMessage ?? null;
    },
    [allMessages],
  );

  const value = useMemo(
    () => ({
      getMessageSiblingInfo,
      navigateToSibling,
      getLastMessageId,
      setLastMessageId,
      getParentMessage,
    }),
    [
      getMessageSiblingInfo,
      navigateToSibling,
      getLastMessageId,
      setLastMessageId,
      getParentMessage,
    ],
  );

  return (
    <MessageTreeContext.Provider value={value}>
      {children}
    </MessageTreeContext.Provider>
  );
}

export function useMessageTree() {
  const context = useContext(MessageTreeContext);
  if (!context) {
    throw new Error('useMessageTree must be used within MessageTreeProvider');
  }
  return context;
}
