import { getChatsByUserId } from '@/lib/db/queries';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const chatRouter = createTRPCRouter({
  getAllChats: protectedProcedure.query(async ({ ctx }) => {
    return await getChatsByUserId({ id: ctx.user.id });
  }),
});
