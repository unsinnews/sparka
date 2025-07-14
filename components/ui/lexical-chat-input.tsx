'use client';

import * as React from 'react';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type EditorState,
  type LexicalEditor,
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
import { cn } from '@/lib/utils';

// Plugin to get editor instance for imperative ref
function EditorRefPlugin({
  setEditor,
}: { setEditor: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    setEditor(editor);
  }, [editor, setEditor]);

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

const theme = {
  root: 'lexical-root',
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
};

function onError(error: Error) {
  console.error('Lexical error:', error);
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
      'data-testid': testId,
      ...props
    },
    ref,
  ) => {
    const [editor, setEditor] = React.useState<LexicalEditor | null>(null);

    const initialConfig: InitialConfigType = {
      namespace: 'LexicalChatInput',
      theme,
      onError,
      nodes: [],
    };

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
            });
          }
        },
      }),
      [editor],
    );

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
                  'focus:outline-none focus-visible:outline-none',
                  '[&>.lexical-root]:min-h-[20px] [&>.lexical-root]:outline-none',
                  'lexical-content-editable',
                  'editor-input',
                  className,
                )}
                style={{
                  WebkitBoxShadow: 'none',
                  MozBoxShadow: 'none',
                  boxShadow: 'none',
                }}
                data-testid={testId}
                spellCheck={true}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                // aria-placeholder={placeholder}
              />
            }
            placeholder={<PlaceholderComponent />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          {/* {autoFocus && <AutoFocusPlugin />} */}
          <EditorRefPlugin setEditor={setEditor} />
        </div>
      </LexicalComposer>
    );
  },
);

LexicalChatInput.displayName = 'LexicalChatInput';

export type { LexicalChatInputRef };
