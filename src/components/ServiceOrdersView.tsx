import React, { useState, useEffect } from 'react';
import { ServiceOrder } from '../types';
import { ClipboardList, ChevronRight, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  aguardando_agendamento: 'bg-amber-50 text-amber-700 border-amber-200',
  visita_agendada: 'bg-blue-50 text-blue-700 border-blue-200',
  vistoria_em_execucao: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  documentacao_em_elaboracao: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  revisao_interna: 'bg-violet-50 text-violet-700 border-violet-200',
  aguardando_envio_externo: 'bg-sky-50 text-sky-700 border-sky-200',
  em_analise_externa: 'bg-purple-50 text-purple-700 border-purple-200',
  exigencia_externa: 'bg-red-50 text-red-700 border-red-200',
  aprovado_externamente: 'bg-teal-50 text-teal-700 border-teal-200',
  aguardando_entrega: 'bg-orange-50 text-orange-700 border-orange-200',
  concluida: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelada: 'bg-slate-100 text-slate-500 border-slate-200',
};

const ST_LABELS: Record<string, string> = {
  aguardando_agendamento: 'Aguardando Agend.',
  visita_agendada: 'Visita Agendada',
  vistoria_em_execucao: 'Vistoria',
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

interface Props {
  serviceOrders: ServiceOrder[];
  currentUser: any;
  onOpenOrder: (id: string) => void;
  onRefresh: () => void;
  filteredStatus?: string | null;
}

export const ServiceOrdersView: React.FC<Props> = ({ serviceOrders, currentUser, onOpenOrder, onRefresh, filteredStatus }) => {
  const [filter, setFilter] = useState<string>(filteredStatus || 'all');
  useEffect(() => { if (filteredStatus) setFilter(filteredStatus); }, [filteredStatus]);
  const filtered = filter === 'all' ? serviceOrders : serviceOrders.filter((os) => os.status === filter);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Ordens de Serviço</h1>
          <p className="text-sm text-slate-500 mt-1">Aceite → Agendamento → Vistoria → Documentação → Órgão → Entrega → Conclusão</p>
        </div>
        <button onClick={onRefresh} className="inline-flex items-center gap-2 bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${filter === 'all' ? 'bg-[#0B192C] text-white' : 'bg-slate-100 text-slate-700'}`}>Todas</button>
          {Object.keys(ST_LABELS).map((st) => (
            <button key={st} onClick={() => setFilter(st)} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border ${filter === st ? 'bg-[#0B192C] text-white border-[#0B192C]' : 'bg-white text-slate-700 border-slate-200'}`}>
              {ST_LABELS[st]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-bold">Nenhuma OS encontrada</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((os) => (
            <button key={os.id} onClick={() => onOpenOrder(os.id)} className="bg-white rounded-2xl border border-slate-200 hover:shadow-md hover:border-blue-300 transition text-left p-5 cursor-pointer flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-900 text-sm">{os.numero}</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
              <span className={`inline-block self-start px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${STATUS_COLORS[os.status] || ''}`}>{os.statusLabel || os.status}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};