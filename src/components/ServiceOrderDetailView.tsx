import React, { useState } from 'react';
import { ServiceOrderDetail, User, Document, ExternalSubmission } from '../types';
import { X, Calendar, FileText, Upload, Send, CheckCircle2, AlertTriangle, Truck, Download, History, ChevronRight } from 'lucide-react';
import { formatPhone } from '../utils/input-formatters';
import { formatDateBR, formatDateTimeBR } from '../utils/date-formatters';
import { OsWorkflowStepper } from './OsWorkflowStepper';

interface Props {
  detail: ServiceOrderDetail;
  currentUser: User;
  users: User[];
  onClose: () => void;
  onRefresh: () => void;
  onScheduleItem: (itemId: string, data: any) => Promise<void>;
  onUploadVersion: (docId: string, file: File, data: any) => Promise<void>;
  onReviewDoc: (docId: string, aprovado: boolean) => Promise<void>;
  onApproveDoc: (docId: string) => Promise<void>;
  onSubmitExternal: (data: any) => Promise<void>;
  onExternalResponse: (data: any) => Promise<void>;
  onDeliver: (data: any) => Promise<void>;
  onComplete: () => Promise<void>;
}

const hasPerm = (u: User | null, p: string) => !!u && (u.role === 'admin' || (u.permissions || []).includes(p));
const SCHEDULE_TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, '0');
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

