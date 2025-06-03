'use client';

import { isAfter } from 'date-fns';
import { motion } from 'motion/react';
import { useWindowSize } from 'usehooks-ts';

import type { Document } from '@/lib/db/schema';
import { getDocumentTimestampByIndex } from '@/lib/utils';

import { LoaderIcon } from './icons';
import { Button } from './ui/button';
import { useArtifact } from '@/hooks/use-artifact';
import { useTRPC } from '@/trpc/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface VersionFooterProps {
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  documents: Array<Document> | undefined;
  currentVersionIndex: number;
}

export const VersionFooter = ({
  handleVersionChange,
  documents,
  currentVersionIndex,
}: VersionFooterProps) => {
  const { artifact } = useArtifact();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { width } = useWindowSize();
  const isMobile = width < 768;

  const saveDocumentMutation = useMutation(
    trpc.document.saveDocument.mutationOptions({
      onMutate: async (newDoc) => {
        const queryKey = trpc.document.getDocuments.queryKey({
          id: artifact.documentId,
        });
        await queryClient.cancelQueries({ queryKey });

        const previousDocuments =
          queryClient.getQueryData<Document[]>(queryKey);

        if (previousDocuments && documents) {
          const optimisticData = documents.filter((document) =>
            isAfter(
              new Date(document.createdAt),
              new Date(
                getDocumentTimestampByIndex(documents, currentVersionIndex),
              ),
            ),
          );

          // Add the restored version as a new document
          const versionToRestore = documents[currentVersionIndex];
          if (versionToRestore) {
            const restoredDocument: Document = {
              ...versionToRestore,
              createdAt: new Date(),
              content: newDoc.content,
              title: newDoc.title,
              kind: newDoc.kind,
              messageId: artifact.messageId,
            };
            optimisticData.push(restoredDocument);
          }

          queryClient.setQueryData<Document[]>(queryKey, optimisticData);
        }

        return { previousDocuments };
      },
      onError: (err, newDoc, context) => {
        if (context?.previousDocuments) {
          const queryKey = trpc.document.getDocuments.queryKey({
            id: artifact.documentId,
          });
          queryClient.setQueryData<Document[]>(
            queryKey,
            context.previousDocuments,
          );
        }
      },
      onSettled: () => {
        const queryKey = trpc.document.getDocuments.queryKey({
          id: artifact.documentId,
        });
        queryClient.invalidateQueries({ queryKey });
      },
    }),
  );

  if (!documents) return;

  return (
    <motion.div
      className="absolute flex flex-col gap-4 lg:flex-row bottom-0 bg-background p-4 w-full border-t z-50 justify-between"
      initial={{ y: isMobile ? 200 : 77 }}
      animate={{ y: 0 }}
      exit={{ y: isMobile ? 200 : 77 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20 }}
    >
      <div>
        <div>You are viewing a previous version</div>
        <div className="text-muted-foreground text-sm">
          Restore this version to make edits
        </div>
      </div>

      <div className="flex flex-row gap-4">
        <Button
          disabled={saveDocumentMutation.isPending}
          onClick={async () => {
            const versionToRestore = documents[currentVersionIndex];

            saveDocumentMutation.mutate({
              id: artifact.documentId,
              content: versionToRestore.content ?? '',
              title: versionToRestore.title,
              kind: versionToRestore.kind,
            });
          }}
        >
          <div>Restore this version</div>
          {saveDocumentMutation.isPending && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            handleVersionChange('latest');
          }}
        >
          Back to latest version
        </Button>
      </div>
    </motion.div>
  );
};
