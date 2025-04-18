import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Favicon } from './favicon';
import { getDomainFromUrl, getFaviconUrl } from '@/lib/url-utils';
import type {
  SearchResultItem,
  XSearchResultItem,
  AcademicSearchResultItem,
} from '@/components/reason-search-sources-and-analysis';
import { XLogo } from '@phosphor-icons/react';
import { Tweet } from 'react-tweet';

export function WebSourceBadge({ result }: { result: SearchResultItem }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={result.url} target="_blank" rel="noopener noreferrer">
          <Badge
            variant="secondary"
            className="text-[10px] gap-1 max-w-[200px] truncate text-xs"
          >
            <Favicon url={getFaviconUrl(result)} className="w-3 h-3" />
            <span className="italic">{getDomainFromUrl(result.url)}</span>
            <span className="text-xs text-muted-foreground">
              {result.title}
            </span>
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3 space-y-1">
        <div className="flex items-center gap-2">
          <Favicon url={getFaviconUrl(result)} className="w-4 h-4" />
          <p className="font-semibold ">{result.title}</p>
        </div>
        <p className="text-xs text-muted-foreground ">{result.url}</p>
        <p className="text-xs text-muted-foreground line-clamp-5 ">
          {result.content}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function AcademicSourceBadge({
  result,
}: {
  result: AcademicSearchResultItem;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={result.url} target="_blank" rel="noopener noreferrer">
          <Badge
            variant="secondary"
            className="text-[10px] gap-1 max-w-[200px] truncate text-xs"
          >
            <Favicon url={getFaviconUrl(result)} className="w-3 h-3" />
            <span className="italic">{getDomainFromUrl(result.url)}</span>
            <span className="text-xs text-muted-foreground">
              {result.title}
            </span>
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3 space-y-1">
        <div className="flex items-center gap-2">
          <Favicon
            url={getFaviconUrl(result)}
            className="w-4 h-4 flex-shrink-0"
          />
          <p className="font-semibold">{result.title}</p>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-5 ">
          {result.content}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function XSourceBadge({ result }: { result: XSearchResultItem }) {
  const url = result.url;
  const title = result.title;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={url} target="_blank" rel="noopener noreferrer">
          <Badge
            variant="secondary"
            className="text-[10px] gap-1 max-w-[200px] truncate text-xs"
          >
            <XLogo className="w-3 h-3 flex-shrink-0" />
            <span>{result.title}</span>
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3 space-y-1">
        {result.tweetId ? (
          <Tweet id={result.tweetId} />
        ) : (
          <div className="flex items-center gap-2">
            <XLogo className="w-4 h-4" />
            <p className="font-semibold truncate">{title}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground truncate">{url}</p>
      </TooltipContent>
    </Tooltip>
  );
}
