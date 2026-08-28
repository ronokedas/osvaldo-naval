--
-- PostgreSQL database dump
--

\restrict QH84BSc7dxMfvLe5Jj1BfCry6v77NVcg8k9sdGbKNkqRexxPgey5uc1fRQIx1xY

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: nautilus_user
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO nautilus_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: nautilus_user
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO nautilus_user;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: nautilus_user
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO nautilus_user;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: nautilus_user
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: accounts_payable; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.accounts_payable (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fornecedor_id uuid,
    categoria_id uuid,
    embarcacao_id uuid,
    descricao text NOT NULL,
    valor_original numeric(12,2) DEFAULT 0,
    vencimento text,
    competencia text,
    status text DEFAULT 'pendente'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.accounts_payable OWNER TO nautilus_user;

--
-- Name: accounts_receivable; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.accounts_receivable (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proposta_id uuid NOT NULL,
    os_id uuid,
    embarcacao_id uuid,
    cliente_id uuid,
    valor_original numeric(12,2) DEFAULT '0'::numeric,
    status text DEFAULT 'pendente'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    compromisso_id uuid
);


ALTER TABLE public.accounts_receivable OWNER TO nautilus_user;

--
-- Name: app_configs; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.app_configs (
    id text NOT NULL,
    data jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.app_configs OWNER TO nautilus_user;

--
-- Name: approved_document_files; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.approved_document_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocolo_id uuid NOT NULL,
    resposta_id uuid,
    documento_id uuid NOT NULL,
    versao_id uuid,
    arquivo_url text NOT NULL,
    arquivo_nome text NOT NULL,
    tipo_mime text,
    tamanho integer DEFAULT 0,
    enviado_por_id uuid,
    enviado_por_nome text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.approved_document_files OWNER TO nautilus_user;

--
-- Name: certifiers; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.certifiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    codigo_registro text,
    telefone_contato text,
    email text,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    portal_url text,
    setor_destinatario text,
    endereco text,
    canal_preferencial text,
    instrucoes_protocolo text
);


ALTER TABLE public.certifiers OWNER TO nautilus_user;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    email text,
    telefone text,
    cnpj_cpf text,
    endereco text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    whatsapp text
);


ALTER TABLE public.clients OWNER TO nautilus_user;

--
-- Name: commitment_attachments; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.commitment_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    compromisso_id uuid NOT NULL,
    nome_original text NOT NULL,
    nome_fisico text NOT NULL,
    url text NOT NULL,
    tipo_mime text,
    tamanho integer DEFAULT 0,
    autor_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.commitment_attachments OWNER TO nautilus_user;

--
-- Name: commitments; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.commitments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    embarcacao_id uuid NOT NULL,
    responsavel_id uuid NOT NULL,
    vencimento text NOT NULL,
    observacoes text,
    prioridade text DEFAULT 'normal'::text NOT NULL,
    status text DEFAULT 'aberto'::text NOT NULL,
    criado_por_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    destinatarios jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.commitments OWNER TO nautilus_user;

--
-- Name: critical_pendings; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.critical_pendings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo text NOT NULL,
    titulo text NOT NULL,
    embarcacao_nome text,
    detalhe text,
    urgencia text,
    data text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.critical_pendings OWNER TO nautilus_user;

--
-- Name: deliveries; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.deliveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    os_id uuid NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    data_entrega text,
    meio_entrega text,
    nome_recebedor text,
    comprovante_url text,
    comprovante_nome text,
    entregue_por_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    data_impressao text,
    impresso_por_id uuid,
    responsavel_id uuid,
    iniciada_em timestamp without time zone,
    concluida_em timestamp without time zone,
    motivo_reabertura text
);


ALTER TABLE public.deliveries OWNER TO nautilus_user;

--
-- Name: delivery_dispatch_documents; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.delivery_dispatch_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    remessa_entrega_id uuid NOT NULL,
    arquivo_aprovado_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.delivery_dispatch_documents OWNER TO nautilus_user;

--
-- Name: delivery_dispatches; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.delivery_dispatches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    delivery_id uuid NOT NULL,
    tipo text DEFAULT 'parcial'::text NOT NULL,
    status text DEFAULT 'entregue'::text NOT NULL,
    data_entrega text NOT NULL,
    meio_entrega text NOT NULL,
    nome_recebedor text NOT NULL,
    destino text NOT NULL,
    referencia text,
    comprovante_url text NOT NULL,
    comprovante_nome text NOT NULL,
    entregue_por_id uuid,
    entregue_por_nome text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.delivery_dispatches OWNER TO nautilus_user;

--
-- Name: document_library_audit; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.document_library_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_id uuid,
    folder_id uuid,
    actor_id uuid NOT NULL,
    action text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.document_library_audit OWNER TO nautilus_user;

--
-- Name: document_library_files; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.document_library_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id uuid NOT NULL,
    folder_id uuid,
    original_name text NOT NULL,
    stored_name text NOT NULL,
    mime_type text,
    size integer DEFAULT 0 NOT NULL,
    uploaded_by_id uuid NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL,
    trashed_at timestamp without time zone,
    trashed_by_id uuid
);


ALTER TABLE public.document_library_files OWNER TO nautilus_user;

--
-- Name: document_library_folders; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.document_library_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id uuid NOT NULL,
    parent_id uuid,
    name text NOT NULL,
    created_by_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.document_library_folders OWNER TO nautilus_user;

--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.document_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    documento_id uuid NOT NULL,
    versao integer NOT NULL,
    arquivo_nome_fisico text NOT NULL,
    arquivo_nome_original text NOT NULL,
    tamanho integer DEFAULT 0,
    tipo_mime text,
    autor_id uuid,
    autor_nome text,
    data text,
    comentario text,
    origem text DEFAULT 'vistoria'::text NOT NULL,
    situacao_revisao text DEFAULT 'pendente'::text,
    situacao_aprovacao text DEFAULT 'pendente'::text,
    aprovado_por_id uuid,
    aprovado_em text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    pdf_url text
);


ALTER TABLE public.document_versions OWNER TO nautilus_user;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    os_id uuid NOT NULL,
    titulo text NOT NULL,
    tipo text DEFAULT 'outro'::text NOT NULL,
    status text DEFAULT 'em_elaboracao'::text NOT NULL,
    versao_atual integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    aplicavel_analise_externa boolean DEFAULT false NOT NULL
);


ALTER TABLE public.documents OWNER TO nautilus_user;

--
-- Name: external_responses; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.external_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submissao_id uuid NOT NULL,
    tipo text NOT NULL,
    data text,
    motivo text,
    anexo_url text,
    anexo_nome text,
    versao_aprovada integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.external_responses OWNER TO nautilus_user;

--
-- Name: external_submissions; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.external_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    os_id uuid NOT NULL,
    documento_id uuid,
    versao_enviada integer,
    orgao_ou_certificadora text NOT NULL,
    data_envio text,
    protocolo text,
    observacao text,
    responsavel_envio_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.external_submissions OWNER TO nautilus_user;

--
-- Name: financial_attachments; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.financial_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_id uuid NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_size integer DEFAULT 0,
    mime_type text,
    document_type text DEFAULT 'outro'::text NOT NULL,
    document_number text,
    series text,
    uploaded_by uuid,
    uploaded_by_name text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.financial_attachments OWNER TO nautilus_user;

--
-- Name: financial_categories; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.financial_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    natureza text DEFAULT 'despesa'::text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.financial_categories OWNER TO nautilus_user;

--
-- Name: financial_entries; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.financial_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    embarcacao_id uuid,
    embarcacao_nome text,
    cliente_nome text,
    data text,
    valor numeric(12,2) DEFAULT '0'::numeric,
    tipo text NOT NULL,
    forma_pagamento text,
    observacao text,
    lancado_por_nome text,
    nota_fiscal_numero text,
    nota_fiscal_nome text,
    nota_fiscal_url text,
    recibo_numero text,
    comprovante_despesa_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    proposta_id uuid,
    os_id uuid,
    conta_receber_id uuid,
    issuer_id uuid,
    nf_series text,
    is_storno boolean DEFAULT false,
    storno_reason text,
    original_payment_id uuid,
    notification_sent boolean DEFAULT false,
    conta_pagar_id uuid,
    categoria_id uuid,
    fornecedor_id uuid,
    natureza text DEFAULT 'entrada'::text NOT NULL,
    competencia text,
    vencimento text,
    situacao_conciliacao text DEFAULT 'conciliado'::text NOT NULL
);


ALTER TABLE public.financial_entries OWNER TO nautilus_user;

--
-- Name: financial_status_history; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.financial_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    embarcacao_id uuid,
    os_id uuid,
    previous_status text,
    new_status text NOT NULL,
    previous_value numeric(12,2) DEFAULT 0,
    new_value numeric(12,2) DEFAULT 0 NOT NULL,
    total_value numeric(12,2) DEFAULT 0,
    percentage numeric(5,2) DEFAULT 0,
    triggered_by uuid,
    triggered_by_name text,
    entry_id uuid,
    observation text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.financial_status_history OWNER TO nautilus_user;

--
-- Name: financial_suppliers; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.financial_suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    documento text,
    email text,
    telefone text,
    observacoes text,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.financial_suppliers OWNER TO nautilus_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    tipo text NOT NULL,
    titulo text NOT NULL,
    mensagem text,
    lida boolean DEFAULT false NOT NULL,
    os_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    prioridade text DEFAULT 'normal'::text,
    compromisso_id uuid
);


ALTER TABLE public.notifications OWNER TO nautilus_user;

--
-- Name: os_events; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.os_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    os_id uuid NOT NULL,
    tipo text NOT NULL,
    autor_id uuid,
    autor_nome text,
    descricao text,
    dados jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.os_events OWNER TO nautilus_user;

--
-- Name: os_finalization_reviews; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.os_finalization_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    os_id uuid NOT NULL,
    decisao text NOT NULL,
    observacao text,
    administrador_id uuid,
    administrador_nome text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.os_finalization_reviews OWNER TO nautilus_user;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conta_receber_id uuid,
    proposta_id uuid,
    os_id uuid,
    embarcacao_id uuid,
    valor numeric(12,2) DEFAULT '0'::numeric,
    data text,
    forma_pagamento text,
    observacao text,
    lancado_por_nome text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    financial_entry_id uuid,
    ativo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.payments OWNER TO nautilus_user;

--
-- Name: proposal_acceptances; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.proposal_acceptances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proposta_id uuid NOT NULL,
    meio text DEFAULT 'outro'::text NOT NULL,
    responsavel_nome text NOT NULL,
    data text,
    observacao text,
    usuario_id uuid,
    usuario_nome text,
    documento_url text,
    documento_nome text,
    origem text DEFAULT 'normal'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.proposal_acceptances OWNER TO nautilus_user;

--
-- Name: proposal_deliveries; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.proposal_deliveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proposta_id uuid NOT NULL,
    canal text NOT NULL,
    destinatario text,
    status text DEFAULT 'enviado'::text,
    erro text,
    usuario_id uuid,
    usuario_nome text,
    data timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.proposal_deliveries OWNER TO nautilus_user;

--
-- Name: proposals; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero text NOT NULL,
    data_emissao text,
    validade_dias integer,
    embarcacao_id uuid,
    embarcacao_nome text,
    cliente_nome text,
    destinatario text,
    assunto text,
    prazo_entrega_dias integer,
    condicoes_pagamento text,
    status text DEFAULT 'rascunho'::text NOT NULL,
    itens jsonb DEFAULT '[]'::jsonb,
    valor_total numeric(12,2) DEFAULT '0'::numeric,
    observacoes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    ano integer,
    elaborado_por text,
    aceite_data text,
    aceite_assinatura_nome text,
    cliente_id uuid,
    os_id uuid,
    embarcacoes_ids jsonb DEFAULT '[]'::jsonb,
    renovacao_de_id uuid,
    valor_desconto numeric(12,2) DEFAULT '0'::numeric
);


ALTER TABLE public.proposals OWNER TO nautilus_user;

--
-- Name: protocol_attachments; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.protocol_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocolo_id uuid NOT NULL,
    resposta_id uuid,
    tipo text DEFAULT 'comprovante'::text NOT NULL,
    arquivo_url text NOT NULL,
    arquivo_nome text NOT NULL,
    tipo_mime text,
    tamanho integer DEFAULT 0,
    enviado_por_id uuid,
    enviado_por_nome text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.protocol_attachments OWNER TO nautilus_user;

--
-- Name: protocol_dispatch_documents; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.protocol_dispatch_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    remessa_id uuid NOT NULL,
    documento_id uuid NOT NULL,
    versao_id uuid NOT NULL,
    versao integer NOT NULL,
    titulo_documento text NOT NULL,
    resultado text DEFAULT 'aguardando_analise'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.protocol_dispatch_documents OWNER TO nautilus_user;

--
-- Name: protocol_dispatches; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.protocol_dispatches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocolo_id uuid NOT NULL,
    ciclo integer DEFAULT 0 NOT NULL,
    tipo text DEFAULT 'inicial'::text NOT NULL,
    data_envio text NOT NULL,
    referencia_externa text,
    canal text,
    destinatario text,
    observacao text,
    enviado_por_id uuid,
    enviado_por_nome text,
    created_at timestamp without time zone DEFAULT now(),
    situacao text DEFAULT 'rascunho'::text NOT NULL,
    comprovante_url text,
    comprovante_nome text,
    email_destinatario text,
    email_message_id text,
    enviado_em timestamp without time zone
);


ALTER TABLE public.protocol_dispatches OWNER TO nautilus_user;

