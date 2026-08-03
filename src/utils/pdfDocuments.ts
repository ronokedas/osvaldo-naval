import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Proposal, Protocol, FinancialEntry, Vessel, LogoConfig, SignatureConfig, DocumentTask } from '../types';

const PRIMARY_DARK = [6, 18, 36];
const PRIMARY_BLUE = [25, 50, 90];
const LIGHT_GREY = [241, 245, 249];
const TEXT_DARK = [15, 23, 42];
const TEXT_GREY = [71, 85, 105];
const ACCENT_BLUE = [37, 99, 235];

const drawHeader = (doc: jsPDF, rightBadgeText: string, dateText: string, logoConfig?: LogoConfig) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  
  if (logoConfig?.nomeEmpresa) {
    doc.text(logoConfig.nomeEmpresa, 20, 20);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(logoConfig.subtitulo || "ENGENHARIA NAVAL", 20, 25);
  } else {
    doc.text("NAUTILUS", 35, 20);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("ENGENHARIA NAVAL", 35, 25);
    // Draw Logo symbol (N)
    doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
    doc.rect(20, 15, 12, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("N", 23, 23);
  }

  // Right Badge
  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.roundedRect(130, 12, 60, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(rightBadgeText, 160, 18.5, { align: "center" });
  
  // Date Text
  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(dateText, 160, 27, { align: "center" });

  // Divider
  doc.setDrawColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.setLineWidth(1);
  doc.line(20, 32, 190, 32);
};

const drawFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Nautilus Projetos Navais LTDA · contato@nautilusengenharianaval.com.br", 20, pageHeight - 15);
  doc.text(`Página ${pageNumber} de ${totalPages}`, 190, pageHeight - 15, { align: "right" });
};

export const generateProposalPdf = (proposal: Proposal, logoConfig?: LogoConfig) => {
  const doc = new jsPDF();
  
  const dateStr = new Date(proposal.dataEmissao || proposal.criadoEm).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
  drawHeader(doc, `PROPOSTA Nº ${proposal.numero}`, `Belém/PA, ${dateStr}`, logoConfig);

  // Hero section
  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.roundedRect(20, 40, 170, 50, 4, 4, "F");
  
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("P R O P O S T A   T É C N I C A   &   C O M E R C I A L", 30, 50);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const titleText = doc.splitTextToSize(proposal.assunto, 150);
  doc.text(titleText, 30, 60);

  // Intro text
  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const introText = doc.splitTextToSize("Prezado(a), apresentamos a V.S.ª a proposta detalhada para a realização de levantamento técnico e elaboração de relatório de medição de espessura de chapas por ultrassom, com croqui de sondagem e declaração de responsabilidade técnica.", 170);
  doc.text(introText, 20, 105);

  let currentY = 125;

  // Section 1
  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.circle(23, currentY - 1, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("1", 23, currentY, { align: "center" });

  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.setFontSize(10);
  doc.text("ESCOPO DOS SERVIÇOS", 30, currentY);
  
  currentY += 8;

  proposal.itens.forEach((item, idx) => {
    doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
    doc.roundedRect(20, currentY, 170, 10, 2, 2, "F");
    
    doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(String(idx + 1).padStart(2, '0'), 25, currentY + 6);
    
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont("helvetica", "normal");
    doc.text(item.descricao, 35, currentY + 6);
    
    currentY += 12;
  });

  drawFooter(doc, 1, 1);
  doc.save(`Proposta_${proposal.numero.replace(/\//g, '-')}.pdf`);
};

export const generateProtocolPdf = (protocol: Protocol, logoConfig?: LogoConfig) => {
  const doc = new jsPDF();
  drawHeader(doc, `PROTOCOLO Nº ${protocol.numeroProtocolo}`, `REVISÃO 00`, logoConfig);
  doc.text("Protocolo PDF Implementado", 20, 50);
  drawFooter(doc, 1, 1);
  doc.save(`Protocolo_${protocol.numeroProtocolo}.pdf`);
};

export const generateReceiptPdf = (entry: FinancialEntry, logoConfig?: LogoConfig) => {
  const doc = new jsPDF();
  drawHeader(doc, `RECIBO OFICIAL`, `EMISSÃO ${new Date().toLocaleDateString('pt-BR')}`, logoConfig);
  doc.text("Recibo PDF Implementado", 20, 50);
  drawFooter(doc, 1, 1);
  doc.save(`Recibo_${entry.id}.pdf`);
};
