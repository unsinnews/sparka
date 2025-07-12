'use client';
import {
  type Dispatch,
  type SetStateAction,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { MultimodalInput } from './multimodal-input';
import type { ChatMessage } from '@/lib/ai/types';
import {
  ChatInputProvider,
  useChatInput,
} from '@/providers/chat-input-provider';
import {
  getAttachmentsFromMessage,
  getTextContentFromMessage,
} from '@/lib/utils';
import type { UseChatHelpers } from '@ai-sdk/react';

export type MessageEditorProps = {
  chatId: string;
  message: ChatMessage;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  parentMessageId: string | null;
};

function MessageEditorContent({
  chatId,
  setMode,
  sendMessage,
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
    async (
      message: Parameters<UseChatHelpers<ChatMessage>['sendMessage']>[0],
      options?: Parameters<UseChatHelpers<ChatMessage>['sendMessage']>[1],
    ) => {
      setIsSubmitting(true);

      setMode('view');

      // Save the message manually to keep local state in sync
      const res = await sendMessage(message, options);

      setIsSubmitting(false);
      return res;
    },
    [setIsSubmitting, setMode, sendMessage],
  );

  return (
    <div ref={containerRef} className="flex bg-background w-full">
      <MultimodalInput
        chatId={chatId}
        status={isSubmitting ? 'submitted' : 'ready'}
        stop={() => setIsSubmitting(false)}
        messages={[]}
        sendMessage={handleAppend}
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
  const initialInput = getTextContentFromMessage(props.message);
  const initialAttachments = getAttachmentsFromMessage(props.message);

  return (
    <ChatInputProvider
      key={`edit-${props.message.id}`}
      initialInput={initialInput}
      initialAttachments={initialAttachments}
      localStorageEnabled={false}
      overrideModelId={selectedModelId}
    >
      <MessageEditorContent {...props} />
    </ChatInputProvider>
  );
}
