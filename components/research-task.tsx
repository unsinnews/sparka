import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  FileText,
  BookA,
  Sparkles,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { XLogo } from '@phosphor-icons/react/XLogo';
import type { StreamUpdate } from '@/lib/ai/tools/research-updates-schema';
import { WebSourceBadge } from './source-badge';

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
  const icons = {
    plan: Search,
    web: FileText,
    academic: BookA,
    progress: Loader2,
    'gap-search': Search,
    thoughts: Sparkles,
    x: XLogo,
  } as const;

  const isGapSearch = update.id.startsWith('gap-search');
  const Icon = isGapSearch ? icons['gap-search'] : icons[update.type];

  return (
    <div id={id} className="group">
      <button type="button" onClick={onToggle}>
        <motion.div
          className={cn(
            'flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
          )}
          layout
        >
          <div
            className={cn(
              'flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors duration-300 relative z-10 border bg-neutral-50/50 dark:bg-neutral-900/50',
              update.status === 'completed'
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-50'
                : 'border-neutral-400 text-neutral-500 dark:border-neutral-600 dark:text-neutral-400',
            )}
          >
            {update.status === 'running' ? (
              <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />
            ) : (
              <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            )}
          </div>

          <div className="flex items-center justify-between flex-1 text-left min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium truncate">
                {update.title}
              </span>
              {update.message && (
                <span className="text-xs text-neutral-500 truncate">
                  {isGapSearch ? (
                    <span className="flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      {update.message}
                    </span>
                  ) : (
                    update.message
                  )}
                </span>
              )}
            </div>

            <ChevronDown
              className={cn(
                'h-4 w-4 text-neutral-400 flex-shrink-0 ml-2 transition-transform',
                isExpanded && 'rotate-180',
              )}
            />
          </div>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
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
            className="overflow-hidden"
          >
            <div className="pl-8 pr-2 py-2 space-y-2">
              {/* Search Results: Show only when completed and results exist */}
              {update.type === 'web' &&
                update.status === 'completed' &&
                update.results && (
                  <div className="flex flex-wrap gap-2">
                    {update.type === 'web' &&
                      update.results.map((result, idx) => (
                        <WebSourceBadge
                          key={`web-result-${idx}`}
                          result={result}
                        />
                      ))}
                  </div>
                )}

              {/* Search Loading State */}
              {update.type === 'web' && update.status === 'running' && (
                <div className="py-2">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
                    <p className="text-xs text-neutral-500">
                      Searching the web...
                    </p>
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
        )}
      </AnimatePresence>
    </div>
  );
};
