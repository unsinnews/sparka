'use client';

import type { Attachment } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChatHeader } from '@/components/chat-header';
import { cn, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import type { YourUIMessage } from '@/lib/ai/tools/annotations';
import type { ChatRequestData } from '@/app/(chat)/api/chat/route';
import { useTRPC } from '@/trpc/react';
import { useSession } from 'next-auth/react';

import { useSidebar } from '@/components/ui/sidebar';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { useChatStoreContext } from '@/providers/chat-store-provider';

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
  const { onAssistantMessageFinish, userMessageSubmit } = useChatStoreContext();

  const [localSelectedModelId, setLocalSelectedModelId] =
    useState<string>(selectedChatModel);

  const chatHelpers = useChat({
    id,
    body: { id, selectedChatModel: localSelectedModelId },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: (message) => {
      onAssistantMessageFinish(id, message);
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message ?? 'An error occured, please try again!');
    },
  });

  const {
    messages,
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

  // Wrapper around handleSubmit to save user messages for anonymous users
  const handleSubmit = useCallback(
    (event?: { preventDefault?: () => void }, options?: any) => {
      // Let the chat store handle user message submission logic
      userMessageSubmit(
        id,
        input,
        initialMessages.length,
        messages.length,
        options?.experimental_attachments || [],
      );

      return originalHandleSubmit(event, options);
    },
    [
      id,
      input,
      userMessageSubmit,
      originalHandleSubmit,
      initialMessages.length,
      messages.length,
    ],
  );

  // Auto-resume functionality
  useAutoResume({
    autoResume: true,
    initialMessages,
    experimental_resume,
    data: chatData,
    setMessages,
  });

  const { data: votes } = useQuery({
    ...trpc.vote.getVotes.queryOptions({ chatId: id }),
    enabled: messages.length >= 2 && !isReadonly && !!session?.user,
  });

  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const [data, setData] = useState<ChatRequestData>({
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
          messages={messages as YourUIMessage[]}
          data={data}
          chatHelpers={chatHelpers}
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
              messages={messages as YourUIMessage[]}
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
        chatHelpers={chatHelpers}
        attachments={attachments}
        setAttachments={setAttachments}
        data={data}
        setData={setData}
        messages={messages as YourUIMessage[]}
        votes={votes}
        isReadonly={isReadonly}
        selectedModelId={localSelectedModelId}
        onModelChange={handleModelChange}
      />
    </>
  );
}
