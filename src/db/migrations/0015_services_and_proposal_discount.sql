CREATE TABLE IF NOT EXISTS "services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nome" text NOT NULL UNIQUE,
  "valor_padrao" numeric(12, 2) DEFAULT '0' NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "valor_desconto" numeric(12, 2) DEFAULT '0';

INSERT INTO "services" ("nome", "valor_padrao") VALUES
  ('Anotação de Responsabilidade Técnica (ART) - CREA/PA', 800.00),
  ('Declaração de responsabilidade técnica', 1200.00),
  ('Relatório de medição de chapas por ultrassom NDT', 8500.00),
  ('Certificado de homologação nas certificadoras', 3500.00),
  ('Croqui de sondagem', 4500.00)
ON CONFLICT ("nome") DO NOTHING;
