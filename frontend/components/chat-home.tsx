'use client';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { useDefaultModel } from '@/providers/default-model-provider';
import { generateUUID } from '@/lib/utils';
import { ChatInputProvider } from '@/providers/chat-input-provider';

export function ChatHome() {
  const defaultModel = useDefaultModel();
  const newChatId = generateUUID();

  return (
    <>
      <ChatInputProvider localStorageEnabled={true}>
        <Chat
          id={newChatId}
          initialMessages={[]}
          selectedChatModel={defaultModel}
          isReadonly={false}
        />
      </ChatInputProvider>
      <DataStreamHandler id={newChatId} />
    </>
  );
}
