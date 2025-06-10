'use client';

import { useMemo } from 'react';
import { Chat } from '@/components/chat';
import { useChatStore } from '@/hooks/use-chat-store';
import type { YourUIMessage } from '@/lib/ai/tools/annotations';
import type { AnonymousMessage } from '@/lib/types/anonymous';

interface AnonymousChatLoaderProps {
  chatId: string;
  selectedChatModel: string;
}

export function AnonymousChatLoader({
  chatId,
  selectedChatModel,
}: AnonymousChatLoaderProps) {
  const { getMessagesForChat, isLoading } = useChatStore();
  const anonymousMessages = useMemo(
    () => getMessagesForChat(chatId),
    [getMessagesForChat, chatId],
  );

  // Convert anonymous messages to UI messages format
  const initialMessages: YourUIMessage[] = useMemo(() => {
    return anonymousMessages.map((message: AnonymousMessage) => ({
      id: message.id,
      parts: message.parts,
      role: message.role as YourUIMessage['role'],
      content: '',
      createdAt: message.createdAt,
      experimental_attachments: message.attachments || [],
      annotations: message.annotations || [],
      isPartial: message.isPartial,
    }));
  }, [anonymousMessages]);

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
      initialMessages={initialMessages}
      selectedChatModel={selectedChatModel}
      selectedVisibilityType="public"
      isReadonly={false}
    />
  );
}
