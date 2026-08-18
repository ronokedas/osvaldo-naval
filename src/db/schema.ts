import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, decimal, varchar, real, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("tecnico"), // admin, tecnico, financeiro
  cargo: text("cargo"),
  ativo: boolean("ativo").notNull().default(true),
  senha: text("senha").notNull(),
  avatarUrl: text("avatar_url"),
  permissions: jsonb("permissions").default([]), // array of permission strings
  legacy: boolean("legacy").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  cnpjCpf: text("cnpj_cpf"),
  endereco: text("endereco"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vessels = pgTable("vessels", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(),
  clienteId: uuid("cliente_id").references(() => clients.id),
  clienteNome: text("cliente_nome"), // fallback if client not linked
  telefoneContato: text("telefone_contato"),
  emailContato: text("email_contato"),
  responsavelTecnico: text("responsavel_tecnico"),
  status: text("status").notNull().default("aberta"), // aberta, concluida
  etapaAtual: text("etapa_atual"),
  prazoRenovacao: text("prazo_renovacao"),
  valorTotal: decimal("valor_total", { precision: 12, scale: 2 }).default("0"),
  valorRecebido: decimal("valor_recebido", { precision: 12, scale: 2 }).default("0"),
  arquivosAssociados: jsonb("arquivos_associados").default([]),
  progresso: integer("progresso").default(0),
  registro: text("registro"),
  certificadoraPrincipal: text("certificadora_principal"),
  valorSinal: decimal("valor_sinal", { precision: 12, scale: 2 }).default("0"),
  descricao: text("descricao"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  embarcacaoId: uuid("embarcacao_id").references(() => vessels.id),
  titulo: text("titulo").notNull(),
  tipo: text("tipo").notNull(), // desenho, memoria, relatorio, ultrassom, art
  status: text("status").notNull().default("pendente"), // pendente, execucao, em_revisao, enviado, exigencia, aprovado
  responsavelNome: text("responsavel_nome"),
  responsavelId: uuid("responsavel_id").references(() => users.id),
  responsavelCargo: text("responsavel_cargo"),
  embarcacaoNome: text("embarcacao_nome"),
  clienteNome: text("cliente_nome"),
  certificadora: text("certificadora"),
  prazo: text("prazo"),
  arquivoNome: text("arquivo_nome"),
  arquivoUrl: text("arquivo_url"),
  atualizadoEm: text("atualizado_em"),
  dataCriacao: text("data_criacao"),
  prazoVencimento: text("prazo_vencimento"),
  anexos: jsonb("anexos").default([]),
  protocoloGerado: boolean("protocolo_gerado").default(false),
  dataConclusao: text("data_conclusao"),
  arquivosRecebidos: jsonb("arquivos_recebidos").default([]),
  historicoNotas: jsonb("historico_notas").default([]),
  observacoes: text("observacoes"),
  osId: uuid("os_id"),
  legacy: boolean("legacy").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  numero: text("numero").notNull(),
  dataEmissao: text("data_emissao"),
  validadeDias: integer("validade_dias"),
  embarcacaoId: uuid("embarcacao_id").references(() => vessels.id),
  embarcacaoNome: text("embarcacao_nome"),
  clienteNome: text("cliente_nome"),
  clienteId: uuid("cliente_id").references(() => clients.id),
  destinatario: text("destinatario"),
  assunto: text("assunto"),
  prazoEntregaDias: integer("prazo_entrega_dias"),
  condicoesPagamento: text("condicoes_pagamento"),
  status: text("status").notNull().default("rascunho"), // rascunho, enviado, aprovado, recusado, faturado
  itens: jsonb("itens").default([]),
  valorTotal: decimal("valor_total", { precision: 12, scale: 2 }).default("0"),
  observacoes: text("observacoes"),
  ano: integer("ano"),
  elaboradoPor: text("elaborado_por"),
  aceiteData: text("aceite_data"),
  aceiteAssinaturaNome: text("aceite_assinatura_nome"),
  osId: uuid("os_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const proposal_acceptances = pgTable("proposal_acceptances", {
  id: uuid("id").primaryKey().defaultRandom(),
  propostaId: uuid("proposta_id").references(() => proposals.id).notNull(),
  meio: text("meio").notNull().default("outro"), // presencial, email, whatsapp, outro
  responsavelNome: text("responsavel_nome").notNull(),
  data: text("data"),
  observacao: text("observacao"),
  usuarioId: uuid("usuario_id").references(() => users.id),
  usuarioNome: text("usuario_nome"),
  documentoUrl: text("documento_url"),
  documentoNome: text("documento_nome"),
  origem: text("origem").default("normal"), // normal, legado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("proposal_acceptances_proposta_unique").on(table.propostaId),
]);

export const proposal_deliveries = pgTable("proposal_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  propostaId: uuid("proposta_id").references(() => proposals.id).notNull(),
  canal: text("canal").notNull(), // email, whatsapp
  destinatario: text("destinatario"),
  status: text("status").default("enviado"), // enviado, falha
  erro: text("erro"),
  usuarioId: uuid("usuario_id").references(() => users.id),
  usuarioNome: text("usuario_nome"),
  data: timestamp("data").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts_receivable = pgTable("accounts_receivable", {
  id: uuid("id").primaryKey().defaultRandom(),
  propostaId: uuid("proposta_id").references(() => proposals.id).notNull(),
  osId: uuid("os_id").references(() => service_orders.id),
  embarcacaoId: uuid("embarcacao_id").references(() => vessels.id),
  clienteId: uuid("cliente_id").references(() => clients.id),
  valorOriginal: decimal("valor_original", { precision: 12, scale: 2 }).default("0"),
  status: text("status").notNull().default("pendente"), // pendente, parcial, pago, cancelado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("accounts_receivable_proposta_unique").on(table.propostaId),
]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  contaReceberId: uuid("conta_receber_id").references(() => accounts_receivable.id),
  propostaId: uuid("proposta_id").references(() => proposals.id),
  osId: uuid("os_id").references(() => service_orders.id),
  embarcacaoId: uuid("embarcacao_id").references(() => vessels.id),
  valor: decimal("valor", { precision: 12, scale: 2 }).default("0"),
  data: text("data"),
  formaPagamento: text("forma_pagamento"),
  observacao: text("observacao"),
  lancadoPorNome: text("lancado_por_nome"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  numero: text("numero").notNull().unique(), // REC-AAAA-000001
  dataEmissao: text("data_emissao"),
  emissorNome: text("emissor_nome"),
  paymentId: uuid("payment_id").references(() => payments.id),
  contaReceberId: uuid("conta_receber_id").references(() => accounts_receivable.id),
  status: text("status").notNull().default("ativo"), // ativo, cancelado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const financial_entries = pgTable("financial_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  embarcacaoId: uuid("embarcacao_id").references(() => vessels.id),
  embarcacaoNome: text("embarcacao_nome"),
  clienteNome: text("cliente_nome"),
  data: text("data"),
  valor: decimal("valor", { precision: 12, scale: 2 }).default("0"),
  tipo: text("tipo").notNull(), // sinal, parcela, quitacao, aditivo, despesa
  formaPagamento: text("forma_pagamento"),
  observacao: text("observacao"),
  lancadoPorNome: text("lancado_por_nome"),
  notaFiscalNumero: text("nota_fiscal_numero"),
  notaFiscalNome: text("nota_fiscal_nome"),
  notaFiscalUrl: text("nota_fiscal_url"),
  nfSeries: text("nf_series"), // Série da Nota Fiscal
  issuerId: uuid("issuer_id").references(() => clients.id), // Emitente da NF
  reciboNumero: text("recibo_numero"),
  comprovanteDespesaUrl: text("comprovante_despesa_url"),
  propostaId: uuid("proposta_id").references(() => proposals.id),
  osId: uuid("os_id").references(() => service_orders.id),
  contaReceberId: uuid("conta_receber_id").references(() => accounts_receivable.id),
  isStorno: boolean("is_storno").default(false), // Indica se é um estorno
  stornoReason: text("storno_reason"), // Motivo do estorno
  originalPaymentId: uuid("original_payment_id").references((): any => financial_entries.id), // Pagamento original estornado
  notificationSent: boolean("notification_sent").default(false), // Se notificação foi enviada
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const protocols = pgTable("protocols", {
  id: uuid("id").primaryKey().defaultRandom(),
  numeroProtocolo: text("numero_protocolo").notNull(),
  dataEnvio: text("data_envio"),
  embarcacaoId: uuid("embarcacao_id").references(() => vessels.id),
  embarcacaoNome: text("embarcacao_nome"),
  clienteNome: text("cliente_nome"),
  destinatario: text("destinatario"),
  orgaoOuEmpresa: text("orgao_ou_empresa"),
  tipoProtocolo: text("tipo_protocolo"), // capitania_dpc, certificadora, entrega_cliente, outros
  responsavelEnvioNome: text("responsavel_envio_nome"),
  status: text("status").notNull().default("em_trânsito"), // em_trânsito, protocolado, exigencia, concluido
  codigoRastreio: text("codigo_rastreio"),
  comprovanteUrl: text("comprovante_url"),
  comprovanteNome: text("comprovante_nome"),
  documentosIncluidos: jsonb("documentos_incluidos").default([]),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const critical_pendings = pgTable("critical_pendings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: text("tipo").notNull(),
  titulo: text("titulo").notNull(),
  embarcacaoNome: text("embarcacao_nome"),
  detalhe: text("detalhe"),
  urgencia: text("urgencia"),
  data: text("data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const app_configs = pgTable("app_configs", {
  id: text("id").primaryKey(), // "email", "signature", "logo"
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== Ordem de Serviço (OS) =====

export const service_orders = pgTable("service_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  numero: text("numero").notNull().unique(), // OS-AAAA-NNN
  propostaId: uuid("proposta_id").references(() => proposals.id),
  embarcacaoId: uuid("embarcacao_id").references(() => vessels.id),
  clienteId: uuid("cliente_id").references(() => clients.id),
  status: text("status").notNull().default("aguardando_agendamento"),
  // aguardando_agendamento, visita_agendada, vistoria_em_execucao, documentacao_em_elaboracao,
  // revisao_interna, aguardando_envio_externo, em_analise_externa, exigencia_externa,
  // aprovado_externamente, aguardando_entrega, concluida, cancelada
  responsavelTecnicoId: uuid("responsavel_tecnico_id").references(() => users.id),
  dataAceite: text("data_aceite"),
  dataConclusao: text("data_conclusao"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const service_order_items = pgTable("service_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  osId: uuid("os_id").references(() => service_orders.id).notNull(),
  descricao: text("descricao").notNull(),
  quantidade: integer("quantidade").default(1),
  valorUnitario: decimal("valor_unitario", { precision: 12, scale: 2 }).default("0"),
  tipo: text("tipo").default("outro"), // ultrassom, desenho, art, relatorio, homologacao, outro
  status: text("status").notNull().default("pendente"), // pendente, em_execucao, concluido
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  osId: uuid("os_id").references(() => service_orders.id).notNull(),
  status: text("status").notNull().default("pendente"), // pendente, agendado, realizado, cancelado
  data: text("data"),
  horario: text("horario"),
  local: text("local"),
  contato: text("contato"),
  observacoes: text("observacoes"),
  tecnicoResponsavelId: uuid("tecnico_responsavel_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  osId: uuid("os_id").references(() => service_orders.id).notNull(),
  titulo: text("titulo").notNull(),
  tipo: text("tipo").notNull().default("outro"), // ultrassom, desenho, art, relatorio, homologacao, outro
  status: text("status").notNull().default("em_elaboracao"),
  // em_elaboracao, em_revisao, aguardando_envio, em_analise_externa, exigencia, aprovado
  versaoAtual: integer("versao_atual").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const document_versions = pgTable("document_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentoId: uuid("documento_id").references(() => documents.id).notNull(),
  versao: integer("versao").notNull(), // 1 = V1, 2 = V2, etc.
  arquivoNomeFisico: text("arquivo_nome_fisico").notNull(),
  arquivoNomeOriginal: text("arquivo_nome_original").notNull(),
  tamanho: integer("tamanho").default(0),
  tipoMime: text("tipo_mime"),
  autorId: uuid("autor_id").references(() => users.id),
  autorNome: text("autor_nome"),
  data: text("data"),
  comentario: text("comentario"),
  origem: text("origem").notNull().default("vistoria"), // vistoria, correcao_interna, exigencia_externa
  situacaoRevisao: text("situacao_revisao").default("pendente"), // pendente, em_revisao, revisado
  situacaoAprovacao: text("situacao_aprovacao").default("pendente"), // pendente, aprovado, reprovado
  aprovadoPorId: uuid("aprovado_por_id").references(() => users.id),
  aprovadoEm: text("aprovado_em"),
  pdfUrl: text("pdf_url"), // URL para PDF editado/gerado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("document_versions_doc_versao_unique").on(table.documentoId, table.versao),
]);

export const external_submissions = pgTable("external_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  osId: uuid("os_id").references(() => service_orders.id).notNull(),
  documentoId: uuid("documento_id").references(() => documents.id),
  versaoEnviada: integer("versao_enviada"),
  orgaoOuCertificadora: text("orgao_ou_certificadora").notNull(),
  dataEnvio: text("data_envio"),
  protocolo: text("protocolo"),
  observacao: text("observacao"),
  responsavelEnvioId: uuid("responsavel_envio_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const external_responses = pgTable("external_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissaoId: uuid("submissao_id").references(() => external_submissions.id).notNull(),
  tipo: text("tipo").notNull(), // aprovacao, exigencia
  data: text("data"),
  motivo: text("motivo"),
  anexoUrl: text("anexo_url"),
  anexoNome: text("anexo_nome"),
  versaoAprovada: integer("versao_aprovada"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  osId: uuid("os_id").references(() => service_orders.id).notNull(),
  status: text("status").notNull().default("pendente"), // pendente, impresso, entregue
  dataEntrega: text("data_entrega"),
  meioEntrega: text("meio_entrega"),
  nomeRecebedor: text("nome_recebedor"),
  comprovanteUrl: text("comprovante_url"),
  comprovanteNome: text("comprovante_nome"),
  entreguePorId: uuid("entregue_por_id").references(() => users.id),
  dataImpressao: text("data_impressao"), // quando Lucas confirma impressão
  impressoPorId: uuid("impresso_por_id").references(() => users.id), // quem confirmou impressão
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const os_events = pgTable("os_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  osId: uuid("os_id").references(() => service_orders.id).notNull(),
  tipo: text("tipo").notNull(),
  // criacao, agendamento, vistoria, upload, revisao, aprovacao, envio_externo,
  // resposta_externa, exigencia, entrega, conclusao, cancelamento, comentario
  autorId: uuid("autor_id").references(() => users.id),
  autorNome: text("autor_nome"),
  descricao: text("descricao"),
  dados: jsonb("dados").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  usuarioId: uuid("usuario_id").references(() => users.id).notNull(),
  tipo: text("tipo").notNull(), // atribuicao, revisao, exigencia, aprovacao, entrega, vistoria_inicio, vistoria_conclusao, documento_anexado, impressao_confirmada, entrega_confirmada, FINANCE_UPDATE
  titulo: text("titulo").notNull(),
  mensagem: text("mensagem"),
  lida: boolean("lida").notNull().default(false),
  osId: uuid("os_id").references(() => service_orders.id),
  compromissoId: uuid("compromisso_id").references(() => commitments.id),
  prioridade: text("prioridade").default("normal"), // normal, alta, critica
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para anexos financeiros (Notas Fiscais, Recibos, Boletos)
export const financial_attachments = pgTable("financial_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").notNull().references(() => financial_entries.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").default(0),
  mimeType: text("mime_type"),
  documentType: text("document_type").notNull().default("outro"), // nf, recibo, boleto, comprovante, outro
  documentNumber: text("document_number"), // Número do documento (NF, recibo, etc)
  series: text("series"), // Série da NF
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  uploadedByName: text("uploaded_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const commitments = pgTable("commitments", {
  id: uuid("id").primaryKey().defaultRandom(),
  titulo: text("titulo").notNull(),
  embarcacaoId: uuid("embarcacao_id").references(() => vessels.id).notNull(),
  responsavelId: uuid("responsavel_id").references(() => users.id).notNull(),
  vencimento: text("vencimento").notNull(),
  observacoes: text("observacoes"),
  prioridade: text("prioridade").notNull().default("normal"),
  status: text("status").notNull().default("aberto"),
  criadoPorId: uuid("criado_por_id").references(() => users.id),
  destinatarios: jsonb("destinatarios").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para histórico de status financeiro
export const financial_status_history = pgTable("financial_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  embarcacaoId: uuid("embarcacao_id").references(() => vessels.id, { onDelete: "cascade" }),
  osId: uuid("os_id").references(() => service_orders.id, { onDelete: "cascade" }),
  previousStatus: text("previous_status"), // PENDENTE, PARCIAL, PAGO
  newStatus: text("new_status").notNull(), // PENDENTE, PARCIAL, PAGO
  previousValue: decimal("previous_value", { precision: 12, scale: 2 }).default("0"),
  newValue: decimal("new_value", { precision: 12, scale: 2 }).notNull().default("0"),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).default("0"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).default("0"),
  triggeredBy: uuid("triggered_by").references(() => users.id),
  triggeredByName: text("triggered_by_name"),
  entryId: uuid("entry_id").references(() => financial_entries.id),
  observation: text("observation"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commitment_attachments = pgTable("commitment_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  compromissoId: uuid("compromisso_id").references(() => commitments.id, { onDelete: "cascade" }).notNull(),
  nomeOriginal: text("nome_original").notNull(),
  nomeFisico: text("nome_fisico").notNull(),
  url: text("url").notNull(),
  tipoMime: text("tipo_mime"),
  tamanho: integer("tamanho").default(0),
  autorId: uuid("autor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
