-- Reconcile unlinked income created after the first reconciliation migration.
-- Only a single open receivable with sufficient balance is eligible.
WITH candidates AS (
  SELECT fe."id" AS entry_id, ar."id" AS receivable_id,
         ar."proposta_id", ar."os_id", ar."embarcacao_id",
         COUNT(*) OVER (PARTITION BY fe."id") AS receivable_count,
         ar."valor_original" - COALESCE((
           SELECT SUM(p."valor") FROM "payments" p
           WHERE p."conta_receber_id" = ar."id" AND p."ativo" = true
         ), 0) AS outstanding
  FROM "financial_entries" fe
  JOIN "accounts_receivable" ar ON ar."embarcacao_id" = fe."embarcacao_id"
  WHERE fe."natureza" = 'entrada' AND fe."tipo" <> 'despesa'
    AND fe."conta_receber_id" IS NULL AND ar."status" <> 'cancelado'
), eligible AS (
  SELECT c.* FROM candidates c
  JOIN "financial_entries" fe ON fe."id" = c.entry_id
  WHERE c.receivable_count = 1 AND c.outstanding >= fe."valor"
)
INSERT INTO "payments" ("conta_receber_id", "proposta_id", "os_id", "embarcacao_id", "financial_entry_id", "valor", "data", "forma_pagamento", "observacao", "lancado_por_nome")
SELECT e.receivable_id, e.proposta_id, e.os_id, e.embarcacao_id, fe."id", fe."valor", fe."data", fe."forma_pagamento", fe."observacao", fe."lancado_por_nome"
FROM eligible e JOIN "financial_entries" fe ON fe."id" = e.entry_id
WHERE NOT EXISTS (SELECT 1 FROM "payments" p WHERE p."financial_entry_id" = fe."id");

UPDATE "financial_entries" fe
SET "conta_receber_id" = p."conta_receber_id", "proposta_id" = p."proposta_id", "os_id" = p."os_id",
    "situacao_conciliacao" = 'conciliado'
FROM "payments" p
WHERE p."financial_entry_id" = fe."id" AND fe."conta_receber_id" IS NULL;

UPDATE "accounts_receivable" ar
SET "status" = CASE
  WHEN COALESCE((SELECT SUM(p."valor") FROM "payments" p WHERE p."conta_receber_id" = ar."id" AND p."ativo" = true), 0) >= ar."valor_original" THEN 'pago'
  WHEN COALESCE((SELECT SUM(p."valor") FROM "payments" p WHERE p."conta_receber_id" = ar."id" AND p."ativo" = true), 0) > 0 THEN 'parcial'
  ELSE 'pendente' END,
  "updated_at" = NOW();

UPDATE "vessels" v SET "valor_recebido" = COALESCE((
  SELECT SUM(p."valor") FROM "payments" p WHERE p."embarcacao_id" = v."id" AND p."ativo" = true
), 0);
