'use client';

import type { Attachment, ChatRequestOptions, Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatHeader } from '@/components/chat-header';
import { cn, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import type { YourUIMessage } from '@/lib/types/ui';
import type { ChatRequestToolsConfig } from '@/app/(chat)/api/chat/route';
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
  selectedChatModel,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<YourUIMessage>;
  selectedChatModel: string;
  isReadonly: boolean;
}) {
  const trpc = useTRPC();
  const { data: session } = useSession();
  const { mutate: saveChatMessage } = useSaveMessageMutation();
  const { registerSetMessages, getLastMessageId } = useMessageTree();
  const [localSelectedModelId, setLocalSelectedModelId] =
    useState<string>(selectedChatModel);

  console.log('chat.tsx', id);
  const chatHelpers = useChat({
    id,
    body: { id, selectedChatModel: localSelectedModelId },
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
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data: chatData,
  } = chatHelpers;

  // Register setMessages with the MessageTreeProvider
  useEffect(() => {
    console.log('registering setMessages');
    registerSetMessages(setMessages);
  }, [setMessages, registerSetMessages]);

  // Wrapper around handleSubmit to save user messages for anonymous users
  const handleSubmit = useCallback(
    (event?: { preventDefault?: () => void }, options?: any) => {
      const message: Message = {
        id: generateUUID(),
        parts: [
          {
            type: 'text',
            text: input,
          },
        ],
        experimental_attachments: options?.experimental_attachments || [],
        createdAt: new Date(),
        role: 'user',
        content: input,
      };

      const parentMessageId = getLastMessageId();
      saveChatMessage({
        message,
        chatId: id,
        parentMessageId,
      });

      append(message, {
        ...options,
        data: {
          ...options?.data,
          parentMessageId,
        },
      });

      setInput('');
    },
    [id, input, append, saveChatMessage, setInput, getLastMessageId],
  );

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

  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const [data, setData] = useState<ChatRequestToolsConfig>({
    deepResearch: false,
    webSearch: false,
    reason: false,
  });

  const handleModelChange = async (modelId: string) => {
    setLocalSelectedModelId(modelId);

    try {
      await fetch('/api/chat-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: modelId }),
      });
    } catch (error) {
      console.error('Failed to save chat model:', error);
      toast.error('Failed to save model preference');
    }
  };

  const modifiedChatHelpers = useMemo(() => {
    return {
      ...chatHelpers,
      reload: async (options?: ChatRequestOptions) => {
        return reload({
          ...options,
          data: {
            ...(options?.data as ChatRequestToolsConfig),
            parentMessageId: getLastMessageId(),
          },
        });
      },
    };
  }, [chatHelpers, getLastMessageId, reload]);

  return (
    <>
      <div
        className={cn(
          'flex flex-col min-w-0 h-dvh bg-background md:max-w-[calc(100vw-var(--sidebar-width))] max-w-screen',
          state === 'collapsed' && 'md:max-w-screen',
        )}
      >
        <ChatHeader
          chatId={id}
          selectedModelId={localSelectedModelId}
          isReadonly={isReadonly}
          hasMessages={chatHelperMessages.length > 0}
        />

        <Messages
          chatId={id}
          votes={votes}
          status={status}
          messages={chatHelperMessages as YourUIMessage[]}
          data={data}
          chatHelpers={modifiedChatHelpers}
          isReadonly={isReadonly}
          isVisible={!isArtifactVisible}
          selectedModelId={localSelectedModelId}
          onModelChange={handleModelChange}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly ? (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              data={data}
              setData={setData}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={chatHelperMessages as YourUIMessage[]}
              setMessages={setMessages}
              append={append}
              selectedModelId={localSelectedModelId}
              onModelChange={handleModelChange}
            />
          ) : (
            <CloneChatButton chatId={id} className="w-full" />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        chatHelpers={modifiedChatHelpers}
        attachments={attachments}
        setAttachments={setAttachments}
        data={data}
        setData={setData}
        messages={chatHelperMessages as YourUIMessage[]}
        votes={votes}
        isReadonly={isReadonly}
        selectedModelId={localSelectedModelId}
        onModelChange={handleModelChange}
      />
    </>
  );
}
