import React, { useEffect, useRef, useState } from 'react';
import { Download, FileCheck, Mail, MessageCircle, Printer, Send, X } from 'lucide-react';
import { Client, LogoConfig, Protocol, ServiceOrder, SignatureConfig, Vessel } from '../types';
import { downloadBlob, generateProtocolPdf } from '../utils/pdfGenerator';

interface ProtocolSlipModalProps {
  protocol: Protocol;
  vessel?: Vessel;
  client?: Client;
  serviceOrder?: ServiceOrder;
  signatureConfig?: SignatureConfig;
  logoConfig?: LogoConfig;
  onClose: () => void;
}

export const ProtocolSlipModal: React.FC<ProtocolSlipModalProps> = ({
  protocol,
  vessel,
  client,
  serviceOrder,
  signatureConfig,
  logoConfig,
  onClose,
}) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareAction, setShareAction] = useState<'email' | 'whatsapp' | null>(null);
  const [shareEmail, setShareEmail] = useState(client?.email || vessel?.emailContato || '');
  const [resolvedClientEmail, setResolvedClientEmail] = useState('');
  const [shareSubject, setShareSubject] = useState(`Termo de Protocolo ${protocol.numeroProtocolo}`);
  const [shareMessage, setShareMessage] = useState(`Segue o Termo de Protocolo ${protocol.numeroProtocolo} da Nautilus Projetos Navais.`);
  const [sharing, setSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const frameRef = useRef<HTMLIFrameElement>(null);
  const filename = `Protocolo_${protocol.numeroProtocolo.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;

  useEffect(() => {
    let active = true;
    const localEmail = client?.email || vessel?.emailContato || '';
    setResolvedClientEmail('');
    setShareEmail(localEmail);
    if (localEmail) return () => { active = false; };
    fetch(`/api/protocols/${protocol.id}/email-recipient`, { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() : null)
      .then((recipient) => {
        const email = String(recipient?.email || '').trim();
        if (active && email) {
          setResolvedClientEmail(email);
          setShareEmail(email);
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [protocol.id, client?.email, vessel?.emailContato]);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setLoading(true);
    setError('');
    generateProtocolPdf(protocol, vessel, serviceOrder, logoConfig, signatureConfig)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch(() => active && setError('Não foi possível gerar o PDF do protocolo.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [protocol, vessel, serviceOrder, logoConfig, signatureConfig]);

  const handleDownload = async () => {
    try {
      const blob = await generateProtocolPdf(protocol, vessel, serviceOrder, logoConfig, signatureConfig);
      downloadBlob(blob, filename);
    } catch {
      setError('Não foi possível baixar o PDF do protocolo.');
    }
  };

  const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível preparar o PDF.'));
    reader.readAsDataURL(blob);
  });

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(shareEmail.trim())) { setShareFeedback('Informe um e-mail válido.'); return; }
    setSharing(true); setShareFeedback('');
    try {
      const blob = await generateProtocolPdf(protocol, vessel, serviceOrder, logoConfig, signatureConfig);
      const response = await fetch(`/api/protocols/${protocol.id}/send-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destinatarioEmail: shareEmail.trim(), assunto: shareSubject.trim(), mensagem: shareMessage.trim(), pdfBase64: await blobToBase64(blob), filename }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Não foi possível enviar o e-mail.');
      setShareFeedback('Termo enviado por e-mail com sucesso.');
    } catch (reason) { setShareFeedback(reason instanceof Error ? reason.message : 'Não foi possível enviar o e-mail.'); }
    finally { setSharing(false); }
  };

  const openEmailModal = async () => {
    const localEmail = client?.email || vessel?.emailContato || resolvedClientEmail || '';
    if (localEmail) {
      setShareEmail(localEmail);
      setShareFeedback('');
      setShareAction('email');
      return;
    }

    setSharing(true);
    setShareFeedback('');
    try {
      const response = await fetch(`/api/protocols/${protocol.id}/email-recipient`, { cache: 'no-store' });
      const recipient = await response.json().catch(() => ({}));
      if (!response.ok || !recipient.email) {
        throw new Error(recipient.error || 'O cliente proprietário da embarcação não possui e-mail cadastrado.');
      }
      const email = String(recipient.email).trim();
      setResolvedClientEmail(email);
      setShareEmail(email);
      setShareAction('email');
    } catch (reason) {
      setShareFeedback(reason instanceof Error ? reason.message : 'Não foi possível localizar o e-mail do cliente.');
    } finally {
      setSharing(false);
    }
  };

  const handleWhatsApp = async () => {
    setSharing(true); setShareFeedback('');
    try {
      const blob = await generateProtocolPdf(protocol, vessel, serviceOrder, logoConfig, signatureConfig);
      const text = `Termo de Protocolo ${protocol.numeroProtocolo} — Nautilus Projetos Navais.`;
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: `Termo ${protocol.numeroProtocolo}`, text, files: [file] });
        setShareFeedback('Termo preparado para compartilhamento.');
      } else {
        downloadBlob(blob, filename);
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n\nO PDF foi baixado. Anexe o arquivo antes de enviar.`)}`, '_blank', 'noopener,noreferrer');
        setShareFeedback('PDF baixado. Anexe o arquivo na conversa do WhatsApp.');
      }
    } catch (reason) { if (!(reason instanceof DOMException && reason.name === 'AbortError')) setShareFeedback('Não foi possível compartilhar o termo pelo WhatsApp.'); }
    finally { setSharing(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 bg-slate-900 p-4 text-white">
          <div className="flex min-w-0 items-center gap-2">
            <FileCheck className="h-5 w-5 shrink-0 text-[#00E5FF]" />
            <h3 className="truncate text-sm font-bold">Termo de Protocolo & Recebimento Documental</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void handleDownload()} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-500">
              <Download className="h-4 w-4" /> Baixar PDF
            </button>
            <button onClick={() => frameRef.current?.contentWindow?.print()} disabled={!pdfUrl} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50">
              <Printer className="h-4 w-4" /> Imprimir
            </button>
            <button onClick={() => void openEmailModal()} disabled={sharing} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60"><Mail className="h-4 w-4" /> {sharing ? 'Localizando...' : 'E-mail'}</button>
            <button onClick={() => { setShareAction('whatsapp'); setShareFeedback(''); }} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"><MessageCircle className="h-4 w-4" /> WhatsApp</button>
            <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-1.5 text-slate-400 transition hover:text-white"><X className="h-5 w-5" /></button>
          </div>
        </div>
        {shareFeedback && !shareAction && <p className="border-t border-slate-700 bg-slate-900 px-4 py-2 text-right text-xs font-semibold text-amber-300">{shareFeedback}</p>}

        {loading && <div className="flex h-[82vh] min-h-[680px] items-center justify-center text-sm text-slate-500">Gerando o novo modelo de protocolo...</div>}
        {!loading && error && <div className="flex h-[82vh] min-h-[680px] items-center justify-center p-8 text-center text-sm font-medium text-red-600">{error}</div>}
        {pdfUrl && <iframe ref={frameRef} title={`Protocolo ${protocol.numeroProtocolo}`} src={pdfUrl} className="h-[82vh] min-h-[680px] w-full border-0 bg-white" />}
      </div>
      {shareAction === 'email' && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4" onMouseDown={(event) => event.target === event.currentTarget && setShareAction(null)}><form onSubmit={handleEmail} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><Mail className="h-5 w-5 text-cyan-300" /> Enviar termo por e-mail</h3><button type="button" onClick={() => setShareAction(null)} className="text-slate-400 hover:text-white"><X /></button></div><p className="text-xs text-slate-300">O PDF será enviado como anexo do e-mail.</p><label className="block text-xs font-bold">Destinatário<input required type="email" value={shareEmail} onChange={(event) => setShareEmail(event.target.value)} placeholder="cliente@empresa.com" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label><label className="block text-xs font-bold">Assunto<input value={shareSubject} onChange={(event) => setShareSubject(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label><label className="block text-xs font-bold">Mensagem<textarea value={shareMessage} onChange={(event) => setShareMessage(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>{shareFeedback && <p className={`text-xs font-bold ${shareFeedback.includes('sucesso') ? 'text-emerald-300' : 'text-amber-300'}`}>{shareFeedback}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={() => setShareAction(null)} className="rounded-lg px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800">Cancelar</button><button disabled={sharing} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold disabled:opacity-60"><Send className="h-4 w-4" />{sharing ? 'Enviando...' : 'Enviar e-mail'}</button></div></form></div>}
      {shareAction === 'whatsapp' && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4" onMouseDown={(event) => event.target === event.currentTarget && setShareAction(null)}><div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><MessageCircle className="h-5 w-5 text-emerald-300" /> Compartilhar no WhatsApp</h3><button type="button" onClick={() => setShareAction(null)} className="text-slate-400 hover:text-white"><X /></button></div><p className="text-sm text-slate-300">O termo será preparado como PDF para você compartilhar com o destinatário.</p>{shareFeedback && <p className="rounded-lg bg-emerald-950/60 p-3 text-xs font-bold text-emerald-200">{shareFeedback}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={() => setShareAction(null)} className="rounded-lg px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800">Cancelar</button><button type="button" disabled={sharing} onClick={() => void handleWhatsApp()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold disabled:opacity-60"><MessageCircle className="h-4 w-4" />{sharing ? 'Preparando...' : 'Compartilhar'}</button></div></div></div>}
    </div>
  );
};
