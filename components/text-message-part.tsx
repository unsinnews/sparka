'use client';

import { memo } from 'react';
import { Response } from './ai-elements/response';
import { useMessagePartTypesById } from '@/lib/stores/chat-store';

export const TextMessagePart = memo(function TextMessagePart({
  messageId,
  partIdx,
}: {
  messageId: string;
  partIdx: number;
}) {
  const types = useMessagePartTypesById(messageId);
  const isLast = partIdx === types.length - 1;

  return (
    <div className="flex flex-col gap-4 w-full">
      <Response
        messageId={messageId}
        partIdx={partIdx}
        parseIncompleteMarkdown={isLast}
      />
    </div>
  );
});
