import { z } from 'zod';
import { generateObject, tool } from 'ai';
import Exa from 'exa-js';
import type { Session } from 'next-auth';
import { openai } from '@ai-sdk/openai';
import type { AnnotationDataStreamWriter } from './annotation-stream';
import { webSearchStep, type WebSearchResult } from './steps/web-search';
import { xSearchStep, type XSearchResult } from './steps/x-search';
import {
  academicSearchStep,
  type AcademicSearchResult,
} from './steps/academic-search';

type SearchResult = {
  type: 'web' | 'academic' | 'x';
  query: {
    query: string;
    rationale: string;
  };
  results: (XSearchResult | AcademicSearchResult | WebSearchResult)[];
};

const MAX_QUERIES_BREATH = 5;
const MAX_ANALYSES = 5;
const MAX_KNOWLEDGE_GAPS = 3;
const MAX_KNOWLEDGE_GAPS_QUERIES_BREATH = 2;

export const createReasonSearch = ({
  session,
  dataStream,
}: {
  session: Session;
  dataStream: AnnotationDataStreamWriter;
}) =>
  tool({
    description:
      'Perform a reasoned web search with multiple steps and sources.',
    parameters: z.object({
      topic: z.string().describe('The main topic or question to research'),
      depth: z
        .enum(['basic', 'advanced'])
        .describe('Search depth level')
        .default('basic'),
    }),
    execute: async ({
      topic,
      depth,
    }: { topic: string; depth: 'basic' | 'advanced' }) => {
      const exa = new Exa(process.env.EXA_API_KEY as string);

      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: 'research-plan-initial', // unique id for the initial state
          type: 'progress',
          status: 'started',
          title: 'Starting Research',
          message: 'Starting research...',
          timestamp: Date.now(),
          overwrite: true,
        },
      });

      // Now generate the research plan
      const { object: researchPlan } = await generateObject({
        model: openai('gpt-4o'),
        temperature: 0,
        schema: z.object({
          search_queries: z
            .array(
              z.object({
                query: z.string(),
                rationale: z.string(),
                source: z.enum(['web', 'academic', 'x']),
                priority: z.number().min(1).max(5),
              }),
            )
            .max(12),
          required_analyses: z
            .array(
              z.object({
                type: z.string(),
                description: z.string(),
                importance: z.number().min(1).max(5),
              }),
            )
            .max(8),
          initialThought: z.object({
            header: z
              .string()
              .describe(
                'A title for the step of researching this queries and analyses',
              ),
            body: z
              .string()
              .describe('Describe what you are going to do in this step'),
          }),
        }),
        experimental_telemetry: { isEnabled: true },
        prompt: `Create a focused research plan for the topic: "${topic}". 
                
                Today's date and day of the week: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        
                Keep the plan concise but comprehensive, with:
                - 2-${MAX_QUERIES_BREATH} targeted search queries (each can use web, academic, x (Twitter), or all sources)
                - 2-${MAX_ANALYSES} key analyses to perform
                - Prioritize the most important aspects to investigate
                
                Available sources:
                - "web": General web search
                - "academic": Academic papers and research
                - "x": X/Twitter posts and discussions
                
                Do not use floating numbers, use whole numbers only in the priority field!!
                Do not keep the numbers too low or high, make them reasonable in between.
                Do not use 0 or 1 in the priority field, use numbers between 2 and 4.
                
                Consider different angles and potential controversies, but maintain focus on the core aspects.
                Ensure the total number of steps (searches + analyses) does not exceed 20.`,
      });

      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: `step-0-initial-thoughts`, // unique id for the initial state
          status: 'completed',
          type: 'thoughts',
          title: 'Initial Thoughts',
          message: 'Creating initial thoughts...',
          timestamp: Date.now(),
          overwrite: true,
          thoughtItems: [
            {
              header: researchPlan.initialThought.header,
              body: researchPlan.initialThought.body,
            },
          ],
        },
      });

      const searchSteps = researchPlan.search_queries.flatMap(
        (query, index) => {
          return [
            {
              id: `search-${query.source}-${index}`,
              type: query.source,
              query,
            },
          ];
        },
      );
      let completedSteps = 0;
      const totalSteps = searchSteps.length;

      // Execute searches
      const searchResults: SearchResult[] = [];

      const searchQueryConfigs = searchSteps.map((step) => step.query);

      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: `step-${completedSteps}-additional-queries`,
          type: 'web',
          status: 'running',
          message: 'Searching for additional queries...',
          timestamp: Date.now(),
          query: 'Searching additional queries',
          subqueries: searchQueryConfigs.map(
            (q) => `${q.source !== 'web' ? `${q.source}: ` : ''}${q.query}`,
          ),
          title: 'Additional Queries',
          overwrite: true,
        },
      });

      for (const searchQueryConfig of searchQueryConfigs) {
        const results = await searchStep({
          searchQueryConfig,
          completedSteps,
          dataStream,
          depth, // TODO: Depth should be a provider config
        });
        searchResults.push(...results);
      }
      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: `step-${completedSteps}-additional-queries`,
          type: 'web',
          status: 'completed',
          message: 'Searched additional queries',
          timestamp: Date.now(),
          query: 'Searched additional queries',
          subqueries: searchQueryConfigs.map(
            (q) => `${q.source !== 'web' ? `${q.source}: ` : ''}${q.query}`,
          ),
          results: searchResults.flatMap((r) => r.results),
          title: 'Additional Queries',
          overwrite: true,
        },
      });
      completedSteps++;

      // After all analyses are complete, send running state for gap analysis
      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: 'gap-analysis',
          type: 'thoughts',
          status: 'running',
          title: 'Research Gaps and Limitations',
          message: 'Analyzing research gaps and limitations...',
          timestamp: Date.now(),
          thoughtItems: [
            {
              header: 'Research Gaps and Limitations',
              body: 'Analyzing research gaps and limitations...',
            },
          ],
        },
      });

      // After all analyses are complete, analyze limitations and gaps
      const { object: gapAnalysis } = await generateObject({
        model: openai('gpt-4o'),
        temperature: 0,
        schema: z.object({
          limitations: z.array(
            z.object({
              type: z.string(),
              header: z.string().describe('A title for the limitation'),
              description: z.string().describe('The limitation description'),
              severity: z.number().min(2).max(10),
              potential_solutions: z.array(z.string()),
            }),
          ),
          knowledge_gaps: z.array(
            z.object({
              topic: z.string(),
              reason: z.string(),
              additional_queries: z.array(
                z.object({
                  query: z.string(),
                  rationale: z.string(),
                  source: z.enum(['web', 'academic', 'x']),
                  priority: z.number().min(1).max(5),
                }),
              ),
            }),
          ),
          recommended_followup: z.array(
            z.object({
              action: z.string(),
              rationale: z.string(),
              priority: z.number().min(2).max(4),
            }),
          ),
        }),
        providerOptions: {
          experimental_telemetry: { isEnabled: true },
        },
        experimental_telemetry: { isEnabled: true },
        prompt: `Analyze the research results and identify limitations, knowledge gaps, and recommended follow-up actions.
                Consider:
                - Quality and reliability of sources
                - Missing perspectives or data
                - Areas needing deeper investigation
                - Potential biases or conflicts
                - Severity should be between 2 and 10
                - Knowledge gaps should be between 0 and ${MAX_KNOWLEDGE_GAPS}. It's ok to have 0 knowledge gaps if the research is complete.
                - Each knowledge gap should have between 1 and ${MAX_KNOWLEDGE_GAPS_QUERIES_BREATH} additional queries

                When suggesting additional_queries for knowledge gaps, keep in mind these will be used to search:
                - Web sources
                - Academic papers
                - X/Twitter for social media perspectives and real-time information
                              
                Research results: ${JSON.stringify(searchResults)}
            `,
      });

      // Send gap analysis update
      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: 'gap-analysis',
          type: 'thoughts',
          status: 'completed',
          title: 'Research Gaps and Limitations',
          message: `Identified ${gapAnalysis.limitations.length} limitations and ${gapAnalysis.knowledge_gaps.length} knowledge gaps`,
          thoughtItems: [
            {
              header: 'Research Gaps and Limitations',
              body: `Identified ${gapAnalysis.limitations.length} limitations and ${gapAnalysis.knowledge_gaps.length} knowledge gaps`,
            },
            ...gapAnalysis.limitations.map((l) => ({
              header: `Analyzing Limitations: ${l.header}`,
              body: l.description,
            })),
          ],
          timestamp: Date.now(),
          overwrite: true,
        },
      });

      let additionalQueries: {
        query: string;
        rationale: string;
        source: 'web' | 'academic' | 'x' | 'all';
        priority: number;
      }[] = [];
      // If there are significant gaps and depth is 'advanced', perform additional research
      if (depth === 'advanced' && gapAnalysis.knowledge_gaps.length > 0) {
        // For important gaps, create 'all' source queries to be comprehensive
        additionalQueries = gapAnalysis.knowledge_gaps.flatMap(
          (gap) => gap.additional_queries,
        );

        dataStream.writeMessageAnnotation({
          type: 'research_update',
          data: {
            id: `step-${completedSteps}-additional-queries`,
            type: 'web',
            status: 'running',
            message: 'Searching for additional queries...',
            timestamp: Date.now(),
            query: 'Searching additional queries',
            subqueries: additionalQueries.map(
              (q) => `${q.source !== 'web' ? `${q.source}: ` : ''}${q.query}`,
            ),
            title: 'Additional Queries',
            overwrite: true,
          },
        });

        const additionalSearchResults: SearchResult[] = [];
        // Execute additional searches for gaps
        for (const queryConfig of additionalQueries) {
          // Generate a unique ID for this gap search
          const results = await searchStep({
            searchQueryConfig: queryConfig,
            completedSteps,
            dataStream,
            depth, // TODO: Depth should be a provider config
          });
          additionalSearchResults.push(...results);
        }
        dataStream.writeMessageAnnotation({
          type: 'research_update',
          data: {
            id: `step-${completedSteps}-additional-queries`,
            type: 'web',
            status: 'completed',
            message: 'Searched additional queries',
            timestamp: Date.now(),
            query: 'Searched additional queries',
            subqueries: additionalQueries.map(
              (q) => `${q.source !== 'web' ? `${q.source}: ` : ''}${q.query}`,
            ),
            results: additionalSearchResults.flatMap((r) => r.results),
            title: 'Additional Queries',
            overwrite: true,
          },
        });
        completedSteps++;
        searchResults.push(...additionalSearchResults);

        // Send running state for final synthesis
        dataStream.writeMessageAnnotation({
          type: 'research_update',
          data: {
            id: 'final-synthesis',
            type: 'thoughts',
            status: 'running',
            title: 'Final Research Synthesis',
            message: 'Synthesizing all research findings...',
            timestamp: Date.now(),
            thoughtItems: [
              {
                header: 'Final Research Synthesis',
                body: 'Synthesizing all research findings...',
              },
            ],
          },
        });
      }

      // Perform final synthesis of all findings
      const { object: finalSynthesis } = await generateObject({
        model: openai('gpt-4o'),
        temperature: 0,
        schema: z.object({
          key_findings: z.array(
            z.object({
              finding: z.string(),
              confidence: z.number().min(0).max(1),
              supporting_evidence: z.array(z.string()),
            }),
          ),
          remaining_uncertainties: z.array(z.string()),
          insights: z.array(
            z.object({
              header: z.string().describe('A title for the insight'),
              body: z.string().describe('The insight description  '),
            }),
          ),
        }),
        providerOptions: {
          experimental_telemetry: { isEnabled: true },
        },
        experimental_telemetry: { isEnabled: true },
        // TODO: This prompt will have to change if we take an arbitrary number of steps
        prompt: `Synthesize all research findings, including gap analysis and follow-up research.
                    Highlight key conclusions and remaining uncertainties.
                    Stick to the types of the schema, do not add any other fields or types.
                    
                    Original queries: 
                    ${JSON.stringify(searchQueryConfigs)}
                    Gap analysis: 
                    ${JSON.stringify(gapAnalysis)}
                    Additional queries:
                    ${JSON.stringify(additionalQueries)}
                    Results: 
                    ${JSON.stringify(searchResults)}`,
      });

      // Send final synthesis update
      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: 'final-synthesis',
          type: 'thoughts',
          status: 'completed',
          title: 'Final Research Synthesis',
          message: `Synthesized ${finalSynthesis.insights.length} insights`,
          thoughtItems: finalSynthesis.insights.map((insight) => ({
            header: insight.header,
            body: insight.body,
          })),
          timestamp: Date.now(),
          overwrite: true,
        },
      });

      // Final progress update
      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: 'research-progress',
          type: 'progress',
          status: 'completed',
          message: `Research complete`,
          completedSteps: totalSteps + (depth === 'advanced' ? 2 : 1),
          totalSteps: totalSteps + (depth === 'advanced' ? 2 : 1),
          overwrite: true,
          timestamp: Date.now(),
        },
      });

      return {
        plan: researchPlan,
        results: searchResults,
        synthesis: finalSynthesis,
      };
    },
  });