--
-- Name: protocol_events; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.protocol_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocolo_id uuid NOT NULL,
    tipo text NOT NULL,
    descricao text NOT NULL,
    dados jsonb DEFAULT '{}'::jsonb,
    autor_id uuid,
    autor_nome text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.protocol_events OWNER TO nautilus_user;

--
-- Name: protocol_response_documents; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.protocol_response_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resposta_id uuid NOT NULL,
    documento_id uuid NOT NULL,
    resultado text NOT NULL,
    observacao text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.protocol_response_documents OWNER TO nautilus_user;

--
-- Name: protocol_responses; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.protocol_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocolo_id uuid NOT NULL,
    remessa_id uuid NOT NULL,
    tipo text NOT NULL,
    data text NOT NULL,
    motivo text,
    registrado_por_id uuid,
    registrado_por_nome text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.protocol_responses OWNER TO nautilus_user;

--
-- Name: protocols; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.protocols (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_protocolo text NOT NULL,
    data_envio text,
    embarcacao_id uuid,
    embarcacao_nome text,
    cliente_nome text,
    destinatario text,
    orgao_ou_empresa text,
    tipo_protocolo text,
    responsavel_envio_nome text,
    status text DEFAULT 'em_trânsito'::text NOT NULL,
    codigo_rastreio text,
    comprovante_url text,
    comprovante_nome text,
    documentos_incluidos jsonb DEFAULT '[]'::jsonb,
    observacoes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    os_id uuid,
    canal text,
    ciclo_atual integer DEFAULT 0 NOT NULL,
    requer_conciliacao boolean DEFAULT false NOT NULL
);


ALTER TABLE public.protocols OWNER TO nautilus_user;

--
-- Name: receipts; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero text NOT NULL,
    data_emissao text,
    emissor_nome text,
    payment_id uuid,
    conta_receber_id uuid,
    status text DEFAULT 'ativo'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.receipts OWNER TO nautilus_user;

--
-- Name: schedules; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    os_id uuid NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    data text,
    horario text,
    local text,
    contato text,
    observacoes text,
    tecnico_responsavel_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.schedules OWNER TO nautilus_user;

--
-- Name: service_order_item_comments; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.service_order_item_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    os_id uuid NOT NULL,
    autor_id uuid,
    autor_nome text NOT NULL,
    texto text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.service_order_item_comments OWNER TO nautilus_user;

--
-- Name: service_order_items; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.service_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    os_id uuid NOT NULL,
    descricao text NOT NULL,
    quantidade integer DEFAULT 1,
    valor_unitario numeric(12,2) DEFAULT '0'::numeric,
    tipo text DEFAULT 'outro'::text,
    status text DEFAULT 'pendente'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tecnico_responsavel_id uuid,
    relatorio_url text,
    relatorio_nome text,
    data_agendada text,
    horario_agendado text,
    local_agendado text,
    contato_agendamento text,
    observacoes_agendamento text
);


ALTER TABLE public.service_order_items OWNER TO nautilus_user;

--
-- Name: service_orders; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.service_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero text NOT NULL,
    proposta_id uuid,
    embarcacao_id uuid,
    cliente_id uuid,
    status text DEFAULT 'aguardando_agendamento'::text NOT NULL,
    responsavel_tecnico_id uuid,
    data_aceite text,
    data_conclusao text,
    observacoes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.service_orders OWNER TO nautilus_user;

--
-- Name: services; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    valor_padrao numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.services OWNER TO nautilus_user;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    embarcacao_id uuid,
    titulo text NOT NULL,
    tipo text NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    responsavel_nome text,
    data_criacao text,
    prazo_vencimento text,
    anexos jsonb DEFAULT '[]'::jsonb,
    protocolo_gerado boolean DEFAULT false,
    data_conclusao text,
    arquivos_recebidos jsonb DEFAULT '[]'::jsonb,
    historico_notas jsonb DEFAULT '[]'::jsonb,
    observacoes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    responsavel_id uuid,
    responsavel_cargo text,
    embarcacao_nome text,
    cliente_nome text,
    certificadora text,
    prazo text,
    arquivo_nome text,
    arquivo_url text,
    atualizado_em text,
    os_id uuid,
    legacy boolean DEFAULT false
);


ALTER TABLE public.tasks OWNER TO nautilus_user;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.user_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO nautilus_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'tecnico'::text NOT NULL,
    senha text NOT NULL,
    avatar_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    cargo text,
    ativo boolean DEFAULT true NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb,
    legacy boolean DEFAULT false,
    password_reset_expires_at timestamp without time zone,
    theme_preference text DEFAULT 'classic'::text NOT NULL
);


ALTER TABLE public.users OWNER TO nautilus_user;

--
-- Name: vessels; Type: TABLE; Schema: public; Owner: nautilus_user
--

CREATE TABLE public.vessels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    tipo text NOT NULL,
    cliente_id uuid,
    cliente_nome text,
    telefone_contato text,
    email_contato text,
    responsavel_tecnico text,
    status text DEFAULT 'aberta'::text NOT NULL,
    etapa_atual text,
    prazo_renovacao text,
    valor_total numeric(12,2) DEFAULT '0'::numeric,
    valor_recebido numeric(12,2) DEFAULT '0'::numeric,
    arquivos_associados jsonb DEFAULT '[]'::jsonb,
    progresso integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    registro text,
    certificadora_principal text,
    valor_sinal numeric(12,2) DEFAULT '0'::numeric,
    descricao text,
    certificadora_id uuid,
    comprimento numeric(10,2),
    boca numeric(10,2),
    pontal numeric(10,2)
);


ALTER TABLE public.vessels OWNER TO nautilus_user;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: nautilus_user
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: nautilus_user
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	1a548eaaead30f5651ad740b5807978018537b56aec3d35e1d452c95a69ce113	1785870027454
2	e8bcc39960683a122aeefcfe89f823d14704b4364a2632c2a17bf85fd3edc32f	1785871000000
3	bbaa65b6ecf69b11623c6d9ebf0259dc6440ad098c297476cd76cceb985a4142	1785872000000
4	1733db71857d6e63d65774377ecd7dcf026b64501aee7544f29ea2d60be38ea8	1785873000000
5	3802994b46f868ac9fe9504479b9d6c7f88e4ec9301b2eac5b456c1d75a774bc	1785874000000
6	d171e6b2463a7a520c00b66ef685e443d151a2b37d33d4a8ee0cc03bd7973eb9	1785875000000
7	34c0b930cfcb02bb560720688682d67ddec46169865a14936b63bc396bdfc005	1785876000000
8	3f3c9fd878abd63062d38e4ce8cf75d192918693877a33bc6be4e7ba6a4219eb	1785877000000
9	69b1cd53670c7a61db116c2c620cdabc140d7f091682f0015e021a326d6ef196	1785878000000
10	965561adf392801dd1747d496518d8342d7dd4488b97129b8a8c2f15f4b08391	1785879000000
11	6f8c8d92f1be377d61d0bb3b9f456ff0d39e93c419e88b387e116d0814c4fc43	1785880000000
12	b5329edaa58aaba38775ec81dba8a8b995e0e5936eaa8f48f28b2d2c0c50c326	1785881000000
13	2654dc9fda12b626f9f4671800926af93b3fa852cb8d41ec5c6c083b2eb8bca8	1785882000000
14	5d6fd18b371051e74841a4a0f06e7b0d8fdfbc20d7c2128d85bfd3bee8534a9d	1785883000000
15	7eaed2340e1c5f07e14e9d163a68452897b562b50f0d7df0d51618cd5738626b	1785884000000
16	ef6e263695e5d83a6cc753097dd62b1c1a3ae20679e3a03e3c518bbb416e8476	1785885000000
17	771e39f2f523044e614ee6773f8e50db4bec253e753af6b269c4451a502cc126	1785886000000
50	da69855a86f7b4dde99b0da55e46b213a04a1cd8dfb28088b667f0953d8b9ff4	1785887000000
51	a727e770026dc78c940618beaa53b0b47b8e01fdc2e3d87300fcfc4c5e7020f8	1785888000000
52	dffdc9153a5057588ccba3e2aac23e000b2ffb9e8a15c25af1198ff616801c41	1785889000000
53	67219dedabe0c84a1aadc886c22e7ab428a0ff4daa050af487164edf3467223a	1785890000000
54	4289b2b0592c037e34935fa1de027601b24fd99f6a36ebb39dc277b69e47aefb	1785891000000
55	0451e0fc352fb70f49a54bed404d308accd1d43d524f1ed3f4d7b50e3cefb3a3	1785892000000
56	064aec9f606a99dbfe559dcbc524be3949083889b3cb2edd29b6d9902125efae	1785893000000
57	a6e52ea8ae71332c7728e41d31c2454212022494a741ec5a7d0f908fdd67af29	1787655600000
58	a5f3e46cb6a50f0e76c7f13cdf0d00313629d8edd593eabe5d4356ffae8b303a	1787659200000
59	40d084c6d2376ec36e75d9a041fc58659f303b0431c35a65edb0e2457ef054e8	1787662800000
60	dd8ff2707697996c81dc2d33a6417d0811691bc2e8ed31388eed2bec39e9748c	1787666400000
61	f16d86298f3375bfeb28b8c666630a2d6029210453bdc11918879969bd6b4cb3	1787752800000
62	780ad2b3fc860870776f5dbf9ea1c7f73eb59af1774bd0761573f66b80590b82	1787756400000
63	e576e1165107b605324953a495d69b8b6806dea05d6185405d05b8e097d33a47	1787760000000
64	25b7643b2d8a2f1c612618ecd489949822a75cd7f0d5614f7da22774f9fb988e	1787763600000
65	91c7ed62adce7071d8b7b5c43fb3e6b7be01d9417f744c57e134510b1295365f	1787767200000
66	a92a48513402566b488f604d8337b51efce528314b73b38cde834b8e4eb87a9f	1787770800000
67	caf5723994ebffdb066e307eb3a7018c019396a099f8da48846de5de76d87842	1787774400000
68	7a230bc0f64f241884e33614ddc92a508e0d21dcd29b8c5c171036f8a907a122	1787778000000
69	54fec675c282cb5c9a5f433212ccfcc826a7c9a20e3d157960b89b434ffbc258	1787781600000
70	68e5ec6ae891c619f2f37ca9615b0dfbc833f225b8b13e682a9d799de269fcbe	1787785200000
\.


