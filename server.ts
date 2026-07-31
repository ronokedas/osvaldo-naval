import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_VESSELS,
  INITIAL_PROPOSALS,
  INITIAL_TASKS,
  INITIAL_FINANCIAL_ENTRIES,
  INITIAL_CRITICAL_PENDINGS,
} from './src/data/initialData';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Set up storage directory
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_FILE = path.join(DATA_DIR, 'nautilus_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded document files
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper functions for JSON database persistence
function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      users: INITIAL_USERS,
      clients: INITIAL_CLIENTS,
      vessels: INITIAL_VESSELS,
      proposals: INITIAL_PROPOSALS,
      tasks: INITIAL_TASKS,
      financialEntries: INITIAL_FINANCIAL_ENTRIES,
      criticalPendings: INITIAL_CRITICAL_PENDINGS,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return {
      users: INITIAL_USERS,
      clients: INITIAL_CLIENTS,
      vessels: INITIAL_VESSELS,
      proposals: INITIAL_PROPOSALS,
      tasks: INITIAL_TASKS,
      financialEntries: INITIAL_FINANCIAL_ENTRIES,
      criticalPendings: INITIAL_CRITICAL_PENDINGS,
    };
  }
}

function saveDatabase(dbData: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

// --- API ROUTES --- //

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Full state endpoint
app.get('/api/state', (req, res) => {
  const db = loadDatabase();
  res.json(db);
});

// Reset state to initial demo seed
app.post('/api/reset', (req, res) => {
  const initialDb = {
    users: INITIAL_USERS,
    clients: INITIAL_CLIENTS,
    vessels: INITIAL_VESSELS,
    proposals: INITIAL_PROPOSALS,
    tasks: INITIAL_TASKS,
    financialEntries: INITIAL_FINANCIAL_ENTRIES,
    criticalPendings: INITIAL_CRITICAL_PENDINGS,
  };
  saveDatabase(initialDb);
  res.json({ success: true, db: initialDb });
});

// Users / Team
app.get('/api/users', (req, res) => {
  const db = loadDatabase();
  res.json(db.users);
});

app.post('/api/users', (req, res) => {
  const db = loadDatabase();
  const newUser = { ...req.body, id: `user-${Date.now()}` };
  db.users.push(newUser);
  saveDatabase(db);
  res.json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const db = loadDatabase();
  const index = db.users.findIndex((u: any) => u.id === req.params.id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...req.body };
    saveDatabase(db);
    res.json(db.users[index]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Vessels (Embarcações)
app.get('/api/vessels', (req, res) => {
  const db = loadDatabase();
  res.json(db.vessels);
});

app.post('/api/vessels', (req, res) => {
  const db = loadDatabase();
  const newVessel = {
    ...req.body,
    id: `ves-${Date.now()}`,
    valorRecebido: req.body.valorRecebido || 0,
    status: req.body.status || 'aberta',
    criadoEm: new Date().toISOString().split('T')[0],
  };
  db.vessels.unshift(newVessel);
  saveDatabase(db);
  res.json(newVessel);
});

app.put('/api/vessels/:id', (req, res) => {
  const db = loadDatabase();
  const index = db.vessels.findIndex((v: any) => v.id === req.params.id);
  if (index !== -1) {
    db.vessels[index] = { ...db.vessels[index], ...req.body };
    saveDatabase(db);
    res.json(db.vessels[index]);
  } else {
    res.status(404).json({ error: 'Vessel not found' });
  }
});

// Proposals (Orçamentos)
app.get('/api/proposals', (req, res) => {
  const db = loadDatabase();
  res.json(db.proposals);
});

// PDFKit import
import PDFDocument from 'pdfkit';

app.get('/api/generate-proposal-pdf/:id', (req, res) => {
  const db = loadDatabase();
  const proposal = db.proposals.find((p: any) => p.id === req.params.id);
  
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Proposta_${proposal.numero.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  
  doc.pipe(res);

  // Helper for drawing a thick colored line
  doc.rect(40, 30, doc.page.width - 80, 5).fill('#1d4ed8');
  doc.moveDown(2);

  // Company Header
  doc.y = 50;
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#0f172a').text('Nautilus', 40, doc.y, { continued: true }).fillColor('#3b82f6').text('Eng');
  doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Nautilus Projetos Navais LTDA — CNPJ: 20.671.499/0001-76');
  
  doc.fontSize(10).fillColor('#475569');
  doc.text('Tv. Lopo de Castro, nº 1230', doc.page.width - 250, 55, { align: 'right' });
  doc.text('Ed. Serra das Estrelas, Sala 09 — Belém/PA', { align: 'right' });
  doc.text('Telefones: (91) 3247-3278 / (91) 99824-0012', { align: 'right' });
  doc.fillColor('#1d4ed8').text('contato@nautilusengenharianaval.com.br', { align: 'right' });
  doc.fillColor('#64748b').text('www.nautilusengenharianaval.com.br', { align: 'right' });
  
  doc.moveTo(40, doc.y + 10).lineTo(doc.page.width - 40, doc.y + 10).strokeColor('#e2e8f0').stroke();
  doc.y += 20;

  // Proposal Title & Identification
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text(`Proposta nº `, 40, doc.y, { continued: true })
     .fillColor('#1d4ed8').font('Courier-Bold').text(proposal.numero);
  
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('A/C: ', { continued: true }).font('Helvetica').text(proposal.destinatario);
  doc.font('Helvetica-Bold').text('Embarcação: ', { continued: true }).font('Helvetica').text(`${proposal.embarcacaoNome} (${proposal.clienteNome})`);
  
  doc.font('Helvetica-Bold').text('Data de Emissão: ', doc.page.width - 200, doc.y - 25, { continued: true, align: 'right' }).font('Helvetica').text(`Belém/PA, ${proposal.dataEmissao}`, { align: 'right' });
  
  doc.y += 20;

  // Subject
  doc.rect(40, doc.y, doc.page.width - 80, 50).fill('#f8fafc');
  doc.rect(40, doc.y, doc.page.width - 80, 50).stroke('#e2e8f0');
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text('ASSUNTO:', 50, doc.y + 10);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text(proposal.assunto, 50, doc.y + 25);
  
  doc.y += 40;

  // Section I
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('I. Escopo dos serviços a serem realizados', 40, doc.y);
  doc.moveTo(40, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).lineWidth(1).strokeColor('#2563eb').stroke();
  doc.y += 15;

  let y = doc.y;
  
  // Table Header
  doc.rect(40, y, doc.page.width - 80, 20).fill('#0f172a');
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text('Item', 45, y + 5, { width: 30, align: 'center' });
  doc.text('Descrição do Serviço / Documento', 85, y + 5);
  doc.text('Qtd', 380, y + 5, { width: 30, align: 'center' });
  doc.text('Valor Unit.', 420, y + 5, { width: 60, align: 'right' });
  doc.text('Subtotal', 490, y + 5, { width: 60, align: 'right' });
  
  y += 20;

  // Table rows
  if (proposal.itens && proposal.itens.length > 0) {
    proposal.itens.forEach((item: any, idx: number) => {
      if (idx % 2 === 1) {
        doc.rect(40, y, doc.page.width - 80, 20).fill('#f8fafc');
      }
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#64748b').text(`${idx + 1}`, 45, y + 5, { width: 30, align: 'center' });
      doc.font('Helvetica').fillColor('#1e293b').text(item.descricao, 85, y + 5, { width: 285 });
      doc.text(item.quantidade.toString(), 380, y + 5, { width: 30, align: 'center' });
      doc.font('Courier').text(item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), 420, y + 5, { width: 60, align: 'right' });
      doc.font('Courier-Bold').text((item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 }), 490, y + 5, { width: 60, align: 'right' });
      y += 20;
    });
  }

  // Table Footer
  doc.rect(40, y, doc.page.width - 80, 25).fill('#f1f5f9');
  doc.rect(40, y, doc.page.width - 80, 25).lineWidth(1).stroke('#cbd5e1');
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#334155').text('VALOR TOTAL DO ESCOPO:', 45, y + 8, { width: 425, align: 'right' });
  doc.fontSize(12).font('Courier-Bold').fillColor('#1e3a8a').text(`R$ ${proposal.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 480, y + 7, { width: 70, align: 'right' });
  
  doc.y = y + 40;

  // Section II
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('II. Prazo de entrega', 40, doc.y);
  doc.moveTo(40, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).lineWidth(1).strokeColor('#2563eb').stroke();
  doc.y += 10;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e3a8a').text(`${proposal.prazoEntregaDias} dias corridos `, 40, doc.y, { continued: true })
     .font('Helvetica').fillColor('#1e293b').text('após o aceite formal da proposta e disponibilização da embarcação em condições limpas para inspeção.');
  doc.y += 20;

  // Section III
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('III. Observações gerais', 40, doc.y);
  doc.moveTo(40, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).lineWidth(1).strokeColor('#2563eb').stroke();
  doc.y += 10;
  
  doc.fontSize(10).font('Helvetica').fillColor('#334155');
  proposal.observacoesGerais.split('\n').forEach((line: string) => {
    doc.text(`• ${line.replace(/^-\s*/, '')}`, { indent: 10 });
  });
  doc.y += 15;

  // Section IV
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('IV. Honorários e condições de pagamento', 40, doc.y);
  doc.moveTo(40, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).lineWidth(1).strokeColor('#2563eb').stroke();
  doc.y += 10;

  let currentY = doc.y;
  doc.rect(40, currentY, doc.page.width - 80, 45).fill('#eff6ff');
  doc.rect(40, currentY, doc.page.width - 80, 45).stroke('#dbeafe');
  
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Valor Total dos Honorários: ', 50, currentY + 10, { continued: true })
     .font('Courier-Bold').fillColor('#1e3a8a').text(`R$ ${proposal.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  doc.font('Helvetica-Bold').fillColor('#0f172a').text('Condições de Pagamento: ', 50, currentY + 25, { continued: true })
     .font('Helvetica').fillColor('#1e293b').text(proposal.condicaoPagamento || '-');
  
  doc.y = currentY + 60;

  // Section V
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('V. Dados bancários para recebimento', 40, doc.y);
  doc.moveTo(40, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).lineWidth(1).strokeColor('#2563eb').stroke();
  doc.y += 10;
  
  currentY = doc.y;
  doc.rect(40, currentY, doc.page.width - 80, 45).fill('#f8fafc');
  doc.rect(40, currentY, doc.page.width - 80, 45).stroke('#e2e8f0');
  
  doc.fontSize(9).font('Courier-Bold').fillColor('#0f172a').text('Banco: ', 50, currentY + 10, { continued: true }).font('Courier').text('Banco Bradesco S.A. (237)');
  doc.font('Courier-Bold').text('Agência: ', 50, currentY + 22, { continued: true }).font('Courier').text('0875-3');
  doc.font('Courier-Bold').text('Conta Corrente: ', 50, currentY + 34, { continued: true }).font('Courier').text('3508-4');
  
  doc.font('Courier-Bold').text('Favorecido: ', doc.page.width / 2, currentY + 10, { continued: true }).font('Courier').text('Nautilus Projetos Navais LTDA');
  doc.font('Courier-Bold').text('CNPJ / Chave PIX: ', doc.page.width / 2, currentY + 22, { continued: true }).font('Courier').text('20.671.499/0001-76');
  
  doc.y = currentY + 70;

  // Formal Acceptance Section
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).lineWidth(1).strokeColor('#cbd5e1').stroke();
  doc.y += 15;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text('ACEITE FORMAL DA PROPOSTA', 40, doc.y, { align: 'center' });
  doc.y += 30;

  const signY = doc.y;
  doc.moveTo(80, signY).lineTo(250, signY).lineWidth(1).strokeColor('#94a3b8').stroke();
  doc.moveTo(doc.page.width - 250, signY).lineTo(doc.page.width - 80, signY).lineWidth(1).strokeColor('#94a3b8').stroke();
  
  // Signatures text
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a');
  doc.text(proposal.elaboradoPor, 80, signY + 5, { width: 170, align: 'center' });
  doc.text('De acordo e Aceito:', doc.page.width - 250, signY + 5, { width: 170, align: 'center' });
  
  doc.fontSize(9).font('Helvetica').fillColor('#64748b');
  doc.text('Nautilus Projetos Navais LTDA', 80, signY + 17, { width: 170, align: 'center' });
  doc.text(`Data do Aceite: ${proposal.aceiteData || '____ / ____ / ________'}`, doc.page.width - 250, signY + 17, { width: 170, align: 'center' });
  
  if (proposal.aceiteData) {
    doc.font('Times-Italic').fontSize(14).fillColor('#065f46').text(`${proposal.aceiteAssinaturaNome || proposal.destinatario}`, doc.page.width - 250, signY - 20, { width: 170, align: 'center' });
  }

  // Footer
  const bottom = doc.page.height - 30;
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Nautilus Projetos Navais LTDA — Documento emitido eletronicamente via Sistema Nautilus.', 40, bottom, { align: 'center' });
  
  doc.end();
});

app.post('/api/proposals', (req, res) => {
  const db = loadDatabase();
  const currentYear = new Date().getFullYear();
  const yearSuffix = String(currentYear).slice(-2);
  
  // Auto sequential proposal number DS 0XX/AA
  const yearProposals = db.proposals.filter((p: any) => p.ano === currentYear);
  const nextSeq = yearProposals.length + 51; // baseline matching sample DS 051/26
  const formattedSeq = String(nextSeq).padStart(3, '0');
  const proposalNumber = req.body.numero || `DS ${formattedSeq}/${yearSuffix}`;

  const newProposal = {
    ...req.body,
    id: `prop-${Date.now()}`,
    numero: proposalNumber,
    ano: currentYear,
    criadoEm: new Date().toISOString().split('T')[0],
  };

  db.proposals.unshift(newProposal);

  // If approved and attached to vessel, update vessel total value
  if (newProposal.status === 'aprovado' && newProposal.embarcacaoId) {
    const vessel = db.vessels.find((v: any) => v.id === newProposal.embarcacaoId);
    if (vessel) {
      vessel.valorTotal = newProposal.valorTotal;
    }
  }

  saveDatabase(db);
  res.json(newProposal);
});

app.put('/api/proposals/:id', (req, res) => {
  const db = loadDatabase();
  const index = db.proposals.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    db.proposals[index] = { ...db.proposals[index], ...req.body };
    
    // If proposal marked as approved, update associated vessel values and generate default tasks if needed
    if (req.body.status === 'aprovado') {
      const proposal = db.proposals[index];
      const vessel = db.vessels.find((v: any) => v.id === proposal.embarcacaoId);
      if (vessel) {
        vessel.valorTotal = proposal.valorTotal;
      }
    }

    saveDatabase(db);
    res.json(db.proposals[index]);
  } else {
    res.status(404).json({ error: 'Proposal not found' });
  }
});

// Tasks (Documentos de Escopo)
app.get('/api/tasks', (req, res) => {
  const db = loadDatabase();
  res.json(db.tasks);
});

app.post('/api/tasks', (req, res) => {
  const db = loadDatabase();
  const newTask = {
    ...req.body,
    id: `task-${Date.now()}`,
    status: req.body.status || 'pendente',
    atualizadoEm: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };
  db.tasks.unshift(newTask);
  saveDatabase(db);
  res.json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const db = loadDatabase();
  const index = db.tasks.findIndex((t: any) => t.id === req.params.id);
  if (index !== -1) {
    db.tasks[index] = {
      ...db.tasks[index],
      ...req.body,
      atualizadoEm: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    saveDatabase(db);
    res.json(db.tasks[index]);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// Financial Entries
app.get('/api/finance', (req, res) => {
  const db = loadDatabase();
  res.json(db.financialEntries);
});

app.post('/api/finance', (req, res) => {
  const db = loadDatabase();
  const newEntry = {
    ...req.body,
    id: `fin-${Date.now()}`,
    data: req.body.data || new Date().toISOString().split('T')[0],
  };

  db.financialEntries.unshift(newEntry);

  // Automatically recalculate vessel's received amount
  const vessel = db.vessels.find((v: any) => v.id === newEntry.embarcacaoId);
  if (vessel) {
    vessel.valorRecebido = (vessel.valorRecebido || 0) + Number(newEntry.valor);
    if (newEntry.tipo === 'sinal') {
      vessel.valorSinal = Number(newEntry.valor);
    }
  }

  saveDatabase(db);
  res.json(newEntry);
});

// Simulated File Upload endpoint
app.post('/api/upload', (req, res) => {
  const { fileName, fileData } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: 'Missing fileName' });
  }
  
  const fileId = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(UPLOADS_DIR, fileId);

  try {
    if (fileData) {
      // Base64 or plain string
      const base64Content = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
      fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
    } else {
      fs.writeFileSync(filePath, `Arquivo de teste simulado para Nautilus - ${fileName}`);
    }

    res.json({
      success: true,
      fileName,
      url: `/uploads/${fileId}`,
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to save uploaded file' });
  }
});

// Start Express Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nautilus Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
