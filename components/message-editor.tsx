'use client';

import type { ChatRequestOptions, CreateMessage, Message } from 'ai';
import {
  type Dispatch,
  type SetStateAction,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { MultimodalInput } from './multimodal-input';
import type { YourUIMessage } from '@/lib/types/ui';
import {
  ChatInputProvider,
  useChatInput,
} from '@/providers/chat-input-provider';

export type MessageEditorProps = {
  chatId: string;
  message: YourUIMessage;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  chatHelpers: UseChatHelpers;
  parentMessageId: string | null;
};

function MessageEditorContent({
  chatId,
  message,
  setMode,
  chatHelpers,
  parentMessageId,
}: MessageEditorProps & { onModelChange?: (modelId: string) => void }) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const handleAppend = useCallback(
    async (message: Message | CreateMessage, options?: ChatRequestOptions) => {
      setIsSubmitting(true);

      setMode('view');

      // Save the message manually to keep local state in sync
      const res = await chatHelpers.append(message, options);

      setIsSubmitting(false);
      return res;
    },
    [setIsSubmitting, setMode, chatHelpers],
  );

  return (
    <div ref={containerRef} className="flex bg-background w-full">
      <MultimodalInput
        chatId={chatId}
        status={isSubmitting ? 'submitted' : 'ready'}
        stop={() => setIsSubmitting(false)}
        messages={[]}
        setMessages={chatHelpers.setMessages}
        append={handleAppend}
        isEditMode={true}
        parentMessageId={parentMessageId}
      />
    </div>
  );
}

export function MessageEditor(
  props: MessageEditorProps & { onModelChange?: (modelId: string) => void },
) {
  const { selectedModelId } = useChatInput(); // TODO: IT should get the model from the UI MEssage

  // Get the initial input value from the message content
  const initialInput = props.message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');

  return (
    <ChatInputProvider
      key={`edit-${props.message.id}`}
      initialInput={initialInput}
      initialAttachments={props.message.experimental_attachments || []}
      localStorageEnabled={false}
      initialSelectedModelId={selectedModelId}
    >
      <MessageEditorContent {...props} />
    </ChatInputProvider>
  );
}
