ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "renovacao_de_id" uuid REFERENCES "proposals"("id");
