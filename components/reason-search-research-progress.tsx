import React, { useEffect } from 'react';
import type {
  StreamUpdate,
  AnalysisUpdate,
} from '@/lib/ai/tools/research-updates-schema';
import { ResearchProgress } from './research-progress';

type ReasonSearchResearchProgressProps = {
  updates: StreamUpdate[];
};

export const ReasonSearchResearchProgress = ({
  updates,
}: ReasonSearchResearchProgressProps) => {
  const analysisUpdates = updates.filter<AnalysisUpdate>(
    (u) => u.type === 'analysis',
  );

  const totalExpectedSteps = React.useMemo(() => {
    const gapAnalysisUpdate = analysisUpdates.find(
      (u) => u.id === 'gap-analysis' && u.status === 'completed',
    );
    const finalSynthesisUpdate = analysisUpdates.find(
      (u) => u.id === 'final-synthesis' && u.status === 'completed',
    );

    let additionalSteps = 0;
    if (gapAnalysisUpdate) {
      additionalSteps += 1;
      additionalSteps += updates.filter((u) =>
        u.id.startsWith('gap-search-'),
      ).length;
    }
    if (finalSynthesisUpdate) {
      additionalSteps += 1;
    } else if (
      updates.some((u) => u.id === 'final-synthesis' && u.status === 'running')
    ) {
      additionalSteps += 1;
    }

    return additionalSteps;
  }, [updates, analysisUpdates]);

  const isComplete = React.useMemo(() => {
    const stepsById = new Map<string, StreamUpdate>();
    updates.forEach((u) => stepsById.set(u.id, u));

    const progressUpdate = stepsById.get('research-progress');
    const finalSynthesisUpdate = stepsById.get('final-synthesis');

    return (
      (progressUpdate?.type === 'progress' && progressUpdate.isComplete) ||
      (finalSynthesisUpdate?.type === 'analysis' &&
        finalSynthesisUpdate.status === 'completed')
    );
  }, [updates]);

  return (
    <ResearchProgress
      updates={updates}
      totalExpectedSteps={totalExpectedSteps}
      isComplete={isComplete}
    />
  );
};
