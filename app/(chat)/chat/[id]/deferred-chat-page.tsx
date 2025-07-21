'use client';

import { ChatPage } from '@/app/(chat)/chat/[id]/chat-page';
import { WithSkeleton } from '@/components/ui/skeleton';
import { useDeferredValue } from 'react';

export function DeferredChatPage({ id }: { id: string }) {
  const deferredId = useDeferredValue(id);

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
