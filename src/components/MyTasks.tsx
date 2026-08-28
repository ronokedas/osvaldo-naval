import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronRight, Clock3, MapPin, RefreshCw, Search, UserRound, XCircle } from 'lucide-react';
import { TeamAgendaItem, TeamAgendaPeriod, TeamAgendaResponse, User } from '../types';
import { formatDateBR } from '../utils/date-formatters';

interface MyTasksProps {
  currentUser: User;
  canOpenServiceOrders: boolean;
  onOpenServiceOrder: (serviceOrderId: string) => void;
  onTodayPendingCountChange: (count: number) => void;
}

const periods: Array<{ id: TeamAgendaPeriod; label: string; empty: string }> = [
  { id: 'today', label: 'Hoje', empty: 'Nenhum serviço agendado para hoje.' },
  { id: 'week', label: 'Próximos 7 dias', empty: 'Nenhum serviço agendado para os próximos 7 dias.' },
  { id: 'upcoming', label: 'Próximos 30 dias', empty: 'Nenhum serviço agendado para os próximos 30 dias.' },
  { id: 'history', label: 'Histórico', empty: 'Nenhum agendamento anterior encontrado.' },
];

const statusMeta = (item: TeamAgendaItem) => {
  if (item.status === 'cancelada') return { label: 'OS cancelada', icon: XCircle, className: 'border-red-300 bg-red-50 text-red-700' };
  if (item.status === 'concluido') return { label: 'Concluído', icon: CheckCircle2, className: 'border-emerald-300 bg-emerald-50 text-emerald-700' };
  if (item.status === 'em_execucao') return { label: 'Em execução', icon: Clock3, className: 'border-blue-300 bg-blue-50 text-blue-700' };
  return { label: 'Aguardando início', icon: Clock3, className: 'border-amber-300 bg-amber-50 text-amber-700' };
};

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
const roleLabel = (role: User['role']) => role === 'admin' ? 'Administrador' : role === 'financeiro' ? 'Financeiro' : 'Técnico';
const dateTitle = (date: string) => {
  const parsed = new Date(`${date}T12:00:00`);
  return `${parsed.toLocaleDateString('pt-BR', { weekday: 'long' }).replace(/^./, (value) => value.toUpperCase())} · ${formatDateBR(date)}`;
};
const shiftIsoDate = (date: string, amount: number) => {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + amount);
  return parsed.toISOString().slice(0, 10);
};

