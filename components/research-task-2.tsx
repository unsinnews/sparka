import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  BookA,
  Sparkles,
  Loader2,
  ChevronDown,
  SearchIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { XLogo } from '@phosphor-icons/react/XLogo';
import type { StreamUpdate } from '@/lib/ai/tools/research-updates-schema';
import type { AnalysisUpdate } from '@/lib/ai/tools/research-updates-schema';
import { AcademicToolAction, XToolAction } from '@/components/tool-actions';
import {
  AcademicSourceBadge,
  WebSourceBadge,
  XSourceBadge,
} from './source-badge';

type AnalysisFindingItem = NonNullable<AnalysisUpdate['findings']>[number];

const updateName = {
  plan: 'Research Plan',
  web: 'Web Search',
  academic: 'Academic Search',
  progress: 'Progress',
  analysis: 'Analysis',
  'gap-search': 'Gap Search',
  thoughts: 'Thoughts',
  x: 'X Search',
} as const;
const icons = {
  plan: Search,
  web: FileText,
  academic: BookA,
  progress: Loader2,
  analysis: Sparkles,
  'gap-search': Search,
  thoughts: Sparkles,
  x: XLogo,
} as const;

export const ResearchTask2 = ({
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
                            <Badge variant="secondary" className="text-[10px]">
                              web
                            </Badge>
                          )}
                          {query.source === 'academic' && (
                            <Badge variant="secondary" className="text-[10px]">
                              academic
                            </Badge>
                          )}
                          {query.source === 'both' && (
                            <Badge variant="secondary" className="text-[10px]">
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
                        <p className="text-sm font-medium">{analysis.type}</p>
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

          {(update.type === 'web' ||
            update.type === 'x' ||
            update.type === 'academic') &&
            update.subqueries && (
              <div className="flex flex-wrap gap-2">
                {update.subqueries.map((query, idx) => (
                  <Badge
                    key={`search-query-${idx}`}
                    variant="outline"
                    className="flex items-center gap-1 bg-muted "
                  >
                    <SearchIcon className="w-3.5 h-3.5" />
                    {/* // TODO: Make this max w more responsive or accomodate long text in another manner */}
                    <span className="truncate max-w-[300px]">{query}</span>
                  </Badge>
                ))}
              </div>
            )}

          {/* Search Results: Show only when completed and results exist */}
          {(update.type === 'web' ||
            update.type === 'academic' ||
            update.type === 'x') &&
            update.status === 'completed' &&
            update.results && (
              <div className="flex flex-wrap gap-2">
                {update.type === 'web' &&
                  update.results.map((result, idx) => (
                    <WebSourceBadge key={`web-result-${idx}`} result={result} />
                  ))}
                {update.type === 'academic' &&
                  update.results.map((result, idx) => (
                    <AcademicSourceBadge
                      key={`academic-result-${idx}`}
                      result={result}
                    />
                  ))}
                {update.type === 'x' &&
                  update.results.map((result, idx) => (
                    <XSourceBadge key={`x-result-${idx}`} result={result} />
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
