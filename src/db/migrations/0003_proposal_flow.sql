-- ===== Proposta: aceite, entregas, contas a receber, pagamentos e recibos =====

-- ===== proposal_acceptances =====
CREATE TABLE IF NOT EXISTS "proposal_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposta_id" uuid NOT NULL REFERENCES "proposals"("id"),
	"meio" text NOT NULL DEFAULT 'outro',
	"responsavel_nome" text NOT NULL,
	"data" text,
	"observacao" text,
	"usuario_id" uuid REFERENCES "users"("id"),
	"usuario_nome" text,
	"documento_url" text,
	"documento_nome" text,
	"origem" text DEFAULT 'normal',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "proposal_acceptances_proposta_unique"
	ON "proposal_acceptances" ("proposta_id");

-- ===== proposal_deliveries =====
CREATE TABLE IF NOT EXISTS "proposal_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposta_id" uuid NOT NULL REFERENCES "proposals"("id"),
	"canal" text NOT NULL,
	"destinatario" text,
	"status" text DEFAULT 'enviado',
	"erro" text,
	"usuario_id" uuid REFERENCES "users"("id"),
	"usuario_nome" text,
	"data" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- ===== accounts_receivable =====
CREATE TABLE IF NOT EXISTS "accounts_receivable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposta_id" uuid NOT NULL REFERENCES "proposals"("id"),
	"os_id" uuid REFERENCES "service_orders"("id"),
	"embarcacao_id" uuid REFERENCES "vessels"("id"),
	"cliente_id" uuid REFERENCES "clients"("id"),
	"valor_original" numeric(12, 2) DEFAULT '0',
	"status" text DEFAULT 'pendente',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_receivable_proposta_unique"
	ON "accounts_receivable" ("proposta_id");

-- ===== payments =====
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conta_receber_id" uuid REFERENCES "accounts_receivable"("id"),
	"proposta_id" uuid REFERENCES "proposals"("id"),
	"os_id" uuid REFERENCES "service_orders"("id"),
	"embarcacao_id" uuid REFERENCES "vessels"("id"),
	"valor" numeric(12, 2) DEFAULT '0',
	"data" text,
	"forma_pagamento" text,
	"observacao" text,
	"lancado_por_nome" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- ===== receipts =====
CREATE TABLE IF NOT EXISTS "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" text NOT NULL,
	"data_emissao" text,
	"emissor_nome" text,
	"payment_id" uuid REFERENCES "payments"("id"),
	"conta_receber_id" uuid REFERENCES "accounts_receivable"("id"),
	"status" text DEFAULT 'ativo',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "receipts_numero_unique"
	ON "receipts" ("numero");

-- ===== financial_entries vínculos (compatibilidade/legado) =====
ALTER TABLE "financial_entries" ADD COLUMN IF NOT EXISTS "proposta_id" uuid;
ALTER TABLE "financial_entries" ADD COLUMN IF NOT EXISTS "os_id" uuid;
ALTER TABLE "financial_entries" ADD COLUMN IF NOT EXISTS "conta_receber_id" uuid;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_entries_proposta_id_proposals_id_fk') THEN
    ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_proposta_id_proposals_id_fk"
      FOREIGN KEY ("proposta_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_entries_os_id_service_orders_id_fk') THEN
    ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_os_id_service_orders_id_fk"
      FOREIGN KEY ("os_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_entries_conta_receber_id_accounts_receivable_id_fk') THEN
    ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_conta_receber_id_accounts_receivable_id_fk"
      FOREIGN KEY ("conta_receber_id") REFERENCES "public"."accounts_receivable"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;