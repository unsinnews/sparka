import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/all-models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { ChatIdProvider } from '@/providers/chat-id-provider';
import { MessageTreeProvider } from '@/providers/message-tree-provider';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  return (
    <>
      <ChatIdProvider>
        <MessageTreeProvider>
          <Chat
            key={id}
            id={id}
            initialMessages={[]}
            selectedChatModel={
              modelIdFromCookie ? modelIdFromCookie.value : DEFAULT_CHAT_MODEL
            }
            selectedVisibilityType="private"
            isReadonly={false}
          />
          <DataStreamHandler id={id} />
        </MessageTreeProvider>
      </ChatIdProvider>
    </>
  );
}
