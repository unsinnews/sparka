import type { DeepResearchConfig, SearchAPI } from './configuration';
import type { ModelMessage, Tool, ToolModelMessage, UIMessage } from 'ai';

import type { ModelId } from '@/lib/ai/model-id';
import type { ToolCall } from '@ai-sdk/provider-utils';
import type { StreamWriter } from '@/lib/ai/types';
import { multiQueryWebSearchStep } from '../steps/multi-query-web-search';
import { deduplicateByDomainAndUrl } from '../steps/search-utils';
import { webSearch } from '../web-search';
import { getModelDefinition } from '../../all-models';

// TODO: verify if these types match langchain types
type BaseMessage = ModelMessage;
type HumanMessage = UIMessage;

// Types and interfaces
interface SearchResult {
  title: string;
  content: string;
  url: string;
  query?: string;
}

interface TavilySearchResponse {
  query: string;
  results: SearchResult[];
}

interface McpConfig {
  url: string;
  auth_required: boolean;
  tools: string[];
}

interface TokenData {
  access_token: string;
  expires_in: number;
  created_at: Date;
}

type TopicType = 'general' | 'news' | 'finance';

const MODEL_TOKEN_LIMITS: Partial<Record<ModelId, number>> = {
  'openai/gpt-4.1-mini': 1047576,
  'openai/gpt-4.1-nano': 1047576,
  'openai/gpt-4.1': 1047576,
  'openai/gpt-4o-mini': 128000,
  'openai/gpt-4o': 128000,
  'openai/o4-mini': 200000,
  'openai/o3-mini': 200000,
  'openai/o3': 200000,
  'openai/o1': 200000,
  'anthropic/claude-4-opus': 200000,
  'anthropic/claude-4-sonnet': 200000,
  'anthropic/claude-3.7-sonnet': 200000,
  'anthropic/claude-3.5-sonnet': 200000,
  'anthropic/claude-3.5-haiku': 200000,
  'cohere/command-r-plus': 128000,
  'cohere/command-r': 128000,
  'mistral/mistral-large': 32768,
  'mistral/mistral-small': 32768,
};

// Tavily Search Tool Utils

export async function tavilySearch(
  queries: string[],
  config: DeepResearchConfig,
  dataStream: StreamWriter,
  maxResults = 5,
  topic: TopicType = 'general',
  id?: string,
): Promise<string> {
  // Use singleQueryWebSearchStep with tavily provider for each query
  const searchResult = await multiQueryWebSearchStep({
    queries: queries.map((query, index) => ({
      query,
      rationale: '',
      priority: index,
    })),
    options: {
      baseProviderOptions: {
        provider: 'tavily',
        searchDepth: 'basic',
        includeAnswer: true,
        includeImages: false,
        includeImageDescriptions: false,
      },
      topics: [topic],
      excludeDomains: [],
      maxResultsPerQuery: maxResults,
    },
    dataStream,
  });

  const searchResults = searchResult.searches;

  // Format the search results and deduplicate results by URL
  let formattedOutput = 'Search results: \n\n';

  const allResults = searchResults.flatMap((result) => result.results);
  const deduplicatedResults = deduplicateByDomainAndUrl(allResults);

  let i = 0;
  for (const result of deduplicatedResults) {
    i++;
    formattedOutput += `\n\n--- SOURCE ${i}: ${result.title} ---\n`;
    formattedOutput += `URL: ${result.url}\n\n`;
    formattedOutput += `CONTENT:\n${result.content}\n\n`;
    formattedOutput += `\n\n${'-'.repeat(80)}\n`;
  }

  if (allResults.length > 0) {
    return formattedOutput;
  } else {
    return 'No valid search results found. Please try different search queries or use a different search API.';
  }
}

// MCP Utils

