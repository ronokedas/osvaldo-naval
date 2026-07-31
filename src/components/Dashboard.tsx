import React from 'react';
import { User, Vessel, DocumentTask, Proposal, CriticalPending, FinancialEntry } from '../types';
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
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardProps {
  currentUser: User;
  users: User[];
  vessels: Vessel[];
  tasks: DocumentTask[];
  proposals: Proposal[];
  criticalPendings: CriticalPending[];
  financialEntries: FinancialEntry[];
  onSelectVessel: (vessel: Vessel) => void;
  onNavigateTab: (tab: any) => void;
  onCreateProposalClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  users,
  vessels,
  tasks,
  proposals,
  criticalPendings,
  financialEntries,
  onSelectVessel,
  onNavigateTab,
  onCreateProposalClick,
}) => {
  // Metrics calculation
  const openVessels = vessels.filter((v) => v.status === 'aberta');
  const tasksInExecution = tasks.filter((t) => t.status === 'execucao' || t.status === 'em_revisao');
  const tasksWaitingCertifier = tasks.filter((t) => t.status === 'enviado' || t.status === 'exigencia');

  // Financial total to receive
  const totalToReceive = vessels.reduce((acc, v) => acc + (v.valorTotal - v.valorRecebido), 0);

  // Chart Data Preparation
  const chartData = vessels.slice(0, 6).map(v => ({
    name: v.nome.split(' ')[0], // Short name
    Recebido: v.valorRecebido,
    Pendente: v.valorTotal - v.valorRecebido,
  }));

  // Status Badge color styling helper
  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'execucao':
        return { label: 'Em execução', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'em_revisao':
        return { label: 'Em revisão', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'enviado':
        return { label: 'Na certificadora', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'exigencia':
        return { label: 'Exigência recebida', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'pronto':
        return { label: 'Pronto / Liberado', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'baixado':
        return { label: 'Baixado', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'pendente':
      default:
        return { label: 'Aguardando início', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Boa tarde, {currentUser.nome}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Aqui está o pulso da operação da Nautilus hoje.
          </p>
        </div>

        {currentUser.role !== 'tecnico' && (
          <button
            onClick={onCreateProposalClick}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Nova Proposta (DS 0XX/AA)
          </button>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-mono">{openVessels.length}</p>
            <p className="text-xs text-slate-500 font-medium">embarcações abertas</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-mono">{tasksInExecution.length}</p>
            <p className="text-xs text-slate-500 font-medium">documentos em execução</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-mono">{tasksWaitingCertifier.length}</p>
            <p className="text-xs text-slate-500 font-medium">aguardando certificadora</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 font-mono">
              R$ {totalToReceive.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-slate-500 font-medium">a receber por embarcação</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Table + Right Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vessels Operation Table & Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Revenue Chart Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Visão Financeira por Embarcação (Top 6)</h2>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `R$ ${value / 1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                    cursor={{fill: '#F1F5F9'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Recebido" stackId="a" fill="#059669" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Pendente" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vessels Table Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Operação por embarcação</h2>
              <p className="text-xs text-slate-500">Acompanhe responsáveis, prazos e certificadoras.</p>
            </div>
            <button
              onClick={() => onNavigateTab('vessels')}
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
                  const vesselTasks = tasks.filter((t) => t.embarcacaoId === v.id);
                  const mainTask = vesselTasks[0] || {
                    titulo: 'Medição por ultrassom e desenhos',
                    responsavelNome: 'A definir',
                    prazo: 'Em andamento',
                    certificadora: v.certificadoraPrincipal,
                    status: 'pendente',
                  };
                  const badge = getTaskStatusBadge(mainTask.status);

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
                        {mainTask.titulo}
                      </td>
                      <td className="py-3 pr-3 text-slate-800 whitespace-nowrap">
                        {mainTask.responsavelNome.split(' ')[0]}
                      </td>
                      <td className="py-3 pr-3 font-mono text-slate-600 whitespace-nowrap">
                        {mainTask.prazo}
                      </td>
                      <td className="py-3 pr-3 text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          <Award className="w-3 h-3 text-indigo-600" />
                          {mainTask.certificadora}
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

                const upcomingTasks = tasks
                  .filter(t => t.status !== 'baixado' && t.prazo)
                  .filter(t => {
                    const prazoDate = new Date(t.prazo + 'T00:00:00'); // Assuming YYYY-MM-DD
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
                        <span className="text-[10px] opacity-75">{t.prazo.split('-').reverse().join('/')}</span>
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
                  onClick={() => onNavigateTab('team')}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Ver equipe
                </button>
              )}
            </div>

            <div className="space-y-3">
              {users.map((u) => {
                const userTasksCount = tasks.filter((t) => t.responsavelId === u.id && t.status !== 'baixado').length;
                const activePercentage = Math.min(100, Math.max(20, userTasksCount * 20));

                return (
                  <div key={u.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 font-bold text-blue-900 flex items-center justify-center shrink-0">
                        {u.nome.charAt(0)}
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
                    <span className="text-[10px] font-mono text-amber-700 font-bold">{cp.data}</span>
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
