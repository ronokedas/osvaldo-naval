import React, { useMemo } from 'react';
import {
  User,
  Vessel,
  DocumentTask,
  Proposal,
  CriticalPending,
  FinancialEntry,
  ServiceOrder,
  DashboardSummary,
} from '../types';
import {
  Ship,
  Clock,
  Award,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Send,
  Calendar,
  ChevronRight,
  TrendingUp,
  ExternalLink,
  MessageCircle,
  Eye,
  Paperclip,
} from 'lucide-react';
import { formatDateBR } from '../utils/date-formatters';

interface MobileExecutiveDashboardProps {
  currentUser: User;
  vessels: Vessel[];
  tasks: DocumentTask[];
  proposals: Proposal[];
  criticalPendings: CriticalPending[];
  financialEntries: FinancialEntry[];
  serviceOrders: ServiceOrder[];
  summary?: DashboardSummary | null;
  onSelectVessel: (vessel: Vessel) => void;
  onNavigateTab: (destination: {
    tab: string;
    serviceOrderStatuses?: string[];
    proposalStatuses?: string[];
    vesselStatus?: 'aberta' | 'concluida' | 'todos';
    financialFilter?: 'pending';
  }) => void;
  onOpenServiceOrder: (orderId: string) => void;
  onStartService?: (orderId: string, itemId: string) => Promise<void>;
}

