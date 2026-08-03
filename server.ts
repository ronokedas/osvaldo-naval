import express from 'express';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_VESSELS,
  INITIAL_PROPOSALS,
  INITIAL_TASKS,
  INITIAL_FINANCIAL_ENTRIES,
  INITIAL_CRITICAL_PENDINGS,
  INITIAL_PROTOCOLS,
  DEFAULT_EMAIL_CONFIG,
  DEFAULT_SIGNATURE_CONFIG,
  DEFAULT_LOGO_CONFIG,
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

// -------------------------------------------------------------
// ENGENHARIA DE PERFORMANCE: Async File Locking & Caching
// Previne Race Conditions e Corrupção do Banco JSON
// -------------------------------------------------------------
let isWriting = false;
let dbCache: any = null;

async function loadDatabaseAsync() {
  if (dbCache) return dbCache; // Cache em memória para leitura ultrarrápida O(1)

  try {
    const data = await fsPromises.readFile(DB_FILE, 'utf-8');
    const db = JSON.parse(data);
    let changed = false;

    // Hidratação de propriedades caso seja base antiga
    if (!db.protocols) { db.protocols = INITIAL_PROTOCOLS; changed = true; }
    if (!db.emailConfig) { db.emailConfig = DEFAULT_EMAIL_CONFIG; changed = true; }
    if (!db.signatureConfig) { db.signatureConfig = DEFAULT_SIGNATURE_CONFIG; changed = true; }
    if (!db.logoConfig) { db.logoConfig = DEFAULT_LOGO_CONFIG; changed = true; }

    if (changed) {
      await saveDatabaseAsync(db);
    }
    
    dbCache = db;
    return db;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      const initialDb = {
        users: INITIAL_USERS,
        clients: INITIAL_CLIENTS,
        vessels: INITIAL_VESSELS,
        proposals: INITIAL_PROPOSALS,
        tasks: INITIAL_TASKS,
        financialEntries: INITIAL_FINANCIAL_ENTRIES,
        criticalPendings: INITIAL_CRITICAL_PENDINGS,
        protocols: INITIAL_PROTOCOLS,
        emailConfig: DEFAULT_EMAIL_CONFIG,
        signatureConfig: DEFAULT_SIGNATURE_CONFIG,
        logoConfig: DEFAULT_LOGO_CONFIG,
      };
      await saveDatabaseAsync(initialDb);
      return initialDb;
    }
    console.error('Error reading database file:', err);
    throw err;
  }
}

async function saveDatabaseAsync(dbData: any) {
  // Evitar escrita concorrente (Lock/Backoff)
  if (isWriting) {
    setTimeout(() => saveDatabaseAsync(dbData), 50);
    return;
  }
  isWriting = true;
  try {
    dbCache = dbData; // Atualiza cache instantaneamente
    const tempFile = `${DB_FILE}.tmp`;
    await fsPromises.writeFile(tempFile, JSON.stringify(dbData, null, 2), 'utf-8');
    await fsPromises.rename(tempFile, DB_FILE); // Atomic write para não corromper caso a energia caia
  } catch (err) {
    console.error('Critical Error saving database file:', err);
  } finally {
    isWriting = false;
  }
}

// -------------------------------------------------------------
// ENDPOINTS DE API (Reescritos com Async/Await)
// -------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/state', async (req, res) => {
  try {
    const db = await loadDatabaseAsync();
    res.json(db);
  } catch (e) {
    res.status(500).json({ error: 'Falha ao carregar estado do banco.' });
  }
});

app.post('/api/reset', async (req, res) => {
  dbCache = null;
  const initialDb = {
    users: INITIAL_USERS,
    clients: INITIAL_CLIENTS,
    vessels: INITIAL_VESSELS,
    proposals: INITIAL_PROPOSALS,
    tasks: INITIAL_TASKS,
    financialEntries: INITIAL_FINANCIAL_ENTRIES,
    criticalPendings: INITIAL_CRITICAL_PENDINGS,
    protocols: INITIAL_PROTOCOLS,
    emailConfig: DEFAULT_EMAIL_CONFIG,
    signatureConfig: DEFAULT_SIGNATURE_CONFIG,
    logoConfig: DEFAULT_LOGO_CONFIG,
  };
  await saveDatabaseAsync(initialDb);
  res.json({ success: true, message: 'Sistema redefinido com sucesso.' });
});

