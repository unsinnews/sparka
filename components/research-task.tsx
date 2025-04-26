import { motion } from 'framer-motion';
import {
  Search,
  FileText,
  BookA,
  Sparkles,
  Loader2,
  SearchIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { XLogo } from '@phosphor-icons/react/XLogo';
import type { StreamUpdate } from '@/lib/ai/tools/research-updates-schema';
import { WebSourceBadge } from './source-badge';

const updateName = {
  plan: 'Research Plan',
  web: 'Web Search',
  academic: 'Academic Search',
  progress: 'Progress',
  'gap-search': 'Gap Search',
  thoughts: 'Thoughts',
  x: 'X Search',
} as const;
const icons = {
  plan: Search,
  web: FileText,
  academic: BookA,
  progress: Loader2,
  'gap-search': Search,
  thoughts: Sparkles,
  x: XLogo,
} as const;

export const ResearchTask = ({
  update,
  isExpanded,
  onToggle,
  id,
}: {
  update: StreamUpdate;
  isExpanded: boolean;
  onToggle: () => void;
  id: string;
}) => {
  const isGapSearch = update.id.startsWith('gap-search');
  const Icon = isGapSearch ? icons['gap-search'] : icons[update.type];

  return (
    <div id={id} className="group">
      <div className="flex items-center gap-2">
        {/* <Icon className="w-4 h-4 text-neutral-500" /> */}
        <p className="text-sm font-medium">{updateName[update.type]}</p>
      </div>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: 'auto',
          opacity: 1,
          transition: {
            height: { duration: 0.2, ease: 'easeOut' },
            opacity: { duration: 0.15, delay: 0.05 },
          },
        }}
        exit={{
          height: 0,
          opacity: 0,
          transition: {
            height: { duration: 0.2, ease: 'easeIn' },
            opacity: { duration: 0.1 },
          },
        }}
      >
        <div className="pl-8 pr-2 py-2 space-y-2">
          {update.type === 'web' && update.subqueries && (
            <div className="flex flex-wrap gap-2">
              {update.subqueries.map((query, idx) => (
                <Badge
                  key={`search-query-${idx}`}
                  variant="outline"
                  className="flex items-center gap-1 bg-muted "
                >
                  <SearchIcon className="size-3.5" />
                  {/* // TODO: Make this sizewresponsive or accomodate long text in another manner */}
                  <span className="truncate max-w-[300px]">{query}</span>
                </Badge>
              ))}
            </div>
          )}
          size
          {/* Search Results: Show only when completed and results exist */}
          {update.type === 'web' &&
            update.status === 'completed' &&
            update.results && (
              <div className="flex flex-wrap gap-2">
                {update.type === 'web' &&
                  update.results.map((result, idx) => (
                    <WebSourceBadge key={`web-result-${idx}`} result={result} />
                  ))}
              </div>
            )}
          {/* Search Loading State */}
          {update.type === 'web' && update.status === 'running' && (
            <div className="py-2">
              <div className="flex items-center gap-3">
                <Loader2 className="size-4 text-neutral-500 animate-spin" />
                <p className="text-xsize-neutral-500">Searching the web...</p>
              </div>
            </div>
          )}
          {/* {Thoughts} */}
          {update.type === 'thoughts' && (
            <div className="space-y-2">
              {update.thoughtItems.map((thought, idx) => (
                <div className="space-y-2" key={idx}>
                  <p className="text-base font-medium">
                    {thought.header || 'Thought'}
                  </p>
                  <p className="text-sm text-foreground font-light">
                    {thought.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
