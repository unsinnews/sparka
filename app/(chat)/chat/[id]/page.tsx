import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getAllMessagesByChatId, tryGetChatById } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/all-models';
import { dbMessageToUIMessage } from '@/lib/message-conversion';
import { getDefaultThread } from '@/lib/thread-utils';
import { ChatIdProvider } from '@/providers/chat-id-provider';
import { MessageTreeProvider } from '@/providers/message-tree-provider';
import { trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { makeQueryClient } from '@/trpc/query-client';
import { AnonymousChatLoader } from './anonymous-chat-loader';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await tryGetChatById({ id });
  const session = await auth();

  // If chat not found in DB
  if (!chat) {
    // If user is logged in, chat should be in DB
    if (session?.user) {
      notFound();
    }

    // For anonymous users, the chat might be stored locally
    // Use a client component to handle localStorage access
    const cookieStore = await cookies();
    const chatModelFromCookie = cookieStore.get('chat-model');

    return (
      <>
        <ChatIdProvider>
          <MessageTreeProvider>
            <AnonymousChatLoader
              chatId={id}
              selectedChatModel={
                chatModelFromCookie?.value || DEFAULT_CHAT_MODEL
              }
            />
            <DataStreamHandler id={id} />
          </MessageTreeProvider>
        </ChatIdProvider>
      </>
    );
  }

  // Chat exists in DB - handle visibility and permissions
  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getAllMessagesByChatId({
    chatId: id,
  });

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  const initialThreadMessages = getDefaultThread(messagesFromDb);

  const queryClient = makeQueryClient();

  // Set the prefetched data directly in the query cache
  queryClient.setQueryData(
    trpc.chat.getMessagesByChatId.queryKey({
      chatId: id,
    }),
    messagesFromDb.map(dbMessageToUIMessage),
  );

  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ChatIdProvider>
          <MessageTreeProvider>
            <Chat
              id={chat.id}
              initialMessages={initialThreadMessages.map(dbMessageToUIMessage)}
              selectedChatModel={
                chatModelFromCookie?.value || DEFAULT_CHAT_MODEL
              }
              selectedVisibilityType={chat.visibility}
              isReadonly={session?.user?.id !== chat.userId}
            />
            <DataStreamHandler id={id} />
          </MessageTreeProvider>
        </ChatIdProvider>
      </HydrationBoundary>
    </>
  );
}
