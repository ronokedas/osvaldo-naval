import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Proposal, Protocol, FinancialEntry, Vessel, LogoConfig, DocumentTask, SignatureConfig } from '../types';
import { numberToWords } from './numberToWords';

const PRIMARY_DARK: [number, number, number] = [6, 18, 36];
const PRIMARY_BLUE: [number, number, number] = [25, 50, 90];
const LIGHT_GREY: [number, number, number] = [241, 245, 249];
const TEXT_DARK: [number, number, number] = [15, 23, 42];
const TEXT_GREY: [number, number, number] = [71, 85, 105];

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

const formatProposalDate = (value?: string) => {
  if (!value) return new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  }
  return value;
};

const formatShortDate = (value?: string) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split("-");
    return `${day}/${month}/${year}`;
  }
  return value;
};

const imageSourceToDataUrl = async (source?: string): Promise<string | null> => {
  if (!source) return null;
  if (source.startsWith("data:image/")) return source;

  try {
    const response = await fetch(source);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const makeWhiteBackgroundTransparent = async (dataUrl: string): Promise<string> => {
  return await new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context || !canvas.width || !canvas.height) return resolve(dataUrl);

        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let index = 0; index < pixels.data.length; index += 4) {
          const leastBrightChannel = Math.min(pixels.data[index], pixels.data[index + 1], pixels.data[index + 2]);
          if (leastBrightChannel >= 250) {
            pixels.data[index + 3] = 0;
          } else if (leastBrightChannel > 220) {
            pixels.data[index + 3] = Math.round(pixels.data[index + 3] * ((250 - leastBrightChannel) / 30));
          }
        }
        context.putImageData(pixels, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
};

let officialLogoDataUrl: Promise<string | null> | null = null;
const getOfficialLogoDataUrl = () => {
  if (!officialLogoDataUrl) {
    officialLogoDataUrl = fetch("/logooficial.png")
      .then(async (response) => {
        if (!response.ok) return null;
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })
      .catch(() => null);
  }
  return officialLogoDataUrl;
};

const drawProposalHeader = (doc: jsPDF, number: string, date: string, logo: string | null) => {
  if (logo) {
    // Use a larger header area while preserving the logo's original aspect ratio.
    // This keeps wide and tall versions visually balanced in the proposal PDF.
    try {
      const properties = doc.getImageProperties(logo);
      const maxWidth = 64;
      const maxHeight = 24;
      const scale = Math.min(maxWidth / properties.width, maxHeight / properties.height);
      const width = properties.width * scale;
      const height = properties.height * scale;
      const x = 20;
      const y = 21 - height / 2;
      doc.addImage(logo, "PNG", x, y, width, height, undefined, "FAST");
    } catch {
      // Keep the PDF usable if a legacy logo cannot expose image properties.
      doc.addImage(logo, "PNG", 20, 9, 60, 23, undefined, "FAST");
    }
  } else {
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...PRIMARY_DARK);
    doc.text("NAUTILUS", 20, 21); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.text("ENGENHARIA NAVAL", 20, 26);
  }
  doc.setFillColor(...PRIMARY_DARK); doc.roundedRect(143, 12, 47, 9, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
  doc.text(`PROPOSTA Nº ${number}`, 166.5, 17.7, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
  doc.text(`Belém/PA, ${date}`, 190, 27, { align: "right" });
  doc.setDrawColor(...PRIMARY_DARK); doc.setLineWidth(.8); doc.line(20, 33, 190, 33);
};

const drawProposalFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
  const height = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(.3); doc.line(20, height - 17, 190, height - 17);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(148, 163, 184);
  doc.text("Nautilus Projetos Navais LTDA · contato@nautilusengenharianaval.com.br", 20, height - 11);
  doc.text(`Página ${pageNumber} de ${totalPages}`, 190, height - 11, { align: "right" });
};

const drawWrappedBullet = (doc: jsPDF, text: string, y: number) => {
  const lines = doc.splitTextToSize(text.replace(/^[-•]\s*/, ""), 160) as string[];
  doc.setFillColor(201, 138, 37); doc.circle(20.7, y - 1.3, .8, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_GREY);
  doc.text(lines, 25, y, { lineHeightFactor: 1.35 });
  return y + lines.length * 4.8 + 3;
};

export const generateProposalPdf = async (proposal: Proposal, vessel?: Vessel, signatureConfig?: SignatureConfig): Promise<Blob> => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const date = formatProposalDate(proposal.dataEmissao || proposal.criadoEm);
  const logo = await getOfficialLogoDataUrl();
  const shouldApplySignature = Boolean(signatureConfig?.ativo && signatureConfig.aplicarPropostas && signatureConfig.imagemUrl);
  const rawSignatureImage = shouldApplySignature ? await imageSourceToDataUrl(signatureConfig?.imagemUrl) : null;
  const signatureImage = rawSignatureImage ? await makeWhiteBackgroundTransparent(rawSignatureImage) : null;
  const type = vessel?.tipo || "Embarcação";
  const title = proposal.assunto || "Elaboração de projetos e documentos técnicos";
  const addContinuationPage = (section: string) => {
    doc.addPage();
    drawProposalHeader(doc, proposal.numero, date, logo);
    drawSectionTitle(doc, "1", section, 43);
    return 52;
  };

  drawProposalHeader(doc, proposal.numero, date, logo);
  doc.setFillColor(...PRIMARY_DARK); doc.roundedRect(20, 43, 170, 52, 4, 4, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(160, 181, 229);
  doc.text("P R O P O S T A   T É C N I C A   &   C O M E R C I A L", 30, 54);
  doc.setFontSize(14); doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(title, 145) as string[];
  doc.text(titleLines.slice(0, 3), 30, 65, { lineHeightFactor: 1.25 });
  const tags = [["A/C", proposal.destinatario || "Cliente"], ["Embarcação", vessel?.nome || proposal.embarcacaoNome], ["Tipo", type]];
  let x = 30;
  tags.forEach(([label, value]) => {
    const width = Math.min(55, Math.max(31, doc.getTextWidth(`${label} ${value}`) + 10));
    doc.setFillColor(48, 76, 124); doc.roundedRect(x, 84, width, 8, 4, 4, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(220, 228, 246); doc.text(`${label} `, x + 4, 89.2);
    doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255); doc.text(String(value).slice(0, 22), x + 4 + doc.getTextWidth(`${label} `), 89.2);
    x += width + 4;
  });
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_GREY);
  doc.text(doc.splitTextToSize("Prezado(a), apresentamos a V.S.ª a proposta detalhada para a realização de levantamento técnico e elaboração de documentos conforme escopo abaixo.", 170), 20, 108, { lineHeightFactor: 1.45 });

  let y = 126;
  drawSectionTitle(doc, "1", "ESCOPO DOS SERVIÇOS", y); y += 8;
  proposal.itens.forEach((item, index) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    const lines = doc.splitTextToSize(item.descricao || "Item de escopo", 113) as string[];
    const rowHeight = Math.max(10, lines.length * 4.6 + 4.5);
    if (y + rowHeight > 218) y = addContinuationPage("ESCOPO DOS SERVIÇOS (CONTINUAÇÃO)");
    doc.setFillColor(...LIGHT_GREY); doc.roundedRect(20, y, 170, rowHeight, 2, 2, "F");
    doc.setFillColor(51, 68, 186); doc.rect(20, y, 1, rowHeight, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(51, 68, 186); doc.text(String(index + 1).padStart(2, "0"), 25, y + 6);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_DARK); doc.text(lines, 35, y + 6, { lineHeightFactor: 1.25 });
    const itemTotal = Math.max(0, Number(item.quantidade) || 0) * Math.max(0, Number(item.valorUnitario) || 0);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...PRIMARY_DARK);
    doc.text(`R$ ${itemTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 185, y + 6, { align: "right" });
    y += rowHeight + 3;
  });
  // Keep the numbered section marker clear of the final scope row.
  y += 4;
  if (y + 78 > 290) { doc.addPage(); drawProposalHeader(doc, proposal.numero, date, logo); y = 43; }
  drawSectionTitle(doc, "2", "PRAZO & VALIDADE", y); y += 8;
  [[20, "PRAZO DE ENTREGA", `${proposal.prazoEntregaDias || 10} dias`, "a contar do aceite formal"], [108, "VALIDADE DA PROPOSTA", "30 dias", "a partir da emissão"]].forEach(([boxX, label, value, caption]) => {
    doc.setFillColor(236, 240, 255); doc.roundedRect(Number(boxX), y, 82, 25, 3, 3, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(51, 68, 186); doc.text(String(label), Number(boxX) + 5, y + 7);
    doc.setFontSize(16); doc.setTextColor(...PRIMARY_DARK); doc.text(String(value), Number(boxX) + 5, y + 17);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...TEXT_GREY); doc.text(String(caption), Number(boxX) + 5, y + 22);
  });
  y += 37;
  drawSectionTitle(doc, "3", "CONDIÇÕES GERAIS", y); y += 9;
  const observations = (proposal.observacoesGerais || "").split("\n").filter(Boolean);
  observations.forEach((observation) => {
    const lineHeight = (doc.splitTextToSize(observation.replace(/^[-•]\s*/, ""), 160) as string[]).length * 4.8 + 3;
    if (y + lineHeight > 290) { doc.addPage(); drawProposalHeader(doc, proposal.numero, date, logo); drawSectionTitle(doc, "3", "CONDIÇÕES GERAIS (CONTINUAÇÃO)", 43); y = 52; }
    y = drawWrappedBullet(doc, observation, y);
  });

  // Reuse a short continuation page for the commercial sections. This avoids
  // leaving a nearly blank page between the conditions and the final content.
  if (y > 85) {
    doc.addPage();
    drawProposalHeader(doc, proposal.numero, date, logo);
    y = 43;
  } else {
    y += 8;
  }
  drawSectionTitle(doc, "4", "PAGAMENTO & PARALISAÇÃO", y); y += 9;
  y = drawWrappedBullet(doc, "Daremos início ao serviço após o aceite formal desta proposta e o pagamento do sinal, necessário para a quitação das taxas de ART e despesas de escritório.", y);
  y = drawWrappedBullet(doc, "Caso o processo seja paralisado por pendência do armador/proprietário, o pagamento das parcelas deverá continuar até a quitação total dos valores desta proposta.", y) + 8;
  drawSectionTitle(doc, "5", "HONORÁRIOS", y); y += 8;
  const subtotal = proposal.itens.reduce((sum, item) => sum + Math.max(0, Number(item.quantidade) || 0) * Math.max(0, Number(item.valorUnitario) || 0), 0);
  const discount = Math.min(subtotal, Math.max(0, Number(proposal.valorDesconto) || 0));
  doc.setFillColor(...PRIMARY_DARK); doc.roundedRect(20, y, 85, 29, 3, 3, "F"); doc.rect(102, y, 3, 29, "F");
  doc.setFillColor(236, 240, 255); doc.roundedRect(105, y, 85, 29, 3, 3, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(160, 181, 229); doc.text("VALOR FINAL DO INVESTIMENTO", 25, y + 7);
  doc.setFontSize(7); doc.text(`Subtotal: R$ ${subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, y + 12);
  if (discount > 0) doc.text(`Desconto: -R$ ${discount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, y + 16);
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(255, 255, 255); doc.text(`R$ ${proposal.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, y + 25);
  doc.setFontSize(7); doc.setTextColor(51, 68, 186); doc.text("CONDIÇÃO DE PAGAMENTO", 110, y + 8);
  doc.setFontSize(9); doc.setTextColor(...PRIMARY_DARK); doc.text(doc.splitTextToSize(proposal.condicaoPagamento || "À vista", 75).slice(0, 2), 110, y + 16, { lineHeightFactor: 1.15 });
  y += 41;
  drawSectionTitle(doc, "6", "DADOS BANCÁRIOS", y); y += 8;
  [[20, 40, "BANCO", "Bradesco"], [62, 40, "AGÊNCIA", "0875-3"], [104, 40, "CONTA CORRENTE", "3508-4"], [146, 44, "CNPJ / PIX", "20.671.499/0001-76"]].forEach(([boxX, width, label, value]) => {
    doc.setFillColor(...LIGHT_GREY); doc.roundedRect(Number(boxX), y, Number(width), 15, 2, 2, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(148, 163, 184); doc.text(String(label), Number(boxX) + 3, y + 5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...PRIMARY_DARK); doc.text(String(value), Number(boxX) + 3, y + 11);
  });
  y += 25;
  doc.setFillColor(...LIGHT_GREY); doc.roundedRect(20, y, 80, 70, 3, 3, "F");
  if (signatureImage) {
    try {
      const properties = doc.getImageProperties(signatureImage);
      const scale = Math.min(55 / properties.width, 28 / properties.height);
      const signatureWidth = properties.width * scale;
      const signatureHeight = properties.height * scale;
      const format = signatureImage.match(/^data:image\/(png|jpe?g|webp)/i)?.[1]?.replace(/jpg/i, "JPEG").replace(/jpeg/i, "JPEG").toUpperCase() || "PNG";
      doc.addImage(signatureImage, format, 60 - signatureWidth / 2, y + 52 - signatureHeight, signatureWidth, signatureHeight, undefined, "FAST");
    } catch {
      // Keep the signature block usable even if a legacy image cannot be decoded.
    }
  }
  doc.setDrawColor(...PRIMARY_DARK); doc.setLineWidth(.5); doc.line(30, y + 55, 90, y + 55);
  const signerName = signatureConfig?.ativo && signatureConfig.nomeSignatario ? signatureConfig.nomeSignatario : "Deisy Saldanha";
  const signerRole = signatureConfig?.ativo && signatureConfig.cargoSignatario ? signatureConfig.cargoSignatario : "Administrativo / Financeiro";
  const signerRegistration = signatureConfig?.ativo && signatureConfig.creaOrRegistro ? signatureConfig.creaOrRegistro : "Nautilus Projetos Navais LTDA";
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...PRIMARY_DARK); doc.text(signerName, 60, y + 61, { align: "center", maxWidth: 72 });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.text(signerRole, 60, y + 65, { align: "center", maxWidth: 72 }); doc.text(signerRegistration, 60, y + 69, { align: "center", maxWidth: 72 });
  doc.setFillColor(...PRIMARY_DARK); doc.roundedRect(110, y, 80, 70, 3, 3, "F"); doc.setFillColor(255, 255, 255); doc.rect(110.5, y + 12, 79, 57.5, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.text("ACEITE FORMAL", 150, y + 8, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...TEXT_GREY); doc.text("Aceito o escopo e as condições desta proposta.", 115, y + 20);
  const accepted = proposal.aceiteData && proposal.aceiteAssinaturaNome;
  [["DATA", formatShortDate(proposal.aceiteData)], ["ASSINATURA", ""], ["NOME", accepted ? proposal.aceiteAssinaturaNome! : ""]].forEach(([label, value], index) => {
    const rowY = y + 30 + index * 15; doc.setFontSize(6); doc.setTextColor(148, 163, 184); doc.text(label, 115, rowY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...TEXT_GREY); if (value) doc.text(value, 116, rowY + 5);
    doc.setDrawColor(203, 213, 225); doc.line(115, rowY + 6, 185, rowY + 6);
  });
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) { doc.setPage(page); drawProposalFooter(doc, page, totalPages); }
  return doc.output("blob");
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const blobToBase64 = async (blob: Blob): Promise<string> => {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

const receiptMoney = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const drawReceiptSectionTitle = (doc: jsPDF, number: string, title: string, y: number) => {
  doc.setFillColor(...PRIMARY_DARK); doc.circle(23, y - 1.5, 3, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(255, 255, 255);
  doc.text(number, 23, y, { align: "center" });
  doc.setFontSize(9); doc.setTextColor(...PRIMARY_DARK); doc.text(title, 29, y);
};

const drawReceiptHeader = (doc: jsPDF, receiptNumber: string, date: string, logo: string | null) => {
  if (logo) {
    try {
      const properties = doc.getImageProperties(logo);
      const scale = Math.min(45 / properties.width, 18 / properties.height);
      const width = properties.width * scale;
      const height = properties.height * scale;
      doc.addImage(logo, "PNG", 20, 20 - height / 2, width, height, undefined, "FAST");
    } catch {
      doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...PRIMARY_DARK);
      doc.text("NAUTILUS", 20, 21);
    }
  } else {
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...PRIMARY_DARK);
    doc.text("NAUTILUS", 20, 21); doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    doc.text("ENGENHARIA NAVAL", 20, 26);
  }

  doc.setFillColor(...PRIMARY_DARK); doc.roundedRect(118, 11, 55, 9, 1.5, 1.5, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(160, 181, 229); doc.text("RECIBO OFICIAL", 123, 15.2);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.text(receiptNumber, 123, 18.3);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240); doc.roundedRect(177, 11, 33, 9, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(148, 163, 184); doc.text("EMISSÃO", 180, 15.2);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...PRIMARY_DARK); doc.text(date, 180, 18.3);
  doc.setDrawColor(...PRIMARY_DARK); doc.setLineWidth(0.8); doc.line(20, 30, 190, 30);
};

export const generateReceiptPdf = async (entry: FinancialEntry, logoConfig?: LogoConfig): Promise<Blob> => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const date = new Date(entry.data).toLocaleDateString('pt-BR');
  const year = new Date(entry.data).getFullYear();
  const receiptNumber = `REC-${entry.reciboNumero || entry.id.substring(0, 6).toUpperCase()}/${year}`;
  const amount = Number(entry.valor) || 0;
  const payer = entry.clienteNome || "ARMADOR / RESPONSÁVEL PELA EMBARCAÇÃO";
  const extraEntry = entry as FinancialEntry & { propostaNumero?: string; proposta?: { numero?: string } };
  const proposalNumber = extraEntry.propostaNumero || extraEntry.proposta?.numero || entry.observacao.match(/DS\s*\d+\/\d+/i)?.[0] || "Não informado";
  const reference = entry.observacao || "Pagamento de serviços de engenharia naval";
  const logo = await getOfficialLogoDataUrl();

  drawReceiptHeader(doc, receiptNumber, date, logo);

  doc.setFillColor(...PRIMARY_DARK); doc.roundedRect(20, 36, 170, 35, 4, 4, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(201, 138, 37); doc.text("C O N T R O L E   F I N A N C E I R O", 30, 44);
  doc.setFontSize(16); doc.setTextColor(255, 255, 255); doc.text(entry.tipo === "quitacao" ? "Recibo de quitação" : "Recibo de pagamento", 30, 52);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(190, 204, 230); doc.text("Documento vinculado à baixa financeira original.", 30, 63);
  doc.setDrawColor(107, 130, 173); doc.setLineWidth(.4); doc.line(126, 43, 126, 62);
  doc.setFontSize(7); doc.setTextColor(160, 181, 229); doc.text("VALOR RECEBIDO", 132, 45);
  doc.setFont("helvetica", "bold"); doc.setFontSize(21); doc.setTextColor(255, 255, 255); doc.text(receiptMoney(amount), 132, 55);
  doc.setFillColor(48, 76, 124); doc.roundedRect(132, 59, 50, 6, 3, 3, "F"); doc.setFillColor(96, 211, 165); doc.circle(135, 62, 1.5, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(220, 228, 246); doc.text("PAGAMENTO CONFIRMADO", 139, 63.5);

  doc.setDrawColor(226, 232, 240); doc.setLineWidth(.4); doc.roundedRect(20, 77, 170, 30, 3, 3, "S");
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(224, 204, 159); doc.text('“', 25, 84);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_DARK);
  const receivedText = `Recebemos de ${payer}, inscrito no CPF/CNPJ sob nº ________________________, a quantia de ${receiptMoney(amount)}, referente à ${reference}.`;
  doc.text(doc.splitTextToSize(receivedText, 150), 30, 87, { lineHeightFactor: 1.35 });
  doc.setDrawColor(226, 232, 240); doc.line(30, 98, 184, 98); doc.setFontSize(6); doc.setTextColor(148, 163, 184); doc.text("VALOR POR EXTENSO", 30, 103);
  doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(...TEXT_DARK); doc.text(numberToWords(amount), 60, 103);

  let y = 114;
  drawReceiptSectionTitle(doc, "1", "DADOS DO PAGAMENTO", y); y += 8;
  const drawReceiptInfoBox = (x: number, width: number, title: string, value: string, subtitle: string, accent = false) => {
    const fill: [number, number, number] = accent ? [236, 240, 255] : [241, 245, 249];
    doc.setFillColor(...fill); doc.roundedRect(x, y, width, 17, 2, 2, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(accent ? 51 : 148, accent ? 68 : 163, accent ? 186 : 184); doc.text(title, x + 3, y + 5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...PRIMARY_DARK); doc.text(value.slice(0, 26), x + 3, y + 10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(148, 163, 184); doc.text(subtitle, x + 3, y + 14);
  };
  drawReceiptInfoBox(20, 40, "DATA DO PAGAMENTO", date, "Data da baixa financeira");
  drawReceiptInfoBox(62, 40, "FORMA DE PAGAMENTO", entry.formaPagamento, "Conta cadastrada no sistema", true);
  drawReceiptInfoBox(104, 46, "CLIENTE / PAGADOR", entry.clienteNome || "Armador responsável", "CPF/CNPJ vinculado ao cadastro");
  drawReceiptInfoBox(152, 38, "PROPOSTA / PROCESSO", proposalNumber, "Processo operacional vinculado");

  y += 25; drawReceiptSectionTitle(doc, "2", "REFERÊNCIA DO RECEBIMENTO", y); y += 8;
  doc.setDrawColor(226, 232, 240); doc.roundedRect(20, y, 105, 20, 3, 3, "S"); doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(148, 163, 184); doc.text("SERVIÇO CONTRATADO", 24, y + 5);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...PRIMARY_DARK); doc.text(reference.slice(0, 58), 24, y + 11); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...TEXT_GREY); doc.text("Serviço registrado na baixa financeira.", 24, y + 16);
  doc.setFillColor(255, 248, 235); doc.setDrawColor(224, 204, 159); doc.roundedRect(129, y, 61, 20, 3, 3, "FD"); doc.setFontSize(6); doc.setTextColor(159, 116, 39); doc.text("EMBARCAÇÃO VINCULADA", 133, y + 5); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...PRIMARY_DARK); doc.text(entry.embarcacaoNome.slice(0, 18), 133, y + 12); doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(159, 116, 39); doc.text("Tipo: Embarcação", 133, y + 17);

  y += 29; drawReceiptSectionTitle(doc, "3", "RESUMO FINANCEIRO DA PROPOSTA", y); y += 8;
  doc.setFillColor(...PRIMARY_DARK); doc.roundedRect(20, y, 170, 25, 3, 3, "F"); doc.setFillColor(...LIGHT_GREY); doc.rect(20, y + 7, 170, 18, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(255, 255, 255); doc.text("COMPOSIÇÃO DOS VALORES", 25, y + 5);
  [[25, "SUBTOTAL", amount], [65, "DESCONTO", 0], [105, "TOTAL LÍQUIDO", amount], [147, "VALOR DESTE RECIBO", amount]].forEach(([x, label, value]) => { const boxX = Number(x); doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(148, 163, 184); doc.text(String(label), boxX, y + 12); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...PRIMARY_DARK); doc.text(receiptMoney(Number(value)), boxX, y + 19); });

  y += 27; doc.setFillColor(...LIGHT_GREY); doc.roundedRect(20, y, 88, 48, 3, 3, "F"); doc.setFillColor(42, 125, 91); doc.circle(28, y + 8, 4, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.text("✓", 26.2, y + 10.5); doc.setTextColor(...PRIMARY_DARK); doc.text("DOCUMENTO EMITIDO PELO SISTEMA NAUTILUS", 35, y + 9); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...TEXT_GREY); doc.text(doc.splitTextToSize("Este recibo é numerado por ano, vinculado à baixa financeira correspondente e preservado de forma imutável após sua emissão.", 78), 25, y + 19, { lineHeightFactor: 1.35 }); doc.setFontSize(6); doc.setTextColor(148, 163, 184); doc.text("IDENTIFICADOR DO PAGAMENTO", 25, y + 37); doc.line(25, y + 40, 68, y + 40); doc.text("DATA E HORA DA GERAÇÃO", 72, y + 37); doc.line(72, y + 40, 103, y + 40);
  doc.setDrawColor(...PRIMARY_DARK); doc.roundedRect(112, y, 78, 48, 3, 3, "S"); doc.line(118, y + 35, 184, y + 35); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...PRIMARY_DARK); doc.text(entry.lancadoPorNome || "Deisy Saldanha", 151, y + 40, { align: "center" }); doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(...TEXT_GREY); doc.text("Administrativo / Financeiro", 151, y + 44, { align: "center" }); doc.text("Nautilus Projetos Navais LTDA", 151, y + 47, { align: "center" });
  doc.setFillColor(250, 248, 244); doc.rect(20, 270, 170, 8, "F"); doc.setFillColor(201, 138, 37); doc.rect(20, 270, 1, 8, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(6); doc.setTextColor(...PRIMARY_DARK); doc.text("Importante:", 24, 275); doc.setFont("helvetica", "normal"); doc.text("este recibo comprova exclusivamente o pagamento informado e não substitui nota fiscal de serviço quando sua emissão for legalmente exigida.", 39, 275);
  drawFooter(doc, 1, 1);
  return doc.output("blob");
};

export const generateTechnicalReport = (task: DocumentTask, vessel: Vessel) => {
  const doc = new jsPDF();
  // Existing functionality retained as fallback
  doc.text("Report", 20, 20);
  doc.save(`Report_${task.id}.pdf`);
};

export const generateFinancialReportPdf = async (
  entries: FinancialEntry[],
  logoConfig?: LogoConfig,
  periodText: string = "Relatório Geral"
): Promise<Blob> => {
  const doc = new jsPDF();
  let currentY = 40;

  drawHeader(doc, "RELATÓRIO FINANCEIRO", periodText, logoConfig);

  // Resumo
  const totalReceitas = entries.filter(e => e.tipo !== 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
  const totalDespesas = entries.filter(e => e.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.roundedRect(20, currentY, 170, 25, 2, 2, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  
  doc.text("Total Entradas", 30, currentY + 10);
  doc.text(`R$ ${totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 30, currentY + 18);

  doc.text("Total Saídas", 90, currentY + 10);
  doc.text(`R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 90, currentY + 18);

  doc.text("Saldo do Período", 150, currentY + 10);
  doc.text(`R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 150, currentY + 18);

  currentY += 40;

  doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Detalhamento de Transações", 20, currentY);
  currentY += 5;

  const tableData = entries.map(entry => [
    formatShortDate(entry.data),
    entry.embarcacaoNome,
    entry.tipo.toUpperCase(),
    entry.formaPagamento,
    entry.observacao || '-',
    `R$ ${entry.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  ]);

  (doc as any).autoTable({
    startY: currentY,
    head: [['Data', 'Embarcação', 'Tipo', 'Forma Pagamento', 'Observação', 'Valor']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: PRIMARY_DARK,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: TEXT_DARK,
    },
    alternateRowStyles: {
      fillColor: LIGHT_GREY,
    },
    didDrawPage: function (data: any) {
      drawFooter(doc, data.pageNumber, data.pageCount || data.pageNumber);
    },
  });

  return doc.output("blob");
};
