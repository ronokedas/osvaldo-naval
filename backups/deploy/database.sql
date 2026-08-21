--
-- PostgreSQL database dump
--

\restrict 5LGLkX4vRkqfq3HUVKDjHcNaMtEU53taWWa7JfyeCdaOPtzGYkpLlRM8RIjLEGH

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
    updated_at timestamp without time zone DEFAULT now()
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
    impresso_por_id uuid
);


ALTER TABLE public.deliveries OWNER TO nautilus_user;

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
    updated_at timestamp without time zone DEFAULT now()
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
    vencimento text
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
    updated_at timestamp without time zone DEFAULT now()
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
    updated_at timestamp without time zone DEFAULT now()
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
    legacy boolean DEFAULT false
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
70d7491e-c7b9-4bad-be98-97fa6bac8f05	ec3b15a4-c309-4198-9689-99f08834b210	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	4300.00	parcial	2026-08-20 23:35:27.709055	2026-08-20 23:35:27.726	\N
f0e455fd-af8b-4637-a343-43345b2a7aaa	75f46220-90eb-48d9-bf1d-0d2e212a8251	4caaa7dc-df1e-4c07-904b-f3b522db605c	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	5300.00	parcial	2026-08-21 04:30:03.961756	2026-08-21 04:30:03.975	\N
db5841c6-c6c7-4137-98dc-666a782d0295	a69b3c52-2bf0-451c-b517-fe17d58bc4bc	c2be3112-3678-40dd-a77f-24159c08b704	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	5700.00	parcial	2026-08-21 06:07:50.130479	2026-08-21 06:07:50.146	\N
d9ba4c6d-80c5-4b27-bbf9-85a4cd9e7771	e8321e30-538a-48f1-b60e-0f12dbe5f8e4	177b6282-675d-4231-bec6-cb1112b18d5d	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	5900.00	parcial	2026-08-21 06:20:32.239782	2026-08-21 06:20:32.257	\N
b57b5490-f220-448f-9896-3fd1956d045e	59cfc4fc-f649-47f5-a080-7f38a1e0fde2	3f38b1b2-c341-4d9c-be9c-464db79881ff	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	4500.00	parcial	2026-08-21 06:36:29.496782	2026-08-21 06:36:29.513	\N
475bb970-2408-49e8-8900-d55171e7acda	60df4929-3c43-477a-ad1c-9af84f42757e	22157892-9a20-4533-a4db-8b85cfb26134	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	3500.00	parcial	2026-08-21 06:38:13.94426	2026-08-21 06:38:13.957	\N
\.


--
-- Data for Name: app_configs; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.app_configs (id, data, updated_at) FROM stdin;
signature	{"ativo": true, "imagemUrl": "data:image/png;base64,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", "aplicarRecibos": true, "creaOrRegistro": "CREA - 4532563", "nomeSignatario": "Osvaldo", "cargoSignatario": "Engenheiro Naval", "aplicarPropostas": true, "aplicarProtocolos": true}	2026-08-19 22:52:19.507
logo	{"ativo": true, "imagemUrl": "/logo.svg", "subtitulo": "ENGENHARIA NAVAL", "nomeEmpresa": "NAUTILUS"}	2026-08-20 22:03:37.949
\.


