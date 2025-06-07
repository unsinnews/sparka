import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  AutosizeTextarea,
  type AutosizeTextAreaRef,
} from './autosize-textarea';

interface ChatInputTextAreaRef extends HTMLTextAreaElement {
  adjustHeight: () => void;
}

const ChatInputContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'group relative flex h-full max-w-full flex-1 flex-col cursor-text rounded-3xl border px-3 py-1 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),_0_2px_5px_0px_rgba(0,0,0,0.06)] transition-colors dark:border-none dark:shadow-none bg-muted',
      className,
    )}
    {...props}
  />
));
ChatInputContainer.displayName = 'ChatInputContainer';

const ChatInputTopRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mt-2 mb-1 flex items-center justify-between', className)}
    {...props}
  />
));
ChatInputTopRow.displayName = 'ChatInputTopRow';

const ChatInputTextArea = React.forwardRef<
  ChatInputTextAreaRef,
  React.ComponentProps<typeof AutosizeTextarea> & {
    maxRows?: number;
  }
>(({ className, maxRows = 7, ...props }, ref) => {
  const autosizeRef = React.useRef<AutosizeTextAreaRef>(null);

  // Calculate max height based on maxRows
  const lineHeight = 24; // Default line height
  const maxHeight = lineHeight * maxRows;
  const minHeight = 44; // Default min height

  return (
    <AutosizeTextarea
      ref={autosizeRef}
      className={cn(
        'flex min-h-[44px] items-start pl-1 w-full resize-none border-0 bg-transparent p-2 focus-visible:ring-0 shadow-none outline-none overflow-auto',
        className,
      )}
      style={{
        WebkitBoxShadow: 'none',
        MozBoxShadow: 'none',
        boxShadow: 'none',
      }}
      {...props}
    />
  );
});
ChatInputTextArea.displayName = 'ChatInputTextArea';

const ChatInputBottomRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mb-2 mt-1 flex items-center justify-end', className)}
    {...props}
  />
));
ChatInputBottomRow.displayName = 'ChatInputBottomRow';

export {
  ChatInputContainer,
  ChatInputTopRow,
  ChatInputTextArea,
  ChatInputBottomRow,
  type ChatInputTextAreaRef,
};
