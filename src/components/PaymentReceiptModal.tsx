import React, { useEffect, useRef, useState } from 'react';
import { formatDateBR } from '../utils/date-formatters';
import { FinancialEntry, Vessel, SignatureConfig, LogoConfig } from '../types';
import { Printer, Download, X, CheckCircle2, Building, ShieldCheck, FileCheck } from 'lucide-react';
import { NautilusLogo } from './NautilusLogo';
import { generateReceiptPdf, downloadBlob } from '../utils/pdfGenerator';
import { numberToWords } from '../utils/numberToWords';

interface PaymentReceiptModalProps {
  entry: FinancialEntry;
  vessel?: Vessel;
  signatureConfig?: SignatureConfig;
  logoConfig?: LogoConfig;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  entry,
  vessel,
  signatureConfig,
  logoConfig,
  onClose,
}) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(true);
  const pdfFrameRef = useRef<HTMLIFrameElement>(null);
  const receiptNum = entry.reciboNumero || `REC-${entry.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;
  const clientName = vessel?.clienteNome || entry.clienteNome || 'Cliente / Armador';

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setPdfLoading(true);
    generateReceiptPdf(entry, logoConfig).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);
    }).finally(() => active && setPdfLoading(false));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry, logoConfig]);

  const handlePrint = () => {
    pdfFrameRef.current?.contentWindow?.print();
  };

  const handleDownload = async () => {
    const blob = await generateReceiptPdf(entry, logoConfig);
    downloadBlob(blob, `Recibo_${receiptNum.replace(/\//g, '-')}.pdf`);
  };

  const receiptTitle = entry.tipo === 'quitacao' ? 'Comprovante de Quitação' : 'Recibo de Pagamento';

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      {/* Modal Card container */}
      <div
        className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Recibo Oficial de Pagamento</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {pdfLoading && (
          <div className="h-[78vh] min-h-[620px] flex items-center justify-center text-sm text-slate-500">
            Gerando o novo modelo de recibo...
          </div>
        )}
        {pdfUrl && (
          <iframe
            ref={pdfFrameRef}
            title={`Recibo ${receiptNum}`}
            src={pdfUrl}
            className="w-full h-[82vh] min-h-[680px] bg-white border-0"
          />
        )}

        {/* PRINTABLE RECEIPT CONTAINER (fallback while the PDF is loading) */}
        <div className={`${pdfUrl || pdfLoading ? 'hidden' : ''} p-8 sm:p-10 space-y-6 text-slate-800 bg-white print:p-6 print:text-black`}>
          
          {/* Header with Logo / Company Details */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-800 pb-6 gap-4">
            <div>
              <NautilusLogo variant="dark" size="lg" logoConfig={logoConfig} />
              <p className="text-[10px] text-slate-500 mt-2 font-mono">
                CNPJ: 20.671.499/0001-76 | Engenharia & Vistorias Náuticas<br />
                Manaus - AM / Belém - PA<br />
                Contato: (91) 3247-3278 | contato@nautilusengenharianaval.com.br
              </p>
            </div>

            <div className="text-right sm:text-right border-l sm:border-l-2 border-slate-200 pl-4 py-1 print:border-slate-400">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-emerald-300 print:bg-transparent print:border-black print:text-black">
                {receiptTitle}
              </span>
              <h2 className="text-base font-black font-mono text-slate-900 mt-1 print:text-black">
                {receiptNum}
              </h2>
              <p className="text-[11px] font-mono text-slate-500">
                Data: {formatDateBR(entry.data)}
              </p>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5 flex items-center justify-between print:bg-white print:border-black">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Valor Recebido
              </p>
              <p className="text-2xl font-black font-mono text-emerald-700 print:text-black">
                R$ {entry.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-600 block">Forma de Pagamento</span>
              <span className="font-mono font-bold text-sm text-slate-900 uppercase">
                {entry.formaPagamento}
              </span>
            </div>
          </div>

          {/* Main Statement Text */}
          <div className="space-y-4 text-xs leading-relaxed border-l-4 border-blue-600 pl-4 py-1 bg-blue-50/30 rounded-r-xl print:bg-white print:border-black">
            <p>
              Recebemos de <strong className="text-slate-900 uppercase font-bold">{clientName}</strong> a quantia de{' '}
              <strong className="text-slate-900 font-bold font-mono">
                R$ {entry.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({numberToWords(entry.valor)})
              </strong>, correspondente ao pagamento de{' '}
              <strong className="text-slate-900 uppercase font-bold">{entry.tipo}</strong> relativo aos serviços de engenharia naval da embarcação{' '}
              <strong className="text-slate-900 font-bold">{entry.embarcacaoNome}</strong>.
            </p>
            {entry.observacao && (
              <p className="text-slate-600 italic">
                <strong>Observações:</strong> {entry.observacao}
              </p>
            )}
          </div>

          {/* Details Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs print:border-black">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] print:bg-slate-200 print:text-black">
                <tr>
                  <th className="p-2.5">Embarcação</th>
                  <th className="p-2.5">Tipo de Lançamento</th>
                  <th className="p-2.5">Nota Fiscal (NF-e)</th>
                  <th className="p-2.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="p-2.5 font-bold text-slate-900">{entry.embarcacaoNome}</td>
                  <td className="p-2.5 uppercase font-mono text-slate-600">{entry.tipo}</td>
                  <td className="p-2.5 font-mono">
                    {entry.notaFiscalNumero ? (
                      <span className="text-emerald-700 font-bold">NF-e nº {entry.notaFiscalNumero}</span>
                    ) : (
                      <span className="text-slate-400 italic">Sem retenção / Recibo simples</span>
                    )}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                    R$ {entry.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures & Footer */}
          <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-1">
              <div className="border-b-2 border-slate-400 w-4/5 mx-auto"></div>
              <p className="font-bold text-slate-900 mt-2">{clientName}</p>
              <p className="text-[10px] text-slate-500">Tomador dos Serviços</p>
            </div>

            <div className="space-y-1">
              {signatureConfig?.ativo && signatureConfig?.aplicarRecibos && signatureConfig?.imagemUrl ? (
                <div className="h-12 flex items-end justify-center mb-1">
                  <img
                    src={signatureConfig.imagemUrl}
                    alt="Assinatura Digital"
                    className="max-h-12 max-w-full object-contain mix-blend-multiply"
                  />
                </div>
              ) : null}
              <div className="border-b-2 border-slate-800 w-4/5 mx-auto print:border-black"></div>
              <p className="font-bold text-slate-900 mt-2">
                {signatureConfig?.ativo && signatureConfig?.aplicarRecibos && signatureConfig?.nomeSignatario
                  ? signatureConfig.nomeSignatario
                  : entry.lancadoPorNome || 'Deisy Saldanha'}
              </p>
              <p className="text-[10px] text-slate-500">
                {signatureConfig?.ativo && signatureConfig?.aplicarRecibos && signatureConfig?.cargoSignatario
                  ? signatureConfig.cargoSignatario
                  : 'Nautilus Projetos Navais - Financeiro'}
              </p>
              {signatureConfig?.ativo && signatureConfig?.aplicarRecibos && signatureConfig?.creaOrRegistro && (
                <p className="text-[9px] font-mono text-slate-400">{signatureConfig.creaOrRegistro}</p>
              )}
            </div>
          </div>

          {/* Legal / System Stamp */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Documento autêntico gerado eletronicamente via Sistema Nautilus Gestão</span>
            </div>
            <span>Manaus, AM - {formatDateBR(entry.data)}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
