import { SourcesAndAnalysis } from './sources-and-analysis';
import React, { useEffect } from 'react';

import type {
  StreamUpdate,
  PlanUpdate,
  AnalysisUpdate,
  WebSearchUpdate,
  AcademicSearchUpdate,
  XSearchUpdate,
} from '@/lib/ai/tools/research-updates-schema';
import { ResearchProgress } from './research-progress';

// Define non-nullable item types for clarity in map callbacks
type SearchResultItem = NonNullable<WebSearchUpdate['results']>[number];
type AnalysisFindingItem = NonNullable<AnalysisUpdate['findings']>[number];
type AnalysisGapItem = NonNullable<AnalysisUpdate['gaps']>[number];
type AnalysisRecommendationItem = NonNullable<
  AnalysisUpdate['recommendations']
>[number];

type MappedAnalysisResult = {
  type: string;
  findings: AnalysisFindingItem[] | undefined;
  gaps: AnalysisGapItem[] | undefined;
  recommendations: AnalysisRecommendationItem[] | undefined;
  uncertainties: string[] | undefined;
};

const ReasonSearch = ({ updates }: { updates: StreamUpdate[] }) => {
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
      // Use CompletedAnalysisUpdate here
      (u) => u.id === 'final-synthesis' && u.status === 'completed',
    );
    // ... rest of additionalSteps calculation ...
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
  }, [planUpdate, updates]);

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

  const webSearchUpdates = updates.filter<WebSearchUpdate>(
    (u) => u.type === 'web',
  );

  const academicSearchUpdates = updates.filter<AcademicSearchUpdate>(
    (u) => u.type === 'academic',
  );

  const xSearchUpdates = updates.filter<XSearchUpdate>((u) => u.type === 'x');

  const sourceGroups = React.useMemo(() => {
    const webSources: SearchResultItem[] = webSearchUpdates
      .filter((u) => u.status === 'completed' && u.results)
      .flatMap((u) => u.results)
      .filter((u) => u !== undefined);

    const academicSources: SearchResultItem[] = academicSearchUpdates
      .filter((u) => u.status === 'completed' && u.results)
      .flatMap((u) => u.results)
      .filter((u) => u !== undefined);

    const xSources: SearchResultItem[] = xSearchUpdates
      .filter((u) => u.status === 'completed' && u.results)
      .flatMap((u) => u.results)
      .filter((u) => u !== undefined);

    const analysisResults: MappedAnalysisResult[] = analysisUpdates
      .filter((u) => u.status === 'completed' && !!u.findings)
      .map<MappedAnalysisResult>((u) => ({
        type: u.analysisType,
        findings: u.findings,
        gaps: u.gaps,
        recommendations: u.recommendations,
        uncertainties: u.uncertainties,
      }));

    return {
      web: webSources,
      academic: academicSources,
      x: xSources,
      analysis: analysisResults,
    };
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

  return (
    <div className="space-y-8">
      <ResearchProgress
        updates={updates}
        totalExpectedSteps={totalExpectedSteps}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isComplete={isComplete}
      />

      {isComplete && <SourcesAndAnalysis sourceGroups={sourceGroups} />}
    </div>
  );
};

export default ReasonSearch;
