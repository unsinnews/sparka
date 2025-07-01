import { useCallback } from 'react';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { Message } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';

import { Button } from './ui/button';
import { useMessageTree } from '@/providers/message-tree-provider';
import { useChatInput } from '@/providers/chat-input-provider';

export function RetryButton({
  message,
  chatHelpers,
}: {
  message: Message;
  chatHelpers: UseChatHelpers;
}) {
  const { getParentMessage, setLastMessageId } = useMessageTree();
  const { selectedModelId } = useChatInput();

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

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-accent-foreground hover:bg-accent h-7 w-7 p-0"
      onClick={handleRetry}
    >
      <RefreshCcw className="h-3.5 w-3.5" />
    </Button>
  );
}
