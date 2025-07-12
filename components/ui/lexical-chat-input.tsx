'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  $getRoot,
  type EditorState,
  type LexicalEditor,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import {
  LexicalComposer,
  type InitialConfigType,
} from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';

// Custom plugin for focus management
function FocusPlugin({
  autoFocus,
}: {
  autoFocus?: boolean;
}) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (autoFocus) {
      editor.focus();
    }
  }, [editor, autoFocus]);

  return null;
}

interface LexicalChatInputRef {
  focus: () => void;
  clear: () => void;
}

interface LexicalChatInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onPaste?: (event: React.ClipboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  maxRows?: number;
  'data-testid'?: string;
}

export const LexicalChatInput = React.forwardRef<
  LexicalChatInputRef,
  LexicalChatInputProps
>(
  (
    {
      value = '',
      onChange,
      onKeyDown,
      onPaste,
      placeholder = 'Type a message...',
      autoFocus = false,
      className,
      maxRows = 12,
      'data-testid': testId,
      ...props
    },
    ref,
  ) => {
    const [editor, setEditor] = React.useState<LexicalEditor | null>(null);
    const lineHeight = 24;
    const maxHeight = lineHeight * maxRows;

    const initialConfig: InitialConfigType = {
      namespace: 'LexicalChatInput',
      theme: {
        root: 'lexical-root',
        text: {
          bold: 'lexical-text-bold',
          italic: 'lexical-text-italic',
          underline: 'lexical-text-underline',
        },
      },
      onError: (error: Error) => {
        console.error('Lexical error:', error);
      },
      nodes: [], // Plain text only, no custom nodes
      editorState: () => {
        // Ensure there's always a paragraph node for cursor placement
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        root.append(paragraph);
      },
    };

    // Handle value changes from parent
    React.useEffect(() => {
      if (editor && value !== undefined) {
        editor.update(() => {
          const root = $getRoot();
          const currentText = root.getTextContent();

          if (currentText !== value) {
            root.clear();
            const paragraph = $createParagraphNode();
            if (value) {
              const textNode = $createTextNode(value);
              paragraph.append(textNode);
            }
            root.append(paragraph);
          }
        });
      }
    }, [editor, value]);

    const handleChange = React.useCallback(
      (editorState: EditorState) => {
        if (onChange) {
          editorState.read(() => {
            const root = $getRoot();
            const textContent = root.getTextContent();
            onChange(textContent);
          });
        }
      },
      [onChange],
    );

    React.useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          if (editor) {
            editor.focus();
          }
        },
        clear: () => {
          if (editor) {
            editor.update(() => {
              const root = $getRoot();
              root.clear();
              // Ensure there's always a paragraph node for cursor placement
              const paragraph = $createParagraphNode();
              root.append(paragraph);
            });
          }
        },
      }),
      [editor],
    );

    const PlaceholderComponent = React.useCallback(
      () => (
        <div className="lexical-placeholder absolute pointer-events-none text-muted-foreground pl-3 pt-2">
          {placeholder}
        </div>
      ),
      [placeholder],
    );

    return (
      <LexicalComposer initialConfig={initialConfig}>
        <div className="lexical-editor-container">
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                className={cn(
                  'flex min-h-[60px] items-start pl-1 w-full resize-none border-0 bg-transparent p-2 focus-visible:ring-0 shadow-none outline-none overflow-auto lexical-content-editable',
                  'focus:outline-none focus-visible:outline-none',
                  className,
                )}
                style={{
                  WebkitBoxShadow: 'none',
                  MozBoxShadow: 'none',
                  boxShadow: 'none',
                  minHeight: '80px',
                  maxHeight: `${maxHeight}px`,
                }}
                data-testid={testId}
                spellCheck={true}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
              />
            }
            placeholder={<PlaceholderComponent />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <FocusPlugin autoFocus={autoFocus} />
          <EditorRefPlugin setEditor={setEditor} />
        </div>
      </LexicalComposer>
    );
  },
);

// Plugin to get editor instance
function EditorRefPlugin({
  setEditor,
}: { setEditor: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    setEditor(editor);
  }, [editor, setEditor]);

  return null;
}

LexicalChatInput.displayName = 'LexicalChatInput';

export type { LexicalChatInputRef };
