UPDATE "service_orders" AS service_order
SET "numero" = 'OS ' || regexp_replace(trim(proposal."numero"), '^DS\s*', '', 'i')
FROM "proposals" AS proposal
WHERE service_order."proposta_id" = proposal."id"
  AND proposal."numero" IS NOT NULL
  AND trim(proposal."numero") <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM "service_orders" AS duplicate
    WHERE duplicate."id" <> service_order."id"
      AND duplicate."numero" = 'OS ' || regexp_replace(trim(proposal."numero"), '^DS\s*', '', 'i')
  );