async function searchStep({
  searchQueryConfig,
  completedSteps,
  dataStream,
  depth,
}: {
  searchQueryConfig: {
    query: string;
    rationale: string;
    source: 'web' | 'academic' | 'x' | 'all';
    priority: number;
  };
  completedSteps: number;
  dataStream: AnnotationDataStreamWriter;
  depth: 'basic' | 'advanced';
}) {
  const source = searchQueryConfig.source;
  const searchResults: SearchResult[] = [];
  if (source === 'web' || source === 'all') {
    const searchResult = await webSearchStep({
      query: searchQueryConfig.query,
      providerOptions: {
        provider: 'tavily',
        maxResults: Math.min(6 - searchQueryConfig.priority, 10),
        searchDepth: depth,
      },
      dataStream,
      stepId: `step-${completedSteps}-web-search`,
      annotate: false,
    });
    if (searchResult && !searchResult.error) {
      searchResults.push({
        type: 'web',
        query: searchQueryConfig,
        results: searchResult.results,
      });
    }
  }

  if (source === 'academic' || source === 'all') {
    const searchResult = await academicSearchStep({
      query: searchQueryConfig.query,
      maxResults: Math.min(6 - searchQueryConfig.priority, 5),
      dataStream,
      stepId: `step-${completedSteps}-academic-search`,
      annotate: false,
    });
    if (searchResult && !searchResult.error) {
      searchResults.push({
        type: 'academic',
        query: searchQueryConfig,
        results: searchResult.results,
      });
    }
  }

  if (source === 'x' || source === 'all') {
    const searchResult = await xSearchStep({
      query: searchQueryConfig.query,
      type: 'keyword',
      maxResults: searchQueryConfig.priority, // Consider adjusting priority logic if needed
      dataStream,
      stepId: `step-${completedSteps}-x-search`,
      annotate: false,
    });
    if (searchResult && !searchResult.error) {
      searchResults.push({
        type: 'x',
        query: searchQueryConfig,
        results: searchResult.results,
      });
    }
  }

  return searchResults;
}
