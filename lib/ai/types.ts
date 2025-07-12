import { z } from 'zod';
import type { getWeather } from '@/lib/ai/tools/get-weather';
import type { updateDocument } from '@/lib/ai/tools/update-document';
import type { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import type { deepResearch } from '@/lib/ai/tools/deep-research/tool';
import type { readDocument } from '@/lib/ai/tools/read-document';
import type { generateImage } from '@/lib/ai/tools/generate-image';
import type { webSearch } from '@/lib/ai/tools/web-search';
import type { stockChart } from '@/lib/ai/tools/stock-chart';
import type { codeInterpreter } from '@/lib/ai/tools/code-interpreter';
import type { retrieve } from '@/lib/ai/tools/retrieve';
import type { InferUITool, UIMessage, UIMessageStreamWriter } from 'ai';

import type { ArtifactKind } from '@/components/artifact';
import type { Suggestion } from '@/lib/db/schema';
import type { createDocument } from './tools/create-document';
import type { ResearchUpdate } from './tools/research-updates-schema';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.date(),
  isPartial: z.boolean().optional(),
  parentMessageId: z.string().nullable(),
  selectedModel: z.string().nullable(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;
type deepResearchTool = InferUITool<ReturnType<typeof deepResearch>>;
type readDocumentTool = InferUITool<ReturnType<typeof readDocument>>;
type generateImageTool = InferUITool<ReturnType<typeof generateImage>>;
type webSearchTool = InferUITool<ReturnType<typeof webSearch>>;
type stockChartTool = InferUITool<typeof stockChart>;
type codeInterpreterTool = InferUITool<typeof codeInterpreter>;
type retrieveTool = InferUITool<typeof retrieve>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  deepResearch: deepResearchTool;
  readDocument: readDocumentTool;
  generateImage: generateImageTool;
  webSearch: webSearchTool;
  stockChart: stockChartTool;
  codeInterpreter: codeInterpreterTool;
  retrieve: retrieveTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  messageId: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  researchUpdate: ResearchUpdate;
};

export type ChatMessage = Omit<
  UIMessage<MessageMetadata, CustomUIDataTypes, ChatTools>,
  'metadata'
> & {
  metadata: MessageMetadata;
};

export type ToolNames = keyof ChatTools;

export type StreamWriter = UIMessageStreamWriter<ChatMessage>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}
