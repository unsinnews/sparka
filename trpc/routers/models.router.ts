import { allModels } from '@/lib/ai/all-models';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const modelsRouter = createTRPCRouter({
  getAvailableModels: protectedProcedure.query(async ({ ctx }) => {
    return allModels.filter(
      (model) =>
        model.specification.provider === 'openai' ||
        model.specification.provider === 'anthropic' ||
        model.specification.provider === 'xai',
    );
  }),
});
