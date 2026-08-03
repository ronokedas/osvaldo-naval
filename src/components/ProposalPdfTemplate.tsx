import React from 'react';
import { Proposal, SignatureConfig, LogoConfig } from '../types';
import { NautilusLogo } from './NautilusLogo';

interface ProposalPdfTemplateProps {
  proposal: Proposal;
  signatureConfig?: SignatureConfig;
  logoConfig?: LogoConfig;
  onDownloadPdf?: () => void;
  onPrint?: () => void;
  onClose?: () => void;
}

export const ProposalPdfTemplate: React.FC<ProposalPdfTemplateProps> = ({
  proposal,
  signatureConfig,
  logoConfig,
  onDownloadPdf,
  onPrint,
  onClose,
}) => {
  return (
    <div className="bg-white text-slate-900 font-sans max-w-4xl mx-auto p-8 border border-slate-200 shadow-xl rounded-lg my-4 relative">
      {/* Top Banner Action Strip (Non-printable) */}
      <div className="print:hidden flex items-center justify-between bg-slate-800 text-white p-4 rounded-t-lg -mx-8 -mt-8 mb-8">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-blue-400">Proposta {proposal.numero}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            proposal.status === 'aprovado' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
            proposal.status === 'enviado' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {proposal.status.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium flex items-center gap-2 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Baixar PDF
            </button>
          )}
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium flex items-center gap-2 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 text-slate-300 hover:text-white rounded-md text-sm font-medium transition cursor-pointer"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* Actual Printable Document Container */}
      <div id="printable-proposal-content" className="p-2 space-y-6 text-slate-800 text-[14px] leading-relaxed">
        {/* Decorative Top Nautical Bar */}
        <div className="h-2 bg-gradient-to-r from-[#0B192C] via-blue-700 to-[#0B192C] rounded-full w-full mb-4"></div>

        {/* Company Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
          <div>
            <NautilusLogo variant="dark" size="lg" logoConfig={logoConfig} />
            <p className="text-xs text-slate-500 font-medium mt-2">
              Nautilus Projetos Navais LTDA — CNPJ: 20.671.499/0001-76
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-1 sm:max-w-xs">
            <p className="font-semibold text-slate-800">Tv. Lopo de Castro, nº 1230</p>
            <p>Ed. Serra das Estrelas, Sala 09 — Belém/PA</p>
            <p>Telefones: (91) 3247-3278 / (91) 99824-0012</p>
            <p className="text-blue-700 font-medium">contato@nautilusengenharianaval.com.br</p>
            <p className="text-slate-500">www.nautilusengenharianaval.com.br</p>
          </div>
        </div>

        {/* Proposal Title & Identification */}
        <div className="flex flex-col sm:flex-row justify-between items-baseline pt-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#0B192C] tracking-tight">
              Proposta nº <span className="text-blue-700 font-mono">{proposal.numero}</span>
            </h2>
            <p className="text-sm text-slate-700 font-medium mt-1">
              <strong className="text-slate-900">A/C:</strong> {proposal.destinatario}
            </p>
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">Embarcação:</strong> {proposal.embarcacaoNome} ({proposal.clienteNome})
            </p>
          </div>
          <div className="text-sm font-medium text-slate-600 mt-2 sm:mt-0">
            Belém/PA, {proposal.dataEmissao}
          </div>
        </div>

        {/* Assunto / Subject */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">Assunto:</p>
          <p className="font-medium text-slate-900 text-sm">{proposal.assunto}</p>
        </div>

        {/* Section I: Escopo dos Serviços */}
        <div>
          <h3 className="text-base font-bold text-[#0B192C] border-b-2 border-blue-600 pb-1 mb-3">
            I. Escopo dos serviços a serem realizados para cada embarcação
          </h3>
          <table className="w-full text-left border-collapse border border-slate-200 rounded-md overflow-hidden text-sm">
            <thead>
              <tr className="bg-[#0B192C] text-white">
                <th className="p-2.5 font-semibold w-12 text-center">Item</th>
                <th className="p-2.5 font-semibold">Descrição do Serviço / Documento</th>
                <th className="p-2.5 font-semibold w-16 text-center">Qtd</th>
                <th className="p-2.5 font-semibold text-right w-32">Valor Unit. (R$)</th>
                <th className="p-2.5 font-semibold text-right w-32">Subtotal (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {proposal.itens.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="p-2.5 font-medium text-slate-800">{item.descricao}</td>
                  <td className="p-2.5 text-center text-slate-700">{item.quantidade}</td>
                  <td className="p-2.5 text-right font-mono text-slate-700">
                    {item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                    {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td colSpan={4} className="p-3 text-right uppercase text-xs tracking-wider text-slate-700">
                  Valor Total do Escopo:
                </td>
                <td className="p-3 text-right font-mono text-base text-blue-900">
                  R$ {proposal.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Section II: Prazo de Entrega */}
        <div>
          <h3 className="text-base font-bold text-[#0B192C] border-b-2 border-blue-600 pb-1 mb-2">
            II. Prazo de entrega
          </h3>
          <p className="text-slate-800 font-medium">
            <span className="font-bold text-blue-900">{proposal.prazoEntregaDias} dias corridos</span> após o aceite formal da proposta e disponibilização da embarcação em condições limpas para inspeção.
          </p>
        </div>

        {/* Section III: Observações Gerais */}
        <div>
          <h3 className="text-base font-bold text-[#0B192C] border-b-2 border-blue-600 pb-1 mb-2">
            III. Observações gerais
          </h3>
          <ul className="list-disc list-outside pl-5 space-y-1.5 text-xs text-slate-700">
            {proposal.observacoesGerais.split('\n').map((line, idx) => (
              <li key={idx}>{line.replace(/^-\s*/, '')}</li>
            ))}
          </ul>
        </div>

        {/* Section IV: Honorários e Condições de Pagamento */}
        <div>
          <h3 className="text-base font-bold text-[#0B192C] border-b-2 border-blue-600 pb-1 mb-2">
            IV. Honorários e condições de pagamento
          </h3>
          <div className="bg-blue-50/60 p-4 rounded-lg border border-blue-100 space-y-2">
            <p className="text-sm">
              <strong className="text-slate-900">Valor Total dos Honorários:</strong>{' '}
              <span className="font-mono text-lg font-bold text-blue-900">
                R$ {proposal.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </p>
            <p className="text-xs text-slate-800">
              <strong className="text-slate-900">Condições de Pagamento:</strong> {proposal.condicaoPagamento}
            </p>
          </div>
        </div>

        {/* Section V: Dados Bancários */}
        <div>
          <h3 className="text-base font-bold text-[#0B192C] border-b-2 border-blue-600 pb-1 mb-2">
            V. Dados bancários para recebimento
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-md border border-slate-200 font-mono">
            <div>
              <p><strong className="text-slate-900">Banco:</strong> Banco Bradesco S.A. (237)</p>
              <p><strong className="text-slate-900">Agência:</strong> 0875-3</p>
              <p><strong className="text-slate-900">Conta Corrente:</strong> 3508-4</p>
            </div>
            <div>
              <p><strong className="text-slate-900">Favorecido:</strong> Nautilus Projetos Navais LTDA</p>
              <p><strong className="text-slate-900">CNPJ / Chave PIX:</strong> 20.671.499/0001-76</p>
            </div>
          </div>
        </div>

        {/* Formal Acceptance Section (Aceite Formal) */}
        <div className="pt-6 border-t border-slate-300 mt-8">
          <h3 className="text-sm uppercase font-bold text-slate-800 tracking-wider mb-6 text-center">
            ACEITE FORMAL DA PROPOSTA
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-xs">
            {/* Prepared By Signature */}
            <div className="text-center space-y-1">
              <div className="border-b border-slate-400 min-h-[4rem] flex flex-col items-center justify-end pb-1">
                {signatureConfig?.ativo && signatureConfig?.aplicarPropostas && signatureConfig?.imagemUrl ? (
                  <img
                    src={signatureConfig.imagemUrl}
                    alt="Assinatura Digital"
                    className="max-h-12 max-w-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <span className="font-serif italic text-blue-900 text-base">{proposal.elaboradoPor}</span>
                )}
              </div>
              <p className="font-bold text-slate-900 mt-1">
                {signatureConfig?.ativo && signatureConfig?.aplicarPropostas && signatureConfig?.nomeSignatario
                  ? signatureConfig.nomeSignatario
                  : proposal.elaboradoPor}
              </p>
              <p className="text-slate-500 text-[11px]">
                {signatureConfig?.ativo && signatureConfig?.aplicarPropostas && signatureConfig?.cargoSignatario
                  ? signatureConfig.cargoSignatario
                  : 'Nautilus Projetos Navais LTDA'}
              </p>
              {signatureConfig?.ativo && signatureConfig?.aplicarPropostas && signatureConfig?.creaOrRegistro && (
                <p className="text-slate-400 text-[10px] font-mono">{signatureConfig.creaOrRegistro}</p>
              )}
            </div>

            {/* Client Acceptance Signature */}
            <div className="text-center space-y-2">
              <div className="border-b border-slate-400 h-16 flex items-end justify-center pb-1">
                {proposal.aceiteData ? (
                  <span className="font-serif italic text-emerald-800 text-base font-semibold">
                    {proposal.aceiteAssinaturaNome || proposal.destinatario} ({proposal.aceiteData})
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Assinatura do Cliente / Armador</span>
                )}
              </div>
              <p className="font-bold text-slate-900">De acordo e Aceito:</p>
              <p className="text-slate-600">
                Data do Aceite: {proposal.aceiteData ? proposal.aceiteData : '____ / ____ / ________'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[10px] text-slate-400 pt-8 border-t border-slate-100">
          Nautilus Projetos Navais LTDA — Documento emitido eletronicamente via Sistema Nautilus.
        </div>
      </div>
    </div>
  );
};
