import { tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { getDocumentById } from '@/lib/db/queries';
import { documentHandlersByArtifactKind } from '@/lib/artifacts/server';
import type { AnnotationDataStreamWriter } from './annotation-stream';

interface UpdateDocumentProps {
  session: Session;
  dataStream: AnnotationDataStreamWriter;
  messageId: string;
}

export const updateDocument = ({
  session,
  dataStream,
  messageId,
}: UpdateDocumentProps) =>
  tool({
    description: `Modify an existing document.

Usage:
- Rewrite the whole document for major changes
- Make targeted edits for isolated changes
- Follow user instructions about which parts to touch
- Wait for user feedback before updating a freshly created document

Avoid:
- Updating immediately after the document was just created`,
    parameters: z.object({
      id: z.string().describe('The ID of the document to update'),
      description: z
        .string()
        .describe('The description of changes that need to be made'),
    }),
    execute: async ({ id, description }) => {
      const document = await getDocumentById({ id });

      if (!document) {
        return {
          success: false as const,
          error: 'Document not found',
        };
      }

      dataStream.writeData({
        type: 'id',
        content: document.id,
      });

      dataStream.writeData({
        type: 'message-id',
        content: messageId,
      });

      dataStream.writeData({
        type: 'clear',
        content: document.title,
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === document.kind,
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${document.kind}`);
      }

      await documentHandler.onUpdateDocument({
        document,
        description,
        dataStream,
        session,
        messageId,
      });

      dataStream.writeData({ type: 'finish', content: '' });

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: 'The document has been updated successfully.',
        success: true as const,
      };
    },
  });
