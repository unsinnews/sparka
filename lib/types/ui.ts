import type { UIMessage } from 'ai';
import type { MessageAnnotation } from '../ai/tools/annotations';

export interface UIChat {
  id: string;
  createdAt: Date;
  title: string;
  visibility: 'private' | 'public';
  userId: string;
}

export type YourUIMessage = Omit<UIMessage, 'annotations'> & {
  annotations?: MessageAnnotation[];
  isPartial?: boolean;
  parentMessageId: string | null;
};
