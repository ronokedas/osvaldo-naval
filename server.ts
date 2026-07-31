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
