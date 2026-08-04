import React, { useState, useEffect } from 'react';
import { requestNotificationPermission, simulatePushNotification } from './utils/pushNotifications';
import {
  User,
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
} from './types';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { VesselsList } from './components/VesselsList';
import { VesselDetailModal } from './components/VesselDetailModal';
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


export default function App() {
  // State variables
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [tasks, setTasks] = useState<DocumentTask[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [criticalPendings, setCriticalPendings] = useState<CriticalPending[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(({} as EmailConfig));
  const [signatureConfig, setSignatureConfig] = useState<SignatureConfig>(({} as SignatureConfig));
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(({} as LogoConfig));

  // UI States
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [selectedProposalForView, setSelectedProposalForView] = useState<Proposal | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchData = async () => {
      try {
        const [vRes, pRes, tRes, fRes, prRes, cRes, emRes, sigRes, logRes] = await Promise.all([
          fetch('/api/vessels'),
          fetch('/api/proposals'),
          fetch('/api/tasks'),
          fetch('/api/finance'),
          fetch('/api/protocols'),
          fetch('/api/critical-pendings'),
          fetch('/api/settings/email'),
          fetch('/api/settings/signature'),
          fetch('/api/settings/logo'),
        ]);
        
        if (vRes.ok) setVessels(await vRes.json());
        if (pRes.ok) setProposals(await pRes.json());
        if (tRes.ok) setTasks(await tRes.json());
        if (fRes.ok) setFinancialEntries(await fRes.json());
        if (prRes.ok) setProtocols(await prRes.json());
        if (cRes.ok) setCriticalPendings(await cRes.json());
        if (emRes.ok) setEmailConfig(await emRes.json());
        if (sigRes.ok) setSignatureConfig(await sigRes.json());
        if (logRes.ok) setLogoConfig(await logRes.json());
        
        if (currentUser.role !== 'tecnico') {
           const uRes = await fetch('/api/users');
           if (uRes.ok) setUsers(await uRes.json());
        }
      } catch (e) {
        console.error('Error fetching data:', e);
      }
    };
    fetchData();
  }, [currentUser]);


  // Sync state changes with server API helper
  const apiPost = async (endpoint: string, payload: any) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('API Post Error');
    return res.json();
  };

  const apiPut = async (endpoint: string, payload: any) => {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('API Put Error');
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
      setActiveTab('tasks');
    }
  };

  // Vessel Actions
  const handleCreateVessel = (vesselData: Partial<Vessel>, generateTasks: boolean = false) => {
    const vesselId = `ves-${Date.now()}`;
    const newV: Vessel = {
      id: vesselId,
      clienteId: 'cli-1',
      clienteNome: vesselData.clienteNome || 'Cliente',
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

    setVessels([newV, ...vessels]);
    apiPost('/api/vessels', newV);

    if (generateTasks) {
      const standardTasks = [
        { tipo: 'ultrassom', titulo: 'Relatório de Medição de Espessura (Ultrassom)', prazo: '10 dias' },
        { tipo: 'desenho', titulo: 'Croqui de Sondagem e Estrutura', prazo: '15 dias' },
        { tipo: 'art', titulo: 'Emissão de ART (CREA)', prazo: '5 dias' },
        { tipo: 'homologacao', titulo: 'Homologação na Certificadora', prazo: '30 dias' }
      ];

      const newTasks: DocumentTask[] = standardTasks.map((t, idx) => ({
        id: `task-${Date.now()}-${idx}`,
        embarcacaoId: vesselId,
        embarcacaoNome: newV.nome,
        clienteNome: newV.clienteNome,
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

      setTasks((prev) => [...newTasks, ...prev]);
      newTasks.forEach(t => apiPost('/api/tasks', t));
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
  const handleFormalAcceptance = (proposalId: string, aceiteNome: string, aceiteData: string, autoGenerateSinal: boolean) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    // Update proposal
    const updatedProps = proposals.map((p) => p.id === proposalId ? { ...p, status: 'aprovado' as any, aceiteData, aceiteAssinaturaNome: aceiteNome } : p);
    setProposals(updatedProps);
    apiPut(`/api/proposals/${proposalId}`, { status: 'aprovado', aceiteData, aceiteAssinaturaNome: aceiteNome });

    // Update vessel total value if it's attached
    if (proposal.embarcacaoId) {
       setVessels(prev => prev.map(v => v.id === proposal.embarcacaoId ? { ...v, valorTotal: proposal.valorTotal } : v));
       
       // Auto-generate DocumentTasks (processos) from proposal items
       const newTasks: DocumentTask[] = proposal.itens.map((item, index) => {
         const descLower = item.descricao.toLowerCase();
         let tipo: 'ultrassom' | 'desenho' | 'art' | 'homologacao' | 'outro' = 'outro';
         if (descLower.includes('ultrassom') || descLower.includes('espessura')) tipo = 'ultrassom';
         else if (descLower.includes('desenho') || descLower.includes('plano')) tipo = 'desenho';
         else if (descLower.includes('art')) tipo = 'art';
         else if (descLower.includes('homologa')) tipo = 'homologacao';

         // Find a technician to assign
         const technician = users.find(u => u.role === 'tecnico') || currentUser;

         return {
           id: `task-${Date.now()}-${index}`,
           embarcacaoId: proposal.embarcacaoId,
           embarcacaoNome: proposal.embarcacaoNome,
           clienteNome: proposal.clienteNome,
           orcamentoId: proposal.id,
           tipo,
           titulo: item.descricao,
           responsavelId: technician.id,
           responsavelNome: technician.nome,
           responsavelCargo: technician.cargo,
           status: 'pendente',
           certificadora: 'DPC', // Default
           prazo: 'A definir',
           observacoes: `Criado automaticamente a partir da proposta ${proposal.numero}`,
           historicoNotas: [],
           atualizadoEm: new Date().toISOString().split('T')[0],
         };
       });

       if (newTasks.length > 0) {
         setTasks(prev => [...newTasks, ...prev]);
         newTasks.forEach(t => apiPost('/api/tasks', t));
       }
    }

    // Auto-generate sinal
    if (autoGenerateSinal && proposal.embarcacaoId) {
       const halfValue = proposal.valorTotal / 2; // Assuming standard 50% sinal
       handleAddPayment({
         embarcacaoId: proposal.embarcacaoId,
         embarcacaoNome: proposal.embarcacaoNome,
         valor: halfValue,
         tipo: 'sinal',
         formaPagamento: 'PIX',
         observacao: `Sinal automático gerado na aprovação da Proposta ${proposal.numero}`,
       });
    }
  };

  const handleCreateProposal = (proposalData: Partial<Proposal>) => {
    const currentYear = new Date().getFullYear();
    const yearSuffix = String(currentYear).slice(-2);
    const seq = proposals.length + 51;
    const num = `DS ${String(seq).padStart(3, '0')}/${yearSuffix}`;

    const newProp: Proposal = {
      id: `prop-${Date.now()}`,
      embarcacaoId: proposalData.embarcacaoId || '',
      embarcacaoNome: proposalData.embarcacaoNome || '',
      clienteNome: proposalData.clienteNome || '',
      numero: num,
      ano: currentYear,
      dataEmissao: proposalData.dataEmissao || new Date().toLocaleDateString('pt-BR'),
      destinatario: proposalData.destinatario || 'A/C: Cliente',
      assunto: proposalData.assunto || 'Serviços de inspeção e desenhos técnicos.',
      prazoEntregaDias: proposalData.prazoEntregaDias || 10,
      observacoesGerais: proposalData.observacoesGerais || '',
      condicaoPagamento: proposalData.condicaoPagamento || 'À vista',
      status: proposalData.status || 'enviado',
      itens: proposalData.itens || [],
      valorTotal: proposalData.valorTotal || 0,
      elaboradoPor: proposalData.elaboradoPor || currentUser.nome,
      criadoEm: new Date().toISOString().split('T')[0],
    };

    setProposals([newProp, ...proposals]);
    apiPost('/api/proposals', newProp);

    // Also update vessel's total value if attached
    if (newProp.embarcacaoId) {
      setVessels(
        vessels.map((v) => (v.id === newProp.embarcacaoId ? { ...v, valorTotal: newProp.valorTotal } : v))
      );
    }
  };

  const handleUpdateProposal = (proposalId: string, updatedData: Partial<Proposal>) => {
    const updated = proposals.map((p) => (p.id === proposalId ? { ...p, ...updatedData } : p));
    setProposals(updated);
    apiPut(`/api/proposals/${proposalId}`, updatedData);
  };

  // Task Actions
  const handleCreateTask = (taskData: Partial<DocumentTask>) => {
    const newTask: DocumentTask = {
      id: `task-${Date.now()}`,
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

    setTasks([newTask, ...tasks]);
    apiPost('/api/tasks', newTask);
    
    // Dispara notificação push simulada
    if (newTask.responsavelId !== currentUser.id) {
      simulatePushNotification(
        'Nova Tarefa Atribuída', 
        `Você tem uma nova tarefa: "${newTask.titulo}" para a embarcação ${newTask.embarcacaoNome}.`
      );
    } else {
      simulatePushNotification(
        'Tarefa Criada', 
        `Tarefa "${newTask.titulo}" foi criada para a embarcação ${newTask.embarcacaoNome}.`
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
  const handleAddPayment = (paymentData: Partial<FinancialEntry>) => {
    const vessel = vessels.find((v) => v.id === paymentData.embarcacaoId);
    const newEntry: FinancialEntry = {
      id: `fin-${Date.now()}`,
      embarcacaoId: paymentData.embarcacaoId || '',
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
    };

    setFinancialEntries([newEntry, ...financialEntries]);
    apiPost('/api/finance', newEntry);

    // Update vessel's received total
    setVessels((prevVessels) =>
      prevVessels.map((v) => {
        if (v.id === newEntry.embarcacaoId) {
          const newReceived = v.valorRecebido + newEntry.valor;
          const newSinal = newEntry.tipo === 'sinal' ? newEntry.valor : v.valorSinal;
          return { ...v, valorRecebido: newReceived, valorSinal: newSinal };
        }
        return v;
      })
    );

    if (selectedVessel && selectedVessel.id === newEntry.embarcacaoId) {
      setSelectedVessel({
        ...selectedVessel,
        valorRecebido: selectedVessel.valorRecebido + newEntry.valor,
        valorSinal: newEntry.tipo === 'sinal' ? newEntry.valor : selectedVessel.valorSinal,
      });
    }
  };

  const handleUpdatePayment = (entryId: string, updatedFields: Partial<FinancialEntry>) => {
    setFinancialEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, ...updatedFields } : e))
    );
    apiPut(`/api/finance/${entryId}`, updatedFields);
  };

  // Protocol Actions
  const handleCreateProtocol = (protocolData: Partial<Protocol>) => {
    const newProt: Protocol = {
      id: `prot-${Date.now()}`,
      numeroProtocolo: protocolData.numeroProtocolo || `PROT-${Date.now().toString().slice(-4)}`,
      dataEnvio: protocolData.dataEnvio || new Date().toISOString().split('T')[0],
      embarcacaoId: protocolData.embarcacaoId || '',
      embarcacaoNome: protocolData.embarcacaoNome || '',
      clienteNome: protocolData.clienteNome || '',
      tipoProtocolo: protocolData.tipoProtocolo || 'capitania_dpc',
      destinatario: protocolData.destinatario || 'Seção de Análise',
      orgaoOuEmpresa: protocolData.orgaoOuEmpresa || 'Marinha do Brasil',
      documentosIncluidos: protocolData.documentosIncluidos || ['Documento Técnico'],
      responsavelEnvioNome: currentUser.nome,
      status: protocolData.status || 'em_trânsito',
      codigoRastreio: protocolData.codigoRastreio,
      observacoes: protocolData.observacoes,
    };

    setProtocols((prev) => [newProt, ...prev]);
    apiPost('/api/protocols', newProt);
  };

  const handleUpdateProtocol = (id: string, updatedFields: Partial<Protocol>) => {
    setProtocols((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
    apiPut(`/api/protocols/${id}`, updatedFields);
  };

  // Count active tasks assigned to current user
  const myTasksCount = tasks.filter(
    (t) => t.responsavelId === currentUser.id && t.status !== 'baixado'
  ).length;

  const handleUpdateProfile = (updatedFields: Partial<User>) => {
    const updatedUser = { ...currentUser, ...updatedFields };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    apiPut(`/api/users/${currentUser.id}`, updatedFields);
  };

  // Settings & Employee Management Handlers
  const handleCreateUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      nome: userData.nome || 'Novo Funcionário',
      email: userData.email || '',
      cargo: userData.cargo || 'Técnico',
      role: userData.role || 'tecnico',
      ativo: true,
      acessoAtivo: userData.acessoAtivo !== false,
      tarefasAtivas: 0,
    };
    setUsers((prev) => [...prev, newUser]);
    apiPost('/api/users', newUser);
  };

  const handleUpdateUser = (userId: string, updatedFields: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updatedFields } : u)));
    apiPut(`/api/users/${userId}`, updatedFields);
  };

  const handleUpdateEmailConfig = (config: EmailConfig) => {
    setEmailConfig(config);
    apiPut('/api/settings/email', config);
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
      return await res.json();
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Erro ao testar SMTP' };
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!currentUser) return <LoginView onLogin={setCurrentUser} />;

  return (
    <div 
      className="min-h-screen bg-[#F4F6F9] font-sans text-slate-900 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"
    >
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        users={users}
        logoConfig={logoConfig}
        onSelectUser={handleSelectUser}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        pendingAlertsCount={criticalPendings.length}
        onToggleProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main App Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentUser={currentUser}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          myTasksCount={myTasksCount}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic View Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentUser={currentUser}
              users={users}
              vessels={vessels}
              tasks={tasks}
              proposals={proposals}
              criticalPendings={criticalPendings}
              onSelectVessel={(v) => setSelectedVessel(v)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onCreateProposalClick={() => setActiveTab('proposals')}
            />
          )}

          {activeTab === 'vessels' && (
            <VesselsList
              vessels={vessels}
              clients={clients}
              onSelectVessel={(v) => setSelectedVessel(v)}
              onCreateVessel={handleCreateVessel}
              canCreate={currentUser.role !== 'tecnico'}
            />
          )}

          {activeTab === 'tasks' && (
            <MyTasks
              tasks={tasks}
              currentUser={currentUser}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onUploadTaskFile={handleUploadTaskFile}
              onAddTaskNote={handleAddTaskNote}
            />
          )}

          {activeTab === 'proposals' && (
            <ProposalsList
              proposals={proposals}
              vessels={vessels}
              currentUser={currentUser}
              signatureConfig={signatureConfig}
              logoConfig={logoConfig}
              onCreateProposal={handleCreateProposal}
              onUpdateProposal={handleUpdateProposal}
              onFormalAcceptance={handleFormalAcceptance}
            />
          )}

          {activeTab === 'financial' && (
            <FinancialView
              vessels={vessels}
              financialEntries={financialEntries}
              currentUser={currentUser}
              signatureConfig={signatureConfig}
              logoConfig={logoConfig}
              onAddPayment={handleAddPayment}
              onUpdatePayment={handleUpdatePayment}
            />
          )}

          {activeTab === 'protocols' && (
            <ProtocolsView
              protocols={protocols}
              vessels={vessels}
              currentUser={currentUser}
              signatureConfig={signatureConfig}
              logoConfig={logoConfig}
              onCreateProtocol={handleCreateProtocol}
              onUpdateProtocol={handleUpdateProtocol}
            />
          )}

          {activeTab === 'team' && (
            <TeamView
              users={users}
              tasks={tasks}
              onUpdateUserRole={(id, role) => {
                setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)));
              }}
              onResetUserPassword={(id) => {
                console.log('Password reset for user:', id);
              }}
            />
          )}

          {activeTab === 'documents' && (
            <GlobalDocumentSearch tasks={tasks} vessels={vessels} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              users={users}
              emailConfig={emailConfig}
              signatureConfig={signatureConfig}
              logoConfig={logoConfig}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onUpdateEmailConfig={handleUpdateEmailConfig}
              onUpdateSignatureConfig={handleUpdateSignatureConfig}
              onUpdateLogoConfig={handleUpdateLogoConfig}
              onTestEmailDispatch={handleTestEmailDispatch}
              onOpenProfile={() => setIsProfileModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Vessel Detail Modal Overlay */}
      {selectedVessel && (
        <VesselDetailModal
          vessel={selectedVessel}
          tasks={tasks}
          proposals={proposals}
          financialEntries={financialEntries}
          users={users}
          currentUser={currentUser}
          onClose={() => setSelectedVessel(null)}
          onUpdateVesselStatus={handleUpdateVesselStatus}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onCreateTask={handleCreateTask}
          onAddPayment={handleAddPayment}
          onSelectProposal={(p) => setSelectedProposalForView(p)}
          onCreateProposalForVessel={(v) => {
            setSelectedVessel(null);
            setActiveTab('proposals');
          }}
        />
      )}

      {/* User Profile Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          currentUser={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onSaveProfile={handleUpdateProfile}
        />
      )}

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