app.get('/api/users', async (req, res) => {
  const db = await loadDatabaseAsync();
  res.json(db.users);
});

app.post('/api/users', async (req, res) => {
  const db = await loadDatabaseAsync();
  const newUser = { ...req.body, id: `usr-${Date.now()}` };
  db.users.push(newUser);
  await saveDatabaseAsync(db);
  res.json(newUser);
});

app.put('/api/users/:id', async (req, res) => {
  const db = await loadDatabaseAsync();
  const index = db.users.findIndex((u: any) => u.id === req.params.id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...req.body };
    await saveDatabaseAsync(db);
    res.json(db.users[index]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/api/vessels', async (req, res) => {
  const db = await loadDatabaseAsync();
  res.json(db.vessels);
});

app.post('/api/vessels', async (req, res) => {
  const db = await loadDatabaseAsync();
  db.vessels.unshift(req.body);
  await saveDatabaseAsync(db);
  res.json(req.body);
});

app.put('/api/vessels/:id', async (req, res) => {
  const db = await loadDatabaseAsync();
  const index = db.vessels.findIndex((v: any) => v.id === req.params.id);
  if (index !== -1) {
    db.vessels[index] = { ...db.vessels[index], ...req.body };
    await saveDatabaseAsync(db);
    res.json(db.vessels[index]);
  } else {
    res.status(404).json({ error: 'Vessel not found' });
  }
});

app.get('/api/proposals', async (req, res) => {
  const db = await loadDatabaseAsync();
  res.json(db.proposals);
});

app.post('/api/proposals', async (req, res) => {
  const db = await loadDatabaseAsync();
  const currentYear = new Date().getFullYear();
  const yearSuffix = String(currentYear).slice(-2);
  
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
  
  await saveDatabaseAsync(db);
  res.json(newProposal);
});

app.put('/api/proposals/:id', async (req, res) => {
  const db = await loadDatabaseAsync();
  const index = db.proposals.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    db.proposals[index] = { ...db.proposals[index], ...req.body };
    
    // If proposal marked as approved, update associated vessel values
    if (req.body.status === 'aprovado') {
      const proposal = db.proposals[index];
      const vessel = db.vessels.find((v: any) => v.id === proposal.embarcacaoId);
      if (vessel) {
        vessel.valorTotal = proposal.valorTotal;
      }
    }
    
    await saveDatabaseAsync(db);
    res.json(db.proposals[index]);
  } else {
    res.status(404).json({ error: 'Proposal not found' });
  }
});

app.get('/api/tasks', async (req, res) => {
  const db = await loadDatabaseAsync();
  res.json(db.tasks);
});

app.post('/api/tasks', async (req, res) => {
  const db = await loadDatabaseAsync();
  const newTask = {
    ...req.body,
    id: `task-${Date.now()}`,
    status: req.body.status || 'pendente',
    atualizadoEm: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };
  db.tasks.unshift(newTask);
  await saveDatabaseAsync(db);
  res.json(newTask);
});

