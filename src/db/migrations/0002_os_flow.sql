-- ===== Permissions / users =====
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "legacy" boolean DEFAULT false;

-- ===== proposals =====
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "cliente_id" uuid REFERENCES "clients"("id");
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "os_id" uuid;

-- ===== tasks =====
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "os_id" uuid;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "legacy" boolean DEFAULT false;

-- ===== service_orders =====
CREATE TABLE IF NOT EXISTS "service_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" text NOT NULL,
	"proposta_id" uuid REFERENCES "proposals"("id"),
	"embarcacao_id" uuid REFERENCES "vessels"("id"),
	"cliente_id" uuid REFERENCES "clients"("id"),
	"status" text DEFAULT 'aguardando_agendamento' NOT NULL,
	"responsavel_tecnico_id" uuid REFERENCES "users"("id"),
	"data_aceite" text,
	"data_conclusao" text,
	"observacoes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "service_orders_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_os_id_service_orders_id_fk') THEN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_os_id_service_orders_id_fk"
      FOREIGN KEY ("os_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proposals_os_id_service_orders_id_fk') THEN
    ALTER TABLE "proposals" ADD CONSTRAINT "proposals_os_id_service_orders_id_fk"
      FOREIGN KEY ("os_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

-- ===== service_order_items =====
CREATE TABLE IF NOT EXISTS "service_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"os_id" uuid NOT NULL REFERENCES "service_orders"("id"),
	"descricao" text NOT NULL,
	"quantidade" integer DEFAULT 1,
	"valor_unitario" numeric(12, 2) DEFAULT '0',
	"tipo" text DEFAULT 'outro',
	"status" text DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"os_id" uuid NOT NULL REFERENCES "service_orders"("id"),
	"status" text DEFAULT 'pendente' NOT NULL,
	"data" text,
	"horario" text,
	"local" text,
	"contato" text,
	"observacoes" text,
	"tecnico_responsavel_id" uuid REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"os_id" uuid NOT NULL REFERENCES "service_orders"("id"),
	"titulo" text NOT NULL,
	"tipo" text DEFAULT 'outro' NOT NULL,
	"status" text DEFAULT 'em_elaboracao' NOT NULL,
	"versao_atual" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL REFERENCES "documents"("id"),
	"versao" integer NOT NULL,
	"arquivo_nome_fisico" text NOT NULL,
	"arquivo_nome_original" text NOT NULL,
	"tamanho" integer DEFAULT 0,
	"tipo_mime" text,
	"autor_id" uuid REFERENCES "users"("id"),
	"autor_nome" text,
	"data" text,
	"comentario" text,
	"origem" text DEFAULT 'vistoria' NOT NULL,
	"situacao_revisao" text DEFAULT 'pendente',
	"situacao_aprovacao" text DEFAULT 'pendente',
	"aprovado_por_id" uuid REFERENCES "users"("id"),
	"aprovado_em" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "document_versions_doc_versao_unique"
	ON "document_versions" ("documento_id", "versao");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"os_id" uuid NOT NULL REFERENCES "service_orders"("id"),
	"documento_id" uuid REFERENCES "documents"("id"),
	"versao_enviada" integer,
	"orgao_ou_certificadora" text NOT NULL,
	"data_envio" text,
	"protocolo" text,
	"observacao" text,
	"responsavel_envio_id" uuid REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submissao_id" uuid NOT NULL REFERENCES "external_submissions"("id"),
	"tipo" text NOT NULL,
	"data" text,
	"motivo" text,
	"anexo_url" text,
	"anexo_nome" text,
	"versao_aprovada" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"os_id" uuid NOT NULL REFERENCES "service_orders"("id"),
	"status" text DEFAULT 'pendente' NOT NULL,
	"data_entrega" text,
	"meio_entrega" text,
	"nome_recebedor" text,
	"comprovante_url" text,
	"comprovante_nome" text,
	"entregue_por_id" uuid REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "os_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"os_id" uuid NOT NULL REFERENCES "service_orders"("id"),
	"tipo" text NOT NULL,
	"autor_id" uuid REFERENCES "users"("id"),
	"autor_nome" text,
	"descricao" text,
	"dados" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL REFERENCES "users"("id"),
	"tipo" text NOT NULL,
	"titulo" text NOT NULL,
	"mensagem" text,
	"lida" boolean DEFAULT false NOT NULL,
	"os_id" uuid REFERENCES "service_orders"("id"),
	"created_at" timestamp DEFAULT now()
);