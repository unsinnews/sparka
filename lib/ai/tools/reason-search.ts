import { z } from 'zod';
import { generateObject, tool } from 'ai';
import Exa from 'exa-js';
import type { Session } from 'next-auth';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import type { AnnotationDataStreamWriter } from './annotation-stream';
import { webSearchStep, type WebSearchResult } from './steps/web-search';
import { xSearchStep, type XSearchResult } from './steps/x-search';
import {
  academicSearchStep,
  type AcademicSearchResult,
} from './steps/academic-search';

type SearchResult = {
  type: 'web' | 'academic' | 'x' | 'all';
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

      // Send initial plan status update (without steps count and extra details)
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
                source: z.enum(['web', 'academic', 'x', 'all']),
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
                - "all": Use all source types (web, academic, and X/Twitter)
                
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

      // Generate IDs for all steps based on the plan
      const generateStepIds = (plan: typeof researchPlan) => {
        // Generate an array of search steps.
        const searchSteps = plan.search_queries.flatMap((query, index) => {
          if (query.source === 'all') {
            return [
              { id: `search-web-${index}`, type: 'web', query },
              { id: `search-academic-${index}`, type: 'academic', query },
              { id: `search-x-${index}`, type: 'x', query },
            ];
          }
          if (query.source === 'x') {
            return [{ id: `search-x-${index}`, type: 'x', query }];
          }
          const searchType = query.source === 'academic' ? 'academic' : 'web';
          return [
            { id: `search-${searchType}-${index}`, type: searchType, query },
          ];
        });

        // Generate an array of analysis steps.
        const analysisSteps = plan.required_analyses.map((analysis, index) => ({
          id: `analysis-${index}`,
          type: 'analysis',
          analysis,
        }));

        return {
          planId: 'research-plan',
          searchSteps,
          analysisSteps,
        };
      };

      const stepIds = generateStepIds(researchPlan);
      let completedSteps = 0;
      const totalSteps =
        stepIds.searchSteps.length + stepIds.analysisSteps.length;

      // Execute searches
      const searchResults: SearchResult[] = [];

      const searchQueryConfigs = stepIds.searchSteps.map((step) => step.query);

      for (const searchQueryConfig of searchQueryConfigs) {
        const results = await searchStep({
          searchQueryConfig,
          completedSteps,
          dataStream,
          depth, // TODO: Depth should be a provider config
        });
        searchResults.push(...results);
        completedSteps++;
      }

      // Perform analyses
      let analysisIndex = 0; // Add index tracker

      for (const step of stepIds.analysisSteps) {
        dataStream.writeMessageAnnotation({
          type: 'research_update',
          data: {
            id: step.id,
            type: 'analysis',
            status: 'running',
            title: `Analyzing ${step.analysis.type}`,
            analysisType: step.analysis.type,
            message: `Analyzing ${step.analysis.type}...`,
            timestamp: Date.now(),
          },
        });

        const { object: analysisResult } = await generateObject({
          model: openai('gpt-4o'),
          temperature: 0.5,
          schema: z.object({
            findings: z.array(
              z.object({
                insight: z.string(),
                evidence: z.array(z.string()),
                confidence: z.number().min(0).max(1),
              }),
            ),
            implications: z.array(z.string()),
            limitations: z.array(z.string()),
          }),
          experimental_telemetry: { isEnabled: true },
          prompt: `Perform a ${step.analysis.type} analysis on the search results. ${step.analysis.description}
                    Consider all sources and their reliability.
                    Search results: ${JSON.stringify(searchResults)}`,
        });

        dataStream.writeMessageAnnotation({
          type: 'research_update',
          data: {
            id: step.id,
            type: 'analysis',
            status: 'completed',
            title: `Analysis of ${step.analysis.type} complete`,
            analysisType: step.analysis.type,
            findings: analysisResult.findings,
            message: `Analysis complete`,
            timestamp: Date.now(),
            overwrite: true,
          },
        });

        analysisIndex++; // Increment index
      }

      // After all analyses are complete, send running state for gap analysis
      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: 'gap-analysis',
          type: 'analysis',
          status: 'running',
          title: 'Research Gaps and Limitations',
          analysisType: 'gaps',
          message: 'Analyzing research gaps and limitations...',
          timestamp: Date.now(),
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
              description: z.string(),
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
                  source: z.enum(['web', 'academic', 'x', 'all']),
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
                Analysis findings: ${JSON.stringify(
                  stepIds.analysisSteps.map((step) => ({
                    type: step.analysis.type,
                    description: step.analysis.description,
                    importance: step.analysis.importance,
                  })),
                )}`,
      });

      // Send gap analysis update
      // TODO: This annotation should be converted to a standardized format (title, description) or array of such objects
      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: 'gap-analysis',
          type: 'analysis',
          status: 'completed',
          title: 'Research Gaps and Limitations',
          analysisType: 'gaps',
          findings: gapAnalysis.limitations.map((l) => ({
            insight: l.description,
            evidence: l.potential_solutions,
            confidence: (6 - l.severity) / 5,
          })),
          gaps: gapAnalysis.knowledge_gaps.map((g) => ({
            topic: g.topic,
            reason: g.reason,
            additional_queries: g.additional_queries.map((q) => q.query),
          })),
          recommendations: gapAnalysis.recommended_followup,
          message: `Identified ${gapAnalysis.limitations.length} limitations and ${gapAnalysis.knowledge_gaps.length} knowledge gaps`,
          timestamp: Date.now(),
          overwrite: true,
          completedSteps: completedSteps + 1,
          totalSteps: totalSteps + (depth === 'advanced' ? 2 : 1),
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

        // Execute additional searches for gaps
        for (const queryConfig of additionalQueries) {
          // Generate a unique ID for this gap search
          const results = await searchStep({
            searchQueryConfig: queryConfig,
            completedSteps,
            dataStream,
            depth, // TODO: Depth should be a provider config
          });
          searchResults.push(...results);
          completedSteps++;
        }
        // Send running state for final synthesis
        dataStream.writeMessageAnnotation({
          type: 'research_update',
          data: {
            id: 'final-synthesis',
            type: 'analysis',
            status: 'running',
            title: 'Final Research Synthesis',
            analysisType: 'synthesis',
            message: 'Synthesizing all research findings...',
            timestamp: Date.now(),
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
          type: 'analysis',
          status: 'completed',
          title: 'Final Research Synthesis',
          analysisType: 'synthesis',
          findings: finalSynthesis.key_findings.map((f) => ({
            insight: f.finding,
            evidence: f.supporting_evidence,
            confidence: f.confidence,
          })),
          uncertainties: finalSynthesis.remaining_uncertainties,
          message: `Synthesized ${finalSynthesis.key_findings.length} key findings`,
          timestamp: Date.now(),
          overwrite: true,
          completedSteps: totalSteps + (depth === 'advanced' ? 2 : 1) - 1,
          totalSteps: totalSteps + (depth === 'advanced' ? 2 : 1),
        },
      });

      // Final progress update
      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: 'research-progress',
          type: 'progress' as const,
          status: 'completed' as const,
          message: `Research complete`,
          completedSteps: totalSteps + (depth === 'advanced' ? 2 : 1),
          totalSteps: totalSteps + (depth === 'advanced' ? 2 : 1),
          isComplete: true,
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
