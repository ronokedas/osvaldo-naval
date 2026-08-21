import React, { useEffect, useState } from 'react';
import { formatDateBR } from '../utils/date-formatters';
import { Vessel, FinancialEntry, User, Client, SignatureConfig, LogoConfig } from '../types';
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
import { CurrencyInput } from './CurrencyInput';

interface FinancialViewProps {
  vessels: Vessel[];
  financialEntries: FinancialEntry[];
  clients?: Client[];
  currentUser: User;
  signatureConfig?: SignatureConfig;
  logoConfig?: LogoConfig;
  onAddPayment: (paymentData: Partial<FinancialEntry>) => void;
  onUpdatePayment?: (entryId: string, updatedFields: Partial<FinancialEntry>) => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  vessels,
  financialEntries,
  clients = [],
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
  const [financeTab, setFinanceTab] = useState<'resumo' | 'pagar'>('resumo');
  const [payables, setPayables] = useState<any[]>([]);
  const [payableForm, setPayableForm] = useState({ descricao: '', valorOriginal: 0, vencimento: '', competencia: '' });

  const loadPayables = async () => {
    const response = await fetch('/api/payables');
    if (response.ok) setPayables(await response.json());
  };
  useEffect(() => { if (financeTab === 'pagar') loadPayables(); }, [financeTab]);

  // Modal Form State (New Entry)
  const [selectedVesselId, setSelectedVesselId] = useState(vessels[0]?.id || '');
  const [payValor, setPayValor] = useState(5000);
  const [payTipo, setPayTipo] = useState<'sinal' | 'parcela' | 'quitacao' | 'despesa'>('sinal');
  const [payForma, setPayForma] = useState<'PIX' | 'Transferência Bancária' | 'Boleto' | 'Cheque' | 'Dinheiro'>('PIX');
  const [payObs, setPayObs] = useState('');
  const [payNfNumero, setPayNfNumero] = useState('');
  const [payNfFile, setPayNfFile] = useState<File | null>(null);
  const [payFornecedorNome, setPayFornecedorNome] = useState('');
  const [payCategoriaNome, setPayCategoriaNome] = useState('Administrativo');

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

