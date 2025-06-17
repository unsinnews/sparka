'use client';

import type { Attachment } from 'ai';
import {
  type Dispatch,
  type SetStateAction,
  useState,
  useEffect,
  useRef,
} from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { MultimodalInput } from './multimodal-input';
import type { YourUIMessage } from '@/lib/types/ui';
import type { ChatRequestToolsConfig } from '@/app/(chat)/api/chat/route';
import {
  useDeleteTrailingMessages,
  useSaveMessageMutation,
} from '@/hooks/use-chat-store';
import { useSession } from 'next-auth/react';
import { generateUUID } from '@/lib/utils';

export type MessageEditorProps = {
  chatId: string;
  message: YourUIMessage;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  chatHelpers: UseChatHelpers;
  selectedModelId: string;
  parentMessageId: string | null;
};

export function MessageEditor({
  chatId,
  message,
  setMode,
  chatHelpers,
  selectedModelId,
  parentMessageId,
  onModelChange,
}: MessageEditorProps & { onModelChange?: (modelId: string) => void }) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [input, setInput] = useState<string>(() =>
    message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join(''),
  );
  const [attachments, setAttachments] = useState<Array<Attachment>>(
    message.experimental_attachments || [],
  );
  const [data, setData] = useState<ChatRequestToolsConfig>({
    deepResearch: false,
    webSearch: false,
    reason: false,
  });

  const { mutateAsync: saveMessageAsync } = useSaveMessageMutation();

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const { mutateAsync: deleteTrailingMessagesAsync } =
    useDeleteTrailingMessages();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log('handleClickOutside', event);
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMode('view');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setMode]);

  return (
    <div ref={containerRef} className="flex bg-background w-full">
      <MultimodalInput
        chatId={chatId}
        input={input}
        setInput={setInput}
        status={isSubmitting ? 'submitted' : 'ready'}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        data={data}
        setData={setData}
        messages={[]}
        setMessages={chatHelpers.setMessages}
        append={chatHelpers.append}
        handleSubmit={async (event, options) => {
          setIsSubmitting(true);

          // await deleteTrailingMessagesAsync({ messageId: message.id, chatId });

          // chatHelpers.setInput(input);

          setMode('view');

          // Let MultimodalInput handle the actual submission

          chatHelpers.setMessages((messages) => {
            const index = chatHelpers.messages.findIndex(
              (m) => m.id === message.id,
            );
            return messages.slice(0, index);
          });

          const newMessagId = generateUUID();

          console.log('chatHelpers.messages', chatHelpers.messages);
          chatHelpers.append(
            {
              id: newMessagId,
              content: input,
              role: 'user',
              experimental_attachments: attachments,
              parts: [{ type: 'text', text: input }],
            },
            {
              ...options,
              data: {
                ...(options?.data as ChatRequestToolsConfig),
                parentMessageId: parentMessageId,
              },
            },
          );

          // Append doesn't perform a new submission. Therefore, we need to save manually to keep local state in sync.
          await saveMessageAsync({
            message: {
              content: input,
              id: newMessagId,
              role: 'user',
              parts: [{ type: 'text', text: input }],
              experimental_attachments: attachments,
              createdAt: new Date(),
            },
            chatId,
            parentMessageId: parentMessageId,
          });
        }}
        isEditMode={true}
        selectedModelId={selectedModelId}
        onModelChange={onModelChange}
      />
    </div>
  );
}
