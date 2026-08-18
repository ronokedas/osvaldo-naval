ALTER TABLE "commitments" ADD COLUMN IF NOT EXISTS "destinatarios" jsonb DEFAULT '[]'::jsonb;
