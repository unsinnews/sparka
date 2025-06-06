import { PreviewMessage } from './message';
import { Overview } from './overview';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { YourUIMessage } from '@/lib/ai/tools/annotations';
import { ResponseErrorMessage } from './response-error-message';
import { ThinkingMessage } from './thinking-message';
import type { ChatRequestData } from '@/app/(chat)/api/chat/route';
import { cn, findLastArtifact } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStickToBottom } from 'use-stick-to-bottom';
import { Button } from './ui/button';
import { ArrowDown } from 'lucide-react';

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
  const { scrollRef, contentRef, scrollToBottom, isNearBottom, state } =
    useStickToBottom();

  // Find the last artifact in all messages
  const lastArtifact = findLastArtifact(messages);

  return (
    <ScrollArea
      ref={scrollRef}
      className="flex flex-col flex-1 w-full"
      viewPortClassName=" [&>div]:!block"
    >
      <div
        ref={contentRef}
        className="flex flex-col px-2 sm:px-4 min-w-0 gap-6 pt-4 sm:max-w-2xl md:max-w-3xl container mx-auto"
      >
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

        <div className="shrink-0 min-w-[24px] min-h-[24px]" />
      </div>
      {/* Scroll to bottom button */}
      <div className="absolute bottom-4 right-4 flex justify-center items-center w-full">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'rounded-full shadow-lg bg-muted/60 hover:bg-muted z-10',
            state.isNearBottom && 'hidden',
          )}
          onClick={() => scrollToBottom()}
        >
          <ArrowDown className="size-4" />
        </Button>
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
