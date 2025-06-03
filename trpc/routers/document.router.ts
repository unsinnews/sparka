import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/trpc/init';
import {
  getDocumentById,
  getDocumentsById,
  saveDocument,
} from '@/lib/db/queries';
import type { ArtifactKind } from '@/components/artifact';

export const documentRouter = createTRPCRouter({
  getDocuments: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const documents = await getDocumentsById({
        id: input.id,
        userId: ctx.user?.id,
      });

      if (documents.length === 0) {
        throw new Error('Document not found');
      }

      return documents;
    }),

  saveDocument: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string(),
        title: z.string(),
        kind: z.custom<ArtifactKind>(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const lastDocument = await getDocumentById({ id: input.id });

      if (!lastDocument) {
        throw new Error('Document not found');
      }

      const document = await saveDocument({
        id: input.id,
        content: input.content,
        title: input.title,
        kind: input.kind,
        userId: ctx.user.id,
        messageId: lastDocument.messageId,
      });

      return document;
    }),
});
