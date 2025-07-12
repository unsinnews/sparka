ALTER TABLE "Document" DROP COLUMN IF EXISTS "metadata";
ALTER TABLE "Chat" ADD COLUMN "isPinned" boolean DEFAULT false NOT NULL;