'use client';

import { memo } from 'react';
import { Response } from './ai-elements/response';
import {
  useMessagePartByPartIdx,
  useMessagePartTypesById,
} from '@/lib/stores/chat-store';

export const TextMessagePart = memo(function TextMessagePart({
  messageId,
  partIdx,
}: {
  messageId: string;
  partIdx: number;
}) {
  const types = useMessagePartTypesById(messageId);
  const part = useMessagePartByPartIdx(messageId, partIdx, 'text');
  const isLast = partIdx === types.length - 1;

  return <Response>{part.text}</Response>;
});
