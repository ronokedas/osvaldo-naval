const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const handleLogout = `
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
    } catch (e) {
      console.error('Logout error', e);
    }
  };
`;

content = content.replace(
  "  // User Actions\n  const handleSelectUser = (u: User) => {",
  handleLogout + "\n  // User Actions\n  const handleSelectUser = (u: User) => {"
);

content = content.replace(
  '        onToggleProfile={() => setIsProfileModalOpen(true)}\n      />',
  '        onToggleProfile={() => setIsProfileModalOpen(true)}\n        onLogout={handleLogout}\n      />'
);

content = content.replace(
  '          onOpenProfile={() => setIsProfileModalOpen(true)}\n        />',
  '          onOpenProfile={() => setIsProfileModalOpen(true)}\n          onLogout={handleLogout}\n        />'
);

fs.writeFileSync('src/App.tsx', content);
