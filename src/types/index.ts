export type UserRole = 'admin' | 'financeiro' | 'tecnico';
export type ThemePreference = 'classic' | 'nautilus_dark';

export interface User {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  role: UserRole;
  ativo: boolean;
  acessoAtivo?: boolean;
  avatarUrl?: string;
  senha?: string;
  tarefasAtivas?: number;
  permissions?: string[];
  themePreference?: ThemePreference;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  usuario: string;
  senha?: string;
  nomeRemetente: string;
  emailRemetente: string;
  usarTlsSsl: boolean;
  ativo: boolean;
  envioAutomaticoPropostas: boolean;
  envioAutomaticoProtocolos: boolean;
  envioAutomaticoRecibos: boolean;
}

export interface SignatureConfig {
  imagemUrl?: string;
  nomeSignatario: string;
  cargoSignatario: string;
  creaOrRegistro?: string;
  aplicarPropostas: boolean;
  aplicarProtocolos: boolean;
  aplicarRecibos: boolean;
  ativo: boolean;
}

export interface LogoConfig {
  imagemUrl?: string;
  nomeEmpresa: string;
  subtitulo: string;
  ativo: boolean;
}

export type VesselStatus = 'aberta' | 'concluida';

export type Certificadora = 'ABS' | 'DNV' | 'RBNA' | 'Amazon Naval' | 'Auto Ship' | 'A definir';

export interface Client {
  id: string;
  nome: string;
  empresa: string;
  telefone: string;
  whatsapp?: string;
  email: string;
  cnpjCpf?: string;
  endereco?: string;
}

