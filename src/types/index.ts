export type UserRole = 'admin' | 'financeiro' | 'tecnico';

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
  email: string;
}

export interface Vessel {
  id: string;
  clienteId: string;
  clienteNome: string;
  nome: string;
  tipo: string; // Empurrador, Balsa, Rebocador, Ferry Boat, etc.
  registro: string;
  status: VesselStatus;
  certificadoraPrincipal: Certificadora;
  valorTotal: number;
  valorSinal: number;
  valorRecebido: number;
  criadoEm: string;
  descricao?: string;
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
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export type ProposalStatus = 'rascunho' | 'enviado' | 'aprovado' | 'recusado';

export interface Proposal {
  id: string;
  embarcacaoId: string;
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
  valorTotal: number;
  aceiteData?: string | null;
  aceiteAssinaturaNome?: string | null;
  elaboradoPor: string;
  criadoEm: string;
}

export interface FinancialEntry {
  id: string;
  embarcacaoId: string;
  embarcacaoNome: string;
  clienteNome?: string;
  data: string;
  valor: number;
  tipo: 'sinal' | 'parcela' | 'quitacao' | 'despesa';
  formaPagamento: 'PIX' | 'Transferência Bancária' | 'Boleto' | 'Cheque' | 'Dinheiro';
  observacao: string;
  lancadoPorNome: string;
  notaFiscalNumero?: string;
  notaFiscalUrl?: string;
  notaFiscalNome?: string;
  notaFiscalDataEmissao?: string;
  reciboNumero?: string;
  reciboEmitidoEm?: string;
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
  status: 'em_trânsito' | 'protocolado' | 'exigencia' | 'concluido';
  codigoRastreio?: string;
  comprovanteNome?: string;
  comprovanteUrl?: string;
  observacoes?: string;
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
