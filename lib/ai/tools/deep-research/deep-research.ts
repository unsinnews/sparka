import { generateObject } from 'ai';
import { compact } from 'lodash-es';
import pLimit from 'p-limit';
import { z } from 'zod';

import { getModel } from './providers';
import { trimPrompt } from '../../trim-prompt';
import { createDocument } from '../create-document';
import type { Session } from 'next-auth';
import type { AnnotationDataStreamWriter } from '../annotation-stream';
import { webSearchStep } from '../steps/web-search';

export const systemPrompt = () => {
  const now = new Date().toISOString();
  return `You are an expert researcher. Today is ${now}. Follow these instructions when responding:
  - You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news.
  - The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
  - Be highly organized.
  - Suggest solutions that I didn't think about.
  - Be proactive and anticipate my needs.
  - Treat me as an expert in all subject matter.
  - Mistakes erode my trust, so be accurate and thorough.
  - Provide detailed explanations, I'm comfortable with lots of detail.
  - Value good arguments over authorities, the source is irrelevant.
  - Consider new technologies and contrarian ideas, not just the conventional wisdom.
  - You may use high levels of speculation or prediction, just flag it for me.`;
};

export type ResearchProgress = {
  currentDepth: number;
  totalDepth: number;
  currentBreadth: number;
  totalBreadth: number;
  currentQuery?: string;
  totalQueries: number;
  completedQueries: number;
};

type ResearchResult = {
  learnings: string[];
  visitedUrls: string[];
};

// increase this if you have higher API rate limits
const ConcurrencyLimit = 1; // TODO: Create limits per service

// take en user query, return a list of SERP queries
async function generateNextStepQueries({
  query,
  numQueries = 2,
  learnings,
}: {
  query: string;
  numQueries?: number;

  // optional, if provided, the research will continue from the last learning
  learnings?: string[];
}) {
  const res = await generateObject({
    model: getModel(),
    system: systemPrompt(),
    prompt: `Given the following prompt from the user, generate a list of SERP queries to research the topic. Return a maximum of ${numQueries} queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other: <prompt>${query}</prompt>\n\n${
      learnings
        ? `Here are some learnings from previous research, use them to generate more specific queries: ${learnings.join(
            '\n',
          )}`
        : 'There are no learnings from previous research yet.'
    }`,
    schema: z.object({
      queries: z
        .array(
          z.object({
            query: z.string().describe('The SERP query'),
            researchGoal: z
              .string()
              .describe(
                'First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions.',
              ),
          }),
        )
        .describe(`List of SERP queries, max of ${numQueries}`),
      reflectionThoguhts: z
        .object({
          header: z.string().describe('A title for the step. Max 6 words'),
          body: z
            .string()
            .describe(
              'Describe what you are going to do in this step. Max 50 words',
            ),
        })
        .describe(
          'Based on the information you have, reflect on what will happen in this step',
        ),
      nextStepThoughts: z
        .object({
          header: z
            .string()
            .describe(
              'A title for the next step of research. Max 6 words. Example: "Next: Bla bla bla", "Later, Bla bla bla", etc.',
            ),
          body: z
            .string()
            .describe(
              'Describe what you are going to do in the next step. Max 50 words',
            ),
        })
        .describe(
          'Based on the information you have describe what will happen in the next step',
        ),
    }),
    experimental_telemetry: {
      isEnabled: true,
    },
  });
  console.log(
    `Created ${res.object.queries.length} queries`,
    res.object.queries,
  );

  return {
    queries: res.object.queries.slice(0, numQueries),
    thoughts: [res.object.reflectionThoguhts, res.object.nextStepThoughts],
  };
}

