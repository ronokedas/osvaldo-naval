import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, decimal, varchar, real } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("tecnico"), // admin, tecnico, financeiro
  cargo: text("cargo"),
  ativo: boolean("ativo").notNull().default(true),
  senha: text("senha").notNull(),
  avatarUrl: text("avatar_url"),
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
  reciboNumero: text("recibo_numero"),
  comprovanteDespesaUrl: text("comprovante_despesa_url"),
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