export const MyTasks: React.FC<MyTasksProps> = ({ canOpenServiceOrders, onOpenServiceOrder, onTodayPendingCountChange }) => {
  const [period, setPeriod] = useState<TeamAgendaPeriod>('today');
  const [query, setQuery] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('');
  const [response, setResponse] = useState<TeamAgendaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const controllerRef = useRef<AbortController | null>(null);
  const responseRef = useRef<TeamAgendaResponse | null>(null);
  const loadAgenda = useCallback(async (requestedPage = 1) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setRefreshing(true);
    if (!responseRef.current) setLoading(true);
    setError('');
    const params = new URLSearchParams({ period, page: String(requestedPage), limit: '50' });
    if (employeeId) params.set('employeeId', employeeId);
    if (status) params.set('status', status);
    if (query.trim()) params.set('q', query.trim());
    try {
      const result = await fetch(`/api/tasks/agenda?${params.toString()}`, { signal: controller.signal });
      const data = await result.json().catch(() => ({}));
      if (!result.ok) throw new Error(data.error || 'Não foi possível carregar a agenda.');
      if (controller.signal.aborted) return;
      responseRef.current = data;
      setResponse(data);
      setPage(requestedPage);
      onTodayPendingCountChange(data.counts?.todayPending || 0);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar a agenda.');
    } finally {
      if (!controller.signal.aborted) { setLoading(false); setRefreshing(false); }
    }
  }, [employeeId, onTodayPendingCountChange, period, query, status]);

  useEffect(() => {
    responseRef.current = null;
    setResponse(null);
    setLoading(true);
    const timer = window.setTimeout(() => { void loadAgenda(1); }, query ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [employeeId, period, query, status, loadAgenda]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void loadAgenda(page); };
    const interval = window.setInterval(() => void loadAgenda(page), 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', refresh); controllerRef.current?.abort(); };
  }, [loadAgenda, page]);

  const grouped = useMemo(() => response?.items.reduce<Record<string, TeamAgendaItem[]>>((groups, item) => {
    (groups[item.dataAgendada] ||= []).push(item);
    return groups;
  }, {}) || {}, [response]);
  const hasFilters = Boolean(query || employeeId || status);
  const currentTab = periods.find((item) => item.id === period)!;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 pb-12">
      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div><div className="mb-2 flex items-center gap-3 text-[var(--app-accent)]"><CalendarDays className="h-6 w-6" /><span className="text-xs font-bold uppercase tracking-[.18em]">Operação diária</span></div><h1 className="text-2xl font-black text-[var(--app-text)] sm:text-3xl">Agenda da Equipe</h1><p className="mt-1 text-sm text-[var(--app-text-muted)]">Serviços agendados por funcionário nas Ordens de Serviço.</p></div>
          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-3 text-right text-xs text-[var(--app-text-muted)]"><span className="block font-bold text-[var(--app-text)]">{response?.pagination.total ?? 0}</span>serviço(s) nesta visão</div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-[var(--app-surface-soft)] p-1 sm:grid-cols-4">
          {periods.map((tab) => { const count = tab.id === 'today' ? response?.counts.today : tab.id === 'week' ? response?.counts.week : tab.id === 'upcoming' ? response?.counts.upcoming : response?.counts.history; return <button key={tab.id} type="button" aria-selected={period === tab.id} onClick={() => setPeriod(tab.id)} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--app-focus)] ${period === tab.id ? 'bg-[var(--app-accent)] text-slate-950 shadow-sm' : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-raised)] hover:text-[var(--app-text)]'}`}>{tab.label}<span className="ml-2 text-xs opacity-75">{count ?? 0}</span></button>; })}
        </div>
      </section>
      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm sm:p-5"><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]"><label className="relative block"><span className="sr-only">Buscar na agenda</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-faint)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar serviço, OS, funcionário, embarcação ou cliente..." className="h-11 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-input)] pl-10 pr-3 text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-faint)]" /></label><label><span className="sr-only">Filtrar funcionário</span><select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="h-11 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-input)] px-3 text-sm text-[var(--app-text)]"><option value="">Todos os funcionários</option>{response?.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.nome}</option>)}</select></label><label><span className="sr-only">Filtrar status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-input)] px-3 text-sm text-[var(--app-text)]"><option value="">Todos os status</option><option value="pendente">Aguardando início</option><option value="em_execucao">Em execução</option><option value="concluido">Concluído</option><option value="cancelada">OS cancelada</option></select></label><button type="button" onClick={() => void loadAgenda(1)} disabled={refreshing} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar</button></div>{hasFilters && <button type="button" onClick={() => { setQuery(''); setEmployeeId(''); setStatus(''); }} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--app-accent)] hover:underline"><XCircle className="h-3.5 w-3.5" /> Limpar filtros</button>}</section>
      {error && <section role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800"><p className="font-bold">Não foi possível atualizar a agenda</p><p className="mt-1">{error}</p><button type="button" onClick={() => void loadAgenda(page)} className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white">Tentar novamente</button></section>}
      {loading && !response ? <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-16 text-center text-sm text-[var(--app-text-muted)]">Carregando agenda...</div> : response && response.items.length === 0 ? <div className="rounded-2xl border border-dashed border-[var(--app-border-strong)] bg-[var(--app-surface)] p-16 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" /><h2 className="mt-3 text-lg font-bold text-[var(--app-text)]">{hasFilters ? 'Nenhum resultado encontrado' : currentTab.empty}</h2><p className="mt-1 text-sm text-[var(--app-text-muted)]">{hasFilters ? 'Tente remover ou ajustar os filtros da agenda.' : 'Os agendamentos aparecerão aqui assim que forem atribuídos e marcados na OS.'}</p></div> : period === 'week' ? <div className="overflow-x-auto pb-2"><div className="grid min-w-[1610px] grid-cols-7 gap-3">{response?.range.start && response.range.end && Array.from({ length: 7 }, (_, index) => shiftIsoDate(response.range.start!, index)).map((date) => <AgendaDay key={date} date={date} items={grouped[date] || []} canOpenServiceOrders={canOpenServiceOrders} onOpenServiceOrder={onOpenServiceOrder} />)}</div></div> : <div className="space-y-5">{Object.entries(grouped).sort(([a], [b]) => period === 'history' ? b.localeCompare(a) : a.localeCompare(b)).map(([date, items]) => <section key={date}><h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--app-text)]"><span className="h-2 w-2 rounded-full bg-[var(--app-accent)]" />{dateTitle(date)}</h2><div className="grid gap-3 lg:grid-cols-2">{items.map((item) => <AgendaCard key={item.id} item={item} canOpenServiceOrders={canOpenServiceOrders} onOpenServiceOrder={onOpenServiceOrder} />)}</div></section>)}</div>}
      {response && response.pagination.totalPages > page && <button type="button" onClick={() => void loadAgenda(page + 1)} disabled={refreshing} className="mx-auto flex rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-3 text-sm font-bold text-[var(--app-text)] hover:border-[var(--app-accent)] disabled:opacity-60">Carregar mais</button>}
    </main>
  );
};

