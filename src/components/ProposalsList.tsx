import React, { useState, useEffect } from 'react';
import { Proposal, Vessel, ScopeItem, User, SignatureConfig, LogoConfig, AcceptPayload, ProposalAcceptance, AccountReceivable, Client, RegisteredService } from '../types';
import { ProposalPdfTemplate } from './ProposalPdfTemplate';
import { generateProposalPdf, downloadBlob, blobToBase64 } from '../utils/pdfGenerator';
import { INITIAL_STANDARD_OBSERVATIONS } from '../data/initialData';
import { CurrencyInput } from './CurrencyInput';
import { formatDateBR } from '../utils/date-formatters';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Download,
  Printer,
  Trash2,
  Calendar,
  X,
  Edit,
  Eye,
  Mail,
  MessageCircle,
  FileCheck,
  Upload,
  ExternalLink,
} from 'lucide-react';

interface ProposalsListProps {
  proposals: Proposal[];
  vessels: Vessel[];
  clients: Client[];
  currentUser: User;
  signatureConfig?: SignatureConfig;
  logoConfig?: LogoConfig;
  onCreateProposal: (proposalData: Partial<Proposal>) => void;
  onUpdateProposal: (proposalId: string, updatedData: Partial<Proposal>) => void;
  onFormalAcceptance: (proposalId: string, payload: any, file?: File | null) => Promise<any>;
  onRenewalCreated?: (proposal: Proposal) => void;
  onNavigateTab?: (tab: any) => void;
}

