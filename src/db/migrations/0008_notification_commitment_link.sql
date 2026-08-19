ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "compromisso_id" uuid REFERENCES "commitments"("id");

