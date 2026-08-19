ALTER TABLE "accounts_receivable"
  ADD COLUMN IF NOT EXISTS "compromisso_id" uuid REFERENCES "commitments"("id");


