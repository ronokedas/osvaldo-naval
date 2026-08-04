CREATE TABLE "app_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"email" text,
	"telefone" text,
	"cnpj_cpf" text,
	"endereco" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "critical_pendings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" text NOT NULL,
	"titulo" text NOT NULL,
	"embarcacao_nome" text,
	"detalhe" text,
	"urgencia" text,
	"data" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"embarcacao_id" uuid,
	"embarcacao_nome" text,
	"cliente_nome" text,
	"data" text,
	"valor" numeric(12, 2) DEFAULT '0',
	"tipo" text NOT NULL,
	"forma_pagamento" text,
	"observacao" text,
	"lancado_por_nome" text,
	"nota_fiscal_numero" text,
	"nota_fiscal_nome" text,
	"nota_fiscal_url" text,
	"recibo_numero" text,
	"comprovante_despesa_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" text NOT NULL,
	"data_emissao" text,
	"validade_dias" integer,
	"embarcacao_id" uuid,
	"embarcacao_nome" text,
	"cliente_nome" text,
	"destinatario" text,
	"assunto" text,
	"prazo_entrega_dias" integer,
	"condicoes_pagamento" text,
	"status" text DEFAULT 'rascunho' NOT NULL,
	"itens" jsonb DEFAULT '[]'::jsonb,
	"valor_total" numeric(12, 2) DEFAULT '0',
	"observacoes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "protocols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_protocolo" text NOT NULL,
	"data_envio" text,
	"embarcacao_id" uuid,
	"embarcacao_nome" text,
	"cliente_nome" text,
	"destinatario" text,
	"orgao_ou_empresa" text,
	"tipo_protocolo" text,
	"responsavel_envio_nome" text,
	"status" text DEFAULT 'em_trânsito' NOT NULL,
	"codigo_rastreio" text,
	"comprovante_url" text,
	"comprovante_nome" text,
	"documentos_incluidos" jsonb DEFAULT '[]'::jsonb,
	"observacoes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"embarcacao_id" uuid,
	"titulo" text NOT NULL,
	"tipo" text NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"responsavel_nome" text,
	"data_criacao" text,
	"prazo_vencimento" text,
	"anexos" jsonb DEFAULT '[]'::jsonb,
	"protocolo_gerado" boolean DEFAULT false,
	"data_conclusao" text,
	"arquivos_recebidos" jsonb DEFAULT '[]'::jsonb,
	"historico_notas" jsonb DEFAULT '[]'::jsonb,
	"observacoes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'tecnico' NOT NULL,
	"senha" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vessels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL,
	"cliente_id" uuid,
	"cliente_nome" text,
	"telefone_contato" text,
	"email_contato" text,
	"responsavel_tecnico" text,
	"status" text DEFAULT 'aberta' NOT NULL,
	"etapa_atual" text,
	"prazo_renovacao" text,
	"valor_total" numeric(12, 2) DEFAULT '0',
	"valor_recebido" numeric(12, 2) DEFAULT '0',
	"arquivos_associados" jsonb DEFAULT '[]'::jsonb,
	"progresso" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_embarcacao_id_vessels_id_fk" FOREIGN KEY ("embarcacao_id") REFERENCES "public"."vessels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_embarcacao_id_vessels_id_fk" FOREIGN KEY ("embarcacao_id") REFERENCES "public"."vessels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_embarcacao_id_vessels_id_fk" FOREIGN KEY ("embarcacao_id") REFERENCES "public"."vessels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_embarcacao_id_vessels_id_fk" FOREIGN KEY ("embarcacao_id") REFERENCES "public"."vessels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_cliente_id_clients_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;