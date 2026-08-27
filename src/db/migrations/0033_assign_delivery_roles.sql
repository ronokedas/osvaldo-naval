-- Entregas pendentes passam a seguir a função operacional, não um nome fixo.
UPDATE "deliveries" d
SET "responsavel_id" = u.id,
    "updated_at" = now()
FROM "users" u
WHERE d."responsavel_id" IS NULL
  AND d."status" IN ('pendente', 'em_entrega', 'aguardando_complemento')
  AND u."ativo" = true
  AND lower(u."cargo") = 'entregador'
  AND (SELECT count(*) FROM "users" candidate WHERE candidate."ativo" = true AND lower(candidate."cargo") = 'entregador') = 1;