  const handleCreatePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payValor <= 0) return;

    const vessel = vessels.find((v) => v.id === selectedVesselId);
    let uploadedNfUrl: string | undefined;
    if (payNfFile) {
      const form = new FormData();
      form.append('file', payNfFile);
      const upload = await fetch('/api/upload', { method: 'POST', body: form });
      if (!upload.ok) return;
      uploadedNfUrl = (await upload.json()).url;
    }

    onAddPayment({
      embarcacaoId: payTipo === 'despesa' ? undefined : selectedVesselId || undefined,
      embarcacaoNome: vessel ? vessel.nome : 'Despesa da empresa',
      clienteNome: vessel ? vessel.clienteNome : '',
      valor: payValor,
      tipo: payTipo,
      formaPagamento: payForma,
      observacao: payObs || `${payTipo === 'sinal' ? 'Sinal' : payTipo === 'despesa' ? 'Despesa/Custo' : 'Pagamento'} ${vessel?.nome}`,
      lancadoPorNome: currentUser.nome,
      notaFiscalNumero: payNfNumero || undefined,
      notaFiscalNome: payNfFile ? payNfFile.name : payNfNumero ? `NF_${payNfNumero}.pdf` : undefined,
      notaFiscalUrl: uploadedNfUrl || (payNfNumero ? undefined : undefined),
      natureza: payTipo === 'despesa' ? 'saida' : 'entrada',
      fornecedorNome: payTipo === 'despesa' ? payFornecedorNome || undefined : undefined,
      categoriaNome: payTipo === 'despesa' ? payCategoriaNome : undefined,
    });

    setIsModalOpen(false);
    setPayObs('');
    setPayNfNumero('');
    setPayNfFile(null);
    setPayFornecedorNome('');
  };

  const handleSaveNfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachNfModalEntry || !onUpdatePayment) return;

    let uploadedUrl = attachNfModalEntry.notaFiscalUrl;
    if (nfFileInput) {
      const form = new FormData();
      form.append('file', nfFileInput);
      const upload = await fetch('/api/upload', { method: 'POST', body: form });
      if (!upload.ok) return;
      uploadedUrl = (await upload.json()).url;
    }
    onUpdatePayment(attachNfModalEntry.id, {
      notaFiscalNumero: nfNumInput || undefined,
      notaFiscalNome: nfFileInput ? nfFileInput.name : attachNfModalEntry.notaFiscalNome || `NF_${nfNumInput}.pdf`,
      notaFiscalUrl: uploadedUrl,
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
            onClick={async () => {
              try {
                const { generateFinancialReportPdf } = await import('../utils/pdfGenerator');
                const blob = await generateFinancialReportPdf(filteredEntries, logoConfig);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `relatorio_financeiro.pdf`;
                link.click();
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error("Erro ao gerar PDF financeiro", err);
                alert("Não foi possível gerar o PDF.");
              }
            }}
            disabled={filteredEntries.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition ${
              filteredEntries.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
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

      <div className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200 w-fit">
        <button onClick={() => setFinanceTab('resumo')} className={`px-4 py-2 rounded-lg text-xs font-bold ${financeTab === 'resumo' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Resumo e lançamentos</button>
        <button onClick={() => setFinanceTab('pagar')} className={`px-4 py-2 rounded-lg text-xs font-bold ${financeTab === 'pagar' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Contas a pagar</button>
      </div>

      {/* Pagar Tab - Contas a Pagar Organizado */}
      {financeTab === 'pagar' && (
        <div className="space-y-6">
          {/* Summary Cards Contas a Pagar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 border-l-4 border-l-amber-500">
              <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700">Saldo a Pagar (Aberto)</p>
              <p className="text-xl font-black font-mono text-amber-700">
                R${' '}
                {payables
                  .filter((a) => a.status !== 'cancelado')
                  .reduce((acc, a) => acc + (a.saldo ?? a.valorOriginal ?? 0), 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 border-l-4 border-l-red-500">
              <p className="text-[10px] uppercase tracking-wider font-bold text-red-700">Contas Atrasadas</p>
              <p className="text-xl font-black font-mono text-red-700">
                {
                  payables.filter((a) => {
                    const today = new Date().toISOString().slice(0, 10);
                    return a.vencimento && a.vencimento < today && (a.saldo ?? a.valorOriginal) > 0 && a.status !== 'cancelado';
                  }).length
                }{' '}
                <span className="text-xs font-normal text-slate-500">conta(s)</span>
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 border-l-4 border-l-emerald-500">
              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Total Pago / Baixado</p>
              <p className="text-xl font-black font-mono text-emerald-700">
                R${' '}
                {payables
                  .reduce((acc, a) => acc + (a.valorPago ?? 0), 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 border-l-4 border-l-blue-500">
              <p className="text-[10px] uppercase tracking-wider font-bold text-blue-700">Total de Contas</p>
              <p className="text-xl font-black font-mono text-slate-900">
                {payables.length} <span className="text-xs font-normal text-slate-500">registradas</span>
              </p>
            </div>
          </div>

          {/* Form Cadastro de Nova Conta a Pagar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <FilePlus className="w-5 h-5 text-emerald-600" />
                  Cadastrar Nova Conta a Pagar
                </h3>
                <p className="text-xs text-slate-500">
                  Registre compromissos financeiros, despesas fixas, impostos ou compras de fornecedores.
                </p>
              </div>
            </div>

            <form
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const response = await fetch('/api/payables', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payableForm),
                });
                if (response.ok) {
                  setPayableForm({ descricao: '', valorOriginal: 0, vencimento: '', competencia: '' });
                  loadPayables();
                } else {
                  alert('Preencha os campos obrigatórios.');
                }
              }}
            >
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Descrição / Favorecido *</label>
                <input
                  required
                  placeholder="Ex: Aluguel do galpão, ART Marinha, Peças..."
                  value={payableForm.descricao}
                  onChange={(e) => setPayableForm({ ...payableForm, descricao: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Valor Original (R$) *</label>
                <CurrencyInput
                  value={payableForm.valorOriginal}
                  onValueChange={(value) => setPayableForm({ ...payableForm, valorOriginal: value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Vencimento *</label>
                <input
                  type="date"
                  required
                  value={payableForm.vencimento}
                  onChange={(e) => setPayableForm({ ...payableForm, vencimento: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Cadastrar Conta
                </button>
              </div>
            </form>
          </div>

          {/* Tabela de Contas a Pagar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Relação de Contas a Pagar</h3>
                <p className="text-xs text-slate-500">Controle de liquidação, saldos devedores e baixas financeiras</p>
              </div>
            </div>

            {payables.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-bold text-slate-600 text-xs">Nenhuma conta a pagar cadastrada</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Use o formulário acima para registrar uma despesa ou fornecedor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0B192C] text-white uppercase font-bold tracking-wider text-[10px]">
                      <th className="p-3">Descrição / Título</th>
                      <th className="p-3">Vencimento</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Valor Original</th>
                      <th className="p-3 text-right">Valor Pago</th>
                      <th className="p-3 text-right">Saldo Devedor</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payables.map((account) => {
                      const today = new Date().toISOString().slice(0, 10);
                      const isOverdue =
                        account.vencimento &&
                        account.vencimento < today &&
                        (account.saldo ?? account.valorOriginal) > 0 &&
                        account.status !== 'cancelado';

                      const statusLabel =
                        account.status === 'pago'
                          ? 'Pago'
                          : account.status === 'parcial'
                          ? 'Parcial'
                          : isOverdue
                          ? 'Atrasado'
                          : account.status === 'cancelado'
                          ? 'Cancelado'
                          : 'Pendente';

                      const statusBadgeClass =
                        account.status === 'pago'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : account.status === 'parcial'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : isOverdue
                          ? 'bg-red-50 text-red-800 border-red-300 animate-pulse'
                          : account.status === 'cancelado'
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-amber-50 text-amber-800 border-amber-300';

                      const saldoAtual = Number(account.saldo ?? account.valorOriginal ?? 0);

                      return (
                        <tr key={account.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-900">
                            {account.descricao}
                            {account.competencia && (
                              <span className="block text-[10px] text-slate-400 font-normal">
                                Comp: {account.competencia}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                            {account.vencimento ? formatDateBR(account.vencimento) : 'Não informado'}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadgeClass}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                            R$ {Number(account.valorOriginal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            R$ {Number(account.valorPago ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-amber-700 whitespace-nowrap">
                            R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {account.status !== 'pago' && account.status !== 'cancelado' ? (
                              <button
                                onClick={async () => {
                                  const raw = window.prompt(`Valor da baixa para "${account.descricao}":`, String(saldoAtual));
                                  if (!raw) return;
                                  const valor = Number(raw.replace(',', '.'));
                                  if (isNaN(valor) || valor <= 0) return alert('Valor inválido');
                                  const response = await fetch(`/api/payables/${account.id}/payments`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ valor }),
                                  });
                                  if (response.ok) loadPayables();
                                  else alert('Erro ao registrar baixa.');
                                }}
                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer active:scale-95"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Dar Baixa
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400">Liquidado</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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
                    <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">{formatDateBR(e.data)}</td>
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
              {payTipo !== 'despesa' && <div>
                <label className="block font-bold text-slate-700 mb-1">Embarcação *</label>
                <select required value={selectedVesselId} onChange={(e) => setSelectedVesselId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs">
                  <option value="">Selecione a embarcação</option>
                  {vessels.map((v) => <option key={v.id} value={v.id}>{v.nome} ({v.clienteNome})</option>)}
                </select>
              </div>}

              {payTipo === 'despesa' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fornecedor</label>
                    <input value={payFornecedorNome} onChange={(e) => setPayFornecedorNome(e.target.value)} placeholder="Empresa ou pessoa" className="w-full px-3 py-2 border rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                    <select value={payCategoriaNome} onChange={(e) => setPayCategoriaNome(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs">
                      {['Administrativo', 'Pessoal', 'Taxas e impostos', 'Certificadora', 'Viagem e deslocamento', 'Materiais', 'Outros'].map((category) => <option key={category}>{category}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor (R$) *</label>
                <CurrencyInput
                  required
                  value={payValor}
                  onValueChange={setPayValor}
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
          client={clients.find((client) => client.id === vessels.find((v) => v.id === selectedReceiptEntry.embarcacaoId)?.clienteId)}
          signatureConfig={signatureConfig}
          logoConfig={logoConfig}
          onClose={() => setSelectedReceiptEntry(null)}
        />
      )}
    </div>
  );
};