export async function getMcpAccessToken(
  supabaseToken: string,
  baseMcpUrl: string,
): Promise<any | null> {
  try {
    const formData = new URLSearchParams({
      client_id: 'mcp_default',
      subject_token: supabaseToken,
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      resource: `${baseMcpUrl.replace(/\/$/, '')}/mcp`,
      subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    });

    const response = await fetch(
      `${baseMcpUrl.replace(/\/$/, '')}/oauth/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      },
    );

    if (response.ok) {
      return await response.json();
    } else {
      const responseText = await response.text();
      console.error(`Token exchange failed: ${responseText}`);
    }
  } catch (error) {
    console.error(`Error during token exchange: ${error}`);
  }
  return null;
}

// TODO: Decide how to replace these get tokens / set tokens / fetch tokens / wrapMcpAuthenticateTool / loadMcpTools
export async function getTokens(
  config: DeepResearchConfig,
): Promise<TokenData | null> {
  // Simplified - no thread/user concept needed for basic deep research
  return null;
}

export async function setTokens(
  config: DeepResearchConfig,
  tokens: Record<string, any>,
): Promise<void> {
  // Simplified - no token storage needed for basic deep research
  return;
}

export async function fetchTokens(
  config: DeepResearchConfig,
): Promise<Record<string, any> | null> {
  // Simplified - no token fetching needed for basic deep research
  return null;
}

export function wrapMcpAuthenticateTool(tool: Tool): Tool {
  // This needs to be implemented based on actual MCP error handling
  return tool;
}

export async function loadMcpTools(
  config: DeepResearchConfig,
  existingToolNames: Set<string>,
): Promise<Record<string, Tool>> {
  // This will need MCP client implementation
  return {};
}

// Tool Utils

export async function getSearchTool(
  searchApi: SearchAPI,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
  id?: string,
): Promise<Record<string, Tool>> {
  switch (searchApi) {
    // TODO: Figure out how to add ANTHROPIC and OPENAI tools
    // case 'ANTHROPIC':
    //   return {
    //     web_search: {
    //       type: 'web_search_20250305',
    //       name: 'web_search',
    //       max_uses: 5,
    //     },
    //   };
    // case 'OPENAI':
    //   return { web_search: { type: 'web_search_preview' } };
    case 'tavily':
      return {
        web_search: webSearch({ dataStream, writeTopLevelUpdates: false }),
      };
    case 'none':
      return {};
    default:
      return {};
  }
}

export async function getAllTools(
  config: DeepResearchConfig,
  dataStream: StreamWriter,
  id?: string,
): Promise<Record<string, Tool>> {
  const tools: Record<string, Tool> = {}; // Add ResearchComplete tool here

  const searchApi = getConfigValue(config.search_api) as SearchAPI;

  const searchTools = await getSearchTool(searchApi, config, dataStream, id);
  Object.assign(tools, searchTools);

  const existingToolNames = new Set<string>(
    // TODO: how do we get tool names from mcp
    Object.keys(tools),
  );

  const mcpTools = await loadMcpTools(config, existingToolNames);
  Object.assign(tools, mcpTools);

  return tools;
}

export function getNotesFromToolCalls(messages: ModelMessage[]): string[] {
  return (
    messages
      .filter<ToolModelMessage>((message) => message.role === 'tool')
      // TODO: This might need to be improved to get the output of the tool call parts
      .map((message) => JSON.stringify(message.content))
  );
}

// Model Provider Native Websearch Utils

export function anthropicWebsearchCalled(response: any): boolean {
  // TODO: Implement these checks
  try {
    const usage = response.response_metadata?.usage;
    if (!usage) return false;

    const serverToolUse = usage.server_tool_use;
    if (!serverToolUse) return false;

    const webSearchRequests = serverToolUse.web_search_requests;
    if (webSearchRequests === null || webSearchRequests === undefined)
      return false;

    return webSearchRequests > 0;
  } catch {
    return false;
  }
}

export function openaiWebsearchCalled(response: any): boolean {
  // TODO: Implement a check for openai specifically
  return false;
}

export function webSearchToolCalled(
  toolCalls: ToolCall<string, any>[],
): boolean {
  return toolCalls.some((toolCall) => toolCall.toolName === 'web_search');
}

// Token Limit Exceeded Utils

export function isTokenLimitExceeded(
  exception: Error,
  modelName?: string,
): boolean {
  const errorStr = exception.message.toLowerCase();
  let provider: string | null = null;

  if (modelName) {
    const modelStr = modelName.toLowerCase();
    if (modelStr.startsWith('openai:')) {
      provider = 'openai';
    } else if (modelStr.startsWith('anthropic:')) {
      provider = 'anthropic';
    } else if (
      modelStr.startsWith('gemini:') ||
      modelStr.startsWith('google:')
    ) {
      provider = 'gemini';
    }
  }

  if (provider === 'openai') {
    return checkOpenaiTokenLimit(exception, errorStr);
  } else if (provider === 'anthropic') {
    return checkAnthropicTokenLimit(exception, errorStr);
  } else if (provider === 'gemini') {
    return checkGeminiTokenLimit(exception, errorStr);
  }

  return (
    checkOpenaiTokenLimit(exception, errorStr) ||
    checkAnthropicTokenLimit(exception, errorStr) ||
    checkGeminiTokenLimit(exception, errorStr)
  );
}

function checkOpenaiTokenLimit(exception: Error, errorStr: string): boolean {
  const exceptionType = exception.constructor.name;
  const isBadRequest = ['BadRequestError', 'InvalidRequestError'].includes(
    exceptionType,
  );

  if (isBadRequest) {
    const tokenKeywords = [
      'token',
      'context',
      'length',
      'maximum context',
      'reduce',
    ];
    if (tokenKeywords.some((keyword) => errorStr.includes(keyword))) {
      return true;
    }
  }

  return false;
}

function checkAnthropicTokenLimit(exception: Error, errorStr: string): boolean {
  const exceptionType = exception.constructor.name;
  const isBadRequest = exceptionType === 'BadRequestError';

  if (isBadRequest && errorStr.includes('prompt is too long')) {
    return true;
  }

  return false;
}

function checkGeminiTokenLimit(exception: Error, errorStr: string): boolean {
  const exceptionType = exception.constructor.name;
  const isResourceExhausted = [
    'ResourceExhausted',
    'GoogleGenerativeAIFetchError',
  ].includes(exceptionType);

  return isResourceExhausted;
}

export function getModelContextWindow(modelId: ModelId): number {
  return getModelDefinition(modelId).context_window;
}

export function removeUpToLastAiMessage(
  messages: BaseMessage[],
): BaseMessage[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      return messages.slice(0, i);
    }
  }
  return messages;
}

// Misc Utils

export function getTodayStr(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getConfigValue(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'object') {
    return value;
  } else {
    return value.value;
  }
}

export function getApiKeyForModel(
  modelName: string,
  config: DeepResearchConfig,
): string | null {
  const shouldGetFromConfig = process.env.GET_API_KEYS_FROM_CONFIG === 'true';
  const modelNameLower = modelName.toLowerCase();

  if (shouldGetFromConfig) {
    // Simplified - get from env vars only
    const apiKeys = process.env;

    if (modelNameLower.startsWith('openai:')) {
      return apiKeys.OPENAI_API_KEY || null;
    } else if (modelNameLower.startsWith('anthropic:')) {
      return apiKeys.ANTHROPIC_API_KEY || null;
    } else if (modelNameLower.startsWith('google')) {
      return apiKeys.GOOGLE_API_KEY || null;
    }
    return null;
  } else {
    if (modelNameLower.startsWith('openai:')) {
      return process.env.OPENAI_API_KEY || null;
    } else if (modelNameLower.startsWith('anthropic:')) {
      return process.env.ANTHROPIC_API_KEY || null;
    } else if (modelNameLower.startsWith('google')) {
      return process.env.GOOGLE_API_KEY || null;
    }
    return null;
  }
}

export function getTavilyApiKey(config?: DeepResearchConfig): string | null {
  const shouldGetFromConfig = process.env.GET_API_KEYS_FROM_CONFIG === 'true';

  if (shouldGetFromConfig) {
    // Simplified - get from env vars only
    return process.env.TAVILY_API_KEY || null;
  } else {
    return process.env.TAVILY_API_KEY || null;
  }
}
