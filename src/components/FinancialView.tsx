import React, { useState } from 'react';
import { Vessel, FinancialEntry, User } from '../types';
import {
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  Building2,
  Receipt,
  Download,
  Calendar,
} from 'lucide-react';

interface FinancialViewProps {
  vessels: Vessel[];
  financialEntries: FinancialEntry[];
  currentUser: User;
  onAddPayment: (paymentData: Partial<FinancialEntry>) => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  vessels,
  financialEntries,
  currentUser,
  onAddPayment,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form State
  const [selectedVesselId, setSelectedVesselId] = useState(vessels[0]?.id || '');
  const [payValor, setPayValor] = useState('5000');
  const [payTipo, setPayTipo] = useState<'sinal' | 'parcela' | 'quitacao'>('sinal');
  const [payForma, setPayForma] = useState<'PIX' | 'Transferência Bancária' | 'Boleto' | 'Cheque'>('PIX');
  const [payObs, setPayObs] = useState('');

  const totalServices = vessels.reduce((acc, v) => acc + v.valorTotal, 0);
  const totalReceived = vessels.reduce((acc, v) => acc + v.valorRecebido, 0);
  const totalToReceive = totalServices - totalReceived;
  const totalExpenses = financialEntries.filter(e => e.tipo === 'despesa').reduce((acc, e) => acc + e.valor, 0);
  const netProfit = totalReceived - totalExpenses;

  const filteredEntries = financialEntries.filter(
    (e) =>
      e.embarcacaoNome.toLowerCase().includes(search.toLowerCase()) ||
      e.observacao.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreatePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericVal = parseFloat(payValor);
    if (isNaN(numericVal) || numericVal <= 0) return;

    const vessel = vessels.find((v) => v.id === selectedVesselId);

    onAddPayment({
      embarcacaoId: selectedVesselId,
      embarcacaoNome: vessel ? vessel.nome : 'Embarcação',
      valor: numericVal,
      tipo: payTipo,
      formaPagamento: payForma,
      observacao: payObs || `${payTipo === 'sinal' ? 'Sinal' : payTipo === 'despesa' ? 'Despesa/Custo' : 'Pagamento'} ${vessel?.nome}`,
      lancadoPorNome: currentUser.nome,
    });

    setIsModalOpen(false);
    setPayObs('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Controle Financeiro & Recebimentos</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gestão de faturamento, recebimentos e lucros por embarcação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (financialEntries.length === 0) return;
              const headers = ["ID", "Data", "Embarcacao", "Tipo", "Forma de Pagamento", "Observacao", "Lancado Por", "Valor (R$)"];
              const csvContent = [
                headers.join(","),
                ...financialEntries.map(e => [
                  e.id,
                  e.data,
                  `"${e.embarcacaoNome.replace(/"/g, '""')}"`,
                  e.tipo,
                  e.formaPagamento,
                  `"${e.observacao.replace(/"/g, '""')}"`,
                  `"${e.lancadoPorNome}"`,
                  e.valor
                ].join(","))
              ].join("\n");
              const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `relatorio_financeiro_geral.csv`;
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

      {/* History of Entries */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b pb-3">Histórico de Lançamentos do Caixa</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 uppercase font-semibold border-b pb-2">
                <th className="pb-2">Data</th>
                <th className="pb-2">Embarcação</th>
                <th className="pb-2">Tipo</th>
                <th className="pb-2">Forma</th>
                <th className="pb-2">Observação</th>
                <th className="pb-2">Lançado por</th>
                <th className="pb-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredEntries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 pr-2 font-mono text-slate-500">{e.data}</td>
                  <td className="py-2.5 pr-2 font-bold text-slate-900">{e.embarcacaoNome}</td>
                  <td className="py-2.5 pr-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                      {e.tipo}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-slate-600 font-mono">{e.formaPagamento}</td>
                  <td className="py-2.5 pr-2 text-slate-600">{e.observacao}</td>
                  <td className="py-2.5 pr-2 text-slate-500">{e.lancadoPorNome}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-emerald-700 text-sm">
                    R$ {e.valor.toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançar Pagamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Lançar Recebimento</h3>
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
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg">
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
