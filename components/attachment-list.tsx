'use client';

import type { Attachment } from 'ai';
import { PreviewAttachment } from './preview-attachment';
import { cn } from '@/lib/utils';

interface AttachmentListProps {
  attachments: Array<Attachment>;
  uploadQueue?: Array<string>;
  onRemove?: (attachment: Attachment) => void;
  testId?: string;
  className?: string;
}

export function AttachmentList({
  attachments,
  uploadQueue = [],
  onRemove,
  testId = 'attachments',
  className,
}: AttachmentListProps) {
  if (attachments.length === 0 && uploadQueue.length === 0) {
    return null;
  }

  return (
    <div
      data-testid={testId}
      className={cn('flex flex-row gap-2 overflow-x-auto items-end', className)}
    >
      {attachments.map((attachment) => (
        <PreviewAttachment
          key={attachment.url}
          attachment={attachment}
          onRemove={onRemove ? () => onRemove(attachment) : undefined}
        />
      ))}

      {uploadQueue.map((filename) => (
        <PreviewAttachment
          key={filename}
          attachment={{
            url: '',
            name: filename,
            contentType: '',
          }}
          isUploading={true}
        />
      ))}
    </div>
  );
}
