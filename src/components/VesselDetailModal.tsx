import React, { useState } from 'react';
import { formatDateBR } from '../utils/date-formatters';
import { Vessel, DocumentTask, Proposal, FinancialEntry, User, Certificadora, TaskStatus, Client, ServiceOrder } from '../types';
import { generateTechnicalReport } from '../utils/pdfGenerator';
import {
  X,
  Ship,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  Award,
  Upload,
  Plus,
  ArrowRight,
  UserCheck,
  Paperclip,
  Download,
  MessageCircle,
  Printer,
  FilePlus,
  Edit3,
} from 'lucide-react';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { CurrencyInput } from './CurrencyInput';

interface VesselDetailModalProps {
  vessel: Vessel;
  clients?: Client[];
  tasks: DocumentTask[];
  proposals: Proposal[];
  financialEntries: FinancialEntry[];
  users: User[];
  currentUser: User;
  onClose: () => void;
  onUpdateVessel?: (vesselId: string, updatedFields: Partial<Vessel>) => void;
  onUpdateVesselStatus: (vesselId: string, newStatus: 'aberta' | 'concluida') => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus, certificadora?: Certificadora) => void;
  onCreateTask: (taskData: Partial<DocumentTask>) => void;
  onUploadTaskFile?: (taskId: string, fileName: string, fileUrl: string) => void;
  onAddPayment: (paymentData: Partial<FinancialEntry>) => void;
  onSelectProposal: (proposal: Proposal) => void;
  onCreateProposalForVessel: (vessel: Vessel) => void;
  serviceOrders?: ServiceOrder[];
  onOpenServiceOrder?: (osId: string) => void;
}

