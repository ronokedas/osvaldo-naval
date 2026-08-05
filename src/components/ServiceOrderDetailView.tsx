import React, { useState } from 'react';
import { ServiceOrderDetail, User, Document, ExternalSubmission } from '../types';
import { X, Calendar, FileText, Upload, Send, CheckCircle2, AlertTriangle, Truck, Download, History } from 'lucide-react';
import { formatPhone } from '../utils/input-formatters';

interface Props {
  detail: ServiceOrderDetail;
  currentUser: User;
  users: User[];
  onClose: () => void;
  onRefresh: () => void;
  onSchedule: (data: any) => Promise<void>;
  onVistoria: (data: any) => Promise<void>;
  onUploadVersion: (docId: string, file: File, data: any) => Promise<void>;
  onReviewDoc: (docId: string, aprovado: boolean) => Promise<void>;
  onApproveDoc: (docId: string) => Promise<void>;
  onSubmitExternal: (data: any) => Promise<void>;
  onExternalResponse: (data: any) => Promise<void>;
  onDeliver: (data: any) => Promise<void>;
  onComplete: () => Promise<void>;
}

const hasPerm = (u: User | null, p: string) => !!u && (u.role === 'admin' || (u.permissions || []).includes(p));

export const ServiceOrderDetailView: React.FC<Props> = ({
  detail, currentUser, users, onClose, onRefresh,
  onSchedule, onVistoria, onUploadVersion, onReviewDoc, onApproveDoc,
  onSubmitExternal, onExternalResponse, onDeliver, onComplete,
}) => {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showUploadFor, setShowUploadFor] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [showDeliver, setShowDeliver] = useState(false);
  const [loading, setLoading] = useState(false);

  const sched = detail.agendamento?.[0];

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

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto p-4">
      <div className="max-w-5xl mx-auto my-6 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold font-mono">{detail.numero}</h2>
            <p className="text-sm text-slate-300">{detail.statusLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRefresh} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold cursor-pointer">Atualizar</button>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Context */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase text-slate-400 font-bold">Cliente</p><p className="font-bold text-slate-800">{detail.proposta?.clienteNome || detail.embarcacao?.clienteNome || '—'}</p></div>
            <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase text-slate-400 font-bold">Embarcação</p><p className="font-bold text-slate-800">{detail.embarcacao?.nome || detail.proposta?.embarcacaoNome || '—'}</p></div>
            <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase text-slate-400 font-bold">Técnico</p><p className="font-bold text-slate-800">{detail.tecnicoResponsavel?.nome || 'Não definido'}</p></div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {hasPerm(currentUser, 'registrar_aceite_agendar') && (
              <button onClick={() => setShowSchedule(true)} className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"><Calendar className="w-3.5 h-3.5" /> {sched?.data ? 'Editar Agendamento' : 'Agendar Visita'}</button>
            )}
            {hasPerm(currentUser, 'executar_vistoria') && ['visita_agendada', 'vistoria_em_execucao'].includes(detail.status) && (
              <button onClick={() => onVistoria({ concluirVistoria: true })} className="inline-flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"><FileText className="w-3.5 h-3.5" /> Iniciar/Concluir Vistoria</button>
            )}
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
              <button onClick={() => onComplete()} className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"><CheckCircle2 className="w-3.5 h-3.5" /> Concluir OS</button>
            )}
          </div>

          {/* Agendamento */}
          <div>
            <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-1"><Calendar className="w-4 h-4" /> Agendamento</h3>
            {sched?.data ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
                <p><span className="font-bold">Data:</span> {sched.data} {sched.horario ? `às ${sched.horario}` : ''}</p>
                <p><span className="font-bold">Local:</span> {sched.local || '—'} · <span className="font-bold">Contato:</span> {sched.contato || '—'}</p>
                {sched.observacoes && <p className="text-slate-600 mt-1">{sched.observacoes}</p>}
              </div>
            ) : <p className="text-sm text-slate-400">Sem agendamento definido.</p>}
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
                      <button onClick={() => onReviewDoc(doc.id, true)} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer">Revisar OK</button>
                      <button onClick={() => onReviewDoc(doc.id, false)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer">Pedir Correções</button>
                    </div>
                  )}
                  {hasPerm(currentUser, 'aprovar_tecnicamente') && doc.status === 'aguardando_envio' && (
                    <div className="p-2 bg-sky-50"><button onClick={() => onApproveDoc(doc.id)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer">Aprovar Tecnicamente</button></div>
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
                      <span className="text-xs text-slate-500">{sub.dataEnvio}</span>
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
                    <p className="text-[11px] text-slate-400">{ev.autorNome} · {new Date(ev.createdAt || '').toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
              {(detail.eventos || []).length === 0 && <p className="text-sm text-slate-400">Sem eventos registrados.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSchedule && (
        <Modal title="Agendar Visita" onClose={() => setShowSchedule(false)}>
          <form onSubmit={async (e) => { e.preventDefault(); const f = e.target as any; await onSchedule({ status: 'agendado', data: f.data.value, horario: f.horario.value, local: f.local.value, contato: f.contato.value, observacoes: f.obs.value, tecnicoResponsavelId: f.tecnico.value || undefined }); setShowSchedule(false); onRefresh(); }} className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data"><input name="data" type="date" required defaultValue={sched?.data} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
              <Field label="Horário"><input name="horario" type="time" defaultValue={sched?.horario} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            </div>
            <Field label="Local"><input name="local" defaultValue={sched?.local} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Contato"><input name="contato" inputMode="tel" placeholder="(91) 99999-9999" defaultValue={sched?.contato} onChange={(e) => { e.currentTarget.value = formatPhone(e.currentTarget.value); }} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Técnico Responsável">
              <select name="tecnico" defaultValue={detail.tecnicoResponsavel?.id || ''} className="w-full px-3 py-2 border rounded-lg text-xs">
                <option value="">Selecionar</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </Field>
            <Field label="Observações"><textarea name="obs" defaultValue={sched?.observacoes} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowSchedule(false)} className="px-3 py-1.5 border rounded-lg text-xs">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer">Salvar</button>
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
            <Field label="Submissão"><select name="sub" required className="w-full px-3 py-2 border rounded-lg text-xs">{(detail.submissoesExternas || []).map((s) => <option key={s.id} value={s.id}>{s.orgaoOuCertificadora} {s.versaoEnviada ? `(V${s.versaoEnviada})` : ''} · {s.dataEnvio}</option>)}</select></Field>
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
  <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl">
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
