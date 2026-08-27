import React, { useEffect, useState } from 'react';
import { Proposal } from '../types';
import { RotateCw, CalendarClock, AlertCircle, CheckCircle, Search, FileText, Edit2, Check, X } from 'lucide-react';
import { Vessel, Client } from '../types';

interface RenewalProposal extends Proposal {
  renovacaoDisponivel?: boolean;
}

export function RenewalsView({ 
  vessels, 
  clients, 
  canManage,
  onNavigate 
}: { 
  vessels: Vessel[], 
  clients: Client[], 
  canManage: boolean,
  onNavigate: (tab: string, item?: any) => void 
}) {
  const [dueProposals, setDueProposals] = useState<RenewalProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState('');

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

  const handleSaveDate = async (propId: string) => {
    if (!tempDate) return;
    try {
      const response = await fetch(`/api/proposals/renewals/${propId}/base-date`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceiteData: tempDate }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Não foi possível atualizar a data.');
      }
      setDueProposals(prev => prev.map(p => p.id === propId ? { ...p, aceiteData: tempDate } : p));
      setEditingDateId(null);
      setSuccessMsg('Data de aceite atualizada com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      setErrorMsg('Erro ao atualizar data.');
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
                {filtered.map((prop) => {
                  const vessel = vessels.find(v => v.id === prop.embarcacaoId);
                  const client = clients.find(c => c.id === vessel?.clienteId);
                  const telefone = client?.whatsapp || client?.telefone;
                  
                  return (
                  <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {prop.numero}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {canManage && editingDateId === prop.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
                            className="bg-white border border-slate-300 rounded p-1 text-xs text-slate-800"
                          />
                          <button onClick={() => handleSaveDate(prop.id)} className="text-emerald-600 hover:text-emerald-700">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingDateId(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                            {prop.aceiteData 
                              ? new Date(prop.aceiteData + 'T00:00:00').toLocaleDateString('pt-BR') 
                              : 'Não registrada'}
                          </span>
                          {canManage && <button
                            onClick={() => {
                              setEditingDateId(prop.id);
                              setTempDate(prop.aceiteData || '');
                            }}
                            className="text-slate-400 hover:text-blue-500"
                            title="Editar data base de vencimento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {prop.clienteNome || 'Cliente não informado'}
                        {telefone && (
                          <a
                            href={`https://wa.me/55${telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200 transition"
                            title="Contato via WhatsApp"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                            </svg>
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{prop.embarcacaoNome || 'Embarcação não informada'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(prop.valorTotal) || 0)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {canManage ? <button
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
                      </button> : <span className="text-xs text-slate-400">Somente consulta</span>}
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
  );
}
