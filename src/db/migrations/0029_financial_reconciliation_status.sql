ALTER TABLE "financial_entries" ADD COLUMN IF NOT EXISTS "situacao_conciliacao" text NOT NULL DEFAULT 'conciliado';

UPDATE "financial_entries"
SET "situacao_conciliacao" = 'requer_conciliacao'
WHERE "natureza" = 'entrada'
  AND "tipo" <> 'despesa'
  AND "embarcacao_id" IS NOT NULL
  AND "conta_receber_id" IS NULL;
