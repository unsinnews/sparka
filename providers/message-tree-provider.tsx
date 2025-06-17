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
import type { YourUIMessage } from '@/lib/types/ui';
import {
  buildThreadFromLeaf,
  findLeafDfsToRightFromMessageId,
} from '@/lib/thread-utils';
import { useTRPC } from '@/trpc/react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatId } from './chat-id-provider';

interface MessageSiblingInfo {
  siblings: YourUIMessage[];
  siblingIndex: number;
}

interface MessageTreeContextType {
  getMessageSiblingInfo: (messageId: string) => MessageSiblingInfo | null;
  navigateToSibling: (messageId: string, direction: 'prev' | 'next') => void;
  registerSetMessages: (
    setMessages: (messages: YourUIMessage[]) => void,
  ) => void;
}

const MessageTreeContext = createContext<MessageTreeContextType | undefined>(
  undefined,
);

export function MessageTreeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { chatId } = useChatId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [allMessages, setAllMessages] = useState<YourUIMessage[]>([]);
  const setMessagesRef = useRef<((messages: YourUIMessage[]) => void) | null>(
    null,
  );

  console.log('Rendering MessageTreeProvider');

  // Subscribe to query cache changes for the specific chat messages query
  useEffect(() => {
    if (!chatId) return;

    const queryKey = trpc.chat.getMessagesByChatId.queryKey({ chatId });

    // Get initial data
    const initialData = queryClient.getQueryData<YourUIMessage[]>(queryKey);
    if (initialData) {
      console.log('initialData', initialData);
      setAllMessages(initialData);
    }

    // Subscribe to cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Check if this event is for our specific query
      if (event.type === 'updated' && event.query.queryKey) {
        const eventQueryKey = event.query.queryKey;
        const ourQueryKey = queryKey;

        // Compare query keys (simple deep comparison for this case)
        if (JSON.stringify(eventQueryKey) === JSON.stringify(ourQueryKey)) {
          console.log('event.query.state.data', event.query.state.data);
          const newData = event.query.state.data as YourUIMessage[] | undefined;
          if (newData) {
            setAllMessages(newData);
          }
        }
      }
    });

    return unsubscribe;
  }, [chatId, trpc.chat.getMessagesByChatId, queryClient]);

  const registerSetMessages = useCallback(
    (setMessages: (messages: YourUIMessage[]) => void) => {
      setMessagesRef.current = setMessages;
    },
    [],
  );

  // Build parent->children mapping once
  const childrenMap = useMemo(() => {
    const map = new Map<string | null, YourUIMessage[]>();
    if (!allMessages) return map;
    allMessages.forEach((message) => {
      const parentId = message.parentMessageId;
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
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });

    return map;
  }, [allMessages]);

  const getMessageSiblingInfo = useCallback(
    (messageId: string): MessageSiblingInfo | null => {
      if (!allMessages) return null;
      const message = allMessages.find((m) => m.id === messageId);
      if (!message) return null;

      const siblings = childrenMap.get(message.parentMessageId) || [];
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
      if (!allMessages || !setMessagesRef.current || !chatId) return;
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
      setMessagesRef.current(newThread);
    },
    [allMessages, getMessageSiblingInfo, childrenMap, chatId],
  );

  const value = useMemo(
    () => ({
      getMessageSiblingInfo,
      navigateToSibling,
      registerSetMessages,
    }),
    [getMessageSiblingInfo, navigateToSibling, registerSetMessages],
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
