import React, { useEffect } from 'react';
import type {
  StreamUpdate,
  PlanUpdate,
  AnalysisUpdate,
} from '@/lib/ai/tools/research-updates-schema';
import { ResearchProgress } from './research-progress';

type ReasonSearchResearchProgressProps = {
  updates: StreamUpdate[];
  onCollapseChange?: (isCollapsed: boolean) => void;
};

export const ReasonSearchResearchProgress = ({
  updates,
  onCollapseChange,
}: ReasonSearchResearchProgressProps) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const planUpdateFromUpdates = React.useMemo(() => {
    const planUpdates = updates.filter(
      (u): u is PlanUpdate => u.type === 'plan',
    );
    return planUpdates.find((u) => u.status === 'completed') || planUpdates[0];
  }, [updates]);

  const analysisUpdates = updates.filter<AnalysisUpdate>(
    (u) => u.type === 'analysis',
  );

  const additionalAdvancedSteps = React.useMemo(() => {
    return updates.filter(
      (u) => u.id === 'gap-analysis' || u.id === 'final-synthesis',
    ).length;
  }, [updates]);

  const planUpdate = React.useMemo(() => {
    if (planUpdateFromUpdates && additionalAdvancedSteps > 0) {
      return {
        ...planUpdateFromUpdates,
        advancedSteps: additionalAdvancedSteps,
      };
    }
    return planUpdateFromUpdates;
  }, [planUpdateFromUpdates, additionalAdvancedSteps]);

  const totalExpectedSteps = React.useMemo(() => {
    if (planUpdate?.totalSteps) return planUpdate.totalSteps;
    if (!planUpdate?.plan) return 0;

    // Add types to reduce parameters
    const searchSteps = planUpdate.plan.search_queries.reduce(
      (
        acc: number,
        query: Exclude<PlanUpdate['plan'], undefined>['search_queries'][number],
      ) => {
        return (
          acc + (query.source === 'all' ? 3 : query.source === 'both' ? 2 : 1)
        );
      },
      0,
    );

    const analysisSteps = planUpdate.plan.required_analyses.length;

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

    return searchSteps + analysisSteps + additionalSteps;
  }, [planUpdate, updates, analysisUpdates]);

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

  const finalSynthesisDone = React.useMemo(() => {
    return updates.some(
      (u) => u.id === 'final-synthesis' && u.status === 'completed',
    );
  }, [updates]);

  useEffect(() => {
    if (finalSynthesisDone) {
      setIsCollapsed(true);
    }
  }, [finalSynthesisDone]);

  const handleCollapseChange = (newIsCollapsed: boolean) => {
    setIsCollapsed(newIsCollapsed);
    onCollapseChange?.(newIsCollapsed);
  };

  return (
    <ResearchProgress
      updates={updates}
      totalExpectedSteps={totalExpectedSteps}
      isCollapsed={isCollapsed}
      setIsCollapsed={handleCollapseChange}
      isComplete={isComplete}
    />
  );
};
