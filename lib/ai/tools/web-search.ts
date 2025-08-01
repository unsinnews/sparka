import { z } from 'zod';
import { tool } from 'ai';
import { multiQueryWebSearchStep } from './steps/multi-query-web-search';
import type { StreamWriter } from '../types';

export const QueryCompletionSchema = z.object({
  type: z.literal('query_completion'),
  data: z.object({
    query: z.string(),
    index: z.number(),
    total: z.number(),
    status: z.literal('completed'),
    resultsCount: z.number(),
    imagesCount: z.number(),
  }),
});

export const webSearch = ({
  dataStream,
  writeTopLevelUpdates,
}: {
  dataStream: StreamWriter;
  writeTopLevelUpdates: boolean;
}) =>
  tool({
    description: `Multi-query web search (supports depth, topic & result limits). Always cite sources inline.

Use for:
- General information gathering via web search

Avoid:
- Pulling content from a single known URL (use retrieve instead)`,
    inputSchema: z.object({
      search_queries: z
        .array(
          z.object({
            query: z.string(),
            rationale: z.string().describe('The rationale for the query.'),
            // source: z.enum(['web', 'academic', 'x', 'all']),
            priority: z
              .number()
              .min(1)
              .max(5)
              .describe('The priority of the query. Use from 2 to 4.'),
          }),
        )
        .max(12),
      topics: z
        .array(z.enum(['general', 'news']))
        .describe('Array of topic types to search for.')
        .nullable(),
      searchDepth: z
        .enum(['basic', 'advanced'])
        .describe('Search depth to use. Defaults to "basic".')
        .nullable(),
      exclude_domains: z
        .array(z.string())
        .describe('A list of domains to exclude from all search results.')
        .nullable(),
    }),
    execute: async ({
      search_queries,
      topics,
      searchDepth,
      exclude_domains,
    }: {
      search_queries: { query: string; rationale: string; priority: number }[];
      topics: ('general' | 'news')[] | null;
      searchDepth: 'basic' | 'advanced' | null;
      exclude_domains: string[] | null;
    }) => {
      // Handle nullable arrays with defaults
      const safeTopics = topics ?? ['general'];
      const safeSearchDepth = searchDepth ?? 'basic';
      const safeExcludeDomains = exclude_domains ?? [];

      if (writeTopLevelUpdates) {
        dataStream.write({
          type: 'data-researchUpdate',
          data: {
            title: 'Searching',
            timestamp: Date.now(),
            type: 'progress',
            status: 'started',
          },
        });
      }

      let completedSteps = 0;
      const totalSteps = 1; // TODO: Web search is very simple for now
      // Execute searches in parallel using the multi-query step
      const { searches: searchResults } = await multiQueryWebSearchStep({
        queries: search_queries,
        options: {
          baseProviderOptions: {
            provider: 'tavily',
            searchDepth: safeSearchDepth,
            includeAnswer: true,
            includeImages: false,
            includeImageDescriptions: false,
          },
          topics: safeTopics,
          excludeDomains: safeExcludeDomains,
          maxResultsPerQuery: 10,
        },
        dataStream,
      });

      completedSteps++;
      // Final progress update
      if (writeTopLevelUpdates) {
        dataStream.write({
          type: 'data-researchUpdate',
          data: {
            title: 'Search complete',
            timestamp: Date.now(),
            type: 'progress',
            status: 'completed',
            completedSteps,
            totalSteps,
          },
        });
      }
      return {
        searches: searchResults,
      };
    },
  });
