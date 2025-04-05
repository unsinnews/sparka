import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  BookA,
  Sparkles,
  ChevronRight,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { XLogo } from '@phosphor-icons/react';
import type { StreamUpdate } from '@/lib/ai/tools/research-updates-schema';
import type { AnalysisUpdate } from '@/lib/ai/tools/research-updates-schema';

import {
  WebToolAction,
  AcademicToolAction,
  XToolAction,
} from '@/components/tool-actions';

type AnalysisFindingItem = NonNullable<AnalysisUpdate['findings']>[number];

export const ResearchStep = ({
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
    analysis: Sparkles,
    'gap-search': Search,
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
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-50 dark:text-neutral-50'
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
                {update.title ||
                  (update.type === 'plan'
                    ? 'Research Plan'
                    : update.type === 'x'
                      ? 'X Search'
                      : update.type === 'analysis'
                        ? update.analysisType || 'Analysis'
                        : 'Analysis')}
              </span>
              {update.type === 'plan' && update.plan && (
                <span className="text-xs text-neutral-500 flex-shrink-0">
                  ({update.plan.search_queries.length} queries,{' '}
                  {update.plan.required_analyses.length} analyses )
                </span>
              )}
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
              {/* Plan Details */}
              {update.type === 'plan' && update.plan && (
                <>
                  <div className="space-y-2">
                    {update.plan.search_queries.map((query, idx) => (
                      <motion.div
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="p-2 rounded-lg "
                      >
                        <div className="flex items-start gap-2">
                          <Search className="h-3.5 w-3.5 text-neutral-500 mt-1" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">
                                {query.query}
                              </span>
                              {query.source === 'web' && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  web
                                </Badge>
                              )}
                              {query.source === 'academic' && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  academic
                                </Badge>
                              )}
                              {query.source === 'both' && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  web + academic
                                </Badge>
                              )}
                              {query.source === 'x' && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] flex items-center gap-0.5"
                                >
                                  <span>X</span>
                                </Badge>
                              )}
                              {query.source === 'all' && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] flex items-center gap-0.5"
                                >
                                  <span>all sources</span>
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                              {query.rationale}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {update.plan.required_analyses.map((analysis, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="p-2 rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-neutral-500 mt-1" />
                          <div>
                            <p className="text-sm font-medium">
                              {analysis.type}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {analysis.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* Search Results: Show only when completed and results exist */}
              {(update.type === 'web' ||
                update.type === 'academic' ||
                update.type === 'x') &&
                update.status === 'completed' &&
                update.results && (
                  <div className="space-y-2">
                    {update.type === 'web' &&
                      update.results.map((result, idx) => (
                        <WebToolAction
                          key={`web-result-${idx}`}
                          result={result}
                        />
                      ))}
                    {update.type === 'academic' &&
                      update.results.map((result, idx) => (
                        <AcademicToolAction
                          key={`academic-result-${idx}`}
                          result={result}
                        />
                      ))}
                    {update.type === 'x' &&
                      update.results.map((result, idx) => (
                        <XToolAction key={`x-result-${idx}`} result={result} />
                      ))}
                  </div>
                )}

              {/* Search Loading State */}
              {(update.type === 'web' ||
                update.type === 'academic' ||
                update.type === 'x') &&
                update.status === 'running' && (
                  <div className="py-2">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
                      <p className="text-xs text-neutral-500">
                        {update.type === 'x'
                          ? 'Searching X...'
                          : update.type === 'web'
                            ? 'Searching the web...'
                            : 'Searching academic sources...'}
                      </p>
                    </div>
                  </div>
                )}

              {/* Analysis Results: Show only when completed and findings exist */}
              {update.type === 'analysis' &&
                update.status === 'completed' &&
                update.findings && (
                  <div className="space-y-2">
                    {update.findings.map(
                      (finding: AnalysisFindingItem, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="py-1.5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1.5">
                              <div
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  finding.confidence > 0.7
                                    ? 'bg-neutral-900 dark:bg-neutral-50'
                                    : 'bg-neutral-400 dark:bg-neutral-600',
                                )}
                              />
                            </div>
                            <div className="space-y-2 flex-1">
                              <p className="text-sm font-medium">
                                {finding.insight}
                              </p>
                              {finding.evidence.length > 0 && (
                                <div className="pl-4 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-1.5">
                                  {finding.evidence.map(
                                    (evidence: string, i: number) => (
                                      <p
                                        key={i}
                                        className="text-xs text-neutral-500"
                                      >
                                        {evidence}
                                      </p>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ),
                    )}
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
