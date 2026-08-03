import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Proposal, Protocol, FinancialEntry, Vessel, LogoConfig, DocumentTask } from '../types';

const PRIMARY_DARK = [6, 18, 36];
const PRIMARY_BLUE = [25, 50, 90];
const LIGHT_GREY = [241, 245, 249];
const TEXT_DARK = [15, 23, 42];
const TEXT_GREY = [71, 85, 105];

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
    // Logo text
    doc.text("NAUTILUS", 32, 20);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("ENGENHARIA NAVAL", 32, 25);
    // Draw Logo symbol (N)
    doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
    doc.rect(20, 14, 9, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("N", 21.5, 21.5);
  }

  // Right Badge
  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.roundedRect(130, 11, 60, 9, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(rightBadgeText, 160, 17, { align: "center" });
  
  // Date Text
  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(dateText, 160, 25, { align: "center" });

  // Divider
  doc.setDrawColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.setLineWidth(0.8);
  doc.line(20, 30, 190, 30);
};

const drawFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Nautilus Projetos Navais LTDA · contato@nautilusengenharianaval.com.br", 20, pageHeight - 12);
  doc.text(`Página ${pageNumber} de ${totalPages}`, 190, pageHeight - 12, { align: "right" });
};

const drawSectionTitle = (doc: jsPDF, number: string, text: string, y: number) => {
  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.circle(23, y - 1.5, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(number, 23, y, { align: "center" });

  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.setFontSize(9);
  doc.text(text, 29, y);
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
  const titleText = doc.splitTextToSize(proposal.assunto || "Elaboração de projetos e documentos técnicos", 150);
  doc.text(titleText, 30, 60);

  // Tags
  let tagX = 30;
  const tags = [
    { label: "A/C ", value: proposal.destinatario || "Cliente" },
    { label: "Embarcação ", value: proposal.embarcacaoNome || "-" },
    { label: "Tipo ", value: "Embarcação" }
  ];
  
  tags.forEach(tag => {
    doc.setFillColor(40, 60, 90);
    doc.roundedRect(tagX, 75, 45, 8, 2.5, 2.5, "F");
    doc.setTextColor(200, 200, 200);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(tag.label, tagX + 3, 80);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(tag.value, tagX + 13, 80);
    tagX += 48;
  });

  // Intro text
  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const introText = doc.splitTextToSize("Prezado(a), apresentamos a V.S.ª a proposta detalhada para a realização de levantamento técnico e elaboração de documentos conforme escopo abaixo.", 170);
  doc.text(introText, 20, 103);

  let currentY = 120;

  // Section 1
  drawSectionTitle(doc, "1", "ESCOPO DOS SERVIÇOS", currentY);
  currentY += 8;

  proposal.itens.forEach((item, idx) => {
    if (currentY > 260) {
      drawFooter(doc, 1, 2);
      doc.addPage();
      currentY = 20;
    }
    doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
    doc.roundedRect(20, currentY, 170, 9, 2, 2, "F");
    
    doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(String(idx + 1).padStart(2, '0'), 25, currentY + 6);
    
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(item.descricao, 35, currentY + 6);
    
    currentY += 11;
  });

  currentY += 10;
  
  if (currentY > 240) {
    drawFooter(doc, 1, 2);
    doc.addPage();
    currentY = 30;
  }

  // Section 2
  drawSectionTitle(doc, "2", "PRAZO & VALIDADE", currentY);
  currentY += 8;

  // Prazo box
  doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
  doc.roundedRect(20, currentY, 82, 25, 3, 3, "F");
  doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("PRAZO DE ENTREGA", 25, currentY + 6);
  doc.setFontSize(16);
  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.text(`${proposal.prazoEntregaDias || 15} dias`, 25, currentY + 16);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.text("a contar do aceite formal", 25, currentY + 22);

  // Validade box
  doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
  doc.roundedRect(108, currentY, 82, 25, 3, 3, "F");
  doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("VALIDADE DA PROPOSTA", 113, currentY + 6);
  doc.setFontSize(16);
  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.text(`30 dias`, 113, currentY + 16);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.text("a partir da emissão", 113, currentY + 22);

  currentY += 35;

  // Section 3
  drawSectionTitle(doc, "3", "CONDIÇÕES GERAIS", currentY);
  currentY += 8;

  const condicoes = proposal.observacoesGerais.split('\n').filter(l => l.trim() !== '');
  condicoes.forEach(cond => {
    doc.setFillColor(217, 119, 6); // amber dot
    doc.circle(22, currentY - 1, 1, "F");
    doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(cond.replace(/^[-•]\s*/, ''), 26, currentY);
    currentY += 7;
  });

  drawFooter(doc, 1, 2);
  doc.addPage();
  drawHeader(doc, `PROPOSTA Nº ${proposal.numero}`, `Belém/PA, ${dateStr}`, logoConfig);
  
  currentY = 40;
  
  drawSectionTitle(doc, "4", "PAGAMENTO & PARALISAÇÃO", currentY);
  currentY += 8;
  
  doc.setFillColor(217, 119, 6);
  doc.circle(22, currentY - 1, 1, "F");
  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const p1 = doc.splitTextToSize("Daremos início ao serviço após o aceite formal desta proposta e o pagamento do sinal, necessário para a quitação das taxas de ART e despesas de escritório.", 160);
  doc.text(p1, 26, currentY);
  currentY += 10;
  doc.setFillColor(217, 119, 6);
  doc.circle(22, currentY - 1, 1, "F");
  const p2 = doc.splitTextToSize("Caso o processo seja paralisado por pendência do armador/proprietário, o pagamento das parcelas deverá continuar até a quitação total dos valores desta proposta.", 160);
  doc.text(p2, 26, currentY);

  currentY += 20;

  // Section 5
  drawSectionTitle(doc, "5", "HONORÁRIOS", currentY);
  currentY += 8;

  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.path([{op: 'm', c: [20, currentY]}, {op: 'l', c: [105, currentY]}, {op: 'l', c: [105, currentY + 25]}, {op: 'l', c: [20, currentY + 25]}]);
  doc.roundedRect(20, currentY, 85, 25, 3, 3, "F");
  // Fill the right gap with square corners for seamless connection (simulated)
  
  doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
  doc.roundedRect(105, currentY, 85, 25, 3, 3, "F");
  
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("VALOR DO INVESTIMENTO", 25, currentY + 7);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`R$ ${proposal.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, currentY + 18);

  doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("CONDIÇÃO DE PAGAMENTO", 110, currentY + 7);
  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.setFontSize(11);
  doc.text(proposal.condicaoPagamento || "À vista", 110, currentY + 16);

  currentY += 35;

  // Section 6
  drawSectionTitle(doc, "6", "DADOS BANCÁRIOS", currentY);
  currentY += 8;

  const drawBankBox = (x: number, w: number, title: string, val: string) => {
    doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
    doc.roundedRect(x, currentY, w, 15, 2, 2, "F");
    doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(title, x + 3, currentY + 5);
    doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(val, x + 3, currentY + 11);
  }

  drawBankBox(20, 40, "BANCO", "Bradesco");
  drawBankBox(62, 40, "AGÊNCIA", "0875-3");
  drawBankBox(104, 40, "CONTA CORRENTE", "3508-4");
  drawBankBox(146, 44, "CNPJ / PIX", "20.671.499/0001-76");

  currentY += 25;

  // Aceite Box
  doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
  doc.roundedRect(20, currentY, 80, 70, 3, 3, "F");
  
  doc.setDrawColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.setLineWidth(0.5);
  doc.line(30, currentY + 55, 90, currentY + 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.text(proposal.elaboradoPor || "Deisy Saldanha", 60, currentY + 60, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.text("Administrativo / Financeiro", 60, currentY + 64, { align: "center" });
  doc.text("Nautilus Projetos Navais LTDA", 60, currentY + 68, { align: "center" });

  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.roundedRect(110, currentY, 80, 70, 3, 3, "F");
  
  doc.setFillColor(255, 255, 255);
  doc.rect(110, currentY + 12, 80, 58, "F"); // white interior
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ACEITE FORMAL", 150, currentY + 8, { align: "center" });

  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Aceito o escopo e as condições desta proposta.", 115, currentY + 20);

  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text("DATA", 115, currentY + 30);
  doc.setDrawColor(220, 220, 220);
  doc.line(115, currentY + 36, 185, currentY + 36);

  doc.text("ASSINATURA", 115, currentY + 45);
  doc.line(115, currentY + 51, 185, currentY + 51);

  doc.text("NOME", 115, currentY + 60);
  doc.line(115, currentY + 66, 185, currentY + 66);

  drawFooter(doc, 2, 2);
  doc.save(`Proposta_${proposal.numero.replace(/\//g, '-')}.pdf`);
};

export const generateProtocolPdf = (protocol: Protocol, logoConfig?: LogoConfig) => {
  const doc = new jsPDF();
  drawHeader(doc, `PROTOCOLO NPN-ENT-${protocol.numeroProtocolo ? protocol.numeroProtocolo.split('-').pop() : 'XXX/XX'}`, `REVISÃO 00`, logoConfig);
  
  // Hero section
  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.roundedRect(20, 40, 170, 25, 4, 4, "F");
  
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("T E R M O   D E   C O N T R O L E   E   R E C E B I M E N T O", 30, 48);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Entrega de documentos técnicos à certificadora", 30, 56);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text("Registro do dossiê encaminhado, sua forma de transmissão e o recebimento pela entidade certificadora.", 30, 61);

  // Headers for details
  let currentY = 72;
  const drawDetailHeader = (x: number, w: number, title: string, val: string) => {
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text(title, x, currentY);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(x, currentY + 7, x + w, currentY + 7);
  };

  drawDetailHeader(20, 45, "CERTIFICADORA / DESTINATÁRIO", "");
  drawDetailHeader(70, 45, "EMBARCAÇÃO / MATRÍCULA", "");
  drawDetailHeader(120, 45, "ARMADOR / PROPRIETÁRIO", "");
  drawDetailHeader(170, 20, "PROPOSTA / OS", "");

  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(protocol.destinatario || protocol.orgaoOuEmpresa, 20, currentY + 5);
  doc.text(protocol.embarcacaoNome, 70, currentY + 5);
  doc.text(protocol.clienteNome, 120, currentY + 5);
  doc.text("-", 170, currentY + 5);

  currentY += 15;
  drawSectionTitle(doc, "01", "COMPOSIÇÃO DO DOSSIÊ TÉCNICO", currentY);
  
  currentY += 8;
  
  // Left side docs
  protocol.documentosIncluidos.forEach((docName, idx) => {
    doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
    doc.circle(23, currentY + 2.5, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(String(idx + 1), 23, currentY + 4, { align: "center" });

    doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(docName, 30, currentY + 4);
    
    // Checkboxes
    doc.setDrawColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    doc.rect(95, currentY, 4, 4);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("DIGITAL", 101, currentY + 3.5);
    
    doc.rect(115, currentY, 4, 4);
    doc.text("IMPRESSO", 121, currentY + 3.5);

    doc.setDrawColor(220, 220, 220);
    doc.line(30, currentY + 11, 70, currentY + 11);
    doc.text("NÚMERO / IDENTIFICAÇÃO", 30, currentY + 9);
    
    doc.line(75, currentY + 11, 105, currentY + 11);
    doc.text("REVISÃO", 75, currentY + 9);
    
    doc.line(110, currentY + 11, 135, currentY + 11);
    doc.text("QTD.", 110, currentY + 9);

    currentY += 15;
  });

  // Right side boxes
  let rightY = 95;
  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.roundedRect(140, rightY, 50, 35, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("DADOS DA TRANSMISSÃO", 143, rightY + 5);
  doc.setFontSize(6);
  doc.setTextColor(180, 180, 180);
  doc.text("DATA", 143, rightY + 12);
  doc.setDrawColor(100, 100, 100);
  doc.line(143, rightY + 16, 160, rightY + 16);
  doc.text("HORA", 170, rightY + 12);
  doc.line(170, rightY + 16, 187, rightY + 16);
  doc.text("ENVIADO POR", 143, rightY + 22);
  doc.line(143, rightY + 26, 160, rightY + 26);
  doc.text("MEIO DE ENVIO", 170, rightY + 22);
  doc.line(170, rightY + 26, 187, rightY + 26);

  rightY += 40;
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(140, rightY, 50, 25, 2, 2, "S");
  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("NATUREZA DO PROTOCOLO", 143, rightY + 5);
  
  const drawCheck = (y: number, text: string) => {
    doc.setDrawColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    doc.rect(143, y, 4, 4);
    doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(text, 149, y + 3.5);
  };
  
  drawCheck(rightY + 8, "Entrega inicial");
  drawCheck(rightY + 13, "Complementação");
  drawCheck(rightY + 18, "Revisão / substituição");

  rightY += 30;
  doc.setFillColor(255, 247, 237); // orange-50
  doc.setDrawColor(253, 186, 116); // orange-300
  doc.roundedRect(140, rightY, 50, 30, 2, 2, "FD");
  doc.setTextColor(194, 65, 12); // orange-700
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("SITUAÇÃO DO RECEBIMENTO", 143, rightY + 5);
  drawCheck(rightY + 8, "Recebido sem ressalva");
  drawCheck(rightY + 13, "Recebido com ressalva");
  drawCheck(rightY + 18, "Pendência comunicada");
  doc.text("PRAZO / RETORNO: ___ / ___ / ______", 143, rightY + 25);

  currentY = Math.max(currentY + 10, rightY + 40);

  drawSectionTitle(doc, "02", "CONFIRMAÇÃO FORMAL", currentY);
  currentY += 8;

  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.roundedRect(20, currentY, 170, 45, 3, 3, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(20, currentY + 7, 170, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ENTREGA E RECEBIMENTO DO DOSSIÊ", 25, currentY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text("Controle de rastreabilidade", 185, currentY + 5, { align: "right" });

  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.text("As partes confirmam a entrega e o recebimento dos documentos relacionados, de acordo com os meios, revisões e quantidades indicados neste protocolo.", 25, currentY + 13);

  doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
  doc.setFont("helvetica", "bold");
  doc.text("NAUTILUS - RESPONSÁVEL PELA ENTREGA", 25, currentY + 20);
  doc.text("CERTIFICADORA - RESPONSÁVEL PELO RECEBIMENTO", 100, currentY + 20);

  doc.setDrawColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.setLineWidth(0.5);
  
  doc.line(25, currentY + 38, 70, currentY + 38);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text("NOME / CARGO / ASSINATURA", 25, currentY + 42);
  
  doc.line(75, currentY + 38, 95, currentY + 38);
  doc.text("DATA", 75, currentY + 42);

  doc.line(100, currentY + 38, 150, currentY + 38);
  doc.text("NOME / CARGO / ASSINATURA", 100, currentY + 42);
  
  doc.line(155, currentY + 38, 185, currentY + 38);
  doc.text("DATA", 155, currentY + 42);

  drawFooter(doc, 1, 1);
  doc.save(`Protocolo_${protocol.numeroProtocolo}.pdf`);
};

export const generateReceiptPdf = (entry: FinancialEntry, logoConfig?: LogoConfig) => {
  const doc = new jsPDF();
  const dateStr = new Date(entry.data).toLocaleDateString('pt-BR');
  
  drawHeader(doc, `RECIBO OFICIAL\nREC-${entry.reciboNumero || entry.id.substring(0,6).toUpperCase()}/${new Date(entry.data).getFullYear()}`, `EMISSÃO\n${dateStr}`, logoConfig);

  // Hero section
  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.roundedRect(20, 40, 170, 35, 4, 4, "F");
  
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("C O N T R O L E   F I N A N C E I R O", 30, 48);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Recibo de\npagamento", 30, 56);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 200, 200);
  doc.text("Documento vinculado à baixa financeira original.", 30, 68);

  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("VALOR RECEBIDO", 120, 48);
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(`R$ ${entry.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 120, 58);

  doc.setFillColor(40, 60, 90);
  doc.roundedRect(120, 62, 50, 6, 3, 3, "F");
  doc.setFillColor(16, 185, 129); // green-500
  doc.circle(123, 65, 1.5, "F");
  doc.setFontSize(6);
  doc.text("PAGAMENTO CONFIRMADO", 127, 66.5);

  // Quote Box
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, 80, 170, 30, 3, 3, "S");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const receivedText = `Recebemos de ${entry.clienteNome || "ARMADOR / RESPONSÁVEL"}, a quantia de R$ ${entry.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, referente à ${entry.observacao || "Pagamento de serviços"}.`;
  doc.text(doc.splitTextToSize(receivedText, 150), 30, 90);
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text("VALOR POR EXTENSO", 30, 105);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.setFontSize(9);
  doc.text("(Valor por extenso omitido por simplificação do sistema)", 60, 105);

  let currentY = 120;
  
  drawSectionTitle(doc, "1", "DADOS DO PAGAMENTO", currentY);
  currentY += 8;

  const drawInfoBox = (x: number, w: number, title: string, val: string, subtitle: string) => {
    doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
    doc.roundedRect(x, currentY, w, 15, 2, 2, "F");
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text(title, x + 3, currentY + 4);
    doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
    doc.setFontSize(9);
    doc.text(val, x + 3, currentY + 9);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(subtitle, x + 3, currentY + 13);
  };

  drawInfoBox(20, 40, "DATA DO PAGAMENTO", dateStr, "Data da baixa financeira");
  drawInfoBox(62, 40, "FORMA DE PAGAMENTO", entry.formaPagamento, "Registrada no sistema");
  drawInfoBox(104, 40, "CLIENTE / PAGADOR", entry.clienteNome || "Armador", "Vinculado ao cadastro");
  drawInfoBox(146, 44, "PROCESSO", entry.embarcacaoNome, "Embarcação vinculada");

  currentY += 25;
  drawSectionTitle(doc, "2", "RESUMO FINANCEIRO", currentY);
  currentY += 8;

  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.roundedRect(20, currentY, 170, 25, 3, 3, "F");
  doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
  doc.rect(20, currentY + 7, 170, 18, "F"); // cover bottom rounded corners to make it flat inside
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("COMPOSIÇÃO DOS VALORES", 25, currentY + 5);

  doc.setTextColor(150, 150, 150);
  doc.text("VALOR DESTE RECIBO", 140, currentY + 12);
  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.setFontSize(14);
  doc.text(`R$ ${entry.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 140, currentY + 20);

  currentY += 35;
  
  // Doc Emitido section
  doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
  doc.roundedRect(20, currentY, 80, 50, 3, 3, "F");
  doc.setFillColor(16, 185, 129);
  doc.circle(28, currentY + 8, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("V", 26.5, currentY + 10.5); // checkmark fake

  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.text("DOCUMENTO EMITIDO PELO SISTEMA NAUTILUS", 35, currentY + 9);
  
  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(doc.splitTextToSize("Este recibo é numerado por ano, vinculado à baixa financeira correspondente e preservado de forma imutável após sua emissão.", 70), 25, currentY + 20);

  // Assinatura Box
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(110, currentY, 80, 50, 3, 3, "S");
  
  doc.setDrawColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.line(120, currentY + 35, 180, currentY + 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.text(entry.lancadoPorNome, 150, currentY + 40, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(TEXT_GREY[0], TEXT_GREY[1], TEXT_GREY[2]);
  doc.text("Administrativo / Financeiro", 150, currentY + 44, { align: "center" });

  drawFooter(doc, 1, 1);
  doc.save(`Recibo_${entry.reciboNumero || entry.id}.pdf`);
};

export const generateTechnicalReport = (task: DocumentTask, vessel: Vessel) => {
  const doc = new jsPDF();
  // Existing functionality retained as fallback
  doc.text("Report", 20, 20);
  doc.save(`Report_${task.id}.pdf`);
};
