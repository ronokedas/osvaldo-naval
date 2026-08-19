import React, { useEffect, useState } from 'react';
import { Building2, Edit3, Plus, Ship, Trash2, Users, Wrench, X } from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';
import { formatCpfCnpj, formatPhone, isValidCpfCnpj, isValidEmail } from '../utils/input-formatters';

const onlyDigits = (value: string) => value.replace(/\D/g, '');


export function RegistrationsView({ onChanged }: { onChanged?: () => void }) {
  const [clients, setClients] = useState<any[]>([]); 
  const [certifiers, setCertifiers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [client, setClient] = useState({ nome: '', cnpjCpf: '', telefone: '', whatsapp: '', email: '' });
  const [certifier, setCertifier] = useState({ nome: '', codigo: '', telefone: '', email: '' });
  const [service, setService] = useState({ nome: '', valorPadrao: 0 });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const load = async () => { 
    const [c, f, s] = await Promise.all([fetch('/api/clients'), fetch('/api/certifiers'), fetch('/api/services')]); 
    if (c.ok) setClients(await c.json()); 
    if (f.ok) setCertifiers(await f.json()); 
    if (s.ok) setServices(await s.json());
  };
  
  useEffect(() => { load(); }, []);

  const save = async (url: string, body: any, reset: () => void) => { 
    setMessage(''); 
    setErrorMsg('');
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); 
    const data = await r.json().catch(() => ({})); 
    if (!r.ok) return setErrorMsg(data.error || 'Não foi possível salvar.'); 
    reset(); 
    setMessage('Cadastro salvo com sucesso.'); 
    await load(); 
    onChanged?.(); 
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    const rawDoc = onlyDigits(client.cnpjCpf);
    if (rawDoc.length > 0) {
      if (!isValidCpfCnpj(rawDoc)) {
        setErrorMsg("CPF/CNPJ inválido. Por favor, verifique os números digitados.");
        return;
      }
    }
    if (client.email && !isValidEmail(client.email)) return setErrorMsg('Informe um e-mail válido.');

    save('/api/clients', { ...client, cnpjCpf: rawDoc }, () => setClient({ nome: '', cnpjCpf: '', telefone: '', whatsapp: '', email: '' }));
  };

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
    setMessage(editingServiceId ? 'Serviço atualizado com sucesso.' : 'Serviço cadastrado com sucesso.');
    await load();
    onChanged?.();
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`Desativar o serviço “${name}”? Ele não aparecerá em novas propostas, mas continuará preservado nas propostas já criadas.`)) return;
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

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Cadastros base</h1>
        <p className="text-sm text-slate-500">Clientes, contatos e certificadoras vinculados às embarcações.</p>
      </div>

      {message && <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm font-semibold text-blue-800">{message}</div>}
      {errorMsg && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-800">{errorMsg}</div>}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold flex gap-2 items-center"><Users className="w-5 h-5 text-blue-600"/> Novo cliente</h2>
          <form onSubmit={handleSaveClient} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input required placeholder="Nome ou razão social" value={client.nome} onChange={e => setClient({ ...client, nome: e.target.value })} className="sm:col-span-2 input-base border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
            <input placeholder="CPF ou CNPJ" value={client.cnpjCpf} onChange={e => setClient({ ...client, cnpjCpf: formatCpfCnpj(e.target.value) })} className="border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
            <input placeholder="Telefone" value={client.telefone} onChange={e => setClient({ ...client, telefone: formatPhone(e.target.value) })} className="border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
            <input placeholder="WhatsApp" value={client.whatsapp} onChange={e => setClient({ ...client, whatsapp: formatPhone(e.target.value) })} className="border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
            <input type="email" placeholder="E-mail" value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} className="border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
            <button className="sm:col-span-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg py-2.5 font-bold flex justify-center items-center gap-2">
              <Plus className="w-4 h-4"/>Cadastrar cliente
            </button>
          </form>
          <div className="mt-5 space-y-2 max-h-64 overflow-auto">
            {clients.map(c => (
              <div key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm border border-slate-100">
                <b>{c.nome}</b>
                <p className="text-slate-500">{c.cnpjCpf || 'Sem CPF/CNPJ'} · {c.whatsapp || c.telefone || 'Sem contato'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold flex gap-2 items-center"><Building2 className="w-5 h-5 text-indigo-600"/> Nova certificadora</h2>
          <form onSubmit={e => { e.preventDefault(); if (certifier.email && !isValidEmail(certifier.email)) return setErrorMsg('Informe um e-mail válido.'); save('/api/certifiers', certifier, () => setCertifier({ nome: '', codigo: '', telefone: '', email: '' })); }} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input required placeholder="Nome" value={certifier.nome} onChange={e => setCertifier({ ...certifier, nome: e.target.value })} className="sm:col-span-2 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"/>
            <input placeholder="Código / registro" value={certifier.codigo} onChange={e => setCertifier({ ...certifier, codigo: e.target.value })} className="border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"/>
            <input placeholder="Telefone" value={certifier.telefone} onChange={e => setCertifier({ ...certifier, telefone: formatPhone(e.target.value) })} className="border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"/>
            <input type="email" placeholder="E-mail" value={certifier.email} onChange={e => setCertifier({ ...certifier, email: e.target.value })} className="sm:col-span-2 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"/>
            <button className="sm:col-span-2 bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-lg py-2.5 font-bold flex justify-center items-center gap-2">
              <Plus className="w-4 h-4"/>Cadastrar certificadora
            </button>
          </form>
          <div className="mt-5 space-y-2 max-h-64 overflow-auto">
            {certifiers.filter(c => c.ativo !== false).map(c => (
              <div key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm border border-slate-100">
                <b>{c.nome}</b>
                <p className="text-slate-500">{c.codigo || 'Sem código'} · {c.email || c.telefone || 'Sem contato'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold flex gap-2 items-center"><Wrench className="w-5 h-5 text-blue-600"/> Serviços</h2>
          <p className="mt-1 text-xs text-slate-500">Serviços disponíveis para seleção nas propostas.</p>
          <form onSubmit={handleSaveService} className="mt-4 grid gap-3">
            <input required placeholder="Nome do serviço" value={service.nome} onChange={e => setService({ ...service, nome: e.target.value })} className="border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
            <CurrencyInput value={service.valorPadrao} onValueChange={value => setService({ ...service, valorPadrao: value })} aria-label="Valor padrão do serviço" className="border border-slate-300 rounded-lg p-2.5 font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"/>
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg py-2.5 font-bold flex justify-center items-center gap-2">
                {editingServiceId ? <Edit3 className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}{editingServiceId ? 'Salvar alteração' : 'Cadastrar serviço'}
              </button>
              {editingServiceId && <button type="button" onClick={() => { setEditingServiceId(null); setService({ nome: '', valorPadrao: 0 }); }} className="px-3 rounded-lg border border-slate-300 text-slate-600" title="Cancelar edição"><X className="w-4 h-4"/></button>}
            </div>
          </form>
          <div className="mt-5 space-y-2 max-h-64 overflow-auto">
            {services.filter(s => s.ativo !== false).map(s => (
              <div key={s.id} className="rounded-lg bg-slate-50 p-3 text-sm border border-slate-100 flex items-start justify-between gap-3">
                <div><b>{s.nome}</b><p className="mt-0.5 font-mono text-blue-800">R$ {Number(s.valorPadrao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => { setEditingServiceId(s.id); setService({ nome: s.nome, valorPadrao: Number(s.valorPadrao) || 0 }); }} className="rounded p-1.5 text-blue-700 hover:bg-blue-100" title="Editar serviço"><Edit3 className="w-4 h-4"/></button>
                  <button type="button" onClick={() => handleDeleteService(s.id, s.nome)} className="rounded p-1.5 text-red-600 hover:bg-red-100" title="Desativar serviço"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
            {!services.filter(s => s.ativo !== false).length && <p className="text-sm text-slate-500">Nenhum serviço cadastrado.</p>}
          </div>
        </section>
      </div>

      <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600 flex gap-2">
        <Ship className="w-5 h-5 shrink-0"/>
        Depois de cadastrar, selecione o cliente e a certificadora ao criar a embarcação. Os serviços cadastrados ficam disponíveis ao montar uma proposta.
      </div>
    </div>
  );
}
