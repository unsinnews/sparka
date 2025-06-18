'use client';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { useDefaultModel } from '@/providers/default-model-provider';
import { generateUUID } from '@/lib/utils';

export function ChatHome() {
  const defaultModel = useDefaultModel();

  const id = generateUUID();
  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedChatModel={defaultModel}
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
