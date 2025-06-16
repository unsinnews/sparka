'use client';
import { Chat } from '@/components/chat';
import { useMessagesQuery } from '@/hooks/use-chat-store';
import type { YourUIMessage } from '@/lib/ai/tools/annotations';

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

  return (
    <Chat
      id={chatId}
      initialMessages={messages as YourUIMessage[]}
      selectedChatModel={selectedChatModel}
      selectedVisibilityType="public"
      isReadonly={false}
    />
  );
}
