'use client';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, getAttachmentsFromMessage } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { Retrieve } from './retrieve';
import { StockChartMessage } from './stock-chart-message';
import { CodeInterpreterMessage } from './code-interpreter-message';
import {
  SourcesAnnotations,
  ResearchUpdateAnnotations,
} from './message-annotations';
import { ReadDocument } from './read-document';
import { AttachmentList } from './attachment-list';
import { Skeleton } from './ui/skeleton';
import { ImageModal } from './image-modal';
import { GeneratedImage } from './generated-image';
import type { ChatMessage } from '@/lib/ai/types';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  isReadonly,
  chatHelpers,
  lastArtifact,
  parentMessageId,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  isReadonly: boolean;
  chatHelpers: UseChatHelpers<ChatMessage>;
  lastArtifact: { messageIndex: number; toolCallId: string } | null;
  parentMessageId: string | null;
}) => {
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

  // Helper function to check if this is the last artifact
  const isLastArtifact = (currentToolCallId: string) => {
    if (!lastArtifact) return false;

    const { messages } = chatHelpers;
    const currentMessageIndex = messages.findIndex(
      (msg) => msg.id === message.id,
    );

    return (
      lastArtifact.messageIndex === currentMessageIndex &&
      lastArtifact.toolCallId === currentToolCallId
    );
  };

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

  // TODO: Verify if this is needed ai sdk v5
  // useDataStream();

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'w-full',
            mode === 'edit'
              ? 'max-w-full'
              : 'group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:w-fit',
          )}
        >
          {/* Content Column */}
          <div
            className={cn(
              'flex flex-col gap-4 w-full',
              message.role === 'user' && mode !== 'edit' && 'items-end',
            )}
          >
            {' '}
            {message.metadata?.isPartial && message.parts.length === 0 && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-4/5 rounded-full" />
                <Skeleton className="h-4 w-3/5 rounded-full" />
                <Skeleton className="h-4 w-2/5 rounded-full" />
              </div>
            )}
            <ResearchUpdateAnnotations
              parts={message.parts}
              key={`research-update-annotations-${message.id}`}
            />
            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.text}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="">
                      {message.role === 'user' && !isReadonly ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              data-testid="message-content"
                              className={cn(
                                'cursor-pointer hover:opacity-80 transition-opacity',
                              )}
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <div
                                data-testid="message-content"
                                className={cn('flex flex-col gap-4 w-full', {
                                  'bg-muted px-3 py-2 rounded-2xl border dark:border-zinc-700 text-left':
                                    message.role === 'user',
                                })}
                              >
                                <AttachmentList
                                  attachments={getAttachmentsFromMessage(
                                    message,
                                  )}
                                  onImageClick={handleImageClick}
                                  testId="message-attachments"
                                />
                                {/* User message renndering withotu Markdown */}

                                <pre className="whitespace-pre-wrap font-sans">
                                  {part.text}
                                </pre>
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Click to edit message</TooltipContent>
                        </Tooltip>
                      ) : (
                        <div
                          data-testid="message-content"
                          className={cn('flex flex-col gap-4 w-full', {
                            'bg-muted px-3 py-2 rounded-2xl border dark:border-zinc-700 text-left':
                              message.role === 'user',
                          })}
                        >
                          <AttachmentList
                            attachments={getAttachmentsFromMessage(message)}
                            onImageClick={handleImageClick}
                            testId="message-attachments"
                          />
                          {message.role === 'assistant' ? (
                            <Markdown>{part.text}</Markdown>
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans ">
                              {part.text}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <MessageEditor
                        key={message.id}
                        chatId={chatId}
                        message={message}
                        setMode={setMode}
                        chatHelpers={chatHelpers}
                        parentMessageId={parentMessageId}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-getWeather') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  return (
                    <div key={toolCallId} className="skeleton">
                      <Weather />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;
                  return (
                    <div key={toolCallId}>
                      <Weather weatherAtLocation={output} />
                    </div>
                  );
                }
              }

              if (type === 'tool-createDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentPreview
                        isReadonly={isReadonly}
                        args={input}
                        messageId={message.id}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output, input } = part;
                  const shouldShowFullPreview = isLastArtifact(toolCallId);

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      {shouldShowFullPreview ? (
                        <DocumentPreview
                          isReadonly={isReadonly}
                          result={output}
                          args={input}
                          messageId={message.id}
                          type="create"
                        />
                      ) : (
                        <DocumentToolResult
                          type="create"
                          result={output}
                          isReadonly={isReadonly}
                          messageId={message.id}
                        />
                      )}
                    </div>
                  );
                }
              }

              if (type === 'tool-updateDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="update"
                        // @ts-expect-error: // TODO: fix this
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output, input } = part;
                  const shouldShowFullPreview = isLastArtifact(toolCallId);

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      {shouldShowFullPreview ? (
                        <DocumentPreview
                          isReadonly={isReadonly}
                          result={output}
                          args={input}
                          messageId={message.id}
                          type="update"
                        />
                      ) : (
                        <DocumentToolResult
                          type="update"
                          result={output}
                          isReadonly={isReadonly}
                          messageId={message.id}
                        />
                      )}
                    </div>
                  );
                }
              }

              if (type === 'tool-requestSuggestions') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="request-suggestions"
                        // @ts-expect-error: // TODO: fix this
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="request-suggestions"
                        result={output}
                        isReadonly={isReadonly}
                        messageId={message.id}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-retrieve') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  return (
                    <div key={toolCallId}>
                      <Retrieve />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;
                  return (
                    <div key={toolCallId}>
                      {/* @ts-expect-error: // TODO: fix this */}
                      <Retrieve result={output} />
                    </div>
                  );
                }
              }

              if (type === 'tool-readDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  return null; // No loading state for readDocument
                }

                if (state === 'output-available') {
                  const { output } = part;
                  return (
                    <div key={toolCallId}>
                      {/* @ts-expect-error: // TODO: fix this */}
                      <ReadDocument result={output} />
                    </div>
                  );
                }
              }

              if (type === 'tool-stockChart') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      {/* @ts-expect-error: // TODO: fix this */}
                      <StockChartMessage result={null} args={input} />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output, input } = part;
                  return (
                    <div key={toolCallId}>
                      {/* @ts-expect-error: // TODO: fix this */}
                      <StockChartMessage result={output} args={input} />
                    </div>
                  );
                }
              }

              if (type === 'tool-codeInterpreter') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <CodeInterpreterMessage result={null} args={input} />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output, input } = part;
                  return (
                    <div key={toolCallId}>
                      {/* @ts-expect-error: // TODO: fix this */}
                      <CodeInterpreterMessage result={output} args={input} />
                    </div>
                  );
                }
              }

              if (type === 'tool-generateImage') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <GeneratedImage args={input} isLoading={true} />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output, input } = part;
                  return (
                    <div key={toolCallId}>
                      <GeneratedImage result={output} args={input} />
                    </div>
                  );
                }
              }

              if (type === 'tool-deepResearch') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  // Should we place research updates here?
                  return null;
                }

                if (state === 'output-available') {
                  const { output, input } = part;
                  const shouldShowFullPreview = isLastArtifact(toolCallId);
                  if (output.format === 'report') {
                    return (
                      <div key={toolCallId}>
                        {shouldShowFullPreview ? (
                          <DocumentPreview
                            isReadonly={isReadonly}
                            result={output}
                            args={input}
                            messageId={message.id}
                            type="create"
                          />
                        ) : (
                          <DocumentToolResult
                            type="create"
                            result={output}
                            isReadonly={isReadonly}
                            messageId={message.id}
                          />
                        )}
                      </div>
                    );
                  }
                }
              }
            })}
            <SourcesAnnotations
              parts={message.parts}
              key={`sources-annotations-${message.id}`}
            />
            <MessageActions
              key={`action-${message.id}`}
              chatId={chatId}
              message={message}
              vote={vote}
              isLoading={isLoading}
              isReadOnly={isReadonly}
              chatHelpers={chatHelpers}
            />
          </div>
        </div>
        <ImageModal
          isOpen={imageModal.isOpen}
          onClose={handleImageModalClose}
          imageUrl={imageModal.imageUrl}
          imageName={imageModal.imageName}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (prevProps.chatHelpers !== nextProps.chatHelpers) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (!equal(prevProps.lastArtifact, nextProps.lastArtifact)) return false;
    if (prevProps.parentMessageId !== nextProps.parentMessageId) return false;

    return true;
  },
);
