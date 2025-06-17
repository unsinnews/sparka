'use client';
import { useParams } from 'react-router-dom';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getDefaultThread } from '@/lib/thread-utils';
import { useDefaultModel } from '@/providers/default-model-provider';
import { useGetAllChats, useMessagesQuery } from '@/hooks/use-chat-store';
import { useMemo } from 'react';
import { WithSkeleton } from '@/components/ui/skeleton';
import { notFound } from 'next/navigation';

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const defaultModel = useDefaultModel();

  //   TODO: Replace by get Chat by id?
  const { data: chats, isLoading: isChatLoading } = useGetAllChats();
  const { data: messages, isLoading: isMessagesLoading } = useMessagesQuery();

  const chat = chats?.find((c) => c.id === id);

  // Get messages if chat exists

  const initialThreadMessages = useMemo(() => {
    if (!messages) return [];
    return getDefaultThread(
      messages.map((msg) => ({ ...msg, id: msg.id.toString() })),
    );
  }, [messages]);

  if (!chat || !id) {
    return notFound();
  }

  // Chat exists in DB - handle visibility and permissions
  // Note: In client-side rendering, we don't have server-side session
  // This would need to be adapted based on your auth strategy

  return (
    <>
      <WithSkeleton
        isLoading={isChatLoading || isMessagesLoading}
        className="w-full"
      >
        <Chat
          id={id}
          initialMessages={initialThreadMessages}
          selectedChatModel={defaultModel}
          selectedVisibilityType={chat?.visibility}
          isReadonly={false} // You'll need to implement proper auth check here
        />
      </WithSkeleton>
      <DataStreamHandler id={id} />
    </>
  );
}
