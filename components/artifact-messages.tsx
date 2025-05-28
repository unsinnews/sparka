import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import type { Vote } from '@/lib/db/schema';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import type { UIArtifact } from './artifact';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { YourUIMessage } from '@/lib/ai/tools/annotations';
import { ResponseErrorMessage } from './response-error-message';
import { ThinkingMessage } from './thinking-message';
import type { ChatRequestData } from '@/app/(chat)/api/chat/route';

interface ArtifactMessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<YourUIMessage>;
  chatHelpers: UseChatHelpers;
  isReadonly: boolean;
  artifactStatus: UIArtifact['status'];
  selectedModelId: string;
  data: ChatRequestData;
}

function PureArtifactMessages({
  chatId,
  status,
  votes,
  messages,
  chatHelpers,
  isReadonly,
  selectedModelId,
  data,
}: ArtifactMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
    >
      {messages.map((message, index) => (
        <PreviewMessage
          chatId={chatId}
          key={message.id}
          message={message}
          isLoading={status === 'streaming' && index === messages.length - 1}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          chatHelpers={chatHelpers}
          isReadonly={isReadonly}
          selectedModelId={selectedModelId}
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
  );
}

function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps,
) {
  if (
    prevProps.artifactStatus === 'streaming' &&
    nextProps.artifactStatus === 'streaming'
  )
    return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.chatHelpers !== nextProps.chatHelpers) return false;

  return true;
}

export const ArtifactMessages = memo(PureArtifactMessages, areEqual);
