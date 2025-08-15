'use client';
import { AnimatePresence, motion } from 'motion/react';
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
    <div
      className={cn(
        'w-full flex flex-col items-end',
        mode === 'edit'
          ? 'max-w-full'
          : 'group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:w-fit',
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-4 w-full',
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
                  <div
                    data-testid="message-content"
                    className="flex flex-col gap-4 w-full bg-muted px-3 py-2 rounded-2xl border dark:border-zinc-700 text-left"
                  >
                    <AttachmentList
                      attachments={getAttachmentsFromMessage(message)}
                      onImageClick={handleImageClick}
                      testId="message-attachments"
                    />
                    <pre className="whitespace-pre-wrap font-sans">
                      {textPart.text}
                    </pre>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>Click to edit message</TooltipContent>
            </Tooltip>
          ) : (
            <div
              data-testid="message-content"
              className="flex flex-col gap-4 w-full bg-muted px-3 py-2 rounded-2xl border dark:border-zinc-700 text-left"
            >
              <AttachmentList
                attachments={getAttachmentsFromMessage(message)}
                onImageClick={handleImageClick}
                testId="message-attachments"
              />
              <pre className="whitespace-pre-wrap font-sans">
                {textPart.text}
              </pre>
            </div>
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
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={handleImageModalClose}
        imageUrl={imageModal.imageUrl}
        imageName={imageModal.imageName}
      />
    </div>
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
    <div className="w-full">
      <div className="flex flex-col gap-4 w-full">
        <PartialMessageLoading messageId={messageId} />

        <MessageParts
          messageId={messageId}
          isLoading={isLoading}
          isReadonly={isReadonly}
        />

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
    </div>
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
    <AnimatePresence>
      <motion.div
        data-testid={`message-${role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={role}
      >
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
      </motion.div>
    </AnimatePresence>
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
