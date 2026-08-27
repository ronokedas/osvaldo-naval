import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, decimal, varchar, real, uniqueIndex, index } from "drizzle-orm/pg-core";

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
  themePreference: text("theme_preference").notNull().default("classic"),
  passwordResetExpiresAt: timestamp("password_reset_expires_at"),
  legacy: boolean("legacy").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  whatsapp: text("whatsapp"),
  cnpjCpf: text("cnpj_cpf"),
  endereco: text("endereco"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const certifiers = pgTable("certifiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  codigoRegistro: text("codigo_registro"),
  telefoneContato: text("telefone_contato"),
  email: text("email"),
  ativo: boolean("ativo").notNull().default(true),
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
  certificadoraId: uuid("certificadora_id").references(() => certifiers.id),
  certificadoraPrincipal: text("certificadora_principal"),
  comprimento: decimal("comprimento", { precision: 10, scale: 2 }),
  boca: decimal("boca", { precision: 10, scale: 2 }),
  pontal: decimal("pontal", { precision: 10, scale: 2 }),
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
  embarcacoesIds: jsonb("embarcacoes_ids").default([]),
  renovacaoDeId: uuid("renovacao_de_id").references((): any => proposals.id),
  embarcacaoNome: text("embarcacao_nome"),
  clienteNome: text("cliente_nome"),
  clienteId: uuid("cliente_id").references(() => clients.id),
  destinatario: text("destinatario"),
  assunto: text("assunto"),
  prazoEntregaDias: integer("prazo_entrega_dias"),
  condicoesPagamento: text("condicoes_pagamento"),
  status: text("status").notNull().default("rascunho"), // rascunho, enviado, aprovado, recusado, faturado
  valorDesconto: decimal("valor_desconto", { precision: 12, scale: 2 }).default("0"),
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
  // Foreign key is declared in SQL migration; financial_entries is declared below.
  financialEntryId: uuid("financial_entry_id"),
  ativo: boolean("ativo").notNull().default(true),
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
  nfSeries: text("nf_series"),
  issuerId: uuid("issuer_id").references(() => clients.id),
  reciboNumero: text("recibo_numero"),
  comprovanteDespesaUrl: text("comprovante_despesa_url"),
  propostaId: uuid("proposta_id").references(() => proposals.id),
  osId: uuid("os_id").references(() => service_orders.id),
  contaReceberId: uuid("conta_receber_id").references(() => accounts_receivable.id),
  contaPagarId: uuid("conta_pagar_id").references(() => accounts_payable.id),
  categoriaId: uuid("categoria_id").references(() => financial_categories.id),
  fornecedorId: uuid("fornecedor_id").references(() => financial_suppliers.id),
  natureza: text("natureza").notNull().default("entrada"),
  competencia: text("competencia"),
  vencimento: text("vencimento"),
  isStorno: boolean("is_storno").default(false),
  stornoReason: text("storno_reason"),
  originalPaymentId: uuid("original_payment_id").references(() => financial_entries.id),
  notificationSent: boolean("notification_sent").default(false),
  situacaoConciliacao: text("situacao_conciliacao").notNull().default("conciliado"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const financial_categories = pgTable("financial_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().unique(),
  natureza: text("natureza").notNull().default("despesa"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const financial_suppliers = pgTable("financial_suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  documento: text("documento"),
  email: text("email"),
  telefone: text("telefone"),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts_payable = pgTable("accounts_payable", {
  id: uuid("id").primaryKey().defaultRandom(),
  fornecedorId: uuid("fornecedor_id").references(() => financial_suppliers.id),
  categoriaId: uuid("categoria_id").references(() => financial_categories.id),
  embarcacaoId: uuid("embarcacao_id").references(() => vessels.id),
  descricao: text("descricao").notNull(),
  valorOriginal: decimal("valor_original", { precision: 12, scale: 2 }).default("0"),
  vencimento: text("vencimento"),
  competencia: text("competencia"),
  status: text("status").notNull().default("pendente"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const financial_attachments = pgTable("financial_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").notNull().references(() => financial_entries.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").default(0),
  mimeType: text("mime_type"),
  documentType: text("document_type").notNull().default("outro"),
  documentNumber: text("document_number"),
  series: text("series"),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  uploadedByName: text("uploaded_by_name"),
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
  osId: uuid("os_id"),
  canal: text("canal"),
  cicloAtual: integer("ciclo_atual").notNull().default(0),
  requerConciliacao: boolean("requer_conciliacao").notNull().default(false),
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
  tecnicoResponsavelId: uuid("tecnico_responsavel_id").references(() => users.id),
  relatorioUrl: text("relatorio_url"),
  relatorioNome: text("relatorio_nome"),
  dataAgendada: text("data_agendada"),
  horarioAgendado: text("horario_agendado"),
  localAgendado: text("local_agendado"),
  contatoAgendamento: text("contato_agendamento"),
  observacoesAgendamento: text("observacoes_agendamento"),
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
  aplicavelAnaliseExterna: boolean("aplicavel_analise_externa").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Repositório compartilhado, independente dos anexos de Ordem de Serviço. */
export const documentLibraryFolders = pgTable("document_library_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  parentId: uuid("parent_id"),
  name: text("name").notNull(),
  createdById: uuid("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentLibraryFiles = pgTable("document_library_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  folderId: uuid("folder_id").references(() => documentLibraryFolders.id, { onDelete: "cascade" }),
  originalName: text("original_name").notNull(),
  storedName: text("stored_name").notNull(),
  mimeType: text("mime_type"),
  size: integer("size").notNull().default(0),
  uploadedById: uuid("uploaded_by_id").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  trashedAt: timestamp("trashed_at"),
  trashedById: uuid("trashed_by_id").references(() => users.id),
});

export const documentLibraryAudit = pgTable("document_library_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileId: uuid("file_id"),
  folderId: uuid("folder_id"),
  actorId: uuid("actor_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  details: jsonb("details").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Snake-case aliases keep generic backup/restore tooling compatible with the
// table names used by the rest of the schema.
export const document_library_folders = documentLibraryFolders;
export const document_library_files = documentLibraryFiles;
export const document_library_audit = documentLibraryAudit;

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

export const protocol_dispatches = pgTable("protocol_dispatches", {
  id: uuid("id").primaryKey().defaultRandom(),
  protocoloId: uuid("protocolo_id").references(() => protocols.id, { onDelete: "cascade" }).notNull(),
  ciclo: integer("ciclo").notNull().default(0),
  tipo: text("tipo").notNull().default("inicial"), // inicial, correcao
  dataEnvio: text("data_envio").notNull(),
  referenciaExterna: text("referencia_externa"),
  canal: text("canal"),
  destinatario: text("destinatario"),
  observacao: text("observacao"),
  enviadoPorId: uuid("enviado_por_id").references(() => users.id),
  enviadoPorNome: text("enviado_por_nome"),
  situacao: text("situacao").notNull().default("rascunho"), comprovanteUrl: text("comprovante_url"), comprovanteNome: text("comprovante_nome"), emailDestinatario: text("email_destinatario"), emailMessageId: text("email_message_id"), enviadoEm: timestamp("enviado_em"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const protocol_dispatch_documents = pgTable("protocol_dispatch_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  remessaId: uuid("remessa_id").references(() => protocol_dispatches.id, { onDelete: "cascade" }).notNull(),
  documentoId: uuid("documento_id").references(() => documents.id).notNull(),
  versaoId: uuid("versao_id").references(() => document_versions.id).notNull(),
  versao: integer("versao").notNull(),
  tituloDocumento: text("titulo_documento").notNull(),
  resultado: text("resultado").notNull().default("aguardando_analise"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("protocol_dispatch_doc_unique").on(table.remessaId, table.documentoId),
]);

export const protocol_responses = pgTable("protocol_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  protocoloId: uuid("protocolo_id").references(() => protocols.id, { onDelete: "cascade" }).notNull(),
  remessaId: uuid("remessa_id").references(() => protocol_dispatches.id, { onDelete: "cascade" }).notNull(),
  tipo: text("tipo").notNull(), // aprovado, aprovado_com_observacoes, exigencia
  data: text("data").notNull(),
  motivo: text("motivo"),
  registradoPorId: uuid("registrado_por_id").references(() => users.id),
  registradoPorNome: text("registrado_por_nome"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const protocol_response_documents = pgTable("protocol_response_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  respostaId: uuid("resposta_id").references(() => protocol_responses.id, { onDelete: "cascade" }).notNull(),
  documentoId: uuid("documento_id").references(() => documents.id).notNull(),
  resultado: text("resultado").notNull(),
  observacao: text("observacao"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const protocol_attachments = pgTable("protocol_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  protocoloId: uuid("protocolo_id").references(() => protocols.id, { onDelete: "cascade" }).notNull(),
  respostaId: uuid("resposta_id").references(() => protocol_responses.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull().default("comprovante"),
  arquivoUrl: text("arquivo_url").notNull(),
  arquivoNome: text("arquivo_nome").notNull(),
  tipoMime: text("tipo_mime"),
  tamanho: integer("tamanho").default(0),
  enviadoPorId: uuid("enviado_por_id").references(() => users.id),
  enviadoPorNome: text("enviado_por_nome"),
  createdAt: timestamp("created_at").defaultNow(),
});

/** Arquivo final aprovado/carimbado, separado da evidência de resposta externa. */
export const approved_document_files = pgTable("approved_document_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  protocoloId: uuid("protocolo_id").references(() => protocols.id, { onDelete: "cascade" }).notNull(),
  respostaId: uuid("resposta_id").references(() => protocol_responses.id, { onDelete: "set null" }),
  documentoId: uuid("documento_id").references(() => documents.id).notNull(),
  versaoId: uuid("versao_id").references(() => document_versions.id),
  arquivoUrl: text("arquivo_url").notNull(),
  arquivoNome: text("arquivo_nome").notNull(),
  tipoMime: text("tipo_mime"),
  tamanho: integer("tamanho").default(0),
  enviadoPorId: uuid("enviado_por_id").references(() => users.id),
  enviadoPorNome: text("enviado_por_nome"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("approved_document_files_protocol_document_idx").on(table.protocoloId, table.documentoId)]);

export const protocol_events = pgTable("protocol_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  protocoloId: uuid("protocolo_id").references(() => protocols.id, { onDelete: "cascade" }).notNull(),
  tipo: text("tipo").notNull(),
  descricao: text("descricao").notNull(),
  dados: jsonb("dados").default({}),
  autorId: uuid("autor_id").references(() => users.id),
  autorNome: text("autor_nome"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  status: text("status").notNull().default("pendente"), // pendente, em_entrega, aguardando_complemento, pronta_validacao, concluida, cancelada
  responsavelId: uuid("responsavel_id").references(() => users.id),
  iniciadaEm: timestamp("iniciada_em"),
  concluidaEm: timestamp("concluida_em"),
  motivoReabertura: text("motivo_reabertura"),
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

export const delivery_dispatches = pgTable("delivery_dispatches", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliveryId: uuid("delivery_id").references(() => deliveries.id, { onDelete: "cascade" }).notNull(),
  tipo: text("tipo").notNull().default("parcial"), // parcial, final, historica_indefinida
  status: text("status").notNull().default("entregue"),
  dataEntrega: text("data_entrega").notNull(),
  meioEntrega: text("meio_entrega").notNull(),
  nomeRecebedor: text("nome_recebedor").notNull(),
  destino: text("destino").notNull(),
  referencia: text("referencia"),
  comprovanteUrl: text("comprovante_url").notNull(),
  comprovanteNome: text("comprovante_nome").notNull(),
  entreguePorId: uuid("entregue_por_id").references(() => users.id),
  entreguePorNome: text("entregue_por_nome"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const delivery_dispatch_documents = pgTable("delivery_dispatch_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  remessaEntregaId: uuid("remessa_entrega_id").references(() => delivery_dispatches.id, { onDelete: "cascade" }).notNull(),
  arquivoAprovadoId: uuid("arquivo_aprovado_id").references(() => approved_document_files.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [uniqueIndex("delivery_dispatch_document_unique").on(table.remessaEntregaId, table.arquivoAprovadoId)]);

export const os_finalization_reviews = pgTable("os_finalization_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  osId: uuid("os_id").references(() => service_orders.id, { onDelete: "cascade" }).notNull(),
  decisao: text("decisao").notNull(), // aprovada, devolvida
  observacao: text("observacao"),
  administradorId: uuid("administrador_id").references(() => users.id),
  administradorNome: text("administrador_nome"),
  createdAt: timestamp("created_at").defaultNow(),
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
  tipo: text("tipo").notNull(), // atribuicao, revisao, exigencia, aprovacao, entrega, vistoria_inicio, vistoria_conclusao, documento_anexado, impressao_confirmada, entrega_confirmada
  titulo: text("titulo").notNull(),
  mensagem: text("mensagem"),
  lida: boolean("lida").notNull().default(false),
  osId: uuid("os_id").references(() => service_orders.id),
  compromissoId: uuid("compromisso_id").references(() => commitments.id),
  prioridade: text("prioridade").default("normal"), // normal, alta, critica
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().unique(),
  valorPadrao: decimal("valor_padrao", { precision: 12, scale: 2 }).notNull().default("0"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const service_order_item_comments = pgTable("service_order_item_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id").references(() => service_order_items.id, { onDelete: "cascade" }).notNull(),
  osId: uuid("os_id").references(() => service_orders.id, { onDelete: "cascade" }).notNull(),
  autorId: uuid("autor_id").references(() => users.id, { onDelete: "set null" }),
  autorNome: text("autor_nome").notNull(),
  texto: text("texto").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
