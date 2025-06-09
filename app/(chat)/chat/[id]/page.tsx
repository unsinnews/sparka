import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getMessagesByChatId, tryGetChatById } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/all-models';
import type { DBMessage } from '@/lib/db/schema';
import type { Attachment, UIMessage } from 'ai';
import type {
  MessageAnnotation,
  YourUIMessage,
} from '@/lib/ai/tools/annotations';
import { AnonymousChatLoader } from './anonymous-chat-loader';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await tryGetChatById({ id });
  const session = await auth();
  console.log('session', session);
  console.log('chat', chat);

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

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  function convertToUIMessages(
    messages: Array<DBMessage>,
  ): Array<YourUIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: '',
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
      annotations: message.annotations as MessageAnnotation[],
      isPartial: message.isPartial,
    }));
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
        selectedVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
