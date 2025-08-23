'use client';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { MessageActions } from './message-actions';
import equal from 'fast-deep-equal';
import { cn, getAttachmentsFromMessage } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { SourcesAnnotations } from './message-annotations';
import { AttachmentList } from './attachment-list';
import { PartialMessageLoading } from './partial-message-loading';
import { ImageModal } from './image-modal';
import {
  useChatId,
  useMessageById,
  useMessageRoleById,
} from '@/lib/stores/chat-store';
import { MessageParts } from './message-parts';
import {
  Message as AIMessage,
  MessageContent as AIMessageContent,
} from '@/components/ai-elements/message';

interface BaseMessageProps {
  messageId: string;
  vote: Vote | undefined;
  isLoading: boolean;
  isReadonly: boolean;
  parentMessageId: string | null;
}

const PureUserMessage = ({
  messageId,
  vote,
  isLoading,
  isReadonly,
  parentMessageId,
}: BaseMessageProps) => {
  const chatId = useChatId();
  const message = useMessageById(messageId);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    imageName?: string;
  }>({
    isOpen: false,
    imageUrl: '',
    imageName: undefined,
  });

  const handleImageClick = (imageUrl: string, imageName?: string) => {
    setImageModal({
      isOpen: true,
      imageUrl,
      imageName,
    });
  };

  const handleImageModalClose = () => {
    setImageModal({
      isOpen: false,
      imageUrl: '',
      imageName: undefined,
    });
  };

  if (!message) return null;
  const textPart = message.parts.find((part) => part.type === 'text');
  if (!textPart || !chatId) return null;

  return (
    <>
      <AIMessage
        from="user"
        className={cn(
          // TODO: Consider not using this max-w class override when editing is cohesive with displaying the message
          mode === 'edit' ? 'max-w-full [&>div]:max-w-full' : undefined,
          'py-1',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-2 w-full',
            message.role === 'user' && mode !== 'edit' && 'items-end',
          )}
        >
          {mode === 'view' ? (
            !isReadonly ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-testid="message-content"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setMode('edit')}
                  >
                    <AIMessageContent
                      data-testid="message-content"
                      className="text-left"
                    >
                      <AttachmentList
                        attachments={getAttachmentsFromMessage(message)}
                        onImageClick={handleImageClick}
                        testId="message-attachments"
                      />
                      <pre className="whitespace-pre-wrap font-sans">
                        {textPart.text}
                      </pre>
                    </AIMessageContent>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Click to edit message</TooltipContent>
              </Tooltip>
            ) : (
              <AIMessageContent
                data-testid="message-content"
                className="text-left"
              >
                <AttachmentList
                  attachments={getAttachmentsFromMessage(message)}
                  onImageClick={handleImageClick}
                  testId="message-attachments"
                />
                <pre className="whitespace-pre-wrap font-sans">
                  {textPart.text}
                </pre>
              </AIMessageContent>
            )
          ) : (
            <div className="flex flex-row gap-2 items-start">
              <MessageEditor
                key={message.id}
                chatId={chatId}
                message={message}
                setMode={setMode}
                parentMessageId={parentMessageId}
              />
            </div>
          )}

          <div className="self-end">
            <MessageActions
              key={`action-${message.id}`}
              chatId={chatId}
              messageId={message.id}
              vote={vote}
              isLoading={isLoading}
              isReadOnly={isReadonly}
            />
          </div>
        </div>
      </AIMessage>
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={handleImageModalClose}
        imageUrl={imageModal.imageUrl}
        imageName={imageModal.imageName}
      />
    </>
  );
};

const UserMessage = memo(PureUserMessage, (prevProps, nextProps) => {
  if (prevProps.messageId !== nextProps.messageId) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  if (prevProps.parentMessageId !== nextProps.parentMessageId) return false;
  if (!equal(prevProps.vote, nextProps.vote)) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;

  return true;
});

const PureAssistantMessage = ({
  messageId,
  vote,
  isLoading,
  isReadonly,
}: Omit<BaseMessageProps, 'parentMessageId'>) => {
  const chatId = useChatId();

  if (!chatId) return null;

  return (
    <AIMessage from="assistant" className="w-full py-1 ">
      <div className="flex flex-col gap-2 w-full">
        <AIMessageContent className="text-left px-0 py-0">
          <PartialMessageLoading messageId={messageId} />
          <MessageParts
            messageId={messageId}
            isLoading={isLoading}
            isReadonly={isReadonly}
          />
        </AIMessageContent>

        <SourcesAnnotations
          key={`sources-annotations-${messageId}`}
          messageId={messageId}
        />

        <MessageActions
          key={`action-${messageId}`}
          chatId={chatId}
          messageId={messageId}
          vote={vote}
          isLoading={isLoading}
          isReadOnly={isReadonly}
        />
      </div>
    </AIMessage>
  );
};

const AssistantMessage = memo(PureAssistantMessage, (prevProps, nextProps) => {
  if (prevProps.messageId !== nextProps.messageId) return false;
  if (prevProps.vote !== nextProps.vote) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;

  return true;
});

const PurePreviewMessage = ({
  messageId,
  vote,
  isLoading,
  isReadonly,
  parentMessageId,
}: BaseMessageProps) => {
  const role = useMessageRoleById(messageId);
  if (!role) return null;

  return (
    <>
      {role === 'user' ? (
        <UserMessage
          messageId={messageId}
          vote={vote}
          isLoading={isLoading}
          isReadonly={isReadonly}
          parentMessageId={parentMessageId}
        />
      ) : (
        <AssistantMessage
          messageId={messageId}
          vote={vote}
          isLoading={isLoading}
          isReadonly={isReadonly}
        />
      )}
    </>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.messageId !== nextProps.messageId) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.parentMessageId !== nextProps.parentMessageId) return false;

    return true;
  },
);
