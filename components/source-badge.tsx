import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Favicon } from './favicon';
import { getDomainFromUrl, getFaviconUrl } from '@/lib/url-utils';
import type { SearchResultItem } from '@/components/reason-search-sources-and-analysis';

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
            <span>{getDomainFromUrl(result.url)}</span>
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3 space-y-1">
        <div className="flex items-center gap-2">
          <Favicon url={getFaviconUrl(result)} className="w-4 h-4" />
          <p className="font-semibold truncate">{result.title}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">{result.url}</p>
      </TooltipContent>
    </Tooltip>
  );
}
