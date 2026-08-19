import React, { useState } from 'react';
import { Protocol, Vessel, User, SignatureConfig, LogoConfig } from '../types';
import { formatDateBR } from '../utils/date-formatters';
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  Printer,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Send,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  Trash2,
  Tag,
  Shield,
  Layers,
} from 'lucide-react';
import { ProtocolSlipModal } from './ProtocolSlipModal';

interface ProtocolsViewProps {
  protocols: Protocol[];
  vessels: Vessel[];
  currentUser: User;
  signatureConfig?: SignatureConfig;
  logoConfig?: LogoConfig;
  onCreateProtocol: (protocolData: Partial<Protocol>) => void;
  onUpdateProtocol: (id: string, updatedFields: Partial<Protocol>) => void;
}

export const ProtocolsView: React.FC<ProtocolsViewProps> = ({
  protocols,
  vessels,
  currentUser,
  signatureConfig,
  logoConfig,
  onCreateProtocol,
  onUpdateProtocol,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlipProtocol, setSelectedSlipProtocol] = useState<Protocol | null>(null);

  // New Protocol Modal Form State
  const [selectedVesselId, setSelectedVesselId] = useState(vessels[0]?.id || '');
  const [tipoProtocolo, setTipoProtocolo] = useState<Protocol['tipoProtocolo']>('capitania_dpc');
  const [destinatario, setDestinatario] = useState('');
  const [orgaoOuEmpresa, setOrgaoOuEmpresa] = useState('');
  const [docInputText, setDocInputText] = useState('');
  const [docList, setDocList] = useState<string[]>([
    'Laudo Técnico Definitivo',
    'ART de Engenharia Naval (2 vias)',
  ]);
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Add document to list
  const handleAddDocItem = () => {
    if (!docInputText.trim()) return;
    setDocList([...docList, docInputText.trim()]);
    setDocInputText('');
  };

  const handleRemoveDocItem = (index: number) => {
    setDocList(docList.filter((_, i) => i !== index));
  };

  const handleCreateProtocolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vessel = vessels.find((v) => v.id === selectedVesselId);
    if (!vessel) return;

    const seq = protocols.length + 83;
    const yearSuffix = String(new Date().getFullYear()).slice(-2);
    const numeroProtocolo = `PROT-${String(seq).padStart(3, '0')}/${yearSuffix}`;

    onCreateProtocol({
      numeroProtocolo,
      dataEnvio: new Date().toISOString().split('T')[0],
      embarcacaoId: vessel.id,
      embarcacaoNome: vessel.nome,
      clienteNome: vessel.clienteNome || 'Cliente',
      tipoProtocolo,
      destinatario: destinatario || (tipoProtocolo === 'capitania_dpc' ? 'Capitania Fluvial - Seção de Análise' : 'Engenheiro Responsável'),
      orgaoOuEmpresa: orgaoOuEmpresa || (tipoProtocolo === 'capitania_dpc' ? 'Marinha do Brasil' : vessel.clienteNome),
      documentosIncluidos: docList.length > 0 ? docList : ['Documentação Técnica de Engenharia Naval'],
      responsavelEnvioNome: currentUser.nome,
      status: 'em_trânsito',
      codigoRastreio: codigoRastreio || `PROT-${Date.now().toString().slice(-6)}`,
      observacoes,
    });

    setIsModalOpen(false);
    // Reset form
    setDestinatario('');
    setOrgaoOuEmpresa('');
    setCodigoRastreio('');
    setObservacoes('');
    setDocList(['Laudo Técnico Definitivo', 'ART de Engenharia Naval (2 vias)']);
  };

  // Metrics
  const totalCount = protocols.length;
  const inTransitCount = protocols.filter((p) => p.status === 'em_trânsito').length;
  const protocoladoCount = protocols.filter((p) => p.status === 'protocolado').length;
  const exigenciaCount = protocols.filter((p) => p.status === 'exigencia').length;
  const concluidoCount = protocols.filter((p) => p.status === 'concluido').length;

  const filteredProtocols = protocols.filter((p) => {
    const matchesSearch =
      p.numeroProtocolo?.toLowerCase().includes(search.toLowerCase()) ||
      p.embarcacaoNome?.toLowerCase().includes(search.toLowerCase()) ||
      p.clienteNome?.toLowerCase().includes(search.toLowerCase()) ||
      p.destinatario?.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigoRastreio && p.codigoRastreio.toLowerCase().includes(search.toLowerCase())) ||
      p.documentosIncluidos?.some((d) => d.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
    const matchesType = typeFilter === 'todos' || p.tipoProtocolo === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: Protocol['status']) => {
    switch (status) {
      case 'em_trânsito':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Em Trânsito / Análise
          </span>
        );
      case 'protocolado':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
            Protocolado
          </span>
        );
      case 'exigencia':
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            Com Exigência
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Entregue / Concluído
          </span>
        );
    }
  };

  const getTipoLabel = (tipo: Protocol['tipoProtocolo']) => {
    switch (tipo) {
      case 'capitania_dpc':
        return 'Capitania / DPC';
      case 'certificadora':
        return 'Certificadora (RBNA/ABS)';
      case 'entrega_cliente':
        return 'Cliente / Armador';
      default:
        return 'Outros Órgãos';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-600" />
            Módulo de Protocolos & Entregas Documentais
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Rastreamento oficial de remessas para Capitania dos Portos, DPC, Certificadoras e Clientes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Gerar Novo Protocolo
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total de Protocolos</span>
          <p className="text-2xl font-black font-mono text-slate-900">{totalCount}</p>
          <p className="text-[10px] text-slate-500 font-medium">Histórico registrado no sistema</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm space-y-1 bg-amber-50/20">
          <span className="text-[10px] font-bold uppercase text-amber-700">Em Trânsito / Análise</span>
          <p className="text-2xl font-black font-mono text-amber-700">{inTransitCount}</p>
          <p className="text-[10px] text-amber-600 font-medium">Aguardando parecer de órgão/cliente</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-red-200 shadow-sm space-y-1 bg-red-50/20">
          <span className="text-[10px] font-bold uppercase text-red-700">Com Exigências</span>
          <p className="text-2xl font-black font-mono text-red-700">{exigenciaCount}</p>
          <p className="text-[10px] text-red-600 font-medium">Requer sanar nota técnica urgente</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm space-y-1 bg-emerald-50/20">
          <span className="text-[10px] font-bold uppercase text-emerald-700">Protocolados / Concluídos</span>
          <p className="text-2xl font-black font-mono text-emerald-700">{protocoladoCount + concluidoCount}</p>
          <p className="text-[10px] text-emerald-600 font-medium">Com chancela ou recibo assinado</p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nº protocolo, embarcação, documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white transition"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" /> Tipo:
            </span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'capitania_dpc', label: 'Capitania / DPC' },
              { id: 'certificadora', label: 'Certificadora' },
              { id: 'entrega_cliente', label: 'Entrega Cliente' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition cursor-pointer ${
                  typeFilter === t.id
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-t pt-3 text-xs overflow-x-auto">
          <span className="text-slate-400 font-semibold shrink-0">Status:</span>
          {[
            { id: 'todos', label: 'Todos os Status' },
            { id: 'em_trânsito', label: 'Em Trânsito' },
            { id: 'protocolado', label: 'Protocolados' },
            { id: 'exigencia', label: 'Com Exigência' },
            { id: 'concluido', label: 'Concluídos' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition cursor-pointer ${
                statusFilter === s.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Protocols List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Remessas e Protocolos Registrados ({filteredProtocols.length})
          </h3>
        </div>

        {filteredProtocols.length === 0 ? (
          <div className="text-center py-12 text-slate-500 italic text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Nenhum protocolo localizado com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProtocols.map((protocol) => {
              const vessel = vessels.find((v) => v.id === protocol.embarcacaoId);

              return (
                <div
                  key={protocol.id}
                  className="p-5 hover:bg-slate-50/80 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Info */}
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {protocol.numeroProtocolo}
                      </span>
                      {getStatusBadge(protocol.status)}
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {getTipoLabel(protocol.tipoProtocolo)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Data: {formatDateBR(protocol.dataEnvio)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Embarcação: <span className="text-blue-700">{protocol.embarcacaoNome}</span>
                      </h4>
                      <p className="text-xs text-slate-600">
                        <strong>Destinatário / Órgão:</strong> {protocol.destinatario} ({protocol.orgaoOuEmpresa})
                      </p>
                      <p className="text-xs text-slate-500">
                        <strong>Cliente / Armador:</strong> {protocol.clienteNome}
                      </p>
                    </div>

                    {/* Included Documents List */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Documentos Incluídos ({protocol.documentosIncluidos?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {protocol.documentosIncluidos?.map((doc, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200"
                          >
                            • {doc}
                          </span>
                        ))}
                      </div>
                    </div>

                    {protocol.observacoes && (
                      <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
                        <strong>Obs:</strong> {protocol.observacoes}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Status Switcher & Print Slip Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    
                    {/* Print Protocol Term Button */}
                    <button
                      onClick={() => setSelectedSlipProtocol(protocol)}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#00E5FF]" />
                      Imprimir Termo (PDF)
                    </button>

                    {/* Quick Status Updater */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold">Mudar Status:</span>
                      <select
                        value={protocol.status}
                        onChange={(e) =>
                          onUpdateProtocol(protocol.id, {
                            status: e.target.value as Protocol['status'],
                          })
                        }
                        className="text-xs font-bold border rounded-lg px-2 py-1 bg-white shadow-2xs cursor-pointer focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="em_trânsito">Em Trânsito</option>
                        <option value="protocolado">Protocolado</option>
                        <option value="exigencia">Com Exigência</option>
                        <option value="concluido">Entregue / Concluído</option>
                      </select>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      Responsável: {protocol.responsavelEnvioNome}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Gerar Novo Protocolo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Gerar Termo de Protocolo</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProtocolSubmit} className="space-y-4">
              {/* Vessel Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Embarcação *</label>
                <select
                  value={selectedVesselId}
                  onChange={(e) => setSelectedVesselId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-medium"
                >
                  {vessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome} ({v.clienteNome || 'Sem cliente'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Protocol Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destino / Tipo *</label>
                  <select
                    value={tipoProtocolo}
                    onChange={(e) => setTipoProtocolo(e.target.value as Protocol['tipoProtocolo'])}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  >
                    <option value="capitania_dpc">Capitania Fluvial / DPC</option>
                    <option value="certificadora">Certificadora (RBNA/ABS)</option>
                    <option value="entrega_cliente">Entrega Direta ao Cliente</option>
                    <option value="outros">Outros Órgãos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Órgão / Empresa</label>
                  <input
                    type="text"
                    placeholder="Ex: Marinha do Brasil / RBNA"
                    value={orgaoOuEmpresa}
                    onChange={(e) => setOrgaoOuEmpresa(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              {/* Destinatário Especifico */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Destinatário / Perito / Setor</label>
                <input
                  type="text"
                  placeholder="Ex: Capitania Fluvial da Amazônia - Análise de Projetos"
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {/* Document List Builder */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 text-[11px] block">
                  Documentos e Peças Técnicas Incluídas no Protocolo:
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Plano de Arranjo Geral - Impresso A0"
                    value={docInputText}
                    onChange={(e) => setDocInputText(e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddDocItem}
                    className="bg-slate-900 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="space-y-1 mt-2">
                  {docList.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 bg-white border rounded-lg text-xs">
                      <span className="font-medium text-slate-800">• {doc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracking / Obs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cód. Rastreio / Processo</label>
                  <input
                    type="text"
                    placeholder="Ex: MARINHA-2026-8841"
                    value={codigoRastreio}
                    onChange={(e) => setCodigoRastreio(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Observações de Envio</label>
                  <input
                    type="text"
                    placeholder="Ex: Entregue via courier em 2 vias impresso"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Gerar Protocolo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Protocol Slip Modal */}
      {selectedSlipProtocol && (
        <ProtocolSlipModal
          protocol={selectedSlipProtocol}
          vessel={vessels.find((v) => v.id === selectedSlipProtocol.embarcacaoId)}
          signatureConfig={signatureConfig}
          logoConfig={logoConfig}
          onClose={() => setSelectedSlipProtocol(null)}
        />
      )}
    </div>
  );
};