async function processSerpResult({
  query,
  result,
  numLearnings = 3,
  numFollowUpQuestions = 3,
}: {
  query: string;
  result: {
    data: {
      markdown: string;
    }[];
  };
  numLearnings?: number;
  numFollowUpQuestions?: number;
}) {
  const contents = compact(result.data.map((item) => item.markdown)).map(
    (content) => trimPrompt(content, 25_000),
  );
  console.log(`Ran ${query}, found ${contents.length} contents`);

  const res = await generateObject({
    model: getModel(),
    system: systemPrompt(),
    prompt: trimPrompt(
      `Given the following contents from a SERP search for the query <query>${query}</query>, generate a list of learnings from the contents. Return a maximum of ${numLearnings} learnings, but feel free to return less if the contents are clear. Make sure each learning is unique and not similar to each other. The learnings should be concise and to the point, as detailed and information dense as possible. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any exact metrics, numbers, or dates. The learnings will be used to research the topic further.\n\n<contents>${contents
        .map((content) => `<content>\n${content}\n</content>`)
        .join('\n')}</contents>`,
    ),
    schema: z.object({
      learnings: z
        .array(z.string())
        .describe(`List of learnings, max of ${numLearnings}`),
      followUpQuestions: z
        .array(z.string())
        .describe(
          `List of follow-up questions to research the topic further, max of ${numFollowUpQuestions}`,
        ),
    }),
    experimental_telemetry: {
      isEnabled: true,
    },
  });
  console.log(
    `Created ${res.object.learnings.length} learnings`,
    res.object.learnings,
  );

  return res.object;
}

export async function writeFinalReport({
  title,
  description,
  dataStream,
  session,
  prompt,
  learnings,
  visitedUrls,
  messageId,
}: {
  title: string;
  description: string;
  dataStream: AnnotationDataStreamWriter;
  session: Session;
  prompt: string;
  learnings: string[];
  visitedUrls: string[];
  messageId: string;
}) {
  const learningsString = learnings
    .map((learning) => `<learning>\n${learning}\n</learning>`)
    .join('\n');

  const urlsSection = `\n\n## Sources\n\n${visitedUrls.map((url) => `- ${url}`).join('\n')}`;

  return createDocument({
    title,
    description,
    dataStream,
    session,
    kind: 'text',
    prompt: trimPrompt(
      `Given the following prompt from the user, write a final report on the topic using the learnings from research. Make it as as detailed as possible, aim for 3 or more pages, include ALL the learnings from research:\n\n<prompt>${prompt}</prompt>\n\nHere are all the learnings from previous research:\n\n<learnings>\n${learningsString}\n</learnings>. Here are the sources used to generate the report:\n\n${urlsSection}`,
    ),
    messageId,
  });

  // const res = await generateObject({
  //   model: getModel(),
  //   system: systemPrompt(),
  //   prompt: trimPrompt(
  //     `Given the following prompt from the user, write a final report on the topic using the learnings from research. Make it as as detailed as possible, aim for 3 or more pages, include ALL the learnings from research:\n\n<prompt>${prompt}</prompt>\n\nHere are all the learnings from previous research:\n\n<learnings>\n${learningsString}\n</learnings>`,
  //   ),
  //   schema: z.object({
  //     reportMarkdown: z
  //       .string()
  //       .describe('Final report on the topic in Markdown'),
  //   }),
  //   experimental_telemetry: {
  //     isEnabled: true,
  //   },
  // });

  // Append the visited URLs section to the report
}

export async function writeFinalAnswer({
  prompt,
  learnings,
}: {
  prompt: string;
  learnings: string[];
}) {
  const learningsString = learnings
    .map((learning) => `<learning>\n${learning}\n</learning>`)
    .join('\n');

  const res = await generateObject({
    model: getModel(),
    system: systemPrompt(),
    prompt: trimPrompt(
      `Given the following prompt from the user, write a final answer on the topic using the learnings from research. Follow the format specified in the prompt. Do not yap or babble or include any other text than the answer besides the format specified in the prompt. Keep the answer as concise as possible - usually it should be just a few words or maximum a sentence. Try to follow the format specified in the prompt (for example, if the prompt is using Latex, the answer should be in Latex. If the prompt gives multiple answer choices, the answer should be one of the choices).\n\n<prompt>${prompt}</prompt>\n\nHere are all the learnings from research on the topic that you can use to help answer the prompt:\n\n<learnings>\n${learningsString}\n</learnings>`,
    ),
    schema: z.object({
      exactAnswer: z
        .string()
        .describe(
          'The final answer, make it short and concise, just the answer, no other text',
        ),
    }),
    experimental_telemetry: {
      isEnabled: true,
    },
  });

  return res.object.exactAnswer;
}

