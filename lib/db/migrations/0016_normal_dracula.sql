DROP TABLE "ChatStream";--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "credits" SET DEFAULT 1000;--> statement-breakpoint
ALTER TABLE "Message" ADD COLUMN "parentMessageId" uuid;