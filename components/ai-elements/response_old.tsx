'use client';

import { CodeBlock, CodeBlockCopyButton } from './code-block';
import type { ComponentProps, HTMLAttributes } from 'react';
import { isValidElement, memo, useId, useMemo } from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';
import hardenReactMarkdown from 'harden-react-markdown';
import { marked } from 'marked';
import {
  useMarkdownBlockCountForPart,
  useMarkdownBlockByIndex,
} from '@/lib/stores/chat-store';
import { parseIncompleteMarkdown } from './parseIncompleteMarkdown';

// Create a hardened version of ReactMarkdown
const HardenedMarkdown = hardenReactMarkdown(ReactMarkdown);

export type ResponseProps = HTMLAttributes<HTMLDivElement> & {
  options?: Options;
  children?: Options['children'];
  allowedImagePrefixes?: ComponentProps<
    ReturnType<typeof hardenReactMarkdown>
  >['allowedImagePrefixes'];
  allowedLinkPrefixes?: ComponentProps<
    ReturnType<typeof hardenReactMarkdown>
  >['allowedLinkPrefixes'];
  defaultOrigin?: ComponentProps<
    ReturnType<typeof hardenReactMarkdown>
  >['defaultOrigin'];
  parseIncompleteMarkdown?: boolean;
  // Optional: drive from store using message/part ids instead of passing raw markdown
  messageId?: string;
  partIdx?: number;
};

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const RehypePlugins = [rehypeKatex];
const RemarkPlugins = [remarkGfm, remarkMath];