--
-- Data for Name: accounts_payable; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.accounts_payable (id, fornecedor_id, categoria_id, embarcacao_id, descricao, valor_original, vencimento, competencia, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: accounts_receivable; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.accounts_receivable (id, proposta_id, os_id, embarcacao_id, cliente_id, valor_original, status, created_at, updated_at, compromisso_id) FROM stdin;
f2ff15be-549f-490a-9d02-187b410d6747	c93f712a-161b-4408-ae4f-756ee47d1920	5b5de817-d18a-4b31-9224-fc76aedd6a06	7a9530b7-5fbb-4ef7-a2ca-23ac9bcbb683	\N	800.00	pago	2026-08-27 05:15:55.164078	2026-08-27 07:20:15.942	\N
\.


--
-- Data for Name: app_configs; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.app_configs (id, data, updated_at) FROM stdin;
signature	{"ativo": true, "imagemUrl": "data:image/png;base64,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", "aplicarRecibos": true, "creaOrRegistro": "CREA - 4532563", "nomeSignatario": "Osvaldo", "cargoSignatario": "Engenheiro Naval", "aplicarPropostas": true, "aplicarProtocolos": true}	2026-08-19 22:52:19.507
logo	{"ativo": true, "imagemUrl": "/logo.svg", "subtitulo": "ENGENHARIA NAVAL", "nomeEmpresa": "NAUTILUS"}	2026-08-25 21:35:57.887692
email	{"ativo": false, "senha": "", "usuario": "b157d8001@smtp-brevo.com", "smtpHost": "smtp-relay.brevo.com", "smtpPort": 587, "usarTlsSsl": true, "nomeRemetente": "Nautilus", "emailRemetente": "b157d8001@smtp-brevo.com", "envioAutomaticoRecibos": false, "envioAutomaticoPropostas": false, "envioAutomaticoProtocolos": false}	2026-08-27 20:56:12.929
\.


--
-- Data for Name: approved_document_files; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.approved_document_files (id, protocolo_id, resposta_id, documento_id, versao_id, arquivo_url, arquivo_nome, tipo_mime, tamanho, enviado_por_id, enviado_por_nome, created_at) FROM stdin;
eaba2ac7-1583-4e67-bb71-bfe01446d5c1	28dca0d9-4db2-4f7c-a436-0156abae6f40	\N	dfcfef72-9c6f-45e0-b291-3a6d94fc0a77	3ad4c3de-e6f4-49e5-9818-86a26adb2d28	/api/upload/files/1787813039578-170209430-Proposta_DS_051-26_Balsa_Auditoria_1787205376963.pdf	Proposta_DS 051-26_Balsa_Auditoria_1787205376963.pdf	application/pdf	259261	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 06:43:59.592079
71f9a3f8-9a5b-4579-84b9-6fa7a3d5c2a4	28dca0d9-4db2-4f7c-a436-0156abae6f40	\N	dfcfef72-9c6f-45e0-b291-3a6d94fc0a77	3ad4c3de-e6f4-49e5-9818-86a26adb2d28	/api/upload/files/1787845718475-222109183-relatorio_financeiro-1.pdf	relatorio_financeiro-1.pdf	application/pdf	15695	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 15:48:38.492917
\.


--
-- Data for Name: certifiers; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.certifiers (id, nome, codigo_registro, telefone_contato, email, ativo, created_at, updated_at, portal_url, setor_destinatario, endereco, canal_preferencial, instrucoes_protocolo) FROM stdin;
29b7510c-3758-4760-ae47-6d432b9918fa	Certificadora Naval Brasil (TESTE)	CNB-TEST-001	(11) 3333-4400	contato@certificadora-teste.example	t	2026-08-19 20:11:56.699	2026-08-19 20:11:56.699	\N	\N	\N	\N	\N
749ee7db-1b94-4e92-ac1c-9801f208c770	Certificadora Auditoria 1787205286533	CERT-001	\N	cert@teste.com	t	2026-08-20 05:54:46.677	2026-08-20 05:54:46.677	\N	\N	\N	\N	\N
6864952c-1864-46da-bebb-fd7a6db947f0	Certificadora Auditoria 1787205376963	CERT-001	\N	cert@teste.com	t	2026-08-20 05:56:17.102	2026-08-20 05:56:17.102	\N	\N	\N	\N	\N
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.clients (id, nome, email, telefone, cnpj_cpf, endereco, created_at, updated_at, whatsapp) FROM stdin;
ab13d1d4-c1b8-4de9-beee-c41a59d14d36	Cliente Teste A — Marina Horizonte	ana.horizonte@example.com	(11) 98888-1001	52998224725	Av. das Docas, 100 — Santos/SP	2026-08-19 20:11:56.699	2026-08-19 20:11:56.699	(11) 98888-1001
df141e03-5b8f-47a5-9ed2-97e40bf1f5af	Cliente Teste B — Navega Sul	bruno.navega@example.com	(21) 97777-2002	11222333000181	Rua do Porto, 250 — Niterói/RJ	2026-08-19 20:11:56.699	2026-08-19 20:11:56.699	(21) 97777-2002
fb4f353d-5c95-4bde-99d2-45d11e6cfbb0	Cliente E2E Teste 1787200150702	teste@e2e.com	\N	\N	\N	2026-08-20 04:29:10.712	2026-08-20 04:29:10.712	\N
\.


--
-- Data for Name: commitment_attachments; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.commitment_attachments (id, compromisso_id, nome_original, nome_fisico, url, tipo_mime, tamanho, autor_id, created_at) FROM stdin;
\.


--
-- Data for Name: commitments; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.commitments (id, titulo, embarcacao_id, responsavel_id, vencimento, observacoes, prioridade, status, criado_por_id, created_at, updated_at, destinatarios) FROM stdin;
\.


--
-- Data for Name: critical_pendings; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.critical_pendings (id, tipo, titulo, embarcacao_nome, detalhe, urgencia, data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.deliveries (id, os_id, status, data_entrega, meio_entrega, nome_recebedor, comprovante_url, comprovante_nome, entregue_por_id, created_at, updated_at, data_impressao, impresso_por_id, responsavel_id, iniciada_em, concluida_em, motivo_reabertura) FROM stdin;
584db035-d475-49a6-a499-82489377bb6e	5b5de817-d18a-4b31-9224-fc76aedd6a06	concluida	2026-08-27	presencial	douglas	/api/upload/files/1787846693924-734954801-Protocolo_PROT-083-26.pdf	Protocolo_PROT-083-26.pdf	0c653743-7a70-49e9-a337-87b64eac33eb	2026-08-27 06:43:59.592079	2026-08-27 20:20:32.321	\N	\N	0c653743-7a70-49e9-a337-87b64eac33eb	2026-08-27 07:48:49.434	2026-08-27 16:04:53.955	Documento suplementar anexado: relatorio_financeiro-1.pdf
\.


--
-- Data for Name: delivery_dispatch_documents; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.delivery_dispatch_documents (id, remessa_entrega_id, arquivo_aprovado_id, created_at) FROM stdin;
0b799a4e-2547-4939-94c5-c5c9177b3838	1f8ddd3f-2837-480b-9cf5-5bbe7538f809	eaba2ac7-1583-4e67-bb71-bfe01446d5c1	2026-08-27 07:48:49.447254
d4cb8e14-6b2b-4be7-b795-b957af952d99	b05c215b-045e-4e9d-8cc9-2372d2822b67	71f9a3f8-9a5b-4579-84b9-6fa7a3d5c2a4	2026-08-27 16:04:53.950989
\.


--
-- Data for Name: delivery_dispatches; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.delivery_dispatches (id, delivery_id, tipo, status, data_entrega, meio_entrega, nome_recebedor, destino, referencia, comprovante_url, comprovante_nome, entregue_por_id, entregue_por_nome, created_at) FROM stdin;
1f8ddd3f-2837-480b-9cf5-5bbe7538f809	584db035-d475-49a6-a499-82489377bb6e	final	entregue	2026-08-27	presencial	douglas	casa	\N	/api/upload/files/1787816929418-357044824-Protocolo_PROT-083-26.pdf	Protocolo_PROT-083-26.pdf	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	2026-08-27 07:48:49.447254
b05c215b-045e-4e9d-8cc9-2372d2822b67	584db035-d475-49a6-a499-82489377bb6e	final	entregue	2026-08-27	presencial	douglas	casa	53467457	/api/upload/files/1787846693924-734954801-Protocolo_PROT-083-26.pdf	Protocolo_PROT-083-26.pdf	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	2026-08-27 16:04:53.950989
\.


--
-- Data for Name: document_library_audit; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.document_library_audit (id, file_id, folder_id, actor_id, action, details, created_at) FROM stdin;
\.


--
-- Data for Name: document_library_files; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.document_library_files (id, owner_user_id, folder_id, original_name, stored_name, mime_type, size, uploaded_by_id, uploaded_at, trashed_at, trashed_by_id) FROM stdin;
\.


--
-- Data for Name: document_library_folders; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.document_library_folders (id, owner_user_id, parent_id, name, created_by_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: document_versions; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.document_versions (id, documento_id, versao, arquivo_nome_fisico, arquivo_nome_original, tamanho, tipo_mime, autor_id, autor_nome, data, comentario, origem, situacao_revisao, situacao_aprovacao, aprovado_por_id, aprovado_em, created_at, updated_at, pdf_url) FROM stdin;
3ad4c3de-e6f4-49e5-9818-86a26adb2d28	dfcfef72-9c6f-45e0-b291-3a6d94fc0a77	1	1787811926484-166735553-Recibo_DS_051-26-2.pdf	Recibo_DS 051-26-2.pdf	248600	application/pdf	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	2026-08-27	ok	correcao_interna	revisado	aprovado	52acd935-18e8-4e7c-8fca-cf5a038d2087	2026-08-27	2026-08-27 06:25:26.512478	2026-08-27 06:27:36.035	\N
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.documents (id, os_id, titulo, tipo, status, versao_atual, created_at, updated_at, aplicavel_analise_externa) FROM stdin;
dfcfef72-9c6f-45e0-b291-3a6d94fc0a77	5b5de817-d18a-4b31-9224-fc76aedd6a06	Anotação de Responsabilidade Técnica (ART) - CREA/PA	art	aprovado	1	2026-08-27 05:15:55.164078	2026-08-27 06:42:34.676	t
\.


--
-- Data for Name: external_responses; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.external_responses (id, submissao_id, tipo, data, motivo, anexo_url, anexo_nome, versao_aprovada, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: external_submissions; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.external_submissions (id, os_id, documento_id, versao_enviada, orgao_ou_certificadora, data_envio, protocolo, observacao, responsavel_envio_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: financial_attachments; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.financial_attachments (id, transaction_id, file_url, file_name, file_size, mime_type, document_type, document_number, series, uploaded_by, uploaded_by_name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: financial_categories; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.financial_categories (id, nome, natureza, ativo, created_at, updated_at) FROM stdin;
5ee77fbf-c6ad-4846-9f48-b44337eb50ac	Administrativo	despesa	t	2026-08-20 01:04:00.401	2026-08-20 01:04:00.401
444a0fb7-9031-47b1-bae1-85b20259207c	Pessoal	despesa	t	2026-08-20 01:04:00.401	2026-08-20 01:04:00.401
b14bab17-7b56-4417-8ca1-c67546e1a3d0	Taxas e impostos	despesa	t	2026-08-20 01:04:00.401	2026-08-20 01:04:00.401
d5c30833-cbc2-434a-b560-017c6fb07445	Certificadora	despesa	t	2026-08-20 01:04:00.401	2026-08-20 01:04:00.401
3bb10153-581c-4e12-9ea6-1db65661392b	Viagem e deslocamento	despesa	t	2026-08-20 01:04:00.401	2026-08-20 01:04:00.401
8748b36c-e614-4d66-90f0-6464704c2448	Materiais	despesa	t	2026-08-20 01:04:00.401	2026-08-20 01:04:00.401
93ec8f3e-2fae-4d44-94b7-8701857ffde4	Outros	despesa	t	2026-08-20 01:04:00.401	2026-08-20 01:04:00.401
\.


--
-- Data for Name: financial_entries; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.financial_entries (id, embarcacao_id, embarcacao_nome, cliente_nome, data, valor, tipo, forma_pagamento, observacao, lancado_por_nome, nota_fiscal_numero, nota_fiscal_nome, nota_fiscal_url, recibo_numero, comprovante_despesa_url, created_at, updated_at, proposta_id, os_id, conta_receber_id, issuer_id, nf_series, is_storno, storno_reason, original_payment_id, notification_sent, conta_pagar_id, categoria_id, fornecedor_id, natureza, competencia, vencimento, situacao_conciliacao) FROM stdin;
af61f152-dd4b-4f98-94bc-c63dd32296f5	7a9530b7-5fbb-4ef7-a2ca-23ac9bcbb683	Balsa Auditoria 1787205376963	Cliente Teste B — Navega Sul	2026-08-27	400.00	parcela	PIX	Pagamento registrado no aceite da proposta DS 051/26	Osvaldo	\N	\N	\N	\N	\N	2026-08-27 05:15:55.164078	2026-08-27 05:15:55.164078	c93f712a-161b-4408-ae4f-756ee47d1920	5b5de817-d18a-4b31-9224-fc76aedd6a06	f2ff15be-549f-490a-9d02-187b410d6747	\N	\N	f	\N	\N	f	\N	\N	\N	entrada	\N	\N	conciliado
9bd4ad52-a048-44ea-bbba-1e2d8e937764	7a9530b7-5fbb-4ef7-a2ca-23ac9bcbb683	Balsa Auditoria 1787205376963	Cliente Teste B — Navega Sul	2026-08-27	400.00	parcela	PIX	Pagamento Balsa Auditoria 1787205376963	Osvaldo	\N	\N	\N	\N	\N	2026-08-27 07:20:15.921269	2026-08-27 07:20:15.921269	c93f712a-161b-4408-ae4f-756ee47d1920	5b5de817-d18a-4b31-9224-fc76aedd6a06	f2ff15be-549f-490a-9d02-187b410d6747	\N	\N	f	\N	\N	f	\N	\N	\N	entrada	\N	\N	conciliado
\.


--
-- Data for Name: financial_status_history; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.financial_status_history (id, embarcacao_id, os_id, previous_status, new_status, previous_value, new_value, total_value, percentage, triggered_by, triggered_by_name, entry_id, observation, created_at) FROM stdin;
\.


--
-- Data for Name: financial_suppliers; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.financial_suppliers (id, nome, documento, email, telefone, observacoes, ativo, created_at, updated_at) FROM stdin;
d8979d4a-dffd-4faf-838b-5bc8e91f97ca	Fornecedor teste	\N	\N	\N	\N	t	2026-08-20 01:06:51.095	2026-08-20 01:06:51.095
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.notifications (id, usuario_id, tipo, titulo, mensagem, lida, os_id, created_at, prioridade, compromisso_id) FROM stdin;
c3e1802a-c2f9-478c-8ae6-36a3a26734ba	0c653743-7a70-49e9-a337-87b64eac33eb	agendamento_servico	Serviço agendado	Osvaldo agendou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para 28/08/2026 às 10:00.	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 05:19:48.143081	alta	\N
f7918377-2728-4b16-ad01-e01e659bcd67	52acd935-18e8-4e7c-8fca-cf5a038d2087	agendamento_servico	Serviço agendado	Osvaldo agendou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para 28/08/2026 às 10:00.	t	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 05:19:48.142927	alta	\N
83e1af47-0d17-48a9-8d7f-b030890d4de9	5ac63994-20e5-4e14-8705-c0899ab7d708	agendamento_servico	Serviço agendado	Osvaldo agendou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para 28/08/2026 às 10:00.	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 05:19:48.143009	alta	\N
26d0598c-09b5-4214-ae53-424a687e2f39	5ac63994-20e5-4e14-8705-c0899ab7d708	servico_em_execucao	Serviço iniciado	Lucas alterou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para em execução.	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:02:53.988831	alta	\N
7dd9c506-47a4-4075-b105-3a9a43b48206	0c653743-7a70-49e9-a337-87b64eac33eb	servico_em_execucao	Serviço iniciado	Lucas alterou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para em execução.	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:02:53.988909	alta	\N
9e468f1a-b690-486c-bca9-ab53affac117	5ac63994-20e5-4e14-8705-c0899ab7d708	observacao_servico	Nova observação no serviço	Lucas comentou em "Anotação de Responsabilidade Técnica (ART) - CREA/PA": llllkkkk	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:13:33.319673	normal	\N
0a3be8e6-e4b4-4a9d-89fb-358201e7bd13	0c653743-7a70-49e9-a337-87b64eac33eb	observacao_servico	Nova observação no serviço	Lucas comentou em "Anotação de Responsabilidade Técnica (ART) - CREA/PA": llllkkkk	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:13:33.319742	normal	\N
c32e4f96-8b63-4a20-9677-b18e4950d888	5ac63994-20e5-4e14-8705-c0899ab7d708	documento_anexado	Novo documento anexado	Lucas anexou a versão V1 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:25:26.532081	alta	\N
b06a38d2-a7b2-48bd-89af-1c9a04e4685c	0c653743-7a70-49e9-a337-87b64eac33eb	documento_anexado	Novo documento anexado	Lucas anexou a versão V1 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:25:26.53218	alta	\N
836cabe7-aba4-4125-8d45-ba85749cedc9	5ac63994-20e5-4e14-8705-c0899ab7d708	servico_concluido	Serviço concluído	Lucas alterou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para concluído.	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:25:42.518777	alta	\N
3f7f1234-a700-49de-a9e3-8be4bca1c209	0c653743-7a70-49e9-a337-87b64eac33eb	servico_concluido	Serviço concluído	Lucas alterou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para concluído.	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:25:42.51889	alta	\N
9e0669cf-c196-4b8d-8e44-f66fb3ea4b32	5ac63994-20e5-4e14-8705-c0899ab7d708	os_itens_concluidos	Serviços concluídos	Todos os itens da OS foram concluídos. A OS avançou para Documentação em Elaboração.	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:25:42.530361	alta	\N
bdd60881-690d-4f2f-add4-4abe8f4b7b54	5ac63994-20e5-4e14-8705-c0899ab7d708	revisao_aprovada	Documento revisado com sucesso	Osvaldo revisou e aprovou internamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:27:10.701065	normal	\N
e49874da-008e-401f-a8f9-ae522369f6f3	0c653743-7a70-49e9-a337-87b64eac33eb	revisao_aprovada	Documento revisado com sucesso	Osvaldo revisou e aprovou internamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:27:10.70115	normal	\N
bac2a2a3-c397-428d-aaab-2f687fd68bdc	5ac63994-20e5-4e14-8705-c0899ab7d708	aprovacao	Documento aprovado tecnicamente	Osvaldo aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:27:36.04346	alta	\N
53917ecd-0d30-4efd-aaae-0f621d005f58	0c653743-7a70-49e9-a337-87b64eac33eb	entrega_atribuida	Nova entrega atribuída	Os documentos finais da OS OS 051/26 estão prontos para entrega.	t	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:43:59.592079	alta	\N
bcf43d31-e848-4779-9b78-cf6f07446066	52acd935-18e8-4e7c-8fca-cf5a038d2087	aprovacao	Documento aprovado tecnicamente	Osvaldo aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	t	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:27:36.043312	alta	\N
b268d620-0e1c-4418-9748-b25804281262	52acd935-18e8-4e7c-8fca-cf5a038d2087	revisao_aprovada	Documento revisado com sucesso	Osvaldo revisou e aprovou internamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	t	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:27:10.700973	normal	\N
d78fa294-86de-480b-a361-b659630f68ec	52acd935-18e8-4e7c-8fca-cf5a038d2087	os_itens_concluidos	Serviços concluídos	Todos os itens da OS foram concluídos. A OS avançou para Documentação em Elaboração.	t	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:25:42.529317	alta	\N
f12091e6-03e7-476e-8e28-1aa7ae0cbbf4	52acd935-18e8-4e7c-8fca-cf5a038d2087	servico_concluido	Serviço concluído	Lucas alterou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para concluído.	t	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:25:42.518696	alta	\N
641fe6c2-1d42-4e4a-badb-05d2b6bbaf56	52acd935-18e8-4e7c-8fca-cf5a038d2087	documento_anexado	Novo documento anexado	Lucas anexou a versão V1 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	t	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:25:26.531989	alta	\N
df17fc9c-cfcb-4681-add7-3bc21803873d	52acd935-18e8-4e7c-8fca-cf5a038d2087	observacao_servico	Nova observação no serviço	Lucas comentou em "Anotação de Responsabilidade Técnica (ART) - CREA/PA": llllkkkk	t	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:13:33.319591	normal	\N
14e1f86b-b16f-4038-a774-91732c7d856c	52acd935-18e8-4e7c-8fca-cf5a038d2087	servico_em_execucao	Serviço iniciado	Lucas alterou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para em execução.	t	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:02:53.988762	alta	\N
eca7ed5b-fbb0-4c69-b0aa-61517ca7281e	0c653743-7a70-49e9-a337-87b64eac33eb	entrega_atribuida	Nova entrega reaberta	Um documento suplementar da OS OS 051/26 foi disponibilizado para entrega.	t	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 15:48:38.492917	alta	\N
a50e8a3a-6958-4dee-b4fe-9efca35ab86c	0c653743-7a70-49e9-a337-87b64eac33eb	aprovacao	Documento aprovado tecnicamente	Osvaldo aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	t	5b5de817-d18a-4b31-9224-fc76aedd6a06	2026-08-27 06:27:36.043559	alta	\N
\.


--
-- Data for Name: os_events; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.os_events (id, os_id, tipo, autor_id, autor_nome, descricao, dados, created_at) FROM stdin;
8595dfe2-85e4-46dc-934a-e7b0abc05e8b	5b5de817-d18a-4b31-9224-fc76aedd6a06	criacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	Ordem de Serviço criada a partir do aceite da proposta DS 051/26.	{"meio": "presencial", "valorRecebido": 400, "situacaoFinanceira": "parcial"}	2026-08-27 05:15:55.164078
7fac0382-c67a-4a1d-9b59-dfc4247693b5	5b5de817-d18a-4b31-9224-fc76aedd6a06	agendamento_servico	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	Serviço "Anotação de Responsabilidade Técnica (ART) - CREA/PA" agendado para 2026-08-28 às 10:00.	{"itemId": "25f59379-9af6-4245-ac7f-29eba4cc3970"}	2026-08-27 05:19:48.139406
d02fca7a-37b6-4887-a2ad-3b7b08e9b290	5b5de817-d18a-4b31-9224-fc76aedd6a06	item_os	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	Item "Anotação de Responsabilidade Técnica (ART) - CREA/PA" atualizado para em_execucao.	{}	2026-08-27 06:02:53.983325
a9c3f57a-6de7-4e07-9331-035c8c76d752	5b5de817-d18a-4b31-9224-fc76aedd6a06	observacao_servico	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	Lucas adicionou uma observação em "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	{"itemId": "25f59379-9af6-4245-ac7f-29eba4cc3970", "commentId": "06b6c3af-baf1-4094-b0c4-0cbc5c7835b3"}	2026-08-27 06:13:33.315208
f3410279-230e-4d7b-b6f0-b50433798eab	5b5de817-d18a-4b31-9224-fc76aedd6a06	upload	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	Nova versão V1 anexada ao documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	{"origem": "correcao_interna", "versao": 1, "documentoId": "dfcfef72-9c6f-45e0-b291-3a6d94fc0a77"}	2026-08-27 06:25:26.517592
2ab650f1-16d4-413e-beb9-ad372edad1ba	5b5de817-d18a-4b31-9224-fc76aedd6a06	item_os	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	Item "Anotação de Responsabilidade Técnica (ART) - CREA/PA" atualizado para concluido.	{}	2026-08-27 06:25:42.514619
b017ae5e-2796-47aa-90f0-89d83b7493e0	5b5de817-d18a-4b31-9224-fc76aedd6a06	transicao_automatica	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	Todos os serviços concluídos. OS avançou automaticamente para Documentação em Elaboração.	{}	2026-08-27 06:25:42.527901
d38e516c-5cc8-43d9-ba1c-46245f748d3c	5b5de817-d18a-4b31-9224-fc76aedd6a06	revisao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	Revisão interna do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" concluída.	{"aprovado": true, "comentario": "", "documentoId": "dfcfef72-9c6f-45e0-b291-3a6d94fc0a77"}	2026-08-27 06:27:10.689289
5b1e9177-4064-45c5-b361-e9cb7a97377b	5b5de817-d18a-4b31-9224-fc76aedd6a06	aprovacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	Aprovação técnica do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	{"versao": 1, "documentoId": "dfcfef72-9c6f-45e0-b291-3a6d94fc0a77"}	2026-08-27 06:27:36.039762
ceedc39b-433e-490e-b024-2d57cf7a7f78	5b5de817-d18a-4b31-9224-fc76aedd6a06	resposta_externa	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	Documentos aprovados externamente.	{"respostaId": "42c45c10-9831-4d4b-a96a-d2ef5e3b5dec", "protocoloId": "28dca0d9-4db2-4f7c-a436-0156abae6f40"}	2026-08-27 06:42:34.666918
a391044c-0227-43c3-92cc-aecd6e9c12a2	5b5de817-d18a-4b31-9224-fc76aedd6a06	tarefa_entrega	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	Tarefa de entrega criada e atribuída a Lucas.	{}	2026-08-27 06:43:59.592079
3991d2e1-e730-411a-90ba-06baf79a644b	5b5de817-d18a-4b31-9224-fc76aedd6a06	entrega_iniciada	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	Lucas iniciou a tarefa de entrega.	{}	2026-08-27 07:48:49.432479
e3787a46-ad81-4801-9f47-7e91ceae8e97	5b5de817-d18a-4b31-9224-fc76aedd6a06	remessa_entrega	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	Entrega final registrada por presencial para douglas.	{"tipo": "final", "remessaId": "1f8ddd3f-2837-480b-9cf5-5bbe7538f809"}	2026-08-27 07:48:49.447254
74bfafb8-ee21-4fdf-ac13-5aee84cdbe9e	5b5de817-d18a-4b31-9224-fc76aedd6a06	validacao_final	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	Todos os requisitos foram atendidos. OS enviada para Validação Final.	{"bloqueios": []}	2026-08-27 07:48:49.447254
bd7e9f37-1f0b-4b61-9005-e9cb72e6d281	5b5de817-d18a-4b31-9224-fc76aedd6a06	entrega_reativada	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	Entrega reaberta após anexação do documento suplementar relatorio_financeiro-1.pdf.	{"arquivoId": "71f9a3f8-9a5b-4579-84b9-6fa7a3d5c2a4", "documentoId": "dfcfef72-9c6f-45e0-b291-3a6d94fc0a77"}	2026-08-27 15:48:38.492917
389333a7-2f9a-48f4-bfaf-db8a9fc20a93	5b5de817-d18a-4b31-9224-fc76aedd6a06	entrega_iniciada	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	Lucas iniciou a tarefa de entrega.	{}	2026-08-27 16:04:53.93825
a6b20890-9b89-494a-958c-bfafae6c242d	5b5de817-d18a-4b31-9224-fc76aedd6a06	remessa_entrega	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	Entrega final registrada por presencial para douglas.	{"tipo": "final", "remessaId": "b05c215b-045e-4e9d-8cc9-2372d2822b67"}	2026-08-27 16:04:53.950989
2f154b4d-3544-4228-88d8-b1ec92b4bbdf	5b5de817-d18a-4b31-9224-fc76aedd6a06	validacao_final	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	Todos os requisitos foram atendidos. OS enviada para Validação Final.	{"bloqueios": []}	2026-08-27 16:04:53.950989
c943646e-74b7-4db6-a261-46eb7c2dbadc	5b5de817-d18a-4b31-9224-fc76aedd6a06	conclusao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	Validação Final aprovada. Ordem de Serviço concluída.	{}	2026-08-27 20:20:32.309216
\.


--
-- Data for Name: os_finalization_reviews; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.os_finalization_reviews (id, os_id, decisao, observacao, administrador_id, administrador_nome, created_at) FROM stdin;
5494a135-ad0d-4e80-a4e4-c0f751d123bb	5b5de817-d18a-4b31-9224-fc76aedd6a06	aprovada	\N	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 20:20:32.309216
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.payments (id, conta_receber_id, proposta_id, os_id, embarcacao_id, valor, data, forma_pagamento, observacao, lancado_por_nome, created_at, updated_at, financial_entry_id, ativo) FROM stdin;
1711c5b8-c2d9-441b-b4b5-6e96ebe752c3	f2ff15be-549f-490a-9d02-187b410d6747	c93f712a-161b-4408-ae4f-756ee47d1920	5b5de817-d18a-4b31-9224-fc76aedd6a06	7a9530b7-5fbb-4ef7-a2ca-23ac9bcbb683	400.00	2026-08-27	PIX	Pagamento registrado no aceite da proposta DS 051/26	Osvaldo	2026-08-27 05:15:55.164078	2026-08-27 05:15:55.164078	af61f152-dd4b-4f98-94bc-c63dd32296f5	t
1a19ef8a-6f7e-4db8-9e4b-69a7c2d7d373	f2ff15be-549f-490a-9d02-187b410d6747	c93f712a-161b-4408-ae4f-756ee47d1920	5b5de817-d18a-4b31-9224-fc76aedd6a06	7a9530b7-5fbb-4ef7-a2ca-23ac9bcbb683	400.00	2026-08-27	PIX	Pagamento Balsa Auditoria 1787205376963	Osvaldo	2026-08-27 07:20:15.921269	2026-08-27 07:20:15.921269	9bd4ad52-a048-44ea-bbba-1e2d8e937764	t
\.


--
-- Data for Name: proposal_acceptances; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.proposal_acceptances (id, proposta_id, meio, responsavel_nome, data, observacao, usuario_id, usuario_nome, documento_url, documento_nome, origem, created_at, updated_at) FROM stdin;
12ab6a75-281a-4ea8-901b-da3ef4244fe0	c93f712a-161b-4408-ae4f-756ee47d1920	presencial	Cliente Teste B — Navega Sul	2026-08-28		52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	\N	\N	normal	2026-08-27 05:15:55.164078	2026-08-27 05:15:55.164078
\.


--
-- Data for Name: proposal_deliveries; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.proposal_deliveries (id, proposta_id, canal, destinatario, status, erro, usuario_id, usuario_nome, data, created_at, updated_at) FROM stdin;
24ccf86e-5b5e-4126-a640-82eddc6ac14e	63b6f026-89fa-4781-9d29-3e4263e4b6a4	email	ronokedas@gmail.com	enviado	\N	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 18:05:17.800419	2026-08-27 18:05:17.800419	2026-08-27 18:05:17.800419
\.


--
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.proposals (id, numero, data_emissao, validade_dias, embarcacao_id, embarcacao_nome, cliente_nome, destinatario, assunto, prazo_entrega_dias, condicoes_pagamento, status, itens, valor_total, observacoes, created_at, updated_at, ano, elaborado_por, aceite_data, aceite_assinatura_nome, cliente_id, os_id, embarcacoes_ids, renovacao_de_id, valor_desconto) FROM stdin;
c93f712a-161b-4408-ae4f-756ee47d1920	DS 051/26	27 de agosto de 2026	\N	7a9530b7-5fbb-4ef7-a2ca-23ac9bcbb683	Balsa Auditoria 1787205376963	Cliente Teste B — Navega Sul	Cliente Teste B — Navega Sul	Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação Balsa Auditoria 1787205376963.	10	Pagamento de 50% de sinal no aceite da proposta + 50% na entrega e homologação dos relatórios.	aprovado	[{"id": "6e5a6c9b-c4d1-44e2-ba96-77db78dc95f6-1787807657762", "descricao": "Anotação de Responsabilidade Técnica (ART) - CREA/PA", "serviceId": "6e5a6c9b-c4d1-44e2-ba96-77db78dc95f6", "quantidade": 1, "valorUnitario": 800}]	800.00	- Início do serviço após aceite formal e pagamento do sinal (cobre taxas de ART e despesas de escritório).\n- Despesas de transporte, alimentação e estadia ficam a cargo do armador, quando aplicável.\n- A embarcação deve estar com compartimentos limpos e secos para a realização dos serviços.\n- Cliente deve fornecer dados completos dos armadores e/ou proprietários.\n- Se o processo for paralisado por pendência do armador/proprietário, o pagamento das parcelas deve continuar até quitação total.\n- Proposta válida por 30 dias a contar da data de emissão.	2026-08-27 05:14:19.946208	2026-08-27 05:15:55.164	2026	Deisy Saldanha - Administrativo/Financeiro	2026-08-28	Cliente Teste B — Navega Sul	\N	5b5de817-d18a-4b31-9224-fc76aedd6a06	["7a9530b7-5fbb-4ef7-a2ca-23ac9bcbb683"]	\N	0.00
63b6f026-89fa-4781-9d29-3e4263e4b6a4	DS 052/26	27 de agosto de 2026	\N	2248edc3-a217-4eb8-b554-097b61d39505	VENTO SUL TESTE	Cliente Teste B — Navega Sul	Cliente Teste B — Navega Sul	Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação VENTO SUL TESTE.	10	Pagamento de 50% de sinal no aceite da proposta + 50% na entrega e homologação dos relatórios.	enviado	[{"id": "6af3f8d3-b0a0-4407-9fd0-a2208592f198-1787853891700", "descricao": "Certificado de homologação nas certificadoras", "serviceId": "6af3f8d3-b0a0-4407-9fd0-a2208592f198", "quantidade": 1, "valorUnitario": 3500}]	3500.00	- Início do serviço após aceite formal e pagamento do sinal (cobre taxas de ART e despesas de escritório).\n- Despesas de transporte, alimentação e estadia ficam a cargo do armador, quando aplicável.\n- A embarcação deve estar com compartimentos limpos e secos para a realização dos serviços.\n- Cliente deve fornecer dados completos dos armadores e/ou proprietários.\n- Se o processo for paralisado por pendência do armador/proprietário, o pagamento das parcelas deve continuar até quitação total.\n- Proposta válida por 30 dias a contar da data de emissão.	2026-08-27 18:04:56.580919	2026-08-27 18:04:56.580919	2026	Deisy Saldanha - Administrativo/Financeiro	\N	\N	\N	\N	["2248edc3-a217-4eb8-b554-097b61d39505"]	\N	0.00
53317ecb-779d-4425-ad1b-8b46d5975a47	DS 053/26	28 de agosto de 2026	\N	dd9d00a5-9ed4-4c25-a1d2-261d803bf06c	MAR AZUL TESTE	Cliente Teste A — Marina Horizonte	Cliente Teste A — Marina Horizonte	Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação MAR AZUL TESTE.	10	Pagamento de 50% de sinal no aceite da proposta + 50% na entrega e homologação dos relatórios.	enviado	[]	0.00	- Início do serviço após aceite formal e pagamento do sinal (cobre taxas de ART e despesas de escritório).\n- Despesas de transporte, alimentação e estadia ficam a cargo do armador, quando aplicável.\n- A embarcação deve estar com compartimentos limpos e secos para a realização dos serviços.\n- Cliente deve fornecer dados completos dos armadores e/ou proprietários.\n- Se o processo for paralisado por pendência do armador/proprietário, o pagamento das parcelas deve continuar até quitação total.\n- Proposta válida por 30 dias a contar da data de emissão.	2026-08-28 03:26:35.563546	2026-08-28 03:26:35.563546	2026	Deisy Saldanha - Administrativo/Financeiro	\N	\N	\N	\N	["dd9d00a5-9ed4-4c25-a1d2-261d803bf06c"]	\N	0.00
\.


--
-- Data for Name: protocol_attachments; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.protocol_attachments (id, protocolo_id, resposta_id, tipo, arquivo_url, arquivo_nome, tipo_mime, tamanho, enviado_por_id, enviado_por_nome, created_at) FROM stdin;
cc94cb92-3107-4c15-8452-908bef749beb	28dca0d9-4db2-4f7c-a436-0156abae6f40	42c45c10-9831-4d4b-a96a-d2ef5e3b5dec	resposta_externa	/api/upload/files/1787812954654-272982796-Recibo_DS_051-26-2.pdf	Recibo_DS 051-26-2.pdf	application/pdf	248600	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 06:42:34.666918
\.


--
-- Data for Name: protocol_dispatch_documents; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.protocol_dispatch_documents (id, remessa_id, documento_id, versao_id, versao, titulo_documento, resultado, created_at, updated_at) FROM stdin;
c124b4a5-c567-42bd-b205-f5d7e8ab554a	bb956049-aee5-4fac-a851-9654f246d06c	dfcfef72-9c6f-45e0-b291-3a6d94fc0a77	3ad4c3de-e6f4-49e5-9818-86a26adb2d28	1	Anotação de Responsabilidade Técnica (ART) - CREA/PA	aprovado	2026-08-27 06:28:45.305194	2026-08-27 06:42:34.675
\.


--
-- Data for Name: protocol_dispatches; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.protocol_dispatches (id, protocolo_id, ciclo, tipo, data_envio, referencia_externa, canal, destinatario, observacao, enviado_por_id, enviado_por_nome, created_at, situacao, comprovante_url, comprovante_nome, email_destinatario, email_message_id, enviado_em) FROM stdin;
bb956049-aee5-4fac-a851-9654f246d06c	28dca0d9-4db2-4f7c-a436-0156abae6f40	0	inicial	2026-08-27	53467457	presencial	Vendas		52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 06:28:45.305194	enviado_comprovado	/api/upload/files/1787812905911-257315847-Recibo_DS_053-26.pdf	Recibo_DS 053-26.pdf	\N	\N	2026-08-27 06:41:45.927
\.


--
-- Data for Name: protocol_events; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.protocol_events (id, protocolo_id, tipo, descricao, dados, autor_id, autor_nome, created_at) FROM stdin;
cd9ca70b-df63-4e7d-b38d-88debaf3cabd	28dca0d9-4db2-4f7c-a436-0156abae6f40	rascunho	Pacote preparado; aguardando envio comprovado.	{}	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 06:28:45.305194
7c5a7ceb-4f93-4cf9-8af3-18ac4dcd5a9d	28dca0d9-4db2-4f7c-a436-0156abae6f40	envio_comprovado	Envio por presencial comprovado; aguardando análise externa.	{}	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 06:41:45.924242
5c42e4d7-49be-4578-880a-7ed21fae6b8e	28dca0d9-4db2-4f7c-a436-0156abae6f40	aprovado	Documentos aprovados externamente.	{"documentosIds": ["dfcfef72-9c6f-45e0-b291-3a6d94fc0a77"]}	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 06:42:34.666918
f4ef93c1-dff5-4fa5-9b99-bdce309cb51b	28dca0d9-4db2-4f7c-a436-0156abae6f40	arquivo_final	Documento final aprovado anexado: Anotação de Responsabilidade Técnica (ART) - CREA/PA.	{"documentoId": "dfcfef72-9c6f-45e0-b291-3a6d94fc0a77"}	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 06:43:59.592079
d7cf5ded-3415-46f4-b88b-a22a15446a1b	28dca0d9-4db2-4f7c-a436-0156abae6f40	arquivo_final_suplementar	Documento final suplementar anexado e entrega reaberta: Anotação de Responsabilidade Técnica (ART) - CREA/PA.	{"arquivoId": "71f9a3f8-9a5b-4579-84b9-6fa7a3d5c2a4", "documentoId": "dfcfef72-9c6f-45e0-b291-3a6d94fc0a77"}	52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 15:48:38.492917
\.


--
-- Data for Name: protocol_response_documents; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.protocol_response_documents (id, resposta_id, documento_id, resultado, observacao, created_at) FROM stdin;
591a1d44-4111-4515-9c06-83b99ebae19e	42c45c10-9831-4d4b-a96a-d2ef5e3b5dec	dfcfef72-9c6f-45e0-b291-3a6d94fc0a77	aprovado		2026-08-27 06:42:34.666918
\.


--
-- Data for Name: protocol_responses; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.protocol_responses (id, protocolo_id, remessa_id, tipo, data, motivo, registrado_por_id, registrado_por_nome, created_at) FROM stdin;
42c45c10-9831-4d4b-a96a-d2ef5e3b5dec	28dca0d9-4db2-4f7c-a436-0156abae6f40	bb956049-aee5-4fac-a851-9654f246d06c	aprovado	2026-08-27		52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	2026-08-27 06:42:34.666918
\.


--
-- Data for Name: protocols; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.protocols (id, numero_protocolo, data_envio, embarcacao_id, embarcacao_nome, cliente_nome, destinatario, orgao_ou_empresa, tipo_protocolo, responsavel_envio_nome, status, codigo_rastreio, comprovante_url, comprovante_nome, documentos_incluidos, observacoes, created_at, updated_at, os_id, canal, ciclo_atual, requer_conciliacao) FROM stdin;
28dca0d9-4db2-4f7c-a436-0156abae6f40	PROT-083/26	2026-08-27	7a9530b7-5fbb-4ef7-a2ca-23ac9bcbb683	Balsa Auditoria 1787205376963	\N	Vendas	RBNA	certificadora	Osvaldo	aprovado	53467457	\N	\N	["Anotação de Responsabilidade Técnica (ART) - CREA/PA (V1)"]		2026-08-27 06:28:45.305194	2026-08-27 06:42:34.679	5b5de817-d18a-4b31-9224-fc76aedd6a06	presencial	0	f
\.


--
-- Data for Name: receipts; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.receipts (id, numero, data_emissao, emissor_nome, payment_id, conta_receber_id, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.schedules (id, os_id, status, data, horario, local, contato, observacoes, tecnico_responsavel_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: service_order_item_comments; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.service_order_item_comments (id, item_id, os_id, autor_id, autor_nome, texto, created_at) FROM stdin;
06b6c3af-baf1-4094-b0c4-0cbc5c7835b3	25f59379-9af6-4245-ac7f-29eba4cc3970	5b5de817-d18a-4b31-9224-fc76aedd6a06	0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	llllkkkk	2026-08-27 06:13:33.311822
\.


--
-- Data for Name: service_order_items; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.service_order_items (id, os_id, descricao, quantidade, valor_unitario, tipo, status, created_at, updated_at, tecnico_responsavel_id, relatorio_url, relatorio_nome, data_agendada, horario_agendado, local_agendado, contato_agendamento, observacoes_agendamento) FROM stdin;
25f59379-9af6-4245-ac7f-29eba4cc3970	5b5de817-d18a-4b31-9224-fc76aedd6a06	Anotação de Responsabilidade Técnica (ART) - CREA/PA	1	800.00	art	concluido	2026-08-27 05:15:55.164078	2026-08-27 06:25:42.512	0c653743-7a70-49e9-a337-87b64eac33eb	\N	\N	2026-08-28	10:00	belem	\N	\N
\.


--
-- Data for Name: service_orders; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.service_orders (id, numero, proposta_id, embarcacao_id, cliente_id, status, responsavel_tecnico_id, data_aceite, data_conclusao, observacoes, created_at, updated_at) FROM stdin;
5b5de817-d18a-4b31-9224-fc76aedd6a06	OS 051/26	c93f712a-161b-4408-ae4f-756ee47d1920	7a9530b7-5fbb-4ef7-a2ca-23ac9bcbb683	\N	concluida	\N	2026-08-28	2026-08-27	Criado a partir do aceite da proposta DS 051/26	2026-08-27 05:15:55.164078	2026-08-27 20:20:32.318
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.services (id, nome, valor_padrao, ativo, created_at, updated_at) FROM stdin;
6e5a6c9b-c4d1-44e2-ba96-77db78dc95f6	Anotação de Responsabilidade Técnica (ART) - CREA/PA	800.00	t	2026-08-19 21:33:08.912	2026-08-19 21:33:08.912
cffb1015-ac95-4fc9-80da-e11e2b786adf	Declaração de responsabilidade técnica	1200.00	t	2026-08-19 21:33:08.912	2026-08-19 21:33:08.912
8d08d8b6-42af-41bb-9fb1-3be3e50cf4e1	Relatório de medição de chapas por ultrassom NDT	8500.00	t	2026-08-19 21:33:08.912	2026-08-19 21:33:08.912
6af3f8d3-b0a0-4407-9fd0-a2208592f198	Certificado de homologação nas certificadoras	3500.00	t	2026-08-19 21:33:08.912	2026-08-19 21:33:08.912
46d8147d-2db8-4d93-a178-56db8e6d0de0	Croqui de sondagem	4500.00	t	2026-08-19 21:33:08.912	2026-08-19 21:33:08.912
4b4e05a6-5475-47ec-bb89-0c7f0a7646c5	tdggggg	340.44	t	2026-08-19 21:44:42.891	2026-08-19 21:44:42.891
a4e8a89d-e6b5-41f0-9ea0-cb5f6b73130f	Medição Ultrassom Auditoria 1787205286533	5000.00	t	2026-08-20 05:54:46.684	2026-08-20 05:54:46.684
92795c64-d4c7-4091-a338-54bdc926cf07	Medição Ultrassom Auditoria 1787205376963	5000.00	t	2026-08-20 05:56:17.11	2026-08-20 05:56:17.11
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.tasks (id, embarcacao_id, titulo, tipo, status, responsavel_nome, data_criacao, prazo_vencimento, anexos, protocolo_gerado, data_conclusao, arquivos_recebidos, historico_notas, observacoes, created_at, updated_at, responsavel_id, responsavel_cargo, embarcacao_nome, cliente_nome, certificadora, prazo, arquivo_nome, arquivo_url, atualizado_em, os_id, legacy) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.user_sessions (sid, sess, expire) FROM stdin;
pRX7yKsEdaheM0PrFNF8fqS6WVVa0671	{"cookie":{"originalMaxAge":86400000,"expires":"2026-08-27T18:17:45.124Z","secure":false,"httpOnly":true,"path":"/"},"userId":"52acd935-18e8-4e7c-8fca-cf5a038d2087","userRole":"admin"}	2026-08-28 18:17:44
a_mfp6UUQ5ClJjdqsRJH4v2PjLhCUclM	{"cookie":{"originalMaxAge":86400000,"expires":"2026-08-28T06:22:07.002Z","secure":false,"httpOnly":true,"path":"/"},"userId":"0c653743-7a70-49e9-a337-87b64eac33eb","userRole":"tecnico"}	2026-08-28 06:22:08
2XfZ77FBEHNpEGQz0ayh8k4XUOZr90Al	{"cookie":{"originalMaxAge":86400000,"expires":"2026-08-28T06:22:22.388Z","secure":false,"httpOnly":true,"path":"/"},"userId":"0c653743-7a70-49e9-a337-87b64eac33eb","userRole":"tecnico"}	2026-08-28 06:22:23
CxQWNsn-0jmeop41TXj4_oN91BC2F3Xr	{"cookie":{"originalMaxAge":86400000,"expires":"2026-08-28T16:05:29.164Z","secure":false,"httpOnly":true,"path":"/"},"userId":"52acd935-18e8-4e7c-8fca-cf5a038d2087","userRole":"admin"}	2026-08-29 04:30:35
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.users (id, nome, email, role, senha, avatar_url, created_at, updated_at, cargo, ativo, permissions, legacy, password_reset_expires_at, theme_preference) FROM stdin;
da7c683f-1a82-42b1-83a6-511fba6f5c72	Ultrassonista	ultrassonista1@nautilus.eng.br	tecnico	$argon2id$v=19$m=65536,p=4,t=3$G3VNvmvMTMopX3oL0He0MQ$YvP1sZuerEkQ1SP/7U8tHdBR9yhwQoM7Inar+4MAoGg	\N	2026-08-05 01:53:40.792	2026-08-27 00:25:44.552	Técnico	t	["module_vessels", "module_commitments", "module_tasks", "module_service_orders", "module_protocols", "module_access_configured"]	f	\N	classic
bb87970b-04f8-4b00-92f4-6142f2fd7ee2	Desenhista	desenhista1@nautilus.eng.br	tecnico	$argon2id$v=19$m=65536,p=4,t=3$G3VNvmvMTMopX3oL0He0MQ$YvP1sZuerEkQ1SP/7U8tHdBR9yhwQoM7Inar+4MAoGg	\N	2026-08-05 01:53:40.792	2026-08-27 00:25:44.559	Técnico	t	["module_vessels", "module_commitments", "module_tasks", "module_service_orders", "module_protocols", "module_access_configured"]	f	\N	classic
3f3b53ec-a8fc-4ffb-bd04-550b1f5f49b6	QA Navegador	qa.browser.20260804@nautilus.eng.br	tecnico	$argon2id$v=19$m=65536,p=4,t=3$TQgNMaSLeLt1ZAHAyZyPQg$44zRdx5l1Po+kPBKAQb+yHxFP0JtzjbF+dyFwMFNYhY	\N	2026-08-05 02:09:55.607	2026-08-27 00:25:44.561	Analista de Qualidade	t	["module_vessels", "module_commitments", "module_tasks", "module_service_orders", "module_protocols", "module_access_configured"]	f	\N	classic
52acd935-18e8-4e7c-8fca-cf5a038d2087	Osvaldo	osvaldo@nautilus.eng.br	admin	$argon2id$v=19$m=65536,p=4,t=3$isLFgps2E/JZvcHLCX3Dag$C0AsYnHzOM5LvGk2H6D9QRKeffKBvLxjbtwSs8Uap/Y	\N	2026-08-05 01:53:40.792	2026-08-28 03:30:08.326	Administrador / Responsável Técnico	t	["cadastrar_clientes_embarcacoes_propostas", "registrar_aceite_agendar", "executar_vistoria", "anexar_editar_versoes", "revisar_documentos", "aprovar_tecnicamente", "registrar_envio_resposta_externa", "entregar_concluir", "financeiro_administracao", "module_vessels", "module_registrations", "module_commitments", "module_tasks", "module_proposals", "module_renewals", "module_service_orders", "module_financial", "module_protocols", "module_documents", "module_access_configured"]	f	\N	classic
628e0dda-5e56-4000-bfe5-1cf823491580	Deisy	deisy@nautilus.eng.br	financeiro	$argon2id$v=19$m=65536,p=4,t=3$nJXEO8MqLRyy9hK9nxHg5A$yVeyfzVP6j1GNEu4+CkaDwYNHferhV62Xtpb4qr0XJU	\N	2026-08-05 01:53:40.792	2026-08-28 03:30:08.331	Comercial / Financeiro	t	["cadastrar_clientes_embarcacoes_propostas", "registrar_aceite_agendar", "anexar_editar_versoes", "financeiro_administracao", "module_vessels", "module_registrations", "module_commitments", "module_proposals", "module_renewals", "module_service_orders", "module_financial", "module_protocols", "module_access_configured"]	f	\N	classic
0c653743-7a70-49e9-a337-87b64eac33eb	Lucas	lucas@nautilus.eng.br	tecnico	$argon2id$v=19$m=65536,p=4,t=3$h0XPcFB84iLAJ9kLAFHL/g$1vBIvj6xf6c2jZSvOXWB4qog+Z1SaTVK1eeRmntyZCc	\N	2026-08-25 22:38:50.530467	2026-08-28 03:30:08.334	Entregador	t	["anexar_editar_versoes", "executar_entregas", "entregar_concluir", "module_vessels", "module_commitments", "module_tasks", "module_service_orders", "module_protocols", "module_access_configured"]	f	\N	classic
5ac63994-20e5-4e14-8705-c0899ab7d708	Rosano Souza	ronokedas@gmail.com	admin	$argon2id$v=19$m=65536,p=4,t=3$UASitV+cEyl+5oKbBtFg0g$RzuP9+tBq5fG92YNN4D1JCi6QMRPwg4muIJFW3Efl70	data:image/jpeg;base64,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	2026-08-05 02:01:59.117	2026-08-27 03:10:40.566	Administrador	t	["module_vessels", "module_registrations", "module_commitments", "module_tasks", "module_proposals", "module_renewals", "module_service_orders", "module_financial", "module_protocols", "module_documents", "module_access_configured"]	f	\N	classic
2219745f-30da-4923-8ddf-d5969003f180	Mirna	mirna@teste.com	tecnico	$argon2id$v=19$m=65536,p=4,t=3$xGbkMg97XVJ/1R2/herRoA$46RFs/78g+xFM5E9BR4gh4kCu0Nranc9hhXS8Ro+yos	\N	2026-08-25 21:38:47.793912	2026-08-27 00:25:44.575	Administrador	t	["documents_upload", "documents_delete", "module_vessels", "module_commitments", "module_tasks", "module_service_orders", "module_protocols", "module_documents", "module_access_configured"]	f	\N	classic
\.


--
-- Data for Name: vessels; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.vessels (id, nome, tipo, cliente_id, cliente_nome, telefone_contato, email_contato, responsavel_tecnico, status, etapa_atual, prazo_renovacao, valor_total, valor_recebido, arquivos_associados, progresso, created_at, updated_at, registro, certificadora_principal, valor_sinal, descricao, certificadora_id, comprimento, boca, pontal) FROM stdin;
7a9530b7-5fbb-4ef7-a2ca-23ac9bcbb683	Balsa Auditoria 1787205376963	Balsa	df141e03-5b8f-47a5-9ed2-97e40bf1f5af	Cliente Teste B — Navega Sul	\N	\N	\N	concluida	\N	\N	800.00	800.00	[]	0	2026-08-20 05:56:17.115	2026-08-27 20:20:32.328	PA-99999-X	Certificadora Auditoria 1787205376963	0.00		6864952c-1864-46da-bebb-fd7a6db947f0	\N	\N	\N
f54beb55-e3f7-402e-8073-957c29be6de4	Balsa Auditoria 1787205286533	Balsa	df141e03-5b8f-47a5-9ed2-97e40bf1f5af	Cliente Teste B — Navega Sul	\N	\N	\N	aberta	\N	\N	0.00	0.00	[]	0	2026-08-20 05:54:46.689	2026-08-21 22:08:24.289	PA-99999-X	Certificadora Auditoria 1787205286533	0.00		749ee7db-1b94-4e92-ac1c-9801f208c770	\N	\N	\N
dd9d00a5-9ed4-4c25-a1d2-261d803bf06c	MAR AZUL TESTE	Lancha de recreio	ab13d1d4-c1b8-4de9-beee-c41a59d14d36	Cliente Teste A — Marina Horizonte	(11) 98888-1001	ana.horizonte@example.com	Eng. Rafael Costa	aberta	\N	2027-08-14	0.00	0.00	[]	0	2026-08-19 20:11:56.699	2026-08-27 01:09:24.266	BR-MAR-TEST-A	Certificadora Naval Brasil (TESTE)	0.00	Dados de homologação e renovação — cenário de teste A.	29b7510c-3758-4760-ae47-6d432b9918fa	12.50	3.80	1.90
4b85545c-d882-42e5-88ff-f6d819ac5de0	Balsa E2E 1787200150719	Balsa	fb4f353d-5c95-4bde-99d2-45d11e6cfbb0	Cliente E2E Teste 1787200150702	\N	\N	\N	aberta	\N	\N	0.00	0.00	[]	0	2026-08-20 04:29:10.722	2026-08-26 16:11:42.339901	\N	\N	0.00	\N	\N	\N	\N	\N
2248edc3-a217-4eb8-b554-097b61d39505	VENTO SUL TESTE	Embarcação de apoio	df141e03-5b8f-47a5-9ed2-97e40bf1f5af	Cliente Teste B — Navega Sul	(21) 97777-2002	bruno.navega@example.com	Eng. Camila Martins	aberta	\N	2027-09-30	0.00	0.00	[]	0	2026-08-19 20:11:56.699	2026-08-19 20:11:56.699	BR-MAR-TEST-B	Certificadora Naval Brasil (TESTE)	0.00	Dados de homologação — cenário de teste B com exigência.	29b7510c-3758-4760-ae47-6d432b9918fa	9.20	3.10	1.45
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: nautilus_user
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 70, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: nautilus_user
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts_payable accounts_payable_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.accounts_payable
    ADD CONSTRAINT accounts_payable_pkey PRIMARY KEY (id);


--
-- Name: accounts_receivable accounts_receivable_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.accounts_receivable
    ADD CONSTRAINT accounts_receivable_pkey PRIMARY KEY (id);


--
-- Name: app_configs app_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.app_configs
    ADD CONSTRAINT app_configs_pkey PRIMARY KEY (id);


--
-- Name: approved_document_files approved_document_files_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.approved_document_files
    ADD CONSTRAINT approved_document_files_pkey PRIMARY KEY (id);


--
-- Name: certifiers certifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.certifiers
    ADD CONSTRAINT certifiers_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: commitment_attachments commitment_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.commitment_attachments
    ADD CONSTRAINT commitment_attachments_pkey PRIMARY KEY (id);


--
-- Name: commitments commitments_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.commitments
    ADD CONSTRAINT commitments_pkey PRIMARY KEY (id);


--
-- Name: critical_pendings critical_pendings_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.critical_pendings
    ADD CONSTRAINT critical_pendings_pkey PRIMARY KEY (id);


--
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- Name: delivery_dispatch_documents delivery_dispatch_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.delivery_dispatch_documents
    ADD CONSTRAINT delivery_dispatch_documents_pkey PRIMARY KEY (id);


--
-- Name: delivery_dispatch_documents delivery_dispatch_documents_remessa_entrega_id_arquivo_apro_key; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.delivery_dispatch_documents
    ADD CONSTRAINT delivery_dispatch_documents_remessa_entrega_id_arquivo_apro_key UNIQUE (remessa_entrega_id, arquivo_aprovado_id);


--
-- Name: delivery_dispatches delivery_dispatches_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.delivery_dispatches
    ADD CONSTRAINT delivery_dispatches_pkey PRIMARY KEY (id);


--
-- Name: document_library_audit document_library_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_library_audit
    ADD CONSTRAINT document_library_audit_pkey PRIMARY KEY (id);


--
-- Name: document_library_files document_library_files_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_library_files
    ADD CONSTRAINT document_library_files_pkey PRIMARY KEY (id);


--
-- Name: document_library_folders document_library_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_library_folders
    ADD CONSTRAINT document_library_folders_pkey PRIMARY KEY (id);


--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: external_responses external_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.external_responses
    ADD CONSTRAINT external_responses_pkey PRIMARY KEY (id);


--
-- Name: external_submissions external_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.external_submissions
    ADD CONSTRAINT external_submissions_pkey PRIMARY KEY (id);


--
-- Name: financial_attachments financial_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_attachments
    ADD CONSTRAINT financial_attachments_pkey PRIMARY KEY (id);


--
-- Name: financial_categories financial_categories_nome_key; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_categories
    ADD CONSTRAINT financial_categories_nome_key UNIQUE (nome);


--
-- Name: financial_categories financial_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_categories
    ADD CONSTRAINT financial_categories_pkey PRIMARY KEY (id);


--
-- Name: financial_entries financial_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_pkey PRIMARY KEY (id);


--
-- Name: financial_status_history financial_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_status_history
    ADD CONSTRAINT financial_status_history_pkey PRIMARY KEY (id);


--
-- Name: financial_suppliers financial_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_suppliers
    ADD CONSTRAINT financial_suppliers_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: os_events os_events_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.os_events
    ADD CONSTRAINT os_events_pkey PRIMARY KEY (id);


--
-- Name: os_finalization_reviews os_finalization_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.os_finalization_reviews
    ADD CONSTRAINT os_finalization_reviews_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: proposal_acceptances proposal_acceptances_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.proposal_acceptances
    ADD CONSTRAINT proposal_acceptances_pkey PRIMARY KEY (id);


--
-- Name: proposal_deliveries proposal_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.proposal_deliveries
    ADD CONSTRAINT proposal_deliveries_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: protocol_attachments protocol_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_attachments
    ADD CONSTRAINT protocol_attachments_pkey PRIMARY KEY (id);


--
-- Name: protocol_dispatch_documents protocol_dispatch_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_dispatch_documents
    ADD CONSTRAINT protocol_dispatch_documents_pkey PRIMARY KEY (id);


--
-- Name: protocol_dispatches protocol_dispatches_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_dispatches
    ADD CONSTRAINT protocol_dispatches_pkey PRIMARY KEY (id);


--
-- Name: protocol_events protocol_events_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_events
    ADD CONSTRAINT protocol_events_pkey PRIMARY KEY (id);


--
-- Name: protocol_response_documents protocol_response_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_response_documents
    ADD CONSTRAINT protocol_response_documents_pkey PRIMARY KEY (id);


--
-- Name: protocol_responses protocol_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_responses
    ADD CONSTRAINT protocol_responses_pkey PRIMARY KEY (id);


--
-- Name: protocols protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocols
    ADD CONSTRAINT protocols_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);


--
-- Name: service_order_item_comments service_order_item_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_order_item_comments
    ADD CONSTRAINT service_order_item_comments_pkey PRIMARY KEY (id);


--
-- Name: service_order_items service_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_order_items
    ADD CONSTRAINT service_order_items_pkey PRIMARY KEY (id);


--
-- Name: service_orders service_orders_numero_unique; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_numero_unique UNIQUE (numero);


--
-- Name: service_orders service_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_pkey PRIMARY KEY (id);


--
-- Name: services services_nome_key; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_nome_key UNIQUE (nome);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: user_sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vessels vessels_pkey; Type: CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.vessels
    ADD CONSTRAINT vessels_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX "IDX_session_expire" ON public.user_sessions USING btree (expire);


--
-- Name: accounts_payable_status_due_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX accounts_payable_status_due_idx ON public.accounts_payable USING btree (status, vencimento, created_at DESC, id DESC);


--
-- Name: accounts_receivable_proposta_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX accounts_receivable_proposta_unique ON public.accounts_receivable USING btree (proposta_id);


--
-- Name: accounts_receivable_status_created_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX accounts_receivable_status_created_idx ON public.accounts_receivable USING btree (status, created_at DESC, id DESC);


--
-- Name: approved_document_files_protocol_document_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX approved_document_files_protocol_document_idx ON public.approved_document_files USING btree (protocolo_id, documento_id);


--
-- Name: clients_name_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX clients_name_idx ON public.clients USING btree (nome);


--
-- Name: document_library_files_folder_uploaded_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX document_library_files_folder_uploaded_idx ON public.document_library_files USING btree (folder_id, uploaded_at DESC, id DESC);


--
-- Name: document_library_files_owner_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX document_library_files_owner_idx ON public.document_library_files USING btree (owner_user_id);


--
-- Name: document_library_files_uploaded_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX document_library_files_uploaded_idx ON public.document_library_files USING btree (uploaded_at DESC);


--
-- Name: document_library_folders_owner_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX document_library_folders_owner_idx ON public.document_library_folders USING btree (owner_user_id);


--
-- Name: document_versions_doc_versao_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX document_versions_doc_versao_unique ON public.document_versions USING btree (documento_id, versao);


--
-- Name: financial_entries_effective_date_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX financial_entries_effective_date_idx ON public.financial_entries USING btree (data DESC, created_at DESC, id DESC);


--
-- Name: financial_entries_vessel_date_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX financial_entries_vessel_date_idx ON public.financial_entries USING btree (embarcacao_id, data DESC, created_at DESC);


--
-- Name: idx_accounts_payable_status; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX idx_accounts_payable_status ON public.accounts_payable USING btree (status);


--
-- Name: idx_financial_entries_natureza; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX idx_financial_entries_natureza ON public.financial_entries USING btree (natureza);


--
-- Name: idx_financial_entries_nf_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX idx_financial_entries_nf_unique ON public.financial_entries USING btree (issuer_id, nota_fiscal_numero, nf_series) WHERE ((nota_fiscal_numero IS NOT NULL) AND (issuer_id IS NOT NULL));


--
-- Name: notifications_user_read_created_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX notifications_user_read_created_idx ON public.notifications USING btree (usuario_id, lida, created_at DESC);


--
-- Name: payments_financial_entry_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX payments_financial_entry_unique ON public.payments USING btree (financial_entry_id) WHERE (financial_entry_id IS NOT NULL);


--
-- Name: payments_receivable_active_created_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX payments_receivable_active_created_idx ON public.payments USING btree (conta_receber_id, ativo, created_at DESC);


--
-- Name: proposal_acceptances_proposta_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX proposal_acceptances_proposta_unique ON public.proposal_acceptances USING btree (proposta_id);


--
-- Name: proposals_created_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX proposals_created_idx ON public.proposals USING btree (created_at DESC, id DESC);


--
-- Name: protocol_dispatch_doc_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX protocol_dispatch_doc_unique ON public.protocol_dispatch_documents USING btree (remessa_id, documento_id);


--
-- Name: protocols_numero_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX protocols_numero_unique ON public.protocols USING btree (numero_protocolo);


--
-- Name: protocols_os_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX protocols_os_idx ON public.protocols USING btree (os_id);


--
-- Name: protocols_status_created_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX protocols_status_created_idx ON public.protocols USING btree (status, created_at DESC, id DESC);


--
-- Name: receipts_numero_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX receipts_numero_unique ON public.receipts USING btree (numero);


--
-- Name: service_order_item_comments_item_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX service_order_item_comments_item_idx ON public.service_order_item_comments USING btree (item_id, created_at);


--
-- Name: service_orders_status_created_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX service_orders_status_created_idx ON public.service_orders USING btree (status, created_at DESC, id DESC);


--
-- Name: vessels_created_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX vessels_created_idx ON public.vessels USING btree (created_at DESC, id DESC);


--
-- Name: vessels_status_created_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX vessels_status_created_idx ON public.vessels USING btree (status, created_at DESC, id DESC);


--
-- Name: accounts_payable accounts_payable_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.accounts_payable
    ADD CONSTRAINT accounts_payable_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.financial_categories(id);


--
-- Name: accounts_payable accounts_payable_embarcacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.accounts_payable
    ADD CONSTRAINT accounts_payable_embarcacao_id_fkey FOREIGN KEY (embarcacao_id) REFERENCES public.vessels(id);


--
-- Name: accounts_payable accounts_payable_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.accounts_payable
    ADD CONSTRAINT accounts_payable_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.financial_suppliers(id);


--
-- Name: accounts_receivable accounts_receivable_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.accounts_receivable
    ADD CONSTRAINT accounts_receivable_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clients(id);


--
-- Name: accounts_receivable accounts_receivable_compromisso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.accounts_receivable
    ADD CONSTRAINT accounts_receivable_compromisso_id_fkey FOREIGN KEY (compromisso_id) REFERENCES public.commitments(id);


--
-- Name: accounts_receivable accounts_receivable_embarcacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.accounts_receivable
    ADD CONSTRAINT accounts_receivable_embarcacao_id_fkey FOREIGN KEY (embarcacao_id) REFERENCES public.vessels(id);


--
-- Name: accounts_receivable accounts_receivable_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.accounts_receivable
    ADD CONSTRAINT accounts_receivable_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: accounts_receivable accounts_receivable_proposta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.accounts_receivable
    ADD CONSTRAINT accounts_receivable_proposta_id_fkey FOREIGN KEY (proposta_id) REFERENCES public.proposals(id);


--
-- Name: approved_document_files approved_document_files_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.approved_document_files
    ADD CONSTRAINT approved_document_files_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documents(id);


--
-- Name: approved_document_files approved_document_files_enviado_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.approved_document_files
    ADD CONSTRAINT approved_document_files_enviado_por_id_fkey FOREIGN KEY (enviado_por_id) REFERENCES public.users(id);


--
-- Name: approved_document_files approved_document_files_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.approved_document_files
    ADD CONSTRAINT approved_document_files_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocols(id) ON DELETE CASCADE;


--
-- Name: approved_document_files approved_document_files_resposta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.approved_document_files
    ADD CONSTRAINT approved_document_files_resposta_id_fkey FOREIGN KEY (resposta_id) REFERENCES public.protocol_responses(id) ON DELETE SET NULL;


--
-- Name: approved_document_files approved_document_files_versao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.approved_document_files
    ADD CONSTRAINT approved_document_files_versao_id_fkey FOREIGN KEY (versao_id) REFERENCES public.document_versions(id);


--
-- Name: commitment_attachments commitment_attachments_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.commitment_attachments
    ADD CONSTRAINT commitment_attachments_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.users(id);


--
-- Name: commitment_attachments commitment_attachments_compromisso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.commitment_attachments
    ADD CONSTRAINT commitment_attachments_compromisso_id_fkey FOREIGN KEY (compromisso_id) REFERENCES public.commitments(id) ON DELETE CASCADE;


--
-- Name: commitments commitments_criado_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.commitments
    ADD CONSTRAINT commitments_criado_por_id_fkey FOREIGN KEY (criado_por_id) REFERENCES public.users(id);


--
-- Name: commitments commitments_embarcacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.commitments
    ADD CONSTRAINT commitments_embarcacao_id_fkey FOREIGN KEY (embarcacao_id) REFERENCES public.vessels(id);


--
-- Name: commitments commitments_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.commitments
    ADD CONSTRAINT commitments_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.users(id);


--
-- Name: deliveries deliveries_entregue_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_entregue_por_id_fkey FOREIGN KEY (entregue_por_id) REFERENCES public.users(id);


--
-- Name: deliveries deliveries_impresso_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_impresso_por_id_fkey FOREIGN KEY (impresso_por_id) REFERENCES public.users(id);


--
-- Name: deliveries deliveries_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: deliveries deliveries_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.users(id);


--
-- Name: delivery_dispatch_documents delivery_dispatch_documents_arquivo_aprovado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.delivery_dispatch_documents
    ADD CONSTRAINT delivery_dispatch_documents_arquivo_aprovado_id_fkey FOREIGN KEY (arquivo_aprovado_id) REFERENCES public.approved_document_files(id);


--
-- Name: delivery_dispatch_documents delivery_dispatch_documents_remessa_entrega_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.delivery_dispatch_documents
    ADD CONSTRAINT delivery_dispatch_documents_remessa_entrega_id_fkey FOREIGN KEY (remessa_entrega_id) REFERENCES public.delivery_dispatches(id) ON DELETE CASCADE;


--
-- Name: delivery_dispatches delivery_dispatches_delivery_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.delivery_dispatches
    ADD CONSTRAINT delivery_dispatches_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id) ON DELETE CASCADE;


--
-- Name: delivery_dispatches delivery_dispatches_entregue_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.delivery_dispatches
    ADD CONSTRAINT delivery_dispatches_entregue_por_id_fkey FOREIGN KEY (entregue_por_id) REFERENCES public.users(id);


--
-- Name: document_library_audit document_library_audit_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_library_audit
    ADD CONSTRAINT document_library_audit_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- Name: document_library_files document_library_files_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_library_files
    ADD CONSTRAINT document_library_files_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.document_library_folders(id) ON DELETE CASCADE;


--
-- Name: document_library_files document_library_files_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_library_files
    ADD CONSTRAINT document_library_files_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: document_library_files document_library_files_trashed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_library_files
    ADD CONSTRAINT document_library_files_trashed_by_id_fkey FOREIGN KEY (trashed_by_id) REFERENCES public.users(id);


--
-- Name: document_library_files document_library_files_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_library_files
    ADD CONSTRAINT document_library_files_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.users(id);


--
-- Name: document_library_folders document_library_folders_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_library_folders
    ADD CONSTRAINT document_library_folders_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: document_library_folders document_library_folders_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_library_folders
    ADD CONSTRAINT document_library_folders_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: document_library_folders document_library_folders_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_library_folders
    ADD CONSTRAINT document_library_folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.document_library_folders(id) ON DELETE CASCADE;


--
-- Name: document_versions document_versions_aprovado_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_aprovado_por_id_fkey FOREIGN KEY (aprovado_por_id) REFERENCES public.users(id);


--
-- Name: document_versions document_versions_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.users(id);


--
-- Name: document_versions document_versions_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documents(id);


--
-- Name: documents documents_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: external_responses external_responses_submissao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.external_responses
    ADD CONSTRAINT external_responses_submissao_id_fkey FOREIGN KEY (submissao_id) REFERENCES public.external_submissions(id);


--
-- Name: external_submissions external_submissions_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.external_submissions
    ADD CONSTRAINT external_submissions_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documents(id);


--
-- Name: external_submissions external_submissions_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.external_submissions
    ADD CONSTRAINT external_submissions_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: external_submissions external_submissions_responsavel_envio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.external_submissions
    ADD CONSTRAINT external_submissions_responsavel_envio_id_fkey FOREIGN KEY (responsavel_envio_id) REFERENCES public.users(id);


--
-- Name: financial_attachments financial_attachments_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_attachments
    ADD CONSTRAINT financial_attachments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.financial_entries(id) ON DELETE CASCADE;


--
-- Name: financial_attachments financial_attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_attachments
    ADD CONSTRAINT financial_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: financial_entries financial_entries_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.financial_categories(id);


--
-- Name: financial_entries financial_entries_conta_pagar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_conta_pagar_id_fkey FOREIGN KEY (conta_pagar_id) REFERENCES public.accounts_payable(id);


--
-- Name: financial_entries financial_entries_conta_receber_id_accounts_receivable_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_conta_receber_id_accounts_receivable_id_fk FOREIGN KEY (conta_receber_id) REFERENCES public.accounts_receivable(id);


--
-- Name: financial_entries financial_entries_embarcacao_id_vessels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_embarcacao_id_vessels_id_fk FOREIGN KEY (embarcacao_id) REFERENCES public.vessels(id);


--
-- Name: financial_entries financial_entries_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.financial_suppliers(id);


--
-- Name: financial_entries financial_entries_issuer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_issuer_id_fkey FOREIGN KEY (issuer_id) REFERENCES public.clients(id);


--
-- Name: financial_entries financial_entries_original_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_original_payment_id_fkey FOREIGN KEY (original_payment_id) REFERENCES public.financial_entries(id);


--
-- Name: financial_entries financial_entries_os_id_service_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_os_id_service_orders_id_fk FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: financial_entries financial_entries_proposta_id_proposals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_proposta_id_proposals_id_fk FOREIGN KEY (proposta_id) REFERENCES public.proposals(id);


--
-- Name: financial_status_history financial_status_history_embarcacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_status_history
    ADD CONSTRAINT financial_status_history_embarcacao_id_fkey FOREIGN KEY (embarcacao_id) REFERENCES public.vessels(id) ON DELETE CASCADE;


--
-- Name: financial_status_history financial_status_history_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_status_history
    ADD CONSTRAINT financial_status_history_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.financial_entries(id);


--
-- Name: financial_status_history financial_status_history_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_status_history
    ADD CONSTRAINT financial_status_history_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id) ON DELETE CASCADE;


--
-- Name: financial_status_history financial_status_history_triggered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.financial_status_history
    ADD CONSTRAINT financial_status_history_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES public.users(id);


--
-- Name: notifications notifications_compromisso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_compromisso_id_fkey FOREIGN KEY (compromisso_id) REFERENCES public.commitments(id);


--
-- Name: notifications notifications_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: notifications notifications_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id);


--
-- Name: os_events os_events_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.os_events
    ADD CONSTRAINT os_events_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.users(id);


--
-- Name: os_events os_events_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.os_events
    ADD CONSTRAINT os_events_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: os_finalization_reviews os_finalization_reviews_administrador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.os_finalization_reviews
    ADD CONSTRAINT os_finalization_reviews_administrador_id_fkey FOREIGN KEY (administrador_id) REFERENCES public.users(id);


--
-- Name: os_finalization_reviews os_finalization_reviews_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.os_finalization_reviews
    ADD CONSTRAINT os_finalization_reviews_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id) ON DELETE CASCADE;


--
-- Name: payments payments_conta_receber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_conta_receber_id_fkey FOREIGN KEY (conta_receber_id) REFERENCES public.accounts_receivable(id);


--
-- Name: payments payments_embarcacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_embarcacao_id_fkey FOREIGN KEY (embarcacao_id) REFERENCES public.vessels(id);


--
-- Name: payments payments_financial_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_financial_entry_id_fkey FOREIGN KEY (financial_entry_id) REFERENCES public.financial_entries(id);


--
-- Name: payments payments_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: payments payments_proposta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_proposta_id_fkey FOREIGN KEY (proposta_id) REFERENCES public.proposals(id);


--
-- Name: proposal_acceptances proposal_acceptances_proposta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.proposal_acceptances
    ADD CONSTRAINT proposal_acceptances_proposta_id_fkey FOREIGN KEY (proposta_id) REFERENCES public.proposals(id);


--
-- Name: proposal_acceptances proposal_acceptances_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.proposal_acceptances
    ADD CONSTRAINT proposal_acceptances_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id);


--
-- Name: proposal_deliveries proposal_deliveries_proposta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.proposal_deliveries
    ADD CONSTRAINT proposal_deliveries_proposta_id_fkey FOREIGN KEY (proposta_id) REFERENCES public.proposals(id);


--
-- Name: proposal_deliveries proposal_deliveries_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.proposal_deliveries
    ADD CONSTRAINT proposal_deliveries_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id);


--
-- Name: proposals proposals_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clients(id);


--
-- Name: proposals proposals_embarcacao_id_vessels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_embarcacao_id_vessels_id_fk FOREIGN KEY (embarcacao_id) REFERENCES public.vessels(id);


--
-- Name: proposals proposals_os_id_service_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_os_id_service_orders_id_fk FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: proposals proposals_renovacao_de_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_renovacao_de_id_fkey FOREIGN KEY (renovacao_de_id) REFERENCES public.proposals(id);


--
-- Name: protocol_attachments protocol_attachments_enviado_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_attachments
    ADD CONSTRAINT protocol_attachments_enviado_por_id_fkey FOREIGN KEY (enviado_por_id) REFERENCES public.users(id);


--
-- Name: protocol_attachments protocol_attachments_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_attachments
    ADD CONSTRAINT protocol_attachments_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocols(id) ON DELETE CASCADE;


--
-- Name: protocol_attachments protocol_attachments_resposta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_attachments
    ADD CONSTRAINT protocol_attachments_resposta_id_fkey FOREIGN KEY (resposta_id) REFERENCES public.protocol_responses(id) ON DELETE CASCADE;


--
-- Name: protocol_dispatch_documents protocol_dispatch_documents_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_dispatch_documents
    ADD CONSTRAINT protocol_dispatch_documents_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documents(id);


--
-- Name: protocol_dispatch_documents protocol_dispatch_documents_remessa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_dispatch_documents
    ADD CONSTRAINT protocol_dispatch_documents_remessa_id_fkey FOREIGN KEY (remessa_id) REFERENCES public.protocol_dispatches(id) ON DELETE CASCADE;


--
-- Name: protocol_dispatch_documents protocol_dispatch_documents_versao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_dispatch_documents
    ADD CONSTRAINT protocol_dispatch_documents_versao_id_fkey FOREIGN KEY (versao_id) REFERENCES public.document_versions(id);


--
-- Name: protocol_dispatches protocol_dispatches_enviado_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_dispatches
    ADD CONSTRAINT protocol_dispatches_enviado_por_id_fkey FOREIGN KEY (enviado_por_id) REFERENCES public.users(id);


--
-- Name: protocol_dispatches protocol_dispatches_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_dispatches
    ADD CONSTRAINT protocol_dispatches_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocols(id) ON DELETE CASCADE;


--
-- Name: protocol_events protocol_events_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_events
    ADD CONSTRAINT protocol_events_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.users(id);


--
-- Name: protocol_events protocol_events_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_events
    ADD CONSTRAINT protocol_events_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocols(id) ON DELETE CASCADE;


--
-- Name: protocol_response_documents protocol_response_documents_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_response_documents
    ADD CONSTRAINT protocol_response_documents_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documents(id);


--
-- Name: protocol_response_documents protocol_response_documents_resposta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_response_documents
    ADD CONSTRAINT protocol_response_documents_resposta_id_fkey FOREIGN KEY (resposta_id) REFERENCES public.protocol_responses(id) ON DELETE CASCADE;


--
-- Name: protocol_responses protocol_responses_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_responses
    ADD CONSTRAINT protocol_responses_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocols(id) ON DELETE CASCADE;


--
-- Name: protocol_responses protocol_responses_registrado_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_responses
    ADD CONSTRAINT protocol_responses_registrado_por_id_fkey FOREIGN KEY (registrado_por_id) REFERENCES public.users(id);


--
-- Name: protocol_responses protocol_responses_remessa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocol_responses
    ADD CONSTRAINT protocol_responses_remessa_id_fkey FOREIGN KEY (remessa_id) REFERENCES public.protocol_dispatches(id) ON DELETE CASCADE;


--
-- Name: protocols protocols_embarcacao_id_vessels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocols
    ADD CONSTRAINT protocols_embarcacao_id_vessels_id_fk FOREIGN KEY (embarcacao_id) REFERENCES public.vessels(id);


--
-- Name: protocols protocols_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocols
    ADD CONSTRAINT protocols_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: receipts receipts_conta_receber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_conta_receber_id_fkey FOREIGN KEY (conta_receber_id) REFERENCES public.accounts_receivable(id);


--
-- Name: receipts receipts_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: schedules schedules_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: schedules schedules_tecnico_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_tecnico_responsavel_id_fkey FOREIGN KEY (tecnico_responsavel_id) REFERENCES public.users(id);


--
-- Name: service_order_item_comments service_order_item_comments_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_order_item_comments
    ADD CONSTRAINT service_order_item_comments_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: service_order_item_comments service_order_item_comments_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_order_item_comments
    ADD CONSTRAINT service_order_item_comments_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.service_order_items(id) ON DELETE CASCADE;


--
-- Name: service_order_item_comments service_order_item_comments_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_order_item_comments
    ADD CONSTRAINT service_order_item_comments_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id) ON DELETE CASCADE;


