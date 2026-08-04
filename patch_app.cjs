const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldUseEffect = /useEffect\(\(\) => \{\n    requestNotificationPermission\(\);\s+fetch\('\/api\/state'\)[\s\S]*?console\.warn\('Using local fallback state:', err\);\n      \}\);\n  \}, \[\]\);/;

const newUseEffect = `
  useEffect(() => {
    requestNotificationPermission();
    
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

  useEffect(() => {
    if (!currentUser) return;
    
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
        
        if (currentUser.role !== 'tecnico') {
           const uRes = await fetch('/api/users');
           if (uRes.ok) setUsers(await uRes.json());
        }
      } catch (e) {
        console.error('Error fetching data:', e);
      }
    };
    fetchData();
  }, [currentUser]);
`;

content = content.replace(oldUseEffect, newUseEffect);
fs.writeFileSync('src/App.tsx', content);
