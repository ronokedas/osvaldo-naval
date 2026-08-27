import React, { useState } from 'react';
import { ServiceOrderDetail, User, Document, ExternalSubmission } from '../types';
import { X, Calendar, FileText, Upload, Send, CheckCircle2, AlertTriangle, Truck, Download, History, ChevronRight, Camera, Paperclip, RotateCcw } from 'lucide-react';
import { formatPhone } from '../utils/input-formatters';
import { formatDateBR, formatDateTimeBR } from '../utils/date-formatters';
import { OsWorkflowStepper } from './OsWorkflowStepper';
import { compressImage } from '../utils/image-compressor';

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
  onOpenProtocols: () => void;
}

const hasPerm = (u: User | null, p: string) => !!u && (u.role === 'admin' || (u.permissions || []).includes(p));
const profileInitials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
const avatarTone = (name: string) => {
  const tones = ['bg-blue-100 text-blue-800', 'bg-indigo-100 text-indigo-800', 'bg-cyan-100 text-cyan-800', 'bg-violet-100 text-violet-800'];
  return tones[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length];
};
const roleLabel = (user: User) => user.cargo?.trim() || (user.role === 'admin' ? 'Administrador' : user.role === 'financeiro' ? 'Financeiro' : 'Técnico');
const serviceStatusPresentation = (status: string) => status === 'concluido'
  ? { label: 'Concluído', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
  : status === 'em_execucao'
    ? { label: 'Em execução', className: 'bg-blue-50 text-blue-800 border-blue-200' }
    : { label: 'Aguardando início', className: 'bg-amber-50 text-amber-800 border-amber-200' };
const SCHEDULE_TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, '0');
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});



