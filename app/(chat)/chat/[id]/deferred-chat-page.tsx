'use client';

import { ChatPage } from '@/app/(chat)/chat/[id]/chat-page';
import { WithSkeleton } from '@/components/ui/skeleton';
import { useChatId } from '@/providers/chat-id-provider';
import { useDeferredValue } from 'react';

export function DeferredChatPage() {
  const { chatId: id } = useChatId();

  console.log('chatId', id);

  const deferredId = useDeferredValue(id);

  if (!id) {
    return null;
  }
  if (deferredId !== id) {
    return (
      <div className="flex h-screen w-full">
        <WithSkeleton isLoading={true} className="w-full h-full">
          <div className="flex h-screen w-full" />
        </WithSkeleton>
      </div>
    );
  }

  return <ChatPage id={deferredId} />;
}
