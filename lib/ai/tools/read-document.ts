import { tool } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { getDocumentById } from '@/lib/db/queries';
import type { AnnotationDataStreamWriter } from './annotation-stream';

interface ReadDocumentProps {
  session: Session;
  dataStream: AnnotationDataStreamWriter;
}

export const readDocument = ({ session, dataStream }: ReadDocumentProps) =>
  tool({
    description: `Read the content of a document that has been created in the conversation.

**When to use \`readDocument\`:**
- Use this to read the content of documents that have been created in the conversation
- Useful for follow-up requests after creating a document
- When you need to reference or analyze existing document content
- When the user asks questions about a document they've created

**When NOT to use \`readDocument\`:**
- Do not use this for documents that haven't been created in the current conversation`,
    parameters: z.object({
      id: z.string().describe('The ID of the document to read'),
    }),
    execute: async ({ id }) => {
      const document = await getDocumentById({ id });

      if (!document) {
        return {
          error: 'Document not found',
        };
      }

      if (document.userId !== session.user?.id) {
        return {
          error: 'Unauthorized access to document',
        };
      }

      return {
        id: document.id,
        title: document.title,
        kind: document.kind,
        content: document.content,
        createdAt: document.createdAt,
      };
    },
  });
