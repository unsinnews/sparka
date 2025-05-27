'use client';

import { memo } from 'react';
import { FileIcon } from './icons';

interface ReadDocumentProps {
  result?: {
    id: string;
    title: string;
    kind: string;
    content: string;
  };
}

function PureReadDocument({ result }: ReadDocumentProps) {
  if (!result) return null;

  return (
    <div className="bg-background border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start">
      <div className="text-muted-foreground mt-1">
        <FileIcon />
      </div>
      <div className="text-left">
        <div className="text-sm text-muted-foreground">Read document</div>
        <div className="font-medium">&ldquo;{result.title}&rdquo;</div>
      </div>
    </div>
  );
}

export const ReadDocument = memo(PureReadDocument, () => true);
