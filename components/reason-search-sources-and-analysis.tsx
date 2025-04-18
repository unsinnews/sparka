import React from 'react';
import { SourcesAndAnalysis } from './sources-and-analysis';
import type {
  StreamUpdate,
  AnalysisUpdate,
  WebSearchUpdate,
  AcademicSearchUpdate,
  XSearchUpdate,
} from '@/lib/ai/tools/research-updates-schema';

// Define non-nullable item types for clarity in map callbacks
export type SearchResultItem = NonNullable<WebSearchUpdate['results']>[number];
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

type ReasonSearchSourcesAndAnalysisProps = {
  updates: StreamUpdate[];
  isComplete?: boolean;
};

export const ReasonSearchSourcesAndAnalysis = ({
  updates,
  isComplete = true,
}: ReasonSearchSourcesAndAnalysisProps) => {
  const webSearchUpdates = updates.filter<WebSearchUpdate>(
    (u) => u.type === 'web',
  );

  const academicSearchUpdates = updates.filter<AcademicSearchUpdate>(
    (u) => u.type === 'academic',
  );

  const xSearchUpdates = updates.filter<XSearchUpdate>((u) => u.type === 'x');

  const analysisUpdates = updates.filter<AnalysisUpdate>(
    (u) => u.type === 'analysis',
  );

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
  }, [
    webSearchUpdates,
    academicSearchUpdates,
    xSearchUpdates,
    analysisUpdates,
  ]);

  if (!isComplete) {
    return null;
  }

  return <SourcesAndAnalysis sourceGroups={sourceGroups} />;
};
