import type { MessageAnnotation } from '@/lib/ai/tools/annotations';
import { DeepResearchSourcesAndAnalysis } from './reason-search-sources-and-analysis';
import { ReasonSearchResearchProgress } from './reason-search-research-progress';

export const SourcesAnnotations = ({
  annotations,
}: { annotations?: MessageAnnotation[] }) => {
  if (!annotations) return null;

  const researchUpdates = annotations.filter(
    (a) => a.type === 'research_update',
  );

  if (researchUpdates.length === 0) return null;

  return (
    <DeepResearchSourcesAndAnalysis
      updates={researchUpdates.map((a) => a.data)}
    />
  );
};

export const ResearchUpdateAnnotations = ({
  annotations,
}: { annotations?: MessageAnnotation[] }) => {
  if (!annotations) return null;
  console.log('Annotations: ', annotations);
  const researchUpdates = annotations.filter(
    (a) => a.type === 'research_update',
  );

  if (researchUpdates.length === 0) return null;

  return (
    <ReasonSearchResearchProgress
      updates={researchUpdates.map((a) => a.data)}
    />
  );
};
