import React, { useState } from 'react';
import { Proposal, Vessel, ScopeItem, User, SignatureConfig, LogoConfig } from '../types';
import { ProposalPdfTemplate } from './ProposalPdfTemplate';
import { generateProposalPdf } from '../utils/pdfGenerator';
import { INITIAL_STANDARD_OBSERVATIONS } from '../data/initialData';
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
} from 'lucide-react';

interface ProposalsListProps {
  proposals: Proposal[];
  vessels: Vessel[];
  currentUser: User;
  signatureConfig?: SignatureConfig;
  logoConfig?: LogoConfig;
  onCreateProposal: (proposalData: Partial<Proposal>) => void;
  onUpdateProposal: (proposalId: string, updatedData: Partial<Proposal>) => void;
  onFormalAcceptance: (proposalId: string, aceiteNome: string, aceiteData: string, autoGenerateSinal: boolean) => void;
}

export const ProposalsList: React.FC<ProposalsListProps> = ({
  proposals,
  vessels,
  currentUser,
  signatureConfig,
  logoConfig,
  onCreateProposal,
  onUpdateProposal,
  onFormalAcceptance,
}) => {
  const [search, setSearch] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFormalAcceptanceModalOpen, setIsFormalAcceptanceModalOpen] = useState(false);

  // Proposal Form State
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [embarcacaoId, setEmbarcacaoId] = useState(vessels[0]?.id || '');
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

  // Items State
  const [itens, setItens] = useState<ScopeItem[]>([
    { id: '1', descricao: 'Anotação de Responsabilidade Técnica (ART) - CREA/PA', quantidade: 1, valorUnitario: 800 },
    { id: '2', descricao: 'Declaração de responsabilidade técnica', quantidade: 1, valorUnitario: 1200 },
    { id: '3', descricao: 'Relatório de medição de chapas por ultrassom NDT', quantidade: 1, valorUnitario: 8500 },
    { id: '4', descricao: 'Certificado de homologação nas certificadoras', quantidade: 1, valorUnitario: 3500 },
    { id: '5', descricao: 'Croqui de sondagem', quantidade: 1, valorUnitario: 4500 },
  ]);

  // Formal Acceptance Modal State
  const [aceiteNome, setAceiteNome] = useState('');
  const [aceiteData, setAceiteData] = useState(new Date().toISOString().split('T')[0]);
  const [autoGenerateSinal, setAutoGenerateSinal] = useState(true);

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
    const selectedV = vessels[0];
    if (selectedV) {
      setEmbarcacaoId(selectedV.id);
      setDestinatario(`A/C: ${selectedV.clienteNome}`);
      setAssunto(
        `Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação ${selectedV.nome}.`
      );
    }
    setIsEditorOpen(true);
  };

  const handleSaveProposal = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVessel = vessels.find((v) => v.id === embarcacaoId);
    const totalVal = calculateTotal(itens);

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
        valorTotal: totalVal,
        elaboradoPor,
      });
    }

    setIsEditorOpen(false);
  };

  const handleConfirmFormalAcceptance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal || !aceiteNome.trim()) return;

    onFormalAcceptance(selectedProposal.id, aceiteNome, aceiteData, autoGenerateSinal);

    setSelectedProposal({
      ...selectedProposal,
      status: 'aprovado',
      aceiteData: aceiteData,
      aceiteAssinaturaNome: aceiteNome,
    });

    setIsFormalAcceptanceModalOpen(false);
  };

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
                      onClick={() => setSelectedProposal(p)}
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
              signatureConfig={signatureConfig}
              logoConfig={logoConfig}
              onDownloadPdf={() => {
                generateProposalPdf(selectedProposal, logoConfig);
              }}
              onPrint={() => window.print()}
              onClose={() => setSelectedProposal(null)}
            />

            {/* Formal Acceptance Button Banner */}
            {selectedProposal.status !== 'aprovado' && currentUser.role !== 'tecnico' && (
              <div className="bg-emerald-900 text-white p-4 rounded-xl flex items-center justify-between mt-4 shadow-xl">
                <div>
                  <p className="font-bold text-sm">Registrar Aceite Formal do Cliente</p>
                  <p className="text-xs text-emerald-200">
                    O aceite formal do cliente transforma esta proposta em Ordem de Serviço com orçamentos e prazos ativados.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAceiteNome(selectedProposal.destinatario.replace(/^A\/C:\s*/, ''));
                    setIsFormalAcceptanceModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs transition cursor-pointer"
                >
                  Confirmar Aceite Formal
                </button>
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
                <label className="block font-bold text-slate-700 mb-1">Vincular à Embarcação *</label>
                <select
                  value={embarcacaoId}
                  onChange={(e) => {
                    setEmbarcacaoId(e.target.value);
                    const v = vessels.find((ves) => ves.id === e.target.value);
                    if (v) {
                      setDestinatario(`A/C: ${v.clienteNome}`);
                      setAssunto(
                        `Elaboração de relatório de medição de espessura de solda por ultrassom com croqui de sondagem e declaração de responsabilidade técnica para a embarcação ${v.nome}.`
                      );
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                >
                  {vessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome} ({v.clienteNome})
                    </option>
                  ))}
                </select>
              </div>

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

              {/* Scope Items Table Editor */}
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
                      <input
                        type="number"
                        value={item.valorUnitario}
                        onChange={(e) => handleItemChange(item.id, 'valorUnitario', Number(e.target.value))}
                        className="w-24 px-2 py-1 border rounded bg-white font-mono text-right"
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

                <div className="text-right font-bold text-sm text-blue-900 pt-2 font-mono">
                  Valor Total Calculado: R$ {calculateTotal(itens).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

      {/* Modal Confirm Formal Acceptance */}
      {isFormalAcceptanceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Registrar Aceite Formal</h3>
            <form onSubmit={handleConfirmFormalAcceptance} className="space-y-3 text-xs">
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
                <label className="block font-bold text-slate-700 mb-1">Data do Aceite Formal *</label>
                <input
                  type="date"
                  required
                  value={aceiteData}
                  onChange={(e) => setAceiteData(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <input
                  type="checkbox"
                  id="autoSinal"
                  checked={autoGenerateSinal}
                  onChange={(e) => setAutoGenerateSinal(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="autoSinal" className="text-xs font-bold text-emerald-900 cursor-pointer select-none">
                  Gerar automaticamente cobrança de "Sinal" (50% do valor total) no painel financeiro.
                </label>
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
                  Confirmar Aceite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
