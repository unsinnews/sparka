'use client';

import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatHeader } from '@/components/chat-header';
import { cn, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
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

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<YourUIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const trpc = useTRPC();
  const { data: session } = useSession();
  const { mutate: saveChatMessage } = useSaveMessageMutation();
  const { registerSetMessages } = useMessageTree();

  const lastMessageId = useRef<string | null>(
    initialMessages[initialMessages.length - 1]?.id || null,
  );
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
        parentMessageId: lastMessageId.current,
      });
      lastMessageId.current = message.id;
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message ?? 'An error occured, please try again!');
    },
  });

  const {
    messages: chatHelperMessages,
    setMessages,
    handleSubmit: originalHandleSubmit,
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

  const appendWithUpdateLastMessageId = useCallback(
    async (message: Message | CreateMessage, options?: ChatRequestOptions) => {
      lastMessageId.current = message.id || null;
      return append(message, options);
    },
    [append],
  );

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

      saveChatMessage({
        message,
        chatId: id,
        parentMessageId: lastMessageId.current,
      });

      append(message, {
        ...options,
        data: {
          ...options?.data,
          parentMessageId: lastMessageId.current,
        },
      });
      lastMessageId.current = message.id;

      setInput('');
    },
    [id, input, append, saveChatMessage, setInput, lastMessageId],
  );

  // Auto-resume functionality
  useAutoResume({
    autoResume: true,
    initialMessages: chatHelperMessages as YourUIMessage[],
    experimental_resume,
    data: chatData,
    setMessages,
  });

  // const lastMessage =
  //   chatHelpers.messages[chatHelpers.messages.length - 1] || null;
  // useEffect(() => {
  //   if (
  //     lastMessage &&
  //     lastMessage.role === 'user' &&
  //     lastMessage.id !== lastMessageId.current
  //   ) {
  //     lastMessageId.current = lastMessage.id;
  //   }
  // }, [lastMessage]);

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
      append: appendWithUpdateLastMessageId,
      reload: async (options?: ChatRequestOptions) => {
        return reload({
          ...options,
          data: {
            ...(options?.data as ChatRequestToolsConfig),
            parentMessageId: lastMessageId.current,
          },
        });
      },
    };
  }, [chatHelpers, appendWithUpdateLastMessageId, lastMessageId, reload]);

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
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
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
          {!isReadonly && (
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
