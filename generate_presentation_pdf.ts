import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

async function generatePresentationPdf() {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 18;
  const contentWidth = pageWidth - margin * 2; // 174

  // Colors
  const NAVY = [11, 25, 44] as [number, number, number];       // #0B192C
  const BLUE = [37, 99, 235] as [number, number, number];      // #2563EB
  const DARK_SLATE = [30, 41, 59] as [number, number, number]; // #1E293B
  const MUTED = [100, 116, 139] as [number, number, number];   // #64748B
  const LIGHT_BG = [248, 250, 252] as [number, number, number];// #F8FAFC
  const EMERALD = [5, 150, 105] as [number, number, number];   // #059669
  const AMBER = [217, 119, 6] as [number, number, number];     // #D97706
  const BORDER_COLOR = [226, 232, 240] as [number, number, number];

  // Images
  const logoPath = path.join(process.cwd(), 'public', 'logooficial.png');
  let logoBase64: string | null = null;
  if (fs.existsSync(logoPath)) {
    const buf = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${buf.toString('base64')}`;
  }

  const mobileMockupPath = path.join(process.cwd(), 'modelos_tela_inicial_mobile', 'mockup_thumb.jpg');
  let mobileMockupBase64: string | null = null;
  if (fs.existsSync(mobileMockupPath)) {
    const buf = fs.readFileSync(mobileMockupPath);
    mobileMockupBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
  }

  // Header helper for internal pages
  const renderHeader = (pageNumber: number) => {
    if (pageNumber === 1) return; // Cover has its own header

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 10, 36, 11);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...NAVY);
      doc.text('NAUTILUS ENGENHARIA NAVAL', margin, 16);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text('SISTEMA INTEGRADO DE GESTÃO NAVAL', pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('Apresentação Estratégica para Diretoria • Engº Osvaldo', pageWidth - margin, 18, { align: 'right' });

    // Thin separator line
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.4);
    doc.line(margin, 23, pageWidth - margin, 23);
  };

  // ==========================================
  // PÁGINA 1: CAPA EXECUTIVA
  // ==========================================
  // Background Header Block
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 115, 'F');

  // Decorative blue glow bar
  doc.setFillColor(...BLUE);
  doc.rect(0, 114, pageWidth, 2.5, 'F');

  // Logo on Cover
  if (logoBase64) {
    // White background pill for logo
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 22, 60, 20, 3, 3, 'F');
    doc.addImage(logoBase64, 'PNG', margin + 3, 24, 54, 16);
  }

  // Cover Tag
  doc.setFillColor(255, 255, 255, 0.15);
  doc.roundedRect(margin, 52, 90, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(219, 234, 254); // Light blue
  doc.text('PLANEJAMENTO & CONTROLE ESTRATÉGICO', margin + 4, 56.8);

  // Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('NAUTILUS SISTEMA INTEGRADO', margin, 70);

  doc.setFontSize(14);
  doc.setTextColor(191, 219, 254);
  doc.text('Plataforma Especializada de Engenharia Naval & Gestão', margin, 80);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Automação de Propostas • Ordens de Serviço • Vistorias de Ultrassom', margin, 90);
  doc.text('Protocolos de Capitania & Certificadoras • FinOps por Embarcação', margin, 95);

  // Middle Content: Key Highlights Cards
  const cardsY = 128;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text('Por que uma ferramenta própria sob medida?', margin, cardsY);

  const pillars = [
    {
      title: 'Adequação Regulatória Naval',
      desc: 'Fluxo nativo para Capitania dos Portos (DPC) e Sociedades Classificadoras (RBNA, Amazon Naval), com controle de exigências e ciclos.',
      badge: 'Regulatório',
      color: BLUE,
    },
    {
      title: 'Amarração Técnica & Financeira',
      desc: 'Da proposta comercial (DS 0XX/AA) à Ordem de Serviço (OS) com saldo devedor recalculado automaticamente por embarcação.',
      badge: 'Zero Furos',
      color: EMERALD,
    },
    {
      title: 'Cockpit do Diretor no Celular',
      desc: 'Painel executivo simplificado: caixa, entradas do mês, gargalos urgentes e status da frota em 5 segundos, sem burocracia.',
      badge: 'Mobilidade',
      color: AMBER,
    },
  ];

  let pY = cardsY + 6;
  pillars.forEach((p) => {
    // Card box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, pY, contentWidth, 23, 2.5, 2.5, 'FD');

    // Left accent bar
    doc.setFillColor(...p.color);
    doc.rect(margin, pY, 2.5, 23, 'F');

    // Title & Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK_SLATE);
    doc.text(p.title, margin + 7, pY + 7);

    doc.setFontSize(7.5);
    doc.setTextColor(...p.color);
    doc.text(`[ ${p.badge} ]`, margin + contentWidth - 25, pY + 7);

    // Desc
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    const splitDesc = doc.splitTextToSize(p.desc, contentWidth - 14);
    doc.text(splitDesc, margin + 7, pY + 13);

    pY += 27;
  });

  // Footer Info Box on Cover
  const infoBoxY = 225;
  doc.setFillColor(...NAVY);
  doc.roundedRect(margin, infoBoxY, contentWidth, 48, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('DADOS DA APRESENTAÇÃO EXECUTIVA', margin + 8, infoBoxY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);

  const leftColX = margin + 8;
  const rightColX = margin + 90;

  doc.text('Destinatário:', leftColX, infoBoxY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Engº Osvaldo — Diretor Executivo', leftColX + 22, infoBoxY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Empresa:', leftColX, infoBoxY + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Nautilus Engenharia Naval & Consultoria', leftColX + 22, infoBoxY + 28);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Finalidade:', leftColX, infoBoxY + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Decisão de Investimento & Implantação', leftColX + 22, infoBoxY + 36);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Data:', rightColX, infoBoxY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Setembro de 2026', rightColX + 12, infoBoxY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Status:', rightColX, infoBoxY + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 211, 153); // Emerald
  doc.text('Auditoria Concluída • 100% Funcional', rightColX + 12, infoBoxY + 28);

  // ==========================================
  // PÁGINA 2: O CONTEXTO & PROBLEMAS 1 E 2
  // ==========================================
  doc.addPage();
  renderHeader(2);

  let curY = 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text('1. A Realidade da Nautilus e o Desafio dos Sistemas Comuns', margin, curY);

  curY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(...DARK_SLATE);
  const p1Text =
    'Empresas de engenharia naval e consultoria marítima operam em um ambiente de alta responsabilidade técnica e regulatória. O trabalho envolve vistorias de campo para medição de espessura por ultrassom, croquis de sondagem, planos de segurança, emissão de ARTs e homologações perante a Marinha do Brasil (Capitania dos Portos / DPC) e Sociedades Classificadoras (RBNA, Amazon Naval, etc.).';
  const splitP1 = doc.splitTextToSize(p1Text, contentWidth);
  doc.text(splitP1, margin, curY);
  curY += splitP1.length * 4.4 + 2;

  const p2Text =
    'Sistemas ERP genéricos de mercado (como os de comércio ou serviços padrão) falham por completo porque ignoram a lógica náutica: não conhecem embarcações (boca, pontal, comprimento), não compreendem ciclos de exigência externa e não geram propostas no padrão comercial da Nautilus. O Sistema Nautilus foi desenvolvido especificamente para sanar essas dores sem exigir esforço operacional da diretoria.';
  const splitP2 = doc.splitTextToSize(p2Text, contentWidth);
  doc.text(splitP2, margin, curY);
  curY += splitP2.length * 4.4 + 8;

  // Section: Os Problemas Reais Eliminados
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text('2. Os 5 Problemas Reais Eliminados na Prática', margin, curY);
  curY += 6;

  // Card: Problema 1
  const renderProblemCard = (num: string, title: string, reality: string, solution: string, tag: string, yPos: number): number => {
    const cardH = 43;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(margin, yPos, contentWidth, cardH, 2, 2, 'FD');

    // Header strip
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, yPos, contentWidth, 9, 2, 2, 'F');
    doc.rect(margin, yPos + 7, contentWidth, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(`${num} • ${title}`, margin + 5, yPos + 6.2);

    doc.setFontSize(7.5);
    doc.setTextColor(...BLUE);
    doc.text(tag, margin + contentWidth - 35, yPos + 6.2);

    // Reality
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38); // Red
    doc.text('A Realidade Anterior:', margin + 5, yPos + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_SLATE);
    const splitReal = doc.splitTextToSize(reality, contentWidth - 45);
    doc.text(splitReal, margin + 40, yPos + 15);

    // Solution
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...EMERALD);
    doc.text('A Solução no Sistema:', margin + 5, yPos + 26);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_SLATE);
    const splitSol = doc.splitTextToSize(solution, contentWidth - 45);
    doc.text(splitSol, margin + 40, yPos + 26);

    return yPos + cardH + 5;
  };

  curY = renderProblemCard(
    'Problema 1',
    'Orçamentos Demorados e Falta de Rastreio de Aceite Formal',
    'Orçamentos feitos em editores de texto ou planilhas tomam tempo, correm risco de erro em cálculos e muitas propostas aprovadas verbalmente ou por WhatsApp ficavam sem contrato anexado ou sem registro formal.',
    'Gera propostas oficiais (DS 0XX/AA) com cálculo automático de quantitativos e descontos, exporta PDF timbrado com assinatura digital e registra o Aceite Formal com upload do contrato assinado (até 25MB).',
    'Módulo Comercial',
    curY
  );

  curY = renderProblemCard(
    'Problema 2',
    'Barco Parado por Exigência da Capitania ou Certificadora',
    'Quando o perito da Capitania (DPC) ou da classificadora (RBNA, Amazon Naval) emite uma exigência técnica, se a notificação ficar presa no e-mail de um funcionário, a balsa atrasa em porto e o cliente cobra o dono.',
    'Aba de Protocolos & Entregas rastreia código de envio, órgão e ciclo. Caso surja Exigência Externa, um alerta vermelho imediato sobe no painel e no celular da diretoria para resolução urgente.',
    'Módulo Protocolos',
    curY
  );

  // Highlights on bottom of page 2
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, curY + 2, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...BLUE);
  doc.text('IMPACTO DIRETO NO CLIENTE (ARMADOR):', margin + 6, curY + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK_SLATE);
  doc.text('Redução do tempo de liberação da embarcação em porto. O armador percebe agilidade técnica de primeiro nível,', margin + 6, curY + 15);
  doc.text('garantindo preferência da frota na Nautilus em detrimento de concorrentes informais.', margin + 6, curY + 20);

  // ==========================================
  // PÁGINA 3: PROBLEMAS 3, 4 E 5 & FLUXO DA EQUIPE
  // ==========================================
  doc.addPage();
  renderHeader(3);

  curY = 32;

  curY = renderProblemCard(
    'Problema 3',
    '"Dinheiro na Mesa" — Serviço Entregue com Saldo Esquecido',
    'Comum a equipe técnica entregar o laudo e croqui de ultrassom e esquecer de checar se o armador quitou a última parcela. Pequenos saldos espalhados por várias embarcações acumulam prejuízos invisíveis.',
    'Ficha financeira consolidada por embarcação (Valor Contratado, Recebido e Saldo Pendente recalculados em tempo real no banco de dados). Emissão de Recibo Oficial em PDF com CNPJ/CPF do armador.',
    'Módulo Financeiro',
    curY
  );

  curY = renderProblemCard(
    'Problema 4',
    'Falta de Visão Operacional sobre Quem Está Fazendo o Quê',
    'O diretor precisa ligar para técnicos a todo momento para saber: "Quem está com o relatório da Balsa X? O croqui de sondagem foi desenhado? A ART foi recolhida?". Perda de tempo e retrabalho.',
    'Ordens de Serviço automáticas (OS 0XX/AA) criadas no ato do aceite da proposta. Cada serviço (Ultrassom, Desenho, ART) possui responsável técnico, data agendada e controle de versões de laudo (V1, V2, V3).',
    'Ordens de Serviço',
    curY
  );

  curY = renderProblemCard(
    'Problema 5',
    'Perda de Receita Recorrente de Renovações Periódicas (365 Dias)',
    'Vistorias de espessura de solda e certificados navais possuem validade anual. Sem controle, o armador só procura a empresa quando o certificado já venceu ou quando sofre fiscalização da Marinha.',
    'Varredura inteligente de Renovações Anuais: localiza automaticamente todas as embarcações que completaram 1 ano desde o último serviço e alerta o comercial para reabrir proposta vinculada em 1 clique.',
    'Renovações Anuais',
    curY
  );

  curY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text('3. O Fluxo de Trabalho Integrado da Equipe', margin, curY);
  curY += 5;

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: DARK_SLATE, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 45 },
      2: { cellWidth: 94 },
    },
    head: [['Papel na Nautilus', 'Responsável Típico', 'O que faz dentro da plataforma']],
    body: [
      ['Comercial & Propostas', 'Deisy Saldanha', 'Cadastra clientes/embarcações, gera propostas oficiais DS, compartilha via WhatsApp/E-mail e anexa contrato assinado.'],
      ['Engenharia & Campo', 'Técnicos & Desenhistas', 'Acompanham agenda de vistorias, fazem medições de espessura, sobem croquis, desenham planos e emitem ARTs.'],
      ['Logística & Entregas', 'Lucas (Expedição)', 'Despacha dossiês para Capitania/RBNA, acompanha protocolos, entrega laudos finais ao cliente e anexa canhotos.'],
      ['Diretoria Executiva', 'Engº Osvaldo', 'Não preenche formulários. Usa o Cockpit Mobile para monitorar caixa a receber, entradas do mês e gargalos críticos.'],
    ],
  });

  // ==========================================
  // PÁGINA 4: O COCKPIT MOBILE & AUDITORIA TÉCNICA
  // ==========================================
  doc.addPage();
  renderHeader(4);

  curY = 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text('4. A Visão do Dono no Celular: Cockpit Executivo de Bolso', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK_SLATE);
  const mobText =
    'O diretor não fica sentado o dia todo operando planilhas. Por isso, a tela inicial para celular foi adaptada para um painel executivo direto, com zero distrações operacionais:';
  doc.text(mobText, margin, curY);
  curY += 7;

  // 2 Columns: Left = Feature bullets, Right = Mobile mockup
  const colW = 105;
  const mockX = margin + colW + 8;
  const mockW = 58;
  const mockH = 105;

  if (mobileMockupBase64) {
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(mockX - 1, curY - 1, mockW + 2, mockH + 2, 3, 3, 'D');
    doc.addImage(mobileMockupBase64, 'JPEG', mockX, curY, mockW, mockH);
  }

  const mobFeatures = [
    {
      title: 'Saldo a Receber em 5 Segundos',
      desc: 'Mostra no topo o total a receber de todos os contratos e as entradas já registradas no mês (PIX/TED).',
    },
    {
      title: 'Radar de Atenção (Gestão por Exceção)',
      desc: 'Destaca apenas o que requer ação do diretor: processos com exigência na Capitania e propostas quentes aguardando fechamento.',
    },
    {
      title: 'Funil do Ciclo Naval Interativo',
      desc: 'Contadores em tempo real: Propostas, Vistorias, Laudos, Certificadoras e Entregas (com valores e filtro ao toque).',
    },
    {
      title: 'Frota Ativa na Palma da Mão',
      desc: 'Lista de embarcações abertas com cliente, certificadora (RBNA/Amazon Naval) e saldo devedor atualizado.',
    },
    {
      title: 'Zero Caixas Vazias',
      desc: 'Eliminou da tela do diretor cartões de operadores de campo ("sem tarefas atribuídas") que poluíam o celular.',
    },
  ];

  let mY = curY;
  mobFeatures.forEach((mf) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text(`• ${mf.title}`, margin, mY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...DARK_SLATE);
    const splitM = doc.splitTextToSize(mf.desc, colW);
    doc.text(splitM, margin + 3, mY + 9);

    mY += splitM.length * 3.8 + 8;
  });

  curY = Math.max(mY, curY + mockH) + 6;

  // Table of audited modules
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text('5. Recursos Já Implementados e Operacionais (Auditoria Técnica)', margin, curY);
  curY += 5;

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.2, textColor: DARK_SLATE, cellPadding: 2 },
    head: [['Módulo', 'Funcionalidade Auditada', 'Situação Atual']],
    body: [
      ['Propostas Comerciais', 'Numeração DS 0XX/AA, cálculo automático, motor de PDF timbrado, envio WhatsApp/Email', '100% Ativo'],
      ['Aceite Formal', 'Registro de responsável, meio de aceite, upload de contrato até 25MB e entrada no caixa', '100% Ativo'],
      ['Ordens de Serviço', 'Geração automática pós-aceite, divisão de ultrassom/laudo/ART, agenda técnica de campo', '100% Ativo'],
      ['Módulo Financeiro', 'Contas a Receber, Contas a Pagar, saldo por embarcação, Recibos oficiais em PDF e anexos', '100% Ativo'],
      ['Protocolos Externos', 'Rastreamento de dossiês perante Capitania/DPC e Certificadoras com alerta de exigência', '100% Ativo'],
      ['Renovações Anuais', 'Varredura automática de laudos completando 365 dias para reabertura de vistoria periódica', '100% Ativo'],
      ['Cockpit Mobile', 'Painel executivo simplificado para smartphone com alternador Visão Executiva / Completa', '100% Ativo'],
    ],
  });

  // ==========================================
  // PÁGINA 5: RETORNO DO INVESTIMENTO & CONCLUSÃO
  // ==========================================
  doc.addPage();
  renderHeader(5);

  curY = 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text('6. Retorno do Investimento (ROI Prático na Ponta do Lápis)', margin, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(...DARK_SLATE);
  const roiIntro =
    'O valor de uma ferramenta especializada de engenharia naval não está na tecnologia em si, mas no prejuízo que ela evita e na receita que ela traz de volta para o caixa da empresa:';
  doc.text(roiIntro, margin, curY);
  curY += 9;

  const roiPoints = [
    {
      num: '01',
      title: 'Recuperação de Parcelas Finais Esquecidas',
      desc: 'Em serviços de ultrassom e homologação, é comum a parcela final (30% a 50%) ficar esquecida após a entrega do documento técnico. Uma única parcela de R$ 5.000 a R$ 15.000 recuperada pelo controle de saldo do sistema já paga meses de operação da ferramenta.',
      cor: EMERALD,
    },
    {
      num: '02',
      title: 'Economia com Barco Parado em Porto',
      desc: 'Cada dia de balsa ou empurrador parado aguardando liberação na Capitania custa milhares de reais ao armador. Ao sanar exigências técnicas dias mais rápido por meio de alertas automáticos, a Nautilus se torna a consultoria mais eficiente e recomendada do setor.',
      cor: BLUE,
    },
    {
      num: '03',
      title: 'Receita Recorrente com Renovações Anuais',
      desc: 'Clientes atendidos há 1 ano são automaticamente sinalizados para renovação de medição de espessura e certificados. Uma carteira de 30 a 50 embarcações ativas renovando anualmente gera um fluxo de caixa previsível e recorrente sem custo de aquisição de novos clientes.',
      cor: AMBER,
    },
    {
      num: '04',
      title: 'Autoridade Técnica e Segurança Jurídica',
      desc: 'Propostas padronizadas com contrato anexado, recibos oficiais com CPF/CNPJ emitidos no ato e histórico de versões de documentos técnicos protegem a empresa contra contestações e transmitem credibilidade absoluta para armadores de grande porte.',
      cor: NAVY,
    },
  ];

  roiPoints.forEach((rp) => {
    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(margin, curY, contentWidth, 23, 2, 2, 'FD');

    // Number Badge
    doc.setFillColor(...rp.cor);
    doc.roundedRect(margin + 4, curY + 4, 10, 15, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(rp.num, margin + 6.5, curY + 13.5);

    // Content
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(rp.title, margin + 18, curY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...DARK_SLATE);
    const splitRp = doc.splitTextToSize(rp.desc, contentWidth - 24);
    doc.text(splitRp, margin + 18, curY + 13);

    curY += 27;
  });

  curY += 3;

  // Final Conclusion Card
  doc.setFillColor(...NAVY);
  doc.roundedRect(margin, curY, contentWidth, 42, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('CONCLUSÃO E DIRECIONAMENTO ESTRATÉGICO', margin + 8, curY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  const conc1 =
    'A Nautilus Engenharia Naval já conquistou excelência técnica no mercado marítimo. O sistema é a engrenagem que conecta essa competência à gestão moderna: equipe organizada em suas responsabilidades, orçamentos rápidos, processos rastreados e o diretor com o controle da empresa na palma da mão.';
  const splitConc = doc.splitTextToSize(conc1, contentWidth - 16);
  doc.text(splitConc, margin + 8, curY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 211, 153); // Emerald
  doc.text('Resultado: Menos tempo apagando incêndios e mais foco em fechar grandes contratos navais.', margin + 8, curY + 34);

  // ==========================================
  // FOOTER & PAGE NUMBERING (ALL PAGES)
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) {
      // Line
      doc.setDrawColor(...BORDER_COLOR);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

      // Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text('Nautilus Engenharia Naval • Documento Confidencial • Uso Interno', margin, pageHeight - 9);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
    }
  }

  // Save to file
  const outputPath = path.join(process.cwd(), 'APRESENTACAO_SISTEMA_NAUTILUS.pdf');
  const buffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outputPath, buffer);

  console.log(`PDF gerado com sucesso em: ${outputPath}`);
  console.log(`Tamanho do arquivo: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log(`Total de páginas: ${totalPages}`);
}

generatePresentationPdf().catch((err) => {
  console.error('Erro ao gerar PDF:', err);
  process.exit(1);
});
