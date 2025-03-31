import type { MessageAnnotation } from '@/lib/ai/tools/annotations';
import ReasonSearch from './reason-search';

export const MessageAnnotations = ({
  annotations,
}: { annotations?: MessageAnnotation[] }) => {
  if (!annotations) return null;

  const researchUpdates = annotations.filter(
    (a) => a.type === 'research_update',
  );

  return (
    <div>
      {researchUpdates.length > 0 && (
        <ReasonSearch updates={researchUpdates.map((a) => a.data)} />
      )}
    </div>
  );
};
