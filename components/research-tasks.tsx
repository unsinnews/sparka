import type { ResearchUpdate } from '@/lib/ai/tools/research-updates-schema';
import React, { useState, type ReactNode } from 'react';
import { ResearchTask } from './research-task';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export const ResearchTasks = ({ updates }: { updates: ResearchUpdate[] }) => {
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
        return (
          <StepWrapper
            key={update.id}
            status={'COMPLETED'}
            isLast={index === updates.length - 1}
          >
            <ResearchTask update={update} minimal={false} />
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
  isLast: boolean;
};

export const StepWrapper = ({ status, children, isLast }: StepWrapperProps) => {
  return (
    <div className="flex w-full flex-row items-stretch justify-start gap-2">
      <div className="flex min-h-full shrink-0 flex-col items-center justify-start px-2">
        <div className="bg-border/50 h-1 shrink-0" />
        <div className="bg-background z-10">
          <StepStatus status={status} />
        </div>
        <motion.div
          className={cn(
            'border-border min-h-full w-[1px] flex-1 border-l border-dashed',
            isLast && 'hidden',
          )}
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