const AgendaDay: React.FC<{ date: string; items: TeamAgendaItem[]; canOpenServiceOrders: boolean; onOpenServiceOrder: (id: string) => void }> = ({ date, items, canOpenServiceOrders, onOpenServiceOrder }) => <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3"><header className="mb-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-3"><p className="text-xs font-black uppercase tracking-wide text-[var(--app-accent)]">{dateTitle(date)}</p><p className="mt-1 text-xs text-[var(--app-text-muted)]">{items.length} serviço(s)</p></header>{items.length ? <div className="space-y-3">{items.map((item) => <AgendaCard key={item.id} item={item} canOpenServiceOrders={canOpenServiceOrders} onOpenServiceOrder={onOpenServiceOrder} />)}</div> : <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] p-4 text-center text-xs text-[var(--app-text-faint)]">Nenhum serviço neste dia</div>}</section>;

const AgendaCard: React.FC<{ item: TeamAgendaItem; canOpenServiceOrders: boolean; onOpenServiceOrder: (id: string) => void }> = ({ item, canOpenServiceOrders, onOpenServiceOrder }) => { const meta = statusMeta(item); const StatusIcon = meta.icon; return <article className="min-w-0 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4 shadow-sm transition hover:border-[var(--app-border-strong)] hover:shadow-md"><div className="flex min-w-0 items-start gap-3"><div className="shrink-0">{item.responsavel.avatarUrl ? <img src={item.responsavel.avatarUrl} alt={`Foto de ${item.responsavel.nome}`} className="h-11 w-11 rounded-full object-cover ring-2 ring-[var(--app-border)]" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--app-accent-soft)] text-sm font-black text-[var(--app-accent)] ring-2 ring-[var(--app-border)]">{initials(item.responsavel.nome)}</div>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="break-words text-sm font-black leading-5 text-[var(--app-text)]">{item.descricao}</p><p className="mt-0.5 break-words text-xs font-semibold text-[var(--app-text-muted)]">{item.responsavel.nome} · {item.responsavel.cargo || roleLabel(item.responsavel.role)}</p></div><span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${meta.className}`}><StatusIcon className="h-3 w-3" />{meta.label}</span></div><div className="mt-3 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--app-text-muted)]"><span className="break-words font-bold text-[var(--app-accent)]">{item.serviceOrderNumber}</span>{item.embarcacaoNome && <span className="break-words">{item.embarcacaoNome}</span>}{item.clienteNome && <span className="break-words">{item.clienteNome}</span>}</div><div className="mt-3 grid gap-1 text-xs text-[var(--app-text-muted)] sm:grid-cols-2"><span className="inline-flex min-w-0 items-center gap-1.5 break-words font-semibold"><Clock3 className="h-3.5 w-3.5 shrink-0 text-[var(--app-accent)]" />{formatDateBR(item.dataAgendada)} às {item.horarioAgendado}</span>{item.localAgendado && <span className="inline-flex min-w-0 items-center gap-1.5 break-words"><MapPin className="h-3.5 w-3.5 shrink-0" />{item.localAgendado}</span>}{item.contatoAgendamento && <span className="inline-flex min-w-0 items-center gap-1.5 break-words"><UserRound className="h-3.5 w-3.5 shrink-0" />{item.contatoAgendamento}</span>}</div>{item.observacoesAgendamento && <p className="mt-2 break-words rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-2 text-xs text-[var(--app-text-muted)]">{item.observacoesAgendamento}</p>}{canOpenServiceOrders && <button type="button" onClick={() => onOpenServiceOrder(item.serviceOrderId)} className="mt-3 inline-flex max-w-full items-center gap-1 break-words text-left text-xs font-black text-[var(--app-accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--app-focus)]">Abrir Ordem de Serviço <ChevronRight className="h-3.5 w-3.5 shrink-0" /></button>}</div></div></article>; };

export default MyTasks;
