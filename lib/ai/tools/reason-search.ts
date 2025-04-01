import { z } from 'zod';
import { generateObject, tool } from 'ai';
import Exa from 'exa-js';
import type { Session } from 'next-auth';
import { xai } from '@ai-sdk/xai';
import type { AnnotationDataStreamWriter } from './annotation-stream';
import { webSearch } from './sub-tools/web-search';

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
          type: 'plan',
          status: 'running',
          title: 'Research Plan',
          message: 'Creating research plan...',
          timestamp: Date.now(),
          overwrite: true,
        },
      });

      // Now generate the research plan
      const { object: researchPlan } = await generateObject({
        model: xai('grok-beta'),
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
        }),
        experimental_telemetry: { isEnabled: true },
        prompt: `Create a focused research plan for the topic: "${topic}". 
                
                Today's date and day of the week: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        
                Keep the plan concise but comprehensive, with:
                - 4-12 targeted search queries (each can use web, academic, x (Twitter), or all sources)
                - 2-8 key analyses to perform
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

      // Complete plan status
      dataStream.writeMessageAnnotation({
        type: 'research_update',
        data: {
          id: stepIds.planId,
          type: 'plan' as const,
          status: 'completed',
          title: 'Research Plan',
          plan: researchPlan,
          totalSteps: totalSteps,
          message: 'Research plan created',
          timestamp: Date.now(),
          overwrite: true,
        },
      });

      // Execute searches
      const searchResults = [];
      let searchIndex = 0;

      for (const step of stepIds.searchSteps) {
        if (step.type === 'web') {
          const searchResult = await webSearch({
            query: step.query.query,
            providerOptions: {
              provider: 'tavily',
              maxResults: Math.min(6 - step.query.priority, 10),
              searchDepth: depth,
            },
            dataStream,
            stepId: step.id,
          });

          if (!searchResult.error) {
            searchResults.push({
              type: 'web',
              query: step.query,
              results: searchResult.results,
            });
            completedSteps++;
          }
        } else if (step.type === 'academic') {
          // Send running annotation for academic search
          dataStream.writeMessageAnnotation({
            type: 'research_update',
            data: {
              id: step.id,
              type: 'academic',
              status: 'running',
              title: `Searching academic papers for "${step.query.query}"`,
              query: step.query.query,
              message: `Searching academic sources...`,
              timestamp: Date.now(),
            },
          });

          const academicResults = await exa.searchAndContents(
            step.query.query,
            {
              type: 'auto',
              numResults: Math.min(6 - step.query.priority, 5),
              category: 'research paper',
              summary: true,
            },
          );

          searchResults.push({
            type: 'academic',
            query: step.query,
            results: academicResults.results.map((r) => ({
              source: 'academic',
              title: r.title || '',
              url: r.url || '',
              content: r.summary || '',
            })),
          });
          completedSteps++;

          // Send completed annotation for academic search
          dataStream.writeMessageAnnotation({
            type: 'research_update',
            data: {
              id: step.id,
              type: 'academic',
              status: 'completed',
              title: `Searched academic papers for "${step.query.query}"`,
              query: step.query.query,
              results: academicResults.results.map((r) => ({
                source: 'academic',
                title: r.title || '',
                url: r.url || '',
                content: r.summary || '',
              })),
              message: `Found ${academicResults.results.length} results`,
              timestamp: Date.now(),
              overwrite: true,
            },
          });
        } else if (step.type === 'x') {
          // Send running annotation for X search
          dataStream.writeMessageAnnotation({
            type: 'research_update',
            data: {
              id: step.id,
              type: 'x',
              status: 'running',
              title: `Searching X/Twitter for "${step.query.query}"`,
              query: step.query.query,
              message: `Searching X/Twitter sources...`,
              timestamp: Date.now(),
            },
          });

          // Extract tweet ID from URL
          const extractTweetId = (url: string): string | null => {
            const match = url.match(
              /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
            );
            return match ? match[1] : null;
          };

          const xResults = await exa.searchAndContents(step.query.query, {
            type: 'neural',
            useAutoprompt: true,
            numResults: step.query.priority,
            text: true,
            highlights: true,
            includeDomains: ['twitter.com', 'x.com'],
          });

          // Process tweets to include tweet IDs
          const processedTweets = xResults.results
            .map((result) => {
              const tweetId = extractTweetId(result.url);
              return {
                source: 'x' as const,
                title: result.title || result.author || 'Tweet',
                url: result.url,
                content: result.text || '',
                tweetId: tweetId || undefined,
              };
            })
            .filter((tweet) => tweet.tweetId); // Only include tweets with valid IDs

          searchResults.push({
            type: 'x',
            query: step.query,
            results: processedTweets,
          });
          completedSteps++;

          // Send completed annotation for X search
          dataStream.writeMessageAnnotation({
            type: 'research_update',
            data: {
              id: step.id,
              type: 'x',
              status: 'completed',
              title: `Searched X/Twitter for "${step.query.query}"`,
              query: step.query.query,
              results: processedTweets,
              message: `Found ${processedTweets.length} results`,
              timestamp: Date.now(),
              overwrite: true,
            },
          });
        }

        searchIndex++;
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
          model: xai('grok-beta'),
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
        model: xai('grok-beta'),
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
              additional_queries: z.array(z.string()),
            }),
          ),
          recommended_followup: z.array(
            z.object({
              action: z.string(),
              rationale: z.string(),
              priority: z.number().min(2).max(10),
            }),
          ),
        }),
        experimental_telemetry: { isEnabled: true },
        prompt: `Analyze the research results and identify limitations, knowledge gaps, and recommended follow-up actions.
                Consider:
                - Quality and reliability of sources
                - Missing perspectives or data
                - Areas needing deeper investigation
                - Potential biases or conflicts
                - Severity should be between 2 and 10
                - Knowledge gaps should be between 2 and 10
                - Do not keep the numbers too low or high, make them reasonable in between
                
                When suggesting additional_queries for knowledge gaps, keep in mind these will be used to search:
                - Web sources
                - Academic papers
                - X/Twitter for social media perspectives and real-time information
                
                Design your additional_queries to work well across these different source types.
                
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
          gaps: gapAnalysis.knowledge_gaps,
          recommendations: gapAnalysis.recommended_followup,
          message: `Identified ${gapAnalysis.limitations.length} limitations and ${gapAnalysis.knowledge_gaps.length} knowledge gaps`,
          timestamp: Date.now(),
          overwrite: true,
          completedSteps: completedSteps + 1,
          totalSteps: totalSteps + (depth === 'advanced' ? 2 : 1),
        },
      });

      let synthesis: {
        key_findings: {
          finding: string;
          confidence: number;
          supporting_evidence: string[];
        }[];
        remaining_uncertainties: string[];
      } | null = null;

      // If there are significant gaps and depth is 'advanced', perform additional research
      if (depth === 'advanced' && gapAnalysis.knowledge_gaps.length > 0) {
        // For important gaps, create 'all' source queries to be comprehensive
        const additionalQueries = gapAnalysis.knowledge_gaps.flatMap((gap) =>
          gap.additional_queries.map((query, idx) => {
            // For critical gaps, use 'all' sources for the first query
            // Distribute others across different source types for efficiency
            const sourceTypes = ['web', 'academic', 'x', 'all'] as const;
            let source: 'web' | 'academic' | 'x' | 'all';

            // Use 'all' for the first query of each gap, then rotate through specific sources
            if (idx === 0) {
              source = 'all';
            } else {
              source = sourceTypes[idx % (sourceTypes.length - 1)] as
                | 'web'
                | 'academic'
                | 'x';
            }

            return {
              query,
              rationale: gap.reason,
              source,
              priority: 3,
            };
          }),
        );

        // Execute additional searches for gaps
        for (const query of additionalQueries) {
          // Generate a unique ID for this gap search
          const gapSearchId = `gap-search-${searchIndex++}`;

          // Execute search based on source type
          if (query.source === 'web' || query.source === 'all') {
            // Execute web search
            const webResults = await webSearch({
              query: query.query,
              providerOptions: {
                provider: 'tavily',
                maxResults: 5,
                searchDepth: depth,
              },
              dataStream,
              stepId: gapSearchId,
            });

            // Add to search results
            searchResults.push({
              type: 'web',
              query: {
                query: query.query,
                rationale: query.rationale,
                source: 'web',
                priority: query.priority,
              },
              results: webResults.results,
            });

            // Send completed annotation for web search
            dataStream.writeMessageAnnotation({
              type: 'research_update',
              data: {
                id:
                  query.source === 'all'
                    ? `gap-search-web-${searchIndex - 3}`
                    : gapSearchId,
                type: 'web',
                status: 'completed',
                title: `Additional web search for "${query.query}"`,
                query: query.query,
                results: webResults.results.map((r) => ({
                  source: 'web',
                  title: r.title,
                  url: r.url,
                  content: r.content,
                })),
                message: `Found ${webResults.results.length} results`,
                timestamp: Date.now(),
                overwrite: true,
              },
            });
          }

          if (query.source === 'academic' || query.source === 'all') {
            const academicSearchId =
              query.source === 'all'
                ? `gap-search-academic-${searchIndex++}`
                : gapSearchId;

            // Send running annotation for academic search if it's for 'all' source
            if (query.source === 'all') {
              dataStream.writeMessageAnnotation({
                type: 'research_update',
                data: {
                  id: academicSearchId,
                  type: 'academic',
                  status: 'running',
                  title: `Additional academic search for "${query.query}"`,
                  query: query.query,
                  message: `Searching academic sources to fill knowledge gap: ${query.rationale}`,
                  timestamp: Date.now(),
                },
              });
            }

            // Execute academic search
            const academicResults = await exa.searchAndContents(query.query, {
              type: 'auto',
              numResults: 3,
              category: 'research paper',
              summary: true,
            });

            // Add to search results
            searchResults.push({
              type: 'academic',
              query: {
                query: query.query,
                rationale: query.rationale,
                source: 'academic',
                priority: query.priority,
              },
              results: academicResults.results.map((r) => ({
                source: 'academic',
                title: r.title || '',
                url: r.url || '',
                content: r.summary || '',
              })),
            });

            // Send completed annotation for academic search
            dataStream.writeMessageAnnotation({
              type: 'research_update',
              data: {
                id: academicSearchId,
                type: 'academic',
                status: 'completed',
                title: `Additional academic search for "${query.query}"`,
                query: query.query,
                results: academicResults.results.map((r) => ({
                  source: 'academic',
                  title: r.title || '',
                  url: r.url || '',
                  content: r.summary || '',
                })),
                message: `Found ${academicResults.results.length} results`,
                timestamp: Date.now(),
                overwrite: query.source === 'all',
              },
            });
          }

          if (query.source === 'x' || query.source === 'all') {
            const xSearchId =
              query.source === 'all'
                ? `gap-search-x-${searchIndex++}`
                : gapSearchId;

            // Send running annotation for X search if it's for 'all' source
            if (query.source === 'all') {
              dataStream.writeMessageAnnotation({
                type: 'research_update',
                data: {
                  id: xSearchId,
                  type: 'x',
                  status: 'running',
                  title: `Additional X/Twitter search for "${query.query}"`,
                  query: query.query,
                  message: `Searching X/Twitter to fill knowledge gap: ${query.rationale}`,
                  timestamp: Date.now(),
                },
              });
            }

            // Extract tweet ID from URL
            const extractTweetId = (url: string): string | null => {
              const match = url.match(
                /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
              );
              return match ? match[1] : null;
            };

            // Execute X/Twitter search
            const xResults = await exa.searchAndContents(query.query, {
              type: 'keyword',
              numResults: 5,
              text: true,
              highlights: true,
              includeDomains: ['twitter.com', 'x.com'],
            });

            // Process tweets to include tweet IDs - properly handling undefined
            const processedTweets = xResults.results
              .map((result) => {
                const tweetId = extractTweetId(result.url);
                if (!tweetId) return null; // Skip entries without valid tweet IDs

                return {
                  source: 'x' as const,
                  title: result.title || result.author || 'Tweet',
                  url: result.url,
                  content: result.text || '',
                  tweetId, // Now it's definitely string, not undefined
                };
              })
              .filter(
                (
                  tweet,
                ): tweet is {
                  source: 'x';
                  title: string;
                  url: string;
                  content: string;
                  tweetId: string;
                } => tweet !== null,
              );

            // Add to search results
            searchResults.push({
              type: 'x',
              query: {
                query: query.query,
                rationale: query.rationale,
                source: 'x',
                priority: query.priority,
              },
              results: processedTweets,
            });

            // Send completed annotation for X search
            dataStream.writeMessageAnnotation({
              type: 'research_update',
              data: {
                id: xSearchId,
                type: 'x',
                status: 'completed',
                title: `Additional X/Twitter search for "${query.query}"`,
                query: query.query,
                results: processedTweets,
                message: `Found ${processedTweets.length} results`,
                timestamp: Date.now(),
                overwrite: query.source === 'all',
              },
            });
          }
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

        // Perform final synthesis of all findings
        const { object: finalSynthesis } = await generateObject({
          model: xai('grok-beta'),
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
          experimental_telemetry: { isEnabled: true },
          prompt: `Synthesize all research findings, including gap analysis and follow-up research.
                    Highlight key conclusions and remaining uncertainties.
                    Stick to the types of the schema, do not add any other fields or types.
                    
                    Original results: ${JSON.stringify(searchResults)}
                    Gap analysis: ${JSON.stringify(gapAnalysis)}
                    Additional findings: ${JSON.stringify(additionalQueries)}`,
        });

        synthesis = finalSynthesis;

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
      }

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
        synthesis: synthesis,
      };
    },
  });
