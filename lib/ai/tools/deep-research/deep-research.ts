import FirecrawlApp, { type SearchResponse } from '@mendable/firecrawl-js';
import { generateObject } from 'ai';
import { compact } from 'lodash-es';
import pLimit from 'p-limit';
import { z } from 'zod';

import { getModel } from './providers';
import { trimPrompt } from '../../trim-prompt';
import { createDocument } from '../create-document';
import type { Session } from 'next-auth';
import type { AnnotationDataStreamWriter } from '../annotation-stream';

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
const ConcurrencyLimit = 2;

// Initialize Firecrawl with optional API key and optional base url

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY ?? '',
  // apiUrl: process.env.FIRECRAWL_BASE_URL,
});

// take en user query, return a list of SERP queries
async function generateSerpQueries({
  query,
  numQueries = 3,
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
        : ''
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
    }),
    experimental_telemetry: {
      isEnabled: true,
    },
  });
  console.log(
    `Created ${res.object.queries.length} queries`,
    res.object.queries,
  );

  return res.object.queries.slice(0, numQueries);
}

async function processSerpResult({
  query,
  result,
  numLearnings = 3,
  numFollowUpQuestions = 3,
}: {
  query: string;
  result: SearchResponse;
  numLearnings?: number;
  numFollowUpQuestions?: number;
}) {
  const contents = compact(result.data.map((item) => item.markdown)).map(
    (content) => trimPrompt(content, 25_000),
  );
  console.log(`Ran ${query}, found ${contents.length} contents`);

  const res = await generateObject({
    model: getModel(),
    abortSignal: AbortSignal.timeout(60_000),
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
}: {
  title: string;
  description: string;
  dataStream: AnnotationDataStreamWriter;
  session: Session;
  prompt: string;
  learnings: string[];
  visitedUrls: string[];
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
    generationOptions: {
      system: systemPrompt(),
      prompt: trimPrompt(
        `Given the following prompt from the user, write a final report on the topic using the learnings from research. Make it as as detailed as possible, aim for 3 or more pages, include ALL the learnings from research:\n\n<prompt>${prompt}</prompt>\n\nHere are all the learnings from previous research:\n\n<learnings>\n${learningsString}\n</learnings>. Here are the sources used to generate the report:\n\n${urlsSection}`,
      ),
    },
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
}: {
  query: string;
  breadth: number;
  depth: number;
  learnings?: string[];
  visitedUrls?: string[];
  dataStream: AnnotationDataStreamWriter;
}): Promise<ResearchResult> {
  // Send initial plan status
  dataStream.writeMessageAnnotation({
    type: 'research_update',
    data: {
      id: 'research-plan-initial',
      type: 'plan',
      status: 'running',
      title: 'Research Plan',
      message: 'Creating research plan...',
      timestamp: Date.now(),
      overwrite: true,
    },
  });

  const serpQueries = await generateSerpQueries({
    query,
    learnings,
    numQueries: breadth,
  });

  // Complete plan status with total steps
  dataStream.writeMessageAnnotation({
    type: 'research_update',
    data: {
      id: 'research-plan',
      type: 'plan',
      status: 'completed',
      title: 'Research Plan',
      plan: {
        search_queries: serpQueries.map((q, i) => ({
          query: q.query,
          rationale: q.researchGoal,
          source: 'web',
          priority: 3,
        })),
        required_analyses: [],
      },
      totalSteps: serpQueries.length * (depth + 1),
      message: 'Research plan created',
      timestamp: Date.now(),
      overwrite: true,
    },
  });

  const limit = pLimit(ConcurrencyLimit);
  let completedSteps = 0;

  const results = await Promise.all(
    serpQueries.map((serpQuery, queryIndex) =>
      limit(async () => {
        try {
          // Send running status for search
          dataStream.writeMessageAnnotation({
            type: 'research_update',
            data: {
              id: `search-${queryIndex}`,
              type: 'web',
              status: 'running',
              title: `Searching for "${serpQuery.query}"`,
              query: serpQuery.query,
              message: `Searching web sources...`,
              timestamp: Date.now(),
            },
          });

          const result = await firecrawl.search(serpQuery.query, {
            timeout: 15000,
            limit: 5,
            scrapeOptions: { formats: ['markdown'] },
          });

          // Collect URLs from this search
          const newUrls = compact(result.data.map((item) => item.url));
          const newBreadth = Math.ceil(breadth / 2);
          const newDepth = depth - 1;

          // Send completed status for search
          dataStream.writeMessageAnnotation({
            type: 'research_update',
            data: {
              id: `search-${queryIndex}`,
              type: 'web',
              status: 'completed',
              title: `Search complete for "${serpQuery.query}"`,
              query: serpQuery.query,
              results: result.data.map((item) => ({
                source: 'web',
                title: item.title || '',
                url: item.url || '',
                content: item.markdown || '',
              })),
              message: `Found ${result.data.length} results`,
              timestamp: Date.now(),
              overwrite: true,
            },
          });

          completedSteps++;

          const newLearnings = await processSerpResult({
            query: serpQuery.query,
            result,
            numFollowUpQuestions: newBreadth,
          });
          const allLearnings = [...learnings, ...newLearnings.learnings];
          const allUrls = [...visitedUrls, ...newUrls];

          if (newDepth > 0) {
            console.log(
              `Researching deeper, breadth: ${newBreadth}, depth: ${newDepth}`,
            );
            const nextQuery = `
            Previous research goal: ${serpQuery.researchGoal}
            Follow-up research directions: ${newLearnings.followUpQuestions.map((q) => `\n${q}`).join('')}
          `.trim();

            return deepResearchInternal({
              query: nextQuery,
              breadth: newBreadth,
              depth: newDepth,
              learnings: allLearnings,
              visitedUrls: allUrls,
              dataStream,
            });
          } else {
            // Completed
            dataStream.writeMessageAnnotation({
              type: 'research_update',
              data: {
                id: `search-complete`,
                type: 'progress',
                status: 'completed',
                message: 'Research complete',
                completedSteps: completedSteps,
                totalSteps: serpQueries.length * (depth + 1),
                isComplete: true,
                overwrite: true,
                timestamp: Date.now(),
              },
            });
            return {
              learnings: allLearnings,
              visitedUrls: allUrls,
            };
          }
        } catch (e: any) {
          if (e?.message?.includes('Timeout')) {
            console.log(`Timeout error running query: ${serpQuery.query}: `, e);
          } else {
            console.log(`Error running query: ${serpQuery.query}: `, e);
          }
          return {
            learnings: [],
            visitedUrls: [],
          };
        }
      }),
    ),
  );

  // Send final progress update
  dataStream.writeMessageAnnotation({
    type: 'research_update',
    data: {
      id: 'research-progress',
      type: 'progress',
      status: 'completed',
      message: `Research complete`,
      completedSteps: completedSteps,
      totalSteps: serpQueries.length * (depth + 1),
      isComplete: true,
      overwrite: true,
      timestamp: Date.now(),
    },
  });

  return {
    learnings: [...new Set(results.flatMap((r) => r.learnings))],
    visitedUrls: [...new Set(results.flatMap((r) => r.visitedUrls))],
  };
}
