import type { Message } from 'ai';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo, useCallback } from 'react';
import equal from 'fast-deep-equal';
import { toast } from 'sonner';
import { useTRPC } from '@/trpc/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import { useMessageTree } from '@/providers/message-tree-provider';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useChatInput } from '@/providers/chat-input-provider';

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  isReadOnly,
  chatHelpers,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  isReadOnly: boolean;
  chatHelpers?: UseChatHelpers;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [_, copyToClipboard] = useCopyToClipboard();
  const { data: session } = useSession();
  const {
    getMessageSiblingInfo,
    navigateToSibling,
    setLastMessageId,
    getParentMessage,
  } = useMessageTree();
  const { selectedModelId } = useChatInput();

  const isAuthenticated = !!session?.user;

  const voteMessageMutation = useMutation(
    trpc.vote.voteMessage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.vote.getVotes.queryKey({ chatId }),
        });
      },
    }),
  );

  // Get sibling info for navigation
  const siblingInfo = getMessageSiblingInfo(message.id);
  const hasSiblings = siblingInfo && siblingInfo.siblings.length > 1;

  // Function to handle retry by finding parent user message and resending
  const handleRetry = useCallback(() => {
    if (!chatHelpers) {
      toast.error('Cannot retry this message');
      return;
    }

    // Get parent message from message tree
    const parentMessage = getParentMessage(message.id);

    if (!parentMessage || parentMessage.role !== 'user') {
      toast.error('Cannot find the user message to retry');
      return;
    }

    // Get grandparent message ID
    const grandParentMessage = getParentMessage(parentMessage.id);
    const grandParentMessageId = grandParentMessage?.id || null;

    // Find the parent message index in chatHelpers.messages for slicing

    // Remove the current assistant message and any messages after it
    chatHelpers.setMessages((messages) => {
      const parentMessageIdx = messages.findIndex(
        (msg) => msg.id === parentMessage.id,
      );
      if (parentMessageIdx === -1) {
        toast.error('Cannot find the user message to retry');
        return messages;
      }
      return messages.slice(0, parentMessageIdx);
    });

    // Resend the parent user message
    // TODO: This should obtain data from the parent message
    chatHelpers.append(parentMessage, {
      data: {
        deepResearch: false,
        webSearch: false,
        reason: false,
        parentMessageId: grandParentMessageId,
      },
      body: {
        selectedChatModel: selectedModelId,
      },
    });

    setLastMessageId(parentMessage.id);

    toast.success('Retrying message...');
  }, [
    chatHelpers,
    getParentMessage,
    message.id,
    setLastMessageId,
    selectedModelId,
  ]);

  if (isLoading) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-accent-foreground hover:bg-accent h-7 w-7 p-0"
              onClick={async () => {
                const textFromParts = message.parts
                  ?.filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('\n')
                  .trim();

                if (!textFromParts) {
                  toast.error("There's no text to copy!");
                  return;
                }

                await copyToClipboard(textFromParts);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        {message.role === 'assistant' && !isReadOnly && chatHelpers && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-accent-foreground hover:bg-accent h-7 w-7 p-0"
                onClick={handleRetry}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Retry</TooltipContent>
          </Tooltip>
        )}

        {hasSiblings && (
          <div className="flex gap-1 items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-accent-foreground hover:bg-accent h-7 w-7 px-0"
                  onClick={() => navigateToSibling(message.id, 'prev')}
                  disabled={siblingInfo.siblingIndex === 0}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous version</TooltipContent>
            </Tooltip>

            <span className="text-muted-foreground text-xs">
              {siblingInfo.siblingIndex + 1}/{siblingInfo.siblings.length}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-accent-foreground hover:bg-accent h-7 w-7 px-0"
                  onClick={() => navigateToSibling(message.id, 'next')}
                  disabled={
                    siblingInfo.siblingIndex === siblingInfo.siblings.length - 1
                  }
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next version</TooltipContent>
            </Tooltip>
          </div>
        )}

        {message.role === 'assistant' && !isReadOnly && isAuthenticated && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="message-upvote"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-accent-foreground hover:bg-accent h-7 w-7 p-0 !pointer-events-auto"
                  disabled={vote?.isUpvoted || !isAuthenticated}
                  onClick={() => {
                    toast.promise(
                      voteMessageMutation.mutateAsync({
                        chatId,
                        messageId: message.id,
                        type: 'up' as const,
                      }),
                      {
                        loading: 'Upvoting Response...',
                        success: 'Upvoted Response!',
                        error: 'Failed to upvote response.',
                      },
                    );
                  }}
                >
                  <ThumbUpIcon size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upvote Response</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="message-downvote"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-accent-foreground hover:bg-accent h-7 w-7 p-0 !pointer-events-auto"
                  disabled={(vote && !vote.isUpvoted) || !session?.user}
                  onClick={() => {
                    toast.promise(
                      voteMessageMutation.mutateAsync({
                        chatId,
                        messageId: message.id,
                        type: 'down' as const,
                      }),
                      {
                        loading: 'Downvoting Response...',
                        success: 'Downvoted Response!',
                        error: 'Failed to downvote response.',
                      },
                    );
                  }}
                >
                  <ThumbDownIcon size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Downvote Response</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.isReadOnly !== nextProps.isReadOnly) return false;
    return true;
  },
);
