import React from 'react';
import { Protocol, Vessel, SignatureConfig, LogoConfig } from '../types';
import { Printer, X, FileCheck, ShieldCheck, Building2, Send, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { NautilusLogo } from './NautilusLogo';
import { generateProtocolPdf } from '../utils/pdfGenerator';
import { formatDateBR } from '../utils/date-formatters';

interface ProtocolSlipModalProps {
  protocol: Protocol;
  vessel?: Vessel;
  signatureConfig?: SignatureConfig;
  logoConfig?: LogoConfig;
  onClose: () => void;
}

export const ProtocolSlipModal: React.FC<ProtocolSlipModalProps> = ({
  protocol,
  vessel,
  signatureConfig,
  logoConfig,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    generateProtocolPdf(protocol, logoConfig);
  };

  const getTipoLabel = (tipo: Protocol['tipoProtocolo']) => {
    switch (tipo) {
      case 'capitania_dpc':
        return 'MARINHA DO BRASIL / CAPITANIA / DPC';
      case 'certificadora':
        return 'SOCIEDADE CLASSIFICADORA / CERTIFICADORA';
      case 'entrega_cliente':
        return 'ENTREGA DIRETA AO CLIENTE / ARMADOR';
      default:
        return 'ENTREGA DE DOCUMENTAÇÃO TÉCNICA';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#00E5FF]" />
            <h3 className="font-bold text-sm">Termo de Protocolo & Recebimento Documental</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-sm"
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

        {/* PRINTABLE PROTOCOL CONTAINER */}
        <div className="p-8 sm:p-10 space-y-6 text-slate-800 bg-white print:p-6 print:text-black">
          
          {/* Header */}
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
              <span className="bg-blue-100 text-blue-900 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-blue-300 print:bg-transparent print:border-black print:text-black">
                Termo de Protocolo
              </span>
              <h2 className="text-lg font-black font-mono text-slate-900 mt-1 print:text-black">
                {protocol.numeroProtocolo}
              </h2>
              <p className="text-[11px] font-mono text-slate-500">
                Data do Envio: {formatDateBR(protocol.dataEnvio)}
              </p>
            </div>
          </div>

          {/* Destination & Vessel Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 print:bg-white print:border-black">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Destinatário / Órgão
              </span>
              <p className="font-bold text-slate-900 text-sm">{protocol.orgaoOuEmpresa || protocol.destinatario}</p>
              <p className="text-slate-600 font-medium">{protocol.destinatario}</p>
              <span className="inline-block bg-slate-200 text-slate-700 text-[9px] font-mono uppercase px-2 py-0.5 rounded mt-1 print:bg-transparent print:border print:border-black">
                {getTipoLabel(protocol.tipoProtocolo)}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 print:bg-white print:border-black">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Embarcação & Armador
              </span>
              <p className="font-bold text-slate-900 text-sm">{protocol.embarcacaoNome}</p>
              <p className="text-slate-600 font-medium">Cliente: {protocol.clienteNome}</p>
              {vessel && (
                <p className="text-[10px] font-mono text-slate-500">
                  Tipo/Inscrição: {vessel.tipo} • {vessel.registro || 'Em trânsito'}
                </p>
              )}
            </div>
          </div>

          {/* Declared List of Included Documents */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                relação de documentos / peças técnicas entregues
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Total: {protocol.documentosIncluidos.length} item(ns)
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden print:border-black">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] print:bg-slate-200 print:text-black">
                  <tr>
                    <th className="p-2.5 w-12 text-center">Item</th>
                    <th className="p-2.5">Descrição do Documento / Projeto / ART</th>
                    <th className="p-2.5 w-24 text-center">Conferido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {protocol.documentosIncluidos.map((doc, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-800">{doc}</td>
                      <td className="p-2.5 text-center text-slate-400 font-mono">
                        [ &nbsp; ] OK
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {protocol.observacoes && (
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs space-y-0.5 print:bg-white print:border-black">
              <span className="font-bold text-amber-900 block text-[10px] uppercase">Instruções / Observações de Envio:</span>
              <p className="text-slate-700 italic">{protocol.observacoes}</p>
            </div>
          )}

          {/* Term of Receipt Declaration */}
          <p className="text-[11px] text-slate-600 leading-relaxed pt-2">
            Declaramos que a documentação técnica descrita neste termo foi entregue nas condições especificadas para fins de análise, juntada a processo marítimo ou entrega formal ao tomador dos serviços.
          </p>

          {/* Signatures & Protocol Stamp Box */}
          <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-2">
              <div className="border-b-2 border-slate-400 w-5/6 mx-auto"></div>
              <p className="font-bold text-slate-900">{protocol.destinatario}</p>
              <p className="text-[10px] text-slate-500">Assinatura / Carimbo de Recebimento</p>
              <p className="text-[9px] font-mono text-slate-400">Data: _____ / _____ / 2026 &nbsp;&nbsp; Hora: ____ : ____</p>
            </div>

            <div className="space-y-2">
              {signatureConfig?.ativo && signatureConfig?.aplicarProtocolos && signatureConfig?.imagemUrl ? (
                <div className="h-12 flex items-end justify-center mb-1">
                  <img
                    src={signatureConfig.imagemUrl}
                    alt="Assinatura Digital"
                    className="max-h-12 max-w-full object-contain mix-blend-multiply"
                  />
                </div>
              ) : null}
              <div className="border-b-2 border-slate-800 w-5/6 mx-auto print:border-black"></div>
              <p className="font-bold text-slate-900">
                {signatureConfig?.ativo && signatureConfig?.aplicarProtocolos && signatureConfig?.nomeSignatario
                  ? signatureConfig.nomeSignatario
                  : protocol.responsavelEnvioNome}
              </p>
              <p className="text-[10px] text-slate-500">
                {signatureConfig?.ativo && signatureConfig?.aplicarProtocolos && signatureConfig?.cargoSignatario
                  ? signatureConfig.cargoSignatario
                  : 'Nautilus Projetos Navais - Responsável Envio'}
              </p>
              {signatureConfig?.ativo && signatureConfig?.aplicarProtocolos && signatureConfig?.creaOrRegistro ? (
                <p className="text-[9px] font-mono text-slate-400">{signatureConfig.creaOrRegistro}</p>
              ) : (
                <p className="text-[9px] font-mono text-slate-400">Manaus - AM</p>
              )}
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Controle Interno Nautilus • Código Rastreio: {protocol.codigoRastreio || 'N/A'}</span>
            </div>
            <span>Protocolo Impresso em: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>

        </div>

      </div>
    </div>
  );
};