export const ProposalsList: React.FC<ProposalsListProps> = ({
  proposals,
  vessels,
  clients,
  currentUser,
  signatureConfig,
  logoConfig,
  onCreateProposal,
  onUpdateProposal,
  onFormalAcceptance,
  onRenewalCreated,
  onNavigateTab,
}) => {
  const [search, setSearch] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFormalAcceptanceModalOpen, setIsFormalAcceptanceModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Listen for custom event to open a specific proposal from Dashboard
  useEffect(() => {
    const handleOpenProposal = (event: CustomEvent<string>) => {
      const proposalId = event.detail;
      const proposal = proposals.find((p) => p.id === proposalId);
      if (proposal) {
        setSelectedProposal(proposal);
      }
    };

    window.addEventListener('open-proposal' as any, handleOpenProposal as any);
    return () => {
      window.removeEventListener('open-proposal' as any, handleOpenProposal as any);
    };
  }, [proposals]);

  // Proposal Form State
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState('');
  const [embarcacaoId, setEmbarcacaoId] = useState('');
  const [embarcacoesIds, setEmbarcacoesIds] = useState<string[]>([]);
  const [destinatario, setDestinatario] = useState('A/C: Sr. Armador / Proprietário');
  const [assunto, setAssunto] = useState(
    'Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica.'
  );
  const [prazoDias, setPrazoDias] = useState(10);
  const [observacoes, setObservacoes] = useState(INITIAL_STANDARD_OBSERVATIONS);
  const [condicaoPagamento, setCondicaoPagamento] = useState(
    'Pagamento de 50% de sinal no aceite da proposta + 50% na entrega e homologação dos relatórios.'
  );
  const [elaboradoPor, setElaboradoPor] = useState('Deisy Saldanha - Administrativo/Financeiro');
  const [services, setServices] = useState<RegisteredService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [valorDesconto, setValorDesconto] = useState(0);

  // Items State
  const [itens, setItens] = useState<ScopeItem[]>([]);

  useEffect(() => {
    fetch('/api/services')
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setServices(Array.isArray(data) ? data.map((service) => ({ ...service, valorPadrao: Number(service.valorPadrao) || 0 })) : []))
      .catch(() => setServices([]));
  }, [isEditorOpen]);

  // Formal Acceptance Modal State
  const [aceiteNome, setAceiteNome] = useState('');
  const [aceiteData, setAceiteData] = useState(new Date().toISOString().split('T')[0]);
  const [aceiteMeio, setAceiteMeio] = useState<'presencial' | 'email' | 'whatsapp' | 'outro'>('presencial');
  const [aceiteObs, setAceiteObs] = useState('');
  const [aceiteDocumento, setAceiteDocumento] = useState<File | null>(null);
  const [situacaoFinanceira, setSituacaoFinanceira] = useState<'pendente' | 'parcial' | 'integral'>('pendente');
  const [valorRecebido, setValorRecebido] = useState(0);
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [acceptStage, setAcceptStage] = useState<'info' | 'financeiro' | 'sucesso'>('info');
  const [noDocumentWarning, setNoDocumentWarning] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  // Acceptance info display
  const [acceptanceInfo, setAcceptanceInfo] = useState<{ acceptance: ProposalAcceptance | null; receivable: AccountReceivable | null; os: any | null } | null>(null);

  // Email Modal State
  const [emailDest, setEmailDest] = useState('');
  const [emailAssunto, setEmailAssunto] = useState('');
  const [emailMensagem, setEmailMensagem] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState('');

  // WhatsApp Modal State
  const [whatsNumero, setWhatsNumero] = useState('');
  const [whatsMensagem, setWhatsMensagem] = useState('');
  const [whatsSharing, setWhatsSharing] = useState(false);

  const filteredProposals = proposals.filter(
    (p) =>
      p.numero.toLowerCase().includes(search.toLowerCase()) ||
      p.embarcacaoNome.toLowerCase().includes(search.toLowerCase()) ||
      p.clienteNome.toLowerCase().includes(search.toLowerCase())
  );

  const calculateTotal = (itemsList: ScopeItem[]) => {
    return itemsList.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);
  };

  const handleAddItem = () => {
    setItens([
      ...itens,
      {
        id: String(Date.now()),
        descricao: 'Novo item do escopo de serviço',
        quantidade: 1,
        valorUnitario: 1000,
      },
    ]);
  };

  const handleAddRegisteredService = () => {
    const service = services.find((item) => item.id === selectedServiceId);
    if (!service) return;
    setItens([...itens, {
      id: `${service.id}-${Date.now()}`,
      serviceId: service.id,
      descricao: service.nome,
      quantidade: 1,
      valorUnitario: service.valorPadrao,
    }]);
    setSelectedServiceId('');
  };

  const handleRemoveItem = (id: string) => {
    setItens(itens.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ScopeItem, val: any) => {
    setItens(
      itens.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const handleOpenNewProposal = () => {
    setEditingProposalId(null);
    setClienteId('');
    setEmbarcacaoId('');
    setEmbarcacoesIds([]);
    setDestinatario('A/C: Sr. Armador / Proprietário');
    setAssunto(
      'Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica.'
    );
    setItens([]);
    setValorDesconto(0);
    setSelectedServiceId('');
    setIsEditorOpen(true);
  };

  const handleSaveProposal = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVessel = vessels.find((v) => v.id === embarcacaoId);
    const subtotal = calculateTotal(itens);
    const discount = Math.min(subtotal, Math.max(0, valorDesconto || 0));
    const totalVal = subtotal - discount;

    const nowFormatted = new Date().toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (editingProposalId) {
      onUpdateProposal(editingProposalId, {
        destinatario,
        assunto,
        prazoEntregaDias: Number(prazoDias),
        observacoesGerais: observacoes,
        condicaoPagamento,
        itens,
        valorDesconto: discount,
        valorTotal: totalVal,
        elaboradoPor,
      });
    } else {
      onCreateProposal({
        embarcacaoId,
        embarcacaoNome: selectedVessel ? selectedVessel.nome : 'Embarcação',
        clienteNome: selectedVessel ? selectedVessel.clienteNome : 'Cliente',
        dataEmissao: nowFormatted,
        destinatario,
        assunto,
        prazoEntregaDias: Number(prazoDias),
        observacoesGerais: observacoes,
        condicaoPagamento,
        status: 'enviado',
        itens,
        valorDesconto: discount,
        valorTotal: totalVal,
        elaboradoPor,
      });
    }

    setIsEditorOpen(false);
  };

  // ---------- PDF Download ----------
  const proposalVessels = (proposal: Proposal) => {
    const ids = proposal.embarcacoesIds?.length ? proposal.embarcacoesIds : [proposal.embarcacaoId];
    const linked = ids.map((id) => vessels.find((v) => v.id === id)).filter(Boolean) as Vessel[];
    return linked.length ? linked : [undefined];
  };

  const proposalPdfFilename = (proposal: Proposal, vessel?: Vessel) =>
    `Proposta_${proposal.numero.replace(/\//g, '-')}_${(vessel?.nome || proposal.embarcacaoNome).replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`;

  const handleDownloadPdf = async (proposal: Proposal, selectedVessel?: Vessel) => {
    const targets = selectedVessel ? [selectedVessel] : proposalVessels(proposal);
    for (const vessel of targets) {
      const blob = await generateProposalPdf(proposal, vessel, signatureConfig);
      downloadBlob(blob, proposalPdfFilename(proposal, vessel));
    }
  };

  // ---------- Email ----------
  const openEmailModal = async (proposal: Proposal) => {
    const vessel = vessels.find((v) => v.id === proposal.embarcacaoId);
    let matchedClient = clients.find(
      (c) => (vessel?.clienteId && c.id === vessel.clienteId) || 
             (c.nome && (c.nome.trim().toLowerCase() === (proposal.clienteNome || '').trim().toLowerCase() || c.nome.trim().toLowerCase() === (vessel?.clienteNome || '').trim().toLowerCase()))
    );

    if (!matchedClient && (vessel?.clienteId || proposal.clienteNome || vessel?.clienteNome)) {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const clientList: Client[] = await res.json();
          matchedClient = clientList.find(
            (c) => (vessel?.clienteId && c.id === vessel.clienteId) || 
                   (c.nome && (c.nome.trim().toLowerCase() === (proposal.clienteNome || '').trim().toLowerCase() || c.nome.trim().toLowerCase() === (vessel?.clienteNome || '').trim().toLowerCase()))
          );
        }
      } catch {
        // ignore
      }
    }

    const email = matchedClient?.email || vessel?.emailContato || '';
    setEmailDest(email);
    setEmailAssunto(`Proposta ${proposal.numero} - Nautilus Projetos Navais`);
    setEmailMensagem(`Prezado(a),\n\nSegue em anexo a proposta ${proposal.numero} referente à embarcação ${proposal.embarcacaoNome}.\n\nAtenciosamente,\n${currentUser.nome}`);
    setEmailResult('');
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;
    setEmailSending(true);
    setEmailResult('');
    try {
      const pdfs = await Promise.all(proposalVessels(selectedProposal).map(async (vessel) => ({
        filename: proposalPdfFilename(selectedProposal, vessel),
        base64: await blobToBase64(await generateProposalPdf(selectedProposal, vessel, signatureConfig)),
      })));
      const res = await fetch(`/api/proposals/${selectedProposal.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarioEmail: emailDest,
          assunto: emailAssunto,
          mensagem: emailMensagem,
          pdfs,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailResult('E-mail enviado com sucesso!');
        setTimeout(() => setIsEmailModalOpen(false), 1500);
      } else {
        setEmailResult(data.error || 'Falha ao enviar e-mail');
      }
    } catch (err: any) {
      setEmailResult(err?.message || 'Erro ao enviar e-mail');
    } finally {
      setEmailSending(false);
    }
  };

  // ---------- WhatsApp ----------
  const openWhatsAppModal = async (proposal: Proposal) => {
    const vessel = vessels.find((v) => v.id === proposal.embarcacaoId);
    let matchedClient = clients.find(
      (c) => (vessel?.clienteId && c.id === vessel.clienteId) || 
             (c.nome && (c.nome.trim().toLowerCase() === (proposal.clienteNome || '').trim().toLowerCase() || c.nome.trim().toLowerCase() === (vessel?.clienteNome || '').trim().toLowerCase()))
    );

    if (!matchedClient && (vessel?.clienteId || proposal.clienteNome || vessel?.clienteNome)) {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const clientList: Client[] = await res.json();
          matchedClient = clientList.find(
            (c) => (vessel?.clienteId && c.id === vessel.clienteId) || 
                   (c.nome && (c.nome.trim().toLowerCase() === (proposal.clienteNome || '').trim().toLowerCase() || c.nome.trim().toLowerCase() === (vessel?.clienteNome || '').trim().toLowerCase()))
          );
        }
      } catch {
        // ignore
      }
    }

    const rawPhone = matchedClient?.whatsapp || matchedClient?.telefone || vessel?.telefoneContato || '';
    const digits = rawPhone.replace(/\D/g, '');
    let formattedPhone = '';
    if (digits) {
      if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
        formattedPhone = digits;
      } else if (digits.length === 10 || digits.length === 11) {
        formattedPhone = `55${digits}`;
      } else {
        formattedPhone = digits;
      }
    }

    const msg = `Olá! Segue a proposta ${proposal.numero} referente à embarcação ${proposal.embarcacaoNome} no valor de R$ ${Number(proposal.valorTotal).toLocaleString('pt-BR')}.`;
    setWhatsNumero(formattedPhone);
    setWhatsMensagem(msg);
    setIsWhatsAppModalOpen(true);
  };

  const handleWhatsAppShare = async () => {
    if (!selectedProposal) return;
    setWhatsSharing(true);
    try {
      const files = await Promise.all(proposalVessels(selectedProposal).map(async (vessel) => new File(
        [await generateProposalPdf(selectedProposal, vessel, signatureConfig)], proposalPdfFilename(selectedProposal, vessel), { type: 'application/pdf' }
      )));

      // Try Web Share API with file
      const nav = navigator as any;
      if (nav.share && nav.canShare && nav.canShare({ files })) {
        await nav.share({
          files,
          title: `Proposta ${selectedProposal.numero}`,
          text: whatsMensagem,
        });
        // Register delivery attempt
        await fetch(`/api/proposals/${selectedProposal.id}/deliveries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ canal: 'whatsapp', destinatario: whatsNumero, status: 'enviado' }),
        });
        setIsWhatsAppModalOpen(false);
      } else {
        // Desktop fallback: download PDF and open WhatsApp conversation
        files.forEach((file: File) => downloadBlob(file, file.name));
        const cleanPhone = whatsNumero.replace(/\D/g, '');
        const internationalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        window.open(`https://api.whatsapp.com/send?phone=${internationalPhone}&text=${encodeURIComponent(whatsMensagem + '\n\n(Arquivo PDF baixado; anexe-o antes de enviar.)')}`, '_blank');
        await fetch(`/api/proposals/${selectedProposal.id}/deliveries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ canal: 'whatsapp', destinatario: whatsNumero, status: 'preparado' }),
        });
        setIsWhatsAppModalOpen(false);
      }
    } catch (err) {
      console.error('WhatsApp share error:', err);
    } finally {
      setWhatsSharing(false);
    }
  };

  // ---------- Acceptance ----------
  const openAcceptanceModal = (proposal: Proposal) => {
    setAceiteNome(proposal.destinatario.replace(/^A\/C:\s*/, ''));
    setAceiteData(new Date().toISOString().split('T')[0]);
    setAceiteMeio('presencial');
    setAceiteObs('');
    setAceiteDocumento(null);
    setSituacaoFinanceira('pendente');
    setValorRecebido(0);
    setDataPagamento(new Date().toISOString().split('T')[0]);
    setFormaPagamento('PIX');
    setAcceptStage('info');
    setNoDocumentWarning(false);
    setAcceptError('');
    setAccepting(false);
    setIsFormalAcceptanceModalOpen(true);
  };

  const handleConfirmFormalAcceptance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;

    if (acceptStage === 'info') {
      if (!aceiteDocumento) {
        setNoDocumentWarning(true);
      }
      setAcceptStage('financeiro');
      setValorRecebido(selectedProposal.valorTotal);
      return;
    }

    if (!aceiteNome.trim()) {
      setAcceptError('Nome do responsável é obrigatório');
      return;
    }

    setAccepting(true);
    setAcceptError('');
    try {
      const payload = {
        meio: aceiteMeio,
        responsavelNome: aceiteNome,
        data: aceiteData,
        observacao: aceiteObs,
        situacaoFinanceira: situacaoFinanceira === 'integral' ? 'integral' : situacaoFinanceira,
        valorRecebido: situacaoFinanceira === 'pendente' ? undefined : valorRecebido,
        dataPagamento: situacaoFinanceira === 'pendente' ? undefined : dataPagamento,
        formaPagamento: situacaoFinanceira === 'pendente' ? undefined : formaPagamento,
      };
      const result: any = await onFormalAcceptance(selectedProposal.id, payload, aceiteDocumento);
      setAcceptStage('sucesso');

      // Load acceptance info for display
      const accRes = await fetch(`/api/proposals/${selectedProposal.id}/acceptance`);
      if (accRes.ok) {
        const accData = await accRes.json();
        setAcceptanceInfo({
          acceptance: accData.acceptance,
          receivable: accData.receivable,
          os: accData.os,
        });
      }

      // Update selected proposal status
      setSelectedProposal({
        ...selectedProposal,
        status: 'aprovado',
        aceiteData: aceiteData,
        aceiteAssinaturaNome: aceiteNome,
      });
    } catch (err: any) {
      setAcceptError(err?.message || 'Erro ao registrar aceite');
      setAccepting(false);
    }
  };

  const handleLoadAcceptance = async (proposal: Proposal) => {
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/acceptance`);
      if (res.ok) {
        const data = await res.json();
        setAcceptanceInfo({
          acceptance: data.acceptance,
          receivable: data.receivable,
          os: data.os,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const canAccept = currentUser.role !== 'tecnico';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Orçamentos & Propostas (DS 0XX/AA)</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gerador de propostas comerciais em PDF fiel ao padrão da Nautilus Projetos Navais.
          </p>
        </div>

        {currentUser.role !== 'tecnico' && (
          <button
            onClick={handleOpenNewProposal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Nova Proposta (DS 0XX/AA)
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número da proposta (ex: DS 051/26), embarcação ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B192C] text-white uppercase font-bold tracking-wider">
                <th className="p-3.5">Nº Proposta</th>
                <th className="p-3.5">Embarcação / Cliente</th>
                <th className="p-3.5">Assunto</th>
                <th className="p-3.5 text-right">Valor Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {filteredProposals.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-mono font-bold text-blue-900 text-sm">{p.numero}</td>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{p.embarcacaoNome}</p>
                    <p className="text-[11px] text-slate-500">{p.clienteNome}</p>
                  </td>
                  <td className="p-3.5 max-w-xs truncate text-slate-600">{p.assunto}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                    R$ {p.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'aprovado'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'enviado'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => {
                        setSelectedProposal(p);
                        handleLoadAcceptance(p);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Visualizar / PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF View Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto my-6 relative">
            <ProposalPdfTemplate
              proposal={selectedProposal}
              vessels={vessels}
              signatureConfig={signatureConfig}
              onDownloadPdf={(vessel) => handleDownloadPdf(selectedProposal, vessel)}
              onClose={() => setSelectedProposal(null)}
            />

            {/* Action Buttons */}
            {selectedProposal.status !== 'aprovado' && canAccept && (
              <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 mt-4 shadow-xl">
                <div>
                  <p className="font-bold text-sm text-blue-400">Proposta {selectedProposal.numero}</p>
                  <p className="text-xs text-slate-300">
                    Compartilhe ou registre o aceite. O documento assinado é opcional.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownloadPdf(selectedProposal)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar PDF
                  </button>
                  <button
                    onClick={() => openEmailModal(selectedProposal)}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" /> E-mail
                  </button>
                  <button
                    onClick={() => openWhatsAppModal(selectedProposal)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => openAcceptanceModal(selectedProposal)}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5" /> Registrar Aceite
                  </button>
                </div>
              </div>
            )}

            {/* Acceptance Info Display */}
            {acceptanceInfo?.acceptance && (
              <div className="bg-emerald-900 text-white p-4 rounded-xl mt-4 shadow-xl space-y-2">
                <p className="font-bold text-sm text-emerald-300">Aceite Registrado</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold">Responsável</p>
                    <p className="font-bold">{acceptanceInfo.acceptance.responsavelNome}</p>
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold">Data</p>
                    <p className="font-bold">{formatDateBR(acceptanceInfo.acceptance.data)}</p>
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold">Meio</p>
                    <p className="font-bold uppercase">{acceptanceInfo.acceptance.meio}</p>
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold">Situação Financeira</p>
                    <p className="font-bold uppercase">{acceptanceInfo.receivable?.status || 'pendente'}</p>
                  </div>
                </div>
                {acceptanceInfo.acceptance.documentoUrl && (
                  <div>
                    <a
                      href={acceptanceInfo.acceptance.documentoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-300 underline font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {acceptanceInfo.acceptance.documentoNome || 'Documento assinado'}
                    </a>
                  </div>
                )}
                {acceptanceInfo.os && (
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold">Ordem de Serviço</p>
                    <p className="font-bold">{acceptanceInfo.os.numero}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor Modal for New/Edit Proposal */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Criar Nova Proposta Comercial</h2>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 font-bold text-base">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProposal} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Selecionar Cliente *</label>
                <select
                  value={clienteId}
                  onChange={(e) => {
                    setClienteId(e.target.value);
                    setEmbarcacaoId('');
                    setEmbarcacoesIds([]);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                >
                  <option value="">-- Selecione um Cliente --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {clienteId && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vincular à Embarcação *</label>
                  <select
                    multiple
                    value={embarcacoesIds}
                    onChange={(e) => {
                      const selected = Array.from(e.currentTarget.selectedOptions).map((option) => option.value);
                      const primary = selected[0] || '';
                      setEmbarcacaoId(primary); setEmbarcacoesIds(selected);
                      const v = vessels.find((ves) => ves.id === primary);
                      if (v) {
                        setDestinatario(`A/C: ${v.clienteNome}`);
                        setAssunto(
                          `Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação ${v.nome}.`
                        );
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold min-h-28"
                  >
                    {(() => {
                      const selClient = clients.find((c) => c.id === clienteId);
                      const matchingVessels = vessels.filter(
                        (v) => v.clienteId === clienteId || (selClient && v.clienteNome?.trim().toLowerCase() === selClient.nome?.trim().toLowerCase())
                      );
                      if (matchingVessels.length === 0) {
                        return (
                          <option value="" disabled className="text-slate-400">
                            (Nenhuma embarcação cadastrada para este cliente)
                          </option>
                        );
                      }
                      return matchingVessels.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nome} ({v.tipo || 'Embarcação'})
                        </option>
                      ));
                    })()}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    * Pressione Ctrl (ou Cmd) para selecionar mais de uma embarcação se a proposta abranger a frota do cliente.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destinatário (Armador/Proprietário) *</label>
                  <input
                    type="text"
                    required
                    value={destinatario}
                    onChange={(e) => setDestinatario(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prazo de Entrega (Dias corridos)</label>
                  <input
                    type="number"
                    value={prazoDias}
                    onChange={(e) => setPrazoDias(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assunto da Proposta *</label>
                <textarea
                  rows={2}
                  required
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">Escopo dos Serviços & Valores</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-blue-800 font-bold rounded flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Item
                  </button>
                </div>

                <div className="flex flex-col gap-2 rounded-lg border border-blue-100 bg-blue-50 p-2.5 sm:flex-row">
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="min-w-0 flex-1 rounded border border-blue-200 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value="">Selecione um serviço cadastrado</option>
                    {services.filter((service) => service.ativo !== false).map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.nome} — R$ {service.valorPadrao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedServiceId}
                    onClick={handleAddRegisteredService}
                    className="rounded bg-blue-600 px-3 py-1.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Adicionar serviço
                  </button>
                </div>

                <div className="space-y-2">
                  {itens.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border">
                      <span className="font-bold text-slate-400 w-4 text-center">{idx + 1}</span>
                      <input
                        type="text"
                        value={item.descricao}
                        onChange={(e) => handleItemChange(item.id, 'descricao', e.target.value)}
                        className="flex-1 px-2 py-1 border rounded bg-white text-xs"
                      />
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(item.id, 'quantidade', Number(e.target.value))}
                        className="w-16 px-2 py-1 border rounded bg-white font-mono text-center"
                      />
                      <CurrencyInput
                        value={item.valorUnitario}
                        onValueChange={(value) => handleItemChange(item.id, 'valorUnitario', value)}
                        aria-label={`Valor unitário do item ${idx + 1}`}
                        className="w-32 px-2 py-1 border rounded bg-white font-mono text-right"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="ml-auto max-w-sm space-y-1.5 pt-2 text-right text-sm font-mono">
                  <div className="font-semibold text-slate-600">
                    Subtotal: R$ {calculateTotal(itens).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <label className="flex items-center justify-end gap-2 font-semibold text-slate-700">
                    Desconto:
                    <CurrencyInput
                      value={valorDesconto}
                      onValueChange={(value) => setValorDesconto(Math.min(calculateTotal(itens), Math.max(0, value)))}
                      aria-label="Desconto da proposta"
                      className="w-32 rounded border bg-white px-2 py-1 text-right"
                    />
                  </label>
                  <div className="font-bold text-blue-900">
                    Valor Total: R$ {(calculateTotal(itens) - Math.min(calculateTotal(itens), Math.max(0, valorDesconto))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Condição de Pagamento</label>
                <input
                  type="text"
                  value={condicaoPagamento}
                  onChange={(e) => setCondicaoPagamento(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações Gerais da Proposta</label>
                <textarea
                  rows={4}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg">
                  Salvar & Emitir Proposta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Email */}
      {isEmailModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" /> Enviar Proposta por E-mail
            </h3>
            <form onSubmit={handleSendEmail} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Destinatário *</label>
                <input
                  type="email"
                  required
                  value={emailDest}
                  onChange={(e) => setEmailDest(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assunto *</label>
                <input
                  type="text"
                  required
                  value={emailAssunto}
                  onChange={(e) => setEmailAssunto(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mensagem</label>
                <textarea
                  rows={4}
                  value={emailMensagem}
                  onChange={(e) => setEmailMensagem(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                O PDF da proposta será anexado automaticamente. O envio requer SMTP configurado.
              </p>
              {emailResult && (
                <p className={`text-xs font-bold ${emailResult.includes('sucesso') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {emailResult}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={emailSending}
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50"
                >
                  {emailSending ? 'Enviando...' : 'Enviar E-mail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: WhatsApp */}
      {isWhatsAppModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" /> Enviar por WhatsApp
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleWhatsAppShare(); }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefone (com DDI/DDD) *</label>
                <input
                  type="tel"
                  required
                  value={whatsNumero}
                  onChange={(e) => setWhatsNumero(e.target.value)}
                  placeholder="Ex: 5591982412345"
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mensagem</label>
                <textarea
                  rows={3}
                  value={whatsMensagem}
                  onChange={(e) => setWhatsMensagem(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Em dispositivos compatíveis, o PDF será compartilhado diretamente. No computador, o PDF será baixado e a conversa aberta com a mensagem pronta.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={whatsSharing}
                  className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg disabled:opacity-50"
                >
                  {whatsSharing ? 'Compartilhando...' : 'Compartilhar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Accept */}
      {isFormalAcceptanceModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              {acceptStage === 'info' ? 'Registrar Aceite Formal' : 'Situação Financeira'}
            </h3>

            {acceptStage === 'info' ? (
              <form onSubmit={handleConfirmFormalAcceptance} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Meio do Aceite *</label>
                  <select
                    value={aceiteMeio}
                    onChange={(e) => setAceiteMeio(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  >
                    <option value="presencial">Presencial</option>
                    <option value="email">Por E-mail</option>
                    <option value="whatsapp">Por WhatsApp</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Responsável / Armador *</label>
                  <input
                    type="text"
                    required
                    value={aceiteNome}
                    onChange={(e) => setAceiteNome(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data do Aceite *</label>
                  <input
                    type="date"
                    required
                    value={aceiteData}
                    onChange={(e) => setAceiteData(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Observação</label>
                  <textarea
                    rows={2}
                    value={aceiteObs}
                    onChange={(e) => setAceiteObs(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    Documento Assinado (Opcional, até 25MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => {
                      setAceiteDocumento(e.target.files?.[0] || null);
                      setNoDocumentWarning(false);
                    }}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700"
                  />
                  {noDocumentWarning && (
                    <p className="text-[11px] text-amber-600 font-bold mt-1">
                      ⚠ Você não anexou um documento assinado. O aceite será registrado sem comprovante.
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsFormalAcceptanceModalOpen(false)}
                    className="px-3 py-1.5 border rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg">
                    Continuar
                  </button>
                </div>
              </form>
            ) : acceptStage === 'financeiro' ? (
              <form onSubmit={handleConfirmFormalAcceptance} className="space-y-3 text-xs">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <p className="font-bold text-slate-800">
                    {selectedProposal.numero} — R$ {selectedProposal.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Total da proposta. Informe a situação financeira real.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Situação Financeira *</label>
                  <select
                    value={situacaoFinanceira}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setSituacaoFinanceira(val);
                      if (val === 'integral') setValorRecebido(selectedProposal.valorTotal);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  >
                    <option value="pendente">Pendente — Nenhum valor recebido</option>
                    <option value="parcial">Parcial — Recebimento parcial no aceite</option>
                    <option value="integral">Pago integralmente — Valor total recebido</option>
                  </select>
                </div>

                {situacaoFinanceira !== 'pendente' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Valor Recebido (R$) *</label>
                      <CurrencyInput
                        required
                        value={valorRecebido}
                        onValueChange={setValorRecebido}
                        className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Data do Pagamento</label>
                        <input
                          type="date"
                          value={dataPagamento}
                          onChange={(e) => setDataPagamento(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                        <select
                          value={formaPagamento}
                          onChange={(e) => setFormaPagamento(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-xs"
                        >
                          <option value="PIX">PIX / Transferência</option>
                          <option value="Dinheiro">Dinheiro Físico</option>
                          <option value="Boleto">Boleto Bancário</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Transferência Bancária">Transferência Bancária</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {acceptError && (
                  <p className="text-xs font-bold text-red-600">{acceptError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setAcceptStage('info')}
                    className="px-3 py-1.5 border rounded-lg"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={accepting}
                    className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg disabled:opacity-50"
                  >
                    {accepting ? 'Registrando...' : 'Confirmar Aceite'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Proposta Aprovada com Sucesso!</h3>
                <p className="text-xs text-slate-500">
                  O aceite foi registrado, o financeiro atualizado e a ordem de serviço foi gerada.
                </p>

                <div className="grid gap-3 mt-4 text-left">
                  <button
                    type="button"
                    onClick={() => { setIsFormalAcceptanceModalOpen(false); onNavigateTab?.('service-orders'); }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Ir para Ordens de Serviço (OS)</p>
                      <p className="text-[11px] text-slate-500">Acompanhar a execução do serviço</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (acceptanceInfo?.receivable) {
                        const blob = new Blob([`Recibo do valor de R$ ${acceptanceInfo.receivable.valorPago ?? 0}`], { type: 'text/plain' });
                        downloadBlob(blob, `Recibo_${selectedProposal?.numero.replace(/\//g, '-')}.txt`);
                      }
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Baixar Recibo do Valor Pago</p>
                      <p className="text-[11px] text-slate-500">Gerar PDF do recibo provisório</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsFormalAcceptanceModalOpen(false); onNavigateTab?.('financial'); }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Ir para Módulo Financeiro</p>
                      <p className="text-[11px] text-slate-500">Visualizar lançamentos pendentes/pagos</p>
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsFormalAcceptanceModalOpen(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
