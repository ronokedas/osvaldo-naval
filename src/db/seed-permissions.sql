-- ===== Set permissions for Osvaldo (admin + all technical) =====
UPDATE "users"
SET "permissions" = '["cadastrar_clientes_embarcacoes_propostas","registrar_aceite_agendar","executar_vistoria","anexar_editar_versoes","revisar_documentos","aprovar_tecnicamente","registrar_envio_resposta_externa","entregar_concluir","financeiro_administracao"]',
    "role" = 'admin',
    "cargo" = 'Administrador / Responsável Técnico'
WHERE "email" = 'osvaldo@nautilus.eng.br';

-- ===== Set permissions for Deisy (comercial, financeiro, agendamento, edição de versões) =====
UPDATE "users"
SET "permissions" = '["cadastrar_clientes_embarcacoes_propostas","registrar_aceite_agendar","anexar_editar_versoes","financeiro_administracao"]',
    "role" = 'financeiro',
    "cargo" = 'Comercial / Financeiro'
WHERE "email" = 'deisy@nautilus.eng.br';

-- ===== Create Lucas if not exists (senha inicial será definida via aplicação/app) =====
INSERT INTO "users" ("nome", "email", "role", "cargo", "ativo", "permissions", "senha", "created_at", "updated_at")
SELECT 'Lucas', 'lucas@nautilus.eng.br', 'tecnico', 'Editor / Entrega', true,
    '["anexar_editar_versoes","entregar_concluir"]',
    (SELECT "senha" FROM "users" WHERE "email" = 'deisy@nautilus.eng.br' LIMIT 1),
    now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = 'lucas@nautilus.eng.br');

-- ===== Set Lucas permissions if already exists =====
UPDATE "users"
SET "permissions" = '["anexar_editar_versoes","entregar_concluir"]',
    "role" = 'tecnico',
    "cargo" = 'Editor / Entrega',
    "ativo" = true
WHERE "email" = 'lucas@nautilus.eng.br';