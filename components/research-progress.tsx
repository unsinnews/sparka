import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  BookA,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Tweet } from 'react-tweet';
import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { XLogo } from '@phosphor-icons/react';
// Type-only imports
import type { StreamUpdate } from '@/lib/ai/tools/research-updates-schema';

// Runtime imports (used with z.infer)
import type {
  AnalysisUpdate,
  WebSearchUpdate,
  AcademicSearchUpdate,
  XSearchUpdate,
} from '@/lib/ai/tools/research-updates-schema';

import {
  WebToolAction,
  AcademicToolAction,
  XToolAction,
} from '@/components/tool-actions';

// Define non-nullable item types for clarity in map callbacks
type SearchResultItem =
  | NonNullable<WebSearchUpdate['results']>[number]
  | NonNullable<AcademicSearchUpdate['results']>[number]
  | NonNullable<XSearchUpdate['results']>[number];
type AnalysisFindingItem = NonNullable<AnalysisUpdate['findings']>[number];

const ResearchStep = ({
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
      <motion.div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-200',
          isExpanded
            ? 'bg-neutral-50 dark:bg-neutral-800/50'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        )}
        layout
      >
        <div
          className={cn(
            'flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors duration-300',
            update.status === 'completed'
              ? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900'
              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
          )}
        >
          {update.status === 'running' ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          ) : (
            <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="flex items-center justify-between flex-1 text-left min-w-0"
        >
          <div className="space-y-0.5 min-w-0 flex-1">
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
            </div>
            {update.message && (
              <p className="text-xs text-neutral-500 truncate">
                {isGapSearch ? (
                  <span className="flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    {update.message}
                  </span>
                ) : (
                  update.message
                )}
              </p>
            )}
          </div>

          <ChevronRight
            className={cn(
              'h-4 w-4 text-neutral-400 flex-shrink-0 ml-2 transition-transform',
              isExpanded && 'rotate-90',
            )}
          />
        </button>
      </motion.div>

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
                <div className="space-y-2">
                  {update.plan.search_queries.map((query, idx) => (
                    <motion.div
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
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
                                <XLogo className="h-2 w-2" />
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
              )}

              {/* Search Results: Show only when completed and results exist */}
              {(update.type === 'web' ||
                update.type === 'academic' ||
                update.type === 'x') &&
                update.status === 'completed' &&
                update.results && (
                  <div className="space-y-2">
                    {update.results.map(
                      (result: SearchResultItem, idx: number) =>
                        result.tweetId ? (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-2"
                          >
                            <Tweet id={result.tweetId} />
                          </motion.div>
                        ) : result.source === 'web' ? (
                          <WebToolAction
                            key={idx}
                            url={result.url}
                            title={result.title}
                            index={idx}
                          />
                        ) : result.source === 'academic' ? (
                          <AcademicToolAction
                            key={idx}
                            url={result.url}
                            title={result.title}
                            index={idx}
                          />
                        ) : (
                          <XToolAction
                            key={idx}
                            url={result.url}
                            title={result.title}
                            index={idx}
                          />
                        ),
                    )}
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

const StepCarousel = ({ updates }: { updates: StreamUpdate[] }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const handleToggle = (stepId: string) => {
    setExpandedSteps((current) => {
      const newSet = new Set(current);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  return (
    <div>
      {updates.map((update) => {
        const isExpanded =
          update.status === 'running' || expandedSteps.has(update.id);

        return (
          <ResearchStep
            key={update.id}
            id={`step-${update.id}`}
            update={update}
            isExpanded={isExpanded}
            onToggle={() => handleToggle(update.id)}
          />
        );
      })}
    </div>
  );
};

export const ResearchProgress = ({
  updates,
  totalExpectedSteps,
  isCollapsed,
  setIsCollapsed,
  isComplete,
}: {
  updates: StreamUpdate[];
  totalExpectedSteps: number;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isComplete: boolean;
}) => {
  const dedupedUpdates = React.useMemo(() => {
    const updateMap = new Map<string, StreamUpdate>();
    updates.forEach((u) => updateMap.set(u.id, u));
    return Array.from(updateMap.values());
  }, [updates]);

  const sortedUpdatesForCarousel = React.useMemo(() => {
    const filteredUpdates = dedupedUpdates.filter(
      (u) => u.id !== 'research-progress' && u.id !== 'research-plan-initial',
    );

    const plan = filteredUpdates.find((u) => u.type === 'plan');
    const others = filteredUpdates
      .filter((u) => u.type !== 'plan')
      .sort((a, b) => a.timestamp - b.timestamp);

    return plan ? [plan, ...others] : others;
  }, [dedupedUpdates]);

  const {
    completedSteps,
    runningSteps,
    totalSteps,
    progress,
    showRunningIndicators,
  } = React.useMemo(() => {
    const stepsById = new Map<string, StreamUpdate>();
    updates.forEach((u) => stepsById.set(u.id, u));

    const excludedIds = new Set([
      'research-plan',
      'research-progress',
      'research-plan-initial',
    ]);

    const relevantUpdates = Array.from(stepsById.values()).filter(
      (u) => !excludedIds.has(u.id),
    );

    const completed = relevantUpdates.filter(
      (u) => u.status === 'completed',
    ).length;
    const running = relevantUpdates.filter(
      (u) => u.status === 'running',
    ).length;

    const total = totalExpectedSteps;
    const currentProgress =
      total === 0 ? 0 : Math.min(100, (completed / total) * 100);

    return {
      completedSteps: completed,
      runningSteps: running,
      totalSteps: total,
      progress: isComplete ? 100 : currentProgress,
      showRunningIndicators: !isComplete && running > 0,
    };
  }, [updates, totalExpectedSteps, isComplete]);

  return (
    <div className="w-full">
      <div
        className={cn(
          'flex items-center justify-between py-2',
          isComplete && 'cursor-pointer',
          isComplete &&
            'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
        )}
        onClick={() => isComplete && setIsCollapsed(!isCollapsed)}
        aria-expanded={!isCollapsed}
        aria-controls="research-steps-content"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">
              {isComplete ? 'Research Complete' : 'Research Progress'}
            </h3>
            {isComplete ? (
              <Badge
                variant="secondary"
                className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
              >
                Complete
              </Badge>
            ) : (
              showRunningIndicators && (
                <Badge
                  variant="secondary"
                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                >
                  In Progress ({completedSteps}/{totalSteps})
                </Badge>
              )
            )}
          </div>
          <Progress
            value={progress}
            className={cn(
              'h-1 w-24 sm:w-32',
              showRunningIndicators && 'animate-pulse',
            )}
            aria-label={`Research progress: ${Math.round(progress)}% complete`}
          />
        </div>
        {isComplete && (
          <ChevronDown
            className={cn(
              'h-4 w-4 text-neutral-500 transition-transform flex-shrink-0',
              isCollapsed ? 'rotate-180' : '',
            )}
            aria-hidden="true"
          />
        )}
      </div>

      <motion.div
        id="research-steps-content"
        initial={false}
        animate={{
          height: isCollapsed ? 0 : 'auto',
          opacity: isCollapsed ? 0 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="pt-2">
          <StepCarousel updates={sortedUpdatesForCarousel} />
        </div>
      </motion.div>
    </div>
  );
};
