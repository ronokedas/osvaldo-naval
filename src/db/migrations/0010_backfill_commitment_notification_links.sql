UPDATE "notifications" n
SET "compromisso_id" = c.id
FROM "commitments" c
WHERE n."compromisso_id" IS NULL
  AND n.tipo IN ('compromisso_criado', 'compromisso_status')
  AND n.mensagem LIKE c.titulo || '%';

