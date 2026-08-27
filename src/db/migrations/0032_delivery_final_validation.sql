-- Entrega operacional em múltiplas remessas e validação administrativa final.
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "responsavel_id" uuid REFERENCES "users"("id");
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "iniciada_em" timestamp;
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "concluida_em" timestamp;
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "motivo_reabertura" text;

CREATE TABLE IF NOT EXISTS "approved_document_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "protocolo_id" uuid NOT NULL REFERENCES "protocols"("id") ON DELETE CASCADE,
  "resposta_id" uuid REFERENCES "protocol_responses"("id") ON DELETE SET NULL,
  "documento_id" uuid NOT NULL REFERENCES "documents"("id"),
  "versao_id" uuid REFERENCES "document_versions"("id"),
  "arquivo_url" text NOT NULL,
  "arquivo_nome" text NOT NULL,
  "tipo_mime" text,
  "tamanho" integer DEFAULT 0,
  "enviado_por_id" uuid REFERENCES "users"("id"),
  "enviado_por_nome" text,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "approved_document_file_document_unique"
  ON "approved_document_files" ("protocolo_id", "documento_id");

CREATE TABLE IF NOT EXISTS "delivery_dispatches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "delivery_id" uuid NOT NULL REFERENCES "deliveries"("id") ON DELETE CASCADE,
  "tipo" text NOT NULL DEFAULT 'parcial',
  "status" text NOT NULL DEFAULT 'entregue',
  "data_entrega" text NOT NULL,
  "meio_entrega" text NOT NULL,
  "nome_recebedor" text NOT NULL,
  "destino" text NOT NULL,
  "referencia" text,
  "comprovante_url" text NOT NULL,
  "comprovante_nome" text NOT NULL,
  "entregue_por_id" uuid REFERENCES "users"("id"),
  "entregue_por_nome" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "delivery_dispatch_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "remessa_entrega_id" uuid NOT NULL REFERENCES "delivery_dispatches"("id") ON DELETE CASCADE,
  "arquivo_aprovado_id" uuid NOT NULL REFERENCES "approved_document_files"("id"),
  "created_at" timestamp DEFAULT now(),
  UNIQUE("remessa_entrega_id", "arquivo_aprovado_id")
);

CREATE TABLE IF NOT EXISTS "os_finalization_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "os_id" uuid NOT NULL REFERENCES "service_orders"("id") ON DELETE CASCADE,
  "decisao" text NOT NULL,
  "observacao" text,
  "administrador_id" uuid REFERENCES "users"("id"),
  "administrador_nome" text,
  "created_at" timestamp DEFAULT now()
);

-- Mantém o histórico das entregas antigas sem assumir que eram a última remessa.
INSERT INTO "delivery_dispatches" ("delivery_id", "tipo", "status", "data_entrega", "meio_entrega", "nome_recebedor", "destino", "comprovante_url", "comprovante_nome", "entregue_por_id")
SELECT d.id, 'historica_indefinida', 'entregue', COALESCE(d.data_entrega, CURRENT_DATE::text), COALESCE(d.meio_entrega, 'não informado'), COALESCE(d.nome_recebedor, 'não informado'), 'Histórico legado', d.comprovante_url, d.comprovante_nome, d.entregue_por_id
FROM "deliveries" d
WHERE d.status = 'entregue' AND d.comprovante_url IS NOT NULL AND d.comprovante_nome IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "delivery_dispatches" dd WHERE dd.delivery_id = d.id);

UPDATE "deliveries"
SET "status" = CASE
  WHEN "status" = 'entregue' THEN 'aguardando_complemento'
  WHEN "status" = 'impresso' THEN 'em_entrega'
  ELSE "status"
END
WHERE "status" IN ('entregue', 'impresso');

UPDATE "users"
SET "cargo" = 'Entregador',
    "permissions" = COALESCE("permissions", '[]'::jsonb) || '["executar_entregas"]'::jsonb,
    "updated_at" = now()
WHERE lower("email") = 'lucas@nautilus.eng.br'
  AND NOT (COALESCE("permissions", '[]'::jsonb) @> '["executar_entregas"]'::jsonb);
