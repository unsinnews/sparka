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
import type { AvailableProviderModels } from '@/lib/ai/all-models';

interface CreateDocumentProps {
  session: Session;
  dataStream: AnnotationDataStreamWriter;
  contextForLLM?: CoreMessage[];
  messageId: string;
  selectedModel: AvailableProviderModels;
}

export const createDocumentTool = ({
  session,
  dataStream,
  contextForLLM,
  messageId,
  selectedModel,
}: CreateDocumentProps) =>
  tool({
    description: `Create a persistent document (text, code, image, or spreadsheet).  This tool orchestrates the downstream handlers that actually generate the file based on the provided title, kind and description.

Usage:
- Substantial content (>10 lines), code, images or spreadsheets
- Deliverables the user will likely save/reuse (emails, essays, code, etc.)
- Explicit "create a document" like requests
- Single-snippet code answers with Python language (always wrap in an artifact)
  - Specify language with backticks, e.g. \`\`\`python\`code here\`\`\` (only Python supported for now)
- When you have all the information available to create the document, use this tool.
- This tool will display the document content in the chat.


For code artifacts (only code artifacts):
- The title MUST include the appropriate file extension (e.g., "script.py", "component.tsx", "utils.js")
- This extension will be used to determine syntax highlighting

Avoid:
- Purely conversational or explanatory responses that belong in chat
- "Keep it in chat" requests`,
    parameters: z.object({
      title: z
        .string()
        .describe(
          'For code artifacts, must include file extension (e.g., "script.py", "App.tsx", "utils.js"). For other artifacts, just the filename',
        ),
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
        selectedModel,
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
  selectedModel,
}: {
  dataStream: AnnotationDataStreamWriter;
  kind: string;
  title: string;
  description: string;
  session: Session;
  prompt: string;
  messageId: string;
  selectedModel: AvailableProviderModels;
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
    selectedModel,
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