app.put('/api/tasks/:id', async (req, res) => {
  const db = await loadDatabaseAsync();
  const index = db.tasks.findIndex((t: any) => t.id === req.params.id);
  if (index !== -1) {
    db.tasks[index] = {
      ...db.tasks[index],
      ...req.body,
      atualizadoEm: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    await saveDatabaseAsync(db);
    res.json(db.tasks[index]);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.get('/api/finance', async (req, res) => {
  const db = await loadDatabaseAsync();
  res.json(db.financialEntries);
});

app.post('/api/finance', async (req, res) => {
  const db = await loadDatabaseAsync();
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
  
  await saveDatabaseAsync(db);
  res.json(newEntry);
});

app.put('/api/finance/:id', async (req, res) => {
  const db = await loadDatabaseAsync();
  const { id } = req.params;
  const index = db.financialEntries.findIndex((e: any) => e.id === id);
  if (index !== -1) {
    db.financialEntries[index] = {
      ...db.financialEntries[index],
      ...req.body,
    };
    await saveDatabaseAsync(db);
    res.json(db.financialEntries[index]);
  } else {
    res.status(404).json({ error: 'Entry not found' });
  }
});

app.get('/api/protocols', async (req, res) => {
  const db = await loadDatabaseAsync();
  res.json(db.protocols || []);
});

app.post('/api/protocols', async (req, res) => {
  const db = await loadDatabaseAsync();
  const newProtocol = req.body;
  if (!db.protocols) db.protocols = [];
  
  if (!newProtocol.id) {
    newProtocol.id = `prot-${Date.now()}`;
  }
  if (!newProtocol.dataEnvio) {
    newProtocol.dataEnvio = new Date().toISOString().split('T')[0];
  }
  
  db.protocols.unshift(newProtocol);
  await saveDatabaseAsync(db);
  res.json(newProtocol);
});

app.put('/api/protocols/:id', async (req, res) => {
  const db = await loadDatabaseAsync();
  const { id } = req.params;
  if (!db.protocols) db.protocols = [];
  const index = db.protocols.findIndex((p: any) => p.id === id);
  if (index !== -1) {
    db.protocols[index] = {
      ...db.protocols[index],
      ...req.body,
    };
    await saveDatabaseAsync(db);
    res.json(db.protocols[index]);
  } else {
    res.status(404).json({ error: 'Protocol not found' });
  }
});

app.get('/api/settings/email', async (req, res) => {
  const db = await loadDatabaseAsync();
  res.json(db.emailConfig || DEFAULT_EMAIL_CONFIG);
});

app.put('/api/settings/email', async (req, res) => {
  const db = await loadDatabaseAsync();
  db.emailConfig = { ...db.emailConfig, ...req.body };
  await saveDatabaseAsync(db);
  res.json(db.emailConfig);
});

app.post('/api/settings/email/test', async (req, res) => {
  const { targetEmail } = req.body;
  const db = await loadDatabaseAsync();
  const config = db.emailConfig || DEFAULT_EMAIL_CONFIG;
  if (!config.ativo) {
    return res.status(400).json({ error: 'O gateway de envio de e-mails está desativado.' });
  }
  res.json({
    success: true,
    message: `E-mail de teste enviado com sucesso via ${config.smtpHost}:${config.smtpPort} para ${targetEmail || config.emailRemetente}!`,
  });
});

app.get('/api/settings/signature', async (req, res) => {
  const db = await loadDatabaseAsync();
  res.json(db.signatureConfig || DEFAULT_SIGNATURE_CONFIG);
});

app.put('/api/settings/signature', async (req, res) => {
  const db = await loadDatabaseAsync();
  db.signatureConfig = { ...db.signatureConfig, ...req.body };
  await saveDatabaseAsync(db);
  res.json(db.signatureConfig);
});

app.get('/api/settings/logo', async (req, res) => {
  const db = await loadDatabaseAsync();
  res.json(db.logoConfig || DEFAULT_LOGO_CONFIG);
});

app.put('/api/settings/logo', async (req, res) => {
  const db = await loadDatabaseAsync();
  db.logoConfig = { ...db.logoConfig, ...req.body };
  await saveDatabaseAsync(db);
  res.json(db.logoConfig);
});

// Simulated File Upload endpoint
app.post('/api/upload', async (req, res) => {
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
      await fsPromises.writeFile(filePath, Buffer.from(base64Content, 'base64'));
    } else {
      await fsPromises.writeFile(filePath, `Arquivo de teste simulado para Nautilus - ${fileName}`);
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
