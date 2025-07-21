'use client';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getDefaultThread } from '@/lib/thread-utils';
import { useMemo, memo } from 'react';
import { notFound } from 'next/navigation';
import { ChatInputProvider } from '@/providers/chat-input-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/react';

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

export function ChatPage({ id }: { id: string }) {
  const trpc = useTRPC();

  const { data: chat } = useSuspenseQuery(
    trpc.chat.getChatById.queryOptions({ chatId: id || '' }),
  );
  const { data: messages } = useSuspenseQuery(
    trpc.chat.getChatMessages.queryOptions({ chatId: id || '' }),
  );

  const initialThreadMessages = useMemo(() => {
    if (!messages) return [];
    return getDefaultThread(
      messages.map((msg) => ({ ...msg, id: msg.id.toString() })),
    );
  }, [messages]);

  if (!id) {
    return notFound();
  }

  if (!chat) {
    return notFound();
  }

  return (
    <>
      <MemoizedChatWrapper
        id={chat.id}
        initialMessages={initialThreadMessages}
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
