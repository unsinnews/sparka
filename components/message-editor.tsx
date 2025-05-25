'use client';

import type { Attachment } from 'ai';
import {
  type Dispatch,
  type SetStateAction,
  useState,
  useEffect,
  useRef,
} from 'react';
import { deleteTrailingMessages } from '@/app/(chat)/actions';
import type { UseChatHelpers } from '@ai-sdk/react';
import { MultimodalInput } from './multimodal-input';
import type { YourUIMessage } from '@/lib/ai/tools/annotations';
import type { ChatRequestData } from '@/app/(chat)/api/chat/route';

export type MessageEditorProps = {
  chatId: string;
  message: YourUIMessage;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  chatHelpers: UseChatHelpers;
};

export function MessageEditor({
  chatId,
  message,
  setMode,
  chatHelpers,
}: MessageEditorProps) {
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
  const [data, setData] = useState<ChatRequestData>({
    deepResearch: false,
    webSearch: false,
    reason: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
    <div ref={containerRef} className="flex flex-col gap-2 w-full">
      <div className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
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

            await deleteTrailingMessages({
              id: message.id,
            });

            // chatHelpers.setInput(input);
            chatHelpers.setMessages((messages) => {
              const index = messages.findIndex((m) => m.id === message.id);
              return [...messages.slice(0, index)];
            });
            setMode('view');

            // Let MultimodalInput handle the actual submission
            chatHelpers.append(
              {
                content: input,
                role: 'user',
                experimental_attachments: attachments,
                parts: [{ type: 'text', text: input }],
              },
              options,
            );
          }}
          isEditMode={true}
        />
      </div>
    </div>
  );
}
