import React, { useEffect, useState } from 'react';
import { Proposal } from '../types';
import { RotateCw, CalendarClock, AlertCircle, CheckCircle, Search, FileText } from 'lucide-react';

interface RenewalProposal extends Proposal {
  renovacaoDisponivel?: boolean;
}

export function RenewalsView({ onNavigate }: { onNavigate: (tab: string, item?: any) => void }) {
  const [dueProposals, setDueProposals] = useState<RenewalProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDueRenewals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/proposals/renewals/due');
      if (res.ok) {
        setDueProposals(await res.json());
      } else {
        setErrorMsg('Erro ao buscar propostas vencidas.');
      }
    } catch (error) {
      setErrorMsg('Erro de conexão ao buscar renovações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueRenewals();
  }, []);

  const handleGenerateRenewal = async (proposal: RenewalProposal) => {
    setErrorMsg('');
    setSuccessMsg('');
    setGeneratingId(proposal.id);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/renewal`, {
        method: 'POST',
      });
      if (res.ok) {
        const newProposal = await res.json();
        setSuccessMsg(`Proposta de renovação gerada com sucesso: ${newProposal.numero}`);
        // Remove from list
        setDueProposals(prev => prev.filter(p => p.id !== proposal.id));
        // Optional: navigate to proposal
        // onNavigate('proposals', newProposal);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Erro ao gerar renovação.');
      }
    } catch (e) {
      setErrorMsg('Erro de conexão ao gerar renovação.');
    } finally {
      setGeneratingId(null);
    }
  };

  const filtered = dueProposals.filter(p => 
    p.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.embarcacaoNome && p.embarcacaoNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.clienteNome && p.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-blue-600" />
          Acompanhamento de Renovações
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Propostas aprovadas há mais de 1 ano elegíveis para renovação anual.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {errorMsg}
        </div>
      )}
      
      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por número, cliente ou embarcação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            {filtered.length} {filtered.length === 1 ? 'proposta vencida' : 'propostas vencidas'}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm font-medium">Carregando renovações pendentes...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tudo em dia!</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              {searchTerm 
                ? 'Nenhuma proposta encontrada com estes termos.' 
                : 'Não há nenhuma proposta aprovada há mais de um ano pendente de renovação no momento.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Proposta Original</th>
                  <th className="px-4 py-3 whitespace-nowrap">Data de Aceite</th>
                  <th className="px-4 py-3">Cliente / Embarcação</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">Valor Original</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {prop.numero}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {prop.aceiteData 
                        ? new Date(prop.aceiteData + 'T00:00:00').toLocaleDateString('pt-BR') 
                        : 'Não registrada'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{prop.clienteNome || 'Cliente não informado'}</div>
                      <div className="text-xs text-slate-500">{prop.embarcacaoNome || 'Embarcação não informada'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(prop.valorTotal) || 0)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleGenerateRenewal(prop)}
                        disabled={generatingId === prop.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingId === prop.id ? (
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCw className="w-3.5 h-3.5" />
                        )}
                        {generatingId === prop.id ? 'Gerando...' : 'Gerar Renovação'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
