'use client';

import { TextShimmerLoader } from '@/components/ui/loader';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  return (
    <Reasoning isStreaming={isLoading} defaultOpen className="mb-0">
      <ReasoningTrigger data-testid="message-reasoning-toggle">
        <div className="flex flex-row items-center gap-2">
          {isLoading ? (
            <TextShimmerLoader text="Reasoning" className="text-base" />
          ) : (
            <div className="font-medium text-base">
              Reasoned for a few seconds
            </div>
          )}
        </div>
      </ReasoningTrigger>
      <ReasoningContent
        data-testid="message-reasoning"
        className="pl-4 text-muted-foreground border-l flex flex-col gap-4 mt-0 data-[state=open]:mt-3"
      >
        {reasoning}
      </ReasoningContent>
    </Reasoning>
  );
}
