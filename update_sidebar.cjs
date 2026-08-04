const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

// Add onLogout to interface
content = content.replace(
  '  onToggleProfile?: () => void;\n}',
  '  onToggleProfile?: () => void;\n  onLogout: () => void;\n}'
);

content = content.replace(
  '  onToggleProfile,\n}) => {',
  '  onToggleProfile,\n  onLogout,\n}) => {'
);

const logoutBtn = `
        {/* Footer info & Company Details */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500 space-y-1">
          <button
            onClick={onLogout}
            className="w-full text-center px-3 py-2 mb-2 text-xs font-bold text-red-400 bg-red-950/30 rounded-lg hover:bg-red-900/50 transition cursor-pointer"
          >
            Sair do Sistema
          </button>
          <p className="font-semibold text-slate-400 truncate">Nautilus Projetos Navais</p>`;

content = content.replace(
  '        {/* Footer info & Company Details */}\n        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500 space-y-1">\n          <p className="font-semibold text-slate-400 truncate">Nautilus Projetos Navais</p>',
  logoutBtn
);

fs.writeFileSync('src/components/Sidebar.tsx', content);
