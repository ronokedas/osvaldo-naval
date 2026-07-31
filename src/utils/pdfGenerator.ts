import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DocumentTask, Vessel } from '../types';

export const generateTechnicalReport = (task: DocumentTask, vessel: Vessel) => {
  const doc = new jsPDF();
  
  // Set fonts and colors
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(5, 150, 105); // Emerald 600
  
  // Header
  doc.text("Nautilus Engenharia Naval", 105, 20, { align: 'center' });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Relatório Técnico Documental", 105, 28, { align: 'center' });
  
  // Divider
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  
  // Vessel Information
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text("Informações da Embarcação", 20, 45);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${vessel.nome}`, 20, 55);
  doc.text(`Tipo: ${vessel.tipo || '-'}`, 20, 62);
  doc.text(`Registro/Inscrição: ${vessel.registro || '-'}`, 20, 69);
  doc.text(`Cliente/Armador: ${vessel.clienteNome || '-'}`, 20, 76);
  doc.text(`Certificadora Principal: ${vessel.certificadoraPrincipal || '-'}`, 20, 83);
  
  // Document/Task Information
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Detalhes do Documento / Laudo", 20, 98);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Título: ${task.titulo}`, 20, 108);
  doc.text(`Tipo de Documento: ${task.tipo.toUpperCase()}`, 20, 115);
  doc.text(`Certificadora Destino: ${task.certificadora}`, 20, 122);
  doc.text(`Status Atual: ${task.status.toUpperCase().replace('_', ' ')}`, 20, 129);
  
  doc.text(`Responsável Técnico: ${task.responsavelNome} (${task.responsavelCargo || 'Técnico'})`, 20, 136);
  doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 20, 143);
  
  let currentY = 153;
  if (task.observacoes) {
    doc.setFont("helvetica", "bold");
    doc.text("Observações:", 20, currentY);
    doc.setFont("helvetica", "normal");
    
    const splitObs = doc.splitTextToSize(task.observacoes, 170);
    doc.text(splitObs, 20, currentY + 7);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  doc.setDrawColor(200);
  doc.line(20, pageHeight - 30, 190, pageHeight - 30);
  
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Documento gerado eletronicamente pelo Sistema Nautilus", 105, pageHeight - 22, { align: 'center' });
  doc.text("Assinatura do Técnico", 150, pageHeight - 40, { align: 'center' });
  doc.line(120, pageHeight - 45, 180, pageHeight - 45);
  
  // Save PDF
  const filename = `Laudo_${task.tipo}_${vessel.nome.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

export async function generateProposalPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    // Fallback to print dialog if canvas fails
    window.print();
  }
}
