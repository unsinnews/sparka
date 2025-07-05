'use client';
import { useChat } from '@ai-sdk/react';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatHeader } from '@/components/chat-header';
import { cn, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import type { YourUIMessage } from '@/lib/types/ui';
import { useTRPC } from '@/trpc/react';
import { useSession } from 'next-auth/react';

import { useSidebar } from '@/components/ui/sidebar';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { useSaveMessageMutation } from '@/hooks/use-chat-store';
import { useMessageTree } from '@/providers/message-tree-provider';
import { CloneChatButton } from '@/components/clone-chat-button';

export function Chat({
  id,
  initialMessages,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<YourUIMessage>;
  isReadonly: boolean;
}) {
  const trpc = useTRPC();
  const { data: session } = useSession();
  const { mutate: saveChatMessage } = useSaveMessageMutation();
  const { registerSetMessages, getLastMessageId } = useMessageTree();

  console.log('chat.tsx', id);
  const chatHelpers = useChat({
    id,
    body: { id },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,

    onFinish: (message) => {
      saveChatMessage({
        message,
        chatId: id,
        parentMessageId: getLastMessageId(),
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message ?? 'An error occured, please try again!');
    },
  });

  const {
    messages: chatHelperMessages,
    setMessages,
    status,
    stop,
    experimental_resume,
    data: chatData,
  } = chatHelpers;

  // Register setMessages with the MessageTreeProvider
  useEffect(() => {
    console.log('registering setMessages');
    registerSetMessages(setMessages);
  }, [setMessages, registerSetMessages]);

  // Auto-resume functionality
  useAutoResume({
    autoResume: true,
    initialMessages: initialMessages as YourUIMessage[],
    experimental_resume,
    data: chatData,
    setMessages,
  });

  const { data: votes } = useQuery({
    ...trpc.vote.getVotes.queryOptions({ chatId: id }),
    enabled: chatHelperMessages.length >= 2 && !isReadonly && !!session?.user,
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
          hasMessages={chatHelperMessages.length > 0}
          user={session?.user}
        />

        <Messages
          chatId={id}
          votes={votes}
          status={status}
          messages={chatHelperMessages as YourUIMessage[]}
          chatHelpers={chatHelpers}
          isReadonly={isReadonly}
          isVisible={!isArtifactVisible}
        />

        <form className="flex mx-auto p-2 @[400px]:px-4 @[400px]:pb-4 @[400px]:md:pb-6 bg-background gap-2 w-full md:max-w-3xl">
          {!isReadonly ? (
            <MultimodalInput
              chatId={id}
              status={status}
              stop={stop}
              messages={chatHelperMessages as YourUIMessage[]}
              setMessages={setMessages}
              append={chatHelpers.append}
              parentMessageId={getLastMessageId()}
            />
          ) : (
            <CloneChatButton chatId={id} className="w-full" />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        chatHelpers={chatHelpers}
        messages={chatHelperMessages as YourUIMessage[]}
        votes={votes}
        isReadonly={isReadonly}
        isAuthenticated={!!session?.user}
      />
    </>
  );
}
