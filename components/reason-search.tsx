import { SourcesAndAnalysis } from './sources-and-analysis';
import React, { useEffect } from 'react';
// Type-only imports
import type {
  PlanUpdate,
  StreamUpdate,
} from '@/lib/ai/tools/research-updates-schema';

// Runtime imports (used with z.infer)
import type {
  AnalysisSchema,
  SearchSchema,
} from '@/lib/ai/tools/research-updates-schema';
import type { z } from 'zod';
import { ResearchProgress } from './research-progress';

// Define non-nullable item types for clarity in map callbacks
type SearchResultItem = NonNullable<
  z.infer<typeof SearchSchema>['results']
>[number];
type AnalysisFindingItem = NonNullable<
  z.infer<typeof AnalysisSchema>['findings']
>[number];
type AnalysisGapItem = NonNullable<
  z.infer<typeof AnalysisSchema>['gaps']
>[number];
type AnalysisRecommendationItem = NonNullable<
  z.infer<typeof AnalysisSchema>['recommendations']
>[number];

// Define extracted update types (status: completed implies results/findings might exist but are still optional per schema)
type CompletedAnalysisUpdate = Extract<
  StreamUpdate,
  { type: 'analysis'; status: 'completed' }
>;

// Modify Completed types to assert non-null arrays after filtering
type CompletedWebSearchUpdateNonNull = Extract<
  StreamUpdate,
  { type: 'web'; status: 'completed' }
> & { results: SearchResultItem[] };
type CompletedAcademicSearchUpdateNonNull = Extract<
  StreamUpdate,
  { type: 'academic'; status: 'completed' }
> & { results: SearchResultItem[] };
type CompletedXSearchUpdateNonNull = Extract<
  StreamUpdate,
  { type: 'x'; status: 'completed' }
> & { results: SearchResultItem[] };
type CompletedAnalysisUpdateNonNull = Extract<
  StreamUpdate,
  { type: 'analysis'; status: 'completed' }
> & { findings: AnalysisFindingItem[] }; // Assert findings for mapping

// Define the type for the analysis results structure used in sourceGroups
// Arrays here match the optional arrays in AnalysisSchema
type MappedAnalysisResult = {
  type: string;
  findings: AnalysisFindingItem[] | undefined;
  gaps: AnalysisGapItem[] | undefined;
  recommendations: AnalysisRecommendationItem[] | undefined;
  uncertainties: string[] | undefined;
};

const ReasonSearch = ({ updates }: { updates: StreamUpdate[] }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState('web');

  const planUpdateFromUpdates = React.useMemo(() => {
    const planUpdates = updates.filter(
      (u): u is PlanUpdate => u.type === 'plan',
    );
    return planUpdates.find((u) => u.status === 'completed') || planUpdates[0];
  }, [updates]);

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
      } as any;
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

    const gapAnalysisUpdate = updates.find(
      // Use CompletedAnalysisUpdate here as findings existence isn't needed for count
      (u): u is CompletedAnalysisUpdate =>
        u.id === 'gap-analysis' && u.status === 'completed',
    );
    const finalSynthesisUpdate = updates.find(
      // Use CompletedAnalysisUpdate here
      (u): u is CompletedAnalysisUpdate =>
        u.id === 'final-synthesis' && u.status === 'completed',
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

  const sourceGroups = React.useMemo(() => {
    const webSources: SearchResultItem[] = updates
      .filter(
        // Use predicate asserting non-null results
        (u): u is CompletedWebSearchUpdateNonNull =>
          u.type === 'web' && u.status === 'completed' && !!u.results,
      )
      .flatMap((u) => u.results); // Now u.results is guaranteed non-null

    const academicSources: SearchResultItem[] = updates
      .filter(
        // Use predicate asserting non-null results
        (u): u is CompletedAcademicSearchUpdateNonNull =>
          u.type === 'academic' && u.status === 'completed' && !!u.results,
      )
      .flatMap((u) => u.results);

    const xSources: SearchResultItem[] = updates
      .filter(
        // Use predicate asserting non-null results
        (u): u is CompletedXSearchUpdateNonNull =>
          u.type === 'x' && u.status === 'completed' && !!u.results,
      )
      .flatMap((u) => u.results);

    const analysisResults: MappedAnalysisResult[] = updates
      .filter(
        // Use predicate asserting non-null findings
        (u): u is CompletedAnalysisUpdateNonNull =>
          u.type === 'analysis' && u.status === 'completed' && !!u.findings,
      )
      .map(
        (u): MappedAnalysisResult => ({
          // u has non-null findings here
          type: u.analysisType,
          findings: u.findings, // Guaranteed non-null by filter
          // Other properties are still optional based on AnalysisSchema
          gaps: u.gaps,
          recommendations: u.recommendations,
          uncertainties: u.uncertainties,
        }),
      );

    return {
      web: webSources,
      academic: academicSources,
      x: xSources,
      analysis: analysisResults,
    };
  }, [updates]);

  const xSearchesRunning = updates.some(
    (u) => u.type === 'x' && u.status === 'running',
  );

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

      {isComplete && (
        <SourcesAndAnalysis
          sourceGroups={sourceGroups}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          xSearchesRunning={xSearchesRunning}
        />
      )}
    </div>
  );
};

export default ReasonSearch;
