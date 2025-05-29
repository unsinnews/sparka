import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const ChatInputContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'group relative flex h-full max-w-full flex-1 flex-col cursor-text rounded-3xl border px-3 py-1 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),_0_2px_5px_0px_rgba(0,0,0,0.06)] transition-colors dark:border-none dark:shadow-none dark:bg-[#303030]',
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
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea> & {
    maxRows?: number;
  }
>(({ className, maxRows = 7, onChange, ...props }, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = React.useCallback(() => {
    const textarea = internalRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight =
        Number.parseInt(getComputedStyle(textarea).lineHeight) || 24;
      const maxHeight = lineHeight * maxRows;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [maxRows]);

  React.useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      // Use setTimeout to ensure the value is updated before adjusting height
      setTimeout(adjustHeight, 0);
    },
    [onChange, adjustHeight],
  );

  React.useImperativeHandle(
    ref,
    () => internalRef.current as HTMLTextAreaElement,
    [],
  );

  return (
    <Textarea
      ref={internalRef}
      className={cn(
        'flex min-h-[44px] items-start pl-1 w-full resize-none border-0 bg-transparent p-2 focus-visible:ring-0 shadow-none outline-none overflow-auto',
        className,
      )}
      style={{
        WebkitBoxShadow: 'none',
        MozBoxShadow: 'none',
        boxShadow: 'none',
      }}
      onChange={handleChange}
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
};
