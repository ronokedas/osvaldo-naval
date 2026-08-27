-- Acceptance records created before the OS link was available inherit the
-- canonical account relationship. This is safe and idempotent.
UPDATE "payments" p
SET "proposta_id" = ar."proposta_id",
    "os_id" = ar."os_id",
    "embarcacao_id" = ar."embarcacao_id"
FROM "accounts_receivable" ar
WHERE p."conta_receber_id" = ar."id"
  AND (p."proposta_id" IS DISTINCT FROM ar."proposta_id"
    OR p."os_id" IS DISTINCT FROM ar."os_id"
    OR p."embarcacao_id" IS DISTINCT FROM ar."embarcacao_id");

UPDATE "financial_entries" fe
SET "proposta_id" = ar."proposta_id",
    "os_id" = ar."os_id",
    "embarcacao_id" = ar."embarcacao_id"
FROM "accounts_receivable" ar
WHERE fe."conta_receber_id" = ar."id"
  AND (fe."proposta_id" IS DISTINCT FROM ar."proposta_id"
    OR fe."os_id" IS DISTINCT FROM ar."os_id"
    OR fe."embarcacao_id" IS DISTINCT FROM ar."embarcacao_id");
