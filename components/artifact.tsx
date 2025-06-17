import type { Attachment } from 'ai';
import { formatDistance } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDebounceCallback, useWindowSize } from 'usehooks-ts';
import type { Document, Vote } from '@/lib/db/schema';
import { MultimodalInput } from './multimodal-input';
import { Toolbar } from './toolbar';
import { VersionFooter } from './version-footer';
import { ArtifactActions } from './artifact-actions';
import { ArtifactCloseButton } from './artifact-close-button';
import { ArtifactMessages } from './artifact-messages';
import { useSidebar } from './ui/sidebar';
import { ScrollArea } from './ui/scroll-area';
import { useArtifact } from '@/hooks/use-artifact';
import { imageArtifact } from '@/artifacts/image/client';
import { codeArtifact } from '@/artifacts/code/client';
import { sheetArtifact } from '@/artifacts/sheet/client';
import { textArtifact } from '@/artifacts/text/client';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { YourUIMessage } from '@/lib/types/ui';
import { useTRPC } from '@/trpc/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatRequestToolsConfig } from '@/app/(chat)/api/chat/route';
import { CloneChatButton } from '@/components/clone-chat-button';

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
];
export type ArtifactKind = (typeof artifactDefinitions)[number]['kind'];

export interface UIArtifact {
  title: string;
  documentId: string;
  kind: ArtifactKind;
  content: string;
  messageId: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

function PureArtifact({
  chatId,
  data,
  setData,
  attachments,
  setAttachments,
  messages,
  chatHelpers,
  votes,
  isReadonly,
  selectedModelId,
  onModelChange,
}: {
  chatId: string;

  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<YourUIMessage>;
  votes: Array<Vote> | undefined;

  data: ChatRequestToolsConfig;
  setData: Dispatch<SetStateAction<ChatRequestToolsConfig>>;
  chatHelpers: UseChatHelpers;
  isReadonly: boolean;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const { artifact, setArtifact, metadata, setMetadata } = useArtifact();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data: documents, isLoading: isDocumentsFetching } = useQuery(
    trpc.document.getDocuments.queryOptions(
      {
        id: artifact.documentId,
      },
      {
        enabled:
          artifact.documentId !== 'init' && artifact.status !== 'streaming',
      },
    ),
  );

  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  const lastSavedContentRef = useRef<string>('');

  const { open: isSidebarOpen } = useSidebar();

  useEffect(() => {
    if (documents && documents.length > 0) {
      // At first we set the most recent document realted to the messageId selected
      const mostRecentDocumentIndex = documents.findLastIndex(
        (document) => document.messageId === artifact.messageId,
      );

      if (mostRecentDocumentIndex !== -1) {
        const mostRecentDocument = documents[mostRecentDocumentIndex];
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(mostRecentDocumentIndex);
        setArtifact((currentArtifact) => ({
          ...currentArtifact,
          content: mostRecentDocument.content ?? '',
        }));
      } else {
        // Fallback to the most recent document
        const document = documents.at(-1);
        if (document) {
          setDocument(document);
          setCurrentVersionIndex(documents.length - 1);
          setArtifact((currentArtifact) => ({
            ...currentArtifact,
            content: document.content ?? '',
          }));
        }
      }
    }
  }, [documents, setArtifact, artifact.messageId]);

  const [isContentDirty, setIsContentDirty] = useState(false);

  const saveDocumentMutation = useMutation(
    trpc.document.saveDocument.mutationOptions({
      // When mutate is called:
      onMutate: async (newDocument) => {
        // Skip optimistic update if this isn't the latest save request
        if (newDocument.content !== lastSavedContentRef.current) {
          return;
        }

        // Cancel any outgoing refetches
        // (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({
          queryKey: trpc.document.getDocuments.queryKey({ id: newDocument.id }),
        });

        // Snapshot the previous value
        const previousDocuments =
          queryClient.getQueryData<Document[]>(
            trpc.document.getDocuments.queryKey({ id: newDocument.id }),
          ) ?? [];

        // Optimistically update to the new value
        const lastDocument = previousDocuments.at(-1);
        if (!lastDocument) {
          return;
        }
        const optimisticData = [
          ...previousDocuments,
          {
            ...lastDocument,
            createdAt: new Date(),
            content: newDocument.content,
            title: newDocument.title,
            kind: newDocument.kind,
            messageId: artifact.messageId,
          },
        ];
        queryClient.setQueryData(
          trpc.document.getDocuments.queryKey({ id: newDocument.id }),
          optimisticData,
        );

        // Return a context with the previous and new todo
        return { previousDocuments, newDocument };
      },
      // If the mutation fails, use the context we returned above
      onError: (err, newDocument, context) => {
        if (context?.previousDocuments) {
          queryClient.setQueryData(
            trpc.document.getDocuments.queryKey({ id: newDocument.id }),
            context.previousDocuments,
          );
        }
        // Only clear dirty flag if this was the latest save request
        if (newDocument.content === lastSavedContentRef.current) {
          setIsContentDirty(false);
        }
      },
      // Always refetch after error or success:
      onSettled: (result, error, params) => {
        // Only invalidate and clear dirty flag if this was the latest save request
        if (params.content === lastSavedContentRef.current) {
          if (saveDocumentMutation.isIdle) {
            queryClient.invalidateQueries({
              queryKey: trpc.document.getDocuments.queryKey({ id: params.id }),
            });
          }
          setIsContentDirty(false);
        }
      },
    }),
  );

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!documents) return;

      const lastDocument = documents.at(-1);
      if (!lastDocument) return;

      if (
        lastDocument?.content !== updatedContent &&
        lastSavedContentRef.current === updatedContent
      ) {
        saveDocumentMutation.mutate({
          id: lastDocument.id,
          title: lastDocument.title,
          content: updatedContent,
          kind: lastDocument.kind,
        });
      }
    },
    [saveDocumentMutation, documents],
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000,
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (isReadonly) {
        return;
      }
      // Update the last saved content reference
      lastSavedContentRef.current = updatedContent;

      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange, isReadonly],
  );

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!documents) return;

    if (type === 'latest') {
      setCurrentVersionIndex(documents.length - 1);
      setMode('edit');
    }

    if (type === 'toggle') {
      setMode((mode) => (mode === 'edit' ? 'diff' : 'edit'));
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === 'next') {
      if (currentVersionIndex < documents.length - 1) {
        setCurrentVersionIndex((index) => index + 1);
      }
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  /*
   * NOTE: if there are no documents, or if
   * the documents are being fetched, then
   * we mark it as the current version.
   */

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!');
  }

  useEffect(() => {
    if (artifact.documentId !== 'init') {
      if (artifactDefinition.initialize) {
        artifactDefinition.initialize({
          documentId: artifact.documentId,
          setMetadata,
        });
      }
    }
  }, [artifact.documentId, artifactDefinition, setMetadata]);

  return (
    <AnimatePresence>
      {artifact.isVisible && (
        <motion.div
          data-testid="artifact"
          className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
        >
          {!isMobile && (
            <motion.div
              className="fixed bg-background h-dvh"
              initial={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
              animate={{ width: windowWidth, right: 0 }}
              exit={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
            />
          )}

          {!isMobile && (
            <motion.div
              className="relative w-[400px] bg-muted dark:bg-background h-dvh shrink-0"
              initial={{ opacity: 0, x: 10, scale: 1 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }}
              exit={{
                opacity: 0,
                x: 0,
                scale: 1,
                transition: { duration: 0 },
              }}
            >
              <AnimatePresence>
                {!isCurrentVersion && (
                  <motion.div
                    className="left-0 absolute h-dvh w-[400px] top-0 bg-zinc-900/50 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>

              <div className="flex flex-col h-full justify-between items-center">
                <ArtifactMessages
                  data={data}
                  chatId={chatId}
                  status={chatHelpers.status}
                  votes={votes}
                  messages={messages}
                  chatHelpers={chatHelpers}
                  isReadonly={isReadonly}
                  isVisible={true}
                  artifactStatus={artifact.status}
                  selectedModelId={selectedModelId}
                />

                {!isReadonly ? (
                  <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
                    <MultimodalInput
                      chatId={chatId}
                      input={chatHelpers.input}
                      setInput={chatHelpers.setInput}
                      handleSubmit={chatHelpers.handleSubmit}
                      data={data}
                      setData={setData}
                      status={chatHelpers.status}
                      stop={chatHelpers.stop}
                      attachments={attachments}
                      setAttachments={setAttachments}
                      messages={messages}
                      append={chatHelpers.append}
                      className="bg-background dark:bg-muted"
                      setMessages={chatHelpers.setMessages}
                      selectedModelId={selectedModelId}
                      onModelChange={onModelChange}
                    />
                  </form>
                ) : (
                  <CloneChatButton chatId={chatId} />
                )}
              </div>
            </motion.div>
          )}

          <motion.div
            className="fixed dark:bg-muted bg-background h-dvh flex flex-col overflow-y-auto md:border-l dark:border-zinc-700 border-zinc-200"
            initial={
              isMobile
                ? {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
                : {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
            }
            animate={
              isMobile
                ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth : 'calc(100dvw)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
                : {
                    opacity: 1,
                    x: 400,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth
                      ? windowWidth - 400
                      : 'calc(100dvw-400px)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
            }
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: 'spring',
                stiffness: 600,
                damping: 30,
              },
            }}
          >
            <div className="p-2 flex flex-row justify-between items-start bg-background/80">
              <div className="flex flex-row gap-4 items-start">
                <ArtifactCloseButton />

                <div className="flex flex-col">
                  <div className="font-medium">{artifact.title}</div>

                  {isContentDirty ? (
                    <div className="text-sm text-muted-foreground">
                      Saving changes...
                    </div>
                  ) : document ? (
                    <div className="text-sm text-muted-foreground">
                      {`Updated ${formatDistance(
                        new Date(document.createdAt),
                        new Date(),
                        {
                          addSuffix: true,
                        },
                      )}`}
                    </div>
                  ) : (
                    <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
                  )}
                </div>
              </div>

              <ArtifactActions
                artifact={artifact}
                currentVersionIndex={currentVersionIndex}
                handleVersionChange={handleVersionChange}
                isCurrentVersion={isCurrentVersion}
                mode={mode}
                metadata={metadata}
                setMetadata={setMetadata}
                isReadonly={isReadonly}
              />
            </div>

            <ScrollArea className="dark:bg-muted h-full !max-w-full">
              <div className="items-center  bg-background/80">
                <artifactDefinition.content
                  title={artifact.title}
                  content={
                    isCurrentVersion
                      ? artifact.content
                      : getDocumentContentById(currentVersionIndex)
                  }
                  mode={mode}
                  status={artifact.status}
                  currentVersionIndex={currentVersionIndex}
                  suggestions={[]}
                  onSaveContent={saveContent}
                  isInline={false}
                  isCurrentVersion={isCurrentVersion}
                  getDocumentContentById={getDocumentContentById}
                  isLoading={isDocumentsFetching && !artifact.content}
                  metadata={metadata}
                  setMetadata={setMetadata}
                  isReadonly={isReadonly}
                />

                <AnimatePresence>
                  {isCurrentVersion && !isReadonly && (
                    <Toolbar
                      isToolbarVisible={isToolbarVisible}
                      setIsToolbarVisible={setIsToolbarVisible}
                      append={chatHelpers.append}
                      status={chatHelpers.status}
                      stop={chatHelpers.stop}
                      setMessages={chatHelpers.setMessages}
                      artifactKind={artifact.kind}
                    />
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            <AnimatePresence>
              {!isCurrentVersion && !isReadonly && (
                <VersionFooter
                  currentVersionIndex={currentVersionIndex}
                  documents={documents}
                  handleVersionChange={handleVersionChange}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => {
  if (prevProps.chatHelpers !== nextProps.chatHelpers) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (!equal(prevProps.messages, nextProps.messages.length)) return false;
  if (prevProps.data !== nextProps.data) return false;
  if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;

  return true;
});
