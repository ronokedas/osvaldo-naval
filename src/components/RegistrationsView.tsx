import React, { useEffect, useState } from 'react';
import {
  Building2,
  Edit3,
  Plus,
  Ship,
  Trash2,
  Users,
  Wrench,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';
import { formatCpfCnpj, formatPhone, isValidCpfCnpj, isValidEmail } from '../utils/input-formatters';
import { PaginationControls } from './PaginationControls';

const onlyDigits = (value: string) => value.replace(/\D/g, '');

export function RegistrationsView({ onChanged, canManage = false }: { onChanged?: () => void; canManage?: boolean }) {
  const [clients, setClients] = useState<any[]>([]);
  const [certifiers, setCertifiers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(25);
  const [vessels, setVessels] = useState<any[]>([]);

  // Client form state
  const [client, setClient] = useState({ nome: '', cnpjCpf: '', telefone: '', whatsapp: '', email: '' });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');

  // Certifier form state
  const [certifier, setCertifier] = useState({ nome: '', codigoRegistro: '', telefoneContato: '', email: '' });
  const [editingCertifierId, setEditingCertifierId] = useState<string | null>(null);
  const [certifierSearch, setCertifierSearch] = useState('');

  // Service form state
  const [service, setService] = useState({ nome: '', valorPadrao: 0 });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');

  // Feedback messages
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSection, setActiveSection] = useState<'clients' | 'others'>('clients');

  const load = async () => {
    try {
      const [c, f, s, v] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/certifiers'),
        fetch('/api/services'),
        fetch('/api/vessels'),
      ]);
      if (c.ok) setClients(await c.json());
      if (f.ok) setCertifiers(await f.json());
      if (s.ok) setServices(await s.json());
      if (v.ok) setVessels(await v.json());
    } catch {
      console.error('Erro ao carregar cadastros');
    }
  };

  useEffect(() => {
    load();
  }, []);

  // CLIENT HANDLERS
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    const rawDoc = onlyDigits(client.cnpjCpf);
    if (rawDoc.length > 0) {
      if (!isValidCpfCnpj(rawDoc)) {
        setErrorMsg('CPF/CNPJ inválido. Por favor, verifique os números digitados.');
        return;
      }
    }
    if (client.email && !isValidEmail(client.email)) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }

    const payload = { ...client, cnpjCpf: rawDoc || null };
    const url = editingClientId ? `/api/clients/${editingClientId}` : '/api/clients';
    const method = editingClientId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErrorMsg(data.error || 'Não foi possível salvar o cliente.');
      return;
    }

    setClient({ nome: '', cnpjCpf: '', telefone: '', whatsapp: '', email: '' });
    setEditingClientId(null);
    setMessage(editingClientId ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
    await load();
    onChanged?.();
  };

  const handleEditClient = (c: any) => {
    setEditingClientId(c.id);
    setClient({
      nome: c.nome || '',
      cnpjCpf: c.cnpjCpf ? formatCpfCnpj(c.cnpjCpf) : '',
      telefone: c.telefone ? formatPhone(c.telefone) : '',
      whatsapp: c.whatsapp ? formatPhone(c.whatsapp) : '',
      email: c.email || '',
    });
  };

  const handleCancelClientEdit = () => {
    setEditingClientId(null);
    setClient({ nome: '', cnpjCpf: '', telefone: '', whatsapp: '', email: '' });
  };

  // CERTIFIER HANDLERS
  const handleSaveCertifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    if (!certifier.nome.trim()) {
      setErrorMsg('Nome da certificadora é obrigatório.');
      return;
    }
    if (certifier.email && !isValidEmail(certifier.email)) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }

    const url = editingCertifierId ? `/api/certifiers/${editingCertifierId}` : '/api/certifiers';
    const method = editingCertifierId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(certifier),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErrorMsg(data.error || 'Não foi possível salvar a certificadora.');
      return;
    }

    setCertifier({ nome: '', codigoRegistro: '', telefoneContato: '', email: '' });
    setEditingCertifierId(null);
    setMessage(editingCertifierId ? 'Certificadora atualizada com sucesso!' : 'Certificadora cadastrada com sucesso!');
    await load();
    onChanged?.();
  };

  const handleEditCertifier = (c: any) => {
    setEditingCertifierId(c.id);
    setCertifier({
      nome: c.nome || '',
      codigoRegistro: c.codigoRegistro || c.codigo || '',
      telefoneContato: c.telefoneContato || c.telefone || '',
      email: c.email || '',
    });
  };

  const handleCancelCertifierEdit = () => {
    setEditingCertifierId(null);
    setCertifier({ nome: '', codigoRegistro: '', telefoneContato: '', email: '' });
  };

  // SERVICE HANDLERS
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');
    if (!service.nome.trim()) return setErrorMsg('Informe o nome do serviço.');

    const response = await fetch(editingServiceId ? `/api/services/${editingServiceId}` : '/api/services', {
      method: editingServiceId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setErrorMsg(data.error || 'Não foi possível salvar o serviço.');
    setService({ nome: '', valorPadrao: 0 });
    setEditingServiceId(null);
    setMessage(editingServiceId ? 'Serviço atualizado com sucesso!' : 'Serviço cadastrado com sucesso!');
    await load();
    onChanged?.();
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Desativar o serviço “${name}”? Ele não aparecerá em novas propostas, mas continuará preservado nas propostas já criadas.`
      )
    )
      return;
    setMessage('');
    setErrorMsg('');
    const response = await fetch(`/api/services/${id}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setErrorMsg(data.error || 'Não foi possível desativar o serviço.');
    if (editingServiceId === id) {
      setEditingServiceId(null);
      setService({ nome: '', valorPadrao: 0 });
    }
    setMessage('Serviço desativado com sucesso.');
    await load();
    onChanged?.();
  };

  // Filtered lists
  const filteredClients = clients.filter(
    (c) =>
      c.nome?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.cnpjCpf?.includes(clientSearch) ||
      c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );
  const pagedClients = filteredClients.slice((clientPage - 1) * clientPageSize, clientPage * clientPageSize);
  useEffect(() => setClientPage(1), [clientSearch]);

  const filteredCertifiers = certifiers.filter(
    (c) =>
      c.ativo !== false &&
      (c.nome?.toLowerCase().includes(certifierSearch.toLowerCase()) ||
        c.codigoRegistro?.toLowerCase().includes(certifierSearch.toLowerCase()))
  );

  const filteredServices = services.filter(
    (s) => s.ativo !== false && s.nome?.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
          Cadastros Base do Sistema
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Gestão centralizada de clientes, certificadoras parceiras e tabela padrão de serviços técnicos.
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {message}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs font-bold text-red-800 flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <div className="grid grid-cols-2 gap-1.5" role="tablist" aria-label="Seções de cadastros">
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'clients'}
            onClick={() => setActiveSection('clients')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition cursor-pointer ${
              activeSection === 'clients'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            Clientes
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${activeSection === 'clients' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {clients.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'others'}
            onClick={() => setActiveSection('others')}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition cursor-pointer ${
              activeSection === 'others'
                ? 'bg-[#172554] text-white shadow-md shadow-slate-900/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Outros cadastros
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${activeSection === 'others' ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {certifiers.filter((c) => c.ativo !== false).length + services.filter((s) => s.ativo !== false).length}
            </span>
          </button>
        </div>
      </div>

      {activeSection === 'clients' ? (
        <>
          <div className="bg-gradient-to-r from-blue-950 via-[#172554] to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-800/50">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-300/20 shrink-0">
                <Ship className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-200">Relacionamento</p>
                <h3 className="font-bold text-base text-white mt-1">Clientes e suas embarcações</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Cadastre seus clientes aqui. Depois, vincule uma ou mais embarcações pela aba <strong className="text-cyan-300">Embarcações</strong>, selecionando o cliente no campo Proprietário.
                </p>
              </div>
            </div>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {canManage ? (editingClientId ? 'Editar Cliente' : 'Novo Cliente') : 'Clientes'}
              </h2>
              <span className="w-fit text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                {clients.length} {clients.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
              </span>
            </div>

            {canManage && <form onSubmit={handleSaveClient} className="mt-5 grid gap-3 sm:grid-cols-2 text-xs">
              <input
                required
                placeholder="Nome ou razão social *"
                value={client.nome}
                onChange={(e) => setClient({ ...client, nome: e.target.value })}
                className="sm:col-span-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <input
                placeholder="CPF ou CNPJ"
                value={client.cnpjCpf}
                onChange={(e) => setClient({ ...client, cnpjCpf: formatCpfCnpj(e.target.value) })}
                className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <input
                placeholder="Telefone"
                value={client.telefone}
                onChange={(e) => setClient({ ...client, telefone: formatPhone(e.target.value) })}
                className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <input
                placeholder="WhatsApp"
                value={client.whatsapp}
                onChange={(e) => setClient({ ...client, whatsapp: formatPhone(e.target.value) })}
                className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <input
                type="email"
                placeholder="E-mail"
                value={client.email}
                onChange={(e) => setClient({ ...client, email: e.target.value })}
                className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <div className="sm:col-span-2 flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 transition text-white rounded-xl py-2.5 font-bold flex justify-center items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  {editingClientId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingClientId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
                {editingClientId && (
                  <button
                    type="button"
                    onClick={handleCancelClientEdit}
                    className="px-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                    title="Cancelar edição"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>}
          </div>

          <div className="mt-6 space-y-3 pt-5 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Clientes cadastrados</h3>
                <p className="text-xs text-slate-500 mt-0.5">Consulte dados de contato e embarcações vinculadas.</p>
              </div>
              <div className="relative sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cliente por nome ou CNPJ..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
              />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 max-h-[32rem] overflow-y-auto pr-1">
              {pagedClients.map((c) => {
                const clientVessels = vessels.filter((v) => v.clienteId === c.id);
                return (
                  <div
                    key={c.id}
                    className={`rounded-xl p-4 text-xs border transition flex items-start justify-between gap-2 ${
                      editingClientId === c.id ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-slate-50/80 hover:bg-white hover:shadow-sm border-slate-200/80'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <b className="text-slate-900 font-bold block truncate">{c.nome}</b>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {c.cnpjCpf ? formatCpfCnpj(c.cnpjCpf) : 'Sem CPF/CNPJ'} · {c.whatsapp || c.telefone || c.email || 'Sem contato'}
                      </p>

                      {/* Linked Vessels Badge */}
                      <div className="pt-1 flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Barcos:</span>
                        {clientVessels.length > 0 ? (
                          clientVessels.map((v) => (
                            <span
                              key={v.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              <Ship className="w-2.5 h-2.5" />
                              {v.nome}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Nenhuma embarcação cadastrada</span>
                        )}
                      </div>
                    </div>

                    {canManage && <button
                      type="button"
                      onClick={() => handleEditClient(c)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg shrink-0 cursor-pointer"
                      title="Editar cliente"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>}
                  </div>
                );
              })}
              <PaginationControls page={clientPage} pageSize={clientPageSize} total={filteredClients.length} onPageChange={setClientPage} onPageSizeChange={(size) => { setClientPageSize(size); setClientPage(1); }} />
              {filteredClients.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-400">Nenhum cliente encontrado.</p>
              )}
            </div>
          </div>
          </section>
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 flex items-start gap-3">
            <div className="rounded-xl bg-white p-2.5 text-indigo-600 shadow-sm border border-indigo-100 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Configurações auxiliares</h2>
              <p className="text-xs text-slate-600 mt-1">Certificadoras e serviços são usados para agilizar propostas, documentos e ordens de serviço.</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                {canManage ? (editingCertifierId ? 'Editar Certificadora' : 'Nova Certificadora') : 'Certificadoras'}
              </h2>
              <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                {certifiers.filter((c) => c.ativo !== false).length} ativas
              </span>
            </div>

            {canManage && <form onSubmit={handleSaveCertifier} className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
              <input
                required
                placeholder="Nome da certificadora *"
                value={certifier.nome}
                onChange={(e) => setCertifier({ ...certifier, nome: e.target.value })}
                className="sm:col-span-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <input
                placeholder="Código / Registro"
                value={certifier.codigoRegistro}
                onChange={(e) => setCertifier({ ...certifier, codigoRegistro: e.target.value })}
                className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <input
                placeholder="Telefone"
                value={certifier.telefoneContato}
                onChange={(e) => setCertifier({ ...certifier, telefoneContato: formatPhone(e.target.value) })}
                className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <input
                type="email"
                placeholder="E-mail"
                value={certifier.email}
                onChange={(e) => setCertifier({ ...certifier, email: e.target.value })}
                className="sm:col-span-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <div className="sm:col-span-2 flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-xl py-2.5 font-bold flex justify-center items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  {editingCertifierId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingCertifierId ? 'Salvar Alterações' : 'Cadastrar Certificadora'}
                </button>
                {editingCertifierId && (
                  <button
                    type="button"
                    onClick={handleCancelCertifierEdit}
                    className="px-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                    title="Cancelar edição"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>}
          </div>

          {/* List of Certifiers */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar certificadora..."
                value={certifierSearch}
                onChange={(e) => setCertifierSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredCertifiers.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl p-3 text-xs border transition flex items-start justify-between gap-2 ${
                    editingCertifierId === c.id ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <b className="text-slate-900 font-bold block truncate">{c.nome}</b>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Reg: {c.codigoRegistro || c.codigo || 'Sem código'} · {c.email || c.telefoneContato || c.telefone || 'Sem contato'}
                    </p>
                  </div>

                  {canManage && <button
                    type="button"
                    onClick={() => handleEditCertifier(c)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg shrink-0 cursor-pointer"
                    title="Editar certificadora"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>}
                </div>
              ))}
              {filteredCertifiers.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-400">Nenhuma certificadora encontrada.</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                {canManage ? (editingServiceId ? 'Editar Serviço' : 'Novo Serviço') : 'Serviços'}
              </h2>
              <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                {services.filter((s) => s.ativo !== false).length} ativos
              </span>
            </div>

            {canManage && <form onSubmit={handleSaveService} className="mt-4 grid gap-3 text-xs">
              <input
                required
                placeholder="Nome do serviço *"
                value={service.nome}
                onChange={(e) => setService({ ...service, nome: e.target.value })}
                className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <CurrencyInput
                value={service.valorPadrao}
                onValueChange={(value) => setService({ ...service, valorPadrao: value })}
                aria-label="Valor padrão do serviço"
                className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl p-2.5 font-mono outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 transition text-white rounded-xl py-2.5 font-bold flex justify-center items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  {editingServiceId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingServiceId ? 'Salvar Alteração' : 'Cadastrar Serviço'}
                </button>
                {editingServiceId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingServiceId(null);
                      setService({ nome: '', valorPadrao: 0 });
                    }}
                    className="px-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                    title="Cancelar edição"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>}
          </div>

          {/* List of Services */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar serviço por nome..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50"
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredServices.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-xl p-3 text-xs border transition flex items-start justify-between gap-3 ${
                    editingServiceId === s.id ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <b className="text-slate-900 font-bold block truncate">{s.nome}</b>
                    <p className="mt-0.5 font-mono text-blue-800 font-bold">
                      R$ {Number(s.valorPadrao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {canManage && <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingServiceId(s.id);
                        setService({ nome: s.nome, valorPadrao: Number(s.valorPadrao) || 0 });
                      }}
                      className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg cursor-pointer"
                      title="Editar serviço"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(s.id, s.nome)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer"
                      title="Desativar serviço"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>}
                </div>
              ))}
              {filteredServices.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-400">Nenhum serviço encontrado.</p>
              )}
            </div>
          </div>
        </section>
      </div>
        </>
      )}
    </div>
  );
}
