const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  /return \([\s]*<div[\s]*className="min-h-screen bg-\[\#F4F6F9\] font-sans text-slate-900 flex flex-col pb-\[calc\(4rem\+env\(safe-area-inset-bottom\)\)\] md:pb-0"/,
  `if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  if (!currentUser) return <LoginView onLogin={setCurrentUser} />;

  return (
    <div 
      className="min-h-screen bg-[#F4F6F9] font-sans text-slate-900 flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"`
);

fs.writeFileSync('src/App.tsx', app);
