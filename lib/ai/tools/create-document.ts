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
  messageId: string;
}

export const createDocumentTool = ({
  session,
  dataStream,
  contextForLLM,
  messageId,
}: CreateDocumentProps) =>
  tool({
    description: `Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.

**When to use \`createDocument\`:**
- For substantial content (>10 lines), code, images, or spreadsheets
- For content users will likely save/reuse (emails, code, essays, etc.)
- When explicitly requested to create a document
- For when content contains a single code snippet
- When writing code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat`,
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
        messageId,
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
  messageId,
}: {
  dataStream: AnnotationDataStreamWriter;
  kind: string;
  title: string;
  description: string;
  session: Session;
  prompt: string;
  messageId: string;
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
    type: 'message-id',
    content: messageId,
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
    messageId,
  });

  dataStream.writeData({ type: 'finish', content: '' });

  return {
    id,
    title,
    kind,
    content: 'A document was created and is now visible to the user.',
    success: true as const,
  };
}
