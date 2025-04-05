import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
// Type-only imports
import type { StreamUpdate } from '@/lib/ai/tools/research-updates-schema';

import { ResearchSteps } from './research-steps';

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
          'flex items-center justify-between py-2 px-3 rounded-lg',
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
          <ResearchSteps updates={sortedUpdatesForCarousel} />
        </div>
      </motion.div>
    </div>
  );
};
