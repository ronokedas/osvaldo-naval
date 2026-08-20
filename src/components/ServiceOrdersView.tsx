import React, { useState, useEffect } from 'react';
import { ServiceOrder } from '../types';
import {
  ClipboardList,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  LayoutGrid,
  Columns3,
  Search,
  Calendar,
  Wrench,
  FileEdit,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Ship,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  aguardando_agendamento: 'bg-amber-50 text-amber-800 border-amber-300/80',
  visita_agendada: 'bg-blue-50 text-blue-800 border-blue-300/80',
  vistoria_em_execucao: 'bg-indigo-50 text-indigo-800 border-indigo-300/80',
  documentacao_em_elaboracao: 'bg-cyan-50 text-cyan-800 border-cyan-300/80',
  revisao_interna: 'bg-violet-50 text-violet-800 border-violet-300/80',
  aguardando_envio_externo: 'bg-sky-50 text-sky-800 border-sky-300/80',
  em_analise_externa: 'bg-purple-50 text-purple-800 border-purple-300/80',
  exigencia_externa: 'bg-red-50 text-red-800 border-red-300/80 animate-pulse',
  aprovado_externamente: 'bg-teal-50 text-teal-800 border-teal-300/80',
  aguardando_entrega: 'bg-orange-50 text-orange-800 border-orange-300/80',
  concluida: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
  cancelada: 'bg-slate-100 text-slate-500 border-slate-200',
};

const ST_LABELS: Record<string, string> = {
  aguardando_agendamento: 'Aguardando Agend.',
  visita_agendada: 'Visita Agendada',
  vistoria_em_execucao: 'Em Vistoria',
  documentacao_em_elaboracao: 'Doc. Elaboração',
  revisao_interna: 'Revisão Interna',
  aguardando_envio_externo: 'Aguard. Envio',
  em_analise_externa: 'Análise Externa',
  exigencia_externa: 'Exigência',
  aprovado_externamente: 'Aprovado Ext.',
  aguardando_entrega: 'Aguard. Entrega',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

interface KanbanColumn {
  id: string;
  title: string;
  icon: React.ElementType;
  statuses: string[];
  color: string;
  bgHeader: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'agendamento',
    title: '1. Agendamento',
    icon: Calendar,
    statuses: ['aguardando_agendamento'],
    color: 'text-amber-700 border-amber-300',
    bgHeader: 'bg-amber-50/80 border-amber-200 text-amber-900',
  },
  {
    id: 'campo',
    title: '2. Em Campo',
    icon: Wrench,
    statuses: ['visita_agendada', 'vistoria_em_execucao'],
    color: 'text-blue-700 border-blue-300',
    bgHeader: 'bg-blue-50/80 border-blue-200 text-blue-900',
  },
  {
    id: 'documentacao',
    title: '3. Laudos & Revisão',
    icon: FileEdit,
    statuses: ['documentacao_em_elaboracao', 'revisao_interna'],
    color: 'text-indigo-700 border-indigo-300',
    bgHeader: 'bg-indigo-50/80 border-indigo-200 text-indigo-900',
  },
  {
    id: 'externo',
    title: '4. Análise Externa',
    icon: ShieldCheck,
    statuses: ['aguardando_envio_externo', 'em_analise_externa', 'exigencia_externa', 'aprovado_externamente'],
    color: 'text-purple-700 border-purple-300',
    bgHeader: 'bg-purple-50/80 border-purple-200 text-purple-900',
  },
  {
    id: 'entrega',
    title: '5. Entrega & Fim',
    icon: CheckCircle2,
    statuses: ['aguardando_entrega', 'concluida'],
    color: 'text-emerald-700 border-emerald-300',
    bgHeader: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
  },
];

interface Props {
  serviceOrders: ServiceOrder[];
  currentUser: any;
  onOpenOrder: (id: string) => void;
  onRefresh: () => void;
  filteredStatus?: string | null;
}

