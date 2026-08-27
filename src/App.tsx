import React, { useState, useEffect } from 'react';
import { requestNotificationPermission, simulatePushNotification } from './utils/pushNotifications';
import {
  User,
  Client,
  Vessel,
  Proposal,
  DocumentTask,
  FinancialEntry,
  CriticalPending,
  TaskStatus,
  Certificadora,
  Protocol,
  EmailConfig,
  SignatureConfig,
  LogoConfig,
  AccountReceivable,
  DashboardSummary,
  FinancialSummary,
} from './types';
import { Header, GlobalSearchResult } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { VesselsList } from './components/VesselsList';
import { VesselDetailModal } from './components/VesselDetailModal';
import { compressImage } from './utils/image-compressor';
import { ProposalsList } from './components/ProposalsList';
import { MyTasks } from './components/MyTasks';
import { FinancialView } from './components/FinancialView';
import { TeamView } from './components/TeamView';
import { ProtocolsView } from './components/ProtocolsView';
import { SettingsView } from './components/SettingsView';
import { GlobalDocumentSearch } from './components/GlobalDocumentSearch';
import { UserProfileModal } from './components/UserProfileModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginView } from './components/LoginView';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { ServiceOrdersView } from './components/ServiceOrdersView';
import { ServiceOrderDetailView } from './components/ServiceOrderDetailView';
import { RegistrationsView } from './components/RegistrationsView';
import CommitmentsView from './components/CommitmentsView';
import { RenewalsView } from './components/RenewalsView';
import { NotificationsModal } from './components/NotificationsModal';
import { hasModuleAccess, ModuleId } from './access-control';
import { applyThemePreference } from './theme';

// Lazy loaded views
const LazyDashboard = React.lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const LazyVesselsList = React.lazy(() => import('./components/VesselsList').then(m => ({ default: m.VesselsList })));
const LazyProposalsList = React.lazy(() => import('./components/ProposalsList').then(m => ({ default: m.ProposalsList })));
const LazyMyTasks = React.lazy(() => import('./components/MyTasks').then(m => ({ default: m.MyTasks })));
const LazyFinancialView = React.lazy(() => import('./components/FinancialView').then(m => ({ default: m.FinancialView })));
const LazyTeamView = React.lazy(() => import('./components/TeamView').then(m => ({ default: m.TeamView })));
const LazyProtocolsView = React.lazy(() => import('./components/ProtocolsView').then(m => ({ default: m.ProtocolsView })));
const LazySettingsView = React.lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const LazyGlobalDocumentSearch = React.lazy(() => import('./components/GlobalDocumentSearch').then(m => ({ default: m.GlobalDocumentSearch })));
const LazyServiceOrdersView = React.lazy(() => import('./components/ServiceOrdersView').then(m => ({ default: m.ServiceOrdersView })));
const LazyRegistrationsView = React.lazy(() => import('./components/RegistrationsView').then(m => ({ default: m.RegistrationsView })));
const LazyCommitmentsView = React.lazy(() => import('./components/CommitmentsView'));
const LazyRenewalsView = React.lazy(() => import('./components/RenewalsView').then(m => ({ default: m.RenewalsView })));
import { ServiceOrder, ServiceOrderDetail, InternalNotification } from './types';

const TAB_PATHS: TabType[] = [
  'dashboard', 'vessels', 'tasks', 'proposals', 'service-orders', 'financial',
  'protocols', 'team', 'documents', 'settings', 'commitments', 'registrations', 'renewals',
];

type DashboardDestination = {
  tab: TabType;
  serviceOrderStatuses?: string[];
  proposalStatuses?: string[];
  vesselStatus?: 'aberta' | 'concluida' | 'todos';
  financialFilter?: 'pending';
};

const tabFromCurrentPath = (): TabType => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  return TAB_PATHS.includes(path as TabType) ? (path as TabType) : 'dashboard';
};

// The PostgreSQL API uses database field names while the existing UI uses
// presentation-oriented names. Keep the conversion at the application edge so
// incomplete legacy records cannot crash a screen during rendering.
const normalizeVessel = (vessel: any): Vessel => ({
  ...vessel,
  registro: vessel.registro || 'Não informado',
  certificadoraPrincipal: vessel.certificadoraPrincipal || 'A definir',
  valorTotal: Number(vessel.valorTotal) || 0,
  valorSinal: Number(vessel.valorSinal) || 0,
  valorRecebido: Number(vessel.valorRecebido) || 0,
  criadoEm: vessel.criadoEm || vessel.createdAt || new Date().toISOString(),
});

const normalizeTask = (task: any, vesselById: Map<string, Vessel>): DocumentTask => {
  const vessel = vesselById.get(task.embarcacaoId);
  return {
    ...task,
    embarcacaoNome: task.embarcacaoNome || vessel?.nome || 'Embarcação não informada',
    clienteNome: task.clienteNome || vessel?.clienteNome || 'Cliente não informado',
    responsavelId: task.responsavelId || '',
    responsavelNome: task.responsavelNome || 'Não atribuído',
    certificadora: task.certificadora || vessel?.certificadoraPrincipal || 'A definir',
    prazo: task.prazo || task.prazoVencimento || 'Não informado',
    historicoNotas: task.historicoNotas || [],
    atualizadoEm: task.atualizadoEm || task.updatedAt || task.createdAt || new Date().toISOString(),
  } as DocumentTask;
};

const normalizeFinancialEntry = (entry: any): FinancialEntry => ({
  ...entry,
  embarcacaoNome: entry.embarcacaoNome || 'Embarcação não informada',
  clienteNome: entry.clienteNome || '',
  valor: Number(entry.valor) || 0,
  observacao: entry.observacao || '',
  lancadoPorNome: entry.lancadoPorNome || 'Sistema',
  formaPagamento: entry.formaPagamento || 'PIX',
});

const normalizeProposal = (proposal: any): Proposal => ({
  ...proposal,
  embarcacaoNome: proposal.embarcacaoNome || 'Geral',
  clienteNome: proposal.clienteNome || 'Não informado',
  ano: Number(proposal.ano) || new Date(proposal.createdAt || Date.now()).getFullYear(),
  prazoEntregaDias: Number(proposal.prazoEntregaDias) || 0,
  condicaoPagamento: proposal.condicaoPagamento || proposal.condicoesPagamento || 'Não informado',
  observacoesGerais: proposal.observacoesGerais || proposal.observacoes || '',
  elaboradoPor: proposal.elaboradoPor || 'Nautilus Projetos Navais',
  itens: proposal.itens || [],
  valorDesconto: Number(proposal.valorDesconto) || 0,
  valorTotal: Number(proposal.valorTotal) || 0,
  criadoEm: proposal.criadoEm || proposal.createdAt || new Date().toISOString(),
});

