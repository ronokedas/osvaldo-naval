import React, { useState } from 'react';
import { Vessel, Client, Certificadora } from '../types';
import { Ship, Search, Plus, Filter, ArrowRight, DollarSign, Award, CheckCircle2 } from 'lucide-react';

interface VesselsListProps {
  vessels: Vessel[];
  clients: Client[];
  onSelectVessel: (vessel: Vessel) => void;
  onCreateVessel: (vesselData: Partial<Vessel>, generateTasks: boolean) => void;
  canCreate: boolean;
}

export const VesselsList: React.FC<VesselsListProps> = ({
  vessels,
  clients,
  onSelectVessel,
  onCreateVessel,
  canCreate,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aberta' | 'concluida'>('aberta');
  const [certifierFilter, setCertifierFilter] = useState<string>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Vessel Form State
  const [newNome, setNewNome] = useState('');
  const [newClienteNome, setNewClienteNome] = useState(clients[0]?.nome || '');
  const [newTipo, setNewTipo] = useState('Empurrador Fluvial');
  const [newRegistro, setNewRegistro] = useState('');
  const [newCertificadora, setNewCertificadora] = useState<Certificadora>('Amazon Naval');
  const [newValorTotal, setNewValorTotal] = useState('18500');
  const [newValorSinal, setNewValorSinal] = useState('5000');
  const [newDescricao, setNewDescricao] = useState('');
  const [generateStandardTasks, setGenerateStandardTasks] = useState(true);

  const filteredVessels = vessels.filter((v) => {
    const matchesSearch =
      v.nome.toLowerCase().includes(search.toLowerCase()) ||
      v.clienteNome.toLowerCase().includes(search.toLowerCase()) ||
      v.registro.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || v.status === statusFilter;
    const matchesCertifier =
      certifierFilter === 'todas' || v.certificadoraPrincipal === certifierFilter;
    return matchesSearch && matchesStatus && matchesCertifier;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    onCreateVessel({
      nome: newNome,
      clienteNome: newClienteNome,
      tipo: newTipo,
      registro: newRegistro || 'PA-00000-X',
      certificadoraPrincipal: newCertificadora,
      valorTotal: parseFloat(newValorTotal) || 0,
      valorSinal: parseFloat(newValorSinal) || 0,
      valorRecebido: parseFloat(newValorSinal) || 0,
      descricao: newDescricao,
      status: 'aberta',
    }, generateStandardTasks);

    setIsModalOpen(false);
    setNewNome('');
    setNewRegistro('');
    setNewDescricao('');
    setGenerateStandardTasks(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Embarcações Inspecionadas</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gestão de laudos de ultrassom, projetos e acompanhamento financeiro por embarcação.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Embarcação
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome da embarcação, cliente ou registro de marinha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Filter Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-600">
            <button
              onClick={() => setStatusFilter('aberta')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'aberta' ? 'bg-white text-blue-900 shadow-sm font-black' : ''
              }`}
            >
              Abertas ({vessels.filter((v) => v.status === 'aberta').length})
            </button>
            <button
              onClick={() => setStatusFilter('concluida')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'concluida' ? 'bg-white text-blue-900 shadow-sm font-black' : ''
              }`}
            >
              Concluídas ({vessels.filter((v) => v.status === 'concluida').length})
            </button>
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'todos' ? 'bg-white text-blue-900 shadow-sm font-black' : ''
              }`}
            >
              Todas
            </button>
          </div>

          {/* Certifier Select Filter */}
          <select
            value={certifierFilter}
            onChange={(e) => setCertifierFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="todas">Todas Certificadoras</option>
            <option value="Amazon Naval">Amazon Naval</option>
            <option value="Auto Ship">Auto Ship</option>
            <option value="ABS">ABS</option>
            <option value="DNV">DNV</option>
            <option value="RBNA">RBNA</option>
          </select>
        </div>
      </div>

      {/* Vessel Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVessels.map((v) => {
          const percentReceived = v.valorTotal > 0 ? Math.round((v.valorRecebido / v.valorTotal) * 100) : 0;
          const remainingBalance = v.valorTotal - v.valorRecebido;

          return (
            <div
              key={v.id}
              onClick={() => onSelectVessel(v)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition p-5 space-y-4 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Top status & certifier */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      v.status === 'aberta'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {v.status === 'aberta' ? 'Em andamento' : 'Concluída'}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {v.registro}
                  </span>
                </div>

                {/* Vessel Name & Client */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
                  <span>{v.nome}</span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition" />
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{v.clienteNome}</p>
                <p className="text-xs text-slate-600 font-semibold mt-1 bg-slate-50 px-2 py-1 rounded inline-block">
                  {v.tipo}
                </p>
              </div>

              {/* Certifying Body */}
              <div className="flex items-center gap-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Certificadora: <strong className="text-slate-800">{v.certificadoraPrincipal}</strong></span>
              </div>

              {/* Financial Bar */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">Valor Total:</span>
                  <span className="font-mono font-bold text-slate-900">
                    R$ {v.valorTotal.toLocaleString('pt-BR')}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      percentReceived >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${percentReceived}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-semibold">
                    Recebido: R$ {v.valorRecebido.toLocaleString('pt-BR')} ({percentReceived}%)
                  </span>
                  <span className="text-slate-500 font-mono">
                    Falta: R$ {remainingBalance.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredVessels.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-base text-slate-700">Nenhuma embarcação encontrada</p>
          <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de busca ou cadastre uma nova embarcação.</p>
        </div>
      )}

      {/* Modal Cadastrar Nova Embarcação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Cadastrar Nova Embarcação</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Embarcação *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: OPUS, Balsa Rio Negro"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cliente / Armador *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rogelio / Armador OPUS"
                    value={newClienteNome}
                    onChange={(e) => setNewClienteNome(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Embarcação</label>
                  <input
                    type="text"
                    placeholder="Ex: Empurrador, Balsa, Rebocador"
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inscrição / Registro Marinha</label>
                  <input
                    type="text"
                    placeholder="Ex: PA-30492-B"
                    value={newRegistro}
                    onChange={(e) => setNewRegistro(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Certificadora Principal</label>
                  <select
                    value={newCertificadora}
                    onChange={(e) => setNewCertificadora(e.target.value as Certificadora)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Total Estimado (R$)</label>
                  <input
                    type="number"
                    value={newValorTotal}
                    onChange={(e) => setNewValorTotal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sinal de Entrada (R$)</label>
                  <input
                    type="number"
                    value={newValorSinal}
                    onChange={(e) => setNewValorSinal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações do Escopo Inicial</label>
                <textarea
                  rows={2}
                  placeholder="Observações da vistoria inicial ou laudos necessários..."
                  value={newDescricao}
                  onChange={(e) => setNewDescricao(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                <input
                  type="checkbox"
                  id="generateTasks"
                  checked={generateStandardTasks}
                  onChange={(e) => setGenerateStandardTasks(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="generateTasks" className="text-xs font-bold text-blue-900 cursor-pointer select-none">
                  Gerar pacote padrão de tarefas automaticamente (Ultrassom, ART, Desenho, Homologação)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Salvar Embarcação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
