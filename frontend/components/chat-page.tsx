'use client';
import { useParams } from 'react-router-dom';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { AnonymousChatLoader } from '@/app/(chat)/chat/[id]/anonymous-chat-loader';
import { getDefaultThread } from '@/lib/thread-utils';
import { useDefaultModel } from '@/providers/default-model-provider';
import { useGetAllChats, useMessagesQuery } from '@/hooks/use-chat-store';

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const defaultModel = useDefaultModel();

  //   TODO: Replace by get Chat by id?
  const { data: chats, isLoading: isChatLoading } = useGetAllChats();
  const { data: messages, isLoading: isMessagesLoading } = useMessagesQuery();

  const chat = chats?.find((c) => c.id === id);

  // Get messages if chat exists

  if (!id) {
    return <div>Chat ID not found</div>;
  }

  if (isChatLoading) {
    return <div>Loading chat...</div>;
  }

  // If chat not found in DB, use anonymous chat loader
  if (!chat) {
    return (
      <>
        <AnonymousChatLoader chatId={id} selectedChatModel={defaultModel} />
        <DataStreamHandler id={id} />
      </>
    );
  }

  // Chat exists in DB - handle visibility and permissions
  // Note: In client-side rendering, we don't have server-side session
  // This would need to be adapted based on your auth strategy

  if (isMessagesLoading) {
    return <div>Loading messages...</div>;
  }

  const initialThreadMessages = messages
    ? getDefaultThread(
        messages.map((msg) => ({ ...msg, id: msg.id.toString() })),
      )
    : [];

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={initialThreadMessages}
        selectedChatModel={defaultModel}
        selectedVisibilityType={chat.visibility}
        isReadonly={false} // You'll need to implement proper auth check here
      />
      <DataStreamHandler id={id} />
    </>
  );
}
