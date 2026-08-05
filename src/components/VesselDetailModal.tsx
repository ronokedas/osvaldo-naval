import React, { useState } from 'react';
import { Vessel, DocumentTask, Proposal, FinancialEntry, User, Certificadora, TaskStatus } from '../types';
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
} from 'lucide-react';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { CurrencyInput } from './CurrencyInput';

interface VesselDetailModalProps {
  vessel: Vessel;
  tasks: DocumentTask[];
  proposals: Proposal[];
  financialEntries: FinancialEntry[];
  users: User[];
  currentUser: User;
  onClose: () => void;
  onUpdateVesselStatus: (vesselId: string, newStatus: 'aberta' | 'concluida') => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus, certificadora?: Certificadora) => void;
  onCreateTask: (taskData: Partial<DocumentTask>) => void;
  onAddPayment: (paymentData: Partial<FinancialEntry>) => void;
  onSelectProposal: (proposal: Proposal) => void;
  onCreateProposalForVessel: (vessel: Vessel) => void;
}

export const VesselDetailModal: React.FC<VesselDetailModalProps> = ({
  vessel,
  tasks,
  proposals,
  financialEntries,
  users,
  currentUser,
  onClose,
  onUpdateVesselStatus,
  onUpdateTaskStatus,
  onCreateTask,
  onAddPayment,
  onSelectProposal,
  onCreateProposalForVessel,
}) => {
  const [activeTab, setActiveTab] = useState<'documentos' | 'financeiro' | 'propostas'>('documentos');

  // New task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitulo, setTaskTitulo] = useState('');
  const [taskTipo, setTaskTipo] = useState<'ultrassom' | 'desenho' | 'art' | 'homologacao'>('ultrassom');
  const [taskResponsavelId, setTaskResponsavelId] = useState(users[2]?.id || users[0]?.id || '');
  const [taskCertificadora, setTaskCertificadora] = useState<Certificadora>(vessel.certificadoraPrincipal);
  const [taskPrazo, setTaskPrazo] = useState('10 dias');

  // New payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceiptEntry, setSelectedReceiptEntry] = useState<FinancialEntry | null>(null);
  const [payValor, setPayValor] = useState(5000);
  const [payTipo, setPayTipo] = useState<'sinal' | 'parcela' | 'quitacao'>('parcela');
  const [payForma, setPayForma] = useState<'PIX' | 'Transferência Bancária' | 'Boleto' | 'Cheque'>('PIX');
  const [payObs, setPayObs] = useState('');

  const vesselTasks = tasks.filter((t) => t.embarcacaoId === vessel.id);
  const vesselProposals = proposals.filter((p) => p.embarcacaoId === vessel.id);
  const vesselPayments = financialEntries.filter((f) => f.embarcacaoId === vessel.id);

  const percentReceived = vessel.valorTotal > 0 ? Math.round((vessel.valorRecebido / vessel.valorTotal) * 100) : 0;
  const remainingBalance = vessel.valorTotal - vessel.valorRecebido;

  const handleWhatsAppClient = () => {
    const tasksCompleted = vesselTasks.filter(t => t.status === 'baixado' || t.status === 'pronto').length;
    const total = vesselTasks.length;
    
    const text = `Olá, aqui é da Nautilus (Engenharia Naval).\n\nAtualização sobre sua embarcação *${vessel.nome}*:\n- Status: ${vessel.status === 'aberta' ? 'Em andamento' : 'Concluída'}\n- Documentos: ${tasksCompleted} de ${total} prontos.\n- Financeiro: R$ ${vessel.valorRecebido.toLocaleString('pt-BR')} recebidos (Saldo pendente: R$ ${remainingBalance.toLocaleString('pt-BR')}).\n\nQualquer dúvida estamos à disposição!`;
    
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitulo.trim()) return;

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
      status: 'pendente',
    });

    setIsTaskModalOpen(false);
    setTaskTitulo('');
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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
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
            Documentos & Laudos ({vesselTasks.length})
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
                  Documentos do escopo atribuídos aos ultrassonistas e desenhistas:
                </p>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Documento / Laudo
                </button>
              </div>

              <div className="space-y-3">
                {vesselTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded">
                          {t.tipo}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{t.titulo}</h4>
                        <p className="text-xs text-slate-500">
                          Responsável: <strong className="text-slate-800">{t.responsavelNome}</strong> ({t.responsavelCargo})
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Certifier select */}
                        <span className="text-xs font-mono font-semibold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                          {t.certificadora}
                        </span>

                        {/* Status switcher */}
                        <select
                          value={t.status}
                          onChange={(e) =>
                            onUpdateTaskStatus(t.id, e.target.value as TaskStatus, t.certificadora)
                          }
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer ${
                            t.status === 'baixado'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : t.status === 'enviado'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : t.status === 'execucao'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : t.status === 'exigencia'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="execucao">Em execução</option>
                          <option value="pronto">Pronto</option>
                          <option value="enviado">Enviado à Certificadora</option>
                          <option value="exigencia">Exigência Recebida</option>
                          <option value="baixado">Baixado</option>
                        </select>
                      </div>
                    </div>

                    {t.observacoes && (
                      <p className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600">
                        {t.observacoes}
                      </p>
                    )}

                    {t.arquivoNome && (
                      <div className="flex items-center gap-2 text-xs font-mono text-blue-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <span className="truncate">{t.arquivoNome}</span>
                        <a
                          href={t.arquivoUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto text-blue-600 hover:underline font-bold flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Baixar
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                      <button
                        onClick={() => generateTechnicalReport(t, vessel)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        Gerar Laudo / Relatório Técnico (PDF)
                      </button>
                    </div>
                  </div>
                ))}

                {vesselTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Nenhum documento ou laudo adicionado a esta embarcação ainda.
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
                          p.data,
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
                        Registrado por: {p.lancadoPorNome} em {p.data}
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

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg">
                  Salvar
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
