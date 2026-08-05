ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cargo" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ativo" boolean DEFAULT true NOT NULL;

ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "registro" text;
ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "certificadora_principal" text;
ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "valor_sinal" numeric(12,2) DEFAULT '0';
ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "descricao" text;

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "responsavel_id" uuid REFERENCES "users"("id");
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "responsavel_cargo" text;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "embarcacao_nome" text;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "cliente_nome" text;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "certificadora" text;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "prazo" text;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "arquivo_nome" text;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "arquivo_url" text;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "atualizado_em" text;

ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "ano" integer;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "elaborado_por" text;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "aceite_data" text;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "aceite_assinatura_nome" text;
