import React from 'react';
import { FileText, BookA } from 'lucide-react';
import { XLogo } from '@phosphor-icons/react';
import {
  ToolActionContainer,
  ToolActionKind,
  ToolActionContent,
} from './tool-action';

interface ToolActionProps {
  title: string;
  url: string;
  index?: number;
}

export const WebToolAction = ({ title, url, index = 0 }: ToolActionProps) => {
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;

  return (
    <ToolActionContainer href={url} index={index}>
      <ToolActionKind
        icon={<FileText className="h-4 w-4 text-foreground/80" />}
        name="Reading Web"
      />
      <ToolActionContent title={title} faviconUrl={faviconUrl} />
    </ToolActionContainer>
  );
};

export const AcademicToolAction = ({
  title,
  url,
  index = 0,
}: ToolActionProps) => {
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;

  return (
    <ToolActionContainer href={url} index={index}>
      <ToolActionKind
        icon={<BookA className="h-4 w-4 text-foreground/80" />}
        name="Reading Academic"
      />
      <ToolActionContent title={title} faviconUrl={faviconUrl} />
    </ToolActionContainer>
  );
};

export const XToolAction = ({ title, url, index = 0 }: ToolActionProps) => {
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;

  return (
    <ToolActionContainer href={url} index={index}>
      <ToolActionKind
        icon={<XLogo className="h-4 w-4 text-foreground/80" />}
        name="Reading X"
      />
      <ToolActionContent title={title} faviconUrl={faviconUrl} />
    </ToolActionContainer>
  );
};
