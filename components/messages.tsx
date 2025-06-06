import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Overview } from './overview';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { YourUIMessage } from '@/lib/ai/tools/annotations';
import { ResponseErrorMessage } from './response-error-message';
import { ThinkingMessage } from './thinking-message';
import type { ChatRequestData } from '@/app/(chat)/api/chat/route';
import { findLastArtifact } from '@/lib/utils';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<YourUIMessage>;
  chatHelpers: UseChatHelpers;
  isReadonly: boolean;
  isArtifactVisible: boolean;
  selectedModelId: string;
  data: ChatRequestData;
  onModelChange?: (modelId: string) => void;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  chatHelpers,
  isReadonly,
  selectedModelId,
  data,
  onModelChange,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // Find the last artifact in all messages
  const lastArtifact = findLastArtifact(messages);

  return (
    <ScrollArea
      className="flex flex-1 w-full"
      viewPortClassName=" [&>div]:!block"
    >
      <div className="flex flex-col px-2 sm:px-4 min-w-0 gap-6 pt-4 max-w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-3xl container mx-auto">
        {messages.length === 0 && <Overview />}

        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={status === 'streaming' && messages.length - 1 === index}
            vote={
              votes
                ? votes.find((vote) => vote.messageId === message.id)
                : undefined
            }
            chatHelpers={chatHelpers}
            isReadonly={isReadonly}
            selectedModelId={selectedModelId}
            lastArtifact={lastArtifact}
            onModelChange={onModelChange}
          />
        ))}

        {status === 'submitted' &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

        {status === 'error' && (
          <ResponseErrorMessage
            chatHelpers={chatHelpers}
            messages={messages}
            data={data}
          />
        )}

        <div
          ref={messagesEndRef}
          className="shrink-0 min-w-[24px] min-h-[24px]"
        />
      </div>
    </ScrollArea>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;
  if (prevProps.chatHelpers !== nextProps.chatHelpers) return false;
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
  if (prevProps.data !== nextProps.data) return false;
  if (prevProps.onModelChange !== nextProps.onModelChange) return false;

  return true;
});