--
-- Data for Name: certifiers; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.certifiers (id, nome, codigo_registro, telefone_contato, email, ativo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.clients (id, nome, email, telefone, cnpj_cpf, endereco, created_at, updated_at, whatsapp) FROM stdin;
42e17777-62a4-41df-8b4b-0c8a24ff234e	Rosano Souza	ronokedas@gmail.com	\N	38303451863	\N	2026-08-20 22:57:49.056215	2026-08-20 22:57:49.056215	(91) 98934-0275
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

COPY public.deliveries (id, os_id, status, data_entrega, meio_entrega, nome_recebedor, comprovante_url, comprovante_nome, entregue_por_id, created_at, updated_at, data_impressao, impresso_por_id) FROM stdin;
\.


--
-- Data for Name: document_versions; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.document_versions (id, documento_id, versao, arquivo_nome_fisico, arquivo_nome_original, tamanho, tipo_mime, autor_id, autor_nome, data, comentario, origem, situacao_revisao, situacao_aprovacao, aprovado_por_id, aprovado_em, created_at, updated_at, pdf_url) FROM stdin;
ad7bd24f-eabe-4913-9e7c-1f6463d1a3b8	ae5cf876-1c67-4e3c-b4ff-42aacddde064	1	1787267692882-255414309-Proposta_DS_052_26_final2.pdf	Proposta_DS_052_26_final2.pdf	0	\N	628e0dda-5e56-4000-bfe5-1cf823491580	Deisy	2026-08-20 23:14	Versão convertida de arquivo legado (migração).	vistoria	pendente	pendente	\N	\N	2026-08-20 23:20:58.725918	2026-08-20 23:20:58.725918	\N
1dfdc351-5519-4e51-9534-ed33e414dd3f	c0a88bdd-ec4c-4ef9-8d08-2c8a715ca5c0	1	1787269062625-944825783-imagemeee.jpg	imagemeee.jpg	118081	image/jpeg	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	2026-08-20	ww	correcao_interna	revisado	reprovado	\N	\N	2026-08-20 23:37:42.674427	2026-08-20 23:38:03.871	\N
7a118c9e-df85-4d23-82b6-0e4ac7d115d8	c0a88bdd-ec4c-4ef9-8d08-2c8a715ca5c0	2	1787269279163-830064384-Proposta_DS_052_26_final__1_.pdf	Proposta_DS_052_26_final (1).pdf	248696	application/pdf	628e0dda-5e56-4000-bfe5-1cf823491580	Deisy	2026-08-20	okagora	correcao_interna	revisado	aprovado	52acd935-18e8-4e7c-8fca-cf5a038d2087	2026-08-21	2026-08-20 23:41:19.17692	2026-08-21 04:17:21.127	\N
3c1b6f1e-6440-4578-b0bd-e91f2219e7b7	6a8b345e-dcfb-4333-a2de-5bd84aa267fb	1	1787269141203-715736329-Proposta_DS_052_26_final2.pdf	Proposta_DS_052_26_final2.pdf	248696	application/pdf	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	2026-08-20	corr	correcao_interna	revisado	aprovado	52acd935-18e8-4e7c-8fca-cf5a038d2087	2026-08-21	2026-08-20 23:39:01.217161	2026-08-21 04:17:23.903	\N
ba7176bb-62f4-4489-98e6-bf45fb96adb1	c0fb8b46-0b1c-45b9-b73f-45d20b83927b	1	1787288108821-503489212-Proposta_DS_052_26_qa.pdf	Proposta_DS_052_26_qa.pdf	250619	application/pdf	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	2026-08-21	vv	correcao_interna	revisado	aprovado	52acd935-18e8-4e7c-8fca-cf5a038d2087	2026-08-21	2026-08-21 04:55:08.836973	2026-08-21 04:55:47.716	\N
5601cee5-efa1-4aea-b859-e412eeab5122	8a533d5f-4784-4739-9844-d3b61fb858e6	1	1787288079607-71207674-Proposta_DS_052_26_validada.pdf	Proposta_DS_052_26_validada.pdf	251429	application/pdf	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	2026-08-21	dd	correcao_interna	revisado	aprovado	52acd935-18e8-4e7c-8fca-cf5a038d2087	2026-08-21	2026-08-21 04:54:39.625389	2026-08-21 04:56:22.369	\N
c854d02b-423c-418d-b9b8-2ff6f4ece189	8a533d5f-4784-4739-9844-d3b61fb858e6	2	1787289670503-248064910-Proposta_DS_052_26_validada.pdf	Proposta_DS_052_26_validada.pdf	251429	application/pdf	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	2026-08-21	yuuuu	exigencia_externa	revisado	reprovado	\N	\N	2026-08-21 05:21:10.519289	2026-08-21 05:21:21.486	\N
a3af8563-0d14-468d-91cc-66f3a2f728af	c0fb8b46-0b1c-45b9-b73f-45d20b83927b	2	1787289736201-805361030-p2.jpeg	p2.jpeg	82846	image/jpeg	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	2026-08-21	uyuuu	correcao_interna	revisado	reprovado	\N	\N	2026-08-21 05:22:16.213092	2026-08-21 05:22:21.609	\N
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.documents (id, os_id, titulo, tipo, status, versao_atual, created_at, updated_at) FROM stdin;
ae5cf876-1c67-4e3c-b4ff-42aacddde064	38ec3a07-9999-4f2f-a322-49ba4c697996	Espessalaudoteste1	ultrassom	em_elaboracao	1	2026-08-20 23:20:58.723533	2026-08-20 23:20:58.723533
c0a88bdd-ec4c-4ef9-8d08-2c8a715ca5c0	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	Croqui de sondagem	desenho	aguardando_envio	2	2026-08-20 23:35:27.709055	2026-08-21 04:17:21.128
6a8b345e-dcfb-4333-a2de-5bd84aa267fb	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	Anotação de Responsabilidade Técnica (ART) - CREA/PA	art	aguardando_envio	1	2026-08-20 23:35:27.709055	2026-08-21 04:17:23.904
8a533d5f-4784-4739-9844-d3b61fb858e6	4caaa7dc-df1e-4c07-904b-f3b522db605c	Anotação de Responsabilidade Técnica (ART) - CREA/PA	art	em_elaboracao	2	2026-08-21 04:30:03.961756	2026-08-21 05:21:21.488
c0fb8b46-0b1c-45b9-b73f-45d20b83927b	4caaa7dc-df1e-4c07-904b-f3b522db605c	Croqui de sondagem	desenho	em_elaboracao	2	2026-08-21 04:30:03.961756	2026-08-21 05:22:21.611
7d57764f-57f4-4d9f-b22e-f8b37efbd7e1	c2be3112-3678-40dd-a77f-24159c08b704	Croqui de sondagem	desenho	em_elaboracao	0	2026-08-21 06:07:50.130479	2026-08-21 06:07:50.130479
71da8bbc-fb89-42a5-9bb8-7356758d7aa8	c2be3112-3678-40dd-a77f-24159c08b704	Declaração de responsabilidade técnica	art	em_elaboracao	0	2026-08-21 06:07:50.130479	2026-08-21 06:07:50.130479
026bb875-c8e4-4e74-a70f-308c1dc45b34	177b6282-675d-4231-bec6-cb1112b18d5d	Certificado de homologação nas certificadoras	homologacao	em_elaboracao	0	2026-08-21 06:20:32.239782	2026-08-21 06:20:32.239782
dfb82ad8-be44-4c5a-8cbd-f998850104e6	177b6282-675d-4231-bec6-cb1112b18d5d	Declaração de responsabilidade técnica	art	em_elaboracao	0	2026-08-21 06:20:32.239782	2026-08-21 06:20:32.239782
9b773e18-76b0-449b-bdbd-c41232b22be7	177b6282-675d-4231-bec6-cb1112b18d5d	Declaração de responsabilidade técnica	art	em_elaboracao	0	2026-08-21 06:20:32.239782	2026-08-21 06:20:32.239782
74690713-72da-4c61-8dd9-b7d98fcc5be2	3f38b1b2-c341-4d9c-be9c-464db79881ff	Croqui de sondagem	desenho	em_elaboracao	0	2026-08-21 06:36:29.496782	2026-08-21 06:36:29.496782
e9ef60e6-50b4-46a1-b350-12b20b452c03	22157892-9a20-4533-a4db-8b85cfb26134	Certificado de homologação nas certificadoras	homologacao	em_elaboracao	0	2026-08-21 06:38:13.94426	2026-08-21 06:38:13.94426
\.


--
-- Data for Name: external_responses; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.external_responses (id, submissao_id, tipo, data, motivo, anexo_url, anexo_nome, versao_aprovada, created_at, updated_at) FROM stdin;
6e1982f2-206b-4315-a94f-3e553f4ac2be	106a0f63-d397-4cf1-8ff5-0b78928b4c0b	exigencia	2026-08-21	hgyrtyry	\N	\N	\N	2026-08-21 05:20:12.104194	2026-08-21 05:20:12.104194
\.


--
-- Data for Name: external_submissions; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.external_submissions (id, os_id, documento_id, versao_enviada, orgao_ou_certificadora, data_envio, protocolo, observacao, responsavel_envio_id, created_at, updated_at) FROM stdin;
106a0f63-d397-4cf1-8ff5-0b78928b4c0b	4caaa7dc-df1e-4c07-904b-f3b522db605c	c0fb8b46-0b1c-45b9-b73f-45d20b83927b	1	Cliente	2026-08-21	RK-5435346		52acd935-18e8-4e7c-8fca-cf5a038d2087	2026-08-21 04:57:43.508985	2026-08-21 04:57:43.508985
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
\.


--
-- Data for Name: financial_entries; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.financial_entries (id, embarcacao_id, embarcacao_nome, cliente_nome, data, valor, tipo, forma_pagamento, observacao, lancado_por_nome, nota_fiscal_numero, nota_fiscal_nome, nota_fiscal_url, recibo_numero, comprovante_despesa_url, created_at, updated_at, proposta_id, os_id, conta_receber_id, issuer_id, nf_series, is_storno, storno_reason, original_payment_id, notification_sent, conta_pagar_id, categoria_id, fornecedor_id, natureza, competencia, vencimento) FROM stdin;
b92d21f9-4a05-4cf6-bdef-93947aa66bf8	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	2026-08-20	2150.00	parcela	PIX	Pagamento registrado no aceite da proposta DS 051/26	Administrador	\N	\N	\N	\N	\N	2026-08-20 23:35:27.709055	2026-08-20 23:35:27.709055	ec3b15a4-c309-4198-9689-99f08834b210	\N	70d7491e-c7b9-4bad-be98-97fa6bac8f05	\N	\N	f	\N	\N	f	\N	\N	\N	entrada	\N	\N
4d6c289d-8258-42e1-bde9-2615cc0e4ab8	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	2026-08-21	1000.00	sinal	PIX	Sinal Barco Teste1	Administrador	\N	\N	\N	REC-294912	\N	2026-08-21 04:24:54.932093	2026-08-21 04:24:54.932093	\N	\N	\N	\N	\N	f	\N	\N	t	\N	\N	\N	entrada	\N	\N
d0d42295-4da5-4b30-b2e8-f4dca4a5b1fe	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	2026-08-21	1390.09	parcela	PIX	Pagamento registrado no aceite da proposta DS 052/26	Administrador	\N	\N	\N	\N	\N	2026-08-21 04:30:03.961756	2026-08-21 04:30:03.961756	75f46220-90eb-48d9-bf1d-0d2e212a8251	\N	f0e455fd-af8b-4637-a343-43345b2a7aaa	\N	\N	f	\N	\N	f	\N	\N	\N	entrada	\N	\N
d7ba3fd2-d962-4ab6-9fb0-64244c24f86e	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	2026-08-21	150.00	sinal	PIX	Sinal Barco Teste1	Administrador	NF-45235	Proposta_DS_052_26_qa.pdf	/uploads/1787289264633-31309299-Proposta_DS_052_26_qa.pdf	REC-312533	\N	2026-08-21 04:25:12.547837	2026-08-21 05:14:24.66	\N	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	entrada	\N	\N
18b1bcb3-25b9-4604-a204-f5684ba184be	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	2026-08-21	700.00	parcela	PIX	Pagamento registrado no aceite da proposta DS 053/26	Administrador	\N	\N	\N	\N	\N	2026-08-21 06:07:50.130479	2026-08-21 06:07:50.130479	a69b3c52-2bf0-451c-b517-fe17d58bc4bc	\N	db5841c6-c6c7-4137-98dc-666a782d0295	\N	\N	f	\N	\N	f	\N	\N	\N	entrada	\N	\N
ecd00b5b-060d-46f2-b62a-036430d0c89e	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	2026-08-21	1900.00	parcela	PIX	Pagamento registrado no aceite da proposta DS 054/26	Administrador	\N	\N	\N	\N	\N	2026-08-21 06:20:32.239782	2026-08-21 06:20:32.239782	e8321e30-538a-48f1-b60e-0f12dbe5f8e4	\N	d9ba4c6d-80c5-4b27-bbf9-85a4cd9e7771	\N	\N	f	\N	\N	f	\N	\N	\N	entrada	\N	\N
5078048a-3aa1-4da1-ba06-7a5cc435165f	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	2026-08-21	1000.00	parcela	PIX	Pagamento registrado no aceite da proposta DS 055/26	Administrador	\N	\N	\N	\N	\N	2026-08-21 06:36:29.496782	2026-08-21 06:36:29.496782	59cfc4fc-f649-47f5-a080-7f38a1e0fde2	\N	b57b5490-f220-448f-9896-3fd1956d045e	\N	\N	f	\N	\N	f	\N	\N	\N	entrada	\N	\N
2cdbe008-9d38-4ad8-a44a-e7966f315fad	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	2026-08-21	1500.00	parcela	PIX	Pagamento registrado no aceite da proposta DS 056/26	Administrador	\N	\N	\N	\N	\N	2026-08-21 06:38:13.94426	2026-08-21 06:38:13.94426	60df4929-3c43-477a-ad1c-9af84f42757e	\N	475bb970-2408-49e8-8900-d55171e7acda	\N	\N	f	\N	\N	f	\N	\N	\N	entrada	\N	\N
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
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.notifications (id, usuario_id, tipo, titulo, mensagem, lida, os_id, created_at, prioridade, compromisso_id) FROM stdin;
1b323010-fd65-44ab-9e43-801ecb891d9b	52acd935-18e8-4e7c-8fca-cf5a038d2087	item_os	Serviço da OS atualizado	Administrador atualizou os dados de "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:35:46.363728	alta	\N
63a500c7-4933-4af7-9205-50a4577a69a6	5ac63994-20e5-4e14-8705-c0899ab7d708	item_os	Serviço da OS atualizado	Administrador atualizou os dados de "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:35:46.363636	alta	\N
f3e53ed4-1f90-4b47-a732-157871efdb90	5ac63994-20e5-4e14-8705-c0899ab7d708	atribuicao	Responsável pelo serviço atualizado	Administrador atribuiu o serviço "Croqui de sondagem" a um responsável.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:36:18.448358	alta	\N
84d5c7f3-66b4-48af-bdea-9861e87ffd1b	52acd935-18e8-4e7c-8fca-cf5a038d2087	atribuicao	Responsável pelo serviço atualizado	Administrador atribuiu o serviço "Croqui de sondagem" a um responsável.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:36:18.448438	alta	\N
e84f8b9b-e98a-4a9f-9da6-d67e36c566b8	628e0dda-5e56-4000-bfe5-1cf823491580	atribuicao	Responsável pelo serviço atualizado	Administrador atribuiu o serviço "Croqui de sondagem" a um responsável.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:36:18.448521	alta	\N
f72344b0-f8c0-4f27-9069-4f40e9444e30	5ac63994-20e5-4e14-8705-c0899ab7d708	atribuicao	Responsável pelo serviço atualizado	Administrador atribuiu o serviço "Anotação de Responsabilidade Técnica (ART) - CREA/PA" a um responsável.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:36:31.933443	alta	\N
5e47c6cd-f53f-470e-b758-3e08c31629ab	52acd935-18e8-4e7c-8fca-cf5a038d2087	atribuicao	Responsável pelo serviço atualizado	Administrador atribuiu o serviço "Anotação de Responsabilidade Técnica (ART) - CREA/PA" a um responsável.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:36:31.933524	alta	\N
5b54ebd9-dfd5-4f86-8dd2-c601be64a48d	5ac63994-20e5-4e14-8705-c0899ab7d708	agendamento_servico	Serviço agendado	Administrador agendou "Croqui de sondagem" para 22/08/2026 às 04:30.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:36:59.537489	alta	\N
9918627b-1409-4b80-b996-13726b62a926	52acd935-18e8-4e7c-8fca-cf5a038d2087	agendamento_servico	Serviço agendado	Administrador agendou "Croqui de sondagem" para 22/08/2026 às 04:30.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:36:59.53757	alta	\N
8bcdc35d-3cb3-42b5-a48f-c22d3105d136	628e0dda-5e56-4000-bfe5-1cf823491580	agendamento_servico	Serviço agendado	Administrador agendou "Croqui de sondagem" para 22/08/2026 às 04:30.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:36:59.537637	alta	\N
f78feb06-b502-4443-89c3-fa99b5b8a6b5	5ac63994-20e5-4e14-8705-c0899ab7d708	agendamento_servico	Serviço agendado	Administrador agendou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para 25/08/2026 às 04:00.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:37:14.674973	alta	\N
4c7278b3-80af-410f-bdf5-411fd6681533	52acd935-18e8-4e7c-8fca-cf5a038d2087	agendamento_servico	Serviço agendado	Administrador agendou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para 25/08/2026 às 04:00.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:37:14.675059	alta	\N
dae7d5f9-ab29-42f9-84cd-1cb5cd81769e	5ac63994-20e5-4e14-8705-c0899ab7d708	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:37:42.685636	alta	\N
1a9e44f7-585e-4f50-8220-8e0e3afa3781	52acd935-18e8-4e7c-8fca-cf5a038d2087	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:37:42.685718	alta	\N
6534813b-b529-4d31-bcde-fb87c617566f	628e0dda-5e56-4000-bfe5-1cf823491580	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:37:42.685798	alta	\N
3e55cf99-95b4-40c0-8bad-9d5f1fabea76	5ac63994-20e5-4e14-8705-c0899ab7d708	correcao_solicitada	Correções solicitadas	Administrador solicitou correções no documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:38:03.890918	alta	\N
0a70c911-8432-4656-96fd-5ad679d876de	52acd935-18e8-4e7c-8fca-cf5a038d2087	correcao_solicitada	Correções solicitadas	Administrador solicitou correções no documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:38:03.890993	alta	\N
4ac20425-a7b1-4e92-a4d5-5f964712887a	628e0dda-5e56-4000-bfe5-1cf823491580	correcao_solicitada	Correções solicitadas	Administrador solicitou correções no documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:38:03.891066	alta	\N
83439066-74d4-4783-a8b5-5f843790355f	5ac63994-20e5-4e14-8705-c0899ab7d708	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:39:01.228941	alta	\N
5e194cc5-94f9-46c2-9a88-0aee1991bf52	52acd935-18e8-4e7c-8fca-cf5a038d2087	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:39:01.229019	alta	\N
484a3a41-cc5b-4c26-a915-c91266c64344	628e0dda-5e56-4000-bfe5-1cf823491580	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:39:01.229094	alta	\N
8dfce151-1b5d-4769-81a7-608bbe1b6152	5ac63994-20e5-4e14-8705-c0899ab7d708	servico_em_execucao	Serviço iniciado	Deisy alterou "Croqui de sondagem" para em execução.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:40:12.712168	alta	\N
881f110b-bf38-4f4a-bedb-4d39cf7ce602	52acd935-18e8-4e7c-8fca-cf5a038d2087	servico_em_execucao	Serviço iniciado	Deisy alterou "Croqui de sondagem" para em execução.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:40:12.712238	alta	\N
89f97ecf-a4b6-4432-bb62-fb1d49d2a34a	628e0dda-5e56-4000-bfe5-1cf823491580	servico_em_execucao	Serviço iniciado	Deisy alterou "Croqui de sondagem" para em execução.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:40:12.712315	alta	\N
2b5a2034-e584-4f28-b262-f9b10a33f3a6	5ac63994-20e5-4e14-8705-c0899ab7d708	item_os	Serviço da OS atualizado	Deisy atualizou os dados de "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:40:54.246717	alta	\N
606f167b-92f3-416d-aeac-0aca8c6671ec	628e0dda-5e56-4000-bfe5-1cf823491580	item_os	Serviço da OS atualizado	Deisy atualizou os dados de "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:40:54.246967	alta	\N
3ddaa89e-7af1-4afb-aa35-3cbda9e00ea8	52acd935-18e8-4e7c-8fca-cf5a038d2087	item_os	Serviço da OS atualizado	Deisy atualizou os dados de "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:40:54.246867	alta	\N
a3598f72-8387-4b1b-9272-e59ddfa687d9	52acd935-18e8-4e7c-8fca-cf5a038d2087	documento_anexado	Novo documento anexado	Deisy anexou a versão V2 do documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:41:19.187856	alta	\N
7902e39a-3f07-4c26-9608-ba9c9eb67d58	628e0dda-5e56-4000-bfe5-1cf823491580	documento_anexado	Novo documento anexado	Deisy anexou a versão V2 do documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:41:19.187957	alta	\N
5e342f22-67ba-42f2-9371-b7b4b7102bd2	5ac63994-20e5-4e14-8705-c0899ab7d708	documento_anexado	Novo documento anexado	Deisy anexou a versão V2 do documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-20 23:41:19.187762	alta	\N
51d38e8a-7909-4390-986a-f03487d524fb	628e0dda-5e56-4000-bfe5-1cf823491580	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:53:33.547327	normal	\N
c6d1ad8b-6db9-4101-8e01-cabf9a909c7a	5ac63994-20e5-4e14-8705-c0899ab7d708	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:53:33.547159	normal	\N
a68355b3-b6c8-4b57-a07d-0e2e107a4a3a	52acd935-18e8-4e7c-8fca-cf5a038d2087	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:53:33.547242	normal	\N
f8e551ba-464c-4d78-873e-bbf11c0a5c4b	5ac63994-20e5-4e14-8705-c0899ab7d708	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:53:37.472716	normal	\N
f3b56742-132e-427a-9afb-47d4ef56e7a0	52acd935-18e8-4e7c-8fca-cf5a038d2087	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:53:37.472795	normal	\N
c2159f15-37c8-4d96-8b1b-8771354efa3a	628e0dda-5e56-4000-bfe5-1cf823491580	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Croqui de sondagem".	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:53:37.472873	normal	\N
0dae3944-7824-4e93-b6bc-1144d54bacf5	52acd935-18e8-4e7c-8fca-cf5a038d2087	servico_concluido	Serviço concluído	Deisy alterou "Croqui de sondagem" para concluído.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:54:33.510054	alta	\N
533bd2b8-de3c-437b-9ceb-2df703e7171e	628e0dda-5e56-4000-bfe5-1cf823491580	servico_concluido	Serviço concluído	Deisy alterou "Croqui de sondagem" para concluído.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:54:33.510134	alta	\N
c848971f-7e71-434e-ade7-395ed0e2319f	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:08.849039	alta	\N
a963931b-60ba-43e2-9149-529931f35c20	5ac63994-20e5-4e14-8705-c0899ab7d708	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:08.848749	alta	\N
2d15c4f9-65ea-43ea-a66a-a9f4a435962e	628e0dda-5e56-4000-bfe5-1cf823491580	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:08.848955	alta	\N
ce677a87-ad91-4ad5-bd68-a9dc984f449f	52acd935-18e8-4e7c-8fca-cf5a038d2087	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:08.848833	alta	\N
571be801-2a90-42b0-a255-81f126be8764	5ac63994-20e5-4e14-8705-c0899ab7d708	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:32.771047	normal	\N
69c14716-83a8-45fb-8245-1f0605df956a	52acd935-18e8-4e7c-8fca-cf5a038d2087	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:32.771147	normal	\N
cf85ba6e-ca04-4f6c-afd4-bb32f97507ce	628e0dda-5e56-4000-bfe5-1cf823491580	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:32.771239	normal	\N
b8e8d438-91ba-4421-ae7e-5988c7482ad4	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:32.771339	normal	\N
f42765d3-4729-4ac4-9eb4-be5e9036a303	5ac63994-20e5-4e14-8705-c0899ab7d708	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:35.800233	normal	\N
4a2e6958-fa91-44d2-8942-987d21094298	628e0dda-5e56-4000-bfe5-1cf823491580	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:35.800393	normal	\N
34edaf94-3e73-4aa9-a617-93c601908d81	52acd935-18e8-4e7c-8fca-cf5a038d2087	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:35.800311	normal	\N
4f669124-ad52-4831-a571-6fa6f3d8b643	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	revisao_aprovada	Documento revisado com sucesso	Administrador revisou e aprovou internamente o documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:35.800496	normal	\N
4ba0c402-34c3-4b07-bee3-b8ed07887898	5ac63994-20e5-4e14-8705-c0899ab7d708	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:41.135479	alta	\N
c5a4e731-fed3-4a1f-ab6e-624856cc7a05	52acd935-18e8-4e7c-8fca-cf5a038d2087	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:41.135557	alta	\N
59db9caf-3a72-483a-85f0-eb9483f6b16c	628e0dda-5e56-4000-bfe5-1cf823491580	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:41.13563	alta	\N
04ff79e1-3110-4455-bb49-faa719b58a2e	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:41.135704	alta	\N
21e9b506-11ce-4df1-9f00-5df2bfc78dd3	5ac63994-20e5-4e14-8705-c0899ab7d708	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:45.762772	alta	\N
ae76fad0-667c-4f09-af39-0d1e27671dc5	52acd935-18e8-4e7c-8fca-cf5a038d2087	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:45.762847	alta	\N
c938680e-833c-407c-9c47-899ce98db694	628e0dda-5e56-4000-bfe5-1cf823491580	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:45.762919	alta	\N
aa9650ce-0490-4d3b-a496-4192409dc454	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:45.763003	alta	\N
186f512e-01c7-4e5c-860c-b13fcd266f66	52acd935-18e8-4e7c-8fca-cf5a038d2087	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Croqui de sondagem" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:47.729144	alta	\N
5fee140c-a07d-46e5-9ce1-11b0c4e6dd5a	628e0dda-5e56-4000-bfe5-1cf823491580	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Croqui de sondagem" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:47.729219	alta	\N
df1de176-b84e-4fba-8f91-872114de1dd8	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Croqui de sondagem" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:47.729294	alta	\N
e9e68f67-ba2d-4569-9c66-abdc520c556b	5ac63994-20e5-4e14-8705-c0899ab7d708	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Croqui de sondagem" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:55:47.729064	alta	\N
b8d0876e-6dfd-4d06-ba96-0342517e15ee	5ac63994-20e5-4e14-8705-c0899ab7d708	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:56:20.111286	alta	\N
c2f09581-2bd4-4ee2-8eaa-9ef495698621	628e0dda-5e56-4000-bfe5-1cf823491580	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:56:20.111463	alta	\N
52741b5d-fc6d-4baf-a0fa-c8a7bccc4d16	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:56:20.111547	alta	\N
96be2a32-be62-4ac5-8e6d-cc97b3602c82	52acd935-18e8-4e7c-8fca-cf5a038d2087	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:56:20.11139	alta	\N
afdd24a3-bbf8-41d8-a815-edae0e413f12	52acd935-18e8-4e7c-8fca-cf5a038d2087	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:56:22.38123	alta	\N
86d88308-3ac6-4427-a907-9869be5b6390	628e0dda-5e56-4000-bfe5-1cf823491580	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:56:22.381302	alta	\N
aca079c0-5a99-4ace-8c0e-ca45ab982b2f	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:56:22.381376	alta	\N
ea45e41f-97e6-4428-b061-d1cf951cb8c0	5ac63994-20e5-4e14-8705-c0899ab7d708	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:56:22.381153	alta	\N
0a1db108-0476-445b-95dd-7bfc40dd27c3	52acd935-18e8-4e7c-8fca-cf5a038d2087	envio_externo	Documento enviado para análise externa	Administrador enviou "Croqui de sondagem" para Cliente.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:57:43.526867	alta	\N
1b6252df-3c9c-4985-a431-9fa15431ea11	5ac63994-20e5-4e14-8705-c0899ab7d708	servico_concluido	Serviço concluído	Deisy alterou "Croqui de sondagem" para concluído.	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:54:33.509985	alta	\N
d29ff546-a87b-4188-90a9-54310985e589	5ac63994-20e5-4e14-8705-c0899ab7d708	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:56:02.722878	alta	\N
91d4d85d-c7bf-4028-a829-596b41cc78ab	52acd935-18e8-4e7c-8fca-cf5a038d2087	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:56:02.72294	alta	\N
b4979e8e-c69b-4d90-9428-14a640fe3da5	628e0dda-5e56-4000-bfe5-1cf823491580	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:56:02.723006	alta	\N
975aefd7-4a82-4668-84ef-5e589c9d794e	52acd935-18e8-4e7c-8fca-cf5a038d2087	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:56:09.232745	alta	\N
51f9a144-cdc6-473a-8a04-b16dce13716a	628e0dda-5e56-4000-bfe5-1cf823491580	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:56:09.232813	alta	\N
78d83207-3ae6-4498-8b4f-556fed29353f	5ac63994-20e5-4e14-8705-c0899ab7d708	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 03:56:09.232681	alta	\N
ca13b74f-e6c1-44f5-b11f-e4fb7d9e4f13	5ac63994-20e5-4e14-8705-c0899ab7d708	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Croqui de sondagem" (V2).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 04:17:14.011944	alta	\N
cac9664b-47c0-45a9-8189-3ec695c30dd8	52acd935-18e8-4e7c-8fca-cf5a038d2087	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Croqui de sondagem" (V2).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 04:17:14.012024	alta	\N
5a9afaf1-47be-41b9-bd2c-9ef9b6c1daf9	628e0dda-5e56-4000-bfe5-1cf823491580	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Croqui de sondagem" (V2).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 04:17:14.012103	alta	\N
1d982a8d-bd79-4b33-835e-e815b756f816	52acd935-18e8-4e7c-8fca-cf5a038d2087	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Croqui de sondagem" (V2).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 04:17:21.135915	alta	\N
66f2e88e-45a8-402e-acf6-7e4febf7605e	5ac63994-20e5-4e14-8705-c0899ab7d708	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Croqui de sondagem" (V2).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 04:17:21.135831	alta	\N
8cdada47-a6ef-4b45-9414-d3209f45d5ff	628e0dda-5e56-4000-bfe5-1cf823491580	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Croqui de sondagem" (V2).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 04:17:21.135985	alta	\N
e8a92bdd-7dd6-43c7-86d1-5c6acd314cd4	628e0dda-5e56-4000-bfe5-1cf823491580	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 04:17:23.910143	alta	\N
be5869b9-36b4-4733-b04c-4bbbdce05275	5ac63994-20e5-4e14-8705-c0899ab7d708	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 04:17:23.909985	alta	\N
ff0c4715-1b31-4629-b852-eba97898c769	52acd935-18e8-4e7c-8fca-cf5a038d2087	aprovacao	Documento aprovado tecnicamente	Administrador aprovou tecnicamente o documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	2026-08-21 04:17:23.910056	alta	\N
6aa22627-46e3-4c4e-9565-38a9a344ae95	5ac63994-20e5-4e14-8705-c0899ab7d708	atribuicao	Responsável pelo serviço atualizado	Administrador atribuiu o serviço "Anotação de Responsabilidade Técnica (ART) - CREA/PA" a um responsável.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:31:13.78888	alta	\N
c4cda2c8-2c5d-4213-85ad-b001950f5d81	52acd935-18e8-4e7c-8fca-cf5a038d2087	atribuicao	Responsável pelo serviço atualizado	Administrador atribuiu o serviço "Anotação de Responsabilidade Técnica (ART) - CREA/PA" a um responsável.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:31:13.78896	alta	\N
80382fda-2a41-412c-9751-390707c4e30e	628e0dda-5e56-4000-bfe5-1cf823491580	atribuicao	Responsável pelo serviço atualizado	Administrador atribuiu o serviço "Anotação de Responsabilidade Técnica (ART) - CREA/PA" a um responsável.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:31:13.789036	alta	\N
a0cf76fb-ff08-4a4b-9324-710c3610a7b2	628e0dda-5e56-4000-bfe5-1cf823491580	agendamento_servico	Serviço agendado	Administrador agendou "Croqui de sondagem" para 24/08/2026 às 04:30.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:53:07.840032	alta	\N
e22dfad7-39f5-4d5a-9ef1-426395e0dec6	5ac63994-20e5-4e14-8705-c0899ab7d708	agendamento_servico	Serviço agendado	Administrador agendou "Croqui de sondagem" para 24/08/2026 às 04:30.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:53:07.839852	alta	\N
7dab16ea-2c58-4cb4-b28a-e6432fda33cb	52acd935-18e8-4e7c-8fca-cf5a038d2087	agendamento_servico	Serviço agendado	Administrador agendou "Croqui de sondagem" para 24/08/2026 às 04:30.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:53:07.839948	alta	\N
2bbfffc3-f227-41c2-add4-f28ad3c9ff30	5ac63994-20e5-4e14-8705-c0899ab7d708	observacao_servico	Nova observação no serviço	Administrador comentou em "Anotação de Responsabilidade Técnica (ART) - CREA/PA": ssssssssssssssss	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:53:32.142605	normal	\N
a8c44dc0-985c-45a8-b633-051e959a7829	52acd935-18e8-4e7c-8fca-cf5a038d2087	observacao_servico	Nova observação no serviço	Administrador comentou em "Anotação de Responsabilidade Técnica (ART) - CREA/PA": ssssssssssssssss	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:53:32.142693	normal	\N
c4972241-8ff8-40d1-9596-81a969540cad	628e0dda-5e56-4000-bfe5-1cf823491580	observacao_servico	Nova observação no serviço	Administrador comentou em "Anotação de Responsabilidade Técnica (ART) - CREA/PA": ssssssssssssssss	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:53:32.142781	normal	\N
868b3483-0307-40fe-9462-f3ee466da19b	5ac63994-20e5-4e14-8705-c0899ab7d708	agendamento_servico	Serviço agendado	Administrador agendou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para 27/08/2026 às 04:30.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:53:43.235958	alta	\N
ccaeb271-a314-4faf-a66b-c941ef85a2da	628e0dda-5e56-4000-bfe5-1cf823491580	agendamento_servico	Serviço agendado	Administrador agendou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para 27/08/2026 às 04:30.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:53:43.236266	alta	\N
198675cf-8c60-464a-8053-8b2449f6f577	52acd935-18e8-4e7c-8fca-cf5a038d2087	agendamento_servico	Serviço agendado	Administrador agendou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para 27/08/2026 às 04:30.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:53:43.236099	alta	\N
c3e27752-dac0-41bb-ac4e-b4f2314ca147	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	agendamento_servico	Serviço agendado	Administrador agendou "Anotação de Responsabilidade Técnica (ART) - CREA/PA" para 27/08/2026 às 04:30.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:53:43.236183	alta	\N
d2df0f94-8d46-41c9-a9b7-b8572ff1990d	5ac63994-20e5-4e14-8705-c0899ab7d708	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:54:39.636992	alta	\N
56fe7a7b-3dda-47c2-baa8-0bc4c9a71c44	52acd935-18e8-4e7c-8fca-cf5a038d2087	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:54:39.637084	alta	\N
62cae564-cd32-497a-bb81-984ee49ec442	628e0dda-5e56-4000-bfe5-1cf823491580	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:54:39.637171	alta	\N
8f8bfd0a-e7cf-4fe6-9ead-ef5cbeec9036	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	documento_anexado	Novo documento anexado	Administrador anexou a versão V1 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:54:39.637259	alta	\N
854fd768-a710-4455-b07a-c23c101fdc0a	5ac63994-20e5-4e14-8705-c0899ab7d708	envio_externo	Documento enviado para análise externa	Administrador enviou "Croqui de sondagem" para Cliente.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:57:43.526799	alta	\N
8df632c7-2d3b-494b-8722-0ba540997373	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	envio_externo	Documento enviado para análise externa	Administrador enviou "Croqui de sondagem" para Cliente.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:57:43.527043	alta	\N
45b0c2bc-38bd-4581-ace9-32ab76a96a8f	628e0dda-5e56-4000-bfe5-1cf823491580	envio_externo	Documento enviado para análise externa	Administrador enviou "Croqui de sondagem" para Cliente.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:57:43.526968	alta	\N
a9e0ceeb-dbe3-4d36-a632-2b6b5c69e926	5ac63994-20e5-4e14-8705-c0899ab7d708	servico_em_execucao	Serviço iniciado	Deisy alterou "Croqui de sondagem" para em execução.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:58:39.609286	alta	\N
d0375f9d-c993-4c3d-b280-143bb90ffe92	52acd935-18e8-4e7c-8fca-cf5a038d2087	servico_em_execucao	Serviço iniciado	Deisy alterou "Croqui de sondagem" para em execução.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:58:39.609385	alta	\N
532b4240-e62c-4d29-a6f3-a8db7f5b3677	628e0dda-5e56-4000-bfe5-1cf823491580	servico_em_execucao	Serviço iniciado	Deisy alterou "Croqui de sondagem" para em execução.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:58:39.609488	alta	\N
e5dd61d1-8543-4ac7-aec2-7fc3da4536a7	5ac63994-20e5-4e14-8705-c0899ab7d708	servico_concluido	Serviço concluído	Deisy alterou "Croqui de sondagem" para concluído.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:59:11.768118	alta	\N
d95275a7-0812-425c-871f-69f04a0d3ea5	52acd935-18e8-4e7c-8fca-cf5a038d2087	servico_concluido	Serviço concluído	Deisy alterou "Croqui de sondagem" para concluído.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:59:11.768215	alta	\N
89216e88-2d89-4873-810a-abd1b139b73c	628e0dda-5e56-4000-bfe5-1cf823491580	servico_concluido	Serviço concluído	Deisy alterou "Croqui de sondagem" para concluído.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 04:59:11.768318	alta	\N
3b858f33-001c-4b6f-a02d-faa0634a479c	5ac63994-20e5-4e14-8705-c0899ab7d708	FINANCE_UPDATE	Nota Fiscal anexada	NF null anexada ao lançamento de Barco Teste1.	f	\N	2026-08-21 05:14:24.676	normal	\N
620acf86-87af-43f5-ae0e-5d50c2988a92	52acd935-18e8-4e7c-8fca-cf5a038d2087	FINANCE_UPDATE	Nota Fiscal anexada	NF null anexada ao lançamento de Barco Teste1.	f	\N	2026-08-21 05:14:24.676	normal	\N
ad8d936f-383c-47f5-a752-677850d86de1	628e0dda-5e56-4000-bfe5-1cf823491580	FINANCE_UPDATE	Nota Fiscal anexada	NF null anexada ao lançamento de Barco Teste1.	f	\N	2026-08-21 05:14:24.676	normal	\N
a937ebca-5fb0-4dcf-9d2f-e79e54ca49f7	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	exigencia	Correção externa solicitada	Administrador registrou uma exigência externa: hgyrtyry	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:20:12.11407	critica	\N
091ce0e7-9b0d-48b9-a8d4-1bb409ff7fbb	52acd935-18e8-4e7c-8fca-cf5a038d2087	exigencia	Correção externa solicitada	Administrador registrou uma exigência externa: hgyrtyry	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:20:12.113996	critica	\N
3081240b-be61-4f7f-9859-02e128160aeb	628e0dda-5e56-4000-bfe5-1cf823491580	exigencia	Correção externa solicitada	Administrador registrou uma exigência externa: hgyrtyry	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:20:12.114138	critica	\N
32ea0533-6d21-4704-8bb1-64bf6e1e49cc	5ac63994-20e5-4e14-8705-c0899ab7d708	exigencia	Correção externa solicitada	Administrador registrou uma exigência externa: hgyrtyry	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:20:12.113921	critica	\N
c0c4372e-ca3c-4e93-8c1d-eea8c8e07342	5ac63994-20e5-4e14-8705-c0899ab7d708	documento_anexado	Novo documento anexado	Administrador anexou a versão V2 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:21:10.527868	alta	\N
3dcd97e1-8694-4794-bbbf-945e3dd43a2c	628e0dda-5e56-4000-bfe5-1cf823491580	documento_anexado	Novo documento anexado	Administrador anexou a versão V2 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:21:10.528082	alta	\N
b05a0698-071a-4398-9f34-e1d686e240d5	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	documento_anexado	Novo documento anexado	Administrador anexou a versão V2 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:21:10.528005	alta	\N
b2aa288b-0bfe-47df-bee4-2ab909d4f870	52acd935-18e8-4e7c-8fca-cf5a038d2087	documento_anexado	Novo documento anexado	Administrador anexou a versão V2 do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:21:10.527944	alta	\N
3e1d1867-24ee-4ee9-a376-22f5a5c59cb4	5ac63994-20e5-4e14-8705-c0899ab7d708	correcao_solicitada	Correções solicitadas	Administrador solicitou correções no documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:21:21.495173	alta	\N
445840bb-6361-4080-be06-6aa3ab9ea295	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	correcao_solicitada	Correções solicitadas	Administrador solicitou correções no documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:21:21.49533	alta	\N
90317be0-7349-4f53-aa82-02789e3cb214	52acd935-18e8-4e7c-8fca-cf5a038d2087	correcao_solicitada	Correções solicitadas	Administrador solicitou correções no documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:21:21.495253	alta	\N
f073be43-0f01-46ef-9e34-4f8e11bd7a67	628e0dda-5e56-4000-bfe5-1cf823491580	correcao_solicitada	Correções solicitadas	Administrador solicitou correções no documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:21:21.495401	alta	\N
9ab5d3d4-05bb-4e71-9ef1-87b7dcf7e6e3	628e0dda-5e56-4000-bfe5-1cf823491580	documento_anexado	Novo documento anexado	Administrador anexou a versão V2 do documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:22:16.221573	alta	\N
18e5fa1a-7cf2-464c-b782-7fc007b29d9b	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	documento_anexado	Novo documento anexado	Administrador anexou a versão V2 do documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:22:16.221509	alta	\N
b83d66d5-3f11-421d-8214-509e209f0c20	52acd935-18e8-4e7c-8fca-cf5a038d2087	documento_anexado	Novo documento anexado	Administrador anexou a versão V2 do documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:22:16.221425	alta	\N
eb28bbb2-f890-41bf-b08a-b3d6651c674c	5ac63994-20e5-4e14-8705-c0899ab7d708	documento_anexado	Novo documento anexado	Administrador anexou a versão V2 do documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:22:16.221337	alta	\N
de7a9705-fb12-4512-8e35-87e38a8d142b	52acd935-18e8-4e7c-8fca-cf5a038d2087	correcao_solicitada	Correções solicitadas	Administrador solicitou correções no documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:22:21.618346	alta	\N
9528ce11-22b4-4bcd-a08b-79510c3abb2b	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	correcao_solicitada	Correções solicitadas	Administrador solicitou correções no documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:22:21.618418	alta	\N
cc6cb043-ffe9-4c48-9597-0d2e610a38a5	628e0dda-5e56-4000-bfe5-1cf823491580	correcao_solicitada	Correções solicitadas	Administrador solicitou correções no documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:22:21.618487	alta	\N
6e4b14f0-81c8-4d98-894c-3f4a77f4ec7f	5ac63994-20e5-4e14-8705-c0899ab7d708	correcao_solicitada	Correções solicitadas	Administrador solicitou correções no documento "Croqui de sondagem".	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 05:22:21.618264	alta	\N
3557c7e2-c455-4f05-987b-b390a54037f4	52acd935-18e8-4e7c-8fca-cf5a038d2087	servico_em_execucao	Serviço iniciado	Administrador alterou "Croqui de sondagem" para em execução.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 06:06:55.215638	alta	\N
56ec9184-4b1a-490d-a2d9-a2042488c9c1	5ac63994-20e5-4e14-8705-c0899ab7d708	servico_em_execucao	Serviço iniciado	Administrador alterou "Croqui de sondagem" para em execução.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 06:06:55.215546	alta	\N
c2c4f94c-f9e7-4e8e-80a7-9477ff433f1f	628e0dda-5e56-4000-bfe5-1cf823491580	servico_em_execucao	Serviço iniciado	Administrador alterou "Croqui de sondagem" para em execução.	f	4caaa7dc-df1e-4c07-904b-f3b522db605c	2026-08-21 06:06:55.215749	alta	\N
\.


--
-- Data for Name: os_events; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.os_events (id, os_id, tipo, autor_id, autor_nome, descricao, dados, created_at) FROM stdin;
d6d610ff-3da3-48a0-ba1c-b291558e2bd8	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	criacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Ordem de Serviço criada a partir do aceite da proposta DS 051/26.	{"meio": "presencial", "valorRecebido": 2150, "situacaoFinanceira": "parcial"}	2026-08-20 23:35:27.709055
4ac908a4-4c2a-4f6b-ac33-58dab03d0e82	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	item_os	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Item "Anotação de Responsabilidade Técnica (ART) - CREA/PA" atualizado para pendente.	{}	2026-08-20 23:35:46.357873
f00a7983-c536-4fd7-8074-d7d8c78eca4b	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	item_os	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Item "Croqui de sondagem" atualizado para pendente.	{}	2026-08-20 23:36:18.444072
8ff3ad2d-1272-483c-a1d4-bf2e9792dad6	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	item_os	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Item "Anotação de Responsabilidade Técnica (ART) - CREA/PA" atualizado para pendente.	{}	2026-08-20 23:36:31.922389
7fe7b53a-f148-4526-92e0-16c6ce58159a	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	agendamento_servico	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Serviço "Croqui de sondagem" agendado para 2026-08-22 às 04:30.	{"itemId": "ec694f5e-2af0-4bf3-8f86-333bc3c27453"}	2026-08-20 23:36:59.52657
9be6e0f5-fb7d-4676-a2d5-8a1e2b909877	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	agendamento_servico	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Serviço "Anotação de Responsabilidade Técnica (ART) - CREA/PA" agendado para 2026-08-25 às 04:00.	{"itemId": "b8dedbf3-5e9b-48b8-a5d4-39f8981d5aad"}	2026-08-20 23:37:14.670544
5f650338-0f7c-48ba-aca4-f00d7ec95932	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	upload	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Nova versão V1 anexada ao documento "Croqui de sondagem".	{"origem": "correcao_interna", "versao": 1, "documentoId": "c0a88bdd-ec4c-4ef9-8d08-2c8a715ca5c0"}	2026-08-20 23:37:42.681105
1e0f9c4b-878b-42ef-9c89-1e8e271e7774	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	revisao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Revisão do documento "Croqui de sondagem" apontou correções.	{"aprovado": false, "comentario": "", "documentoId": "c0a88bdd-ec4c-4ef9-8d08-2c8a715ca5c0"}	2026-08-20 23:38:03.879171
8153ced8-f360-4ff3-9dcb-e3e4d14996fa	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	upload	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Nova versão V1 anexada ao documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	{"origem": "correcao_interna", "versao": 1, "documentoId": "6a8b345e-dcfb-4333-a2de-5bd84aa267fb"}	2026-08-20 23:39:01.224856
b772bb69-2957-4d5e-89f3-08ab6d8208ca	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	item_os	628e0dda-5e56-4000-bfe5-1cf823491580	Deisy	Item "Croqui de sondagem" atualizado para em_execucao.	{}	2026-08-20 23:40:12.706826
964942bb-c76e-494c-9408-ff3721d53c3e	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	item_os	628e0dda-5e56-4000-bfe5-1cf823491580	Deisy	Item "Croqui de sondagem" atualizado para em_execucao.	{}	2026-08-20 23:40:54.23478
19235cb1-2e20-4115-8e97-4aad1111df9f	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	upload	628e0dda-5e56-4000-bfe5-1cf823491580	Deisy	Nova versão V2 anexada ao documento "Croqui de sondagem".	{"origem": "correcao_interna", "versao": 2, "documentoId": "c0a88bdd-ec4c-4ef9-8d08-2c8a715ca5c0"}	2026-08-20 23:41:19.183716
4449b294-23f3-43f4-a4b8-184f7b2a2484	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	revisao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Revisão interna do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" concluída.	{"aprovado": true, "comentario": "", "documentoId": "6a8b345e-dcfb-4333-a2de-5bd84aa267fb"}	2026-08-21 03:53:33.542787
a4101d12-d2fc-40c3-b912-05f31e855478	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	revisao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Revisão interna do documento "Croqui de sondagem" concluída.	{"aprovado": true, "comentario": "", "documentoId": "c0a88bdd-ec4c-4ef9-8d08-2c8a715ca5c0"}	2026-08-21 03:53:37.468595
ec4d2685-bf72-4465-a6d3-d89bca8a88e9	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	item_os	628e0dda-5e56-4000-bfe5-1cf823491580	Deisy	Item "Croqui de sondagem" atualizado para concluido.	{}	2026-08-21 03:54:33.506922
097864d7-1fb9-4e66-83ba-29ac3dc9653e	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	aprovacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Aprovação técnica do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	{"versao": 1, "documentoId": "6a8b345e-dcfb-4333-a2de-5bd84aa267fb"}	2026-08-21 03:56:02.719718
c3309d99-2f8d-4ac7-a0e9-dac8b598ad12	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	aprovacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Aprovação técnica do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	{"versao": 1, "documentoId": "6a8b345e-dcfb-4333-a2de-5bd84aa267fb"}	2026-08-21 03:56:09.229465
d94ffc5b-c245-4a2b-846b-e72082d4cbfe	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	aprovacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Aprovação técnica do documento "Croqui de sondagem" (V2).	{"versao": 2, "documentoId": "c0a88bdd-ec4c-4ef9-8d08-2c8a715ca5c0"}	2026-08-21 04:17:14.001456
e33f0a9f-da50-46f6-a4d4-153d0df22459	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	aprovacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Aprovação técnica do documento "Croqui de sondagem" (V2).	{"versao": 2, "documentoId": "c0a88bdd-ec4c-4ef9-8d08-2c8a715ca5c0"}	2026-08-21 04:17:21.131998
f34b2c6e-4139-45bf-807a-554c30f0c773	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	aprovacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Aprovação técnica do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	{"versao": 1, "documentoId": "6a8b345e-dcfb-4333-a2de-5bd84aa267fb"}	2026-08-21 04:17:23.906993
fe5b5312-5aff-4b18-bbf4-498c3b222452	4caaa7dc-df1e-4c07-904b-f3b522db605c	criacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Ordem de Serviço criada a partir do aceite da proposta DS 052/26.	{"meio": "presencial", "valorRecebido": 1390.09, "situacaoFinanceira": "parcial"}	2026-08-21 04:30:03.961756
a5eb1201-c5d4-45c8-ae22-07a85124c9c1	4caaa7dc-df1e-4c07-904b-f3b522db605c	item_os	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Item "Anotação de Responsabilidade Técnica (ART) - CREA/PA" atualizado para pendente.	{}	2026-08-21 04:31:13.784752
39dbae9d-6ebf-4ae5-b83c-24663aa88639	4caaa7dc-df1e-4c07-904b-f3b522db605c	agendamento_servico	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Serviço "Croqui de sondagem" agendado para 2026-08-24 às 04:30.	{"itemId": "7eacce09-0986-4ba2-ab52-1fe112069428"}	2026-08-21 04:53:07.834418
3d7ab785-594e-4cd6-9470-4bbfdbce9188	4caaa7dc-df1e-4c07-904b-f3b522db605c	observacao_servico	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Administrador adicionou uma observação em "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	{"itemId": "6bf0ec07-d78c-459e-85ba-1f473993e075", "commentId": "3bfc9c17-f98d-426c-86eb-1afb2980f780"}	2026-08-21 04:53:32.138141
e173c97a-b41f-44c2-8d39-078af8ffa255	4caaa7dc-df1e-4c07-904b-f3b522db605c	agendamento_servico	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Serviço "Anotação de Responsabilidade Técnica (ART) - CREA/PA" agendado para 2026-08-27 às 04:30.	{"itemId": "6bf0ec07-d78c-459e-85ba-1f473993e075"}	2026-08-21 04:53:43.224272
8b20d38e-47fa-4f13-bdaf-b5c123b34bbe	4caaa7dc-df1e-4c07-904b-f3b522db605c	upload	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Nova versão V1 anexada ao documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	{"origem": "correcao_interna", "versao": 1, "documentoId": "8a533d5f-4784-4739-9844-d3b61fb858e6"}	2026-08-21 04:54:39.632531
107151f7-f35c-4849-b278-ee3865c77a10	4caaa7dc-df1e-4c07-904b-f3b522db605c	upload	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Nova versão V1 anexada ao documento "Croqui de sondagem".	{"origem": "correcao_interna", "versao": 1, "documentoId": "c0fb8b46-0b1c-45b9-b73f-45d20b83927b"}	2026-08-21 04:55:08.844146
3137d457-46bc-4eb8-ba0e-777e25916889	4caaa7dc-df1e-4c07-904b-f3b522db605c	revisao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Revisão interna do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" concluída.	{"aprovado": true, "comentario": "", "documentoId": "8a533d5f-4784-4739-9844-d3b61fb858e6"}	2026-08-21 04:55:32.758735
5e413938-12e7-4504-99cd-efba524a1508	4caaa7dc-df1e-4c07-904b-f3b522db605c	revisao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Revisão interna do documento "Croqui de sondagem" concluída.	{"aprovado": true, "comentario": "", "documentoId": "c0fb8b46-0b1c-45b9-b73f-45d20b83927b"}	2026-08-21 04:55:35.794328
e4144f01-d32a-44e6-99aa-b7a2647e102c	4caaa7dc-df1e-4c07-904b-f3b522db605c	aprovacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Aprovação técnica do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	{"versao": 1, "documentoId": "8a533d5f-4784-4739-9844-d3b61fb858e6"}	2026-08-21 04:55:41.131012
f7d45037-e8fe-4f8a-b24e-5f696812d1ca	4caaa7dc-df1e-4c07-904b-f3b522db605c	aprovacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Aprovação técnica do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	{"versao": 1, "documentoId": "8a533d5f-4784-4739-9844-d3b61fb858e6"}	2026-08-21 04:55:45.758631
86bf17fd-f81d-43d4-bb17-52e2dd4b709c	4caaa7dc-df1e-4c07-904b-f3b522db605c	aprovacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Aprovação técnica do documento "Croqui de sondagem" (V1).	{"versao": 1, "documentoId": "c0fb8b46-0b1c-45b9-b73f-45d20b83927b"}	2026-08-21 04:55:47.724063
5bc40d12-a758-4da7-878c-618fc4b0138f	4caaa7dc-df1e-4c07-904b-f3b522db605c	aprovacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Aprovação técnica do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	{"versao": 1, "documentoId": "8a533d5f-4784-4739-9844-d3b61fb858e6"}	2026-08-21 04:56:20.106566
6a179d8d-27db-4bb7-a3c1-a2dafabf301e	4caaa7dc-df1e-4c07-904b-f3b522db605c	aprovacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Aprovação técnica do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" (V1).	{"versao": 1, "documentoId": "8a533d5f-4784-4739-9844-d3b61fb858e6"}	2026-08-21 04:56:22.376824
0fb3791b-1c05-4fe8-b31d-6e1daaee9d5e	4caaa7dc-df1e-4c07-904b-f3b522db605c	envio_externo	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Envio externo registrado: V1 para Cliente (protocolo: RK-5435346).	{"submissaoId": "106a0f63-d397-4cf1-8ff5-0b78928b4c0b"}	2026-08-21 04:57:43.516033
5c63e26c-aa71-49d0-a392-4a98e5b8b536	4caaa7dc-df1e-4c07-904b-f3b522db605c	item_os	628e0dda-5e56-4000-bfe5-1cf823491580	Deisy	Item "Croqui de sondagem" atualizado para em_execucao.	{}	2026-08-21 04:58:39.603427
f563afc2-4df2-4142-abea-f923df6290e4	4caaa7dc-df1e-4c07-904b-f3b522db605c	item_os	628e0dda-5e56-4000-bfe5-1cf823491580	Deisy	Item "Croqui de sondagem" atualizado para concluido.	{}	2026-08-21 04:59:11.763507
98c3c08d-0ce5-43a8-857f-4bac9d501026	4caaa7dc-df1e-4c07-904b-f3b522db605c	exigencia	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Exigência externa registrada: hgyrtyry. Nova versão necessária.	{"submissaoId": "106a0f63-d397-4cf1-8ff5-0b78928b4c0b"}	2026-08-21 05:20:12.110195
2fe4469b-af82-41c7-8ce2-f82756da65a2	4caaa7dc-df1e-4c07-904b-f3b522db605c	upload	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Nova versão V2 anexada ao documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA".	{"origem": "exigencia_externa", "versao": 2, "documentoId": "8a533d5f-4784-4739-9844-d3b61fb858e6"}	2026-08-21 05:21:10.524059
cb52e378-35a4-4bc9-8650-15ae5268249b	4caaa7dc-df1e-4c07-904b-f3b522db605c	revisao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Revisão do documento "Anotação de Responsabilidade Técnica (ART) - CREA/PA" apontou correções.	{"aprovado": false, "comentario": "", "documentoId": "8a533d5f-4784-4739-9844-d3b61fb858e6"}	2026-08-21 05:21:21.491324
4166ec48-71c5-422a-94d8-02978d63045b	4caaa7dc-df1e-4c07-904b-f3b522db605c	upload	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Nova versão V2 anexada ao documento "Croqui de sondagem".	{"origem": "correcao_interna", "versao": 2, "documentoId": "c0fb8b46-0b1c-45b9-b73f-45d20b83927b"}	2026-08-21 05:22:16.21786
262cf69b-73a7-44c1-9931-793b480df5e4	4caaa7dc-df1e-4c07-904b-f3b522db605c	revisao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Revisão do documento "Croqui de sondagem" apontou correções.	{"aprovado": false, "comentario": "", "documentoId": "c0fb8b46-0b1c-45b9-b73f-45d20b83927b"}	2026-08-21 05:22:21.614234
816d2e15-d326-4086-879c-4521cd1f59a9	4caaa7dc-df1e-4c07-904b-f3b522db605c	item_os	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Item "Croqui de sondagem" atualizado para em_execucao.	{}	2026-08-21 06:06:55.211669
66f321b5-1314-4c87-a824-7346708b8ff4	c2be3112-3678-40dd-a77f-24159c08b704	criacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Ordem de Serviço criada a partir do aceite da proposta DS 053/26.	{"meio": "presencial", "valorRecebido": 700, "situacaoFinanceira": "parcial"}	2026-08-21 06:07:50.130479
a38b6545-52d3-46e0-b68d-8e5f3c473f00	177b6282-675d-4231-bec6-cb1112b18d5d	criacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Ordem de Serviço criada a partir do aceite da proposta DS 054/26.	{"meio": "presencial", "valorRecebido": 1900, "situacaoFinanceira": "parcial"}	2026-08-21 06:20:32.239782
6fefebee-07b7-4aff-971b-ffe377be27f2	3f38b1b2-c341-4d9c-be9c-464db79881ff	criacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Ordem de Serviço criada a partir do aceite da proposta DS 055/26.	{"meio": "presencial", "valorRecebido": 1000, "situacaoFinanceira": "parcial"}	2026-08-21 06:36:29.496782
297dbd4a-5bc9-4bc4-963d-c91f934097ab	22157892-9a20-4533-a4db-8b85cfb26134	criacao	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	Ordem de Serviço criada a partir do aceite da proposta DS 056/26.	{"meio": "presencial", "valorRecebido": 1500, "situacaoFinanceira": "parcial"}	2026-08-21 06:38:13.94426
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.payments (id, conta_receber_id, proposta_id, os_id, embarcacao_id, valor, data, forma_pagamento, observacao, lancado_por_nome, created_at, updated_at) FROM stdin;
038266e3-a3d2-48fd-9d06-246cf7b38cf7	70d7491e-c7b9-4bad-be98-97fa6bac8f05	ec3b15a4-c309-4198-9689-99f08834b210	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	2150.00	2026-08-20	PIX	Pagamento registrado no aceite da proposta DS 051/26	Administrador	2026-08-20 23:35:27.709055	2026-08-20 23:35:27.709055
4517ef32-cf17-48ca-b813-3b89ded29fd4	f0e455fd-af8b-4637-a343-43345b2a7aaa	75f46220-90eb-48d9-bf1d-0d2e212a8251	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	1390.09	2026-08-21	PIX	Pagamento registrado no aceite da proposta DS 052/26	Administrador	2026-08-21 04:30:03.961756	2026-08-21 04:30:03.961756
0ee74cd7-b2e6-4e85-8773-d5ca2fb4cc3b	db5841c6-c6c7-4137-98dc-666a782d0295	a69b3c52-2bf0-451c-b517-fe17d58bc4bc	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	700.00	2026-08-21	PIX	Pagamento registrado no aceite da proposta DS 053/26	Administrador	2026-08-21 06:07:50.130479	2026-08-21 06:07:50.130479
566a48ac-53fb-48ec-a1a1-32e8edaf1a9e	d9ba4c6d-80c5-4b27-bbf9-85a4cd9e7771	e8321e30-538a-48f1-b60e-0f12dbe5f8e4	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	1900.00	2026-08-21	PIX	Pagamento registrado no aceite da proposta DS 054/26	Administrador	2026-08-21 06:20:32.239782	2026-08-21 06:20:32.239782
d2770bf3-3efd-4a3d-8732-cc63336961b0	b57b5490-f220-448f-9896-3fd1956d045e	59cfc4fc-f649-47f5-a080-7f38a1e0fde2	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	1000.00	2026-08-21	PIX	Pagamento registrado no aceite da proposta DS 055/26	Administrador	2026-08-21 06:36:29.496782	2026-08-21 06:36:29.496782
11840fa8-e83a-4b97-a26a-ae7b58b81f5b	475bb970-2408-49e8-8900-d55171e7acda	60df4929-3c43-477a-ad1c-9af84f42757e	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	1500.00	2026-08-21	PIX	Pagamento registrado no aceite da proposta DS 056/26	Administrador	2026-08-21 06:38:13.94426	2026-08-21 06:38:13.94426
\.


--
-- Data for Name: proposal_acceptances; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.proposal_acceptances (id, proposta_id, meio, responsavel_nome, data, observacao, usuario_id, usuario_nome, documento_url, documento_nome, origem, created_at, updated_at) FROM stdin;
a4307377-4e5b-4153-b91d-b76e20631f28	ec3b15a4-c309-4198-9689-99f08834b210	presencial	Rosano Souza	2026-08-20		52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	\N	\N	normal	2026-08-20 23:35:27.709055	2026-08-20 23:35:27.709055
a30b5504-c282-4733-b7a1-2e9ade625bd3	75f46220-90eb-48d9-bf1d-0d2e212a8251	presencial	Rosano Souza	2026-08-21		52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	/api/proposals/75f46220-90eb-48d9-bf1d-0d2e212a8251/acceptance-document/1787286603954-583380662-Proposta_DS_052_26_final2.pdf	Proposta_DS_052_26_final2.pdf	normal	2026-08-21 04:30:03.961756	2026-08-21 04:30:03.961756
6776a18f-cb0c-4676-b009-38671d34ccb8	a69b3c52-2bf0-451c-b517-fe17d58bc4bc	presencial	Rosano Souza	2026-08-21		52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	\N	\N	normal	2026-08-21 06:07:50.130479	2026-08-21 06:07:50.130479
7e7a4830-d691-4b35-8fbd-2c373ec8f33d	e8321e30-538a-48f1-b60e-0f12dbe5f8e4	presencial	Rosano Souza	2026-08-21		52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	\N	\N	normal	2026-08-21 06:20:32.239782	2026-08-21 06:20:32.239782
c445d471-e148-46ef-8ee0-707f782b00f3	59cfc4fc-f649-47f5-a080-7f38a1e0fde2	presencial	Rosano Souza	2026-08-21		52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	\N	\N	normal	2026-08-21 06:36:29.496782	2026-08-21 06:36:29.496782
ea35b644-dc05-468d-9599-f4643b5deaec	60df4929-3c43-477a-ad1c-9af84f42757e	presencial	Rosano Souza	2026-08-21		52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	\N	\N	normal	2026-08-21 06:38:13.94426	2026-08-21 06:38:13.94426
\.


--
-- Data for Name: proposal_deliveries; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.proposal_deliveries (id, proposta_id, canal, destinatario, status, erro, usuario_id, usuario_nome, data, created_at, updated_at) FROM stdin;
2556a867-624b-4efd-8a21-d8c45dd9a6ab	ec3b15a4-c309-4198-9689-99f08834b210	whatsapp	Rosano	enviado	\N	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	2026-08-20 23:18:59.398353	2026-08-20 23:18:59.398353	2026-08-20 23:18:59.398353
0834aa46-0c01-4878-85d9-fac8fe2ec63d	ec3b15a4-c309-4198-9689-99f08834b210	whatsapp	Rosano	enviado	\N	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	2026-08-20 23:19:15.58263	2026-08-20 23:19:15.58263	2026-08-20 23:19:15.58263
c90dbea4-f66c-4f7f-a6be-c762de0c74f5	ec3b15a4-c309-4198-9689-99f08834b210	whatsapp	5591989340275	enviado	\N	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	2026-08-20 23:34:21.311801	2026-08-20 23:34:21.311801	2026-08-20 23:34:21.311801
\.


--
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.proposals (id, numero, data_emissao, validade_dias, embarcacao_id, embarcacao_nome, cliente_nome, destinatario, assunto, prazo_entrega_dias, condicoes_pagamento, status, itens, valor_total, observacoes, created_at, updated_at, ano, elaborado_por, aceite_data, aceite_assinatura_nome, cliente_id, os_id, embarcacoes_ids, renovacao_de_id, valor_desconto) FROM stdin;
75f46220-90eb-48d9-bf1d-0d2e212a8251	DS 052/26	21 de agosto de 2026	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	Rosano Souza	Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação Barco Teste1.	10	Pagamento de 50% de sinal no aceite da proposta + 50% na entrega e homologação dos relatórios.	aprovado	[{"id": "3c630da0-6adc-4dc9-b3e0-c58c3701d1f9-1787286546211", "descricao": "Anotação de Responsabilidade Técnica (ART) - CREA/PA", "serviceId": "3c630da0-6adc-4dc9-b3e0-c58c3701d1f9", "quantidade": 1, "valorUnitario": 800}, {"id": "d63e4406-976e-4455-a91d-81cc2cb9b40e-1787286549995", "descricao": "Croqui de sondagem", "serviceId": "d63e4406-976e-4455-a91d-81cc2cb9b40e", "quantidade": 1, "valorUnitario": 4500}]	5300.00	- Início do serviço após aceite formal e pagamento do sinal (cobre taxas de ART e despesas de escritório).\n- Despesas de transporte, alimentação e estadia ficam a cargo do armador, quando aplicável.\n- A embarcação deve estar com compartimentos limpos e secos para a realização dos serviços.\n- Cliente deve fornecer dados completos dos armadores e/ou proprietários.\n- Se o processo for paralisado por pendência do armador/proprietário, o pagamento das parcelas deve continuar até quitação total.\n- Proposta válida por 30 dias a contar da data de emissão.	2026-08-21 04:29:13.344113	2026-08-21 04:30:03.962	2026	Deisy Saldanha - Administrativo/Financeiro	2026-08-21	Rosano Souza	\N	4caaa7dc-df1e-4c07-904b-f3b522db605c	["9465f0ca-eec4-40fb-a7e6-42d549b0b307"]	\N	0.00
ec3b15a4-c309-4198-9689-99f08834b210	DS 051/26	20 de agosto de 2026	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	A/C: Rosano Souza	Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação Barco Teste1.	10	Pagamento de 50% de sinal no aceite da proposta + 50% na entrega e homologação dos relatórios.	aprovado	[{"id": "3c630da0-6adc-4dc9-b3e0-c58c3701d1f9-1787267786610", "descricao": "Anotação de Responsabilidade Técnica (ART) - CREA/PA", "serviceId": "3c630da0-6adc-4dc9-b3e0-c58c3701d1f9", "quantidade": 1, "valorUnitario": 800}, {"id": "d63e4406-976e-4455-a91d-81cc2cb9b40e-1787267792608", "descricao": "Croqui de sondagem", "serviceId": "d63e4406-976e-4455-a91d-81cc2cb9b40e", "quantidade": 1, "valorUnitario": 4500}]	4300.00	- Início do serviço após aceite formal e pagamento do sinal (cobre taxas de ART e despesas de escritório).\n- Despesas de transporte, alimentação e estadia ficam a cargo do armador, quando aplicável.\n- A embarcação deve estar com compartimentos limpos e secos para a realização dos serviços.\n- Cliente deve fornecer dados completos dos armadores e/ou proprietários.\n- Se o processo for paralisado por pendência do armador/proprietário, o pagamento das parcelas deve continuar até quitação total.\n- Proposta válida por 30 dias a contar da data de emissão.	2026-08-20 23:16:40.717823	2026-08-20 23:35:27.709	2026	Deisy Saldanha - Administrativo/Financeiro	2026-08-20	Rosano Souza	\N	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	["9465f0ca-eec4-40fb-a7e6-42d549b0b307"]	\N	1000.00
a69b3c52-2bf0-451c-b517-fe17d58bc4bc	DS 053/26	21 de agosto de 2026	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	A/C: Rosano Souza	Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação Barco Teste1.	10	Pagamento de 50% de sinal no aceite da proposta + 50% na entrega e homologação dos relatórios.	aprovado	[{"id": "d63e4406-976e-4455-a91d-81cc2cb9b40e-1787292438879", "descricao": "Croqui de sondagem", "serviceId": "d63e4406-976e-4455-a91d-81cc2cb9b40e", "quantidade": 1, "valorUnitario": 4500}, {"id": "e0948cc6-5efd-4dc2-b731-27311058f5fc-1787292440456", "descricao": "Declaração de responsabilidade técnica", "serviceId": "e0948cc6-5efd-4dc2-b731-27311058f5fc", "quantidade": 1, "valorUnitario": 1200}]	5700.00	- Início do serviço após aceite formal e pagamento do sinal (cobre taxas de ART e despesas de escritório).\n- Despesas de transporte, alimentação e estadia ficam a cargo do armador, quando aplicável.\n- A embarcação deve estar com compartimentos limpos e secos para a realização dos serviços.\n- Cliente deve fornecer dados completos dos armadores e/ou proprietários.\n- Se o processo for paralisado por pendência do armador/proprietário, o pagamento das parcelas deve continuar até quitação total.\n- Proposta válida por 30 dias a contar da data de emissão.	2026-08-21 06:07:30.096158	2026-08-21 06:07:50.13	2026	Deisy Saldanha - Administrativo/Financeiro	2026-08-21	Rosano Souza	\N	c2be3112-3678-40dd-a77f-24159c08b704	["9465f0ca-eec4-40fb-a7e6-42d549b0b307"]	\N	0.00
e8321e30-538a-48f1-b60e-0f12dbe5f8e4	DS 054/26	21 de agosto de 2026	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	A/C: Rosano Souza	Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação Barco Teste1.	10	Pagamento de 50% de sinal no aceite da proposta + 50% na entrega e homologação dos relatórios.	aprovado	[{"id": "ed417b6a-7c6a-47a9-ab9f-52d50bfaa4a9-1787293129625", "descricao": "Certificado de homologação nas certificadoras", "serviceId": "ed417b6a-7c6a-47a9-ab9f-52d50bfaa4a9", "quantidade": 1, "valorUnitario": 3500}, {"id": "e0948cc6-5efd-4dc2-b731-27311058f5fc-1787293131811", "descricao": "Declaração de responsabilidade técnica", "serviceId": "e0948cc6-5efd-4dc2-b731-27311058f5fc", "quantidade": 1, "valorUnitario": 1200}, {"id": "e0948cc6-5efd-4dc2-b731-27311058f5fc-1787293133591", "descricao": "Declaração de responsabilidade técnica", "serviceId": "e0948cc6-5efd-4dc2-b731-27311058f5fc", "quantidade": 1, "valorUnitario": 1200}]	5900.00	- Início do serviço após aceite formal e pagamento do sinal (cobre taxas de ART e despesas de escritório).\n- Despesas de transporte, alimentação e estadia ficam a cargo do armador, quando aplicável.\n- A embarcação deve estar com compartimentos limpos e secos para a realização dos serviços.\n- Cliente deve fornecer dados completos dos armadores e/ou proprietários.\n- Se o processo for paralisado por pendência do armador/proprietário, o pagamento das parcelas deve continuar até quitação total.\n- Proposta válida por 30 dias a contar da data de emissão.	2026-08-21 06:20:13.359559	2026-08-21 06:20:32.24	2026	Deisy Saldanha - Administrativo/Financeiro	2026-08-21	Rosano Souza	\N	177b6282-675d-4231-bec6-cb1112b18d5d	["9465f0ca-eec4-40fb-a7e6-42d549b0b307"]	\N	0.00
59cfc4fc-f649-47f5-a080-7f38a1e0fde2	DS 055/26	21 de agosto de 2026	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	Rosano Souza	Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação Barco Teste1.	10	Pagamento de 50% de sinal no aceite da proposta + 50% na entrega e homologação dos relatórios.	aprovado	[{"id": "d63e4406-976e-4455-a91d-81cc2cb9b40e-1787294162413", "descricao": "Croqui de sondagem", "serviceId": "d63e4406-976e-4455-a91d-81cc2cb9b40e", "quantidade": 1, "valorUnitario": 4500}]	4500.00	- Início do serviço após aceite formal e pagamento do sinal (cobre taxas de ART e despesas de escritório).\n- Despesas de transporte, alimentação e estadia ficam a cargo do armador, quando aplicável.\n- A embarcação deve estar com compartimentos limpos e secos para a realização dos serviços.\n- Cliente deve fornecer dados completos dos armadores e/ou proprietários.\n- Se o processo for paralisado por pendência do armador/proprietário, o pagamento das parcelas deve continuar até quitação total.\n- Proposta válida por 30 dias a contar da data de emissão.	2026-08-21 06:36:04.537305	2026-08-21 06:36:29.497	2026	Deisy Saldanha - Administrativo/Financeiro	2026-08-21	Rosano Souza	\N	3f38b1b2-c341-4d9c-be9c-464db79881ff	["9465f0ca-eec4-40fb-a7e6-42d549b0b307"]	\N	0.00
60df4929-3c43-477a-ad1c-9af84f42757e	DS 056/26	21 de agosto de 2026	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	Rosano Souza	Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação Barco Teste1.	10	Pagamento de 50% de sinal no aceite da proposta + 50% na entrega e homologação dos relatórios.	aprovado	[{"id": "ed417b6a-7c6a-47a9-ab9f-52d50bfaa4a9-1787294263143", "descricao": "Certificado de homologação nas certificadoras", "serviceId": "ed417b6a-7c6a-47a9-ab9f-52d50bfaa4a9", "quantidade": 1, "valorUnitario": 3500}]	3500.00	- Início do serviço após aceite formal e pagamento do sinal (cobre taxas de ART e despesas de escritório).\n- Despesas de transporte, alimentação e estadia ficam a cargo do armador, quando aplicável.\n- A embarcação deve estar com compartimentos limpos e secos para a realização dos serviços.\n- Cliente deve fornecer dados completos dos armadores e/ou proprietários.\n- Se o processo for paralisado por pendência do armador/proprietário, o pagamento das parcelas deve continuar até quitação total.\n- Proposta válida por 30 dias a contar da data de emissão.	2026-08-21 06:37:44.981424	2026-08-21 06:38:13.944	2026	Deisy Saldanha - Administrativo/Financeiro	2026-08-21	Rosano Souza	\N	22157892-9a20-4533-a4db-8b85cfb26134	["9465f0ca-eec4-40fb-a7e6-42d549b0b307"]	\N	0.00
\.


--
-- Data for Name: protocols; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.protocols (id, numero_protocolo, data_envio, embarcacao_id, embarcacao_nome, cliente_nome, destinatario, orgao_ou_empresa, tipo_protocolo, responsavel_envio_nome, status, codigo_rastreio, comprovante_url, comprovante_nome, documentos_incluidos, observacoes, created_at, updated_at) FROM stdin;
eb0c6a55-2734-4054-9fce-0231ece687d9	PROT-083/26	2026-08-21	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	Capitania Fluvial - Seção de Análise	Marinha do Brasil	capitania_dpc	Administrador	em_trânsito	PROT-731924	\N	\N	["Laudo Técnico Definitivo", "ART de Engenharia Naval (2 vias)"]		2026-08-21 04:15:31.940283	2026-08-21 04:15:31.940283
054fbfb2-dab8-4c6a-93bc-af71cdd7658e	PROT-084/26	2026-08-21	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Rosano Souza	Cliente	Cliente	certificadora	Administrador	em_trânsito	RK-5435346	\N	\N	["Documentos da OS OS 052/26"]	Gerado automaticamente via envio da OS OS 052/26.	2026-08-21 04:57:43.541498	2026-08-21 04:57:43.541498
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
3bfc9c17-f98d-426c-86eb-1afb2980f780	6bf0ec07-d78c-459e-85ba-1f473993e075	4caaa7dc-df1e-4c07-904b-f3b522db605c	52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	ssssssssssssssss	2026-08-21 04:53:32.135094
\.


--
-- Data for Name: service_order_items; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.service_order_items (id, os_id, descricao, quantidade, valor_unitario, tipo, status, created_at, updated_at, tecnico_responsavel_id, relatorio_url, relatorio_nome, data_agendada, horario_agendado, local_agendado, contato_agendamento, observacoes_agendamento) FROM stdin;
b8dedbf3-5e9b-48b8-a5d4-39f8981d5aad	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	Anotação de Responsabilidade Técnica (ART) - CREA/PA	1	800.00	art	pendente	2026-08-20 23:35:27.709055	2026-08-20 23:37:14.666	5ac63994-20e5-4e14-8705-c0899ab7d708	/uploads/1787268946344-224913778-imagemeee.jpg	imagemeee.jpg	2026-08-25	04:00	belem	(42) 35346-5464	\N
ec694f5e-2af0-4bf3-8f86-333bc3c27453	24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	Croqui de sondagem	1	4500.00	desenho	concluido	2026-08-20 23:35:27.709055	2026-08-21 03:54:33.504	628e0dda-5e56-4000-bfe5-1cf823491580	/uploads/1787269254220-848491982-Proposta_DS_052_26_qa.pdf	Proposta_DS_052_26_qa.pdf	2026-08-22	04:30	belem	(42) 35346-5464	\N
6bf0ec07-d78c-459e-85ba-1f473993e075	4caaa7dc-df1e-4c07-904b-f3b522db605c	Anotação de Responsabilidade Técnica (ART) - CREA/PA	1	800.00	art	pendente	2026-08-21 04:30:03.961756	2026-08-21 04:53:43.219	6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	\N	\N	2026-08-27	04:30	\N	\N	\N
7eacce09-0986-4ba2-ab52-1fe112069428	4caaa7dc-df1e-4c07-904b-f3b522db605c	Croqui de sondagem	1	4500.00	desenho	em_execucao	2026-08-21 04:30:03.961756	2026-08-21 06:06:55.208	628e0dda-5e56-4000-bfe5-1cf823491580	\N	\N	2026-08-24	04:30	\N	\N	\N
6e9436e1-1884-4330-b49f-0cb8d06faa62	c2be3112-3678-40dd-a77f-24159c08b704	Croqui de sondagem	1	4500.00	desenho	pendente	2026-08-21 06:07:50.130479	2026-08-21 06:07:50.130479	\N	\N	\N	\N	\N	\N	\N	\N
843aa1ca-9f9c-4893-8735-30e104178842	c2be3112-3678-40dd-a77f-24159c08b704	Declaração de responsabilidade técnica	1	1200.00	art	pendente	2026-08-21 06:07:50.130479	2026-08-21 06:07:50.130479	\N	\N	\N	\N	\N	\N	\N	\N
cafca285-ef35-457d-ac0a-f0dc6b607897	177b6282-675d-4231-bec6-cb1112b18d5d	Certificado de homologação nas certificadoras	1	3500.00	homologacao	pendente	2026-08-21 06:20:32.239782	2026-08-21 06:20:32.239782	\N	\N	\N	\N	\N	\N	\N	\N
896d5454-8016-4807-be0b-5852c964b6a3	177b6282-675d-4231-bec6-cb1112b18d5d	Declaração de responsabilidade técnica	1	1200.00	art	pendente	2026-08-21 06:20:32.239782	2026-08-21 06:20:32.239782	\N	\N	\N	\N	\N	\N	\N	\N
f893c312-d77c-4dd4-8046-e5e519a16016	177b6282-675d-4231-bec6-cb1112b18d5d	Declaração de responsabilidade técnica	1	1200.00	art	pendente	2026-08-21 06:20:32.239782	2026-08-21 06:20:32.239782	\N	\N	\N	\N	\N	\N	\N	\N
3ddcf857-b911-45b6-b344-e5ff7844a2f2	3f38b1b2-c341-4d9c-be9c-464db79881ff	Croqui de sondagem	1	4500.00	desenho	pendente	2026-08-21 06:36:29.496782	2026-08-21 06:36:29.496782	\N	\N	\N	\N	\N	\N	\N	\N
b6718f0f-c3a2-47c1-b292-1d1a4060bc22	22157892-9a20-4533-a4db-8b85cfb26134	Certificado de homologação nas certificadoras	1	3500.00	homologacao	pendente	2026-08-21 06:38:13.94426	2026-08-21 06:38:13.94426	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: service_orders; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.service_orders (id, numero, proposta_id, embarcacao_id, cliente_id, status, responsavel_tecnico_id, data_aceite, data_conclusao, observacoes, created_at, updated_at) FROM stdin;
38ec3a07-9999-4f2f-a322-49ba4c697996	OS-2026-001	\N	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	concluida	\N	\N	\N	OS legada criada para preservar tarefas/documentos antigos sem proposta aprovada.	2026-08-20 23:20:58.715114	2026-08-20 23:20:58.715114
24522ee7-6e14-4a03-a81b-3d44a7b4c7a7	OS 051/26	ec3b15a4-c309-4198-9689-99f08834b210	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	aguardando_envio_externo	\N	2026-08-20	\N	Criado a partir do aceite da proposta DS 051/26	2026-08-20 23:35:27.709055	2026-08-21 04:17:23.905
4caaa7dc-df1e-4c07-904b-f3b522db605c	OS 052/26	75f46220-90eb-48d9-bf1d-0d2e212a8251	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	documentacao_em_elaboracao	\N	2026-08-21	\N	Criado a partir do aceite da proposta DS 052/26	2026-08-21 04:30:03.961756	2026-08-21 05:22:21.612
c2be3112-3678-40dd-a77f-24159c08b704	OS 053/26	a69b3c52-2bf0-451c-b517-fe17d58bc4bc	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	aguardando_agendamento	\N	2026-08-21	\N	Criado a partir do aceite da proposta DS 053/26	2026-08-21 06:07:50.130479	2026-08-21 06:07:50.130479
177b6282-675d-4231-bec6-cb1112b18d5d	OS 054/26	e8321e30-538a-48f1-b60e-0f12dbe5f8e4	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	aguardando_agendamento	\N	2026-08-21	\N	Criado a partir do aceite da proposta DS 054/26	2026-08-21 06:20:32.239782	2026-08-21 06:20:32.239782
3f38b1b2-c341-4d9c-be9c-464db79881ff	OS 055/26	59cfc4fc-f649-47f5-a080-7f38a1e0fde2	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	aguardando_agendamento	\N	2026-08-21	\N	Criado a partir do aceite da proposta DS 055/26	2026-08-21 06:36:29.496782	2026-08-21 06:36:29.496782
22157892-9a20-4533-a4db-8b85cfb26134	OS 056/26	60df4929-3c43-477a-ad1c-9af84f42757e	9465f0ca-eec4-40fb-a7e6-42d549b0b307	\N	aguardando_agendamento	\N	2026-08-21	\N	Criado a partir do aceite da proposta DS 056/26	2026-08-21 06:38:13.94426	2026-08-21 06:38:13.94426
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.services (id, nome, valor_padrao, ativo, created_at, updated_at) FROM stdin;
3c630da0-6adc-4dc9-b3e0-c58c3701d1f9	Anotação de Responsabilidade Técnica (ART) - CREA/PA	800.00	t	2026-08-20 23:01:31.167337	2026-08-20 23:01:31.167337
ed417b6a-7c6a-47a9-ab9f-52d50bfaa4a9	Certificado de homologação nas certificadoras	3500.00	t	2026-08-20 23:01:40.072644	2026-08-20 23:01:40.072644
d63e4406-976e-4455-a91d-81cc2cb9b40e	Croqui de sondagem	4500.00	t	2026-08-20 23:01:48.146116	2026-08-20 23:01:48.146116
e0948cc6-5efd-4dc2-b731-27311058f5fc	Declaração de responsabilidade técnica	1200.00	t	2026-08-20 23:01:55.008391	2026-08-20 23:01:55.008391
1a94e642-1f42-4ac1-b484-0532ec68ae78	Relatório de medição de chapas por ultrassom NDT	8500.00	t	2026-08-20 23:02:01.750192	2026-08-20 23:02:01.750192
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.tasks (id, embarcacao_id, titulo, tipo, status, responsavel_nome, data_criacao, prazo_vencimento, anexos, protocolo_gerado, data_conclusao, arquivos_recebidos, historico_notas, observacoes, created_at, updated_at, responsavel_id, responsavel_cargo, embarcacao_nome, cliente_nome, certificadora, prazo, arquivo_nome, arquivo_url, atualizado_em, os_id, legacy) FROM stdin;
43576d63-4758-41d3-a6ef-b8613f0e4272	9465f0ca-eec4-40fb-a7e6-42d549b0b307	Espessalaudoteste1	ultrassom	pendente	Deisy	\N	10 dias	[]	f	\N	[]	[]	\N	2026-08-20 23:14:34.629555	2026-08-20 23:14:52.891	628e0dda-5e56-4000-bfe5-1cf823491580	Comercial / Financeiro	Barco Teste1	Rosano Souza	Amazon Naval	10 dias	Proposta_DS_052_26_final2.pdf	/uploads/1787267692882-255414309-Proposta_DS_052_26_final2.pdf	2026-08-20 23:14	38ec3a07-9999-4f2f-a322-49ba4c697996	t
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.user_sessions (sid, sess, expire) FROM stdin;
2DwNKlWeuZTJFcbK5UFAxIFVP0g0mrCg	{"cookie":{"originalMaxAge":86399999,"expires":"2026-08-22T04:58:24.096Z","secure":false,"httpOnly":true,"path":"/"},"userId":"628e0dda-5e56-4000-bfe5-1cf823491580","userRole":"financeiro"}	2026-08-22 15:33:49
YhiM_b6wjMrKsEQl4pylWc-L8owpdFK-	{"cookie":{"originalMaxAge":86400000,"expires":"2026-08-22T05:24:44.827Z","secure":false,"httpOnly":true,"path":"/"},"userId":"52acd935-18e8-4e7c-8fca-cf5a038d2087","userRole":"admin"}	2026-08-22 14:58:30
qs7DuLgfGBu56lDEqiZR-GJRlhYozU35	{"cookie":{"originalMaxAge":86400000,"expires":"2026-08-22T03:55:26.664Z","secure":false,"httpOnly":true,"path":"/"},"userId":"52acd935-18e8-4e7c-8fca-cf5a038d2087","userRole":"admin"}	2026-08-22 04:32:18
mjOwHzKhzSBfbP0pCDcdWf90fp1KkQXX	{"cookie":{"originalMaxAge":86400000,"expires":"2026-08-21T23:40:06.582Z","secure":false,"httpOnly":true,"path":"/"},"userId":"628e0dda-5e56-4000-bfe5-1cf823491580","userRole":"financeiro"}	2026-08-22 17:39:57
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.users (id, nome, email, role, senha, avatar_url, created_at, updated_at, cargo, ativo, permissions, legacy) FROM stdin;
da7c683f-1a82-42b1-83a6-511fba6f5c72	Ultrassonista	ultrassonista1@nautilus.eng.br	tecnico	$argon2id$v=19$m=65536,p=4,t=3$G3VNvmvMTMopX3oL0He0MQ$YvP1sZuerEkQ1SP/7U8tHdBR9yhwQoM7Inar+4MAoGg	\N	2026-08-05 01:53:40.792	2026-08-05 01:53:40.792	Técnico	t	[]	f
bb87970b-04f8-4b00-92f4-6142f2fd7ee2	Desenhista	desenhista1@nautilus.eng.br	tecnico	$argon2id$v=19$m=65536,p=4,t=3$G3VNvmvMTMopX3oL0He0MQ$YvP1sZuerEkQ1SP/7U8tHdBR9yhwQoM7Inar+4MAoGg	\N	2026-08-05 01:53:40.792	2026-08-05 01:53:40.792	Técnico	t	[]	f
3f3b53ec-a8fc-4ffb-bd04-550b1f5f49b6	QA Navegador	qa.browser.20260804@nautilus.eng.br	tecnico	$argon2id$v=19$m=65536,p=4,t=3$TQgNMaSLeLt1ZAHAyZyPQg$44zRdx5l1Po+kPBKAQb+yHxFP0JtzjbF+dyFwMFNYhY	\N	2026-08-05 02:09:55.607	2026-08-05 02:09:55.607	Analista de Qualidade	t	[]	f
5ac63994-20e5-4e14-8705-c0899ab7d708	Rosano Souza	ronokedas@gmail.com	admin	$argon2id$v=19$m=65536,p=4,t=3$I99X+Y4lhQlcSESt97B4Fw$XWvgGMdYe5YCTpyfiq6QbT/gdsLb5q/9oMU4Pw4q9D4	data:image/jpeg;base64,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	2026-08-05 02:01:59.117	2026-08-20 06:22:02.981	Administrador	t	[]	f
52acd935-18e8-4e7c-8fca-cf5a038d2087	Administrador	osvaldo@nautilus.eng.br	admin	$argon2id$v=19$m=65536,p=4,t=3$G3VNvmvMTMopX3oL0He0MQ$YvP1sZuerEkQ1SP/7U8tHdBR9yhwQoM7Inar+4MAoGg	\N	2026-08-05 01:53:40.792	2026-08-21 06:37:17.955	Administrador / Responsável Técnico	t	["cadastrar_clientes_embarcacoes_propostas", "registrar_aceite_agendar", "executar_vistoria", "anexar_editar_versoes", "revisar_documentos", "aprovar_tecnicamente", "registrar_envio_resposta_externa", "entregar_concluir", "financeiro_administracao"]	f
628e0dda-5e56-4000-bfe5-1cf823491580	Deisy	deisy@nautilus.eng.br	financeiro	$argon2id$v=19$m=65536,p=4,t=3$nJXEO8MqLRyy9hK9nxHg5A$yVeyfzVP6j1GNEu4+CkaDwYNHferhV62Xtpb4qr0XJU	\N	2026-08-05 01:53:40.792	2026-08-21 06:37:17.959	Comercial / Financeiro	t	["cadastrar_clientes_embarcacoes_propostas", "registrar_aceite_agendar", "anexar_editar_versoes", "financeiro_administracao"]	f
6b0a1e21-7dfd-4ecb-afc7-513a0a0dc95f	Lucas	lucas@nautilus.eng.br	tecnico	$argon2id$v=19$m=65536,p=4,t=3$G3VNvmvMTMopX3oL0He0MQ$YvP1sZuerEkQ1SP/7U8tHdBR9yhwQoM7Inar+4MAoGg	\N	2026-08-05 06:25:04.707	2026-08-21 06:37:17.96	Editor / Entrega	t	["anexar_editar_versoes", "entregar_concluir"]	f
\.


--
-- Data for Name: vessels; Type: TABLE DATA; Schema: public; Owner: nautilus_user
--

COPY public.vessels (id, nome, tipo, cliente_id, cliente_nome, telefone_contato, email_contato, responsavel_tecnico, status, etapa_atual, prazo_renovacao, valor_total, valor_recebido, arquivos_associados, progresso, created_at, updated_at, registro, certificadora_principal, valor_sinal, descricao, certificadora_id, comprimento, boca, pontal) FROM stdin;
9465f0ca-eec4-40fb-a7e6-42d549b0b307	Barco Teste1	Empurrador Fluvial	42e17777-62a4-41df-8b4b-0c8a24ff234e	Rosano Souza	\N	\N	\N	concluida	Análise Inicial	\N	29200.00	9790.09	[]	0	2026-08-20 23:02:59.962668	2026-08-21 03:42:34.417	PA-00000-X	Amazon Naval	0.00		\N	\N	\N	\N
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: nautilus_user
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 56, true);


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
-- Name: accounts_receivable_proposta_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX accounts_receivable_proposta_unique ON public.accounts_receivable USING btree (proposta_id);


--
-- Name: document_versions_doc_versao_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX document_versions_doc_versao_unique ON public.document_versions USING btree (documento_id, versao);


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
-- Name: proposal_acceptances_proposta_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX proposal_acceptances_proposta_unique ON public.proposal_acceptances USING btree (proposta_id);


--
-- Name: receipts_numero_unique; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE UNIQUE INDEX receipts_numero_unique ON public.receipts USING btree (numero);


--
-- Name: service_order_item_comments_item_idx; Type: INDEX; Schema: public; Owner: nautilus_user
--

CREATE INDEX service_order_item_comments_item_idx ON public.service_order_item_comments USING btree (item_id, created_at);


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
-- Name: protocols protocols_embarcacao_id_vessels_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: nautilus_user
--

ALTER TABLE ONLY public.protocols
    ADD CONSTRAINT protocols_embarcacao_id_vessels_id_fk FOREIGN KEY (embarcacao_id) REFERENCES public.vessels(id);


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

\unrestrict 5LGLkX4vRkqfq3HUVKDjHcNaMtEU53taWWa7JfyeCdaOPtzGYkpLlRM8RIjLEGH

