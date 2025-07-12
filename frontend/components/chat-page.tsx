'use client';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getDefaultThread } from '@/lib/thread-utils';
import { useGetChatById, useMessagesQuery } from '@/hooks/chat-sync-hooks';
import { useMemo, memo } from 'react';
import { WithSkeleton } from '@/components/ui/skeleton';
import { notFound } from 'next/navigation';
import { ChatInputProvider } from '@/providers/chat-input-provider';
import { useChatId } from '@/providers/chat-id-provider';

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
  const {
    data: messages,
    isLoading: isMessagesLoading,
    isRefetching: isMessagesRefetching,
  } = useMessagesQuery();
  console.log('Rendering chat page', chat, messages);

  // Get messages if chat exists

  const initialThreadMessages = useMemo(() => {
    if (!messages) return [];
    return getDefaultThread(
      messages.map((msg) => ({ ...msg, id: msg.id.toString() })),
    );
  }, [messages]);

  if ((!isChatLoading && !chat) || !id) {
    return notFound();
  }

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

  if (!chat) {
    return notFound();
  }

  return (
    <>
      <WithSkeleton
        isLoading={isChatLoading || isMessagesLoading}
        className="w-full"
      >
        <MemoizedChatWrapper
          id={chat.id}
          initialMessages={initialThreadMessages}
          isReadonly={false}
        />
      </WithSkeleton>
      <DataStreamHandler id={id} />
    </>
  );
}
