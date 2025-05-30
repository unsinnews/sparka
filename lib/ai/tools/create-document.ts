import { generateUUID } from '@/lib/utils';
import { tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';
import type { AnnotationDataStreamWriter } from './annotation-stream';
import type { CoreMessage } from 'ai';

interface CreateDocumentProps {
  session: Session;
  dataStream: AnnotationDataStreamWriter;
  contextForLLM?: CoreMessage[];
}

export const createDocumentTool = ({
  session,
  dataStream,
  contextForLLM,
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
      let prompt = `
      Title: ${title}
      Description: ${description}
      `;

      if (contextForLLM && contextForLLM.length > 0) {
        const conversationContext = contextForLLM
          .map(
            (msg) =>
              `${msg.role}: ${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}`,
          )
          .join('\n');

        prompt = `
      Title: ${title}
      Description: ${description}
      
      Conversation Context:
      ${conversationContext}
      `;
      }

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
