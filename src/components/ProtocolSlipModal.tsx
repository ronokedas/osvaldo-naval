import React, { useEffect, useRef, useState } from 'react';
import { Download, FileCheck, Printer, X } from 'lucide-react';
import { LogoConfig, Protocol, ServiceOrder, SignatureConfig, Vessel } from '../types';
import { downloadBlob, generateProtocolPdf } from '../utils/pdfGenerator';

interface ProtocolSlipModalProps {
  protocol: Protocol;
  vessel?: Vessel;
  serviceOrder?: ServiceOrder;
  signatureConfig?: SignatureConfig;
  logoConfig?: LogoConfig;
  onClose: () => void;
}

export const ProtocolSlipModal: React.FC<ProtocolSlipModalProps> = ({
  protocol,
  vessel,
  serviceOrder,
  signatureConfig,
  logoConfig,
  onClose,
}) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const frameRef = useRef<HTMLIFrameElement>(null);
  const filename = `Protocolo_${protocol.numeroProtocolo.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;

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
            <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-1.5 text-slate-400 transition hover:text-white"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {loading && <div className="flex h-[82vh] min-h-[680px] items-center justify-center text-sm text-slate-500">Gerando o novo modelo de protocolo...</div>}
        {!loading && error && <div className="flex h-[82vh] min-h-[680px] items-center justify-center p-8 text-center text-sm font-medium text-red-600">{error}</div>}
        {pdfUrl && <iframe ref={frameRef} title={`Protocolo ${protocol.numeroProtocolo}`} src={pdfUrl} className="h-[82vh] min-h-[680px] w-full border-0 bg-white" />}
      </div>
    </div>
  );
};
