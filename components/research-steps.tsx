import type { StreamUpdate } from '@/lib/ai/tools/research-updates-schema';
import React, { useState } from 'react';
import { ResearchStep } from './research-step';

export const ResearchSteps = ({ updates }: { updates: StreamUpdate[] }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const handleToggle = (stepId: string) => {
    setExpandedSteps((current) => {
      const newSet = new Set(current);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  return (
    <div className="relative">
      {updates.map((update, index) => {
        const isExpanded =
          update.status === 'running' || expandedSteps.has(update.id);

        return (
          <div key={update.id} className="relative">
            <ResearchStep
              id={`step-${update.id}`}
              update={update}
              isExpanded={isExpanded}
              onToggle={() => handleToggle(update.id)}
            />
          </div>
        );
      })}
    </div>
  );
};
