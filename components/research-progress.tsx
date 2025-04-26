import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Expand,
  Maximize,
  Maximize2,
  Minimize2,
  Shrink,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
// Type-only imports
import type { StreamUpdate } from '@/lib/ai/tools/research-updates-schema';

import { ResearchTasks } from './research-tasks';
import { ResearchTask2 } from './research-task-2';

// Add the updateName mapping (consider moving to a shared util later)
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

export const ResearchProgress = ({
  updates,
  totalExpectedSteps,
  isComplete,
}: {
  updates: StreamUpdate[];
  totalExpectedSteps: number;
  isComplete: boolean;
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  console.log('updates', updates);
  const dedupedUpdates = React.useMemo(() => {
    const updateMap = new Map<string, StreamUpdate>();
    updates.forEach((u) => updateMap.set(u.id, u));
    return Array.from(updateMap.values());
  }, [updates]);

  const sortedUpdates = React.useMemo(() => {
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

    const excludedIds = new Set(['research-plan', 'research-plan-initial']);

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

  const lastUpdate =
    sortedUpdates.length > 0 ? sortedUpdates[sortedUpdates.length - 1] : null;

  const searchCount = React.useMemo(() => {
    return dedupedUpdates.filter(
      (u) => u.type === 'web' || u.type === 'academic' || u.type === 'x',
    ).length;
  }, [dedupedUpdates]);

  const sourceCount = React.useMemo(() => {
    return dedupedUpdates
      .filter(
        (u) => u.type === 'web' || u.type === 'academic' || u.type === 'x',
      )
      .reduce((acc, u) => acc + (u.results?.length || 0), 0);
  }, [dedupedUpdates]);

  // TODO: First update is not showing
  const lastUpdateTitle = !lastUpdate
    ? 'Researching'
    : isComplete
      ? `Research Complete`
      : lastUpdate.title || updateName[lastUpdate.type];

  const timeSpent = React.useMemo(() => {
    if (isComplete) {
      const completedUpdate = dedupedUpdates.find(
        (u) => u.id === 'research-progress' && u.status === 'completed',
      );
      return completedUpdate?.timestamp
        ? Math.floor(
            (completedUpdate.timestamp - dedupedUpdates[0].timestamp) / 1000,
          )
        : 0;
    }
    return 0;
  }, [dedupedUpdates, isComplete]);

  return (
    <div className="border rounded-lg p-1 bg-card shadow-sm">
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flex items-center justify-between py-2 px-3 rounded-lg w-full cursor-pointer',
          'hover:bg-accent hover:text-accent-foreground transition-colors',
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded(!isExpanded);
            e.preventDefault();
          }
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">
              {!isExpanded && lastUpdate && lastUpdateTitle}
            </h3>
            {isComplete && !isExpanded && (
              <span className="text-xs text-muted-foreground">{`Researched for ${timeSpent} seconds, ${searchCount} searches, ${sourceCount} sources`}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {sortedUpdates.length} task{sortedUpdates.length === 1 ? '' : 's'}
          </Badge>
          {isExpanded ? (
            <Minimize2
              className="h-4 w-4 text-muted-foreground flex-shrink-0"
              aria-hidden="true"
            />
          ) : (
            <Maximize2
              className="h-4 w-4 text-muted-foreground flex-shrink-0"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {isExpanded ? (
        <div className="pt-2 pb-1 px-1">
          <ResearchTasks updates={sortedUpdates} />
        </div>
      ) : (
        lastUpdate &&
        !isComplete && (
          <div className="px-4 pt-1 pb-3">
            <ResearchTask2
              update={lastUpdate}
              id={`last-task-${lastUpdate.id}`}
              isExpanded={false}
              onToggle={() => {}}
            />
          </div>
        )
      )}
    </div>
  );
};
