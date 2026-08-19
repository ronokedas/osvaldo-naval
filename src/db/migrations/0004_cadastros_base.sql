-- ===== Adicionar campos: certificadoras, clientes (whatsapp), embarcações (dimensões e FK certificadora) =====

-- ===== Tabela de certificadoras =====
CREATE TABLE IF NOT EXISTS "certifiers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nome" text NOT NULL,
  "codigo_registro" text,
  "telefone_contato" text,
  "email" text,
  "ativo" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- ===== Adicionar campo whatsapp em clients =====
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "whatsapp" text;

-- ===== Adicionar campos em vessels: dimensões e FK para certifiers =====
ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "certificadora_id" uuid;
ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "comprimento" numeric(10, 2);
ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "boca" numeric(10, 2);
ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "pontal" numeric(10, 2);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vessels_certificadora_id_certifiers_id_fk') THEN
    ALTER TABLE "vessels" ADD CONSTRAINT "vessels_certificadora_id_certifiers_id_fk"
      FOREIGN KEY ("certificadora_id") REFERENCES "public"."certifiers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
