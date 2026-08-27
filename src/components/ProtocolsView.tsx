import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileCheck, FileText, History, Paperclip, Plus, Printer, Search, Send, X } from 'lucide-react';
import { LogoConfig, Protocol, ServiceOrder, ServiceOrderDetail, SignatureConfig, User, Vessel } from '../types';
import { formatDateBR, formatDateTimeBR } from '../utils/date-formatters';
import { ProtocolSlipModal } from './ProtocolSlipModal';

interface Props {
  protocols: Protocol[];
  vessels: Vessel[];
  serviceOrders: ServiceOrder[];
  currentUser: User;
  signatureConfig?: SignatureConfig;
  logoConfig?: LogoConfig;
  onCreateProtocol: (data: Partial<Protocol> & Record<string, any>) => Promise<Protocol>;
  onRefresh: () => Promise<void>;
  onOpenOs: (osId: string) => Promise<void> | void;
}

const labels: Record<string, string> = {
  rascunho: 'Rascunho', aguardando_analise: 'Aguardando análise', exigencia_recebida: 'Exigência recebida',
  correcao_em_elaboracao: 'Correção em elaboração', correcao_enviada: 'Correção enviada', aprovado: 'Aprovado',
  cancelado: 'Cancelado', 'em_trânsito': 'Legado · em trânsito', protocolado: 'Legado · protocolado',
  exigencia: 'Legado · exigência', concluido: 'Legado · concluído',
};

const statusStyle = (status: string) => status === 'aprovado' || status === 'concluido'
  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
  : status.includes('exigencia') || status === 'correcao_em_elaboracao'
    ? 'bg-red-50 text-red-800 border-red-200'
    : status === 'rascunho' || status === 'cancelado'
      ? 'bg-slate-100 text-slate-700 border-slate-200'
      : 'bg-amber-50 text-amber-800 border-amber-200';

async function uploadEvidence(file: File) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Falha ao enviar o comprovante.');
  return { arquivoUrl: data.url, arquivoNome: data.fileName, tipoMime: file.type, tamanho: file.size };
}

async function postJson(url: string, body: any) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
}

