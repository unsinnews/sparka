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
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { toast } from 'sonner';
import { useTRPC } from '@/trpc/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMessageTree } from '@/providers/message-tree-provider';

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [_, copyToClipboard] = useCopyToClipboard();
  const { data: session } = useSession();
  const { getMessageSiblingInfo, navigateToSibling } = useMessageTree();

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

  if (isLoading) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-1 h-fit text-muted-foreground"
              variant="outline"
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
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        {hasSiblings && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="py-1 px-1 h-fit text-muted-foreground"
                  variant="outline"
                  onClick={() => navigateToSibling(message.id, 'prev')}
                  disabled={siblingInfo.siblingIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous version</TooltipContent>
            </Tooltip>

            <div className="flex items-center justify-center px-0.5 py-1 h-fit text-xs text-muted-foreground rounded-md bg-background ">
              {siblingInfo.siblingIndex + 1}/{siblingInfo.siblings.length}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="py-1 px-1 h-fit text-muted-foreground"
                  variant="outline"
                  onClick={() => navigateToSibling(message.id, 'next')}
                  disabled={
                    siblingInfo.siblingIndex === siblingInfo.siblings.length - 1
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next version</TooltipContent>
            </Tooltip>
          </>
        )}

        {message.role === 'assistant' && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="message-upvote"
                  className="py-1 px-1 h-fit text-muted-foreground !pointer-events-auto"
                  disabled={vote?.isUpvoted || !session?.user}
                  variant="outline"
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
                  <ThumbUpIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upvote Response</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="message-downvote"
                  className="py-1 px-1 h-fit text-muted-foreground !pointer-events-auto"
                  variant="outline"
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
                  <ThumbDownIcon />
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
    return true;
  },
);
