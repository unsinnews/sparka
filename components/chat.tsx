'use client';
import { useQuery } from '@tanstack/react-query';
import { ChatHeader } from '@/components/chat-header';
import { cn } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { useTRPC } from '@/trpc/react';
import { useSession } from 'next-auth/react';

import { useSidebar } from '@/components/ui/sidebar';
import { CloneChatButton } from '@/components/clone-chat-button';
import type { ChatMessage } from '@/lib/ai/types';
import {
  useChatStatus,
  useMessageIds,
  chatStore,
  useChatId,
} from '@/lib/stores/chat-store';
import { useCallback } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';

export function Chat({
  id,
  initialMessages,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<ChatMessage>;
  isReadonly: boolean;
}) {
  const trpc = useTRPC();
  const { data: session } = useSession();
  const isLoading = id !== useChatId();

  const messageIds = useMessageIds();
  const status = useChatStatus();
  const stopAsync: UseChatHelpers<ChatMessage>['stop'] =
    useCallback(async () => {
      const helpers = chatStore.getState().currentChatHelpers;
      if (!helpers?.stop) return;
      return helpers.stop();
    }, []);
  const stopSync: () => void = useCallback(() => {
    const helpers = chatStore.getState().currentChatHelpers;
    void helpers?.stop?.();
  }, []);
  const sendMessage: UseChatHelpers<ChatMessage>['sendMessage'] = useCallback(
    async (...args: Parameters<UseChatHelpers<ChatMessage>['sendMessage']>) => {
      const fn = chatStore.getState().currentChatHelpers?.sendMessage;
      if (!fn) throw new Error('Chat not ready');
      return fn(...args);
    },
    [],
  );
  const regenerate: UseChatHelpers<ChatMessage>['regenerate'] = useCallback(
    async (options?: any) => {
      const helpers = chatStore.getState().currentChatHelpers;
      if (!helpers?.regenerate) return;
      return helpers.regenerate(options as any);
    },
    [],
  );

  const { data: votes } = useQuery({
    ...trpc.vote.getVotes.queryOptions({ chatId: id }),
    enabled:
      messageIds.length >= 2 && !isReadonly && !!session?.user && !isLoading,
  });

  const { state } = useSidebar();
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  return (
    <>
      <div
        className={cn(
          '@container flex flex-col min-w-0 h-dvh bg-background md:max-w-[calc(100vw-var(--sidebar-width))] max-w-screen',
          state === 'collapsed' && 'md:max-w-screen',
        )}
      >
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          hasMessages={messageIds.length > 0}
          user={session?.user}
        />

        <Messages
          votes={votes}
          sendMessage={sendMessage}
          regenerate={regenerate}
          isReadonly={isReadonly}
          isVisible={!isArtifactVisible}
        />

        {!isReadonly ? (
          <MultimodalInput
            chatId={id}
            status={status}
            stop={stopSync}
            sendMessage={sendMessage}
            parentMessageId={chatStore.getState().getLastMessageId()}
          />
        ) : (
          <CloneChatButton chatId={id} className="w-full" />
        )}
      </div>

      <Artifact
        chatId={id}
        sendMessage={sendMessage}
        regenerate={regenerate}
        status={status}
        stop={stopAsync}
        votes={votes}
        isReadonly={isReadonly}
        isAuthenticated={!!session?.user}
      />
    </>
  );
}
