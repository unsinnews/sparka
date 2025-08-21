'use client';

import { cn } from '@/lib/utils';
import { type ComponentProps, memo, isValidElement } from 'react';
import { Streamdown, type StreamdownProps } from '../streamdown';
import { CodeBlock, CodeBlockCopyButton } from './code-block';

type ResponseProps = ComponentProps<typeof Streamdown>;

const components: StreamdownProps['components'] = {
  code: ({ node, className, children, ...props }) => {
    const startLine = node?.position?.start?.line;
    const endLine = node?.position?.end?.line;
    const inline =
      typeof startLine === 'number' && typeof endLine === 'number'
        ? startLine === endLine
        : true;

    if (inline) {
      return (
        <code
          className={cn(
            'rounded bg-muted px-1.5 py-0.5 font-mono text-sm',
            className,
          )}
          {...props}
        >
          {children}
        </code>
      );
    }

    const match = className?.match(/language-(\w+)/);
    const language = match ? match[1] : 'plaintext';

    let code = '';
    if (
      isValidElement(children) &&
      children.props &&
      typeof children.props.children === 'string'
    ) {
      code = children.props.children;
    } else if (typeof children === 'string') {
      code = children;
    }

    return (
      <CodeBlock className={className} code={code} language={language}>
        <CodeBlockCopyButton
          onCopy={() => console.log('Copied code to clipboard')}
          onError={() => console.error('Failed to copy code to clipboard')}
        />
      </CodeBlock>
    );
  },
  pre: ({ node, className, children, ...props }) => {
    return (
      <pre className={cn('my-4 h-auto', className)} {...props}>
        {children}
      </pre>
    );
  },
};

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className,
      )}
      components={components}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

Response.displayName = 'Response';
