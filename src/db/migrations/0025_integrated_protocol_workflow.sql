ALTER TABLE "protocols" ADD COLUMN IF NOT EXISTS "os_id" uuid REFERENCES "service_orders"("id");
ALTER TABLE "protocols" ADD COLUMN IF NOT EXISTS "canal" text;
ALTER TABLE "protocols" ADD COLUMN IF NOT EXISTS "ciclo_atual" integer NOT NULL DEFAULT 0;
ALTER TABLE "protocols" ADD COLUMN IF NOT EXISTS "requer_conciliacao" boolean NOT NULL DEFAULT false;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "aplicavel_analise_externa" boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "protocols_numero_unique" ON "protocols"("numero_protocolo");
CREATE INDEX IF NOT EXISTS "protocols_os_idx" ON "protocols"("os_id");

CREATE TABLE IF NOT EXISTS "protocol_dispatches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "protocolo_id" uuid NOT NULL REFERENCES "protocols"("id") ON DELETE CASCADE,
  "ciclo" integer NOT NULL DEFAULT 0,
  "tipo" text NOT NULL DEFAULT 'inicial',
  "data_envio" text NOT NULL,
  "referencia_externa" text,
  "canal" text,
  "destinatario" text,
  "observacao" text,
  "enviado_por_id" uuid REFERENCES "users"("id"),
  "enviado_por_nome" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "protocol_dispatch_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "remessa_id" uuid NOT NULL REFERENCES "protocol_dispatches"("id") ON DELETE CASCADE,
  "documento_id" uuid NOT NULL REFERENCES "documents"("id"),
  "versao_id" uuid NOT NULL REFERENCES "document_versions"("id"),
  "versao" integer NOT NULL,
  "titulo_documento" text NOT NULL,
  "resultado" text NOT NULL DEFAULT 'aguardando_analise',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "protocol_dispatch_doc_unique" ON "protocol_dispatch_documents"("remessa_id", "documento_id");

CREATE TABLE IF NOT EXISTS "protocol_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "protocolo_id" uuid NOT NULL REFERENCES "protocols"("id") ON DELETE CASCADE,
  "remessa_id" uuid NOT NULL REFERENCES "protocol_dispatches"("id") ON DELETE CASCADE,
  "tipo" text NOT NULL,
  "data" text NOT NULL,
  "motivo" text,
  "registrado_por_id" uuid REFERENCES "users"("id"),
  "registrado_por_nome" text,
  "created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "protocol_response_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "resposta_id" uuid NOT NULL REFERENCES "protocol_responses"("id") ON DELETE CASCADE,
  "documento_id" uuid NOT NULL REFERENCES "documents"("id"),
  "resultado" text NOT NULL,
  "observacao" text,
  "created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "protocol_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "protocolo_id" uuid NOT NULL REFERENCES "protocols"("id") ON DELETE CASCADE,
  "resposta_id" uuid REFERENCES "protocol_responses"("id") ON DELETE CASCADE,
  "tipo" text NOT NULL DEFAULT 'comprovante',
  "arquivo_url" text NOT NULL,
  "arquivo_nome" text NOT NULL,
  "tipo_mime" text,
  "tamanho" integer DEFAULT 0,
  "enviado_por_id" uuid REFERENCES "users"("id"),
  "enviado_por_nome" text,
  "created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "protocol_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "protocolo_id" uuid NOT NULL REFERENCES "protocols"("id") ON DELETE CASCADE,
  "tipo" text NOT NULL,
  "descricao" text NOT NULL,
  "dados" jsonb DEFAULT '{}'::jsonb,
  "autor_id" uuid REFERENCES "users"("id"),
  "autor_nome" text,
  "created_at" timestamp DEFAULT now()
);

-- Preserve legacy rows. They remain visible but cannot drive an OS until reconciled.
UPDATE "protocols" SET "requer_conciliacao" = true WHERE "os_id" IS NULL;

-- Deterministic reconciliation: exactly one OS and one legacy submission for vessel/date/destination.
WITH matches AS (
  SELECT p.id AS protocolo_id, MIN(es.os_id::text)::uuid AS os_id
  FROM protocols p
  JOIN service_orders so ON so.embarcacao_id = p.embarcacao_id
  JOIN external_submissions es ON es.os_id = so.id
    AND COALESCE(es.data_envio, '') = COALESCE(p.data_envio, '')
    AND lower(COALESCE(es.orgao_ou_certificadora, '')) = lower(COALESCE(p.orgao_ou_empresa, ''))
  GROUP BY p.id
  HAVING COUNT(DISTINCT es.os_id) = 1
)
UPDATE protocols p SET os_id = matches.os_id, requer_conciliacao = false
FROM matches WHERE p.id = matches.protocolo_id;
