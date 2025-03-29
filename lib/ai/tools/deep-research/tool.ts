import { z } from 'zod';
import type { Session } from 'next-auth';
import { type DataStreamWriter, tool } from 'ai';
import { deepResearchInternal, writeFinalAnswer } from './deep-research';

interface DeepResearchProps {
  session: Session;
  dataStream: DataStreamWriter;
}

const BREADTH = 3;
const DEPTH = 3;

export const deepResearch = ({ session, dataStream }: DeepResearchProps) =>
  tool({
    description: 'Request suggestions for a document',
    parameters: z.object({
      query: z.string().describe('The query to research'),
    }),
    execute: async ({ query }) => {
      console.log('\nStarting research...\n');

      const { learnings, visitedUrls } = await deepResearchInternal({
        query,
        breadth: BREADTH,
        depth: DEPTH,
      });

      console.log(`\n\nLearnings:\n\n${learnings.join('\n')}`);
      console.log(
        `\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`,
      );

      const answer = await writeFinalAnswer({
        prompt: query,
        learnings,
      });

      return {
        success: true,
        answer,
        learnings,
        visitedUrls,
      };
    },
  });