export const ProtocolsView: React.FC<Props> = ({ protocols, vessels, serviceOrders, currentUser, signatureConfig, logoConfig, onCreateProtocol, onRefresh, onOpenOs }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOsId, setSelectedOsId] = useState('');
  const [osDetail, setOsDetail] = useState<ServiceOrderDetail | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<Protocol | null>(null);
  const [responseProtocol, setResponseProtocol] = useState<Protocol | null>(null);
  const [resendProtocol, setResendProtocol] = useState<Protocol | null>(null);
  const [confirmProtocol, setConfirmProtocol] = useState<Protocol | null>(null);
  const [finalDocumentsProtocol, setFinalDocumentsProtocol] = useState<Protocol | null>(null);
  const [supplementalDocumentProtocol, setSupplementalDocumentProtocol] = useState<Protocol | null>(null);
  const [busy, setBusy] = useState(false);

  const loadOs = async (id: string) => {
    setSelectedOsId(id);
    setOsDetail(null);
    setSelectedDocs([]);
    if (!id) return;
    const response = await fetch(`/api/service-orders/${id}`);
    if (!response.ok) return;
    const detail = await response.json();
    setOsDetail(detail);
    setSelectedDocs((detail.documentos || []).filter((doc: any) => {
      const latest = (doc.versoes || [])[0];
      return latest?.situacaoRevisao === 'revisado' && latest?.situacaoAprovacao === 'aprovado' && doc.status !== 'aprovado';
    }).map((doc: any) => doc.id));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const osId = params.get('osId');
    if (osId && serviceOrders.some((item) => item.id === osId)) {
      const existing = protocols.find((item) => item.osId === osId && !['cancelado'].includes(item.status));
      if (existing) setSearch(existing.numeroProtocolo);
      else {
        setShowCreate(true);
        loadOs(osId);
      }
      window.history.replaceState({}, '', '/protocols');
    }
  }, [serviceOrders, protocols]);

  const filtered = useMemo(() => protocols.filter((protocol) => {
    const query = search.trim().toLowerCase();
    const match = !query || [protocol.numeroProtocolo, protocol.embarcacaoNome, protocol.orgaoOuEmpresa, protocol.clienteNome, ...(protocol.documentosIncluidos || [])].some((value) => String(value || '').toLowerCase().includes(query));
    return match && (statusFilter === 'todos' || protocol.status === statusFilter);
  }), [protocols, search, statusFilter]);

  const createProtocol = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!osDetail || !selectedDocs.length) return alert('Selecione a OS e ao menos um documento aprovado internamente.');
    const form = event.currentTarget;
    const fields = new FormData(form);
    const vessel = vessels.find((item) => item.id === osDetail.embarcacaoId);
    setBusy(true);
    try {
      await onCreateProtocol({
        osId: osDetail.id, embarcacaoId: osDetail.embarcacaoId, embarcacaoNome: vessel?.nome || osDetail.embarcacaoNome,
        clienteNome: osDetail.clienteNome, tipoProtocolo: String(fields.get('tipo')) as any,
        destinatario: String(fields.get('destinatario') || ''), orgaoOuEmpresa: String(fields.get('orgao') || ''),
        canal: String(fields.get('canal') || 'portal'), codigoRastreio: String(fields.get('referencia') || ''),
        dataEnvio: String(fields.get('data') || ''), observacoes: String(fields.get('observacao') || ''),
        documentos: selectedDocs.map((id) => {
          const doc = osDetail.documentos.find((item) => item.id === id)!;
          return { documentoId: id, versao: doc.versaoAtual };
        }),
      });
      setShowCreate(false);
      await onRefresh();
    } catch (error: any) { alert(error.message); } finally { setBusy(false); }
  };

  const activeDispatch = (protocol: Protocol) => protocol.remessas?.find((item) => item.ciclo === Number(protocol.cicloAtual || 0)) || protocol.remessas?.at(-1);

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#0B192C]"><Send className="h-6 w-6 text-blue-600" /> Protocolos & Entregas</h1><p className="mt-1 text-sm text-slate-500">Dossiê único de remessas, exigências, correções e aprovações externas.</p></div>
      <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Novo pacote externo</button>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric label="Total" value={protocols.length} color="slate" />
      <Metric label="Aguardando análise" value={protocols.filter((p) => ['aguardando_analise', 'correcao_enviada', 'em_trânsito'].includes(p.status)).length} color="amber" />
      <Metric label="Com exigência" value={protocols.filter((p) => ['exigencia_recebida', 'correcao_em_elaboracao', 'exigencia'].includes(p.status)).length} color="red" />
      <Metric label="Aprovados" value={protocols.filter((p) => ['aprovado', 'concluido'].includes(p.status)).length} color="emerald" />
    </div>

    <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar protocolo, OS, embarcação ou documento..." className="w-full rounded-xl border bg-slate-50 py-2 pl-9 pr-3 text-xs" /></div>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-xs font-bold"><option value="todos">Todos os status</option>{Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
    </div>

    <div className="divide-y overflow-hidden rounded-2xl border bg-white shadow-sm">
      {!filtered.length && <div className="p-12 text-center text-sm text-slate-400">Nenhum protocolo encontrado.</div>}
      {filtered.map((protocol) => {
        const dispatch = activeDispatch(protocol);
        const isWaiting = ['aguardando_analise', 'correcao_enviada'].includes(protocol.status);
        const isDraft = protocol.status === 'rascunho';
        const needsCorrection = ['exigencia_recebida', 'correcao_em_elaboracao'].includes(protocol.status);
        const approvedDocs = Array.from(new Map((protocol.remessas || []).flatMap((item) => item.documentos).map((doc) => [doc.documentoId, doc])).values());
        const pendingFinalDocuments = approvedDocs.filter((doc: any) => !(protocol.arquivosFinais || []).some((file) => file.documentoId === doc.documentoId));
        return <div key={protocol.id} className="space-y-4 p-5">
          {isWaiting && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-900"><Clock className="mr-2 inline h-4 w-4" />{Number(protocol.cicloAtual || 0) > 0 ? `Protocolo de correção ${protocol.cicloAtual} enviado — aguardando análise da certificadora` : 'Protocolo inicial enviado — aguardando análise da certificadora'}</div>}
          {needsCorrection && <div className="flex flex-col gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"><span><AlertTriangle className="mr-2 inline h-4 w-4" /><strong>Correção necessária.</strong> Abra a OS vinculada, anexe a nova versão, revise e aprove tecnicamente antes de reenviar.</span>{protocol.osId && <button onClick={() => onOpenOs(protocol.osId!)} className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100">Abrir OS para corrigir</button>}</div>}
          {protocol.status === 'aprovado' && pendingFinalDocuments.length > 0 && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mr-2 inline h-4 w-4" /><strong>Entrega ainda bloqueada.</strong> Anexe o documento final aprovado/carimbado de cada item para criar a tarefa do Lucas.</div>}
          {protocol.requerConciliacao && <div className="rounded-xl border border-orange-300 bg-orange-50 p-3 text-xs font-bold text-orange-900"><AlertTriangle className="mr-1 inline h-4 w-4" /> Registro legado requer conciliação com uma OS.</div>}
          <div className="flex flex-col justify-between gap-4 lg:flex-row">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-lg border bg-slate-100 px-2 py-1 font-mono text-sm font-black">{protocol.numeroProtocolo}</span><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyle(protocol.status)}`}>{labels[protocol.status] || protocol.status}</span><span className="text-xs text-slate-400">{formatDateBR(protocol.dataEnvio)}</span></div>
              <p className="text-sm font-bold text-slate-900">{protocol.embarcacaoNome || 'Sem embarcação'} · {protocol.orgaoOuEmpresa || protocol.destinatario}</p>
              <div className="flex flex-wrap gap-1.5">{(protocol.documentosIncluidos || []).map((doc, index) => <span key={index} className="rounded-md border bg-slate-50 px-2 py-1 text-[10px] text-slate-700">{doc}</span>)}</div>
              {dispatch && <p className="text-xs text-slate-500">Ciclo {dispatch.ciclo} · {dispatch.tipo === 'correcao' ? 'Correção' : 'Envio inicial'} · {dispatch.documentos.length} documento(s)</p>}
            </div>
            <div className="flex flex-wrap items-start gap-2">
              {isDraft && <button onClick={() => setConfirmProtocol(protocol)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Comprovar envio</button>}
              {isWaiting && <button onClick={() => setResponseProtocol(protocol)} className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white">Registrar resposta</button>}
              {protocol.status === 'aprovado' && pendingFinalDocuments.length > 0 && <button onClick={() => setFinalDocumentsProtocol(protocol)} className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white">Anexar documentos finais</button>}
              {protocol.status === 'aprovado' && pendingFinalDocuments.length === 0 && currentUser.role === 'admin' && <button onClick={() => setSupplementalDocumentProtocol(protocol)} className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white">Adicionar documento suplementar e reabrir entrega</button>}
              {needsCorrection && protocol.osId && <button onClick={() => onOpenOs(protocol.osId!)} className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700">Abrir OS</button>}
              {needsCorrection && <button onClick={async () => { setResendProtocol(protocol); await loadOs(protocol.osId || ''); }} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Enviar correção {Number(protocol.cicloAtual || 0) + 1}</button>}
              <button onClick={() => setSelectedSlip(protocol)} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"><Printer className="h-3.5 w-3.5" /> Termo</button>
            </div>
          </div>
          {(protocol.eventos || []).length > 0 && <details className="text-xs"><summary className="cursor-pointer font-bold text-blue-700"><History className="mr-1 inline h-3.5 w-3.5" /> Histórico completo</summary><div className="mt-2 space-y-2 border-l-2 border-blue-100 pl-3">{protocol.eventos!.map((event) => <div key={event.id}><p className="font-medium text-slate-700">{event.descricao}</p><p className="text-[10px] text-slate-400">{event.autorNome} · {formatDateTimeBR(event.createdAt)}</p></div>)}</div></details>}
        </div>;
      })}
    </div>

    {showCreate && <Modal title="Novo pacote de análise externa" onClose={() => setShowCreate(false)}><form onSubmit={createProtocol} className="space-y-3 text-sm">
      <Field label="Ordem de Serviço"><select required value={selectedOsId} onChange={(e) => loadOs(e.target.value)} className="w-full rounded-lg border px-3 py-2"><option value="">Selecione...</option>{serviceOrders.filter((item) => !['concluida', 'cancelada'].includes(item.status)).map((item) => <option key={item.id} value={item.id}>{item.numero} · {item.embarcacaoNome}</option>)}</select></Field>
      {osDetail && <Field label="Documentos e versões aprovadas internamente"><div className="max-h-48 space-y-2 overflow-auto rounded-lg border p-3">{osDetail.documentos.map((doc) => { const latest = doc.versoes?.[0]; const internallyApproved = latest?.situacaoRevisao === 'revisado' && latest?.situacaoAprovacao === 'aprovado'; const eligible = internallyApproved && doc.status !== 'aprovado'; const reason = doc.status === 'aprovado' ? ' (já aprovado externamente)' : !internallyApproved ? ' (pendente de aprovação interna)' : ''; return <label key={doc.id} className={`flex gap-2 ${eligible ? '' : 'opacity-50'}`}><input type="checkbox" disabled={!eligible} checked={selectedDocs.includes(doc.id)} onChange={(e) => setSelectedDocs((prev) => e.target.checked ? [...prev, doc.id] : prev.filter((id) => id !== doc.id))} /><span>{doc.titulo} · V{doc.versaoAtual}{reason}</span></label>; })}</div></Field>}
      <div className="grid grid-cols-2 gap-3"><Field label="Tipo"><select name="tipo" className="w-full rounded-lg border px-3 py-2"><option value="certificadora">Certificadora</option><option value="capitania_dpc">Capitania / DPC</option></select></Field><Field label="Data"><input name="data" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-lg border px-3 py-2" /></Field></div>
      <Field label="Órgão / certificadora"><input name="orgao" required placeholder="Ex: RBNA" className="w-full rounded-lg border px-3 py-2" /></Field>
      <Field label="Destinatário / setor"><input name="destinatario" required className="w-full rounded-lg border px-3 py-2" /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Canal"><select name="canal" className="w-full rounded-lg border px-3 py-2"><option value="portal">Portal</option><option value="email">E-mail</option><option value="presencial">Presencial</option><option value="correio">Correio</option></select></Field><Field label="Referência externa"><input name="referencia" placeholder="Opcional" className="w-full rounded-lg border px-3 py-2" /></Field></div>
      <Field label="Observação"><textarea name="observacao" className="w-full rounded-lg border px-3 py-2" /></Field>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900"><strong>O sistema fará:</strong> criará o pacote e congelará as versões. <strong>Você fará:</strong> enviará por e-mail, portal, presencialmente ou por correio e depois anexará o comprovante.</div><Actions busy={busy} submitLabel="Preparar pacote" onCancel={() => setShowCreate(false)} />
    </form></Modal>}

    {responseProtocol && <ResponseModal protocol={responseProtocol} onClose={() => setResponseProtocol(null)} onSaved={async () => { setResponseProtocol(null); await onRefresh(); }} />}
    {resendProtocol && <ResendModal protocol={resendProtocol} detail={osDetail} onClose={() => setResendProtocol(null)} onSaved={async () => { setResendProtocol(null); await onRefresh(); }} />}
    {confirmProtocol && <ConfirmDispatchModal protocol={confirmProtocol} onClose={() => setConfirmProtocol(null)} onSaved={async () => { setConfirmProtocol(null); await onRefresh(); }} />}
    {finalDocumentsProtocol && <FinalDocumentsModal protocol={finalDocumentsProtocol} onClose={() => setFinalDocumentsProtocol(null)} onSaved={async () => { setFinalDocumentsProtocol(null); await onRefresh(); }} />}
    {supplementalDocumentProtocol && <SupplementalFinalDocumentModal protocol={supplementalDocumentProtocol} onClose={() => setSupplementalDocumentProtocol(null)} onSaved={async () => { setSupplementalDocumentProtocol(null); await onRefresh(); }} />}
    {selectedSlip && <ProtocolSlipModal protocol={selectedSlip} vessel={vessels.find((item) => item.id === selectedSlip.embarcacaoId)} serviceOrder={serviceOrders.find((item) => item.id === selectedSlip.osId)} signatureConfig={signatureConfig} logoConfig={logoConfig} onClose={() => setSelectedSlip(null)} />}
  </div>;
};

const ResponseModal: React.FC<{ protocol: Protocol; onClose: () => void; onSaved: () => Promise<void> }> = ({ protocol, onClose, onSaved }) => {
  const dispatch = protocol.remessas?.find((item) => item.ciclo === Number(protocol.cicloAtual || 0)) || protocol.remessas?.at(-1);
  const [selected, setSelected] = useState<string[]>(dispatch?.documentos.map((item) => item.documentoId) || []);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [busy, setBusy] = useState(false);
  return <Modal title={`Resposta externa · ${protocol.numeroProtocolo}`} onClose={onClose}><form onSubmit={async (event) => { event.preventDefault(); if (!file) { setFileError('Comprovante obrigatório. Selecione um PDF, imagem ou e-mail exportado para registrar a resposta.'); return; } const fields = new FormData(event.currentTarget); setBusy(true); try { const attachment = await uploadEvidence(file); await postJson(`/api/protocols/${protocol.id}/responses`, { tipo: fields.get('tipo'), data: fields.get('data'), motivo: fields.get('motivo'), documentosIds: selected, anexos: [attachment] }); await onSaved(); } catch (error: any) { alert(error.message); } finally { setBusy(false); } }} className="space-y-3 text-sm">
    <Field label="Resultado"><select name="tipo" className="w-full rounded-lg border px-3 py-2"><option value="aprovado">Aprovado</option><option value="aprovado_com_observacoes">Aprovado com observações, sem nova revisão</option><option value="exigencia">Exigência de correção</option></select></Field>
    <Field label="Documentos afetados"><div className="space-y-2 rounded-lg border p-3">{(dispatch?.documentos || []).map((doc) => <label key={doc.id} className="flex gap-2"><input type="checkbox" checked={selected.includes(doc.documentoId)} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, doc.documentoId] : prev.filter((id) => id !== doc.documentoId))} />{doc.tituloDocumento} · V{doc.versao}</label>)}</div></Field>
    <Field label="Data"><input name="data" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-lg border px-3 py-2" /></Field>
    <Field label="Motivo / observações"><textarea name="motivo" className="w-full rounded-lg border px-3 py-2" /></Field>
    <Field label="Comprovante obrigatório"><label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 ${fileError ? 'border-red-500 bg-red-50 text-red-800' : ''}`}><Paperclip className="h-4 w-4" /><span>{file?.name || 'Selecionar PDF, imagem ou e-mail exportado'}</span><input type="file" accept="application/pdf,image/*,.eml,.msg" className="hidden" aria-invalid={Boolean(fileError)} onChange={(e) => { setFile(e.target.files?.[0] || null); setFileError(''); }} /></label>{fileError && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{fileError}</p>}</Field>
    <Actions busy={busy} submitLabel="Registrar resposta" onCancel={onClose} />
  </form></Modal>;
};

const FinalDocumentsModal: React.FC<{ protocol: Protocol; onClose: () => void; onSaved: () => Promise<void> }> = ({ protocol, onClose, onSaved }) => {
  const documents = Array.from(new Map((protocol.remessas || []).flatMap((item) => item.documentos).map((doc) => [doc.documentoId, doc])).values()) as any[];
  const pending = documents.filter((doc) => !(protocol.arquivosFinais || []).some((file) => file.documentoId === doc.documentoId));
  const [files, setFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);
  return <Modal title={`Documentos finais aprovados · ${protocol.numeroProtocolo}`} onClose={onClose}>
    {!pending.length ? <p className="text-sm text-emerald-700">Todos os documentos finais já foram preservados e estão disponíveis para a entrega.</p> : <form onSubmit={async (event) => { event.preventDefault(); if (pending.some((doc) => !files[doc.documentoId])) return alert('Anexe o arquivo final aprovado de todos os documentos listados.'); setBusy(true); try { for (const doc of pending) { const attachment = await uploadEvidence(files[doc.documentoId]); await postJson(`/api/protocols/${protocol.id}/final-documents`, { documentoId: doc.documentoId, ...attachment }); } await onSaved(); } catch (error: any) { alert(error.message); } finally { setBusy(false); } }} className="space-y-3 text-sm">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">Este arquivo é diferente do comprovante da certificadora: será o documento que Lucas poderá baixar e entregar ao cliente.</div>
      {pending.map((doc) => <Field key={doc.documentoId} label={`${doc.tituloDocumento} · V${doc.versao}`}><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-xs"><Paperclip className="h-4 w-4" />{files[doc.documentoId]?.name || 'Selecionar documento final aprovado/carimbado'}<input required type="file" accept="application/pdf,image/*" className="hidden" onChange={(event) => setFiles((current) => ({ ...current, [doc.documentoId]: event.target.files?.[0] || undefined as any }))} /></label></Field>)}
      <Actions busy={busy} submitLabel="Preservar e liberar entrega" onCancel={onClose} />
    </form>}
  </Modal>;
};

const SupplementalFinalDocumentModal: React.FC<{ protocol: Protocol; onClose: () => void; onSaved: () => Promise<void> }> = ({ protocol, onClose, onSaved }) => {
  const documents = Array.from(new Map((protocol.remessas || []).flatMap((item) => item.documentos).map((doc) => [doc.documentoId, doc])).values()) as any[];
  const [documentId, setDocumentId] = useState(documents[0]?.documentoId || '');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  return <Modal title={`Documento suplementar · ${protocol.numeroProtocolo}`} onClose={onClose}><form onSubmit={async (event) => { event.preventDefault(); if (!documentId || !file) return alert('Selecione o documento e o arquivo suplementar.'); setBusy(true); try { const attachment = await uploadEvidence(file); await postJson(`/api/protocols/${protocol.id}/final-documents/supplemental`, { documentoId: documentId, ...attachment }); await onSaved(); } catch (error: any) { alert(error.message); } finally { setBusy(false); } }} className="space-y-3 text-sm">
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">O arquivo anterior e a remessa já registrada serão preservados. Ao salvar, somente este novo arquivo reabrirá a entrega para o responsável.</div>
    <Field label="Documento relacionado"><select value={documentId} onChange={(event) => setDocumentId(event.target.value)} className="w-full rounded-lg border px-3 py-2 text-xs">{documents.map((doc) => <option key={doc.documentoId} value={doc.documentoId}>{doc.tituloDocumento} · V{doc.versao}</option>)}</select></Field>
    <Field label="Novo documento final"><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-xs"><Paperclip className="h-4 w-4" />{file?.name || 'Selecionar documento final suplementar'}<input required type="file" accept="application/pdf,image/*" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label></Field>
    <Actions busy={busy} submitLabel="Anexar e reabrir entrega" onCancel={onClose} />
  </form></Modal>;
};

const ResendModal: React.FC<{ protocol: Protocol; detail: ServiceOrderDetail | null; onClose: () => void; onSaved: () => Promise<void> }> = ({ protocol, detail, onClose, onSaved }) => {
  const eligible = (detail?.documentos || []).filter((doc) => doc.aplicavelAnaliseExterna && doc.status === 'aguardando_envio' && doc.versoes?.[0]?.situacaoAprovacao === 'aprovado' && doc.versoes?.[0]?.situacaoRevisao === 'revisado');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => setSelected(eligible.map((doc) => doc.id)), [detail]);
  return <Modal title={`Enviar correção ${Number(protocol.cicloAtual || 0) + 1}`} onClose={onClose}>{!detail ? <p className="text-sm text-slate-500">Carregando documentos...</p> : <form onSubmit={async (event) => { event.preventDefault(); const fields = new FormData(event.currentTarget); setBusy(true); try { await postJson(`/api/protocols/${protocol.id}/resend`, { dataEnvio: fields.get('data'), referenciaExterna: fields.get('referencia'), observacao: fields.get('observacao'), documentos: selected.map((id) => { const doc = detail.documentos.find((item) => item.id === id)!; return { documentoId: id, versao: doc.versaoAtual }; }) }); await onSaved(); } catch (error: any) { alert(error.message); } finally { setBusy(false); } }} className="space-y-3 text-sm">
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Somente versões corrigidas, revisadas e aprovadas tecnicamente podem ser reenviadas.</div>
    <Field label="Documentos corrigidos"><div className="space-y-2 rounded-lg border p-3">{eligible.length ? eligible.map((doc) => <label key={doc.id} className="flex gap-2"><input type="checkbox" checked={selected.includes(doc.id)} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, doc.id] : prev.filter((id) => id !== doc.id))} />{doc.titulo} · V{doc.versaoAtual}</label>) : <p className="text-slate-500">Nenhuma correção pronta para reenvio.</p>}</div></Field>
    <Field label="Data"><input name="data" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-lg border px-3 py-2" /></Field>
    <Field label="Nova referência externa"><input name="referencia" className="w-full rounded-lg border px-3 py-2" /></Field><Field label="Observação"><textarea name="observacao" className="w-full rounded-lg border px-3 py-2" /></Field>
    <Actions busy={busy || !eligible.length} submitLabel={`Enviar correção ${Number(protocol.cicloAtual || 0) + 1}`} onCancel={onClose} />
  </form>}</Modal>;
};

const ConfirmDispatchModal: React.FC<{ protocol: Protocol; onClose: () => void; onSaved: () => Promise<void> }> = ({ protocol, onClose, onSaved }) => {
  const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  return <Modal title={`Comprovar envio · ${protocol.numeroProtocolo}`} onClose={onClose}><form onSubmit={async (e) => { e.preventDefault(); if (!file) return alert('Anexe o recibo, protocolo carimbado ou captura do portal.'); const f = new FormData(e.currentTarget); setBusy(true); try { const attachment = await uploadEvidence(file); await postJson(`/api/protocols/${protocol.id}/confirm-dispatch`, { canal: f.get('canal'), referenciaExterna: f.get('referencia'), comprovanteUrl: attachment.arquivoUrl, comprovanteNome: attachment.arquivoNome }); await onSaved(); } catch (error: any) { alert(error.message); } finally { setBusy(false); } }} className="space-y-3 text-sm"><div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><strong>Você faz fora do sistema:</strong> envia os documentos pelo canal escolhido. <strong>Depois:</strong> anexa aqui a prova. Só então a OS entra em Análise Externa.</div><Field label="Canal"><select name="canal" className="w-full rounded-lg border px-3 py-2"><option value="portal">Portal da certificadora</option><option value="presencial">Entrega presencial</option><option value="correio">Correio</option></select></Field><Field label="Número do protocolo / rastreio"><input name="referencia" className="w-full rounded-lg border px-3 py-2" placeholder="Obrigatório para correio" /></Field><Field label="Comprovante obrigatório"><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3"><Paperclip className="h-4 w-4" />{file?.name || 'Selecionar PDF, imagem ou e-mail exportado'}<input required type="file" accept="application/pdf,image/*,.eml,.msg" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label></Field><Actions busy={busy} submitLabel="Confirmar envio e iniciar análise" onCancel={onClose} /></form></Modal>;
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between border-b pb-3"><h3 className="font-bold text-slate-900">{title}</h3><button onClick={onClose}><X className="h-5 w-5" /></button></div>{children}</div></div>;
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label className="block"><span className="mb-1 block text-xs font-bold text-slate-700">{label}</span>{children}</label>;
const Actions: React.FC<{ busy: boolean; submitLabel: string; onCancel: () => void }> = ({ busy, submitLabel, onCancel }) => <div className="flex justify-end gap-2 border-t pt-3"><button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-xs font-bold">Cancelar</button><button type="submit" disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? 'Salvando...' : submitLabel}</button></div>;
const Metric: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => <div className={`rounded-2xl border bg-white p-4 text-${color}-700`}><p className="text-[10px] font-bold uppercase">{label}</p><p className="font-mono text-2xl font-black">{value}</p></div>;
