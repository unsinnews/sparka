import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getAllMessagesByChatId, tryGetChatById } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/all-models';
import { dbMessageToUIMessage } from '@/lib/message-conversion';
import { AnonymousChatLoader } from './anonymous-chat-loader';
import { getDefaultThread } from '@/lib/thread-utils';

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
        <AnonymousChatLoader
          chatId={id}
          selectedChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
        />
        <DataStreamHandler id={id} />
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

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={initialThreadMessages.map(dbMessageToUIMessage)}
        selectedChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
        selectedVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
