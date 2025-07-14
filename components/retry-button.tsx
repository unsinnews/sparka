import { useCallback } from 'react';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from './ui/button';
import { useMessageTree } from '@/providers/message-tree-provider';
import { useChatInput } from '@/providers/chat-input-provider';
import type { ChatMessage } from '@/lib/ai/types';
import { useSetMessages, useChatMessages } from '@/lib/stores/chat-store';
import type { UseChatHelpers } from '@ai-sdk/react';

export function RetryButton({
  messageId,
  sendMessage,
}: {
  messageId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
}) {
  const { getParentMessage } = useMessageTree();
  const { selectedTools: data } = useChatInput();
  const setMessages = useSetMessages();
  const chatMessages = useChatMessages();

  const handleRetry = useCallback(() => {
    if (!sendMessage) {
      toast.error('Cannot retry this message');
      return;
    }

    // Get parent message from message tree
    const parentMessage = getParentMessage(messageId);

    if (!parentMessage || parentMessage.role !== 'user') {
      toast.error('Cannot find the user message to retry');
      return;
    }

    // Find the parent message index in store messages for slicing
    const parentMessageIdx = chatMessages.findIndex(
      (msg) => msg.id === parentMessage.id,
    );
    if (parentMessageIdx === -1) {
      toast.error('Cannot find the user message to retry');
      return;
    }
    setMessages(chatMessages.slice(0, parentMessageIdx));

    // Resend the parent user message
    // TODO: This should obtain selectedTools from the parent message
    sendMessage(
      {
        ...parentMessage,
        metadata: {
          ...parentMessage.metadata,
          createdAt: parentMessage.metadata?.createdAt || new Date(),
          selectedModel: parentMessage.metadata?.selectedModel || '',
          parentMessageId: parentMessage.metadata?.parentMessageId || null,
        },
      },
      {
        body: {
          data,
        },
      },
    );

    toast.success('Retrying message...');
  }, [
    data,
    sendMessage,
    getParentMessage,
    messageId,
    setMessages,
    chatMessages,
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
