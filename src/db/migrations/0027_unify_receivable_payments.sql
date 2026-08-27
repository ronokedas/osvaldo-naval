ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "financial_entry_id" uuid REFERENCES "financial_entries"("id");
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "ativo" boolean NOT NULL DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_financial_entry_unique"
  ON "payments" ("financial_entry_id") WHERE "financial_entry_id" IS NOT NULL;

-- A payment already created by the proposal acceptance can be linked to its
-- mirrored financial entry without duplicating either historical record.
UPDATE "payments" p
SET "financial_entry_id" = fe."id"
FROM "financial_entries" fe
WHERE p."financial_entry_id" IS NULL
  AND fe."conta_receber_id" = p."conta_receber_id"
  AND fe."valor" = p."valor"
  AND fe."data" IS NOT DISTINCT FROM p."data"
  AND fe."natureza" = 'entrada'
  AND NOT EXISTS (
    SELECT 1 FROM "payments" linked WHERE linked."financial_entry_id" = fe."id"
  );

-- Reconcile legacy income only when exactly one open receivable exists for
-- the vessel and the amount fits its outstanding balance. Ambiguous records
-- deliberately remain unallocated for manual reconciliation.
WITH candidates AS (
  SELECT fe."id" AS entry_id, ar."id" AS receivable_id,
         ar."proposta_id", ar."os_id", ar."embarcacao_id",
         COUNT(*) OVER (PARTITION BY fe."id") AS open_receivables,
         ar."valor_original" - COALESCE((
           SELECT SUM(p."valor") FROM "payments" p
           WHERE p."conta_receber_id" = ar."id" AND p."ativo" = true
         ), 0) AS outstanding
  FROM "financial_entries" fe
  JOIN "accounts_receivable" ar ON ar."embarcacao_id" = fe."embarcacao_id"
  WHERE fe."natureza" = 'entrada'
    AND fe."tipo" <> 'despesa'
    AND fe."conta_receber_id" IS NULL
    AND ar."status" <> 'cancelado'
), eligible AS (
  SELECT * FROM candidates
  WHERE open_receivables = 1 AND outstanding >= 0 AND outstanding >= (
    SELECT "valor" FROM "financial_entries" fe WHERE fe."id" = entry_id
  )
)
INSERT INTO "payments" ("conta_receber_id", "proposta_id", "os_id", "embarcacao_id", "financial_entry_id", "valor", "data", "forma_pagamento", "observacao", "lancado_por_nome")
SELECT e.receivable_id, e.proposta_id, e.os_id, e.embarcacao_id, fe."id", fe."valor", fe."data", fe."forma_pagamento", fe."observacao", fe."lancado_por_nome"
FROM eligible e
JOIN "financial_entries" fe ON fe."id" = e.entry_id
WHERE NOT EXISTS (SELECT 1 FROM "payments" p WHERE p."financial_entry_id" = fe."id");

UPDATE "financial_entries" fe
SET "conta_receber_id" = p."conta_receber_id",
    "proposta_id" = p."proposta_id",
    "os_id" = p."os_id"
FROM "payments" p
WHERE p."financial_entry_id" = fe."id"
  AND fe."conta_receber_id" IS NULL;

UPDATE "accounts_receivable" ar
SET "status" = CASE
  WHEN COALESCE((SELECT SUM(p."valor") FROM "payments" p WHERE p."conta_receber_id" = ar."id" AND p."ativo" = true), 0) >= ar."valor_original" THEN 'pago'
  WHEN COALESCE((SELECT SUM(p."valor") FROM "payments" p WHERE p."conta_receber_id" = ar."id" AND p."ativo" = true), 0) > 0 THEN 'parcial'
  ELSE 'pendente'
END,
"updated_at" = NOW();

UPDATE "vessels" v
SET "valor_recebido" = COALESCE((
  SELECT SUM(p."valor") FROM "payments" p
  WHERE p."embarcacao_id" = v."id" AND p."ativo" = true
), 0);