const MemoizedHardenedMarkdownBlock = memo(
  ({
    content,
    options,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
  }: {
    content: string;
    options?: Options;
    allowedImagePrefixes?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['allowedImagePrefixes'];
    allowedLinkPrefixes?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['allowedLinkPrefixes'];
    defaultOrigin?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['defaultOrigin'];
  }) => {
    return (
      <HardenedMarkdown
        components={components}
        rehypePlugins={RehypePlugins}
        remarkPlugins={RemarkPlugins}
        allowedImagePrefixes={allowedImagePrefixes ?? ['*']}
        allowedLinkPrefixes={allowedLinkPrefixes ?? ['*']}
        defaultOrigin={defaultOrigin}
        {...options}
      >
        {content}
      </HardenedMarkdown>
    );
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content,
);

MemoizedHardenedMarkdownBlock.displayName = 'MemoizedHardenedMarkdownBlock';

// Types for markdown component props with `node.position` info
type MarkdownPoint = { line?: number; column?: number };
type MarkdownPosition = { start?: MarkdownPoint; end?: MarkdownPoint };
type MarkdownNode = {
  position?: MarkdownPosition;
  properties?: { className?: string };
};
type WithNode<T> = T & {
  node?: MarkdownNode;
  children?: React.ReactNode;
  className?: string;
};

// Compare markdown AST node positions for stable memoization across rerenders
function sameNodePosition(a?: MarkdownNode, b?: MarkdownNode) {
  const as = a?.position?.start;
  const ae = a?.position?.end;
  const bs = b?.position?.start;
  const be = b?.position?.end;
  return (
    as?.line === bs?.line &&
    as?.column === bs?.column &&
    ae?.line === be?.line &&
    ae?.column === be?.column
  );
}

type OlProps = WithNode<JSX.IntrinsicElements['ol']>;
const MemoOl = memo<OlProps>(
  ({ node, children, className, ...props }: OlProps) => (
    <ol className={cn('ml-4 list-outside list-decimal', className)} {...props}>
      {children}
    </ol>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoOl.displayName = 'MarkdownOl';

type LiProps = WithNode<JSX.IntrinsicElements['li']>;
const MemoLi = memo<LiProps>(
  ({ node, children, className, ...props }: LiProps) => (
    <li className={cn('py-1', className)} {...props}>
      {children}
    </li>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoLi.displayName = 'MarkdownLi';

type UlProps = WithNode<JSX.IntrinsicElements['ul']>;
const MemoUl = memo<UlProps>(
  ({ node, children, className, ...props }: UlProps) => (
    <ul className={cn('ml-4 list-outside list-disc', className)} {...props}>
      {children}
    </ul>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoUl.displayName = 'MarkdownUl';

type HrProps = WithNode<JSX.IntrinsicElements['hr']>;
const MemoHr = memo<HrProps>(
  ({ node, className, ...props }: HrProps) => (
    <hr className={cn('my-6 border-border', className)} {...props} />
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoHr.displayName = 'MarkdownHr';

type StrongProps = WithNode<JSX.IntrinsicElements['span']>;
const MemoStrong = memo<StrongProps>(
  ({ node, children, className, ...props }: StrongProps) => (
    <span className={cn('font-semibold', className)} {...props}>
      {children}
    </span>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoStrong.displayName = 'MarkdownStrong';

type AProps = WithNode<JSX.IntrinsicElements['a']>;
const MemoA = memo<AProps>(
  ({ node, children, className, href, ...props }: AProps) => (
    <a
      className={cn('font-medium text-primary underline', className)}
      rel="noreferrer"
      target="_blank"
      href={href}
      {...props}
    >
      {children}
    </a>
  ),
  (p, n) =>
    p.className === n.className &&
    p.href === n.href &&
    sameNodePosition(p.node, n.node),
);
MemoA.displayName = 'MarkdownA';

type H1Props = WithNode<JSX.IntrinsicElements['h1']>;
const MemoH1 = memo<H1Props>(
  ({ node, children, className, ...props }: H1Props) => (
    <h1
      className={cn('mt-6 mb-2 font-semibold text-3xl', className)}
      {...props}
    >
      {children}
    </h1>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoH1.displayName = 'MarkdownH1';

type H2Props = WithNode<JSX.IntrinsicElements['h2']>;
const MemoH2 = memo<H2Props>(
  ({ node, children, className, ...props }: H2Props) => (
    <h2
      className={cn('mt-6 mb-2 font-semibold text-2xl', className)}
      {...props}
    >
      {children}
    </h2>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoH2.displayName = 'MarkdownH2';

type H3Props = WithNode<JSX.IntrinsicElements['h3']>;
const MemoH3 = memo<H3Props>(
  ({ node, children, className, ...props }: H3Props) => (
    <h3 className={cn('mt-6 mb-2 font-semibold text-xl', className)} {...props}>
      {children}
    </h3>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoH3.displayName = 'MarkdownH3';

type H4Props = WithNode<JSX.IntrinsicElements['h4']>;
const MemoH4 = memo<H4Props>(
  ({ node, children, className, ...props }: H4Props) => (
    <h4 className={cn('mt-6 mb-2 font-semibold text-lg', className)} {...props}>
      {children}
    </h4>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoH4.displayName = 'MarkdownH4';

type H5Props = WithNode<JSX.IntrinsicElements['h5']>;
const MemoH5 = memo<H5Props>(
  ({ node, children, className, ...props }: H5Props) => (
    <h5
      className={cn('mt-6 mb-2 font-semibold text-base', className)}
      {...props}
    >
      {children}
    </h5>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoH5.displayName = 'MarkdownH5';

type H6Props = WithNode<JSX.IntrinsicElements['h6']>;
const MemoH6 = memo<H6Props>(
  ({ node, children, className, ...props }: H6Props) => (
    <h6 className={cn('mt-6 mb-2 font-semibold text-sm', className)} {...props}>
      {children}
    </h6>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoH6.displayName = 'MarkdownH6';

type TableProps = WithNode<JSX.IntrinsicElements['table']>;
const MemoTable = memo<TableProps>(
  ({ node, children, className, ...props }: TableProps) => (
    <div className="my-4 overflow-x-auto">
      <table
        className={cn('w-full border-collapse border border-border', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoTable.displayName = 'MarkdownTable';

type TheadProps = WithNode<JSX.IntrinsicElements['thead']>;
const MemoThead = memo<TheadProps>(
  ({ node, children, className, ...props }: TheadProps) => (
    <thead className={cn('bg-muted/50', className)} {...props}>
      {children}
    </thead>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoThead.displayName = 'MarkdownThead';

type TbodyProps = WithNode<JSX.IntrinsicElements['tbody']>;
const MemoTbody = memo<TbodyProps>(
  ({ node, children, className, ...props }: TbodyProps) => (
    <tbody className={cn('divide-y divide-border', className)} {...props}>
      {children}
    </tbody>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoTbody.displayName = 'MarkdownTbody';

type TrProps = WithNode<JSX.IntrinsicElements['tr']>;
const MemoTr = memo<TrProps>(
  ({ node, children, className, ...props }: TrProps) => (
    <tr className={cn('border-b border-border', className)} {...props}>
      {children}
    </tr>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoTr.displayName = 'MarkdownTr';

type ThProps = WithNode<JSX.IntrinsicElements['th']>;
const MemoTh = memo<ThProps>(
  ({ node, children, className, ...props }: ThProps) => (
    <th
      className={cn('px-4 py-2 text-left font-semibold text-sm', className)}
      {...props}
    >
      {children}
    </th>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoTh.displayName = 'MarkdownTh';

type TdProps = WithNode<JSX.IntrinsicElements['td']>;
const MemoTd = memo<TdProps>(
  ({ node, children, className, ...props }: TdProps) => (
    <td className={cn('px-4 py-2 text-sm', className)} {...props}>
      {children}
    </td>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoTd.displayName = 'MarkdownTd';

type BlockquoteProps = WithNode<JSX.IntrinsicElements['blockquote']>;
const MemoBlockquote = memo<BlockquoteProps>(
  ({ node, children, className, ...props }: BlockquoteProps) => (
    <blockquote
      className={cn(
        'my-4 border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoBlockquote.displayName = 'MarkdownBlockquote';

type CodeProps = WithNode<JSX.IntrinsicElements['code']>;
const MemoCode = memo<CodeProps>(
  ({ node, className, children, ...props }: CodeProps) => {
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
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoCode.displayName = 'MarkdownCode';

type PreProps = WithNode<JSX.IntrinsicElements['pre']>;
const MemoPre = memo<PreProps>(
  ({ node, className, children }: PreProps) => {
    return <pre className={cn('my-4 h-auto', className)}>{children}</pre>;
  },
  (p, n) => p.className === n.className && sameNodePosition(p.node, n.node),
);
MemoPre.displayName = 'MarkdownPre';

const MemoizedHardenedMarkdown = memo(
  ({
    content,
    id,
    options,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
  }: {
    content: string;
    id: string;
    options?: Options;
    allowedImagePrefixes?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['allowedImagePrefixes'];
    allowedLinkPrefixes?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['allowedLinkPrefixes'];
    defaultOrigin?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['defaultOrigin'];
  }) => {
    const generatedId = useId();

    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return (
      <>
        {blocks.map((block, index) => (
          <MemoizedHardenedMarkdownBlock
            key={`${generatedId}-block_${index}`}
            content={block}
            options={options}
            allowedImagePrefixes={allowedImagePrefixes}
            allowedLinkPrefixes={allowedLinkPrefixes}
            defaultOrigin={defaultOrigin}
          />
        ))}
      </>
    );
  },
);

MemoizedHardenedMarkdown.displayName = 'MemoizedHardenedMarkdown';

const ResponseBlocks = memo(
  ({
    messageId,
    partIdx,
    options,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
  }: {
    messageId: string;
    partIdx: number;
    options?: Options;
    allowedImagePrefixes?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['allowedImagePrefixes'];
    allowedLinkPrefixes?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['allowedLinkPrefixes'];
    defaultOrigin?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['defaultOrigin'];
  }) => {
    const blockCount = useMarkdownBlockCountForPart(messageId, partIdx);
    return (
      <>
        {Array.from({ length: blockCount }, (_, index) => index).map(
          (index) => (
            <MarkdownBlockItem
              key={`response-block-${index}`}
              messageId={messageId}
              partIdx={partIdx}
              index={index}
              options={options}
              allowedImagePrefixes={allowedImagePrefixes}
              allowedLinkPrefixes={allowedLinkPrefixes}
              defaultOrigin={defaultOrigin}
            />
          ),
        )}
      </>
    );
  },
  (prev, next) =>
    prev.messageId === next.messageId &&
    prev.partIdx === next.partIdx &&
    prev.options === next.options &&
    prev.allowedImagePrefixes === next.allowedImagePrefixes &&
    prev.allowedLinkPrefixes === next.allowedLinkPrefixes &&
    prev.defaultOrigin === next.defaultOrigin,
);

ResponseBlocks.displayName = 'ResponseBlocks';

const MarkdownBlockItem = memo(
  function MarkdownBlockItem({
    messageId,
    partIdx,
    index,
    options,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
  }: {
    messageId: string;
    partIdx: number;
    index: number;
    options?: Options;
    allowedImagePrefixes?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['allowedImagePrefixes'];
    allowedLinkPrefixes?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['allowedLinkPrefixes'];
    defaultOrigin?: ComponentProps<
      ReturnType<typeof hardenReactMarkdown>
    >['defaultOrigin'];
  }) {
    const block = useMarkdownBlockByIndex(messageId, partIdx, index);
    if (block === null || block.trim() === '') return null;
    return (
      <MemoizedHardenedMarkdownBlock
        key={`markdown-block-${index}`}
        content={block}
        options={options}
        allowedImagePrefixes={allowedImagePrefixes}
        allowedLinkPrefixes={allowedLinkPrefixes}
        defaultOrigin={defaultOrigin}
      />
    );
  },
  (prev, next) =>
    prev.messageId === next.messageId &&
    prev.partIdx === next.partIdx &&
    prev.index === next.index &&
    prev.options === next.options &&
    prev.allowedImagePrefixes === next.allowedImagePrefixes &&
    prev.allowedLinkPrefixes === next.allowedLinkPrefixes &&
    prev.defaultOrigin === next.defaultOrigin,
);

MarkdownBlockItem.displayName = 'MarkdownBlockItem';

// TODO: Should we define these components here or in Markdown.tsx?
const components: Options['components'] = {
  ol: MemoOl,
  li: MemoLi,
  ul: MemoUl,
  hr: MemoHr,
  strong: MemoStrong,
  a: MemoA,
  h1: MemoH1,
  h2: MemoH2,
  h3: MemoH3,
  h4: MemoH4,
  h5: MemoH5,
  h6: MemoH6,
  table: MemoTable,
  thead: MemoThead,
  tbody: MemoTbody,
  tr: MemoTr,
  th: MemoTh,
  td: MemoTd,
  blockquote: MemoBlockquote,
  code: MemoCode,
  pre: MemoPre,
};

export const Response = memo(
  ({
    className,
    options,
    children,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    messageId,
    partIdx,
    ...props
  }: ResponseProps) => {
    // Whether to render using store-driven markdown blocks
    const useStoreBlocks =
      typeof messageId === 'string' && typeof partIdx === 'number';

    // Parse the children to remove incomplete markdown tokens if enabled (when not using store blocks)
    const parsedChildren =
      !useStoreBlocks &&
      typeof children === 'string' &&
      shouldParseIncompleteMarkdown
        ? parseIncompleteMarkdown(children)
        : children;

    return (
      <div
        className={cn(
          'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 space-y-4',
          className,
        )}
        {...props}
      >
        {useStoreBlocks ? (
          <ResponseBlocks
            messageId={messageId as string}
            partIdx={partIdx as number}
            options={options}
            allowedImagePrefixes={allowedImagePrefixes}
            allowedLinkPrefixes={allowedLinkPrefixes}
            defaultOrigin={defaultOrigin}
          />
        ) : (
          <MemoizedHardenedMarkdown
            id="response"
            content={parsedChildren ?? ''}
            options={options}
            allowedImagePrefixes={allowedImagePrefixes}
            allowedLinkPrefixes={allowedLinkPrefixes}
            defaultOrigin={defaultOrigin}
          />
        )}
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.messageId === nextProps.messageId &&
    prevProps.partIdx === nextProps.partIdx,
);

Response.displayName = 'Response';

export const StyledResponse = memo(
  ({
    className,
    options,
    children,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    ...props
  }: ResponseProps) => {
    // Parse the children to remove incomplete markdown tokens if enabled
    const parsedChildren =
      typeof children === 'string' && shouldParseIncompleteMarkdown
        ? parseIncompleteMarkdown(children)
        : children;

    return (
      <div
        className={cn(
          'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          className,
        )}
        {...props}
      >
        <HardenedMarkdown
          components={components}
          rehypePlugins={[rehypeKatex]}
          remarkPlugins={[remarkGfm, remarkMath]}
          allowedImagePrefixes={allowedImagePrefixes ?? ['*']}
          allowedLinkPrefixes={allowedLinkPrefixes ?? ['*']}
          defaultOrigin={defaultOrigin}
          {...options}
        >
          {parsedChildren}
        </HardenedMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

StyledResponse.displayName = 'StyedResponse';