export const ServiceOrderDetailView: React.FC<Props> = ({
  detail, currentUser, users, onClose, onRefresh,
  onScheduleItem, onUploadVersion, onReviewDoc, onApproveDoc,
  onSubmitExternal, onExternalResponse, onDeliver, onComplete,
}) => {
  const [scheduleItemId, setScheduleItemId] = useState<string | null>(null);
  const [showUploadFor, setShowUploadFor] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [showDeliver, setShowDeliver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewingDocId, setReviewingDocId] = useState<string | null>(null);

  const unassignedItems = (detail.itens || []).filter((item) => !item.tecnicoResponsavelId);
  const unscheduledItems = (detail.itens || []).filter((item) => !item.dataAgendada || !item.horarioAgendado);
  const scheduledItems = (detail.itens || []).filter((item) => item.dataAgendada && item.horarioAgendado);
  const scheduleItem = (detail.itens || []).find((item) => item.id === scheduleItemId);

  const handleUpload = async (docId: string, e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const file = form.file.files[0];
    if (!file) return;
    setLoading(true);
    try {
      await onUploadVersion(docId, file, {
        origem: detail.status === 'exigencia_externa' ? 'exigencia_externa' : 'correcao_interna',
        comentario: form.comentario?.value || '',
      });
      form.reset();
      setShowUploadFor(null);
      onRefresh();
    } finally { setLoading(false); }
  };

  const updateServiceItem = async (itemId: string, payload: Record<string, unknown>) => {
    const response = await fetch(`/api/service-orders/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar o serviço.');
    await onRefresh();
  };

  const addObservation = async (itemId: string, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const field = form.elements.namedItem('texto') as HTMLTextAreaElement;
    const texto = field.value.trim();
    if (!texto) return;
    const response = await fetch(`/api/service-orders/items/${itemId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível enviar a observação.');
    form.reset();
    await onRefresh();
  };

  const handleReview = async (docId: string, aprovado: boolean) => {
    if (reviewingDocId) return;
    setReviewingDocId(docId);
    try {
      await onReviewDoc(docId, aprovado);
      await onRefresh();
      window.alert(aprovado ? 'Documento revisado com sucesso.' : 'Pedido de correção registrado e enviado ao responsável.');
    } catch (error: any) {
      window.alert(error?.message || 'Não foi possível registrar a revisão.');
    } finally {
      setReviewingDocId(null);
    }
  };

  const runAndRefresh = async (action: () => Promise<void>, successMessage?: string) => {
    try {
      await action();
      await onRefresh();
      if (successMessage) window.alert(successMessage);
    } catch (error: any) {
      window.alert(error?.message || 'Não foi possível concluir a operação.');
    }
  };

  return (
    <div onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4">
      <div className="max-w-5xl mx-auto my-6 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold font-mono">{detail.numero}</h2>
            <p className="text-sm text-slate-300">{detail.statusLabel}</p>
            {detail.proposta?.numero && <p className="mt-1 text-xs font-bold text-blue-300">Proposta vinculada: {detail.proposta.numero}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRefresh} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold cursor-pointer">Atualizar</button>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Stepper de Progresso Visual */}
          <OsWorkflowStepper status={detail.status} />

          {/* Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3"><p className="text-[10px] uppercase text-blue-500 font-bold">Referência comercial</p><p className="font-mono font-bold text-blue-900">{detail.proposta?.numero || 'Sem proposta vinculada'}</p></div>
            <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase text-slate-400 font-bold">Cliente</p><p className="font-bold text-slate-800">{detail.proposta?.clienteNome || detail.embarcacao?.clienteNome || '—'}</p></div>
            <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase text-slate-400 font-bold">Embarcação</p><p className="font-bold text-slate-800">{detail.embarcacao?.nome || detail.proposta?.embarcacaoNome || '—'}</p></div>
            <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase text-slate-400 font-bold">Serviços agendados</p><p className="font-bold text-slate-800">{scheduledItems.length} de {detail.itens?.length || 0}</p></div>
          </div>

          {currentUser.role === 'admin' && unassignedItems.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
              <p className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Faltam funcionários em {unassignedItems.length} serviço(s)</p>
              <p className="mt-1 text-xs">Selecione abaixo o funcionário responsável por cada serviço antes de iniciar a execução.</p>
              <ul className="mt-2 list-disc pl-5 text-xs">{unassignedItems.map((item) => <li key={item.id}>{item.descricao}</li>)}</ul>
            </div>
          )}

          {currentUser.role === 'admin' && unscheduledItems.length > 0 && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-900">
              <p className="font-bold flex items-center gap-2"><Calendar className="w-4 h-4" /> Faltam agendamentos em {unscheduledItems.length} serviço(s)</p>
              <p className="mt-1 text-xs">Use “Agendar serviço” em cada item. O botão “Iniciar serviço” será liberado ao responsável somente depois disso.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {(detail.status === 'aguardando_envio_externo') && hasPerm(currentUser, 'registrar_envio_resposta_externa') && (
              <button onClick={() => setShowSubmit(true)} className="inline-flex items-center gap-1 bg-sky-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"><Send className="w-3.5 h-3.5" /> Registrar Envio Externo</button>
            )}
            {(detail.status === 'em_analise_externa') && hasPerm(currentUser, 'registrar_envio_resposta_externa') && (
              <button onClick={() => setShowResponse(true)} className="inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"><AlertTriangle className="w-3.5 h-3.5" /> Registrar Resposta</button>
            )}
            {hasPerm(currentUser, 'entregar_concluir') && detail.status === 'aguardando_entrega' && (
              <button onClick={() => setShowDeliver(true)} className="inline-flex items-center gap-1 bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"><Truck className="w-3.5 h-3.5" /> Registrar Entrega</button>
            )}
            {hasPerm(currentUser, 'entregar_concluir') && detail.status === 'aguardando_entrega' && (
              <button onClick={() => runAndRefresh(onComplete, 'Ordem de Serviço concluída.')} className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"><CheckCircle2 className="w-3.5 h-3.5" /> Concluir OS</button>
            )}
          </div>

          {/* Documentos */}
          <div>
            <h3 className="font-bold text-sm text-slate-700 mb-2">Serviços da OS</h3>
            <div className="space-y-3">{(detail.itens || []).map((item: any) => {
              const canEdit = currentUser.role === 'admin' || item.tecnicoResponsavelId === currentUser.id;
              const assignedUser = users.find((user) => user.id === item.tecnicoResponsavelId) || (item.tecnicoResponsavelId === currentUser.id ? currentUser : undefined);
              const isScheduled = Boolean(item.dataAgendada && item.horarioAgendado);
              const statusLabel = item.status === 'em_execucao' ? 'Em execução' : item.status === 'concluido' ? 'Concluído' : 'Aguardando início';
              return (
                <div key={item.id} className={`border rounded-xl overflow-hidden ${item.tecnicoResponsavelId ? 'border-slate-200' : 'border-amber-300 bg-amber-50/60'}`}>
                  <div className="p-4 text-sm flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <p className="font-bold">{item.descricao}</p>
                      <p className={`text-xs font-bold mt-1 ${item.status === 'em_execucao' ? 'text-blue-700' : item.status === 'concluido' ? 'text-emerald-700' : 'text-slate-500'}`}>Status: {statusLabel}</p>
                      {assignedUser ? <p className="text-xs font-bold text-blue-700 mt-1">Responsável: {assignedUser.nome}</p> : <p className="text-xs font-bold text-amber-800 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Falta atribuir funcionário</p>}
                      {isScheduled ? <p className="mt-1 flex items-center gap-1 text-xs font-bold text-indigo-700"><Calendar className="h-3 w-3" /> Agendado: {formatDateBR(item.dataAgendada)} às {item.horarioAgendado}{item.localAgendado ? ` · ${item.localAgendado}` : ''}</p> : <p className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-700"><Calendar className="h-3 w-3" /> Aguardando agendamento</p>}
                      {item.relatorioUrl && <a href={item.relatorioUrl} target="_blank" rel="noreferrer" className="block mt-1 text-xs font-bold text-blue-600 underline">Abrir documento: {item.relatorioNome || 'anexo'}</a>}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {currentUser.role === 'admin' && <select aria-label={`Funcionário responsável por ${item.descricao}`} value={item.tecnicoResponsavelId || ''} onChange={async e => { try { await updateServiceItem(item.id, { tecnicoResponsavelId: e.target.value }); } catch (error: any) { alert(error.message); } }} className={`min-w-52 border rounded-lg px-2 py-2 text-xs ${item.tecnicoResponsavelId ? 'bg-white' : 'border-amber-400 bg-amber-50 font-bold text-amber-900'}`}><option value="">Selecionar funcionário</option>{users.filter((user) => user.ativo).map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select>}
                      {currentUser.role === 'admin' && <button onClick={() => setScheduleItemId(item.id)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white">{isScheduled ? 'Editar agendamento' : 'Agendar serviço'}</button>}
                      {canEdit && item.status === 'pendente' && isScheduled && <button onClick={() => updateServiceItem(item.id, { status: 'em_execucao' }).catch((error) => alert(error.message))} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Iniciar serviço</button>}
                      {canEdit && item.status === 'pendente' && !isScheduled && currentUser.role !== 'admin' && <button disabled className="cursor-not-allowed rounded-lg bg-slate-300 px-3 py-2 text-xs font-bold text-slate-600">Aguardando agendamento</button>}
                      {canEdit && item.status === 'em_execucao' && <button onClick={() => updateServiceItem(item.id, { status: 'concluido' }).catch((error) => alert(error.message))} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Concluir serviço</button>}
                      {currentUser.role === 'admin' && item.status === 'concluido' && <button onClick={() => updateServiceItem(item.id, { status: 'em_execucao' }).catch((error) => alert(error.message))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">Reabrir</button>}
                      {canEdit && <label className="border rounded-lg px-3 py-2 text-xs cursor-pointer text-center text-blue-700 bg-white">Anexar documento<input type="file" className="hidden" onChange={async e => { try { const file=e.target.files?.[0]; if(!file)return; const fd=new FormData();fd.append('file',file); const upload=await fetch('/api/upload',{method:'POST',body:fd}); const data=await upload.json(); if(!upload.ok)throw new Error(data.error||'Falha no upload'); await updateServiceItem(item.id,{relatorioUrl:data.url,relatorioNome:data.fileName}); } catch(error:any) { alert(error.message); } }}/></label>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="border-t border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-bold text-slate-700 mb-2">Comunicação e observações</p>
                      {(item.observacoes || []).length > 0 && <div className="mb-3 max-h-36 space-y-2 overflow-y-auto">{item.observacoes.map((comment: any) => <div key={comment.id} className="rounded-lg border border-slate-200 bg-white p-2 text-xs"><p className="font-bold text-slate-800">{comment.autorNome} <span className="font-normal text-slate-400">· {formatDateTimeBR(comment.createdAt)}</span></p><p className="mt-1 whitespace-pre-wrap text-slate-600">{comment.texto}</p></div>)}</div>}
                      <form onSubmit={(event) => addObservation(item.id, event).catch((error) => alert(error.message))} className="flex flex-col gap-2 sm:flex-row">
                        <textarea name="texto" required maxLength={2000} placeholder="Escreva uma observação para o administrador ou responsável..." className="min-h-16 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" />
                        <button type="submit" className="self-end rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white">Enviar observação</button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}</div>
          </div>

          {/* Documentos */}
          <div>
            <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-1"><FileText className="w-4 h-4" /> Documentos ({detail.documentos?.length || 0})</h3>
            <div className="space-y-3">
              {(detail.documentos || []).map((doc: Document) => (
                <div key={doc.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-slate-50">
                    <div>
                      <p className="font-bold text-sm text-slate-800">{doc.titulo}</p>
                      <p className="text-[11px] text-slate-500">Status: {doc.status} · V{doc.versaoAtual}</p>
                    </div>
                    {hasPerm(currentUser, 'anexar_editar_versoes') && (
                      <button onClick={() => setShowUploadFor(showUploadFor === doc.id ? null : doc.id)} className="inline-flex items-center gap-1 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"><Upload className="w-3.5 h-3.5" /> Nova Versão</button>
                    )}
                  </div>
                  {showUploadFor === doc.id && (
                    <form onSubmit={(e) => handleUpload(doc.id, e)} className="p-3 bg-white space-y-2 flex flex-col sm:flex-row gap-2 items-end">
                      <input name="file" type="file" required className="flex-1 text-xs" />
                      <input name="comentario" placeholder="Comentário da alteração" className="flex-1 px-3 py-1.5 border rounded-lg text-xs" />
                      <button type="submit" disabled={loading} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer">{loading ? 'Enviando...' : 'Enviar'}</button>
                    </form>
                  )}
                  <div className="divide-y divide-slate-100">
                    {(doc.versoes || []).map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between p-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-800">{v.versaoLabel}</span>
                          <span className="text-slate-600 truncate max-w-[200px]">{v.arquivoNomeOriginal}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <span>{v.autorNome}</span>
                          {v.situacaoAprovacao === 'aprovado' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          <a href={`/uploads/${v.arquivoNomeFisico}`} target="_blank" rel="noreferrer" className="p-1 hover:text-blue-600"><Download className="w-4 h-4" /></a>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasPerm(currentUser, 'revisar_documentos') && doc.status === 'em_revisao' && (
                    <div className="p-2 bg-amber-50 flex gap-2">
                      <button disabled={reviewingDocId === doc.id} onClick={() => handleReview(doc.id, true)} className="px-3 py-1 bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-xs font-bold cursor-pointer">{reviewingDocId === doc.id ? 'Salvando...' : 'Revisar OK'}</button>
                      <button disabled={reviewingDocId === doc.id} onClick={() => handleReview(doc.id, false)} className="px-3 py-1 bg-red-600 disabled:opacity-60 text-white rounded-lg text-xs font-bold cursor-pointer">{reviewingDocId === doc.id ? 'Salvando...' : 'Pedir Correções'}</button>
                    </div>
                  )}
                  {hasPerm(currentUser, 'aprovar_tecnicamente') && doc.status === 'aguardando_envio' && (
                    <div className="p-2 bg-sky-50"><button onClick={() => runAndRefresh(() => onApproveDoc(doc.id), 'Documento aprovado tecnicamente.')} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer">Aprovar Tecnicamente</button></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submissões externas */}
          <div>
            <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-1"><Send className="w-4 h-4" /> Submissões ao Órgão</h3>
            {(detail.submissoesExternas || []).length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum envio registrado.</p>
            ) : (
              <div className="space-y-2">
                {(detail.submissoesExternas || []).map((sub: ExternalSubmission) => (
                  <div key={sub.id} className="border border-slate-200 rounded-xl p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{sub.orgaoOuCertificadora} {sub.versaoEnviada ? `(V${sub.versaoEnviada})` : ''}</p>
                      <span className="text-xs text-slate-500">{formatDateBR(sub.dataEnvio)}</span>
                    </div>
                    <p className="text-xs text-slate-500">Protocolo: {sub.protocolo || '—'} · {sub.observacao || ''}</p>
                    {(sub.respostas || []).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {(sub.respostas || []).map((r) => (
                          <p key={r.id} className={`text-xs font-bold ${r.tipo === 'aprovacao' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {r.tipo === 'aprovacao' ? `✓ Aprovado${r.versaoAprovada ? ` (V${r.versaoAprovada})` : ''}` : `✗ Exigência: ${r.motivo}`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cronograma / eventos */}
          <div>
            <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-1"><History className="w-4 h-4" /> Linha do Tempo</h3>
            <div className="space-y-2">
              {(detail.eventos || []).map((ev, i) => (
                <div key={ev.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-slate-800">{ev.descricao}</p>
                    <p className="text-[11px] text-slate-400">{ev.autorNome} · {formatDateTimeBR(ev.createdAt)}</p>
                  </div>
                </div>
              ))}
              {(detail.eventos || []).length === 0 && <p className="text-sm text-slate-400">Sem eventos registrados.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {scheduleItem && (
        <Modal title={`Agendar serviço: ${scheduleItem.descricao}`} onClose={() => setScheduleItemId(null)}>
          <form onSubmit={async (e) => { e.preventDefault(); const f = e.target as any; try { await onScheduleItem(scheduleItem.id, { data: f.data.value, horario: f.horario.value, local: f.local.value, contato: f.contato.value, observacoes: f.obs.value, tecnicoResponsavelId: f.tecnico.value || undefined }); setScheduleItemId(null); await onRefresh(); } catch (error: any) { alert(error.message); } }} className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data"><input name="data" type="date" required defaultValue={scheduleItem.dataAgendada || ''} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
              <Field label="Horário">
                <select name="horario" required defaultValue={scheduleItem.horarioAgendado || ''} className="w-full px-3 py-2 border rounded-lg text-xs bg-white">
                  <option value="" disabled>Selecionar horário</option>
                  {SCHEDULE_TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Local"><input name="local" defaultValue={scheduleItem.localAgendado || ''} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Contato"><input name="contato" inputMode="tel" placeholder="(91) 99999-9999" defaultValue={scheduleItem.contatoAgendamento || ''} onChange={(e) => { e.currentTarget.value = formatPhone(e.currentTarget.value); }} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Funcionário responsável">
              <select name="tecnico" required defaultValue={scheduleItem.tecnicoResponsavelId || ''} className="w-full px-3 py-2 border rounded-lg text-xs">
                <option value="">Selecionar</option>
                {users.filter((u) => u.ativo).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </Field>
            <Field label="Observações"><textarea name="obs" defaultValue={scheduleItem.observacoesAgendamento || ''} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setScheduleItemId(null)} className="px-3 py-1.5 border rounded-lg text-xs">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer">Salvar agendamento</button>
            </div>
          </form>
        </Modal>
      )}

      {showSubmit && (
        <Modal title="Registrar Envio Externo" onClose={() => setShowSubmit(false)}>
          <form onSubmit={async (e) => { e.preventDefault(); const f = e.target as any; const docId = f.doc.value; const versao = Number(f.versao.value); await onSubmitExternal({ documentoId: docId || undefined, versaoEnviada: versao || undefined, orgaoOuCertificadora: f.orgao.value, protocolo: f.protocolo.value, observacao: f.obs.value }); setShowSubmit(false); onRefresh(); }} className="space-y-3 text-sm">
            <Field label="Documento"><select name="doc" className="w-full px-3 py-2 border rounded-lg text-xs"><option value="">Selecionar</option>{(detail.documentos || []).map((d) => <option key={d.id} value={d.id}>{d.titulo} (V{d.versaoAtual})</option>)}</select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Versão Enviada"><input name="versao" type="number" min={1} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
              <Field label="Data Envio"><input name="data" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            </div>
            <Field label="Órgão/Certificadora"><input name="orgao" required className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Protocolo"><input name="protocolo" className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Observação"><textarea name="obs" className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowSubmit(false)} className="px-3 py-1.5 border rounded-lg text-xs">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold cursor-pointer">Registrar</button>
            </div>
          </form>
        </Modal>
      )}

      {showResponse && (
        <Modal title="Registrar Resposta do Órgão" onClose={() => setShowResponse(false)}>
          <form onSubmit={async (e) => { e.preventDefault(); const f = e.target as any; const tipo = f.tipo.value; await onExternalResponse({ submissaoId: f.sub.value, tipo, motivo: f.motivo.value, versaoAprovada: tipo === 'aprovacao' ? Number(f.versao.value) : undefined }); setShowResponse(false); onRefresh(); }} className="space-y-3 text-sm">
            <Field label="Submissão"><select name="sub" required className="w-full px-3 py-2 border rounded-lg text-xs">{(detail.submissoesExternas || []).map((s) => <option key={s.id} value={s.id}>{s.orgaoOuCertificadora} {s.versaoEnviada ? `(V${s.versaoEnviada})` : ''} · {formatDateBR(s.dataEnvio)}</option>)}</select></Field>
            <Field label="Tipo"><select name="tipo" className="w-full px-3 py-2 border rounded-lg text-xs"><option value="aprovacao">Aprovação</option><option value="exigencia">Exigência</option></select></Field>
            <Field label="Motivo (para exigência)"><textarea name="motivo" className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Versão Aprovada (para aprovação)"><input name="versao" type="number" min={1} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowResponse(false)} className="px-3 py-1.5 border rounded-lg text-xs">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold cursor-pointer">Registrar</button>
            </div>
          </form>
        </Modal>
      )}

      {showDeliver && (
        <Modal title="Registrar Entrega" onClose={() => setShowDeliver(false)}>
          <form onSubmit={async (e) => { e.preventDefault(); const f = e.target as any; await onDeliver({ dataEntrega: f.data.value, meioEntrega: f.meio.value, nomeRecebedor: f.recebedor.value }); setShowDeliver(false); onRefresh(); }} className="space-y-3 text-sm">
            <Field label="Data Entrega"><input name="data" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Meio de Entrega"><input name="meio" required placeholder="Ex: e-mail, correio, entrega presencial" className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Nome do Recebedor"><input name="recebedor" required className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowDeliver(false)} className="px-3 py-1.5 border rounded-lg text-xs">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold cursor-pointer">Registrar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-3 sm:p-4">
    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-4 sm:p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
      </div>
      {children}
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block font-bold text-slate-700 mb-1 text-xs">{label}</label>
    {children}
  </div>
);
