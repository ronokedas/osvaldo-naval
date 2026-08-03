import React, { useState } from 'react';
import { Vessel, FinancialEntry, User, SignatureConfig, LogoConfig } from '../types';
import {
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  Building2,
  Receipt,
  Download,
  Calendar,
  FileCheck,
  Paperclip,
  Printer,
  FilePlus,
  FileText,
  Eye,
  CheckCircle2,
  X,
} from 'lucide-react';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface FinancialViewProps {
  vessels: Vessel[];
  financialEntries: FinancialEntry[];
  currentUser: User;
  signatureConfig?: SignatureConfig;
  logoConfig?: LogoConfig;
  onAddPayment: (paymentData: Partial<FinancialEntry>) => void;
  onUpdatePayment?: (entryId: string, updatedFields: Partial<FinancialEntry>) => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  vessels,
  financialEntries,
  currentUser,
  signatureConfig,
  logoConfig,
  onAddPayment,
  onUpdatePayment,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceiptEntry, setSelectedReceiptEntry] = useState<FinancialEntry | null>(null);
  const [attachNfModalEntry, setAttachNfModalEntry] = useState<FinancialEntry | null>(null);

  // Modal Form State (New Entry)
  const [selectedVesselId, setSelectedVesselId] = useState(vessels[0]?.id || '');
  const [payValor, setPayValor] = useState('5000');
  const [payTipo, setPayTipo] = useState<'sinal' | 'parcela' | 'quitacao' | 'despesa'>('sinal');
  const [payForma, setPayForma] = useState<'PIX' | 'Transferência Bancária' | 'Boleto' | 'Cheque' | 'Dinheiro'>('PIX');
  const [payObs, setPayObs] = useState('');
  const [payNfNumero, setPayNfNumero] = useState('');
  const [payNfFile, setPayNfFile] = useState<File | null>(null);

  // Attach NF Quick Modal Form State
  const [nfNumInput, setNfNumInput] = useState('');
  const [nfFileInput, setNfFileInput] = useState<File | null>(null);

  const totalServices = vessels.reduce((acc, v) => acc + v.valorTotal, 0);
  const totalReceived = vessels.reduce((acc, v) => acc + v.valorRecebido, 0);
  const totalToReceive = totalServices - totalReceived;
  const totalExpenses = financialEntries.filter((e) => e.tipo === 'despesa').reduce((acc, e) => acc + e.valor, 0);
  const netProfit = totalReceived - totalExpenses;

  const filteredEntries = financialEntries.filter(
    (e) =>
      e.embarcacaoNome.toLowerCase().includes(search.toLowerCase()) ||
      e.observacao.toLowerCase().includes(search.toLowerCase()) ||
      (e.notaFiscalNumero && e.notaFiscalNumero.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreatePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericVal = parseFloat(payValor);
    if (isNaN(numericVal) || numericVal <= 0) return;

    const vessel = vessels.find((v) => v.id === selectedVesselId);

    onAddPayment({
      embarcacaoId: selectedVesselId,
      embarcacaoNome: vessel ? vessel.nome : 'Embarcação',
      clienteNome: vessel ? vessel.clienteNome : '',
      valor: numericVal,
      tipo: payTipo,
      formaPagamento: payForma,
      observacao: payObs || `${payTipo === 'sinal' ? 'Sinal' : payTipo === 'despesa' ? 'Despesa/Custo' : 'Pagamento'} ${vessel?.nome}`,
      lancadoPorNome: currentUser.nome,
      notaFiscalNumero: payNfNumero || undefined,
      notaFiscalNome: payNfFile ? payNfFile.name : payNfNumero ? `NF_${payNfNumero}.pdf` : undefined,
      notaFiscalUrl: payNfFile || payNfNumero ? '#' : undefined,
    });

    setIsModalOpen(false);
    setPayObs('');
    setPayNfNumero('');
    setPayNfFile(null);
  };

  const handleSaveNfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachNfModalEntry || !onUpdatePayment) return;

    onUpdatePayment(attachNfModalEntry.id, {
      notaFiscalNumero: nfNumInput || undefined,
      notaFiscalNome: nfFileInput ? nfFileInput.name : attachNfModalEntry.notaFiscalNome || `NF_${nfNumInput}.pdf`,
      notaFiscalUrl: '#',
    });

    setAttachNfModalEntry(null);
    setNfNumInput('');
    setNfFileInput(null);
  };

  const openAttachNfModal = (entry: FinancialEntry) => {
    setAttachNfModalEntry(entry);
    setNfNumInput(entry.notaFiscalNumero || '');
    setNfFileInput(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Controle Financeiro & Recebimentos</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gestão de faturamento, recibos em PDF e notas fiscais (NF-e) por embarcação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (financialEntries.length === 0) return;
              const headers = [
                'ID',
                'Data',
                'Embarcacao',
                'Tipo',
                'Forma de Pagamento',
                'Nota Fiscal',
                'Observacao',
                'Lancado Por',
                'Valor (R$)',
              ];
              const csvContent = [
                headers.join(','),
                ...financialEntries.map((e) =>
                  [
                    e.id,
                    e.data,
                    `"${e.embarcacaoNome.replace(/"/g, '""')}"`,
                    e.tipo,
                    e.formaPagamento,
                    `"${(e.notaFiscalNumero || '').replace(/"/g, '""')}"`,
                    `"${e.observacao.replace(/"/g, '""')}"`,
                    `"${e.lancadoPorNome}"`,
                    e.valor,
                  ].join(',')
                ),
              ].join('\n');
              const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `relatorio_financeiro_nautilus.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            disabled={financialEntries.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition ${
              financialEntries.length > 0
                ? 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Lançar Entrada / Saída
          </button>
        </div>
      </div>

      {/* Financial Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Total Faturado</p>
          <p className="text-xl font-black font-mono text-slate-900">
            R$ {totalServices.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 border-l-4 border-l-emerald-500">
          <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Total Recebido</p>
          <p className="text-xl font-black font-mono text-emerald-700">
            R$ {totalReceived.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 border-l-4 border-l-red-500">
          <p className="text-[10px] uppercase tracking-wider font-bold text-red-700">Despesas / Custos</p>
          <p className="text-xl font-black font-mono text-red-700">
            R$ {totalExpenses.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 border-l-4 border-l-blue-500">
          <p className="text-[10px] uppercase tracking-wider font-bold text-blue-700">Lucro Líquido</p>
          <p className="text-xl font-black font-mono text-blue-700">
            R$ {netProfit.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Financial Breakdown Table per Vessel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b pb-3">Posição Financeira por Embarcação</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B192C] text-white uppercase font-bold tracking-wider">
                <th className="p-3">Embarcação</th>
                <th className="p-3">Cliente</th>
                <th className="p-3 text-right">Valor Total</th>
                <th className="p-3 text-right">Sinal Pago</th>
                <th className="p-3 text-right">Total Recebido</th>
                <th className="p-3 text-right">Saldo Devedor</th>
                <th className="p-3 text-center">Progresso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {vessels.map((v) => {
                const pending = v.valorTotal - v.valorRecebido;
                const pct = v.valorTotal > 0 ? Math.round((v.valorRecebido / v.valorTotal) * 100) : 0;

                return (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{v.nome}</td>
                    <td className="p-3 text-slate-600">{v.clienteNome}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      R$ {v.valorTotal.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-right font-mono text-blue-800">
                      R$ {v.valorSinal.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      R$ {v.valorRecebido.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-700">
                      R$ {pending.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono text-xs font-bold text-slate-700">{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* History of Entries & Receipts / Nota Fiscal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Histórico de Lançamentos, Recibos & Notas Fiscais
            </h3>
            <p className="text-xs text-slate-500">
              Emissão de recibos oficiais em PDF e controle de NF-e por parcela.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por embarcação, NF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border rounded-xl text-xs bg-slate-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 uppercase font-bold border-b text-[10px] tracking-wider">
                <th className="p-2.5">Data</th>
                <th className="p-2.5">Embarcação</th>
                <th className="p-2.5">Tipo</th>
                <th className="p-2.5">Forma</th>
                <th className="p-2.5">Nota Fiscal (NF-e)</th>
                <th className="p-2.5">Observação</th>
                <th className="p-2.5 text-right">Valor</th>
                <th className="p-2.5 text-center">Ações / Documentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredEntries.map((e) => {
                const vessel = vessels.find((v) => v.id === e.embarcacaoId);

                return (
                  <tr key={e.id} className="hover:bg-slate-50 transition">
                    <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">{e.data}</td>
                    <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">
                      {e.embarcacaoNome}
                      {vessel?.clienteNome && (
                        <span className="block text-[10px] font-normal text-slate-500">
                          {vessel.clienteNome}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                        {e.tipo}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 font-mono whitespace-nowrap">
                      {e.formaPagamento}
                    </td>

                    {/* Nota Fiscal Column */}
                    <td className="p-2.5 whitespace-nowrap">
                      {e.notaFiscalNumero ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold font-mono">
                            <FileText className="w-3 h-3 text-emerald-600" />
                            {e.notaFiscalNumero}
                          </span>
                          <button
                            onClick={() => openAttachNfModal(e)}
                            className="text-[10px] text-slate-400 hover:text-slate-700 underline"
                            title="Editar Nota Fiscal"
                          >
                            Editar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openAttachNfModal(e)}
                          className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer"
                        >
                          <FilePlus className="w-3 h-3 text-amber-600" />
                          Anexar NF
                        </button>
                      )}
                    </td>

                    <td className="p-2.5 text-slate-600 max-w-xs truncate">{e.observacao}</td>

                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700 text-sm whitespace-nowrap">
                      R$ {e.valor.toLocaleString('pt-BR')}
                    </td>

                    {/* Actions Column */}
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedReceiptEntry(e)}
                        className="inline-flex items-center gap-1 bg-slate-900 hover:bg-blue-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition shadow-2xs cursor-pointer"
                        title="Gerar e imprimir recibo oficial em PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        Recibo PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Lançar Novo Pagamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Lançar Recebimento / Custo</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePaymentSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Embarcação *</label>
                <select
                  value={selectedVesselId}
                  onChange={(e) => setSelectedVesselId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                >
                  {vessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome} ({v.clienteNome})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  required
                  value={payValor}
                  onChange={(e) => setPayValor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Lançamento</label>
                  <select
                    value={payTipo}
                    onChange={(e) => setPayTipo(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  >
                    <option value="sinal">Sinal de Entrada</option>
                    <option value="parcela">Parcela Intermediária</option>
                    <option value="quitacao">Quitação Final</option>
                    <option value="despesa">Despesa / Custo (ART, Viagem, etc)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Forma</label>
                  <select
                    value={payForma}
                    onChange={(e) => setPayForma(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  >
                    <option value="PIX">PIX / Transferência</option>
                    <option value="Dinheiro">Dinheiro Físico</option>
                    <option value="Boleto">Boleto Bancário</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Nota Fiscal Inputs */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Dados da Nota Fiscal (NF-e) - Opcional
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Número da NF-e
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: NF-0542"
                      value={payNfNumero}
                      onChange={(e) => setPayNfNumero(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Anexo da NF (PDF)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg"
                      onChange={(e) => setPayNfFile(e.target.files?.[0] || null)}
                      className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observação / Comprovante</label>
                <input
                  type="text"
                  placeholder="Ex: Sinal referente à ART e custos operacionais"
                  value={payObs}
                  onChange={(e) => setPayObs(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 border rounded-lg"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg cursor-pointer">
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Anexar Nota Fiscal em Lançamento Existente */}
      {attachNfModalEntry && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Anexar Nota Fiscal (NF-e)</h3>
              </div>
              <button
                onClick={() => setAttachNfModalEntry(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">{attachNfModalEntry.embarcacaoNome}</p>
              <p className="text-[11px] text-slate-500">
                Valor: R$ {attachNfModalEntry.valor.toLocaleString('pt-BR')} ({attachNfModalEntry.tipo.toUpperCase()})
              </p>
            </div>

            <form onSubmit={handleSaveNfSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Número da NF-e *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: NF-0542"
                  value={nfNumInput}
                  onChange={(e) => setNfNumInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Arquivo da NF (PDF ou Imagem)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg"
                  onChange={(e) => setNfFileInput(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {attachNfModalEntry.notaFiscalNome ? `Atual: ${attachNfModalEntry.notaFiscalNome}` : 'Envie o arquivo digitalizado da nota.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAttachNfModalEntry(null)}
                  className="px-3 py-2 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg cursor-pointer hover:bg-emerald-700"
                >
                  Salvar Nota Fiscal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Recibo Oficial PDF Modal */}
      {selectedReceiptEntry && (
        <PaymentReceiptModal
          entry={selectedReceiptEntry}
          vessel={vessels.find((v) => v.id === selectedReceiptEntry.embarcacaoId)}
          signatureConfig={signatureConfig}
          logoConfig={logoConfig}
          onClose={() => setSelectedReceiptEntry(null)}
        />
      )}
    </div>
  );
};