export const VesselDetailModal: React.FC<VesselDetailModalProps> = ({
  vessel,
  clients = [],
  tasks,
  proposals,
  financialEntries,
  users,
  currentUser,
  onClose,
  onUpdateVessel,
  onUpdateVesselStatus,
  onUpdateTaskStatus,
  onCreateTask,
  onUploadTaskFile,
  onAddPayment,
  onSelectProposal,
  onCreateProposalForVessel,
  serviceOrders = [],
  onOpenServiceOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'documentos' | 'financeiro' | 'propostas'>('documentos');

  // Edit Vessel Modal State
  const [isEditVesselModalOpen, setIsEditVesselModalOpen] = useState(false);
  const [editNome, setEditNome] = useState(vessel.nome);
  const [editClienteId, setEditClienteId] = useState(vessel.clienteId || '');
  const [editClienteNome, setEditClienteNome] = useState(vessel.clienteNome || '');
  const [editTipo, setEditTipo] = useState(vessel.tipo || 'Empurrador Fluvial');
  const [editRegistro, setEditRegistro] = useState(vessel.registro || '');
  const [editCertificadora, setEditCertificadora] = useState<Certificadora>(vessel.certificadoraPrincipal);
  const [editDescricao, setEditDescricao] = useState(vessel.descricao || '');

  const handleOpenEditVessel = () => {
    setEditNome(vessel.nome);
    setEditClienteId(vessel.clienteId || '');
    setEditClienteNome(vessel.clienteNome || '');
    setEditTipo(vessel.tipo || 'Empurrador Fluvial');
    setEditRegistro(vessel.registro || '');
    setEditCertificadora(vessel.certificadoraPrincipal);
    setEditDescricao(vessel.descricao || '');
    setIsEditVesselModalOpen(true);
  };

  const handleSaveEditVesselSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNome.trim()) return;

    onUpdateVessel?.(vessel.id, {
      nome: editNome,
      clienteId: editClienteId || undefined,
      clienteNome: editClienteNome,
      tipo: editTipo,
      registro: editRegistro,
      certificadoraPrincipal: editCertificadora,
      descricao: editDescricao,
    });

    setIsEditVesselModalOpen(false);
  };

  // New task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitulo, setTaskTitulo] = useState('');
  const [taskTipo, setTaskTipo] = useState<'ultrassom' | 'desenho' | 'art' | 'homologacao'>('ultrassom');
  const [taskResponsavelId, setTaskResponsavelId] = useState(users[2]?.id || users[0]?.id || '');
  const [taskCertificadora, setTaskCertificadora] = useState<Certificadora>(vessel.certificadoraPrincipal);
  const [taskPrazo, setTaskPrazo] = useState('10 dias');
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [taskObservacoes, setTaskObservacoes] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);

  // New payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceiptEntry, setSelectedReceiptEntry] = useState<FinancialEntry | null>(null);
  const [payValor, setPayValor] = useState(5000);
  const [payTipo, setPayTipo] = useState<'sinal' | 'parcela' | 'quitacao'>('parcela');
  const [payForma, setPayForma] = useState<'PIX' | 'Transferência Bancária' | 'Boleto' | 'Cheque'>('PIX');
  const [payObs, setPayObs] = useState('');

  const vesselServiceOrders = serviceOrders.filter((os) => 
    os.embarcacaoId === vessel.id
  );
  const vesselProposals = proposals.filter((p) => p.embarcacaoId === vessel.id);
  const vesselPayments = financialEntries.filter((f) => f.embarcacaoId === vessel.id);

  const percentReceived = vessel.valorTotal > 0 ? Math.round((vessel.valorRecebido / vessel.valorTotal) * 100) : 0;
  const remainingBalance = vessel.valorTotal - vessel.valorRecebido;

  const handleWhatsAppClient = async () => {
    const tasksCompleted = vesselServiceOrders.filter(o => o.status === 'concluida').length;
    const total = vesselServiceOrders.length;
    
    // Procura o cliente na lista fornecida ou busca do servidor
    let matchedClient = clients.find(
      (c) => (vessel.clienteId && c.id === vessel.clienteId) || (c.nome && c.nome.trim().toLowerCase() === (vessel.clienteNome || '').trim().toLowerCase())
    );

    if (!matchedClient && (vessel.clienteId || vessel.clienteNome)) {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const clientList: Client[] = await res.json();
          matchedClient = clientList.find(
            (c) => (vessel.clienteId && c.id === vessel.clienteId) || (c.nome && c.nome.trim().toLowerCase() === (vessel.clienteNome || '').trim().toLowerCase())
          );
        }
      } catch {
        // fallback
      }
    }

    const rawPhone = matchedClient?.whatsapp || matchedClient?.telefone || vessel.telefoneContato || '';
    const digits = rawPhone.replace(/\D/g, '');
    let phoneParam = '';
    if (digits) {
      if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
        phoneParam = digits;
      } else if (digits.length === 10 || digits.length === 11) {
        phoneParam = `55${digits}`;
      } else {
        phoneParam = digits;
      }
    }
    
    const text = `Olá, aqui é da Nautilus (Engenharia Naval).\n\nAtualização sobre sua embarcação *${vessel.nome}*:\n- Status: ${vessel.status === 'aberta' ? 'Em andamento' : 'Concluída'}\n- Documentos: ${tasksCompleted} de ${total} prontos.\n- Financeiro: R$ ${vessel.valorRecebido.toLocaleString('pt-BR')} recebidos (Saldo pendente: R$ ${remainingBalance.toLocaleString('pt-BR')}).\n\nQualquer dúvida estamos à disposição!`;
    
    const encodedText = encodeURIComponent(text);
    const waUrl = phoneParam 
      ? `https://wa.me/${phoneParam}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(waUrl, '_blank');
  };

  const handleDirectTaskFileUpload = async (taskId: string, file: File) => {
    setUploadingTaskId(taskId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Falha no envio');
      const data = await res.json();
      if (onUploadTaskFile) {
        onUploadTaskFile(taskId, data.fileName, data.url);
      }
    } catch (err) {
      alert('Não foi possível enviar o anexo.');
      console.error(err);
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitulo.trim()) return;

    setIsSubmittingTask(true);
    let uploadedFileName = '';
    let uploadedUrl = '';

    if (taskFile) {
      try {
        const formData = new FormData();
        formData.append('file', taskFile);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedFileName = data.fileName;
          uploadedUrl = data.url;
        } else {
          alert('Aviso: Não foi possível enviar o arquivo anexo, mas o documento será registrado.');
        }
      } catch (err) {
        console.error('Upload failed', err);
      }
    }

    const assignedUser = users.find((u) => u.id === taskResponsavelId);

    onCreateTask({
      embarcacaoId: vessel.id,
      embarcacaoNome: vessel.nome,
      clienteNome: vessel.clienteNome,
      titulo: taskTitulo,
      tipo: taskTipo,
      responsavelId: taskResponsavelId,
      responsavelNome: assignedUser ? assignedUser.nome : 'Responsável',
      responsavelCargo: assignedUser ? assignedUser.cargo : 'Técnico',
      certificadora: taskCertificadora,
      prazo: taskPrazo,
      status: uploadedUrl ? 'pronto' : 'pendente',
      arquivoNome: uploadedFileName || undefined,
      arquivoUrl: uploadedUrl || undefined,
      observacoes: taskObservacoes || undefined,
    });

    setIsSubmittingTask(false);
    setIsTaskModalOpen(false);
    setTaskTitulo('');
    setTaskFile(null);
    setTaskObservacoes('');
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payValor <= 0) return;

    onAddPayment({
      embarcacaoId: vessel.id,
      embarcacaoNome: vessel.nome,
      valor: payValor,
      tipo: payTipo,
      formaPagamento: payForma,
      observacao: payObs || `${payTipo === 'sinal' ? 'Sinal' : 'Pagamento'} da embarcação ${vessel.nome}`,
      lancadoPorNome: currentUser.nome,
    });

    setIsPaymentModalOpen(false);
    setPayObs('');
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto border border-slate-200">
        {/* Top Header */}
        <div className="bg-[#0B192C] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-600/30 border border-blue-500/50 rounded-xl text-blue-400 shrink-0 mt-1">
              <Ship className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white">{vessel.nome}</h2>
                <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {vessel.registro}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Cliente: <strong className="text-white">{vessel.clienteNome}</strong> • Tipo: {vessel.tipo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenEditVessel}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm cursor-pointer"
              title="Editar nome, cliente, registro ou certificadora da embarcação"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar Dados / Cliente</span>
            </button>

            <button
              onClick={handleWhatsAppClient}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp Cliente</span>
            </button>

            {/* Vessel status toggle button */}
            <button
              onClick={() =>
                onUpdateVesselStatus(vessel.id, vessel.status === 'aberta' ? 'concluida' : 'aberta')
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                vessel.status === 'aberta'
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {vessel.status === 'aberta' ? 'Status: Em Andamento' : 'Status: Concluída'}
            </button>

            <button
              onClick={onClose}
              aria-label="Fechar"
              title="Fechar"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Financial Overview Card */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              Valor Total do Serviço
            </p>
            <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
              R$ {vessel.valorTotal.toLocaleString('pt-BR')}
            </p>
          </div>

          <div>
            <p className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              Sinal Inicial
            </p>
            <p className="text-base font-bold font-mono text-blue-900 mt-0.5">
              R$ {vessel.valorSinal.toLocaleString('pt-BR')}
            </p>
          </div>

          <div>
            <p className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              Total Recebido ({percentReceived}%)
            </p>
            <p className="text-base font-bold font-mono text-emerald-700 mt-0.5">
              R$ {vessel.valorRecebido.toLocaleString('pt-BR')}
            </p>
          </div>

          <div>
            <p className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              Saldo Pendente
            </p>
            <p className="text-base font-bold font-mono text-amber-700 mt-0.5">
              R$ {remainingBalance.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-white px-6 flex items-center gap-6 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('documentos')}
            className={`py-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'documentos'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documentos & Laudos ({vesselServiceOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('financeiro')}
            className={`py-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'financeiro'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Histórico Financeiro ({vesselPayments.length})
          </button>

          <button
            onClick={() => setActiveTab('propostas')}
            className={`py-3.5 border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'propostas'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            Propostas do Orçamento ({vesselProposals.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: DOCUMENTOS & LAUDOS */}
          {activeTab === 'documentos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">
                  Ordens de Serviço atreladas a esta embarcação:
                </p>
              </div>

              <div className="space-y-3">
                {vesselServiceOrders.map((os) => (
                  <div
                    key={os.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {os.numero}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {os.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Responsável: <strong className="text-slate-800">{users.find(u => u.id === os.responsavelTecnicoId)?.nome || 'Nenhum'}</strong>
                      </p>
                    </div>
                    {onOpenServiceOrder && (
                      <button
                        onClick={() => onOpenServiceOrder(os.id)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition"
                      >
                        Abrir Ordem de Serviço
                      </button>
                    )}
                  </div>
                ))}

                {vesselServiceOrders.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Nenhuma ordem de serviço gerada para esta embarcação ainda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HISTÓRICO FINANCEIRO */}
          {activeTab === 'financeiro' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">Lançamentos de recebimento e sinal:</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (vesselPayments.length === 0) return;
                      const headers = ["ID", "Data", "Tipo", "Forma de Pagamento", "Observacao", "Lancado Por", "Valor (R$)"];
                      const csvContent = [
                        headers.join(","),
                        ...vesselPayments.map(p => [
                          p.id,
                          formatDateBR(p.data),
                          p.tipo,
                          p.formaPagamento,
                          `"${p.observacao.replace(/"/g, '""')}"`,
                          `"${p.lancadoPorNome}"`,
                          p.valor
                        ].join(","))
                      ].join("\n");
                      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      link.download = `financeiro_${vessel.nome.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    disabled={vesselPayments.length === 0}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                      vesselPayments.length > 0
                        ? 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>

                  {(currentUser.role === 'admin' || currentUser.role === 'financeiro') && (
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Lançar Novo Recebimento
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {vesselPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-mono font-bold text-sm ${
                            p.tipo === 'sinal' ? 'text-blue-700' : 'text-emerald-700'
                          }`}
                        >
                          R$ {p.valor.toLocaleString('pt-BR')}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                          {p.tipo}
                        </span>
                        <span className="text-slate-400">• {p.formaPagamento}</span>
                        {p.notaFiscalNumero && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                            NF-e: {p.notaFiscalNumero}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mt-1">{p.observacao}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Registrado por: {p.lancadoPorNome} em {formatDateBR(p.data)}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedReceiptEntry(p)}
                      className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      Recibo PDF
                    </button>
                  </div>
                ))}

                {vesselPayments.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Nenhum recebimento registrado para esta embarcação ainda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROPOSTAS */}
          {activeTab === 'propostas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">Propostas formais vinculadas:</p>
                <button
                  onClick={() => onCreateProposalForVessel(vessel)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Gerar Nova Proposta (DS 0XX/AA)
                </button>
              </div>

              <div className="space-y-3">
                {vesselProposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 text-sm">
                          Proposta {prop.numero}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                          {prop.status}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-1 max-w-lg truncate">{prop.assunto}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Valor: R$ {prop.valorTotal.toLocaleString('pt-BR')} • Prazo: {prop.prazoEntregaDias} dias
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectProposal(prop)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      Ver PDF / Imprimir
                    </button>
                  </div>
                ))}

                {vesselProposals.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Nenhuma proposta formal registrada para esta embarcação ainda.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Novo Documento do Escopo</h3>
            <form onSubmit={handleCreateTaskSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Documento / Laudo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Croqui de sondagem, Laudo de espessura"
                  value={taskTitulo}
                  onChange={(e) => setTaskTitulo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo</label>
                <select
                  value={taskTipo}
                  onChange={(e) => setTaskTipo(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="ultrassom">Ultrassom (Inspector)</option>
                  <option value="desenho">Desenho Técnico / Projetista</option>
                  <option value="art">ART / Responsabilidade Técnica</option>
                  <option value="homologacao">Homologação Certificadora</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Atribuir a Responsável *</label>
                <select
                  value={taskResponsavelId}
                  onChange={(e) => setTaskResponsavelId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.cargo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Certificadora Destino</label>
                <select
                  value={taskCertificadora}
                  onChange={(e) => setTaskCertificadora(e.target.value as Certificadora)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Amazon Naval">Amazon Naval</option>
                  <option value="Auto Ship">Auto Ship</option>
                  <option value="ABS">ABS</option>
                  <option value="DNV">DNV</option>
                  <option value="RBNA">RBNA</option>
                  <option value="A definir">A definir</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Anexar Documento / Laudo (PDF, Imagem, CAD, DOCX)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition">
                    <Upload className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {taskFile ? taskFile.name : 'Clique para selecionar o arquivo no seu computador'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setTaskFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {taskFile && (
                    <button
                      type="button"
                      onClick={() => setTaskFile(null)}
                      className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Remover anexo selecionado"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Observações do documento ou da vistoria realizada..."
                  value={taskObservacoes}
                  onChange={(e) => setTaskObservacoes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsTaskModalOpen(false);
                    setTaskFile(null);
                    setTaskObservacoes('');
                  }}
                  disabled={isSubmittingTask}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmittingTask ? (
                    <>
                      <Upload className="w-3.5 h-3.5 animate-spin" />
                      Salvando & Anexando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Creation Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Lançar Novo Recebimento</h3>
            <form onSubmit={handleAddPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor Recebido (R$) *</label>
                <CurrencyInput
                  required
                  value={payValor}
                  onValueChange={setPayValor}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Pagamento</label>
                <select
                  value={payTipo}
                  onChange={(e) => setPayTipo(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="sinal">Sinal de Entrada</option>
                  <option value="parcela">Parcela Intermediária</option>
                  <option value="quitacao">Quitação Final</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                <select
                  value={payForma}
                  onChange={(e) => setPayForma(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="PIX">PIX (20.671.499/0001-76)</option>
                  <option value="Transferência Bancária">Transferência Bancária (Bradesco)</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Cheque">Cheque / Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observação / Comprovante</label>
                <input
                  type="text"
                  placeholder="Ex: Pago referente à 2ª parcela após ultrassom"
                  value={payObs}
                  onChange={(e) => setPayObs(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg"
                >
                  Registrar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Embarcação / Atribuir Cliente */}
      {isEditVesselModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" /> Editar Dados da Embarcação
              </h3>
              <button
                onClick={() => setIsEditVesselModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditVesselSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Embarcação *</label>
                <input
                  type="text"
                  required
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cliente / Armador (Dono) *</label>
                  <select
                    value={editClienteId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      setEditClienteId(selId);
                      const selectedClient = clients.find((c) => c.id === selId);
                      if (selectedClient) {
                        setEditClienteNome(selectedClient.nome);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900 bg-white"
                  >
                    <option value="">-- Sem Cliente --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Embarcação</label>
                  <select
                    value={editTipo}
                    onChange={(e) => setEditTipo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="Empurrador Fluvial">Empurrador Fluvial</option>
                    <option value="Balsa Graneleira">Balsa Graneleira</option>
                    <option value="Balsa Tanque">Balsa Tanque</option>
                    <option value="Balsa Carga Geral">Balsa Carga Geral</option>
                    <option value="Balsa Coberta / DDL">Balsa Coberta / DDL</option>
                    <option value="Rebocador">Rebocador</option>
                    <option value="Lancha / Passageiros">Lancha / Passageiros</option>
                    <option value="Catamarã">Catamarã</option>
                    <option value="Flutuante / Terminal">Flutuante / Terminal</option>
                    <option value="Draga / Chata">Draga / Chata</option>
                    <option value="Ferry Boat">Ferry Boat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inscrição / Registro Marinha</label>
                  <input
                    type="text"
                    value={editRegistro}
                    onChange={(e) => setEditRegistro(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Certificadora Principal</label>
                  <select
                    value={editCertificadora}
                    onChange={(e) => setEditCertificadora(e.target.value as Certificadora)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Amazon Naval">Amazon Naval</option>
                    <option value="Auto Ship">Auto Ship</option>
                    <option value="ABS">ABS</option>
                    <option value="DNV">DNV</option>
                    <option value="RBNA">RBNA</option>
                    <option value="A definir">A definir</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações do Escopo</label>
                <textarea
                  rows={2}
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditVesselModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recibo PDF Modal */}
      {selectedReceiptEntry && (
        <PaymentReceiptModal
          entry={selectedReceiptEntry}
          vessel={vessel}
          onClose={() => setSelectedReceiptEntry(null)}
        />
      )}
    </div>
  );
};
