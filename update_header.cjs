const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');

// Add onLogout to interface
content = content.replace(
  '  onToggleProfile?: () => void;\n}',
  '  onToggleProfile?: () => void;\n  onLogout: () => void;\n}'
);

content = content.replace(
  '  onToggleProfile,\n}) => {',
  '  onToggleProfile,\n  onLogout,\n}) => {'
);

// Replace the user switching list with the logout button
const oldUsersList = `<div className="px-3 py-1 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                Alternar Usuário da Equipe:
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={\`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition cursor-pointer \${
                    u.id === currentUser.id ? 'bg-blue-900/30 text-blue-300 font-bold' : 'text-slate-300'
                  }\`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        u.nome.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{u.nome}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{u.cargo}</p>
                    </div>
                  </div>
                  <span className={\`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase \${
                    u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' :
                    u.role === 'financeiro' ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-blue-500/20 text-blue-300'
                  }\`}>
                    {u.role}
                  </span>
                </button>
              ))}`;

content = content.replace(oldUsersList, `              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/30 transition cursor-pointer mt-1"
              >
                Sair do Sistema
              </button>`);

fs.writeFileSync('src/components/Header.tsx', content);
