const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Import LoginView
app = app.replace(
  "import { MobileBottomNav } from './components/MobileBottomNav';",
  "import { MobileBottomNav } from './components/MobileBottomNav';\nimport { LoginView } from './components/LoginView';"
);

// 2. Remove INITIAL_DATA imports
app = app.replace(
  /import \{[^}]*INITIAL_[^}]*\} from '\.\/data\/initialData';/g,
  ""
);

// 3. Add loading state and fix initial states
app = app.replace(
  "const [users, setUsers] = useState<User[]>(INITIAL_USERS);",
  "const [users, setUsers] = useState<User[]>([]);"
);
app = app.replace(
  "const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default Osvaldo (Admin)",
  "const [currentUser, setCurrentUser] = useState<User | null>(null);\n  const [loading, setLoading] = useState(true);"
);
app = app.replace(
  "const [clients, setClients] = useState(INITIAL_CLIENTS);",
  "const [clients, setClients] = useState([]);"
);
app = app.replace(
  "const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);",
  "const [vessels, setVessels] = useState<Vessel[]>([]);"
);
app = app.replace(
  "const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);",
  "const [proposals, setProposals] = useState<Proposal[]>([]);"
);
app = app.replace(
  "const [tasks, setTasks] = useState<DocumentTask[]>(INITIAL_TASKS);",
  "const [tasks, setTasks] = useState<DocumentTask[]>([]);"
);
app = app.replace(
  "const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(INITIAL_FINANCIAL_ENTRIES);",
  "const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);"
);
app = app.replace(
  "const [protocols, setProtocols] = useState<Protocol[]>(INITIAL_PROTOCOLS);",
  "const [protocols, setProtocols] = useState<Protocol[]>([]);"
);
app = app.replace(
  "const [criticalPendings, setCriticalPendings] = useState<CriticalPending[]>(INITIAL_CRITICAL_PENDINGS);",
  "const [criticalPendings, setCriticalPendings] = useState<CriticalPending[]>([]);"
);

// 4. Update initial configs
app = app.replace(
  "const [emailConfig, setEmailConfig] = useState<EmailConfig>(INITIAL_EMAIL_CONFIG);",
  "const [emailConfig, setEmailConfig] = useState<EmailConfig>({} as EmailConfig);"
);
app = app.replace(
  "const [signatureConfig, setSignatureConfig] = useState<SignatureConfig>(INITIAL_SIGNATURE_CONFIG);",
  "const [signatureConfig, setSignatureConfig] = useState<SignatureConfig>({} as SignatureConfig);"
);
app = app.replace(
  "const [logoConfig, setLogoConfig] = useState<LogoConfig>(INITIAL_LOGO_CONFIG);",
  "const [logoConfig, setLogoConfig] = useState<LogoConfig>({} as LogoConfig);"
);

// 5. Replace useEffect with actual fetch
const newUseEffect = `
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, pRes, tRes, fRes, prRes, cRes, emRes, sigRes, logRes] = await Promise.all([
        fetch('/api/vessels'),
        fetch('/api/proposals'),
        fetch('/api/tasks'),
        fetch('/api/finance'),
        fetch('/api/protocols'),
        fetch('/api/critical-pendings'),
        fetch('/api/settings/email'),
        fetch('/api/settings/signature'),
        fetch('/api/settings/logo'),
      ]);
      
      if (vRes.ok) setVessels(await vRes.json());
      if (pRes.ok) setProposals(await pRes.json());
      if (tRes.ok) setTasks(await tRes.json());
      if (fRes.ok) setFinancialEntries(await fRes.json());
      if (prRes.ok) setProtocols(await prRes.json());
      if (cRes.ok) setCriticalPendings(await cRes.json());
      if (emRes.ok) setEmailConfig(await emRes.json());
      if (sigRes.ok) setSignatureConfig(await sigRes.json());
      if (logRes.ok) setLogoConfig(await logRes.json());
      
      // Also fetch users if admin
      if (currentUser?.role !== 'tecnico') {
         const uRes = await fetch('/api/users');
         if (uRes.ok) setUsers(await uRes.json());
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);
`;

app = app.replace(/useEffect\(\(\) => \{\n    \/\/ In a real app, this would fetch data from an API\n  \}, \[\]\);/g, newUseEffect);

// 6. Return LoginView if !currentUser
const renderReturn = `
  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!currentUser) return <LoginView onLogin={setCurrentUser} />;

  return (
`;

app = app.replace(/return \(\s*<div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">/g, renderReturn + '\n    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">');

// 7. Update handlers to use await fetch properly (just a basic replacement of apiPost/apiPut usages to update state from server response if needed)
// For simplicity, we just make apiPost/apiPut return the promise so the state update can happen.
app = app.replace(
  /const apiPost = async \(endpoint: string, payload: any\) => \{[\s\S]*?console\.error\('API Post Error:', e\);\n    \}\n  \};/,
  `const apiPost = async (endpoint: string, payload: any) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('API Post Error');
    return res.json();
  };`
);

app = app.replace(
  /const apiPut = async \(endpoint: string, payload: any\) => \{[\s\S]*?console\.error\('API Put Error:', e\);\n    \}\n  \};/,
  `const apiPut = async (endpoint: string, payload: any) => {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('API Put Error');
    return res.json();
  };`
);

// We need to fix the optimistic updates to use the real responses, or just re-fetch data.
// Re-fetching data is easiest for now.
app = app.replace(/setVessels\(\[newVessel, \.\.\.vessels\]\);\n    apiPost\('\/api\/vessels', newVessel\);/g, "const saved = await apiPost('/api/vessels', newVessel);\n    setVessels([saved, ...vessels]);");

fs.writeFileSync('src/App.tsx', app);
