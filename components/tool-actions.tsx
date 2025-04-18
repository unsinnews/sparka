import { FileText, BookA } from 'lucide-react';
import { XLogo } from '@phosphor-icons/react';
import {
  ToolActionContainer,
  ToolActionKind,
  ToolActionContent,
} from './tool-action';
import { Tweet } from 'react-tweet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  WebSearchUpdate,
  XSearchUpdate,
} from '@/lib/ai/tools/research-updates-schema';
import { getFaviconUrl } from '@/lib/url-utils';

// Base interface for all tool actions
interface BaseToolActionProps {
  index?: number;
}

// Web tool action for a single result
export const WebToolAction = ({
  result,
}: BaseToolActionProps & {
  result: NonNullable<WebSearchUpdate['results']>[number];
}) => {
  if (!result) return null;

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=128`;

  return (
    <ToolActionContainer href={result.url}>
      <ToolActionKind
        icon={<FileText className="h-4 w-4 text-foreground/80" />}
        name="Reading Web"
      />
      <ToolActionContent title={result.title} faviconUrl={faviconUrl} />
    </ToolActionContainer>
  );
};

// Academic tool action for a single result
export const AcademicToolAction = ({
  result,
}: BaseToolActionProps & {
  result: NonNullable<WebSearchUpdate['results']>[number];
}) => {
  if (!result) return null;

  const faviconUrl = getFaviconUrl(result);

  return (
    <ToolActionContainer href={result.url}>
      <ToolActionKind
        icon={<BookA className="h-4 w-4 text-foreground/80" />}
        name="Reading Academic"
      />
      <ToolActionContent title={result.title} faviconUrl={faviconUrl} />
    </ToolActionContainer>
  );
};

// X tool action for a single result with tweet display on hover/click
export const XToolAction = ({
  result,
}: BaseToolActionProps & {
  result: NonNullable<XSearchUpdate['results']>[number];
}) => {
  if (!result) return null;

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=128`;

  // If there's a tweetId, wrap in a tooltip
  if (result.tweetId) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <ToolActionContainer href={result.url} className="cursor-pointer">
            <ToolActionKind
              icon={<XLogo className="h-4 w-4 text-foreground/80" />}
              name="Reading X"
            />
            <ToolActionContent title={result.title} faviconUrl={faviconUrl} />
          </ToolActionContainer>
        </TooltipTrigger>
        <TooltipContent className="w-80 p-0" sideOffset={5}>
          <div className="p-2">
            <Tweet id={result.tweetId} />
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Regular X link without tweet
  return (
    <ToolActionContainer href={result.url}>
      <ToolActionKind
        icon={<XLogo className="h-4 w-4 text-foreground/80" />}
        name="Reading X"
      />
      <ToolActionContent title={result.title} faviconUrl={faviconUrl} />
    </ToolActionContainer>
  );
};
