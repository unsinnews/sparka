import { tavily, type TavilySearchOptions } from '@tavily/core';
import FirecrawlApp, { type SearchParams } from '@mendable/firecrawl-js';
import type { StreamWriter } from '../../types';

export type SearchProvider = 'tavily' | 'firecrawl';

export type SearchProviderOptions =
  | ({
      provider: 'tavily';
      maxResults?: number;
    } & Omit<TavilySearchOptions, 'limit'>)
  | ({
      provider: 'firecrawl';
      maxResults?: number;
    } & SearchParams);

export type WebSearchResult = {
  source: 'web';
  title: string;
  url: string;
  content: string;
};

export type WebSearchResponse = {
  results: WebSearchResult[];
  error?: string;
};

// Initialize search providers
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY as string });
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY ?? '',
});

export async function webSearchStep({
  query,
  providerOptions,
  dataStream,
  stepId,
  annotate = true,
}: {
  query: string;
  dataStream: StreamWriter;
  stepId: string;
  providerOptions: SearchProviderOptions;
  annotate?: boolean;
}): Promise<WebSearchResponse> {
  try {
    // Send running status
    if (annotate) {
      dataStream.write({
        type: 'data-researchUpdate',
        data: {
          id: stepId,
          type: 'web',
          status: 'running',
          title: `Searching for "${query}"`,
          query,
          subqueries: [query],
          message: `Searching web sources...`,
          timestamp: Date.now(),
        },
      });
    }

    let results: WebSearchResult[] = [];

    if (providerOptions.provider === 'tavily') {
      const response = await tvly.search(query, {
        searchDepth: providerOptions.searchDepth || 'basic',
        maxResults: providerOptions.maxResults || 5,
        includeAnswer: true,
        ...providerOptions,
      });

      results = response.results.map((r) => ({
        source: 'web',
        title: r.title,
        url: r.url,
        content: r.content,
      }));
    } else if (providerOptions.provider === 'firecrawl') {
      const response = await firecrawl.search(query, {
        timeout: providerOptions.timeout || 15000,
        limit: providerOptions.maxResults || 5,
        scrapeOptions: { formats: ['markdown'] },
        ...providerOptions,
      });

      results = response.data.map((item) => ({
        source: 'web',
        title: item.title || '',
        url: item.url || '',
        content: item.markdown || '',
      }));
    }

    // Send completed status
    if (annotate) {
      dataStream.write({
        type: 'data-researchUpdate',
        data: {
          id: stepId,
          type: 'web',
          status: 'completed',
          title: `Search complete for "${query}"`,
          query,
          subqueries: [query],
          results,
          message: `Found ${results.length} results`,
          timestamp: Date.now(),
          overwrite: true,
        },
      });
    }

    return { results };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error occurred';

    // Send error status
    dataStream.write({
      type: 'data-researchUpdate',
      data: {
        id: stepId,
        type: 'web',
        status: 'completed',
        title: `Search failed for "${query}"`,
        query,
        subqueries: [query],
        message: `Error: ${errorMessage}`,
        timestamp: Date.now(),
        overwrite: true,
      },
    });

    return {
      results: [],
      error: errorMessage,
    };
  }
}
