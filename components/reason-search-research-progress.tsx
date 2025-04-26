import { useMemo } from 'react';
import type { StreamUpdate } from '@/lib/ai/tools/research-updates-schema';
import { ResearchProgress } from './research-progress';

type ReasonSearchResearchProgressProps = {
  updates: StreamUpdate[];
};

export const ReasonSearchResearchProgress = ({
  updates,
}: ReasonSearchResearchProgressProps) => {
  // TODO: This should come from a progress update
  const totalExpectedSteps = 0;

  const isComplete = useMemo(() => {
    const progressUpdate = updates.find(
      (u) => u.type === 'progress' && u.status === 'completed',
    );
    return Boolean(progressUpdate);
  }, [updates]);

  return (
    <ResearchProgress
      updates={updates}
      totalExpectedSteps={totalExpectedSteps}
      isComplete={isComplete}
    />
  );
};
