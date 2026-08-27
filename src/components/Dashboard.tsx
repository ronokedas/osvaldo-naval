import React, { useState } from 'react';
import { User, Vessel, DocumentTask, Proposal, CriticalPending, FinancialEntry, ServiceOrder, DashboardSummary } from '../types';
import {
  Ship,
  Clock,
  Award,
  DollarSign,
  Plus,
  ArrowRight,
  AlertTriangle,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Calendar,
  Zap,
  CheckCircle2,
  FileText,
  Send,
  Filter,
  BarChart2,
  Activity,
  Layers,
  BellRing,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDateBR } from '../utils/date-formatters';
import { hasModuleAccess } from '../access-control';

const hasPerm = (user: User | null | undefined, permission: string) => !!user && (user.role === 'admin' || (user.permissions || []).includes(permission));

const getGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 5) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

interface DashboardProps {
  currentUser: User;
  users: User[];
  vessels: Vessel[];
  tasks: DocumentTask[];
  proposals: Proposal[];
  criticalPendings: CriticalPending[];
  financialEntries: FinancialEntry[];
  serviceOrders: ServiceOrder[];
  summary?: DashboardSummary | null;
  onSelectVessel: (vessel: Vessel) => void;
  onNavigateTab: (destination: { tab: string; serviceOrderStatuses?: string[]; proposalStatuses?: string[]; vesselStatus?: 'aberta' | 'concluida' | 'todos'; financialFilter?: 'pending' }) => void;
  onCreateProposalClick: () => void;
  onCreateCommitmentClick?: () => void;
  onOpenServiceOrder: (orderId: string) => void;
  onStartService: (orderId: string, itemId: string) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  users,
  vessels,
  tasks,
  proposals,
  criticalPendings,
  financialEntries,
  serviceOrders,
  summary,
  onSelectVessel,
  onNavigateTab,
  onCreateProposalClick,
  onCreateCommitmentClick,
  onOpenServiceOrder,
  onStartService,
}) => {
  const [activeTabMode, setActiveTabMode] = useState<'pipeline' | 'smart_actions' | 'chart'>('pipeline');
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Metrics calculation
  const openVessels = vessels.filter((v) => v.status === 'aberta');
  const tasksInExecution = tasks.filter((t) => t.status === 'execucao' || t.status === 'em_revisao');
  const tasksWaitingCertifier = tasks.filter((t) => t.status === 'enviado' || t.status === 'exigencia');
  const metricOpenVessels = summary?.metrics.openVessels ?? openVessels.length;
  const metricDocumentsInExecution = summary?.metrics.documentsInExecution ?? tasksInExecution.length;
  const metricAwaitingCertifier = summary?.metrics.awaitingCertifier ?? tasksWaitingCertifier.length;
  const operationalServices = serviceOrders
    .flatMap((order) => (order.servicos || []).map((item) => ({ order, item })))
    .filter(({ item }) => item.status !== 'concluido')
    .filter(({ item }) => currentUser.role === 'admin' || item.tecnicoResponsavelId === currentUser.id)
    .sort((a, b) => {
      if (!a.item.tecnicoResponsavelId && b.item.tecnicoResponsavelId) return -1;
      if (a.item.tecnicoResponsavelId && !b.item.tecnicoResponsavelId) return 1;
      if (a.item.status === 'em_execucao' && b.item.status !== 'em_execucao') return -1;
      return 0;
    });
  const myDeliveryOrders = serviceOrders.filter((order) => {
    const delivery = order.entregaResumo;
    return Boolean(delivery?.acaoEntregaPendente && (currentUser.role === 'admin' || delivery.responsavelId === currentUser.id));
  });

  // Financial total to receive
  const totalToReceive = summary?.metrics.totalToReceive ?? vessels.reduce((acc, v) => acc + (v.valorTotal - v.valorRecebido), 0);

  // Pipeline Stage Calculations
  const pipelineStages = [
    {
      id: 'propostas',
      title: 'Propostas em Aberto',
      roleOwner: 'Deisy (Comercial)',
      count: summary?.pipeline.propostas ?? proposals.filter((p) => p.status === 'enviado' || p.status === 'rascunho').length,
      icon: FileText,
      color: 'from-amber-500 to-orange-600',
      description: 'Aguardando aceite do cliente',
      targetTab: 'proposals',
      targetStatuses: ['enviado', 'rascunho'],
    },
    {
      id: 'vistorias',
      title: 'Vistorias & Ultrassom',
      roleOwner: 'Equipe de Campo',
      count: summary?.pipeline.vistorias ?? serviceOrders.filter((os) => os.status === 'visita_agendada' || os.status === 'vistoria_em_execucao').length,
      icon: Activity,
      color: 'from-blue-500 to-cyan-600',
      description: 'Medição de espessura e vistorias físicas',
      targetTab: 'service-orders',
      targetStatuses: ['visita_agendada', 'vistoria_em_execucao'],
    },
    {
      id: 'laudos',
      title: 'Laudos & Desenhos',
      roleOwner: 'Desenhistas / Técnicos',
      count: summary?.pipeline.laudos ?? serviceOrders.filter((os) => os.status === 'documentacao_em_elaboracao' || os.status === 'revisao_interna').length,
      icon: Layers,
      color: 'from-purple-500 to-indigo-600',
      description: 'Elaboração e revisão técnica',
      targetTab: 'service-orders',
      targetStatuses: ['documentacao_em_elaboracao', 'revisao_interna'],
    },
    {
      id: 'certificadoras',
      title: 'Em Certificadora',
      roleOwner: 'DPC / Capitania / RBNA',
      count: summary?.pipeline.certificadoras ?? serviceOrders.filter((os) => ['aguardando_envio_externo', 'em_analise_externa', 'exigencia_externa'].includes(os.status)).length,
      icon: Award,
      color: 'from-indigo-500 to-violet-600',
      description: 'Aguardando chancela ou sanar exigência',
      targetTab: 'service-orders',
      targetStatuses: ['aguardando_envio_externo', 'em_analise_externa', 'exigencia_externa'],
    },
    {
      id: 'entrega',
      title: 'Aguardando Entrega',
      roleOwner: 'Lucas (Entrega)',
      count: summary?.pipeline.entrega ?? serviceOrders.filter((os) => os.status === 'aguardando_entrega').length,
      icon: Send,
      color: 'from-teal-500 to-emerald-600',
      description: 'Documentos prontos para envio ao cliente',
      targetTab: 'service-orders',
      targetStatuses: ['aguardando_entrega'],
    },
    {
      id: 'faturamento',
      title: 'Faturamento Pendente',
      roleOwner: 'Financeiro',
      count: summary?.pipeline.faturamento ?? vessels.filter((v) => v.valorTotal > v.valorRecebido).length,
      icon: DollarSign,
      color: 'from-emerald-500 to-green-600',
      description: 'Parcelas em aberto por embarcação',
      targetTab: 'financial',
      targetFilter: 'pending' as const,
    },
  ];
  const visiblePipelineStages = pipelineStages.filter((stage) => {
    if (stage.targetTab === 'proposals') return hasModuleAccess(currentUser, 'proposals');
    if (stage.targetTab === 'financial') return hasModuleAccess(currentUser, 'financial');
    return hasModuleAccess(currentUser, 'service-orders');
  });

  // Smart Actions Recommendation Generation
  const smartActions = [
    ...proposals
      .filter((p) => p.status === 'enviado')
      .map((p) => ({
        id: `act-prop-${p.id}`,
        title: `Fazer follow-up com cliente ${p.clienteNome}`,
        subtitle: `Proposta ${p.numero} (${p.embarcacaoNome || 'Geral'}) no valor de R$ ${p.valorTotal.toLocaleString('pt-BR')}`,
        role: 'comercial',
        tag: 'Deisy (Comercial)',
        priority: 'alta' as const,
        icon: FileText,
        actionLabel: 'Ver Proposta',
        onClick: () => onNavigateTab({ tab: 'proposals', proposalStatuses: ['enviado'] }),
      })),
    ...proposals
      .filter((p) => p.status === 'aprovado' && !serviceOrders.some(os => os.propostaNumero === p.numero))
      .map((p) => ({
        id: `act-prop-aprov-${p.id}`,
        title: `Criar OS para Proposta Aprovada: ${p.clienteNome}`,
        subtitle: `A proposta ${p.numero} foi aceita, mas a Ordem de Serviço ainda não foi gerada.`,
        role: 'tecnico',
        tag: 'Engenharia',
        priority: 'alta' as const,
        icon: Plus,
        actionLabel: 'Ver Proposta',
        onClick: () => onNavigateTab({ tab: 'proposals', proposalStatuses: ['aprovado'] }),
      })),
    ...serviceOrders
      .filter((os) => os.status === 'exigencia_externa')
      .map((os) => ({
        id: `act-os-exg-${os.id}`,
        title: `URGENTE: Sanar exigência na OS ${os.numero}`,
        subtitle: `${os.embarcacaoNome || 'Embarcação'} recebeu exigência da certificadora.`,
        role: 'tecnico',
        tag: 'Equipe Técnica',
        priority: 'critica' as const,
        icon: AlertTriangle,
        actionLabel: 'Ver OS',
        onClick: () => {
          onNavigateTab({ tab: 'service-orders', serviceOrderStatuses: ['exigencia_externa'] });
          onOpenServiceOrder(os.id);
        },
      })),
    ...serviceOrders
      .filter((os) => os.entregaResumo?.acaoEntregaPendente)
      .map((os) => ({
        id: `act-os-pronto-${os.id}`,
        title: `Entregar documento final da OS ${os.numero}`,
        subtitle: `Os documentos da embarcação ${os.embarcacaoNome || 'Geral'} estão prontos para envio.`,
        role: 'entrega',
        tag: 'Lucas (Entrega)',
        priority: 'alta' as const,
        icon: Send,
        actionLabel: 'Fazer Entrega',
        onClick: () => {
          onNavigateTab({ tab: 'service-orders', serviceOrderStatuses: ['aguardando_entrega'] });
          onOpenServiceOrder(os.id);
        },
      })),
    ...(summary?.financialPendencies || vessels
      .filter((v) => v.status === 'aberta' && v.valorTotal - v.valorRecebido > 0)
      .map((v) => ({ vesselId: v.id, vesselName: v.nome, balance: v.valorTotal - v.valorRecebido })))
      .slice(0, 3)
      .map((item) => ({
        id: `act-vessel-fin-${item.vesselId || item.vesselName}`,
        title: `Cobrar/Faturar parcela de ${item.vesselName}`,
        subtitle: `Saldo pendente: R$ ${item.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        role: 'financeiro',
        tag: 'Financeiro',
        priority: 'media' as const,
        icon: DollarSign,
        actionLabel: 'Ver Financeiro',
        onClick: () => onNavigateTab({ tab: 'financial', financialFilter: 'pending' }),
      })),
  ];

  const visibleSmartActions = currentUser.role === 'tecnico'
    ? smartActions.filter((act) => act.role === 'tecnico' || (act.role === 'entrega' && hasPerm(currentUser, 'executar_entregas')))
    : smartActions;
  const filteredSmartActions = visibleSmartActions.filter((act) => roleFilter === 'all' || act.role === roleFilter);

  // Chart Data Preparation
  const chartData = vessels.slice(0, 6).map(v => ({
    name: v.nome.split(' ')[0], // Short name
    Recebido: v.valorRecebido,
    Pendente: v.valorTotal - v.valorRecebido,
  }));

  const teamWorkload = summary?.teamWorkload || users.map((user) => ({
    userId: user.id,
    nome: user.nome,
    cargo: user.cargo,
    avatarUrl: user.avatarUrl,
    activeItems: tasks.filter((task) => task.responsavelId === user.id && task.status !== 'baixado').length,
  }));

  // Status Badge color styling helper
  const getOsStatusBadge = (status: string) => {
    switch (status) {
      case 'vistoria_em_execucao':
      case 'documentacao_em_elaboracao':
        return { label: 'Em execução', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'revisao_interna':
        return { label: 'Revisão Interna', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'em_analise_externa':
      case 'aguardando_envio_externo':
        return { label: 'Na certificadora', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'exigencia_externa':
        return { label: 'Exigência', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'aguardando_entrega':
      case 'aprovado_externamente':
        return { label: 'Pronto / Liberado', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'concluida':
        return { label: 'Concluída', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' };
      case 'cancelada':
        return { label: 'Cancelada', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'sem_servico':
        return { label: 'Sem Serviço', bg: 'bg-slate-100 text-slate-500 border-slate-200' };
      case 'aguardando_agendamento':
      case 'visita_agendada':
      default:
        return { label: 'Agendamento / Início', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            {getGreeting()}, {currentUser.nome}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Aqui está o pulso da operação da Nautilus hoje.
          </p>
        </div>

        {(hasModuleAccess(currentUser, 'proposals') || hasModuleAccess(currentUser, 'commitments')) && (
          <div className="flex flex-wrap gap-3">
          {hasModuleAccess(currentUser, 'proposals') && hasPerm(currentUser, 'cadastrar_clientes_embarcacoes_propostas') && <button
            onClick={onCreateProposalClick}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Nova Proposta
          </button>}
          {hasModuleAccess(currentUser, 'commitments') && onCreateCommitmentClick && currentUser.role === 'admin' && <button onClick={onCreateCommitmentClick} className="inline-flex items-center gap-2 rounded-xl bg-white border border-blue-200 px-4 py-3 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50">
            <BellRing className="w-5 h-5" /> Novo compromisso
          </button>}
          </div>
        )}
      </div>

      {hasModuleAccess(currentUser, 'service-orders') && <section className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#0B192C]"><Clock className="h-5 w-5 text-blue-600" /> {currentUser.role === 'admin' ? 'Controle dos serviços das OS' : 'Minhas Ordens de Serviço'}</h2>
            <p className="mt-1 text-xs text-slate-500">{currentUser.role === 'admin' ? 'Acompanhe atribuições e serviços em execução pela equipe.' : 'Serviços atribuídos a você aparecem aqui até serem concluídos.'}</p>
          </div>
          <button onClick={() => onNavigateTab({ tab: 'service-orders' })} className="self-start rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700">Ver todas as OS</button>
        </div>
        {operationalServices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-5 text-center text-sm text-slate-500">Nenhum serviço ativo atribuído no momento.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {operationalServices.slice(0, 9).map(({ order, item }) => {
              const isMine = item.tecnicoResponsavelId === currentUser.id;
              const isUnassigned = !item.tecnicoResponsavelId;
              const isScheduled = Boolean(item.dataAgendada && item.horarioAgendado);
              return (
                <div key={item.id} className={`rounded-xl border bg-white p-4 shadow-sm ${isUnassigned ? 'border-amber-300' : item.status === 'em_execucao' ? 'border-blue-300' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-blue-800">{order.numero}</p>
                      <h3 className="mt-1 truncate text-sm font-bold text-slate-900" title={item.descricao}>{item.descricao}</h3>
                      <p className="mt-1 text-xs text-slate-500">{order.embarcacaoNome || 'Embarcação não informada'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase ${isUnassigned ? 'bg-amber-100 text-amber-800' : item.status === 'em_execucao' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>{isUnassigned ? 'Sem funcionário' : item.status === 'em_execucao' ? 'Em execução' : 'Aguardando início'}</span>
                  </div>
                  <p className={`mt-3 text-xs font-bold ${isUnassigned ? 'text-amber-700' : 'text-slate-600'}`}>Responsável: {item.responsavelNome || 'Falta atribuir'}</p>
                  <p className={`mt-1 text-xs font-bold ${isScheduled ? 'text-indigo-700' : 'text-amber-700'}`}>{isScheduled ? `Agendado: ${formatDateBR(item.dataAgendada)} às ${item.horarioAgendado}` : 'Aguardando agendamento'}</p>
                  <button
                    onClick={() => isMine && item.status === 'pendente' && isScheduled ? onStartService(order.id, item.id) : onOpenServiceOrder(order.id)}
                    className={`mt-3 w-full rounded-lg px-3 py-2 text-xs font-bold text-white ${isMine && item.status === 'pendente' && isScheduled ? 'bg-blue-600 hover:bg-blue-700' : isUnassigned || !isScheduled ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-800 hover:bg-slate-900'}`}
                  >
                    {isMine && item.status === 'pendente' && isScheduled ? 'Iniciar serviço' : isUnassigned ? 'Atribuir funcionário' : !isScheduled ? (currentUser.role === 'admin' ? 'Agendar serviço' : 'Aguardando agendamento') : 'Abrir e acompanhar'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>}

      {hasPerm(currentUser, 'executar_entregas') && (
        <section className="rounded-2xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-extrabold text-orange-950"><Send className="h-5 w-5 text-orange-600" /> Minhas entregas</h2><p className="mt-1 text-xs text-orange-800">Documentos finais aprovados que aguardam sua remessa ao cliente.</p></div><span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">{myDeliveryOrders.length} pendente(s)</span></div>
          {myDeliveryOrders.length === 0 ? <p className="rounded-xl border border-dashed border-orange-200 bg-white/70 p-4 text-center text-sm text-slate-500">Nenhuma entrega atribuída no momento.</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{myDeliveryOrders.map((order) => <button key={order.id} onClick={() => onOpenServiceOrder(order.id)} className="rounded-xl border border-orange-200 bg-white p-4 text-left shadow-sm transition hover:border-orange-400 hover:shadow"><p className="font-mono text-xs font-black text-orange-700">{order.numero}</p><p className="mt-1 font-bold text-slate-900">{order.embarcacaoNome || 'Embarcação'}</p><p className="mt-1 text-xs text-slate-500">{order.clienteNome || 'Cliente não informado'}</p><span className="mt-3 inline-block rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white">Abrir e registrar remessa</span></button>)}</div>}
        </section>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        {hasModuleAccess(currentUser, 'vessels') && <button type="button"
        onClick={() => onNavigateTab({ tab: 'vessels', vesselStatus: 'aberta' })}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 text-left cursor-pointer hover:border-blue-300 hover:shadow-md hover:bg-slate-50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Ship className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono">{metricOpenVessels}</p>
              <p className="text-xs text-slate-500 font-medium group-hover:text-blue-600 transition-colors">embarcações abertas</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
        </button>}

        {/* Metric 2 */}
        {hasModuleAccess(currentUser, 'service-orders') && <button type="button"
        onClick={() => onNavigateTab({ tab: 'service-orders', serviceOrderStatuses: ['documentacao_em_elaboracao', 'revisao_interna'] })}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 text-left cursor-pointer hover:border-emerald-300 hover:shadow-md hover:bg-slate-50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono">{metricDocumentsInExecution}</p>
              <p className="text-xs text-slate-500 font-medium group-hover:text-emerald-600 transition-colors">documentos em execução</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
        </button>}

        {/* Metric 3 */}
        {hasModuleAccess(currentUser, 'service-orders') && <button type="button"
        onClick={() => onNavigateTab({ tab: 'service-orders', serviceOrderStatuses: ['aguardando_envio_externo', 'em_analise_externa', 'exigencia_externa'] })}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 text-left cursor-pointer hover:border-indigo-300 hover:shadow-md hover:bg-slate-50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono">{metricAwaitingCertifier}</p>
              <p className="text-xs text-slate-500 font-medium group-hover:text-indigo-600 transition-colors">aguardando certificadora</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
        </button>}

        {/* Metric 4 */}
        {hasModuleAccess(currentUser, 'financial') && <button type="button"
        onClick={() => onNavigateTab({ tab: 'financial', financialFilter: 'pending' })}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 text-left cursor-pointer hover:border-teal-300 hover:shadow-md hover:bg-slate-50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900 font-mono">
                R$ {totalToReceive.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-slate-500 font-medium group-hover:text-teal-600 transition-colors">a receber por embarcação</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors shrink-0" />
        </button>}
      </div>

      {/* Main Content Layout: Table + Right Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vessels Operation Table & Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Intelligent Operational Hub Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Hub Inteligente de Operações Navais</h2>
                  <p className="text-xs text-slate-500">
                    Acompanhamento visual do ciclo de vida e gargalos em tempo real
                  </p>
                </div>
              </div>

              {/* View Selector Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
                <button
                  onClick={() => setActiveTabMode('pipeline')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    activeTabMode === 'pipeline'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Ciclo Naval
                </button>
                <button
                  onClick={() => setActiveTabMode('smart_actions')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    activeTabMode === 'smart_actions'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Ações Recomendadas ({filteredSmartActions.length})
                </button>
                <button
                  onClick={() => setActiveTabMode('chart')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    activeTabMode === 'chart'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  Gráficos
                </button>
              </div>
            </div>

            {/* MODE 1: NAVAL WORKFLOW PIPELINE */}
            {activeTabMode === 'pipeline' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {visiblePipelineStages.map((stage) => {
                    const Icon = stage.icon;
                    const isSelected = selectedPipelineStage === stage.id;

                    return (
                      <button type="button"
                        key={stage.id}
                        onClick={() => onNavigateTab({
                          tab: stage.targetTab,
                          serviceOrderStatuses: stage.targetTab === 'service-orders' ? stage.targetStatuses : undefined,
                          proposalStatuses: stage.targetTab === 'proposals' ? stage.targetStatuses : undefined,
                          financialFilter: stage.targetTab === 'financial' ? 'pending' : undefined,
                        })}
                        className={`p-4 rounded-xl border text-left transition cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`p-2 rounded-lg text-white bg-gradient-to-r ${stage.color} shadow-sm`}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="font-mono text-xl font-black text-slate-900">
                            {stage.count}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                          {stage.title}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                          {stage.roleOwner}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-blue-600 font-bold">
                          <span>{stage.description}</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-Panel when clicking a stage */}
                {selectedPipelineStage && (() => {
                  const stage = visiblePipelineStages.find((s) => s.id === selectedPipelineStage);
                  const isOpenProposals = selectedPipelineStage === 'propostas';
                  const openProposalsList = isOpenProposals 
                    ? proposals.filter((p) => p.status === 'enviado' || p.status === 'rascunho')
                    : [];

                  return (
                    <div className="p-4 bg-slate-50 rounded-xl border border-blue-200 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          Itens na fase:{' '}
                          <span className="text-blue-600">
                            {stage?.title}
                          </span>
                        </h4>
                        {!isOpenProposals && (
                          <button
                            onClick={() =>
                              onNavigateTab({
                                tab: (stage?.targetTab || 'service-orders') as string,
                                serviceOrderStatuses: stage?.targetStatuses,
                                proposalStatuses: stage?.targetTab === 'proposals' ? stage?.targetStatuses : undefined,
                                financialFilter: stage?.targetTab === 'financial' ? 'pending' : undefined,
                              })
                            }
                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            Gerenciar na aba dedicada <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {isOpenProposals && openProposalsList.length > 0 ? (
                        <div className="space-y-2 mt-3">
                          {openProposalsList.map((proposal) => (
                            <div
                              key={proposal.id}
                              onClick={() => {
                                // Navigate to proposals tab and select this proposal
                                onNavigateTab({ tab: 'proposals', proposalStatuses: ['enviado', 'rascunho'] });
                                // Dispatch custom event to open the specific proposal
                                window.dispatchEvent(new CustomEvent('open-proposal', { detail: proposal.id }));
                              }}
                              className="bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                                      Proposta {proposal.numero}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {proposal.embarcacaoNome} • {proposal.clienteNome}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-slate-900 text-sm">
                                    R$ {proposal.valorTotal.toLocaleString('pt-BR')}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {proposal.status === 'enviado' ? 'Aguardando aceite' : 'Rascunho'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Isto reflete diretamente o fluxo oficial da engenharia naval da Nautilus (Proposta → Processo → Vistoria → Laudo → Certificadora → Entrega → Faturamento).
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* MODE 2: SMART ACTIONS HUB */}
            {activeTabMode === 'smart_actions' && (
              <div className="space-y-4">
                {/* Role Filter */}
                <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
                  <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
                    <Filter className="w-3.5 h-3.5" /> Filtrar por equipe:
                  </span>
                  {[
                    { id: 'all', label: 'Todas as Áreas' },
                    { id: 'comercial', label: 'Comercial (Deisy)' },
                    { id: 'tecnico', label: 'Campo / Desenho' },
                    { id: 'entrega', label: 'Entrega (Lucas)' },
                    { id: 'financeiro', label: 'Financeiro' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setRoleFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition cursor-pointer ${
                        roleFilter === f.id
                          ? 'bg-slate-900 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Actions List */}
                <div className="space-y-2.5">
                  {filteredSmartActions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Nenhuma ação urgente pendente para esta área no momento. Operação em dia!
                    </div>
                  ) : (
                    filteredSmartActions.map((act) => {
                      const Icon = act.icon;
                      const priorityColor =
                        act.priority === 'critica'
                          ? 'border-l-4 border-l-red-500 bg-red-50/30'
                          : act.priority === 'alta'
                          ? 'border-l-4 border-l-amber-500 bg-amber-50/20'
                          : 'border-l-4 border-l-blue-500 bg-blue-50/20';

                      return (
                        <div
                          key={act.id}
                          className={`p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition ${priorityColor}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0 shadow-2xs mt-0.5">
                              <Icon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-slate-900 text-xs">{act.title}</h3>
                                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {act.tag}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{act.subtitle}</p>
                            </div>
                          </div>

                          <button
                            onClick={act.onClick}
                            className="inline-flex items-center justify-center gap-1 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shrink-0 cursor-pointer shadow-sm"
                          >
                            {act.actionLabel}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* MODE 3: FINANCIAL CHART */}
            {activeTabMode === 'chart' && (
              <div className="space-y-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748B' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748B' }}
                        tickFormatter={(value) => `R$ ${value / 1000}k`}
                      />
                      <Tooltip
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                        cursor={{ fill: '#F1F5F9' }}
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow:
                            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Recebido" stackId="a" fill="#059669" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Pendente" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Vessels Table Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Operação por embarcação</h2>
              <p className="text-xs text-slate-500">Acompanhe responsáveis, prazos e certificadoras.</p>
            </div>
            <button
              onClick={() => onNavigateTab({ tab: 'vessels', vesselStatus: 'todos' })}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 pb-2">
                  <th className="pb-3 font-semibold">Embarcação</th>
                  <th className="pb-3 font-semibold">Serviço Principal</th>
                  <th className="pb-3 font-semibold">Responsável</th>
                  <th className="pb-3 font-semibold">Prazo</th>
                  <th className="pb-3 font-semibold">Certificadora</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vessels.slice(0, 6).map((v) => {
                  const vesselOsList = serviceOrders.filter((os) => os.embarcacaoId === v.id || os.embarcacaoNome === v.nome);
                  const mainOs = vesselOsList[0];
                  
                  const hasTasks = tasks.some(t => t.embarcacaoId === v.id);
                  const displayTitle = mainOs 
                    ? `OS ${mainOs.numero}` 
                    : hasTasks ? 'Serviços pendentes (Tarefas)' : 'Sem serviço ativo';
                    
                  const respNome = mainOs && mainOs.responsavelTecnicoId ? (users.find(u => u.id === mainOs.responsavelTecnicoId)?.nome || 'A definir') : 'A definir';
                  const displayResp = respNome === 'A definir' ? 'A definir' : respNome.split(' ')[0];
                  
                  const displayStatus = mainOs ? mainOs.status : (hasTasks ? 'pendente' : 'sem_servico');
                  const badge = getOsStatusBadge(displayStatus);

                  return (
                    <tr
                      key={v.id}
                      onClick={() => onSelectVessel(v)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3 pr-3">
                        <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                          {v.nome}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{v.clienteNome}</p>
                      </td>
                      <td className="py-3 pr-3 text-slate-700 max-w-[150px] truncate">
                        {displayTitle}
                      </td>
                      <td className="py-3 pr-3 text-slate-800 whitespace-nowrap">
                        {displayResp}
                      </td>
                      <td className="py-3 pr-3 font-mono text-slate-600 whitespace-nowrap">
                        {v.status === 'concluida' ? 'Finalizada' : (mainOs?.dataConclusao ? formatDateBR(mainOs.dataConclusao) : 'Em andamento')}
                      </td>
                      <td className="py-3 pr-3 text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          <Award className="w-3 h-3 text-indigo-600" />
                          {v.certificadoraPrincipal || 'A definir'}
                        </span>
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>

        {/* Right Column: Side Widgets (Team & Critical Pendencies) */}
        <div className="space-y-6">
          {/* Calendário de Prazos (Próximos 5 Dias) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Prazos: Próximos 5 Dias
              </h3>
            </div>
            
            <div className="space-y-3">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const fiveDaysFromNow = new Date(today);
                fiveDaysFromNow.setDate(today.getDate() + 5);

                const upcomingTasks = summary
                  ? summary.deadlines.map((deadline) => ({
                      ...deadline,
                      embarcacaoNome: serviceOrders.find((order) => order.id === deadline.osId)?.embarcacaoNome || 'Embarcação não informada',
                      responsavelNome: users.find((user) => user.id === deadline.responsavelId)?.nome || 'A definir',
                    }))
                  : tasks
                      .filter(t => t.status !== 'baixado' && t.prazo)
                      .filter(t => {
                        const prazoDate = new Date(t.prazo + 'T00:00:00');
                        return prazoDate >= today && prazoDate <= fiveDaysFromNow;
                      })
                      .sort((a, b) => new Date(a.prazo + 'T00:00:00').getTime() - new Date(b.prazo + 'T00:00:00').getTime());

                if (upcomingTasks.length === 0) {
                  return (
                    <div className="text-center py-4 text-xs text-slate-500 italic">
                      Nenhum prazo crítico para os próximos dias.
                    </div>
                  );
                }

                return upcomingTasks.map(t => {
                  const prazoDate = new Date(t.prazo + 'T00:00:00');
                  const diffTime = prazoDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let colorClass = "text-purple-700 bg-purple-50 border-purple-200/80";
                  let tagClass = "bg-purple-100 text-purple-800";
                  let dueText = `em ${diffDays} dia(s)`;
                  
                  if (diffDays === 0) {
                    colorClass = "text-red-700 bg-red-50 border-red-200/80";
                    tagClass = "bg-red-100 text-red-800";
                    dueText = "Hoje";
                  } else if (diffDays === 1) {
                    colorClass = "text-orange-700 bg-orange-50 border-orange-200/80";
                    tagClass = "bg-orange-100 text-orange-800";
                    dueText = "Amanhã";
                  }

                  return (
                      <div key={t.id} className={`p-3 rounded-xl border ${colorClass} space-y-1 text-xs`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate pr-2" title={t.titulo}>{t.titulo}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${tagClass}`}>
                          {dueText}
                        </span>
                      </div>
                      <p className="font-medium opacity-90">{t.embarcacaoNome}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] opacity-75">{formatDateBR(t.prazo)}</span>
                        <span className="text-[10px] font-medium opacity-75">{t.responsavelNome}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Equipe agora (Team Workload) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Equipe agora
              </h3>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => onNavigateTab({ tab: 'team' })}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Ver equipe
                </button>
              )}
            </div>

            <div className="space-y-3">
              {teamWorkload.map((u) => {
                const userTasksCount = u.activeItems;

                return (
                  <div key={u.userId} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 font-bold text-blue-900 flex items-center justify-center shrink-0 overflow-hidden">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          u.nome.charAt(0)
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-800 truncate">{u.nome}</p>
                        <p className="text-[10px] text-slate-500 truncate">{u.cargo}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-700">
                        {userTasksCount} {userTasksCount === 1 ? 'tarefa' : 'tarefas'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pendências Críticas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Pendências críticas
              </h3>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                {criticalPendings.length}
              </span>
            </div>

            <div className="space-y-3">
              {criticalPendings.map((cp) => (
                <div
                  key={cp.id}
                  className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">{cp.titulo}</span>
                    <span className="text-[10px] font-mono text-amber-700 font-bold">{formatDateBR(cp.data)}</span>
                  </div>
                  <p className="text-slate-700 font-medium">{cp.embarcacaoNome}</p>
                  <p className="text-[11px] text-slate-500">{cp.detalhe}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
