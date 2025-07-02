'use client';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { ChatInputProvider } from '@/providers/chat-input-provider';
import { useChatId } from '@/providers/chat-id-provider';
import { notFound } from 'next/navigation';

export function ChatHome() {
  const { provisionalChatId: newChatId } = useChatId();

  if (!newChatId) {
    return notFound();
  }

  return (
    <>
      <ChatInputProvider localStorageEnabled={true}>
        <Chat
          key={newChatId}
          id={newChatId}
          initialMessages={[]}
          isReadonly={false}
        />
      </ChatInputProvider>
      <DataStreamHandler id={newChatId} />
    </>
  );
}
