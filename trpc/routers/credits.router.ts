import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { getUserById } from '@/lib/db/queries';

export const creditsRouter = createTRPCRouter({
  getAvailableCredits: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById({ userId: ctx.user.id });
    return {
      credits: user?.credits,
    };
  }),
});
