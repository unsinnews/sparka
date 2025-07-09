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
import type { StreamWriter, ToolNames } from '../types';

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

type ToolDefinition = {
  name: string;
  description: string;
  cost: number;
};

export const toolsDefinitions: Record<ToolNames, ToolDefinition> = {
  getWeather: {
    name: 'getWeather',
    description: 'Get the weather in a specific location',
    cost: 1,
  },
  createDocument: {
    name: 'createDocument',
    description: 'Create a new document',
    cost: 5,
  },
  updateDocument: {
    name: 'updateDocument',
    description: 'Update a document',
    cost: 5,
  },
  requestSuggestions: {
    name: 'requestSuggestions',
    description: 'Request suggestions for a document',
    cost: 1,
  },
  readDocument: {
    name: 'readDocument',
    description: 'Read the content of a document',
    cost: 1,
  },
  // reasonSearch: {
  //   name: 'reasonSearch',
  //   description: 'Search with reasoning',
  //   cost: 50,
  // },
  retrieve: {
    name: 'retrieve',
    description: 'Retrieve information from the web',
    cost: 1,
  },
  webSearch: {
    name: 'webSearch',
    description: 'Search the web',
    cost: 3,
  },
  stockChart: {
    name: 'stockChart',
    description: 'Get the stock chart for a specific stock',
    cost: 1,
  },
  codeInterpreter: {
    name: 'codeInterpreter',
    description: 'Interpret code in a virtual environment',
    cost: 10,
  },
  generateImage: {
    name: 'generateImage',
    description: 'Generate images from text descriptions',
    cost: 5,
  },
  deepResearch: {
    name: 'deepResearch',
    description: 'Research a topic',
    cost: 50,
  },
};

export const allTools: ToolNames[] = Object.keys(
  toolsDefinitions,
) as ToolNames[];
