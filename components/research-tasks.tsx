import type { StreamUpdate } from '@/lib/ai/tools/research-updates-schema';
import React, { useState, type ReactNode } from 'react';
import { ResearchTask2 } from './research-task-2';

export const ResearchTasks = ({ updates }: { updates: StreamUpdate[] }) => {
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
          <StepWrapper key={update.id} status={'COMPLETED'}>
            <ResearchTask2
              id={`step-${update.id}`}
              update={update}
              isExpanded={isExpanded}
              onToggle={() => handleToggle(update.id)}
            />
          </StepWrapper>
        );
      })}
    </div>
  );
};

export type ItemStatus =
  | 'QUEUED'
  | 'PENDING'
  | 'COMPLETED'
  | 'ERROR'
  | 'ABORTED'
  | 'HUMAN_REVIEW';

export type StepWrapperProps = {
  status: ItemStatus;
  children: ReactNode;
};

export const StepWrapper = ({ status, children }: StepWrapperProps) => {
  return (
    <div className="flex w-full flex-row items-stretch justify-start gap-2">
      <div className="flex min-h-full shrink-0 flex-col items-center justify-start px-2">
        <div className="bg-border/50 h-1 shrink-0" />
        <div className="bg-background z-10">
          <StepStatus status={status} />
        </div>
        <motion.div
          className="border-border min-h-full w-[1px] flex-1 border-l border-dashed"
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <motion.div
        className="flex w-full flex-1 flex-col gap-4 overflow-hidden pb-2 pr-2"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

import { motion } from 'motion/react';

export const StepStatus = ({ status }: { status: ItemStatus }) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="relative flex size-3 items-center justify-center">
          <span className="bg-primary/50 absolute inline-flex size-full animate-ping rounded-full opacity-75" />
          <span className="bg-primary relative inline-flex size-1 rounded-full" />
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="relative flex size-3 items-center justify-center">
          <span className="relative flex size-1">
            <span className="bg-primary relative inline-flex size-1 rounded-full" />
          </span>
        </span>
      );
    case 'ERROR':
      return (
        <span className="relative flex size-3 items-center justify-center">
          <span className="relative flex size-1">
            <span className="relative inline-flex size-1 rounded-full bg-rose-400" />
          </span>
        </span>
      );
    default:
      return (
        <span className="relative flex size-3 items-center justify-center">
          <span className="relative flex size-1">
            <span className="bg-secondary relative inline-flex size-1 rounded-full" />
          </span>
        </span>
      );
  }
};