export const MobileExecutiveDashboard: React.FC<MobileExecutiveDashboardProps> = ({
  currentUser,
  vessels,
  tasks,
  proposals,
  criticalPendings,
  financialEntries,
  serviceOrders,
  summary,
  onSelectVessel,
  onNavigateTab,
  onOpenServiceOrder,
  onStartService,
}) => {
  // 1. Controle dos Serviços das OS (Acompanhamento da Equipe)
  const operationalServices = useMemo(() => {
    return serviceOrders
      .flatMap((order) => (order.servicos || []).map((item) => ({ order, item })))
      .filter(({ item }) => item.status !== 'concluido')
      .sort((a, b) => {
        if (!a.item.tecnicoResponsavelId && b.item.tecnicoResponsavelId) return -1;
        if (a.item.tecnicoResponsavelId && !b.item.tecnicoResponsavelId) return 1;
        if (a.item.status === 'em_execucao' && b.item.status !== 'em_execucao') return -1;
        return 0;
      });
  }, [serviceOrders]);

  // 2. Minhas Entregas (Documentos finais aprovados que aguardam remessa)
  const myDeliveryOrders = useMemo(() => {
    return serviceOrders.filter((order) => {
      const delivery = order.entregaResumo;
      return Boolean(delivery?.acaoEntregaPendente || order.status === 'aguardando_entrega');
    });
  }, [serviceOrders]);

  // 3. Prioridades de Hoje: Foco Operacional (Serviços sem técnico, Exigências, Entregas, Orçamentos e Recebimentos)
  const prioridadesHoje = useMemo(() => {
    const list: Array<{
      id: string;
      cor: 'amber' | 'red' | 'emerald';
      titulo: string;
      detalhe: string;
      onClick: () => void;
      linkExterno?: string;
    }> = [];

    // 3.1 Gargalo Operacional: Serviços sem responsável técnico atribuído
    const unassignedServices = operationalServices.filter((s) => !s.item.tecnicoResponsavelId);
    if (unassignedServices.length > 0) {
      const topUnassigned = unassignedServices[0];
      const count = unassignedServices.length;
      list.push({
        id: `unassigned-srv-${topUnassigned.item.id}`,
        cor: 'amber',
        titulo: count === 1 
          ? '1 Serviço aguardando técnico' 
          : `${count} Serviços sem técnico atribuído`,
        detalhe: `OS ${topUnassigned.order.numero} (${topUnassigned.order.embarcacaoNome || 'Embarcação'}): ${topUnassigned.item.descricao}`,
        onClick: () => onOpenServiceOrder(topUnassigned.order.id),
      });
    }

    // 3.2 Gargalo Regulatório / Exigência Externa na Capitania / RBNA (Vermelho)
    const osComExigencia = serviceOrders.filter((os) => os.status === 'exigencia_externa');
    if (osComExigencia.length > 0) {
      const exg = osComExigencia[0];
      list.push({
        id: `exg-${exg.id}`,
        cor: 'red',
        titulo: `${osComExigencia.length === 1 ? '1 Exigência na Capitania / RBNA' : `${osComExigencia.length} Exigências na Capitania / RBNA`}`,
        detalhe: `OS ${exg.numero} (${exg.embarcacaoNome || 'Embarcação'}) aguarda cumprimento de exigência`,
        onClick: () => {
          onNavigateTab({ tab: 'service-orders', serviceOrderStatuses: ['exigencia_externa'] });
          onOpenServiceOrder(exg.id);
        },
      });
    } else if (criticalPendings.length > 0) {
      const cp = criticalPendings[0];
      list.push({
        id: `cp-${cp.id}`,
        cor: 'red',
        titulo: cp.titulo,
        detalhe: `${cp.embarcacaoNome ? cp.embarcacaoNome + ' • ' : ''}${cp.detalhe}`,
        onClick: () => onNavigateTab({ tab: 'commitments' }),
      });
    }

    // 3.3 Entregas de Documentos / Laudos Prontos para Remessa ao Cliente
    if (myDeliveryOrders.length > 0 && list.length < 2) {
      const topDelivery = myDeliveryOrders[0];
      const count = myDeliveryOrders.length;
      list.push({
        id: `deliv-${topDelivery.id}`,
        cor: 'amber',
        titulo: count === 1 
          ? '1 Documento pronto para entrega' 
          : `${count} Documentos prontos para entrega`,
        detalhe: `OS ${topDelivery.numero} (${topDelivery.embarcacaoNome || 'Embarcação'}) aguarda envio ao cliente`,
        onClick: () => onOpenServiceOrder(topDelivery.id),
      });
    }

    // 3.4 Orçamentos / Propostas Comerciais em Aberto (sem jargão estrangeiro "follow-up")
    const propostasAbertas = proposals
      .filter((p) => p.status === 'enviado')
      .sort((a, b) => (Number(b.valorTotal) || 0) - (Number(a.valorTotal) || 0));

    if (propostasAbertas.length > 0 && list.length < 2) {
      const topProp = propostasAbertas[0];
      list.push({
        id: `prop-${topProp.id}`,
        cor: 'amber',
        titulo: `Orçamento em Análise: R$ ${Number(topProp.valorTotal).toLocaleString('pt-BR')}`,
        detalhe: `Proposta ${topProp.numero} (${topProp.embarcacaoNome || topProp.clienteNome}) aguardando retorno do cliente`,
        onClick: () => onNavigateTab({ tab: 'proposals', proposalStatuses: ['enviado'] }),
      });
    } else if (list.length < 2) {
      const totalMesa = proposals
        .filter((p) => p.status === 'rascunho' || p.status === 'enviado')
        .reduce((sum, p) => sum + (Number(p.valorTotal) || 0), 0);
      if (totalMesa > 0) {
        list.push({
          id: 'prop-mesa',
          cor: 'amber',
          titulo: `Orçamentos em Negociação: R$ ${totalMesa.toLocaleString('pt-BR')}`,
          detalhe: 'Propostas comerciais em andamento aguardando fechamento',
          onClick: () => onNavigateTab({ tab: 'proposals' }),
        });
      }
    }

    // 3.5 Recebimento / Financeiro (Verde)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const recebidoMes = financialEntries
      .filter((e) => e.data && e.data.startsWith(currentMonth) && e.natureza === 'entrada')
      .reduce((sum, e) => sum + (Number(e.valor) || 0), 0);

    const totalToReceive = summary?.metrics.totalToReceive ?? vessels.reduce(
      (acc, v) => acc + Math.max(0, (Number(v.valorTotal) || 0) - (Number(v.valorRecebido) || 0)),
      0
    );

    list.push({
      id: 'fin-recebido',
      cor: 'emerald',
      titulo: recebidoMes > 0 
        ? `R$ ${recebidoMes.toLocaleString('pt-BR')} recebidos este mês` 
        : `R$ ${totalToReceive.toLocaleString('pt-BR')} a receber no caixa`,
      detalhe: recebidoMes > 0 
        ? `Saldo em aberto por embarcação: R$ ${totalToReceive.toLocaleString('pt-BR')}`
        : 'Acompanhe as faturas e parcelas em aberto',
      onClick: () => onNavigateTab({ tab: 'financial', financialFilter: 'pending' }),
    });

    return list;
  }, [operationalServices, serviceOrders, criticalPendings, myDeliveryOrders, proposals, financialEntries, summary, vessels, onNavigateTab, onOpenServiceOrder]);

  // 4. Frota em Execução (Cards das embarcações ativas com dias restantes)
  const frotaExecucao = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return vessels
      .filter((v) => v.status === 'aberta')
      .slice(0, 6)
      .map((v) => {
        const osList = serviceOrders.filter((os) => os.embarcacaoId === v.id || os.embarcacaoNome === v.nome);
        const mainOs = osList[0];

        // Dias para o prazo
        let diasTexto = 'Em andamento';
        if (mainOs?.dataConclusao) {
          const concDate = new Date(mainOs.dataConclusao + 'T00:00:00');
          const diffDays = Math.ceil((concDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          diasTexto = diffDays > 0 ? `${diffDays} dias` : diffDays === 0 ? 'Hoje' : 'Atrasado';
        } else if (v.descricao) {
          diasTexto = 'Em andamento';
        }

        const servicoDescricao = mainOs?.servicos?.[0]?.descricao || v.descricao || `${v.tipo} • Em andamento`;

        return {
          vessel: v,
          mainOs,
          servicoDescricao,
          diasTexto,
        };
      });
  }, [vessels, serviceOrders]);

  // Helper para abrir em navegador externo caso o diretor precise
  const abrirNavegadorExterno = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-5 pb-24 text-slate-800">
      {/* 1. Header Clean sem repetição de ícones */}
      <div className="pt-2 px-1">
        <h1 className="text-2xl font-black text-[#0B192C] tracking-tight">
          Visão do Dia • {currentUser.nome.split(' ')[0]}
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Pulso operacional e prioridades da Nautilus
        </p>
      </div>

      {/* 2. Seção "Prioridades de Hoje" (Os 3 Cards do Modelo 2) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <h2 className="text-base font-extrabold text-[#0B192C] tracking-tight">
          Prioridades de Hoje
        </h2>

        <div className="space-y-2.5">
          {prioridadesHoje.map((item) => {
            const isAmber = item.cor === 'amber';
            const isRed = item.cor === 'red';
            const bgClass = isAmber
              ? 'bg-[#B47B16] hover:bg-[#9B6A12]'
              : isRed
              ? 'bg-[#C5221F] hover:bg-[#A91D1A]'
              : 'bg-[#188038] hover:bg-[#136C2F]';

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`w-full text-left p-4 rounded-2xl ${bgClass} text-white shadow-sm transition active:scale-[0.99] flex items-start gap-3`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white/80 shrink-0 mt-1.5 shadow-2xs" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm leading-tight text-white">
                    {item.titulo}
                  </p>
                  <p className="text-xs text-white/90 font-medium mt-1 leading-relaxed">
                    {item.detalhe}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/70 shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PRIORIDADE 1: Controle dos Serviços das OS */}
      <section className="bg-gradient-to-br from-blue-50/70 to-white rounded-3xl p-5 border-2 border-blue-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 shrink-0" />
              <h2 className="text-base font-extrabold text-[#0B192C]">
                Controle dos serviços das OS
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhe atribuições e serviços em execução pela equipe.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab({ tab: 'service-orders' })}
            className="rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-50 shrink-0 whitespace-nowrap"
          >
            Ver todas as OS
          </button>
        </div>

        {/* Badges de pulso dos serviços */}
        {operationalServices.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-800 whitespace-nowrap">
              {operationalServices.length} ativos
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 whitespace-nowrap">
              {operationalServices.filter(s => s.item.status === 'em_execucao').length} em execução
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 whitespace-nowrap">
              {operationalServices.filter(s => !s.item.tecnicoResponsavelId).length} aguardando técnico
            </span>
          </div>
        )}

        {operationalServices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-center text-xs text-slate-500">
            Nenhum serviço ativo pendente de execução no momento.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {operationalServices.slice(0, 4).map(({ order, item }) => {
              const isUnassigned = !item.tecnicoResponsavelId;
              const isScheduled = Boolean(item.dataAgendada && item.horarioAgendado);

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-white p-4 shadow-2xs space-y-2.5 transition ${
                    isUnassigned
                      ? 'border-amber-300'
                      : item.status === 'em_execucao'
                      ? 'border-blue-300'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-black text-blue-800">
                        {order.numero}
                      </span>
                      <h3 className="font-bold text-xs text-slate-900 line-clamp-2 mt-0.5" title={item.descricao}>
                        {item.descricao}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {order.embarcacaoNome || 'Embarcação não informada'} • {order.clienteNome || 'Cliente'}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        isUnassigned
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'em_execucao'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isUnassigned ? 'Falta Atribuir' : item.status === 'em_execucao' ? 'Em execução' : 'Aguardando início'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-600">
                      Técnico: <strong className="text-slate-900">{item.responsavelNome || 'Não atribuído'}</strong>
                    </span>
                    {isScheduled ? (
                      <span className="font-mono text-indigo-700 font-bold">
                        {formatDateBR(item.dataAgendada)} às {item.horarioAgendado}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold text-[10px]">
                        Aguardando agendamento
                      </span>
                    )}
                  </div>

                  {/* Anexo técnico direto caso o técnico tenha enviado */}
                  {item.relatorioUrl && (
                    <a
                      href={item.relatorioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 p-2 rounded-xl transition"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate flex-1">Anexo: {item.relatorioNome || 'Documento / Foto'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    </a>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenServiceOrder(order.id)}
                      className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Abrir e acompanhar
                    </button>

                    {/* Visualizar relatório completo no navegador externo */}
                    <button
                      type="button"
                      onClick={() => abrirNavegadorExterno(`/api/service-orders/${order.id}/relatorio`)}
                      className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 p-2 text-slate-600 transition flex items-center gap-1 text-xs font-bold"
                      title="Visualizar OS completa no navegador externo"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. PRIORIDADE 2: Minhas Entregas & Documentos Finais */}
      <section className="bg-gradient-to-br from-orange-50/70 to-white rounded-3xl p-5 border-2 border-orange-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-600 shrink-0" />
              <h2 className="text-base font-extrabold text-orange-950">
                Minhas entregas
              </h2>
            </div>
            <p className="text-xs text-orange-900/80 mt-0.5">
              Documentos finais aprovados que aguardam sua remessa ao cliente.
            </p>
          </div>
          <span className="rounded-full bg-orange-600 px-2.5 py-1 text-xs font-black text-white shrink-0">
            {myDeliveryOrders.length} pendente(s)
          </span>
        </div>

        {myDeliveryOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 p-5 text-center text-xs text-slate-500">
            Nenhuma entrega pendente de remessa no momento. Todos os laudos foram despachados!
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {myDeliveryOrders.slice(0, 4).map((order) => {
              const docsAprovados = order.entregaResumo?.documentosAprovados || [];
              const comprovanteUrl = order.entregaResumo?.comprovanteUrl || order.entregaResumo?.ultimaRemessa?.comprovanteUrl;

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-orange-200 bg-white p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-black text-orange-700">
                        {order.numero}
                      </p>
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {order.embarcacaoNome || 'Embarcação'}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {order.clienteNome || 'Cliente não informado'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase bg-orange-100 text-orange-800">
                      Pronto para envio
                    </span>
                  </div>

                  {/* Documentos aprovados prontos para remessa */}
                  {docsAprovados.length > 0 && (
                    <div className="pt-2 border-t border-orange-100 space-y-1.5">
                      <p className="text-[10px] font-bold text-orange-900 uppercase tracking-wide">
                        Documentos prontos para entrega ({docsAprovados.length}):
                      </p>
                      {docsAprovados.slice(0, 3).map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.arquivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between text-xs text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-lg font-semibold transition"
                          title="Visualizar documento no navegador externo"
                        >
                          <span className="truncate flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            {doc.arquivoNome}
                          </span>
                          <ExternalLink className="w-3 h-3 text-blue-500 shrink-0 ml-1" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Comprovante da remessa caso já exista */}
                  {comprovanteUrl && (
                    <div className="pt-1">
                      <a
                        href={comprovanteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ver comprovante de entrega (Navegador externo)
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenServiceOrder(order.id)}
                      className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-3 text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      Abrir e registrar remessa
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirNavegadorExterno(`/api/service-orders/${order.id}/relatorio`)}
                      className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 p-2 text-slate-600 transition"
                      title="Visualizar dossiê completo no navegador externo"
                    >
                      <ExternalLink className="w-4 h-4 text-orange-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Frota em Execução (Cards do Modelo 2) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-extrabold text-[#0B192C] tracking-tight">
            Frota em Execução
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab({ tab: 'vessels', vesselStatus: 'aberta' })}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Ver toda frota
          </button>
        </div>

        {frotaExecucao.length === 0 ? (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            Nenhuma embarcação em processo ativo no momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {frotaExecucao.map(({ vessel, servicoDescricao, diasTexto }) => (
              <button
                key={vessel.id}
                type="button"
                onClick={() => onSelectVessel(vessel)}
                className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs text-left hover:border-blue-400 transition active:scale-[0.98] flex flex-col justify-between"
              >
                <div>
                  {/* Ícone de navio / balsa estilizado */}
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                    <Ship className="w-5 h-5" />
                  </div>

                  <h3 className="font-extrabold text-xs text-slate-900 truncate leading-snug">
                    {vessel.nome}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mt-1 leading-snug">
                    {servicoDescricao}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-black text-xs text-[#0B192C]">
                    {diasTexto}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