export const ServiceOrdersView: React.FC<Props> = ({
  serviceOrders,
  currentUser,
  onOpenOrder,
  onRefresh,
  filteredStatus,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('kanban');
  const [filter, setFilter] = useState<string>(filteredStatus || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (filteredStatus) setFilter(filteredStatus);
  }, [filteredStatus]);

  // Filter orders by search & status
  const filtered = serviceOrders.filter((os) => {
    const matchesStatus = filter === 'all' || os.status === filter;
    const matchesSearch =
      !searchTerm ||
      (os.numero && os.numero.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (os.embarcacaoNome && os.embarcacaoNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (os.clienteNome && os.clienteNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (os.propostaNumero && os.propostaNumero.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const renderOsCard = (os: ServiceOrder, isCompact = false) => {
    const isExigencia = os.status === 'exigencia_externa';

    return (
      <div
        key={os.id}
        onClick={() => onOpenOrder(os.id)}
        className={`group bg-white rounded-2xl border transition-all duration-200 text-left p-4 cursor-pointer flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 ${
          isExigencia
            ? 'border-red-400 ring-2 ring-red-200/50'
            : os.servicosSemResponsavel
            ? 'border-amber-300 hover:border-amber-400'
            : 'border-slate-200 hover:border-blue-400'
        }`}
      >
        <div>
          {/* Header Card */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="font-mono font-extrabold text-blue-950 text-xs px-2.5 py-1 bg-slate-100 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
              {os.numero}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-xs">
            {os.propostaNumero && (
              <p className="text-[11px] text-slate-400">
                Ref: <span className="font-mono font-semibold text-slate-600">{os.propostaNumero}</span>
              </p>
            )}
            <p className="font-bold text-slate-900 line-clamp-1 flex items-center gap-1.5">
              <Ship className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              {os.embarcacaoNome || 'Embarcação não informada'}
            </p>
            <p className="text-slate-500 text-[11px] line-clamp-1">
              {os.clienteNome || 'Cliente não informado'}
            </p>
          </div>
        </div>

        {/* Badges & Warnings */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{os.quantidadeServicos || 0} serviço(s)</span>
          </div>

          {!!os.servicosSemResponsavel && currentUser?.role === 'admin' && (
            <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
              <AlertTriangle className="w-3 h-3 text-amber-600" /> {os.servicosSemResponsavel} sem responsável
            </span>
          )}

          {!!os.servicosSemAgendamento && currentUser?.role === 'admin' && (
            <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
              <Clock className="w-3 h-3 text-indigo-600" /> {os.servicosSemAgendamento} sem agendamento
            </span>
          )}

          <div className="flex items-center justify-between mt-1">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_COLORS[os.status] || 'bg-slate-100 text-slate-700'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {os.statusLabel || os.status}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Ordens de Serviço
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhamento da esteira operacional em tempo real
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 border border-slate-300/60 shadow-inner">
            <button
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#0B192C] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" /> Quadro Kanban
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0B192C] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grade
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 bg-[#0B192C] hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por OS, embarcação, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              filter === 'all'
                ? 'bg-[#0B192C] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({serviceOrders.length})
          </button>
          {Object.keys(ST_LABELS).map((st) => {
            const count = serviceOrders.filter((os) => os.status === st).length;
            if (count === 0 && filter !== st) return null;
            return (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition-all ${
                  filter === st
                    ? 'bg-[#0B192C] text-white border-[#0B192C] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {ST_LABELS[st]} <span className="opacity-70 font-normal">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-bold text-slate-700">Nenhuma Ordem de Serviço encontrada</p>
          <p className="text-xs text-slate-400 mt-1">Ajuste o filtro ou a busca para localizar registros.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-6">
          {KANBAN_COLUMNS.map((col) => {
            const ColIcon = col.icon;
            const colOrders = filtered.filter((os) => col.statuses.includes(os.status));

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 flex flex-col gap-3 min-h-[480px] shadow-sm"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl border font-bold text-xs shadow-xs ${col.bgHeader}`}>
                  <div className="flex items-center gap-1.5">
                    <ColIcon className="w-4 h-4" />
                    <span>{col.title}</span>
                  </div>
                  <span className="bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-full text-[11px] shadow-xs">
                    {colOrders.length}
                  </span>
                </div>

                {/* Column Cards List */}
                <div className="space-y-3 flex-1">
                  {colOrders.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-center p-4">
                      <p className="text-[11px] text-slate-400 font-medium">Nenhuma OS nesta etapa</p>
                    </div>
                  ) : (
                    colOrders.map((os) => renderOsCard(os, true))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((os) => renderOsCard(os))}
        </div>
      )}
    </div>
  );
};