--
-- Name: service_order_items service_order_items_os_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_order_items
    ADD CONSTRAINT service_order_items_os_id_fkey FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: service_order_items service_order_items_tecnico_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_order_items
    ADD CONSTRAINT service_order_items_tecnico_responsavel_id_fkey FOREIGN KEY (tecnico_responsavel_id) REFERENCES public.users(id);


--
-- Name: service_orders service_orders_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clients(id);


--
-- Name: service_orders service_orders_embarcacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_embarcacao_id_fkey FOREIGN KEY (embarcacao_id) REFERENCES public.vessels(id);


--
-- Name: service_orders service_orders_proposta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_proposta_id_fkey FOREIGN KEY (proposta_id) REFERENCES public.proposals(id);


--
-- Name: service_orders service_orders_responsavel_tecnico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_responsavel_tecnico_id_fkey FOREIGN KEY (responsavel_tecnico_id) REFERENCES public.users(id);


--
-- Name: tasks tasks_embarcacao_id_vessels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_embarcacao_id_vessels_id_fk FOREIGN KEY (embarcacao_id) REFERENCES public.vessels(id);


--
-- Name: tasks tasks_os_id_service_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_os_id_service_orders_id_fk FOREIGN KEY (os_id) REFERENCES public.service_orders(id);


--
-- Name: tasks tasks_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.users(id);


--
-- Name: vessels vessels_certificadora_id_certifiers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.vessels
    ADD CONSTRAINT vessels_certificadora_id_certifiers_id_fk FOREIGN KEY (certificadora_id) REFERENCES public.certifiers(id);


--
-- Name: vessels vessels_cliente_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.vessels
    ADD CONSTRAINT vessels_cliente_id_clients_id_fk FOREIGN KEY (cliente_id) REFERENCES public.clients(id);


--
-- PostgreSQL database dump complete
--

\unrestrict QH84BSc7dxMfvLe5Jj1BfCry6v77NVcg8k9sdGbKNkqRexxPgey5uc1fRQIx1xY

