'use client';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getDefaultThread } from '@/lib/thread-utils';
import { useGetChatById, useMessagesQuery } from '@/hooks/use-chat-store';
import { useMemo, memo, useEffect } from 'react';
import { WithSkeleton } from '@/components/ui/skeleton';
import { notFound } from 'next/navigation';
import { ChatInputProvider } from '@/providers/chat-input-provider';
import { useChatId } from '@/providers/chat-id-provider';
import { chatStore } from '@/lib/stores/chat-store';

// Memoized pure component for Chat and ChatInputProvider
const MemoizedChatWrapper = memo(function MemoizedChatWrapper({
  id,
  initialMessages,
  isReadonly,
}: {
  id: string;
  initialMessages: any[];
  isReadonly: boolean;
}) {
  return (
    <ChatInputProvider localStorageEnabled={true}>
      <Chat
        key={id}
        id={id}
        initialMessages={initialMessages}
        isReadonly={isReadonly}
      />
    </ChatInputProvider>
  );
});

export function ChatPage() {
  const { chatId: id } = useChatId();

  const { data: chat, isLoading: isChatLoading } = useGetChatById(id || '');
  const { data: messages, isLoading: isMessagesLoading } = useMessagesQuery();
  console.log('Rendering chat page', chat, messages);

  // Get messages if chat exists

  const initialThreadMessages = useMemo(() => {
    if (!messages) return [];
    return getDefaultThread(
      messages.map((msg) => ({ ...msg, id: msg.id.toString() })),
    );
  }, [messages]);

  // Set messages in chat store when initialThreadMessages change
  useEffect(() => {
    if (initialThreadMessages.length > 0) {
      chatStore.getState().setMessages(initialThreadMessages);
    }
  }, [initialThreadMessages]);

  if ((!isChatLoading && !chat) || !id) {
    return notFound();
  }

  // Chat exists in DB - handle visibility and permissions
  // Note: In client-side rendering, we don't have server-side session
  // This would need to be adapted based on your auth strategy
  // TODO: Chat sharing should be implemented with other strategy

  if (isMessagesLoading || isChatLoading) {
    return (
      <WithSkeleton
        isLoading={isChatLoading || isMessagesLoading}
        className="w-full h-full"
      >
        <div className="flex h-screen w-full" />
      </WithSkeleton>
    );
  }

  return (
    <>
      <WithSkeleton
        isLoading={isChatLoading || isMessagesLoading}
        className="w-full"
      >
        <MemoizedChatWrapper
          id={id}
          initialMessages={initialThreadMessages}
          isReadonly={false}
        />
      </WithSkeleton>
      <DataStreamHandler id={id} />
    </>
  );
}
