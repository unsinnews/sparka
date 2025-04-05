import React from 'react';
import type { StreamUpdate } from '@/lib/ai/tools/research-updates-schema';
import { ReasonSearchResearchProgress } from './reason-search-research-progress';
import { ReasonSearchSourcesAndAnalysis } from './reason-search-sources-and-analysis';

const ReasonSearch = ({ updates }: { updates: StreamUpdate[] }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);

  const handleCollapseChange = (newIsCollapsed: boolean) => {
    setIsCollapsed(newIsCollapsed);
  };

  // Determine if the research is complete
  React.useEffect(() => {
    const stepsById = new Map<string, StreamUpdate>();
    updates.forEach((u) => stepsById.set(u.id, u));

    const progressUpdate = stepsById.get('research-progress');
    const finalSynthesisUpdate = stepsById.get('final-synthesis');

    const complete =
      (progressUpdate?.type === 'progress' && progressUpdate.isComplete) ||
      (finalSynthesisUpdate?.type === 'analysis' &&
        finalSynthesisUpdate.status === 'completed');

    setIsComplete(complete);
  }, [updates]);

  return (
    <div className="space-y-8">
      <ReasonSearchResearchProgress
        updates={updates}
        onCollapseChange={handleCollapseChange}
      />
      <ReasonSearchSourcesAndAnalysis
        updates={updates}
        isComplete={isComplete}
      />
    </div>
  );
};

export default ReasonSearch;
