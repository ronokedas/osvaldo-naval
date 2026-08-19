CREATE TABLE IF NOT EXISTS "commitments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "titulo" text NOT NULL,
  "embarcacao_id" uuid NOT NULL REFERENCES "vessels"("id"),
  "responsavel_id" uuid NOT NULL REFERENCES "users"("id"),
  "vencimento" text NOT NULL,
  "observacoes" text,
  "prioridade" text NOT NULL DEFAULT 'normal',
  "status" text NOT NULL DEFAULT 'aberto',
  "criado_por_id" uuid REFERENCES "users"("id"),
  "destinatarios" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "commitment_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "compromisso_id" uuid NOT NULL REFERENCES "commitments"("id") ON DELETE CASCADE,
  "nome_original" text NOT NULL,
  "nome_fisico" text NOT NULL,
  "url" text NOT NULL,
  "tipo_mime" text,
  "tamanho" integer DEFAULT 0,
  "autor_id" uuid REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now()
);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "compromisso_id" uuid REFERENCES "commitments"("id");
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "prioridade" text DEFAULT 'normal';
