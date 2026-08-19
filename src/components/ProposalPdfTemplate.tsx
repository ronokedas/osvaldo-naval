import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Proposal, SignatureConfig, Vessel } from '../types';
import { generateProposalPdf } from '../utils/pdfGenerator';

interface ProposalPdfTemplateProps {
  proposal: Proposal;
  vessels: Vessel[];
  signatureConfig?: SignatureConfig;
  onDownloadPdf?: (vessel?: Vessel) => void;
  onClose?: () => void;
}

export const ProposalPdfTemplate: React.FC<ProposalPdfTemplateProps> = ({ proposal, vessels, signatureConfig, onDownloadPdf, onClose }) => {
  const proposalVessels = useMemo(() => {
    const ids = proposal.embarcacoesIds?.length ? proposal.embarcacoesIds : [proposal.embarcacaoId];
    const linked = ids.map((id) => vessels.find((v) => v.id === id)).filter(Boolean) as Vessel[];
    return linked.length ? linked : [];
  }, [proposal, vessels]);
  const [selectedId, setSelectedId] = useState(proposalVessels[0]?.id || '');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const selectedVessel = proposalVessels.find((vessel) => vessel.id === selectedId);

  useEffect(() => setSelectedId(proposalVessels[0]?.id || ''), [proposal.id, proposalVessels]);

  useEffect(() => {
    let active = true;
    let generatedUrl = '';
    setLoading(true);
    generateProposalPdf(proposal, selectedVessel, signatureConfig).then((blob) => {
      if (!active) return;
      generatedUrl = URL.createObjectURL(blob);
      setUrl(generatedUrl);
    }).finally(() => active && setLoading(false));
    return () => {
      active = false;
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [proposal, selectedVessel, signatureConfig]);

  return (
    <div className="bg-white text-slate-900 max-w-5xl mx-auto rounded-xl shadow-2xl overflow-hidden">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white px-5 py-3">
        <div>
          <p className="font-bold">Proposta {proposal.numero}</p>
          <p className="text-xs text-slate-300">Prévia idêntica ao PDF emitido</p>
        </div>
        <div className="flex items-center gap-2">
          {proposalVessels.length > 1 && (
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-xs">
              {proposalVessels.map((vessel) => <option key={vessel.id} value={vessel.id}>{vessel.nome}</option>)}
            </select>
          )}
          <button onClick={() => onDownloadPdf?.(selectedVessel)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold">Baixar PDF</button>
          <button onClick={() => iframeRef.current?.contentWindow?.print()} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold">Imprimir</button>
          {onClose && <button onClick={onClose} className="px-3 py-1.5 text-slate-300 hover:text-white text-xs font-bold">Fechar</button>}
        </div>
      </div>
      <div className="bg-slate-100 p-2 sm:p-4 min-h-[70vh]">
        {loading && <div className="h-[70vh] flex items-center justify-center text-sm text-slate-500">Gerando prévia da proposta...</div>}
        {!loading && url && <iframe ref={iframeRef} title={`Proposta ${proposal.numero}`} src={url} className="w-full h-[82vh] bg-white border-0" />}
      </div>
    </div>
  );
};
