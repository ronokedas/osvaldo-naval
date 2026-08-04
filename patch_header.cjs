const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');

const replacement = `
              {onToggleProfile && (
                <button
                  onClick={onToggleProfile}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 font-bold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border-b border-slate-800 transition cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-400/50 flex items-center justify-center text-white shrink-0 overflow-hidden">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.nome.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="leading-tight">Editar Meu Perfil</p>
                    <p className="text-[10px] text-slate-400 font-normal">Foto, e-mail e senha</p>
                  </div>
                </button>
              )}
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.reload();
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 font-bold text-red-400 hover:bg-red-900/20 border-b border-slate-800 transition cursor-pointer"
              >
                <div>
                  <p className="leading-tight">Sair do Sistema</p>
                </div>
              </button>
`;

content = content.replace(/\{onToggleProfile && \([\s\S]*?\}\)\}/, replacement);

// Remove the import of fileURLToPath from server.ts too since we removed it
let server = fs.readFileSync('server.ts', 'utf-8');
server = server.replace(/import \{ fileURLToPath \} from "url";/, '');
fs.writeFileSync('server.ts', server);

fs.writeFileSync('src/components/Header.tsx', content);
