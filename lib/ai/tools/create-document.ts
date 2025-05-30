import { generateUUID } from '@/lib/utils';
import { tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';
import type { AnnotationDataStreamWriter } from './annotation-stream';

interface CreateDocumentProps {
  session: Session;
  dataStream: AnnotationDataStreamWriter;
}

export const createDocumentTool = ({
  session,
  dataStream,
}: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    parameters: z.object({
      title: z.string(),
      description: z
        .string()
        .describe('A detailed description of what the document should contain'),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, description, kind }) => {
      const prompt = `
      Title: ${title}
      Description: ${description}
      `;

      return await createDocument({
        dataStream,
        kind,
        title,
        description,
        session,
        prompt,
      });
    },
  });

export async function createDocument({
  dataStream,
  kind,
  title,
  description,
  session,
  prompt,
}: {
  dataStream: AnnotationDataStreamWriter;
  kind: string;
  title: string;
  description: string;
  session: Session;
  prompt: string;
}) {
  const id = generateUUID();

  dataStream.writeData({
    type: 'kind',
    content: kind,
  });

  dataStream.writeData({
    type: 'id',
    content: id,
  });

  dataStream.writeData({
    type: 'title',
    content: title,
  });

  dataStream.writeData({
    type: 'clear',
    content: '',
  });

  const documentHandler = documentHandlersByArtifactKind.find(
    (documentHandlerByArtifactKind) =>
      documentHandlerByArtifactKind.kind === kind,
  );

  if (!documentHandler) {
    throw new Error(`No document handler found for kind: ${kind}`);
  }

  await documentHandler.onCreateDocument({
    id,
    title,
    description,
    dataStream,
    session,
    prompt,
  });

  dataStream.writeData({ type: 'finish', content: '' });

  return {
    id,
    title,
    kind,
    content: 'A document was created and is now visible to the user.',
  };
}
