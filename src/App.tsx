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
import { DeployConfigView } from './components/DeployConfigView';
import { GlobalDocumentSearch } from './components/GlobalDocumentSearch';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_VESSELS,
  INITIAL_PROPOSALS,
  INITIAL_TASKS,
  INITIAL_FINANCIAL_ENTRIES,
  INITIAL_CRITICAL_PENDINGS,
} from './data/initialData';

export default function App() {
  // State variables
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default Osvaldo (Admin)
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [tasks, setTasks] = useState<DocumentTask[]>(INITIAL_TASKS);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(INITIAL_FINANCIAL_ENTRIES);
  const [criticalPendings, setCriticalPendings] = useState<CriticalPending[]>(INITIAL_CRITICAL_PENDINGS);

  // UI States
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [selectedProposalForView, setSelectedProposalForView] = useState<Proposal | null>(null);

  // Fetch initial data from server API on mount
  useEffect(() => {
    requestNotificationPermission();
    
    fetch('/api/state')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('API server offline');
      })
      .then((data) => {
        if (data.users) setUsers(data.users);
        if (data.vessels) setVessels(data.vessels);
        if (data.proposals) setProposals(data.proposals);
        if (data.tasks) setTasks(data.tasks);
        if (data.financialEntries) setFinancialEntries(data.financialEntries);
        if (data.criticalPendings) setCriticalPendings(data.criticalPendings);
      })
      .catch((err) => {
        console.warn('Using local fallback state:', err);
      });
  }, []);

  // Sync state changes with server API helper
  const apiPost = async (endpoint: string, payload: any) => {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('API Post Error:', e);
    }
  };

  const apiPut = async (endpoint: string, payload: any) => {
    try {
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('API Put Error:', e);
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
    const newEntry: FinancialEntry = {
      id: `fin-${Date.now()}`,
      embarcacaoId: paymentData.embarcacaoId || '',
      embarcacaoNome: paymentData.embarcacaoNome || '',
      data: new Date().toISOString().split('T')[0],
      valor: paymentData.valor || 0,
      tipo: paymentData.tipo || 'parcela',
      formaPagamento: paymentData.formaPagamento || 'PIX',
      observacao: paymentData.observacao || '',
      lancadoPorNome: currentUser.nome,
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

  // Count active tasks assigned to current user
  const myTasksCount = tasks.filter(
    (t) => t.responsavelId === currentUser.id && t.status !== 'baixado'
  ).length;

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans text-slate-900 flex flex-col">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        pendingAlertsCount={criticalPendings.length}
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
              onAddPayment={handleAddPayment}
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

          {activeTab === 'deploy' && <DeployConfigView />}
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
    </div>
  );
}