export default function App() {
  // State variables
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyThemePreference(currentUser?.themePreference);
  }, [currentUser?.themePreference, currentUser?.id]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [tasks, setTasks] = useState<DocumentTask[]>([]);
  const [agendaTodayCount, setAgendaTodayCount] = useState(0);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [criticalPendings, setCriticalPendings] = useState<CriticalPending[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(({} as EmailConfig));
  const [signatureConfig, setSignatureConfig] = useState<SignatureConfig>(({} as SignatureConfig));
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(({} as LogoConfig));
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);

  // UI States
  const [activeTab, setActiveTab] = useState<TabType>(tabFromCurrentPath);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [selectedProposalForView, setSelectedProposalForView] = useState<Proposal | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [dashboardDestination, setDashboardDestination] = useState<DashboardDestination | null>(null);

  const moduleForTab: Partial<Record<TabType, ModuleId>> = {
    vessels: 'vessels', registrations: 'registrations', commitments: 'commitments', tasks: 'tasks',
    proposals: 'proposals', renewals: 'renewals', 'service-orders': 'service-orders', financial: 'financial',
    protocols: 'protocols', documents: 'documents', settings: 'settings', team: 'settings',
  };
  const canAccessTab = (tab: TabType, user = currentUser) => !moduleForTab[tab] || hasModuleAccess(user, moduleForTab[tab]!);

  const navigateTab = (tab: TabType) => {
    if (!canAccessTab(tab)) {
      setActiveTab('dashboard');
      return;
    }
    setDashboardDestination(null);
    setActiveTab(tab);
  };

  const navigateFromDashboard = (destination: DashboardDestination) => {
    if (!canAccessTab(destination.tab as TabType)) return;
    setDashboardDestination(destination);
    setActiveTab(destination.tab);
  };

  // Sincronizar activeTab com a URL para navegação visível no navegador
  React.useEffect(() => {
    const handlePopState = () => {
      const nextTab = tabFromCurrentPath();
      setActiveTab(canAccessTab(nextTab) ? nextTab : 'dashboard');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  React.useEffect(() => {
    if (currentUser && !canAccessTab(activeTab)) setActiveTab('dashboard');
  }, [activeTab, currentUser]);

  React.useEffect(() => {
    const targetPath = `/${activeTab}`;
    if (window.location.pathname !== targetPath) window.history.pushState({}, '', targetPath);
  }, [activeTab]);

  // All full-screen dialogs share a backdrop. Closing through the same visible
  // action as "Cancelar" or "Fechar" makes legacy and newer modals consistent
  // without allowing a click inside the dialog content to dismiss it.
  React.useEffect(() => {
    const closeOnBackdrop = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.classList.contains('fixed') || !target.classList.contains('inset-0')) return;
      const closeButton = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find((button) => {
        const label = `${button.textContent || ''} ${button.getAttribute('aria-label') || ''} ${button.getAttribute('title') || ''}`.trim().toLowerCase();
        return /^(×|✕|x|fechar|cancelar|voltar)(\s|$)/.test(label);
      });
      closeButton?.click();
    };
    document.addEventListener('click', closeOnBackdrop);
    return () => document.removeEventListener('click', closeOnBackdrop);
  }, []);

  // OS flow state
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [selectedOsId, setSelectedOsId] = useState<string | null>(null);
  const [selectedOsDetail, setSelectedOsDetail] = useState<ServiceOrderDetail | null>(null);
  const [notifications, setNotifications] = useState<InternalNotification[]>([]);
  const [osFilterStatus, setOsFilterStatus] = useState<string | null>(null);

  // Fetch initial data from server API on mount
  
  useEffect(() => {
    requestNotificationPermission();
    
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const fetchData = React.useCallback(async (showAlerts = true) => {
    if (!currentUser) return;
    try {
      const can = (module: ModuleId) => hasModuleAccess(currentUser, module);
      const emptyResponse = (body: string) => Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
      const [vRes, clRes, pRes, tRes, fRes, arRes, prRes, cRes, emRes, sigRes, logRes, dashboardRes, financialSummaryRes] = await Promise.all([
        can('vessels') || can('registrations') || can('proposals') || can('renewals') ? fetch('/api/vessels') : emptyResponse('[]'),
        can('registrations') || can('vessels') || can('proposals') || can('renewals') ? fetch('/api/clients', { cache: 'no-store' }) : emptyResponse('[]'),
        can('proposals') ? fetch('/api/proposals') : emptyResponse('[]'),
        can('tasks') ? fetch('/api/tasks') : emptyResponse('[]'),
        can('financial') ? fetch('/api/finance') : emptyResponse('[]'),
        can('financial') ? fetch('/api/receivables') : emptyResponse('[]'),
        can('protocols') ? fetch('/api/protocols') : emptyResponse('[]'),
        can('commitments') ? fetch('/api/critical-pendings') : emptyResponse('[]'),
        currentUser.role === 'admin' ? fetch('/api/settings/email', { cache: 'no-store' }) : emptyResponse('{}'),
        currentUser.role === 'admin' ? fetch('/api/settings/signature', { cache: 'no-store' }) : emptyResponse('{}'),
        currentUser.role === 'admin' ? fetch('/api/settings/logo', { cache: 'no-store' }) : emptyResponse('{}'),
        fetch('/api/dashboard/summary'),
        can('financial') ? fetch('/api/finance/summary') : emptyResponse('{}'),
      ]);
      
      const rawVessels: any[] = vRes.ok ? await vRes.json() : [];
      const normalizedVessels: Vessel[] = rawVessels.map(normalizeVessel);
      const vesselById = new Map<string, Vessel>(normalizedVessels.map((v) => [v.id, v]));

      if (vRes.ok) setVessels(normalizedVessels);
      if (clRes.ok) setClients(await clRes.json());
      if (pRes.ok) setProposals((await pRes.json()).map(normalizeProposal));
      if (tRes.ok) setTasks((await tRes.json()).map((task: any) => normalizeTask(task, vesselById)));
      if (fRes.ok) setFinancialEntries((await fRes.json()).map(normalizeFinancialEntry));
      if (arRes.ok) setReceivables(await arRes.json());
      if (prRes.ok) setProtocols(await prRes.json());
      if (cRes.ok) setCriticalPendings(await cRes.json());
      if (emRes.ok) setEmailConfig(await emRes.json());
      if (sigRes.ok) setSignatureConfig(await sigRes.json());
      if (logRes.ok) setLogoConfig(await logRes.json());
      if (dashboardRes.ok) setDashboardSummary(await dashboardRes.json());
      if (financialSummaryRes.ok) setFinancialSummary(await financialSummaryRes.json());
      
      if (currentUser.role === 'admin') {
         const uRes = await fetch('/api/users');
         if (uRes.ok) setUsers(await uRes.json());
      }

      const responses = [vRes, clRes, pRes, tRes, fRes, arRes, prRes, cRes, dashboardRes];
      if (showAlerts && responses.some(r => !r.ok)) {
        console.warn('Algumas requisições iniciais falharam.');
        alert('Algumas informações não puderam ser carregadas do servidor. Se o problema persistir, atualize a página.');
      }
    } catch (e) {
      console.error('Error fetching data:', e);
      if (showAlerts) {
        alert('Erro ao carregar os dados iniciais do servidor. Verifique sua conexão e tente novamente.');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    fetchData(true);

    const handleDataChanged = () => {
      fetchData(false);
    };

    window.addEventListener('nautilus:data-changed', handleDataChanged);
    return () => window.removeEventListener('nautilus:data-changed', handleDataChanged);
  }, [currentUser, fetchData]);

  // Refresh data on tab navigation
  useEffect(() => {
    if (currentUser) {
      fetchData(false);
    }
  }, [activeTab, currentUser, fetchData]);

  useEffect(() => {
    if (!currentUser || !hasModuleAccess(currentUser, 'tasks')) {
      setAgendaTodayCount(0);
      return;
    }
    let cancelled = false;
    const fetchAgendaSummary = async () => {
      try {
        const response = await fetch('/api/tasks/agenda?period=today&page=1&limit=1');
        if (!response.ok || cancelled) return;
        const data = await response.json();
        if (!cancelled) setAgendaTodayCount(Number(data.counts?.todayPending) || 0);
      } catch (error) {
        console.error('Erro ao carregar contador da agenda:', error);
      }
    };
    fetchAgendaSummary();
    const interval = window.setInterval(fetchAgendaSummary, 30000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !hasModuleAccess(currentUser, 'service-orders')) {
      setServiceOrders([]);
      setNotifications([]);
      return;
    }

    // Fetch service orders + notifications
    const fetchOs = async () => {
      try {
        const [osRes, notifRes] = await Promise.all([
          fetch('/api/service-orders'),
          fetch('/api/service-orders/notifications'),
        ]);
        if (osRes.ok) setServiceOrders(await osRes.json());
        if (notifRes.ok) setNotifications(await notifRes.json());
        // Fetch detail if one is selected
        if (selectedOsId) {
          const detRes = await fetch(`/api/service-orders/${selectedOsId}`);
          if (detRes.ok) setSelectedOsDetail(await detRes.json());
        }
      } catch (e) {
        console.error('Error fetching OS data:', e);
      }
    };
    fetchOs();
    const osRefreshInterval = window.setInterval(fetchOs, 10000);
    return () => window.clearInterval(osRefreshInterval);
  }, [currentUser, selectedOsId]);


  // Sync state changes with server API helper
  const apiPost = async (endpoint: string, payload: any) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Não foi possível concluir a operação.');
    }
    return res.json();
  };

  const apiPut = async (endpoint: string, payload: any) => {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Não foi possível atualizar os dados.');
    }
    return res.json();
  };


  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  // User Actions
  const handleSelectUser = (u: User) => {
    setCurrentUser(u);
    // If technician, switch tab to my tasks default
    if (u.role === 'tecnico') {
      navigateTab('tasks');
    }
  };

  // Vessel Actions
  const handleCreateVessel = async (vesselData: Partial<Vessel>, generateTasks: boolean = false) => {
    let resolvedClientId = vesselData.clienteId || '';
    let resolvedClientName = vesselData.clienteNome || 'Cliente';
    if (!resolvedClientId && resolvedClientName.trim()) {
      const client = await apiPost('/api/clients', { nome: resolvedClientName });
      resolvedClientId = client.id;
      resolvedClientName = client.nome;
      setClients((prev) => prev.some((item) => item.id === client.id) ? prev : [...prev, client]);
    }
    const newV: Vessel = {
      id: '',
      clienteId: resolvedClientId,
      clienteNome: resolvedClientName,
      nome: vesselData.nome || 'Nova Embarcação',
      tipo: vesselData.tipo || 'Empurrador',
      registro: vesselData.registro || 'PA-00000-X',
      status: 'aberta',
      certificadoraPrincipal: vesselData.certificadoraPrincipal || 'Amazon Naval',
      valorTotal: vesselData.valorTotal || 0,
      valorSinal: vesselData.valorSinal || 0,
      valorRecebido: vesselData.valorSinal || 0,
      criadoEm: new Date().toISOString().split('T')[0],
      descricao: vesselData.descricao,
    };

    const createdVessel = normalizeVessel(await apiPost('/api/vessels', newV));
    setVessels((prev) => [createdVessel, ...prev]);

    if (generateTasks) {
      const standardTasks = [
        { tipo: 'ultrassom', titulo: 'Relatório de Medição de Espessura (Ultrassom)', prazo: '10 dias' },
        { tipo: 'desenho', titulo: 'Croqui de Sondagem e Estrutura', prazo: '15 dias' },
        { tipo: 'art', titulo: 'Emissão de ART (CREA)', prazo: '5 dias' },
        { tipo: 'homologacao', titulo: 'Homologação na Certificadora', prazo: '30 dias' }
      ];

      const newTasks: DocumentTask[] = standardTasks.map((t, idx) => ({
        id: `task-${Date.now()}-${idx}`,
        embarcacaoId: createdVessel.id,
        embarcacaoNome: createdVessel.nome,
        clienteNome: createdVessel.clienteNome,
        tipo: t.tipo as 'ultrassom' | 'desenho' | 'art' | 'homologacao',
        titulo: t.titulo,
        responsavelId: currentUser.id,
        responsavelNome: currentUser.nome,
        responsavelCargo: currentUser.cargo,
        status: 'pendente',
        certificadora: newV.certificadoraPrincipal,
        prazo: t.prazo,
        atualizadoEm: new Date().toISOString().replace('T', ' ').substring(0, 16),
      }));

      const createdTasks = await Promise.all(newTasks.map((task) => apiPost('/api/tasks', task)));
      setTasks((prev) => [...createdTasks.map((task) => normalizeTask(task, new Map([[createdVessel.id, createdVessel]]))), ...prev]);
    }
  };

  const handleUpdateVessel = async (vesselId: string, updatedFields: Partial<Vessel>) => {
    try {
      const res = await apiPut(`/api/vessels/${vesselId}`, updatedFields);
      const updated = normalizeVessel(res);
      setVessels((prev) => prev.map((v) => (v.id === vesselId ? updated : v)));
      if (selectedVessel && selectedVessel.id === vesselId) {
        setSelectedVessel(updated);
      }
    } catch (e) {
      console.error('Error updating vessel', e);
    }
  };

  const handleUpdateVesselStatus = (vesselId: string, newStatus: 'aberta' | 'concluida') => {
    const updated = vessels.map((v) => (v.id === vesselId ? { ...v, status: newStatus } : v));
    setVessels(updated);
    if (selectedVessel && selectedVessel.id === vesselId) {
      setSelectedVessel({ ...selectedVessel, status: newStatus });
    }
    apiPut(`/api/vessels/${vesselId}`, { status: newStatus });
  };

  // Proposal Actions
  const handleFormalAcceptance = async (
    proposalId: string,
    payload: any,
    file?: File | null
  ) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const formData = new FormData();
    formData.append('meio', payload.meio || 'outro');
    formData.append('responsavelNome', payload.responsavelNome || '');
    formData.append('data', payload.data || new Date().toISOString().split('T')[0]);
    if (payload.observacao) formData.append('observacao', payload.observacao);
    formData.append('situacaoFinanceira', payload.situacaoFinanceira || 'pendente');
    if (payload.valorRecebido !== undefined) formData.append('valorRecebido', String(payload.valorRecebido));
    if (payload.dataPagamento) formData.append('dataPagamento', payload.dataPagamento);
    if (payload.formaPagamento) formData.append('formaPagamento', payload.formaPagamento);
    if (file) formData.append('documento', file);

    try {
      const res = await fetch(`/api/proposals/${proposalId}/accept`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const result = await res.json();
        // Refresh proposals
        const pRes = await fetch('/api/proposals');
        if (pRes.ok) setProposals((await pRes.json()).map(normalizeProposal));
        const [fRefresh, vRefresh] = await Promise.all([fetch('/api/finance'), fetch('/api/vessels')]);
        if (fRefresh.ok) setFinancialEntries((await fRefresh.json()).map(normalizeFinancialEntry));
        if (vRefresh.ok) setVessels((await vRefresh.json()).map(normalizeVessel));
        return result;
      } else {
        const err = await res.json().catch(() => ({ error: 'Erro ao registrar aceite' }));
        throw new Error(err.error || 'Erro ao registrar aceite');
      }
    } catch (e) {
      console.error('Erro ao criar OS no aceite:', e);
      throw e;
    }
  };

  const handleCreateProposal = async (proposalData: Partial<Proposal>) => {
    const currentYear = new Date().getFullYear();
    const yearSuffix = String(currentYear).slice(-2);
    const seq = proposals.length + 51;
    const num = `DS ${String(seq).padStart(3, '0')}/${yearSuffix}`;

    const newProp: Proposal = {
      id: '',
      embarcacaoId: proposalData.embarcacaoId || '',
      embarcacaoNome: proposalData.embarcacaoNome || '',
      clienteNome: proposalData.clienteNome || '',
      numero: num,
      ano: currentYear,
      dataEmissao: proposalData.dataEmissao || new Date().toLocaleDateString('pt-BR'),
      destinatario: proposalData.destinatario || 'Cliente',
      assunto: proposalData.assunto || 'Serviços de inspeção e desenhos técnicos.',
      prazoEntregaDias: proposalData.prazoEntregaDias || 10,
      observacoesGerais: proposalData.observacoesGerais || '',
      condicaoPagamento: proposalData.condicaoPagamento || 'À vista',
      status: proposalData.status || 'enviado',
      itens: proposalData.itens || [],
      valorDesconto: proposalData.valorDesconto || 0,
      valorTotal: proposalData.valorTotal || 0,
      elaboradoPor: proposalData.elaboradoPor || currentUser.nome,
      criadoEm: new Date().toISOString().split('T')[0],
    };

    const createdProposal = normalizeProposal(await apiPost('/api/proposals', newProp));
    setProposals((prev) => [createdProposal, ...prev]);

    // Also update vessel's total value if attached
    if (createdProposal.embarcacaoId) {
      setVessels((prev) =>
        prev.map((v) => (v.id === createdProposal.embarcacaoId ? { ...v, valorTotal: createdProposal.valorTotal } : v))
      );
    }
  };

  const handleUpdateProposal = (proposalId: string, updatedData: Partial<Proposal>) => {
    const updated = proposals.map((p) => (p.id === proposalId ? { ...p, ...updatedData } : p));
    setProposals(updated);
    apiPut(`/api/proposals/${proposalId}`, updatedData);
  };

  // Task Actions
  const handleCreateTask = async (taskData: Partial<DocumentTask>) => {
    const newTask: DocumentTask = {
      id: '',
      embarcacaoId: taskData.embarcacaoId || '',
      embarcacaoNome: taskData.embarcacaoNome || '',
      clienteNome: taskData.clienteNome || '',
      tipo: taskData.tipo || 'ultrassom',
      titulo: taskData.titulo || 'Novo documento',
      responsavelId: taskData.responsavelId || currentUser.id,
      responsavelNome: taskData.responsavelNome || currentUser.nome,
      responsavelCargo: taskData.responsavelCargo || currentUser.cargo,
      status: 'pendente',
      certificadora: taskData.certificadora || 'Amazon Naval',
      prazo: taskData.prazo || '10 dias',
      atualizadoEm: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const createdTask = normalizeTask(await apiPost('/api/tasks', newTask), new Map(vessels.map((v) => [v.id, v])));
    setTasks((prev) => [createdTask, ...prev]);
    
    // Dispara notificação push simulada
    if (createdTask.responsavelId !== currentUser.id) {
      simulatePushNotification(
        'Nova Tarefa Atribuída', 
        `Você tem uma nova tarefa: "${createdTask.titulo}" para a embarcação ${createdTask.embarcacaoNome}.`
      );
    } else {
      simulatePushNotification(
        'Tarefa Criada', 
        `Tarefa "${createdTask.titulo}" foi criada para a embarcação ${createdTask.embarcacaoNome}.`
      );
    }
  };

  const handleUpdateTaskStatus = (
    taskId: string,
    newStatus: TaskStatus,
    certificadora?: Certificadora
  ) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          certificadora: certificadora || t.certificadora,
          atualizadoEm: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return t;
    });
    setTasks(updated);
    apiPut(`/api/tasks/${taskId}`, { status: newStatus, certificadora });
  };

  const handleUploadTaskFile = (taskId: string, fileName: string, fileUrl: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          arquivoNome: fileName,
          arquivoUrl: fileUrl,
          status: t.status === 'pendente' ? ('execucao' as TaskStatus) : t.status,
        };
      }
      return t;
    });
    setTasks(updated);
    apiPut(`/api/tasks/${taskId}`, { arquivoNome: fileName, arquivoUrl: fileUrl });
  };

  const handleAddTaskNote = (taskId: string, text: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const history = t.historicoNotas || [];
        return {
          ...t,
          historicoNotas: [
            ...history,
            {
              data: new Date().toISOString().replace('T', ' ').substring(0, 16),
              autor: currentUser.nome,
              texto: text,
            },
          ],
        };
      }
      return t;
    });
    setTasks(updated);
  };

  // Financial Actions
  const handleAddPayment = async (paymentData: Partial<FinancialEntry>) => {
    const vessel = vessels.find((v) => v.id === paymentData.embarcacaoId);
    const newEntry: FinancialEntry = {
      id: '',
      embarcacaoId: paymentData.embarcacaoId,
      embarcacaoNome: paymentData.embarcacaoNome || '',
      clienteNome: vessel?.clienteNome || paymentData.clienteNome || '',
      data: paymentData.data || new Date().toISOString().split('T')[0],
      valor: paymentData.valor || 0,
      tipo: paymentData.tipo || 'parcela',
      formaPagamento: paymentData.formaPagamento || 'PIX',
      observacao: paymentData.observacao || '',
      lancadoPorNome: currentUser.nome,
      notaFiscalNumero: paymentData.notaFiscalNumero,
      notaFiscalUrl: paymentData.notaFiscalUrl,
      notaFiscalNome: paymentData.notaFiscalNome,
      notaFiscalDataEmissao: paymentData.notaFiscalDataEmissao,
      reciboNumero: paymentData.reciboNumero || `REC-${Date.now().toString().slice(-6)}`,
      natureza: paymentData.natureza || (paymentData.tipo === 'despesa' ? 'saida' : 'entrada'),
      fornecedorId: paymentData.fornecedorId,
      categoriaId: paymentData.categoriaId,
      competencia: paymentData.competencia,
      vencimento: paymentData.vencimento,
    };

    const createdEntry = normalizeFinancialEntry(await apiPost('/api/finance', newEntry));
    setFinancialEntries((prev) => [createdEntry, ...prev]);
    await fetchData(false);
  };

  const handleRecordReceivablePayment = async (receivableId: string, paymentData: Partial<FinancialEntry>) => {
    await apiPost(`/api/receivables/${receivableId}/payments`, paymentData);
    await fetchData(false);
  };

  const handleUpdatePayment = async (entryId: string, updatedFields: Partial<FinancialEntry>) => {
    const updatedEntry = normalizeFinancialEntry(await apiPut(`/api/finance/${entryId}`, updatedFields));
    setFinancialEntries((prev) =>
      prev.map((entry) => (entry.id === entryId ? updatedEntry : entry))
    );
    await fetchData(false);
  };

  // Protocol Actions
  const handleCreateProtocol = async (protocolData: Partial<Protocol> & Record<string, any>): Promise<Protocol> => {
    const createdProtocol = await apiPost('/api/protocols', {
      ...protocolData,
      dataEnvio: protocolData.dataEnvio || new Date().toISOString().split('T')[0],
      responsavelEnvioNome: currentUser.nome,
    });
    setProtocols((prev) => [createdProtocol, ...prev]);
    await refreshOsList();
    return createdProtocol;
  };

  const handleUpdateProtocol = (id: string, updatedFields: Partial<Protocol>) => {
    setProtocols((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
    apiPut(`/api/protocols/${id}`, updatedFields);
  };

  const myTasksCount = agendaTodayCount;

  const handleUpdateProfile = async (updatedFields: Partial<User>) => {
    const updatedUser = await apiPut('/api/auth/me', updatedFields);
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  // Settings & Employee Management Handlers
  const handleCreateUser = async (userData: Partial<User>) => {
    const created = await apiPost('/api/users', userData);
    setUsers((prev) => [...prev, created]);
  };

  const handleUpdateUser = async (userId: string, updatedFields: Partial<User>) => {
    const updated = await apiPut(`/api/users/${userId}`, updatedFields);
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
  };

  const handleResetUserPassword = async (userId: string) => {
    const result = await apiPost(`/api/users/${userId}/reset-password`, {});
    setUsers((prev) => prev.map((user) => user.id === userId ? result.user : user));
    return result.temporaryPassword as string;
  };

  const handleUpdateEmailConfig = async (config: EmailConfig, options?: { removerSenha?: boolean }) => {
    const saved = await apiPut('/api/settings/email', { ...config, removerSenha: options?.removerSenha === true });
    setEmailConfig(saved);
    return saved as EmailConfig;
  };

  const handleUpdateSignatureConfig = (config: SignatureConfig) => {
    setSignatureConfig(config);
    apiPut('/api/settings/signature', config);
  };

  const handleUpdateLogoConfig = (config: LogoConfig) => {
    setLogoConfig(config);
    apiPut('/api/settings/logo', config);
  };

  const handleTestEmailDispatch = async (targetEmail: string) => {
    try {
      const res = await fetch('/api/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail }),
      });
      const data = await res.json().catch(() => ({}));
      return res.ok
        ? { ok: true, message: data.message || 'E-mail de teste enviado com sucesso.' }
        : { ok: false, message: data.error || 'Não foi possível enviar o e-mail de teste.' };
    } catch (e: any) {
      return { ok: false, message: e?.message || 'Erro ao testar SMTP' };
    }
  };

  // ===== OS Flow Handlers =====
  const openOsDetail = async (osId: string) => {
    setSelectedOsId(osId);
    navigateTab('service-orders');
    try {
      const res = await fetch(`/api/service-orders/${osId}`);
      if (res.ok) {
        setSelectedOsDetail(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setSelectedOsId(null);
        window.alert(data.error || 'Não foi possível abrir esta Ordem de Serviço.');
      }
    } catch (e) {
      console.error('Erro ao abrir OS:', e);
      setSelectedOsId(null);
      window.alert('Não foi possível abrir esta Ordem de Serviço. Verifique a conexão e tente novamente.');
    }
  };

  const globalSearchResults = React.useMemo<GlobalSearchResult[]>(() => {
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR');
    if (!query) return [];
    const matches = (value: unknown) => String(value || '').toLocaleLowerCase('pt-BR').includes(query);
    const results: GlobalSearchResult[] = [];
    clients.forEach((client) => {
      if (matches(`${client.nome} ${client.empresa} ${client.email} ${client.cnpjCpf}`)) results.push({ id: client.id, type: 'cliente', title: client.nome, detail: client.empresa || client.email });
    });
    vessels.forEach((vessel) => {
      if (matches(`${vessel.nome} ${vessel.registro} ${vessel.clienteNome}`)) results.push({ id: vessel.id, type: 'embarcacao', title: vessel.nome, detail: `${vessel.registro} · ${vessel.clienteNome}` });
    });
    proposals.forEach((proposal) => {
      if (matches(`${proposal.numero} ${proposal.embarcacaoNome} ${proposal.clienteNome} ${proposal.assunto}`)) results.push({ id: proposal.id, type: 'proposta', title: proposal.numero, detail: `${proposal.embarcacaoNome} · ${proposal.clienteNome}` });
    });
    serviceOrders.forEach((order) => {
      if (matches(`${order.numero} ${order.propostaNumero} ${order.embarcacaoNome} ${order.clienteNome}`)) results.push({ id: order.id, type: 'ordem', title: `OS ${order.numero}`, detail: `${order.embarcacaoNome || 'Embarcação não informada'} · ${order.statusLabel || order.status}` });
      (order.documentos || []).forEach((document) => {
        if (matches(`${document.titulo} ${order.numero} ${order.embarcacaoNome} ${order.clienteNome}`)) results.push({ id: document.id, type: 'documento', title: document.titulo, detail: `OS ${order.numero} · ${order.embarcacaoNome || 'Embarcação não informada'}` });
      });
    });
    tasks.forEach((task) => {
      if (matches(`${task.titulo} ${task.embarcacaoNome} ${task.clienteNome}`)) results.push({ id: task.id, type: 'tarefa', title: task.titulo, detail: `${task.embarcacaoNome} · ${task.responsavelNome}` });
    });
    protocols.forEach((protocol) => {
      if (matches(`${protocol.numeroProtocolo} ${protocol.osId || ''} ${protocol.embarcacaoNome} ${protocol.clienteNome} ${protocol.status}`)) results.push({ id: protocol.id, type: 'protocolo', title: protocol.numeroProtocolo || 'Protocolo', detail: `${protocol.embarcacaoNome} · ${protocol.status.replaceAll('_', ' ')}` });
    });
    return results.slice(0, 12);
  }, [clients, vessels, proposals, serviceOrders, tasks, protocols, searchQuery]);

  const handleGlobalSearchResult = (result: GlobalSearchResult) => {
    setSearchQuery('');
    if (result.type === 'ordem') return openOsDetail(result.id);
    if (result.type === 'embarcacao') {
      const vessel = vessels.find((item) => item.id === result.id);
      if (vessel) setSelectedVessel(vessel);
      navigateTab('vessels');
      return;
    }
    if (result.type === 'proposta') {
      navigateTab('proposals');
      return;
    }
    if (result.type === 'protocolo') {
      navigateTab('protocols');
      return;
    }
    if (result.type === 'tarefa') navigateTab('tasks');
    else if (result.type === 'documento') navigateTab('documents');
    else navigateTab(result.type === 'cliente' ? 'registrations' : 'documents');
  };

  const refreshOsList = async () => {
    try {
      const res = await fetch('/api/service-orders');
      if (res.ok) setServiceOrders(await res.json());
    } catch (e) {
      console.error('Erro ao atualizar OS:', e);
    }
  };

  const handleStartAssignedService = async (orderId: string, itemId: string) => {
    try {
      await apiPut(`/api/service-orders/items/${itemId}`, { status: 'em_execucao' });
      await refreshOsList();
      await openOsDetail(orderId);
    } catch (error: any) {
      window.alert(error?.message || 'Não foi possível iniciar o serviço.');
    }
  };

  const handleOsScheduleItem = async (itemId: string, data: any) => {
    await apiPost(`/api/service-orders/items/${itemId}/schedule`, data);
  };

  const handleOsVistoria = async (data: any) => {
    if (!selectedOsId) return;
    await apiPost(`/api/service-orders/${selectedOsId}/vistoria`, data);
  };

  const handleOsUploadVersion = async (docId: string, file: File, data: any) => {
    // Compress image if applicable
    const processedFile = await compressImage(file);

    // Upload file first
    const formData = new FormData();
    formData.append('file', processedFile);
    const upRes = await fetch('/api/upload', { method: 'POST', body: formData });
    
    let up;
    const contentType = upRes.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      up = await upRes.json();
    } else {
      throw new Error(`Erro no servidor (${upRes.status}). O arquivo pode ser muito grande ou ocorreu um erro de conexão.`);
    }

    if (!upRes.ok) throw new Error(up.error || 'Falha no upload do arquivo');
    // Register version
    if (!selectedOsId) throw new Error('Ordem de Serviço não selecionada');
    await apiPost(`/api/service-orders/documents/${docId}/versions`, {
        arquivoNomeFisico: decodeURIComponent(up.url.split('/').pop() || ''),
      arquivoNomeOriginal: up.fileName,
      tamanho: file.size,
      tipoMime: file.type,
      comentario: data.comentario,
      origem: data.origem,
    });
  };

  const handleOsReviewDoc = async (docId: string, aprovado: boolean) => {
    await apiPost(`/api/service-orders/documents/${docId}/review`, { aprovado });
  };

  const handleOsApproveDoc = async (docId: string) => {
    await apiPost(`/api/service-orders/documents/${docId}/approve`, {});
  };

  const handleOsSubmitExternal = async (data: any) => {
    if (!selectedOsId) return;
    await apiPost(`/api/service-orders/${selectedOsId}/submit-external`, data);
    
    if (data.gerarProtocoloOFicial) {
      const os = serviceOrders.find(o => o.id === selectedOsId);
      if (!os) return;
      
      const doc = os.documentos?.find(d => d.id === data.documentoId);
      const docName = doc ? `${doc.titulo} (V${data.versaoEnviada || 1})` : `Documentos da OS ${os.numero}`;

      const seq = protocols.length + 83;
      const yearSuffix = String(new Date().getFullYear()).slice(-2);
      const numeroProtocolo = `PROT-${String(seq).padStart(3, '0')}/${yearSuffix}`;

      await handleCreateProtocol({
        numeroProtocolo,
        dataEnvio: new Date().toISOString().split('T')[0],
        embarcacaoId: os.embarcacaoId || '',
        embarcacaoNome: os.embarcacaoNome || '',
        clienteNome: os.clienteNome || '',
        tipoProtocolo: data.orgaoOuCertificadora.toLowerCase().includes('capitania') ? 'capitania_dpc' : 'certificadora',
        destinatario: data.orgaoOuCertificadora,
        orgaoOuEmpresa: data.orgaoOuCertificadora,
        documentosIncluidos: [docName],
        responsavelEnvioNome: currentUser?.nome || 'Sistema',
        status: 'em_trânsito',
        codigoRastreio: data.protocolo || '',
        observacoes: data.observacao || `Gerado automaticamente via envio da OS ${os.numero}.`,
      });
    }
  };

  const handleOsExternalResponse = async (data: any) => {
    if (!selectedOsId) return;
    await apiPost(`/api/service-orders/${selectedOsId}/external-response`, data);
  };

  const handleOsDeliver = async (data: any) => {
    if (!selectedOsId) return;
    await apiPost(`/api/service-orders/${selectedOsId}/deliver`, data);
  };

  const handleOsComplete = async () => {
    if (!selectedOsId) return;
    await apiPost(`/api/service-orders/${selectedOsId}/complete`, {});
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!currentUser) return <LoginView onLogin={setCurrentUser} />;

  return (
    <div 
      data-theme={currentUser.themePreference || 'classic'}
      className="min-h-screen bg-[#F4F6F9] font-sans text-slate-900 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 relative overflow-x-hidden"
    >
      <img className="nautilus-watermark" src="/nautilus-vessel-watermark.png" alt="" aria-hidden="true" />
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        users={users}
        logoConfig={logoConfig}
        onSelectUser={handleSelectUser}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={globalSearchResults}
        onSelectSearchResult={handleGlobalSearchResult}
        pendingAlertsCount={notifications.filter((notification) => !notification.lida).length}
        onGoHome={() => {
          navigateTab('dashboard');
          setSelectedVessel(null);
          setSelectedProposalForView(null);
          setIsMobileMenuOpen(false);
        }}
        onToggleProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
      />

      {/* Main App Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={navigateTab}
          currentUser={currentUser}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          myTasksCount={myTasksCount}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic View Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <RouteErrorBoundary key={activeTab} onRecover={() => setActiveTab('dashboard')}>
            <React.Suspense fallback={<div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div><span className="mt-4 text-slate-500 font-medium">Carregando tela...</span></div>}>
          {activeTab === 'dashboard' && (
            <LazyDashboard
              currentUser={currentUser}
              users={users}
              vessels={vessels}
              tasks={tasks}
              proposals={proposals}
              financialEntries={financialEntries}
              criticalPendings={criticalPendings}
              serviceOrders={serviceOrders}
              summary={dashboardSummary}
              onSelectVessel={(v) => setSelectedVessel(v)}
              onNavigateTab={(destination) => navigateFromDashboard({ ...destination, tab: destination.tab as TabType })}
              onCreateProposalClick={() => navigateTab('proposals')}
              onOpenServiceOrder={openOsDetail}
              onStartService={handleStartAssignedService}
            />
          )}

          {activeTab === 'vessels' && (
            <LazyVesselsList
              vessels={vessels}
              clients={clients}
              onSelectVessel={(v) => setSelectedVessel(v)}
              onCreateVessel={handleCreateVessel}
              canCreate={currentUser.role === 'admin' || !!currentUser.permissions?.includes('cadastrar_clientes_embarcacoes_propostas')}
              initialStatusFilter={dashboardDestination?.tab === 'vessels' ? dashboardDestination.vesselStatus : undefined}
            />
          )}

          {activeTab === 'registrations' && (
            <LazyRegistrationsView
              canManage={currentUser.role === 'admin' || !!currentUser.permissions?.includes('cadastrar_clientes_embarcacoes_propostas')}
              onChanged={() => window.dispatchEvent(new Event('nautilus:data-changed'))}
            />
          )}

          {activeTab === 'commitments' && (
            <LazyCommitmentsView
              currentUser={currentUser}
              vessels={vessels}
              users={users}
            />
          )}

          {activeTab === 'renewals' && (
            <LazyRenewalsView
              vessels={vessels}
              clients={clients}
              canManage={currentUser.role === 'admin' || !!currentUser.permissions?.includes('cadastrar_clientes_embarcacoes_propostas')}
              onNavigate={(tab, item) => {
                setActiveTab(tab as TabType);
                if (item) setSelectedProposalForView(item);
              }}
            />
          )}

          {activeTab === 'tasks' && (
            <LazyMyTasks
              currentUser={currentUser}
              canOpenServiceOrders={hasModuleAccess(currentUser, 'service-orders')}
              onOpenServiceOrder={openOsDetail}
              onTodayPendingCountChange={setAgendaTodayCount}
            />
          )}

          {activeTab === 'proposals' && (
            <LazyProposalsList
              proposals={proposals}
              vessels={vessels}
              clients={clients}
              currentUser={currentUser}
              signatureConfig={signatureConfig}
              logoConfig={logoConfig}
              onCreateProposal={handleCreateProposal}
              onUpdateProposal={handleUpdateProposal}
              onFormalAcceptance={handleFormalAcceptance}
              onNavigateTab={navigateTab}
              onOpenOs={openOsDetail}
              initialStatuses={dashboardDestination?.tab === 'proposals' ? dashboardDestination.proposalStatuses : undefined}
            />
          )}

          {activeTab === 'service-orders' && (
            <LazyServiceOrdersView
              serviceOrders={serviceOrders}
              currentUser={currentUser}
              onOpenOrder={openOsDetail}
              onRefresh={refreshOsList}
              filteredStatus={osFilterStatus}
              filteredStatuses={dashboardDestination?.tab === 'service-orders' ? dashboardDestination.serviceOrderStatuses : undefined}
            />
          )}

          {activeTab === 'financial' && (
            <LazyFinancialView
              vessels={vessels}
              financialEntries={financialEntries}
              receivables={receivables}
              clients={clients}
              currentUser={currentUser}
              signatureConfig={signatureConfig}
              logoConfig={logoConfig}
              onAddPayment={handleAddPayment}
              onRecordReceivablePayment={handleRecordReceivablePayment}
              onUpdatePayment={handleUpdatePayment}
              financialSummary={financialSummary}
              onDataChanged={async () => { await fetchData(false); }}
              initialFilter={dashboardDestination?.tab === 'financial' ? dashboardDestination.financialFilter : undefined}
            />
          )}

          {activeTab === 'protocols' && (
            <LazyProtocolsView
              protocols={protocols}
              vessels={vessels}
              clients={clients}
              serviceOrders={serviceOrders}
              currentUser={currentUser}
              signatureConfig={signatureConfig}
              logoConfig={logoConfig}
              onCreateProtocol={handleCreateProtocol}
              onRefresh={async () => { await fetchData(false); await refreshOsList(); }}
              onOpenOs={openOsDetail}
            />
          )}

          {activeTab === 'team' && (
            <LazyTeamView
              users={users}
              serviceOrders={serviceOrders}
              onUpdateUserRole={(id, role) => {
                setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)));
              }}
              onResetUserPassword={handleResetUserPassword}
            />
          )}

          {activeTab === 'documents' && (
            <LazyGlobalDocumentSearch currentUser={currentUser} users={users} onUpdateUser={handleUpdateUser} />
          )}

          {activeTab === 'settings' && (
            <LazySettingsView
              currentUser={currentUser}
              emailConfig={emailConfig}
              signatureConfig={signatureConfig}
              logoConfig={logoConfig}
              users={users}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onUpdateEmailConfig={handleUpdateEmailConfig}
              onUpdateSignatureConfig={handleUpdateSignatureConfig}
              onUpdateLogoConfig={handleUpdateLogoConfig}
              onTestEmailDispatch={handleTestEmailDispatch}
              onOpenProfile={() => setIsProfileModalOpen(true)}
            />
          )}
            </React.Suspense>
          </RouteErrorBoundary>
        </main>
      </div>

      {/* OS Detail Modal Overlay */}
      {selectedOsDetail && (
        <ServiceOrderDetailView
          detail={selectedOsDetail}
          currentUser={currentUser}
          users={users}
          onClose={() => { setSelectedOsDetail(null); setSelectedOsId(null); }}
          onRefresh={async () => {
            const [detailRes, notificationRes] = await Promise.all([
              selectedOsId ? fetch(`/api/service-orders/${selectedOsId}`) : Promise.resolve(null),
              fetch('/api/service-orders/notifications'),
            ]);
            if (detailRes?.ok) setSelectedOsDetail(await detailRes.json());
            if (notificationRes.ok) setNotifications(await notificationRes.json());
            refreshOsList();
          }}
          onScheduleItem={handleOsScheduleItem}
          onUploadVersion={handleOsUploadVersion}
          onReviewDoc={handleOsReviewDoc}
          onApproveDoc={handleOsApproveDoc}
          onSubmitExternal={handleOsSubmitExternal}
          onExternalResponse={handleOsExternalResponse}
          onDeliver={handleOsDeliver}
          onComplete={handleOsComplete}
          onOpenProtocols={() => {
            const osId = selectedOsDetail.id;
            setSelectedOsDetail(null);
            setSelectedOsId(null);
            window.history.pushState({}, '', `/protocols?osId=${encodeURIComponent(osId)}`);
            navigateTab('protocols');
          }}
        />
      )}

      {/* Vessel Detail Modal Overlay */}
      {selectedVessel && (
        <VesselDetailModal
          vessel={selectedVessel}
          clients={clients}
          tasks={tasks}
          serviceOrders={serviceOrders}
          proposals={proposals}
          financialEntries={financialEntries}
          users={users}
          currentUser={currentUser}
          onClose={() => setSelectedVessel(null)}
          onUpdateVessel={handleUpdateVessel}
          onUpdateVesselStatus={handleUpdateVesselStatus}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onOpenServiceOrder={(osId) => {
            setSelectedVessel(null);
            setSelectedOsId(osId);
            navigateTab('service-orders');
          }}
          onCreateTask={handleCreateTask}
          onUploadTaskFile={handleUploadTaskFile}
          onAddPayment={handleAddPayment}
          onSelectProposal={(p) => {
            setSelectedVessel(null);
            navigateTab('proposals');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('open-proposal', { detail: p.id }));
            }, 300);
          }}
          onCreateProposalForVessel={(v) => {
            setSelectedVessel(null);
            navigateTab('proposals');
          }}
        />
      )}

      {/* User Profile Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          currentUser={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onSaveProfile={handleUpdateProfile}
          onPreviewTheme={applyThemePreference}
        />
      )}

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        criticalPendings={criticalPendings}
        onNavigateToOS={(osId) => {
          setSelectedOsId(osId);
          navigateTab('service-orders');
          setIsNotificationsModalOpen(false);
        }}
        onNavigateToCommitment={() => {
          navigateTab('commitments');
          setIsNotificationsModalOpen(false);
        }}
        onMarkAsRead={async (id) => {
          try {
            const response = await fetch(`/api/service-orders/notifications/${id}/read`, { method: 'POST' });
            if (!response.ok) throw new Error('Não foi possível confirmar a leitura.');
            setNotifications((current) => current.map((notification) => (
              notification.id === id ? { ...notification, lida: true } : notification
            )));
          } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
            alert('Não foi possível confirmar a leitura. Tente novamente.');
          }
        }}
        onMarkAllAsRead={async () => {
          try {
            const response = await fetch('/api/service-orders/notifications/read-all', { method: 'POST' });
            if (!response.ok) throw new Error('Não foi possível marcar as notificações como lidas.');
            setNotifications((current) => current.map((notification) => ({ ...notification, lida: true })));
          } catch (error) {
            console.error('Erro ao marcar todas as notificações como lidas:', error);
            alert('Não foi possível limpar os avisos. Tente novamente.');
          }
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        myTasksCount={myTasksCount}
      />
    </div>
  );
}