const ExternalSubmissionModal: React.FC<{ detail: any, onClose: () => void, onSubmit: (data: any) => Promise<void>, onRefresh: () => void }> = ({ detail, onClose, onSubmit, onRefresh }) => {
  const [orgaoSelect, setOrgaoSelect] = useState('Capitania Fluvial');
  const [orgaoText, setOrgaoText] = useState('');
  const [gerarProtocolo, setGerarProtocolo] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [versaoEnviada, setVersaoEnviada] = useState(1);

  const handleDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docId = e.target.value;
    setSelectedDocId(docId);
    const doc = (detail.documentos || []).find((d: any) => d.id === docId);
    if (doc) {
      setVersaoEnviada(doc.versaoAtual || 1);
    }
  };

  return (
    <Modal title="Registrar Envio Externo" onClose={onClose}>
      <form onSubmit={async (e) => {
        e.preventDefault();
        try {
          const f = e.target as any;
          const docId = f.doc.value;
          const versao = Number(f.versao.value);
          
          await onSubmit({
            documentoId: docId || undefined,
            versaoEnviada: versao || undefined,
            orgaoOuCertificadora: orgaoSelect === 'Outro' ? orgaoText : orgaoSelect,
            protocolo: f.protocolo?.value || '',
            observacao: f.obs.value,
            gerarProtocoloOFicial: gerarProtocolo
          });
          
          onClose();
          onRefresh();
        } catch (error: any) {
          window.alert(error?.message || 'Erro ao registrar envio externo.');
        }
      }} className="space-y-3 text-sm">
        
        <Field label="Documento">
          <select name="doc" value={selectedDocId} onChange={handleDocChange} className="w-full px-3 py-2 border rounded-lg text-xs">
            <option value="">Selecionar Documento</option>
            {(detail.documentos || []).map((d: any) => (
              <option key={d.id} value={d.id}>{d.titulo} (V{d.versaoAtual})</option>
            ))}
          </select>
        </Field>
        
        <div className="grid grid-cols-2 gap-3">
          <Field label="Versão Enviada">
            <input name="versao" type="number" min={1} value={versaoEnviada} onChange={e => setVersaoEnviada(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-xs" />
          </Field>
          <Field label="Data Envio">
            <input name="data" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg text-xs" />
          </Field>
        </div>
        
        <Field label="Órgão / Certificadora / Cliente">
          <select 
            value={orgaoSelect}
            onChange={(e) => setOrgaoSelect(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-xs font-medium bg-slate-50"
          >
            <option value="Capitania Fluvial">Capitania Fluvial (Marinha)</option>
            <option value="DPC">DPC</option>
            <option value="ABS">ABS</option>
            <option value="DNV">DNV</option>
            <option value="RBNA">RBNA</option>
            <option value="Cliente">Cliente Direto (Armador)</option>
            <option value="Outro">Outro...</option>
          </select>
        </Field>
        
        {orgaoSelect === 'Outro' && (
          <Field label="Especificar Órgão/Empresa">
            <input 
              value={orgaoText}
              onChange={(e) => setOrgaoText(e.target.value)}
              required 
              placeholder="Digite o nome..."
              className="w-full px-3 py-2 border rounded-lg text-xs" 
            />
          </Field>
        )}

        <Field label="Número do Protocolo / Rastreio (Opcional)">
          <input name="protocolo" placeholder="Ex: RJ-123456/2026" className="w-full px-3 py-2 border rounded-lg text-xs" />
        </Field>
        
        <Field label="Observação">
          <textarea name="obs" className="w-full px-3 py-2 border rounded-lg text-xs" />
        </Field>

        <label className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition">
          <input 
            type="checkbox"
            checked={gerarProtocolo}
            onChange={(e) => setGerarProtocolo(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-blue-900">Gerar Protocolo Oficial na aba Protocolos</span>
            <span className="text-[10px] text-blue-700 font-medium">Isso permite gerar um recibo em PDF para assinaturas.</span>
          </div>
        </label>
        
        <div className="flex justify-end gap-2 pt-2 border-t">
          <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded-lg text-xs cursor-pointer">Cancelar</button>
          <button type="submit" className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold cursor-pointer transition">
            Registrar Envio
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const ServiceOrderDetailView: React.FC<Props> = ({
  detail, currentUser, users, onClose, onRefresh,
  onScheduleItem, onUploadVersion, onReviewDoc, onApproveDoc,
  onSubmitExternal, onExternalResponse, onDeliver, onComplete,
  onOpenProtocols,
}) => {
  const [scheduleItemId, setScheduleItemId] = useState<string | null>(null);
  const [showUploadFor, setShowUploadFor] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [showDeliver, setShowDeliver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewingDocId, setReviewingDocId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => void } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [deliveryEvidence, setDeliveryEvidence] = useState<File | null>(null);
  const [selectedDeliveryFiles, setSelectedDeliveryFiles] = useState<string[]>([]);

  const unassignedItems = (detail.itens || []).filter((item) => !item.tecnicoResponsavelId);
  const unscheduledItems = (detail.itens || []).filter((item) => !item.dataAgendada || !item.horarioAgendado);
  const scheduledItems = (detail.itens || []).filter((item) => item.dataAgendada && item.horarioAgendado);
  const scheduleItem = (detail.itens || []).find((item) => item.id === scheduleItemId);
  const delivery = detail.entregas?.[0];
  const deliveredFileIds = new Set((delivery?.remessas || []).flatMap((dispatch: any) => (dispatch.arquivosAprovados || []).map((file: any) => file.id)));
  const finalFilesPendingDelivery = (delivery?.documentosAprovados || []).filter((file: any) => !deliveredFileIds.has(file.id));
  const deliveryActionPending = Boolean(
    delivery
    && ['pendente', 'em_entrega', 'aguardando_complemento'].includes(delivery.status)
    && (currentUser.role === 'admin' || delivery.responsavelId === currentUser.id),
  );
  const visibleCompletionBlockers = (detail.bloqueiosConclusao || []).filter((item) => currentUser.role !== 'tecnico' || item.tipo !== 'financeiro');
  const workflowStage = detail.status === 'aguardando_agendamento' ? 1
    : ['visita_agendada', 'vistoria_em_execucao'].includes(detail.status) ? 2
    : ['documentacao_em_elaboracao', 'revisao_interna'].includes(detail.status) ? 3
    : ['aguardando_envio_externo', 'em_analise_externa', 'exigencia_externa', 'aprovado_externamente'].includes(detail.status) ? 4
    : detail.status === 'aguardando_entrega' ? 5 : 6;
  const pendingServices = (detail.itens || []).filter((item) => item.status !== 'concluido');
  // Older OS records may have advanced before every assigned service was completed.
  // Keep the interface focused on the unfinished operational step until it is resolved.
  const currentStage = workflowStage === 1 ? 1 : pendingServices.length ? 2 : workflowStage;
  const stageBlockers = visibleCompletionBlockers.filter((blocker) => {
    if (currentStage === 2) return blocker.tipo === 'servicos';
    if (currentStage === 3) return blocker.tipo === 'documento';
    if (currentStage === 4) return ['documento', 'protocolo'].includes(blocker.tipo);
    if (currentStage === 5) return ['arquivo_final', 'entrega', 'financeiro'].includes(blocker.tipo);
    return currentStage === 6;
  });
  const stageGuidance = currentStage === 1
    ? unassignedItems.length || unscheduledItems.length
      ? { tone: 'amber', title: 'Prepare os serviços para a execução', detail: unassignedItems.length ? `Atribua um responsável aos ${unassignedItems.length} serviço(s) pendente(s) e defina o agendamento.` : `Defina data e horário para os ${unscheduledItems.length} serviço(s) pendente(s).` }
      : null
    : currentStage === 2 && pendingServices.length
      ? { tone: 'blue', title: 'Aguardando execução dos serviços', detail: `${pendingServices.length} serviço(s) ainda precisa(m) ser iniciado(s) e concluído(s). Os documentos são opcionais e já podem ser anexados para compor o futuro dossiê.` }
      : currentStage === 3
        ? { tone: 'indigo', title: 'Documentação em elaboração', detail: stageBlockers.length ? `${stageBlockers.length} documento(s) ainda precisa(m) de elaboração ou revisão.` : 'Finalize a elaboração e a revisão dos documentos desta OS.' }
        : currentStage === 4
          ? { tone: 'sky', title: detail.status === 'exigencia_externa' ? 'Exigência externa em tratamento' : 'Análise externa em andamento', detail: detail.status === 'aguardando_envio_externo' ? 'Prepare o dossiê e registre o envio no módulo Protocolos & Entregas.' : 'Acompanhe o retorno da certificadora ou órgão responsável.' }
          : currentStage === 5
            ? { tone: 'orange', title: 'Entrega e pendências', detail: 'Conclua as remessas dos documentos finais e acompanhe as pendências desta etapa.' }
            : currentStage === 6
              ? { tone: 'emerald', title: detail.status === 'concluida' ? 'OS concluída' : 'Pronta para validação final', detail: detail.status === 'concluida' ? 'O ciclo operacional desta OS foi concluído.' : 'Confira os requisitos finais antes de concluir a OS.' }
              : null;

  const handleUpload = async (docId: string, e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const file = selectedFiles[docId];
    if (!file) {
      alert('Selecione um arquivo ou tire uma foto primeiro.');
      return;
    }
    setLoading(true);
    try {
      await onUploadVersion(docId, file, {
        origem: detail.status === 'exigencia_externa' ? 'exigencia_externa' : 'correcao_interna',
        comentario: form.comentario?.value || '',
      });
      form.reset();
      setShowUploadFor(null);
      setSelectedFiles(prev => { const n = {...prev}; delete n[docId]; return n; });
      onRefresh();
      alert(currentStage === 2
        ? 'Documento anexado ao futuro dossiê. Ele seguirá para revisão quando todos os serviços forem concluídos.'
        : 'Nova versão anexada com sucesso.');
    } catch (error: any) {
      alert(error?.message || 'Não foi possível enviar esta versão. Tente novamente.');
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

  const handleConfirmAction = (title: string, message: string, action: () => void) => {
    setConfirmAction({ title, message, action });
  };

  const handleItemUpload = async (itemId: string, file: File | undefined) => {
    if (!file) return;
    try {
      const processedFile = await compressImage(file);
      const fd = new FormData();
      fd.append('file', processedFile);
      const upload = await fetch('/api/upload', { method: 'POST', body: fd });
      
      let data;
      const contentType = upload.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await upload.json();
      } else {
        throw new Error(`Erro no servidor (${upload.status}). A foto pode ser muito grande ou ocorreu um problema de conexão.`);
      }

      if (!upload.ok) throw new Error(data.error || 'Falha no upload');
      await updateServiceItem(itemId, { relatorioUrl: data.url, relatorioNome: data.fileName });
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4">
      <div className="nautilus-service-order-detail max-w-5xl mx-auto my-6 overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold font-mono">{detail.numero}</h2>
            <p className="text-sm text-slate-300">{detail.statusLabel}</p>
            {detail.proposta?.numero && <p className="mt-1 text-xs font-bold text-blue-300">Proposta vinculada: {detail.proposta.numero}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button disabled={isRefreshing} onClick={handleManualRefresh} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50">
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {/* Stepper de Progresso Visual */}
          <OsWorkflowStepper status={detail.status} />

          {/* Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
            <div className="nautilus-context-card rounded-xl border border-slate-200 bg-slate-50/80 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Referência comercial</p><p className="font-mono font-bold text-slate-800">{detail.proposta?.numero || 'Sem proposta vinculada'}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Cliente</p><p className="font-bold text-slate-800">{detail.proposta?.clienteNome || detail.embarcacao?.clienteNome || '—'}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Embarcação</p><p className="font-bold text-slate-800">{detail.embarcacao?.nome || detail.proposta?.embarcacaoNome || '—'}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Serviços agendados</p><p className="font-bold text-slate-800">{scheduledItems.length} de {detail.itens?.length || 0}</p></div>
          </div>

          {stageGuidance && <div className={`nautilus-stage-guidance rounded-xl border p-4 ${stageGuidance.tone === 'amber' ? 'border-amber-200 bg-amber-50/70 text-amber-950' : stageGuidance.tone === 'blue' ? 'border-blue-200 bg-blue-50/70 text-blue-950' : stageGuidance.tone === 'indigo' ? 'border-indigo-200 bg-indigo-50/70 text-indigo-950' : stageGuidance.tone === 'sky' ? 'border-sky-200 bg-sky-50/70 text-sky-950' : stageGuidance.tone === 'orange' ? 'border-orange-200 bg-orange-50/70 text-orange-950' : 'border-emerald-200 bg-emerald-50/70 text-emerald-950'}`}>
            <p className="flex items-center gap-2 text-sm font-bold"><AlertTriangle className="h-4 w-4" /> {stageGuidance.title}</p>
            <p className="mt-1 text-xs font-medium">{stageGuidance.detail}</p>
          </div>}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {currentStage === 4 && hasPerm(currentUser, 'registrar_envio_resposta_externa') && ['aguardando_envio_externo', 'em_analise_externa', 'exigencia_externa'].includes(detail.status) && (
              <button onClick={onOpenProtocols} className="nautilus-open-dossier inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300"><Send className="h-4 w-4" /> Abrir dossiê <ChevronRight className="h-4 w-4" /></button>
            )}
            {hasPerm(currentUser, 'executar_entregas') && deliveryActionPending && finalFilesPendingDelivery.length > 0 && (
              <button onClick={() => { setSelectedDeliveryFiles(finalFilesPendingDelivery.map((file: any) => file.id)); setShowDeliver(true); }} className="inline-flex items-center gap-1 bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"><Truck className="w-3.5 h-3.5" /> Registrar remessa</button>
            )}
            {currentUser.role === 'admin' && detail.status === 'validacao_final' && (
              <button onClick={async () => { const response = await fetch(`/api/service-orders/${detail.id}/final-review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decisao: 'aprovar' }) }); const data = await response.json(); if (!response.ok) return alert(data.error || 'Não foi possível concluir.'); await onRefresh(); }} className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"><CheckCircle2 className="w-3.5 h-3.5" /> Aprovar e concluir OS</button>
            )}
          </div>

          {stageBlockers.length > 0 && currentStage >= 3 && <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-slate-700">
            <p className="flex items-center gap-2 text-sm font-bold"><AlertTriangle className="h-4 w-4" /> Pendências desta etapa</p>
            <ul className="mt-2 space-y-1 text-xs">{stageBlockers.map((item, index) => <li key={`${item.tipo}-${index}`}><strong>{item.titulo}:</strong> {item.detalhe}</li>)}</ul>
          </div>}

          {['aguardando_entrega', 'validacao_final'].includes(detail.status) && (
            <div className={`grid gap-3 ${currentUser.role === 'tecnico' ? '' : 'md:grid-cols-2'}`}>
              <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4"><p className="text-sm font-bold text-orange-950">Entrega</p><p className="mt-1 text-xs text-orange-900">{detail.entregas?.[0] ? `Situação: ${detail.entregas[0].status.replaceAll('_', ' ')}` : 'Aguardando os documentos finais aprovados.'}</p><p className="mt-2 text-xs text-slate-600">{detail.entregas?.[0]?.remessas?.length || 0} remessa(s) registrada(s) · {detail.entregas?.[0]?.documentosAprovados?.length || 0} documento(s) final(is) disponível(is)</p>{detail.entregas?.[0]?.motivoReabertura && <p className="mt-2 text-xs font-bold text-red-700">Devolvida: {detail.entregas[0].motivoReabertura}</p>}
                {(detail.entregas?.[0]?.remessas || []).length > 0 && <div className="mt-3 space-y-2 border-t border-orange-200 pt-3"><p className="text-xs font-bold text-orange-950">Remessas e documentos enviados</p>{detail.entregas![0].remessas!.map((remessa: any, index: number) => <div key={remessa.id || index} className="rounded-lg border border-orange-200 bg-white p-2 text-xs"><p className="font-bold text-slate-800">Remessa {index + 1} · {String(remessa.tipo || '').replaceAll('_', ' ')} · {remessa.meioEntrega || 'meio não informado'}</p><p className="text-slate-600">{remessa.dataEntrega || 'data não informada'} · Recebedor: {remessa.nomeRecebedor || 'não informado'}</p>{remessa.comprovanteUrl && <a href={remessa.comprovanteUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-bold text-blue-700 underline">Abrir comprovante: {remessa.comprovanteNome || 'arquivo'}</a>}{(remessa.arquivosAprovados || []).map((arquivo: any) => <a key={arquivo.id} href={arquivo.arquivoUrl} target="_blank" rel="noreferrer" className="mt-1 block font-semibold text-indigo-700 underline">Documento enviado: {arquivo.arquivoNome}</a>)}</div>)}</div>}
                {(detail.entregas?.[0]?.documentosAprovados || []).length > 0 && <div className="mt-3 border-t border-orange-200 pt-3"><p className="text-xs font-bold text-orange-950">Arquivos finais aprovados disponíveis</p>{detail.entregas![0].documentosAprovados!.map((arquivo: any) => <a key={arquivo.id} href={arquivo.arquivoUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-semibold text-indigo-700 underline">{arquivo.arquivoNome}</a>)}</div>}
              </div>
              {currentStage === 5 && currentUser.role !== 'tecnico' && <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4"><p className="text-sm font-bold text-emerald-950">Financeiro</p>{(() => { const financial = (detail.bloqueiosConclusao || []).find((blocker) => blocker.tipo === 'financeiro'); return <p className={`mt-1 text-xs font-bold ${financial ? 'text-orange-800' : 'text-emerald-700'}`}>{financial ? financial.detalhe : 'Saldo financeiro quitado.'}</p>; })()}<p className="mt-2 text-xs text-slate-600">A quitação libera a Validação Final, mas não conclui a OS automaticamente.</p></div>}
            </div>
          )}

          {/* Documentos */}
          <div>
            <h3 className="font-bold text-sm text-slate-700 mb-2">Serviços da OS</h3>
            <div className="space-y-3">{(detail.itens || []).map((item: any) => {
              const isAdmin = currentUser.role === 'admin';
              const isAssignedToMe = item.tecnicoResponsavelId === currentUser.id;
              const canExecute = isAssignedToMe; 
              const assignedUser = users.find((user) => user.id === item.tecnicoResponsavelId) || (item.tecnicoResponsavelId === currentUser.id ? currentUser : undefined);
              const isScheduled = Boolean(item.dataAgendada && item.horarioAgendado);
              const status = serviceStatusPresentation(item.status);
              const hasActions = isAdmin || canExecute;
              return (
                <div key={item.id} className={`nautilus-service-item border rounded-xl overflow-hidden ${!item.tecnicoResponsavelId || !isScheduled ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200'}`}>
                  <div className="p-4 text-sm space-y-4">
                    <div className="flex gap-3">
                      {assignedUser ? (
                        <div className={`h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white shadow-sm ${assignedUser.avatarUrl ? 'bg-slate-100' : avatarTone(assignedUser.nome)}`}>
                          {assignedUser.avatarUrl ? <img src={assignedUser.avatarUrl} alt={`Foto de ${assignedUser.nome}`} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-xs font-black">{profileInitials(assignedUser.nome)}</span>}
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900">{item.descricao}</p>
                          <span className={`nautilus-service-status inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${status.className}`}>{status.label}</span>
                        </div>
                        {assignedUser ? <p className="mt-1 text-xs font-semibold text-slate-600">{assignedUser.nome} <span className="text-slate-400">·</span> {roleLabel(assignedUser)}</p> : <p className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-800"><AlertTriangle className="h-3 w-3" /> Falta atribuir funcionário</p>}
                        {isScheduled ? <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-indigo-700"><Calendar className="h-3 w-3" /> Agendado: {formatDateBR(item.dataAgendada)} às {item.horarioAgendado}{item.localAgendado ? ` · ${item.localAgendado}` : ''}</p> : <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-700"><Calendar className="h-3 w-3" /> Aguardando agendamento</p>}
                        {item.relatorioUrl && <a href={item.relatorioUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-bold text-blue-600 underline">Abrir documento: {item.relatorioNome || 'anexo'}</a>}
                      </div>
                    </div>
                    {hasActions && <div className="-mx-1 overflow-x-auto pb-1">
                      <div className="grid min-w-max grid-flow-col auto-cols-[minmax(9rem,1fr)] gap-2 px-1 sm:min-w-full">
                      {isAdmin && (
                        <button 
                          onClick={() => setScheduleItemId(item.id)} 
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                          <Calendar className="h-3.5 w-3.5" /> {item.tecnicoResponsavelId ? (isScheduled ? 'Editar' : 'Agendar') : 'Atribuir'}
                        </button>
                      )}
                      {canExecute && item.status === 'pendente' && isScheduled && <button onClick={() => handleConfirmAction('Iniciar Serviço', 'Tem certeza que deseja iniciar a execução deste serviço?', () => updateServiceItem(item.id, { status: 'em_execucao' }).catch((error) => alert(error.message)))} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"><ChevronRight className="h-3.5 w-3.5" /> Iniciar</button>}
                      {canExecute && item.status === 'pendente' && !isScheduled && !isAdmin && <button disabled className="inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-600"><Calendar className="h-3.5 w-3.5" /> Aguardando</button>}
                      {canExecute && item.status === 'em_execucao' && <button onClick={() => handleConfirmAction('Concluir Serviço', 'Deseja marcar este serviço como concluído?', () => updateServiceItem(item.id, { status: 'concluido' }).catch((error) => alert(error.message)))} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Concluir</button>}
                      {isAdmin && item.status === 'concluido' && <button onClick={() => handleConfirmAction('Reabrir Serviço', 'Deseja reabrir este serviço? O status voltará para Em Execução.', () => updateServiceItem(item.id, { status: 'em_execucao' }).catch((error) => alert(error.message)))} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" /> Reabrir</button>}
                      {(isAdmin || canExecute) && (
                        <>
                          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100">
                            <Camera className="w-3.5 h-3.5" />
                            Foto
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleItemUpload(item.id, e.target.files?.[0])} />
                          </label>
                          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                            <Paperclip className="w-3.5 h-3.5" />
                            Anexar
                            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleItemUpload(item.id, e.target.files?.[0])} />
                          </label>
                        </>
                      )}
                      </div>
                    </div>}
                  </div>
                  {(isAdmin || canExecute) && (
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
          {currentStage >= 2 && <div>
            <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-blue-900"><FileText className="w-4 h-4" /> {currentStage === 2 ? 'Documentos para o futuro dossiê (opcional)' : 'Documentos do dossiê'} ({detail.documentos?.length || 0})</h3>
              <p className="mt-1 text-xs font-medium text-blue-800">{currentStage === 2 ? 'O responsável pode anexar o PDF durante a execução. Ao concluir todos os serviços, o arquivo seguirá automaticamente para revisão.' : 'Versões anexadas aos serviços para revisão, aprovação e montagem do dossiê.'}</p>
            </div>
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
                    <form onSubmit={(e) => handleUpload(doc.id, e)} className="p-4 bg-white space-y-3 border-b border-slate-200 rounded-b-xl">
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <div className="flex gap-2 w-full sm:w-auto">
                          {!selectedFiles[doc.id] ? (
                            <>
                              <label className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition shadow-sm">
                                <Paperclip className="w-4 h-4" /> Arquivo
                                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { if(e.target.files?.[0]) setSelectedFiles(prev => ({...prev, [doc.id]: e.target.files![0]})); }} />
                              </label>
                              <label className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold text-blue-700 cursor-pointer transition shadow-sm">
                                <Camera className="w-4 h-4" /> Tirar Foto
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { if(e.target.files?.[0]) setSelectedFiles(prev => ({...prev, [doc.id]: e.target.files![0]})); }} />
                              </label>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200 w-full sm:w-auto">
                              <FileText className="w-4 h-4 text-slate-500" />
                              <span className="text-xs text-slate-700 font-bold truncate max-w-[150px]">{selectedFiles[doc.id].name}</span>
                              <button type="button" onClick={() => setSelectedFiles(prev => { const n = {...prev}; delete n[doc.id]; return n; })} className="text-slate-400 hover:text-red-500 ml-2">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <input name="comentario" placeholder={currentStage === 2 ? 'Comentário da alteração (opcional)' : 'Comentário da alteração'} required={currentStage >= 3} className="flex-1 w-full px-4 py-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                        <button type="submit" disabled={loading || !selectedFiles[doc.id]} className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm">
                          {loading ? 'Enviando...' : 'Enviar Versão'}
                        </button>
                      </div>
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
                          <a href={`/api/upload/files/${encodeURIComponent(v.arquivoNomeFisico)}`} target="_blank" rel="noreferrer" className="p-1 hover:text-blue-600"><Download className="w-4 h-4" /></a>
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
                  {hasPerm(currentUser, 'aprovar_tecnicamente') && doc.status === 'aguardando_envio' && (doc.versoes || [])[0]?.situacaoAprovacao !== 'aprovado' && (
                    <div className="p-2 bg-sky-50"><button onClick={() => runAndRefresh(() => onApproveDoc(doc.id), 'Documento aprovado tecnicamente.')} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer">Aprovar Tecnicamente</button></div>
                  )}
                </div>
              ))}
            </div>
          </div>}

          {/* Submissões externas */}
          {currentStage >= 4 && <div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-bold text-sm text-slate-700 flex items-center gap-1"><Send className="w-4 h-4" /> Análise externa</h3>{hasPerm(currentUser, 'registrar_envio_resposta_externa') && <button onClick={onOpenProtocols} className="nautilus-open-dossier inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300"><Send className="h-4 w-4" /> Abrir dossiê <ChevronRight className="h-4 w-4" /></button>}</div>
            {(detail.protocolos || []).map((protocol) => <div key={protocol.id} className={`mb-2 rounded-xl border p-3 text-sm ${['aguardando_analise', 'correcao_enviada'].includes(protocol.status) ? 'border-amber-300 bg-amber-50' : protocol.status.includes('exigencia') || protocol.status === 'correcao_em_elaboracao' ? 'border-red-300 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}><div className="flex items-center justify-between"><strong>{protocol.numeroProtocolo}</strong><span className="text-xs">{protocol.status.replaceAll('_', ' ')}</span></div>{['aguardando_analise', 'correcao_enviada'].includes(protocol.status) && <p className="mt-1 text-xs font-bold text-amber-900">{Number(protocol.cicloAtual || 0) > 0 ? `Protocolo de correção ${protocol.cicloAtual} enviado — aguardando análise da certificadora` : 'Protocolo inicial enviado — aguardando análise da certificadora'}</p>}</div>)}
            {(detail.protocolos || []).length === 0 && detail.status === 'aguardando_envio_externo' && <div className="nautilus-protocol-ready mb-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-bold text-blue-900">Documentação pronta para protocolar. O envio deve ser criado no módulo Protocolos & Entregas.</div>}
            {(detail.protocolos || []).length > 0 ? null : (detail.submissoesExternas || []).length === 0 ? (
              (detail.protocolos || []).length === 0 ? <p className="text-sm text-slate-400">Nenhum envio registrado.</p> : null
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
          </div>}

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
          <form onSubmit={async (e) => { e.preventDefault(); const f = e.target as any; try { await onScheduleItem(scheduleItem.id, { data: f.data.value, horario: f.horario.value, local: f.local.value, contato: f.contato.value, observacoes: f.obs.value, tecnicoResponsavelId: f.tecnico.value || undefined }); setScheduleItemId(null); await onRefresh(); } catch (error: any) { alert(error.message); } }} className="space-y-4 text-sm">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
              <Field label="Funcionário Responsável">
                <select name="tecnico" required defaultValue={scheduleItem.tecnicoResponsavelId || ''} className="w-full px-3 py-2.5 border border-indigo-200 rounded-lg text-sm font-bold bg-white text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none transition">
                  <option value="">Selecione quem fará este serviço...</option>
                  {users.filter((u) => u.ativo).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </Field>
            </div>
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
            <Field label="Observações"><textarea name="obs" defaultValue={scheduleItem.observacoesAgendamento || ''} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setScheduleItemId(null)} className="px-3 py-1.5 border rounded-lg text-xs">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer">Salvar agendamento</button>
            </div>
          </form>
        </Modal>
      )}

      {showSubmit && (
        <ExternalSubmissionModal 
          detail={detail} 
          onClose={() => setShowSubmit(false)} 
          onSubmit={onSubmitExternal} 
          onRefresh={onRefresh} 
        />
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
        <Modal title="Registrar remessa de entrega" onClose={() => setShowDeliver(false)}>
          <form onSubmit={async (e) => { e.preventDefault(); if (!deliveryEvidence) return alert('Anexe o comprovante da entrega.'); if (!selectedDeliveryFiles.length) return alert('Selecione ao menos um documento final aprovado.'); const f = e.target as any; const formData = new FormData(); formData.append('file', deliveryEvidence); const response = await fetch('/api/upload', { method: 'POST', body: formData }); const uploaded = await response.json().catch(() => ({})); if (!response.ok) return alert(uploaded.error || 'Falha no upload do comprovante.'); const start = await fetch(`/api/service-orders/${detail.id}/delivery/start`, { method: 'POST' }); if (!start.ok) { const data = await start.json().catch(() => ({})); return alert(data.error || 'Não foi possível iniciar a entrega.'); } const saved = await fetch(`/api/service-orders/${detail.id}/delivery/dispatches`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: f.tipo.value, dataEntrega: f.data.value, meioEntrega: f.meio.value, nomeRecebedor: f.recebedor.value, destino: f.destino.value, referencia: f.referencia.value, comprovanteUrl: uploaded.url, comprovanteNome: uploaded.fileName, arquivosAprovadosIds: selectedDeliveryFiles }) }); const result = await saved.json().catch(() => ({})); if (!saved.ok) return alert(result.error || 'Não foi possível registrar a remessa.'); setShowDeliver(false); setDeliveryEvidence(null); await onRefresh(); }} className="space-y-3 text-sm">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">Ao registrar uma remessa, a sua ação de entrega é concluída e a OS sai da sua fila. Uma nova entrega só será reaberta quando um administrador anexar um documento final suplementar.</div>
            <Field label="Tipo de remessa"><select name="tipo" className="w-full px-3 py-2 border rounded-lg text-xs"><option value="parcial">Entrega parcial</option><option value="final">Entrega final</option></select></Field>
            <Field label="Documentos finais ainda não enviados"><div className="space-y-2 rounded-lg border p-3">{finalFilesPendingDelivery.map((file: any) => <label key={file.id} className="flex items-center gap-2"><input type="checkbox" checked={selectedDeliveryFiles.includes(file.id)} onChange={(event) => setSelectedDeliveryFiles((current) => event.target.checked ? [...current, file.id] : current.filter((id) => id !== file.id))} /> <a href={file.arquivoUrl} target="_blank" className="text-blue-700 underline">{file.arquivoNome}</a></label>)}{!finalFilesPendingDelivery.length && <p className="text-amber-700">Não há novos documentos finais para enviar.</p>}</div></Field>
            <Field label="Data Entrega"><input name="data" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Meio de Entrega"><select name="meio" className="w-full px-3 py-2 border rounded-lg text-xs"><option value="presencial">Presencial</option><option value="email">E-mail</option><option value="whatsapp">WhatsApp</option><option value="portal">Portal</option><option value="correio">Correio</option></select></Field>
            <Field label="Nome do Recebedor"><input name="recebedor" required className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Destino / endereço"><input name="destino" required placeholder="E-mail, WhatsApp, endereço ou portal" className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Rastreio / referência"><input name="referencia" placeholder="Obrigatório para correio e portal" className="w-full px-3 py-2 border rounded-lg text-xs" /></Field>
            <Field label="Comprovante obrigatório"><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-xs"><Paperclip className="h-4 w-4" />{deliveryEvidence?.name || 'Selecionar comprovante da entrega'}<input type="file" required accept="application/pdf,image/*,.eml,.msg" className="hidden" onChange={(e) => setDeliveryEvidence(e.target.files?.[0] || null)} /></label></Field>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowDeliver(false)} className="px-3 py-1.5 border rounded-lg text-xs">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold cursor-pointer">Registrar</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmAction.title}</h3>
            <p className="text-sm text-slate-600 mb-6">{confirmAction.message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmAction.action();
                  setConfirmAction(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
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
