import type { ModelMessage, FileUIPart } from 'ai';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { retrieve } from '@/lib/ai/tools/retrieve';
import { webSearch } from '@/lib/ai/tools/web-search';
import { stockChart } from '@/lib/ai/tools/stock-chart';
import { codeInterpreter } from '@/lib/ai/tools/code-interpreter';
import type { Session } from 'next-auth';
import { deepResearch } from '@/lib/ai/tools/deep-research/tool';
import { readDocument } from '@/lib/ai/tools/read-document';
import { generateImage } from '@/lib/ai/tools/generate-image';
import type { AvailableProviderModels } from '@/lib/ai/all-models';
import type { StreamWriter } from '../types';

export function getTools({
  dataStream,
  session,
  contextForLLM,
  messageId,
  selectedModel,
  attachments = [],
  lastGeneratedImage = null,
}: {
  dataStream: StreamWriter;
  session: Session;
  contextForLLM?: ModelMessage[];
  messageId: string;
  selectedModel: AvailableProviderModels;
  attachments: Array<FileUIPart>;
  lastGeneratedImage: { imageUrl: string; name: string } | null;
}) {
  return {
    getWeather,
    createDocument: createDocument({
      session,
      dataStream,
      contextForLLM,
      messageId,
      selectedModel,
    }),
    updateDocument: updateDocument({
      session,
      dataStream,
      messageId,
      selectedModel,
    }),
    requestSuggestions: requestSuggestions({
      session,
      dataStream,
    }),
    readDocument: readDocument({
      session,
      dataStream,
    }),
    // reasonSearch: createReasonSearch({
    //   session,
    //   dataStream,
    // }),
    retrieve,
    webSearch: webSearch({ session, dataStream }),
    stockChart,
    codeInterpreter,
    generateImage: generateImage({ attachments, lastGeneratedImage }),
    deepResearch: deepResearch({ session, dataStream, messageId }),
  };
}

export type ToolDefinition = {
  name: string;
  description: string;
  cost: number;
};
