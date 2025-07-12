import { useCallback } from 'react';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { UIMessage } from 'ai';

import { Button } from './ui/button';
import { useMessageTree } from '@/providers/message-tree-provider';
import { useChatInput } from '@/providers/chat-input-provider';
import type { ChatMessage } from '@/lib/ai/types';
import { useSetMessages, useChatMessages } from '@/lib/stores/chat-store';
import type { UseChatHelpers } from '@ai-sdk/react';

export function RetryButton({
  message,
  sendMessage,
}: {
  message: UIMessage;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
}) {
  const { getParentMessage, setLastMessageId } = useMessageTree();
  const { selectedModelId, selectedTools: data } = useChatInput();
  const setMessages = useSetMessages();
  const chatMessages = useChatMessages();

  const handleRetry = useCallback(() => {
    if (!sendMessage) {
      toast.error('Cannot retry this message');
      return;
    }

    // Get parent message from message tree
    const parentMessage = getParentMessage(message.id);

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
    // TODO: This should obtain data from the parent message
    sendMessage(parentMessage, {
      body: {
        data,
        selectedChatModel: selectedModelId,
      },
    });

    setLastMessageId(parentMessage.id);

    toast.success('Retrying message...');
  }, [
    data,
    sendMessage,
    getParentMessage,
    message.id,
    setLastMessageId,
    selectedModelId,
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
