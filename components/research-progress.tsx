import { Maximize2, Minimize2 } from 'lucide-react';
import React from 'react';
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
  const dedupedUpdates = React.useMemo(() => {
    const updateMap = new Map<string, StreamUpdate>();
    updates.forEach((u) => updateMap.set(u.id, u));
    return Array.from(updateMap.values());
  }, [updates]);

  const sortedUpdates = React.useMemo(() => {
    return dedupedUpdates.sort((a, b) => a.timestamp - b.timestamp);
  }, [dedupedUpdates]);

  const lastUpdate =
    sortedUpdates.length > 0 ? sortedUpdates[sortedUpdates.length - 1] : null;

  const searchCount = React.useMemo(() => {
    return dedupedUpdates.filter((u) => u.type === 'web').length;
  }, [dedupedUpdates]);

  const sourceCount = React.useMemo(() => {
    return dedupedUpdates
      .filter((u) => u.type === 'web')
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
          <div className="flex flex-col sm:flex-row  sm:items-center gap-2">
            <h3 className="text-sm font-medium">
              {!isExpanded && lastUpdate && lastUpdateTitle}
            </h3>
            {isComplete && !isExpanded && (
              <span className="text-xs text-muted-foreground">{`Researched for ${timeSpent} seconds, ${searchCount} searches, ${sourceCount} sources`}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <Minimize2
              className="size-4 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
          ) : (
            <Maximize2
              className="size-4 text-muted-foreground shrink-0"
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
