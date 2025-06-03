import {
  getChatsByUserId,
  updateChatTitleById,
  getChatById,
} from '@/lib/db/queries';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { z } from 'zod';

export const chatRouter = createTRPCRouter({
  getAllChats: protectedProcedure.query(async ({ ctx }) => {
    return await getChatsByUserId({ id: ctx.user.id });
  }),

  renameChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
        title: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the chat belongs to the user
      const chat = await getChatById({ id: input.chatId });
      if (!chat || chat.userId !== ctx.user.id) {
        throw new Error('Chat not found or access denied');
      }

      return await updateChatTitleById({
        chatId: input.chatId,
        title: input.title,
      });
    }),
});
