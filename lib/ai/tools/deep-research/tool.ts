import { z } from 'zod';
import type { Session } from 'next-auth';
import { tool } from 'ai';
import {
  deepResearchInternal,
  writeFinalAnswer,
  writeFinalReport,
} from './deep-research';
import type { AnnotationDataStreamWriter } from '../annotation-stream';

// TODO: Restore both to 3 or make configurable. It needs to fit in 1m execution
const BREADTH = 3;
const DEPTH = 2;

export const deepResearch = ({
  session,
  dataStream,
  messageId,
}: {
  session: Session;
  dataStream: AnnotationDataStreamWriter;
  messageId: string;
}) =>
  tool({
    description: `End-to-end multi-step research assistant.

Usage:
- Complex topics that need planning, web+academic searches and synthesis

Avoid:
- Simple questions that can be answered directly`,
    parameters: z.object({
      query: z.string().describe('The query to research'),
      isReport: z
        .boolean()
        .describe('Whether to generate a report or just an answer'),
    }),
    execute: async ({ query, isReport }) => {
      let combinedQuery = query;
      if (isReport) {
        console.log(`Creating research plan...`);

        // TODO: Re-enable the flow for follow-up questions
        //         // Generate follow-up questions
        //         const followUpQuestions = await generateFeedback({
        //           query: query,
        //         });

        //         console.log(
        //           '\nTo better understand your research needs, please answer these follow-up questions:',
        //         );

        //         // Collect answers to follow-up questions
        //         const answers: string[] = [];
        //         for (const question of followUpQuestions) {
        //           const answer = await askQuestion(`\n${question}\nYour answer: `);
        //           answers.push(answer);
        //         }

        //         // Combine all information for deep research
        //         combinedQuery = `
        // Initial Query: ${query}
        // Follow-up Questions and Answers:
        // ${followUpQuestions.map((q: string, i: number) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}
        // `;
        //       }

        combinedQuery = `
        Initial Query: ${query}
        `;
      }
      console.log('\nStarting research...\n');

      const { learnings, visitedUrls } = await deepResearchInternal({
        query: combinedQuery,
        breadth: BREADTH,
        depth: DEPTH,
        dataStream,
      });

      console.log(`\n\nLearnings:\n\n${learnings.join('\n')}`);
      console.log(
        `\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`,
      );
      console.log('Writing final report...');

      if (isReport) {
        // TODO This should also create a title
        const report = await writeFinalReport({
          title: 'Research Report', // TODO: This should be generated
          description: 'Research Report', // TODO: This should be generated
          dataStream,
          session,
          prompt: combinedQuery,
          learnings,
          visitedUrls,
          messageId,
        });

        console.log(`\n\nFinal Report:\n\n${report}`);
        console.log('\nReport has been saved to report.md');

        // TODO: Replace this report return with text document streaming and saving
        // return {
        //   success: true,
        //   answer: report,
        //   learnings,
        //   visitedUrls,
        // };
        return {
          ...report,
          format: 'report' as const,
        };
      } else {
        const answer = await writeFinalAnswer({
          prompt: combinedQuery,
          learnings,
        });

        console.log(`\n\nFinal Answer:\n\n${answer}`);
        console.log('\nAnswer has been saved to answer.md');
        return {
          success: true as const,
          answer,
          learnings,
          visitedUrls,
          format: 'learnings' as const,
        };
      }
    },
  });
