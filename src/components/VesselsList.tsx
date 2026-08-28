import React, { useState } from 'react';
import { Vessel, Client, Certificadora } from '../types';
import { Ship, Search, Plus, Filter, ArrowRight, DollarSign, Award, CheckCircle2 } from 'lucide-react';
import { PaginationControls } from './PaginationControls';

interface VesselsListProps {
  vessels: Vessel[];
  clients: Client[];
  onSelectVessel: (vessel: Vessel) => void;
  onCreateVessel: (vesselData: Partial<Vessel>, generateTasks?: boolean) => void;
  canCreate: boolean;
  initialStatusFilter?: 'todos' | 'aberta' | 'concluida';
}

export const VesselsList: React.FC<VesselsListProps> = ({
  vessels,
  clients,
  onSelectVessel,
  onCreateVessel,
  canCreate,
  initialStatusFilter,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aberta' | 'concluida'>(initialStatusFilter || 'aberta');
  const [certifierFilter, setCertifierFilter] = useState<string>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableClients, setAvailableClients] = useState<Client[]>(clients);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sync with prop
  React.useEffect(() => {
    setAvailableClients(clients);
  }, [clients]);

  React.useEffect(() => {
    if (initialStatusFilter) setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  // New Vessel Form State
  const [newNome, setNewNome] = useState('');
  const [newClienteId, setNewClienteId] = useState('');
  const [newClienteNome, setNewClienteNome] = useState('');
  const [newTipo, setNewTipo] = useState('Empurrador Fluvial');
  const [customTipo, setCustomTipo] = useState('');
  const [newRegistro, setNewRegistro] = useState('');
  const [newCertificadora, setNewCertificadora] = useState<Certificadora>('Amazon Naval');
  const [newDescricao, setNewDescricao] = useState('');

  const fetchLatestClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setAvailableClients(data);
        return data;
      }
    } catch {
      // ignore
    }
    return availableClients;
  };

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    const latest = await fetchLatestClients();
    if (latest && latest.length > 0 && !newClienteId) {
      setNewClienteId(latest[0].id);
      setNewClienteNome(latest[0].nome);
    }
  };

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
  const pagedVessels = filteredVessels.slice((page - 1) * pageSize, page * pageSize);
  React.useEffect(() => setPage(1), [search, statusFilter, certifierFilter]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    const finalTipo = newTipo === 'Outro' ? customTipo || 'Outro' : newTipo;
    const client = availableClients.find((c) => c.id === newClienteId);

    onCreateVessel(
      {
        nome: newNome,
        clienteId: newClienteId || undefined,
        clienteNome: client?.nome || newClienteNome || 'Cliente não informado',
        tipo: finalTipo,
        registro: newRegistro || 'PA-00000-X',
        certificadoraPrincipal: newCertificadora,
        descricao: newDescricao,
        status: 'aberta',
      },
      false
    );

    setIsModalOpen(false);
    setNewNome('');
    setNewRegistro('');
    setNewDescricao('');
    setCustomTipo('');
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
        {pagedVessels.map((v) => {
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
                <p className="text-xs text-slate-500 font-medium">{v.clienteNome}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{v.tipo || 'Sem tipo informado'}</p>
              </div>

              {/* Financial & Tasks Summary */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Certificadora:</span>
                  <span className="font-semibold text-slate-800">{v.certificadoraPrincipal}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Valor Contratado:</span>
                  <span className="font-mono font-bold text-slate-900">R$ {v.valorTotal.toLocaleString('pt-BR')}</span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>Recebido ({percentReceived}%)</span>
                    <span className="font-mono text-emerald-700">R$ {v.valorRecebido.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentReceived}%` }}
                    />
                  </div>
                </div>

                {remainingBalance > 0 && (
                  <div className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 font-medium">
                    Saldo pendente: R$ {remainingBalance.toLocaleString('pt-BR')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <PaginationControls page={page} pageSize={pageSize} total={filteredVessels.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
      </div>

      {filteredVessels.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
          <Ship className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-bold text-slate-700">Nenhuma embarcação encontrada</p>
          <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de busca para visualizar embarcações.</p>
        </div>
      )}

      {/* Modal Novo Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Nova Embarcação</h3>
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
                  <label className="block font-bold text-slate-700 mb-1">Cliente / Armador (Dono) *</label>
                  <select
                    required
                    value={newClienteId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      setNewClienteId(selId);
                      const selectedClient = availableClients.find((c) => c.id === selId);
                      if (selectedClient) {
                        setNewClienteNome(selectedClient.nome);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900 bg-white"
                  >
                    <option value="">-- Selecione o Cliente --</option>
                    {availableClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Embarcação *</label>
                  <select
                    required
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value)}
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
                    <option value="Outro">Outro tipo...</option>
                  </select>
                  {newTipo === 'Outro' && (
                    <input
                      type="text"
                      required
                      placeholder="Especifique o tipo..."
                      value={customTipo}
                      onChange={(e) => setCustomTipo(e.target.value)}
                      className="w-full mt-2 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  )}
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
                <label className="block font-bold text-slate-700 mb-1">Observações do Escopo Inicial</label>
                <textarea
                  rows={2}
                  placeholder="Observações da vistoria inicial ou laudos necessários..."
                  value={newDescricao}
                  onChange={(e) => setNewDescricao(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
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
