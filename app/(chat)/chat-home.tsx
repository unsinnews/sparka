'use client';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { ChatSync } from '@/components/chat-sync';
import { ChatInputProvider } from '@/providers/chat-input-provider';

export function ChatHome({ id }: { id: string }) {
  return (
    <>
      <ChatInputProvider localStorageEnabled={true}>
        <ChatSync id={id} initialMessages={[]} />
        <Chat key={id} id={id} initialMessages={[]} isReadonly={false} />
        <DataStreamHandler id={id} />
      </ChatInputProvider>
    </>
  );
}
