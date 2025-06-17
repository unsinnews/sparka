import {
  getChatsByUserId,
  updateChatTitleById,
  getChatById,
  getMessageById,
  deleteMessagesByChatIdAfterMessageId,
  getAllMessagesByChatId,
  updateChatVisiblityById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/trpc/init';
import { z } from 'zod';
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { TRPCError } from '@trpc/server';
import { dbChatToUIChat, dbMessageToUIMessage } from '@/lib/message-conversion';
import { generateUUID } from '@/lib/utils';
import type { DBMessage } from '@/lib/db/schema';

export const chatRouter = createTRPCRouter({
  getAllChats: protectedProcedure.query(async ({ ctx }) => {
    const chats = await getChatsByUserId({ id: ctx.user.id });
    return chats.map(dbChatToUIChat);
  }),

  getMessagesByChatId: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify the chat belongs to the user
      const chat = await getChatById({ id: input.chatId });
      if (!chat || chat.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat not found',
        });
      }

      const dbMessages = await getAllMessagesByChatId({ chatId: input.chatId });
      return dbMessages.map(dbMessageToUIMessage);
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

      const res = await updateChatTitleById({
        chatId: input.chatId,
        title: input.title,
      });
      return;
    }),

  deleteTrailingMessages: protectedProcedure
    .input(
      z.object({
        messageId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the message to verify it exists and get its chat
      const [message] = await getMessageById({ id: input.messageId });

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      // Verify the chat belongs to the user
      const chat = await getChatById({ id: message.chatId });
      if (!chat || chat.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Access denied' });
      }

      // Delete all messages after the specified message (by position, not timestamp)
      await deleteMessagesByChatIdAfterMessageId({
        chatId: message.chatId,
        messageId: input.messageId,
      });

      return;
    }),

  setVisibility: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
        visibility: z.enum(['private', 'public']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the chat belongs to the user
      const chat = await getChatById({ id: input.chatId });
      if (!chat || chat.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat not found or access denied',
        });
      }

      // Update chat visibility
      await updateChatVisiblityById({
        chatId: input.chatId,
        visibility: input.visibility,
      });

      return { success: true };
    }),

  generateTitle: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ input }) => {
      const { text: title } = await generateText({
        model: myProvider.languageModel('title-model'),
        system: `\n
        - you will generate a short title based on the first message a user begins a conversation with
        - ensure it is not more than 80 characters long
        - the title should be a summary of the user's message
        - do not use quotes or colons`,
        prompt: input.message,
        experimental_telemetry: { isEnabled: true },
      });

      return { title };
    }),

  getPublicChat: publicProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      const chat = await getChatById({ id: input.chatId });

      if (!chat || chat.visibility !== 'public') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Public chat not found',
        });
      }

      return dbChatToUIChat(chat);
    }),

  getPublicChatMessages: publicProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      // First verify the chat is public
      const chat = await getChatById({ id: input.chatId });

      if (!chat || chat.visibility !== 'public') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Public chat not found',
        });
      }

      const dbMessages = await getAllMessagesByChatId({ chatId: input.chatId });
      return dbMessages.map(dbMessageToUIMessage);
    }),

  copyPublicChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First verify the chat is public
      const sourceChat = await getChatById({ id: input.chatId });

      if (!sourceChat || sourceChat.visibility !== 'public') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Public chat not found',
        });
      }

      // Get all messages from the source chat
      const sourceMessages = await getAllMessagesByChatId({
        chatId: input.chatId,
      });

      if (sourceMessages.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Source chat has no messages to copy',
        });
      }

      // Create a new chat for the user
      const newChatId = generateUUID();

      // Insert the new chat
      await saveChat({
        id: newChatId,
        userId: ctx.user.id,
        title: `${sourceChat.title}...`,
      });

      // Copy all messages to the new chat
      const messagesToInsert: typeof sourceMessages = [];
      let lastUUID = null;
      for (let i = 0; i < sourceMessages.length; i++) {
        const newMessage: DBMessage = {
          ...sourceMessages[i],
          id: generateUUID(),
          chatId: newChatId,
          parentMessageId: lastUUID,
        };
        messagesToInsert.push(newMessage);
        lastUUID = newMessage.id;
      }

      await saveMessages({ _messages: messagesToInsert });

      return { chatId: newChatId };
    }),
});