export interface Certifier {
  id: string;
  nome: string;
  codigoRegistro?: string;
  telefoneContato?: string;
  email?: string;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisteredService {
  id: string;
  nome: string;
  valorPadrao: number;
  ativo: boolean;
}

export interface Vessel {
  id: string;
  clienteId: string;
  clienteNome: string;
  nome: string;
  tipo: string; // Empurrador, Balsa, Rebocador, Ferry Boat, etc.
  registro: string;
  status: VesselStatus;
  certificadoraPrincipal?: Certificadora;
  certificadoraId?: string;
  comprimento?: number;
  boca?: number;
  pontal?: number;
  valorTotal: number;
  valorSinal: number;
  valorRecebido: number;
  criadoEm: string;
  descricao?: string;
  emailContato?: string;
  telefoneContato?: string;
}

export type TaskStatus = 'pendente' | 'execucao' | 'pronto' | 'enviado' | 'baixado' | 'em_revisao' | 'devolvida' | 'exigencia';

export interface DocumentTask {
  id: string;
  embarcacaoId: string;
  embarcacaoNome: string;
  clienteNome: string;
  orcamentoId?: string;
  tipo: 'ultrassom' | 'desenho' | 'art' | 'homologacao' | 'outro';
  titulo: string;
  responsavelId: string;
  responsavelNome: string;
  responsavelCargo?: string;
  status: TaskStatus;
  certificadora: Certificadora;
  prazo: string;
  arquivoUrl?: string;
  arquivoNome?: string;
  observacoes?: string;
  historicoNotas?: { data: string; autor: string; texto: string }[];
  atualizadoEm: string;
}

export interface ScopeItem {
  id: string;
  serviceId?: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export type ProposalStatus = 'rascunho' | 'enviado' | 'aprovado' | 'recusado';

export interface Proposal {
  id: string;
  embarcacaoId: string;
  embarcacoesIds?: string[];
  clienteId?: string;
  renovacaoDeId?: string | null;
  embarcacaoNome: string;
  clienteNome: string;
  numero: string; // Formato: DS 0XX/AA (ex: DS 051/26)
  ano: number;
  dataEmissao: string;
  destinatario: string; // ex: "Sr. Rogelio / Armador OPUS"
  assunto: string;
  prazoEntregaDias: number;
  observacoesGerais: string;
  condicaoPagamento: string;
  status: ProposalStatus;
  itens: ScopeItem[];
  valorDesconto?: number;
  valorTotal: number;
  aceiteData?: string | null;
  aceiteAssinaturaNome?: string | null;
  elaboradoPor: string;
  criadoEm: string;
}

export interface FinancialEntry {
  id: string;
  embarcacaoId?: string;
  embarcacaoNome: string;
  clienteNome?: string;
  clienteCnpjCpf?: string;
  data: string;
  valor: number;
  tipo: 'sinal' | 'parcela' | 'quitacao' | 'despesa';
  natureza?: 'entrada' | 'saida';
  formaPagamento: 'PIX' | 'Transferência Bancária' | 'Boleto' | 'Cheque' | 'Dinheiro';
  observacao: string;
  lancadoPorNome: string;
  notaFiscalNumero?: string;
  notaFiscalUrl?: string;
  notaFiscalNome?: string;
  notaFiscalDataEmissao?: string;
  reciboNumero?: string;
  reciboEmitidoEm?: string;
  contaReceberId?: string;
  contaPagarId?: string;
  fornecedorId?: string;
  categoriaId?: string;
  competencia?: string;
  vencimento?: string;
  fornecedorNome?: string;
  categoriaNome?: string;
  isStorno?: boolean;
  stornoReason?: string;
  situacaoConciliacao?: 'conciliado' | 'requer_conciliacao';
}

export interface AccountPayable {
  id: string;
  fornecedorId?: string;
  fornecedorNome?: string;
  categoriaId?: string;
  categoriaNome?: string;
  embarcacaoId?: string;
  descricao: string;
  valorOriginal: number;
  valorPago?: number;
  saldo?: number;
  vencimento?: string;
  competencia?: string;
  status: 'pendente' | 'parcial' | 'pago' | 'cancelado';
}

export interface Protocol {
  id: string;
  numeroProtocolo: string;
  dataEnvio: string;
  embarcacaoId: string;
  embarcacaoNome: string;
  clienteNome: string;
  tipoProtocolo: 'capitania_dpc' | 'certificadora' | 'entrega_cliente' | 'outros';
  destinatario: string;
  orgaoOuEmpresa: string;
  documentosIncluidos: string[];
  responsavelEnvioNome: string;
  status: 'rascunho' | 'aguardando_analise' | 'exigencia_recebida' | 'correcao_em_elaboracao' | 'correcao_enviada' | 'aprovado' | 'cancelado' | 'em_trânsito' | 'protocolado' | 'exigencia' | 'concluido';
  osId?: string;
  canal?: string;
  cicloAtual?: number;
  requerConciliacao?: boolean;
  remessas?: ProtocolDispatch[];
  anexos?: ProtocolAttachment[];
  arquivosFinais?: ApprovedDocumentFile[];
  eventos?: Array<{ id: string; tipo: string; descricao: string; createdAt?: string; autorNome?: string }>;
  codigoRastreio?: string;
  comprovanteNome?: string;
  comprovanteUrl?: string;
  observacoes?: string;
  entregaStatus?: string | null;
}

export interface ProtocolDispatchDocument {
  id: string;
  documentoId: string;
  versaoId: string;
  versao: number;
  tituloDocumento: string;
  resultado: string;
}

export interface ProtocolDispatch {
  id: string;
  ciclo: number;
  tipo: 'inicial' | 'correcao';
  dataEnvio: string;
  referenciaExterna?: string;
  canal?: string;
  destinatario?: string;
  observacao?: string;
  enviadoPorNome?: string;
  enviadoEm?: string;
  situacao?: string;
  documentos: ProtocolDispatchDocument[];
  respostas?: any[];
}

export interface ProtocolAttachment {
  id?: string;
  arquivoUrl: string;
  arquivoNome: string;
  tipoMime?: string;
  tamanho?: number;
}

export interface CriticalPending {
  id: string;
  tipo: 'prazo_vencido' | 'documento_devolvido' | 'exigencia_certificadora' | 'sinal_pendente';
  titulo: string;
  embarcacaoNome: string;
  detalhe: string;
  urgencia: 'alta' | 'media';
  data: string;
}

export interface DashboardSummary {
  metrics: {
    openVessels: number;
    documentsInExecution: number;
    awaitingCertifier: number;
    totalToReceive: number;
  };
  pipeline: {
    propostas: number;
    vistorias: number;
    laudos: number;
    certificadoras: number;
    entrega: number;
    faturamento: number;
  };
  financialPendencies?: Array<{
    receivableId: string;
    vesselId?: string;
    vesselName: string;
    osId?: string;
    osNumber?: string;
    balance: number;
  }>;
  deadlines: Array<{
    id: string;
    osId: string;
    titulo: string;
    prazo: string;
    horario?: string;
    responsavelId?: string;
  }>;
  teamWorkload: Array<{
    userId: string;
    nome: string;
    cargo: string;
    avatarUrl?: string;
    activeItems: number;
  }>;
}

// ===== Permissões acumuláveis =====
export type Permission =
  | 'cadastrar_clientes_embarcacoes_propostas'
  | 'registrar_aceite_agendar'
  | 'executar_vistoria'
  | 'anexar_editar_versoes'
  | 'revisar_documentos'
  | 'aprovar_tecnicamente'
  | 'registrar_envio_resposta_externa'
  | 'executar_entregas'
  | 'entregar_concluir'
  | 'financeiro_administracao';

export const ALL_PERMISSIONS: Permission[] = [
  'cadastrar_clientes_embarcacoes_propostas',
  'registrar_aceite_agendar',
  'executar_vistoria',
  'anexar_editar_versoes',
  'revisar_documentos',
  'aprovar_tecnicamente',
  'registrar_envio_resposta_externa',
  'executar_entregas',
  'entregar_concluir',
  'financeiro_administracao',
];

export type ModuleAccess =
  | 'vessels' | 'registrations' | 'commitments' | 'tasks' | 'proposals'
  | 'renewals' | 'service-orders' | 'financial' | 'protocols' | 'documents' | 'settings';

// ===== Ordem de Serviço =====
export type OsStatus =
  | 'aguardando_agendamento'
  | 'visita_agendada'
  | 'vistoria_em_execucao'
  | 'documentacao_em_elaboracao'
  | 'revisao_interna'
  | 'aguardando_envio_externo'
  | 'em_analise_externa'
  | 'exigencia_externa'
  | 'aprovado_externamente'
  | 'aguardando_entrega'
  | 'validacao_final'
  | 'concluida'
  | 'cancelada';

export interface ServiceOrder {
  id: string;
  numero: string;
  propostaNumero?: string;
  embarcacaoNome?: string;
  clienteNome?: string;
  quantidadeServicos?: number;
  servicosSemResponsavel?: number;
  servicosSemAgendamento?: number;
  servicos?: ServiceOrderItem[];
  tecnicosIds?: string[];
  propostaId?: string;
  embarcacaoId?: string;
  clienteId?: string;
  status: OsStatus;
  statusLabel?: string;
  responsavelTecnicoId?: string;
  dataAceite?: string;
  dataConclusao?: string;
  observacoes?: string;
  createdAt?: string;
  documentos?: Document[];
  submissoesExternas?: ExternalSubmission[];
  entregas?: Delivery[];
  entregaResumo?: DeliverySummary;
}

export interface ServiceOrderItem {
  id: string;
  osId: string;
  descricao: string;
  quantidade?: number;
  valorUnitario?: number;
  tipo?: string;
  status?: string;
  tecnicoResponsavelId?: string;
  relatorioUrl?: string;
  relatorioNome?: string;
  dataAgendada?: string;
  horarioAgendado?: string;
  localAgendado?: string;
  contatoAgendamento?: string;
  observacoesAgendamento?: string;
  responsavelNome?: string;
  observacoes?: ServiceOrderItemComment[];
}

export interface ServiceOrderItemComment {
  id: string;
  itemId: string;
  osId: string;
  autorId?: string;
  autorNome: string;
  texto: string;
  createdAt?: string;
}

export interface Schedule {
  id: string;
  osId: string;
  status: 'pendente' | 'agendado' | 'realizado' | 'cancelado';
  data?: string;
  horario?: string;
  local?: string;
  contato?: string;
  observacoes?: string;
  tecnicoResponsavelId?: string;
}

export interface DocumentVersion {
  id: string;
  documentoId: string;
  versao: number;
  versaoLabel?: string;
  arquivoNomeFisico: string;
  arquivoNomeOriginal: string;
  tamanho?: number;
  tipoMime?: string;
  autorId?: string;
  autorNome?: string;
  data?: string;
  comentario?: string;
  origem: 'vistoria' | 'correcao_interna' | 'exigencia_externa';
  situacaoRevisao?: string;
  situacaoAprovacao?: string;
  aprovadoPorId?: string;
  aprovadoEm?: string;
  pdfUrl?: string; // URL para PDF editado/gerado
}

export interface Document {
  id: string;
  osId: string;
  titulo: string;
  tipo: string;
  status: string;
  versaoAtual: number;
  versoes?: DocumentVersion[];
  aplicavelAnaliseExterna?: boolean;
}

export interface ExternalSubmission {
  id: string;
  osId: string;
  documentoId?: string;
  versaoEnviada?: number;
  orgaoOuCertificadora: string;
  dataEnvio?: string;
  protocolo?: string;
  observacao?: string;
  respostas?: ExternalResponse[];
}

export interface ExternalResponse {
  id: string;
  submissaoId: string;
  tipo: 'aprovacao' | 'exigencia';
  data?: string;
  motivo?: string;
  anexoUrl?: string;
  anexoNome?: string;
  versaoAprovada?: number;
}

export interface Delivery {
  id: string;
  osId: string;
  status: 'pendente' | 'em_entrega' | 'aguardando_complemento' | 'pronta_validacao' | 'concluida' | 'cancelada' | string;
  responsavelId?: string;
  iniciadaEm?: string;
  motivoReabertura?: string;
  dataEntrega?: string;
  meioEntrega?: string;
  nomeRecebedor?: string;
  comprovanteUrl?: string;
  comprovanteNome?: string;
  remessas?: DeliveryDispatch[];
  documentosAprovados?: ApprovedDocumentFile[];
}

export interface DeliverySummary extends Delivery {
  acaoEntregaPendente: boolean;
  ultimaRemessa?: DeliveryDispatch;
}

export interface ApprovedDocumentFile { id: string; documentoId: string; versaoId?: string; arquivoUrl: string; arquivoNome: string; createdAt?: string; }
export interface DeliveryDispatch { id: string; tipo: 'parcial' | 'final' | 'historica_indefinida'; dataEntrega: string; meioEntrega: string; nomeRecebedor: string; destino: string; referencia?: string; comprovanteUrl: string; comprovanteNome: string; arquivosAprovados?: ApprovedDocumentFile[]; }

export interface OsEvent {
  id: string;
  osId: string;
  tipo: string;
  autorId?: string;
  autorNome?: string;
  descricao?: string;
  dados?: any;
  createdAt?: string;
}

export interface InternalNotification {
  id: string;
  usuarioId: string;
  tipo: string; // atribuicao, revisao, exigencia, aprovacao, entrega, vistoria_inicio, vistoria_conclusao, documento_anexado, impressao_confirmada, entrega_confirmada
  titulo: string;
  mensagem?: string;
  lida: boolean;
  osId?: string;
  compromissoId?: string;
  prioridade?: string; // normal, alta, critica
  createdAt?: string;
}

export interface ServiceOrderDetail extends ServiceOrder {
  itens: ServiceOrderItem[];
  agendamento: Schedule[];
  documentos: Document[];
  submissoesExternas: ExternalSubmission[];
  entregas: Delivery[];
  eventos: OsEvent[];
  proposta?: any;
  embarcacao?: any;
  tecnicoResponsavel?: { id: string; nome: string; email: string } | null;
  protocolos?: Protocol[];
  bloqueiosConclusao?: Array<{ tipo: string; titulo: string; detalhe: string; saldo?: number }>;
}

// ===== Fluxo de proposta =====
export type AcceptanceMeio = 'presencial' | 'email' | 'whatsapp' | 'outro';
export type FinancialSituation = 'pendente' | 'parcial' | 'integral';
export type ReceivableStatus = 'pendente' | 'parcial' | 'pago' | 'cancelado';

export interface ProposalAcceptance {
  id: string;
  propostaId: string;
  meio: AcceptanceMeio;
  responsavelNome: string;
  data?: string;
  observacao?: string;
  usuarioId?: string;
  usuarioNome?: string;
  documentoUrl?: string;
  documentoNome?: string;
  origem?: string;
  createdAt?: string;
}

export interface ProposalDelivery {
  id: string;
  propostaId: string;
  canal: 'email' | 'whatsapp';
  destinatario?: string;
  status: 'enviado' | 'falha';
  erro?: string;
  usuarioId?: string;
  usuarioNome?: string;
  data?: string;
  createdAt?: string;
}

export interface AccountReceivable {
  id: string;
  propostaId: string;
  osId?: string;
  embarcacaoId?: string;
  clienteId?: string;
  valorOriginal: number;
  status: ReceivableStatus;
  valorPago?: number;
  saldo?: number;
  propostaNumero?: string;
  osNumero?: string;
  createdAt?: string;
}

export interface FinancialSummary {
  totalBilled: number;
  totalReceived: number;
  totalToReceive: number;
  totalExpenses: number;
  netProfit: number;
  receivablesCount: number;
  pendingReceivablesCount: number;
  overdueReceivablesCount: number;
  payablesOpen: number;
  payablesPaid: number;
  payablesOverdueCount: number;
  payablesCount: number;
}

export interface Payment {
  id: string;
  contaReceberId?: string;
  propostaId?: string;
  osId?: string;
  embarcacaoId?: string;
  valor: number;
  data?: string;
  formaPagamento?: string;
  observacao?: string;
  lancadoPorNome?: string;
  financialEntryId?: string;
  ativo?: boolean;
  createdAt?: string;
}

export interface Receipt {
  id: string;
  numero: string;
  dataEmissao?: string;
  emissorNome?: string;
  paymentId?: string;
  contaReceberId?: string;
  status: 'ativo' | 'cancelado';
  createdAt?: string;
}

export interface AcceptPayload {
  meio: AcceptanceMeio;
  responsavelNome: string;
  data?: string;
  observacao?: string;
  situacaoFinanceira: FinancialSituation;
  valorRecebido?: number;
  dataPagamento?: string;
  formaPagamento?: string;
}
