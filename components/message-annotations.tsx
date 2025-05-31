import type { MessageAnnotation } from '@/lib/ai/tools/annotations';
import { ReasonSearchResearchProgress } from './reason-search-research-progress';
import type {
  StreamUpdate,
  WebSearchUpdate,
} from '@/lib/ai/tools/research-updates-schema';
import { Sources } from './sources';

export const SourcesAnnotations = ({
  annotations,
}: { annotations?: MessageAnnotation[] }) => {
  if (!annotations) return null;

  const researchUpdates: StreamUpdate[] = annotations
    .filter((a) => a.type === 'research_update')
    .map((a) => a.data);

  if (researchUpdates.length === 0) return null;

  const researchCompleted = researchUpdates.find(
    (u) => u.type === 'progress' && u.status === 'completed',
  );

  if (!researchCompleted) return null;

  const webSearchUpdates = researchUpdates
    .filter<WebSearchUpdate>((u) => u.type === 'web')
    .filter((u) => u.results)
    .flatMap((u) => u.results)
    .filter((u) => u !== undefined);

  const deduppedSources = webSearchUpdates.filter(
    (source, index, self) =>
      index === self.findIndex((t) => t.url === source.url),
  );

  return <Sources sources={deduppedSources} />;
};

export const ResearchUpdateAnnotations = ({
  annotations,
}: { annotations?: MessageAnnotation[] }) => {
  if (!annotations) return null;
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