export async function deepResearchInternal({
  query,
  breadth,
  depth,
  learnings = [],
  visitedUrls = [],
  dataStream,
  completedSteps = 0,
}: {
  query: string;
  breadth: number;
  depth: number;
  learnings?: string[];
  visitedUrls?: string[];
  dataStream: AnnotationDataStreamWriter;
  completedSteps?: number;
}): Promise<ResearchResult> {
  // Send initial plan status
  // dataStream.writeMessageAnnotation({
  //   type: 'research_update',
  //   data: {
  //     id: 'research-plan-initial',
  //     type: 'plan',
  //     status: 'running',
  //     title: 'Research Plan',
  //     message: 'Creating research plan...',
  //     timestamp: Date.now(),
  //     overwrite: true,
  //   },
  // });

  const { queries: serpQueries, thoughts } = await generateNextStepQueries({
    query,
    learnings,
    numQueries: breadth,
  });

  dataStream.writeMessageAnnotation({
    type: 'research_update',
    data: {
      id: `step-${completedSteps}-initial-thoughts`, // unique id for the initial state
      status: 'completed',
      type: 'thoughts',
      title: 'Initial Thoughts',
      message: 'Creating initial thoughts...',
      timestamp: Date.now(),
      overwrite: true,
      thoughtItems: thoughts,
    },
  });
  completedSteps++;

  // Complete plan status with total steps
  // dataStream.writeMessageAnnotation({
  //   type: 'research_update',
  //   data: {
  //     id: 'research-plan',
  //     type: 'plan',
  //     status: 'completed',
  //     title: 'Research Plan',
  //     plan: {
  //       search_queries: serpQueries.map((q, i) => ({
  //         query: q.query,
  //         rationale: q.researchGoal,
  //         source: 'web',
  //         priority: 3,
  //       })),
  //       required_analyses: [],
  //     },
  //     totalSteps: serpQueries.length * (depth + 1),
  //     message: 'Research plan created',
  //     timestamp: Date.now(),
  //     overwrite: true,
  //   },
  // });

  const limit = pLimit(ConcurrencyLimit);

  // Step 1: Perform all initial web searches in parallel

  // TODO: Running Web Search and Web search updates should be in the same annotation step when searches run in parallel.

  dataStream.writeMessageAnnotation({
    type: 'research_update',
    data: {
      id: `step-${completedSteps}-web-search`,
      type: 'web',
      status: 'running',
      title: `Web Search`, // TODO: Include a summary of this step
      query,
      subqueries: serpQueries.map((q) => q.query),
      message: `Searching web sources...`,
      timestamp: Date.now(),
    },
  });

  const searchResultsPromises = serpQueries.map((serpQuery, queryIndex) =>
    limit(async () => {
      try {
        const searchResult = await webSearchStep({
          query: serpQuery.query,
          providerOptions: {
            provider: 'firecrawl',
            maxResults: 5,
          },
          dataStream,
          stepId: `step-${completedSteps}-search-${queryIndex}`,
          annotate: false,
        });
        return { serpQuery, searchResult, queryIndex }; // Return query info along with result
      } catch (e: any) {
        console.log(
          `Error during webSearchStep for query: ${serpQuery.query}: `,
          e,
        );
        return {
          serpQuery,
          searchResult: {
            error: e.message || 'Unknown error during web search',
            results: [],
          },
          queryIndex,
        };
      }
    }),
  );

  const searchResultsWithData = await Promise.all(searchResultsPromises);

  // Step 2: Process results and recurse sequentially
  const aggregatedLearnings: string[] = [...learnings];
  const aggregatedUrls: string[] = [...visitedUrls];
  const recursiveResults: ResearchResult[] = []; // Store results from deeper dives

  const successfulResults = searchResultsWithData.filter(
    ({ searchResult, serpQuery }) => {
      if (searchResult.error) {
        console.log(
          `Skipping processing due to error in query: ${serpQuery.query}: ${searchResult.error}`,
        );
        return false;
      }
      return true;
    },
  );
  dataStream.writeMessageAnnotation({
    type: 'research_update',
    data: {
      id: `step-${completedSteps}-web-search`,
      type: 'web',
      status: 'completed',
      title: `Web Search`,
      query,
      subqueries: serpQueries.map((q) => q.query),
      message: `Web search complete`,
      timestamp: Date.now(),
      results: successfulResults.flatMap(({ serpQuery, searchResult }) =>
        searchResult.results.map((r) => ({
          title: serpQuery.query,
          source: 'web',
          url: r.url,
          content: r.content,
        })),
      ),
    },
  });

  for (const { serpQuery, searchResult } of searchResultsWithData) {
    try {
      if (searchResult.error) {
        console.log(
          `Skipping processing due to error in query: ${serpQuery.query}: ${searchResult.error}`,
        );
        continue; // Skip processing for this query if search failed
      }

      // Collect URLs from this search
      const newUrls = searchResult.results.map((r) => r.url);
      aggregatedUrls.push(...newUrls); // Add URLs from this search

      const newBreadth = Math.ceil(breadth / 2);
      const newDepth = depth - 1;

      completedSteps++; // Increment step count after successful search

      // TODO: Add an annotation after this step
      const processedResult = await processSerpResult({
        query: serpQuery.query,
        result: {
          data: searchResult.results.map((r) => ({
            title: r.title,
            url: r.url,
            markdown: r.content,
          })),
        },
        numFollowUpQuestions: newBreadth,
      });

      aggregatedLearnings.push(...processedResult.learnings); // Add learnings from this result

      if (newDepth > 0) {
        console.log(
          `Researching deeper for "${serpQuery.query}", breadth: ${newBreadth}, depth: ${newDepth}`,
        );
        // TODO: Maybe we should do a single follow up question
        const nextQuery = `
          Previous research goal: ${serpQuery.researchGoal}
          Follow-up research directions: ${processedResult.followUpQuestions.map((q) => `\\n${q}`).join('')}
        `.trim();

        // Await the recursive call directly, making this part sequential
        const deeperResult = await deepResearchInternal({
          query: nextQuery,
          breadth: Math.ceil(newBreadth / 2),
          depth: newDepth,
          // Pass only the *currently aggregated* learnings and URLs for the deeper dive
          // This prevents re-processing learnings from parallel branches in the deeper dive
          learnings: [...aggregatedLearnings],
          visitedUrls: [...aggregatedUrls],
          dataStream,
          completedSteps, // Pass the updated completedSteps
        });
        recursiveResults.push(deeperResult); // Store result from this deeper dive
        // Update completedSteps based on the recursive call's progress (if it returns it - currently it doesn't directly)
        // Note: The current progress reporting might need adjustment for this sequential recursion
      } else {
        // Completed this branch
        console.log(`Reached last level of research for "${serpQuery.query}"`);
        // Learnings and URLs already added to aggregated lists
        // Send final progress update (might need adjustment based on sequential steps)
        dataStream.writeMessageAnnotation({
          type: 'research_update',
          data: {
            id: 'research-progress',
            type: 'progress',
            status: 'completed',
            message: `Research complete`,
            completedSteps: completedSteps,
            totalSteps: serpQueries.length * (depth + 1),
            overwrite: true,
            timestamp: Date.now(),
          },
        });
      }
    } catch (e: any) {
      console.log(`Error processing result for query: ${serpQuery.query}: `, e);
      // Decide how to handle processing errors, e.g., continue to next query
    }
  }

  // Combine results from this level and all deeper dives
  const finalLearnings = [
    ...aggregatedLearnings,
    ...recursiveResults.flatMap((r) => r.learnings),
  ];
  const finalUrls = [
    ...aggregatedUrls,
    ...recursiveResults.flatMap((r) => r.visitedUrls),
  ];

  return {
    learnings: [...new Set(finalLearnings)],
    visitedUrls: [...new Set(finalUrls)],
  };
}
