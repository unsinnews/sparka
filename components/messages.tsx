import { PreviewMessage } from './message';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import { ResponseErrorMessage } from './response-error-message';
import { ThinkingMessage } from './thinking-message';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStickToBottom } from 'use-stick-to-bottom';
import { Button } from './ui/button';
import { ArrowDown } from 'lucide-react';
import { Greeting } from './greeting';
import {
  useChatId,
  useChatStatus,
  useMessageIds,
} from '@/lib/stores/chat-store';

interface PureMessagesInternalProps {
  votes: Array<Vote> | undefined;
  isReadonly: boolean;
}

const PureMessagesInternal = memo(function PureMessagesInternal({
  votes,
  isReadonly,
}: PureMessagesInternalProps) {
  const chatId = useChatId();
  const status = useChatStatus();
  const messageIds = useMessageIds();

  // TODO: Verify if this is needed ai sdk v5
  // useDataStream();

  if (!chatId) {
    return null;
  }

  return (
    <>
      {messageIds.length === 0 && <Greeting />}

      {messageIds.map((messageId, index) => (
        <PreviewMessage
          key={messageId}
          messageId={messageId}
          isLoading={status === 'streaming' && messageIds.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === messageId)
              : undefined
          }
          parentMessageId={index > 0 ? messageIds[index - 1] : null}
          isReadonly={isReadonly}
        />
      ))}

      {status === 'submitted' && messageIds.length > 0 && (
        // messages[messages.length - 1].role === 'user' &&
        <ThinkingMessage />
      )}

      {status === 'error' && <ResponseErrorMessage />}

      <div className="shrink-0 min-w-[24px] min-h-[24px]" />
    </>
  );
});

export interface MessagesProps {
  votes: Array<Vote> | undefined;
  isReadonly: boolean;
  isVisible: boolean;
  onModelChange?: (modelId: string) => void;
}

function PureMessages({ votes, isReadonly, isVisible }: MessagesProps) {
  const { scrollRef, contentRef, scrollToBottom, isNearBottom, state } =
    useStickToBottom();

  return (
    <ScrollArea
      ref={scrollRef}
      className="flex flex-col flex-1 w-full"
      viewPortClassName=" [&>div]:!block"
    >
      <div
        ref={contentRef}
        className="flex flex-col px-2 sm:px-4 min-w-0 gap-6 pt-4 sm:max-w-2xl md:max-w-3xl container mx-auto h-full"
      >
        <PureMessagesInternal votes={votes} isReadonly={isReadonly} />
      </div>
      {/* Scroll to bottom button */}
      <ScrollToBottomButton
        isNearButton={isNearBottom}
        onClick={scrollToBottom}
      />
    </ScrollArea>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.votes !== nextProps.votes) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  // NOTE: isVisible avoids re-renders when the messages aren't visible
  if (prevProps.isVisible !== nextProps.isVisible) return false;

  return true;
});

const ScrollToBottomButton = memo(
  function ScrollToBottomButton({
    isNearButton,
    onClick,
  }: {
    isNearButton: boolean;
    onClick: () => void;
  }) {
    return (
      <div className="absolute bottom-4 flex justify-center items-center w-full">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'rounded-full shadow-lg bg-background/80 hover:bg-muted z-10',
            isNearButton && 'hidden',
          )}
          onClick={onClick}
        >
          <ArrowDown className="size-4" />
        </Button>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.isNearButton === nextProps.isNearButton,
);
