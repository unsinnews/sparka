import type { UIMessage } from 'ai';
import type { MessageAnnotation } from '../ai/tools/annotations';
import type { YourToolInvocation } from '../ai/tools/tools';

export interface UIChat {
  id: string;
  createdAt: Date;
  title: string;
  visibility: 'private' | 'public';
  userId: string;
}


export type  YourToolInvovactionPart = {
  type: 'tool-invocation';
  toolInvocation: YourToolInvocation;
}
export type YourUIMessage = Omit<UIMessage, 'annotations' | 'createdAt' |   'parts'> & {
  annotations?: MessageAnnotation[];
  isPartial?: boolean;
  parentMessageId: string | null;
  createdAt: Date;
  parts: (Exclude<UIMessage['parts'][number], { type: 'tool-invocation' }> | YourToolInvovactionPart)[]
}
