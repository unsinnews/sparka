'use client';
import { Chat } from '@/components/chat';
import { useMessagesQuery } from '@/hooks/use-chat-store';
import { getDefaultThread } from '@/lib/thread-utils';
import type { YourUIMessage } from '@/lib/types/ui';

interface AnonymousChatLoaderProps {
  chatId: string;
  selectedChatModel: string;
}

export function AnonymousChatLoader({
  chatId,
  selectedChatModel,
}: AnonymousChatLoaderProps) {
  const { data: messages, isLoading, isFetched } = useMessagesQuery();

  // Don't render Chat until messages are loaded
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  const initialThreadMessages = messages ? getDefaultThread(messages) : [];

  return (
    <Chat
      id={chatId}
      initialMessages={initialThreadMessages as YourUIMessage[]}
      selectedChatModel={selectedChatModel}
      selectedVisibilityType="public"
      isReadonly={false}
    />
  );
}
