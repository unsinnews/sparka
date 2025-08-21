'use client';
import { memo, useId } from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import hardenReactMarkdownImport from 'harden-react-markdown';
import { components as defaultComponents } from './lib/components';
import { cn } from './lib/utils';
import {
  useMarkdownBlockByIndex,
  useMarkdownBlockCountForPart,
} from '@/lib/stores/chat-store';

type HardenReactMarkdownProps = Options & {
  defaultOrigin?: string;
  allowedLinkPrefixes?: string[];
  allowedImagePrefixes?: string[];
};

// Handle both ESM and CJS imports
const hardenReactMarkdown =
  (hardenReactMarkdownImport as any).default || hardenReactMarkdownImport;

// Create a hardened version of ReactMarkdown
const HardenedMarkdown: ReturnType<typeof hardenReactMarkdown> =
  hardenReactMarkdown(ReactMarkdown);

export type StreamdownProps = HardenReactMarkdownProps & {
  parseIncompleteMarkdown?: boolean;
  className?: string;
};

type BlockProps = HardenReactMarkdownProps & {
  messageId: string;
  partIdx: number;
  index: number;
};

const Block = memo(
  ({ messageId, partIdx, index, ...props }: BlockProps) => {
    const block = useMarkdownBlockByIndex(messageId, partIdx, index);
    if (block === null || block.trim() === '') return null;

    return <HardenedMarkdown {...props}>{block}</HardenedMarkdown>;
  },
  (prev, next) =>
    prev.messageId === next.messageId &&
    prev.partIdx === next.partIdx &&
    prev.index === next.index,
);

Block.displayName = 'Block';

export const Streamdown = memo(
  ({
    messageId,
    partIdx,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
    components,
    rehypePlugins,
    remarkPlugins,
    className,
    ...props
  }: StreamdownProps & { messageId: string; partIdx: number }) => {
    // Parse the children to remove incomplete markdown tokens if enabled
    const generatedId = useId();
    // TODO: have a ref with last parsed complete blocks
    const blockCount = useMarkdownBlockCountForPart(messageId, partIdx);

    return (
      <div className={cn('space-y-4', className)} {...props}>
        {Array.from({ length: blockCount }, (_, index) => index).map(
          (index) => (
            <Block
              messageId={messageId}
              partIdx={partIdx}
              index={index}
              allowedImagePrefixes={allowedImagePrefixes ?? ['*']}
              allowedLinkPrefixes={allowedLinkPrefixes ?? ['*']}
              components={{
                ...defaultComponents,
                ...components,
              }}
              defaultOrigin={defaultOrigin}
              key={`${generatedId}-block_${index}`}
              rehypePlugins={[rehypeKatex, ...(rehypePlugins ?? [])]}
              remarkPlugins={[remarkGfm, remarkMath, ...(remarkPlugins ?? [])]}
            />
          ),
        )}
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
Streamdown.displayName = 'Streamdown';

export default Streamdown;
