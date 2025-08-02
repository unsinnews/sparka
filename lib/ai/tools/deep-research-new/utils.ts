import type { DeepResearchConfig, SearchAPI } from './configuration';
import type { ModelMessage, ToolModelMessage, UIMessage } from 'ai';
import { experimental_createMCPClient } from 'ai';

import type { ModelId } from '@/lib/ai/model-id';
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

type McpClient = Awaited<ReturnType<typeof experimental_createMCPClient>>;
type McpToolSet = Awaited<ReturnType<McpClient['tools']>>;

export async function loadMcpTools(
  config: DeepResearchConfig,
  existingToolNames: Set<string>,
) {
  if (!config.mcp_config?.url) {
    return {};
  }

  let client: McpClient | null = null;
  try {
    // Create MCP client based on configuration
    // Currently supports SSE transport only
    client = await experimental_createMCPClient({
      transport: {
        type: 'sse',
        url: config.mcp_config.url,
      },
    });

    // Get all available tools from the MCP server
    const tools = await client.tools();

    // Filter tools based on configuration and existing tools
    const filteredTools: McpToolSet = {};

    for (const [toolName, tool] of Object.entries(tools)) {
      // Skip if tool already exists
      if (existingToolNames.has(toolName)) {
        console.log(
          `Skipping tool ${toolName} because a tool with that name already exists`,
        );
        continue;
      }

      // If specific tools are configured, only include those
      if (config.mcp_config.tools && config.mcp_config.tools.length > 0) {
        if (!config.mcp_config.tools.includes(toolName)) {
          console.log(
            `Skipping tool ${toolName} because it's not in the config`,
          );
          continue;
        }
      }

      filteredTools[toolName] = tool;
    }

    return filteredTools;
  } catch (error) {
    console.error('Failed to load MCP tools:', error);
    return {};
  } finally {
    // Clean up the client connection
    if (client) {
      await client.close();
    }
  }
}

// Tool Utils

export function getSearchTool(
  searchApi: SearchAPI,
  config: DeepResearchConfig,
  dataStream: StreamWriter,
  id?: string,
) {
  return {
    webSearch: webSearch({ dataStream, writeTopLevelUpdates: false }),
  };
}

export async function getAllTools(
  config: DeepResearchConfig,
  dataStream: StreamWriter,
  id?: string,
) {
  if (config.search_api === 'none') {
    const mcpTools = await loadMcpTools(config, new Set<string>());
    return mcpTools;
  }

  const searchTools = getSearchTool(config.search_api, config, dataStream, id);
  const existingToolNames = new Set<string>(Object.keys(searchTools));

  const mcpTools = await loadMcpTools(config, existingToolNames);

  return { ...mcpTools, ...searchTools };
}

export function getNotesFromToolCalls(messages: ModelMessage[]): string[] {
  return (
    messages
      .filter<ToolModelMessage>((message) => message.role === 'tool')
      // TODO: This might need to be improved to get the output of the tool call parts
      .map((message) => JSON.stringify(message.content))
  );
}

export function getModelContextWindow(modelId: ModelId): number {
  return getModelDefinition(modelId).context_window;
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
