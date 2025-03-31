import type { ToolCall, ToolResult } from 'ai';
import { createDocumentTool } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { retrieve } from '@/lib/ai/tools/retrieve';
import { webSearch } from '@/lib/ai/tools/web-search';
import { createReasonSearch } from '@/lib/ai/tools/reason-search';
import { stockChart } from '@/lib/ai/tools/stock-chart';
import { codeInterpreter } from '@/lib/ai/tools/code-interpreter';
import type { Session } from 'next-auth';
import { deepResearch } from '@/lib/ai/tools/deep-research/tool';
import type { z } from 'zod';
import type { AnnotationDataStreamWriter } from './annotation-stream';

export function getTools({
  dataStream,
  session,
}: { dataStream: AnnotationDataStreamWriter; session: Session }) {
  return {
    getWeather,
    createDocument: createDocumentTool({
      session,
      dataStream,
    }),
    updateDocument: updateDocument({
      session,
      dataStream,
    }),
    requestSuggestions: requestSuggestions({
      session,
      dataStream,
    }),
    reasonSearch: createReasonSearch({
      session,
      dataStream,
    }),
    retrieve,
    webSearch: webSearch({ session, dataStream }),
    stockChart,
    codeInterpreter,
    deepResearch: deepResearch({ session, dataStream }),
  };
}

type AvailableToolsReturn = ReturnType<typeof getTools>;

export type YourToolName = keyof AvailableToolsReturn;

type ToolResultOf<T extends keyof AvailableToolsReturn> = Awaited<
  ReturnType<AvailableToolsReturn[T]['execute']>
>;

type ToolParametersOf<T extends keyof AvailableToolsReturn> = z.infer<
  AvailableToolsReturn[T]['parameters']
>;

type ToolInvocationOf<T extends YourToolName> =
  | ({
      state: 'partial-call';
      step?: number;
    } & ToolCall<T, ToolParametersOf<T>>)
  | ({
      state: 'call';
      step?: number;
    } & ToolCall<T, ToolParametersOf<T>>)
  | ({
      state: 'result';
      step?: number;
    } & ToolResult<T, ToolParametersOf<T>, ToolResultOf<T>>);

export type YourToolInvocation = {
  [K in YourToolName]: ToolInvocationOf<K>;
}[YourToolName];
