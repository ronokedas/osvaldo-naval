import React, { useState } from 'react';
import { User, DocumentTask } from '../types';
import { Users, UserPlus, Shield, Key, CheckCircle2, AlertCircle } from 'lucide-react';

interface TeamViewProps {
  users: User[];
  tasks: DocumentTask[];
  onUpdateUserRole: (userId: string, role: any) => void;
  onResetUserPassword: (userId: string) => Promise<string>;
}

export const TeamView: React.FC<TeamViewProps> = ({
  users,
  tasks,
  onUpdateUserRole,
  onResetUserPassword,
}) => {
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const handleReset = async (user: User) => {
    try {
      const password = await onResetUserPassword(user.id);
      setResetMsg(`Senha do usuário ${user.nome} resetada para "${password}" com sucesso.`);
      setTimeout(() => setResetMsg(null), 5000);
    } catch {
      setResetMsg('Não foi possível redefinir a senha.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">Gestão da Equipe & Carga de Trabalho</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Controle de acessos dos 7 membros da equipe Nautilus e distribuição de laudos e desenhos.
        </p>
      </div>

      {resetMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {resetMsg}
        </div>
      )}

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((u) => {
          const activeTasks = tasks.filter((t) => t.responsavelId === u.id && t.status !== 'baixado');

          return (
            <div
              key={u.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-blue-900 text-white font-bold text-base flex items-center justify-center overflow-hidden">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      u.nome.charAt(0)
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : u.role === 'financeiro'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{u.nome}</h3>
                  <p className="text-xs text-slate-500 font-medium">{u.cargo}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">{u.email}</p>
                </div>
              </div>

              {/* Active Task Count */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Tarefas em andamento:</span>
                  <span className="font-mono font-bold text-blue-900">{activeTasks.length} ativas</span>
                </div>

                <div className="space-y-1">
                  {activeTasks.slice(0, 2).map((t) => (
                    <p key={t.id} className="text-[11px] text-slate-700 truncate font-medium">
                      • {t.titulo} ({t.embarcacaoNome})
                    </p>
                  ))}
                </div>
              </div>

              {/* Admin Actions */}
              <div className="pt-2 border-t flex items-center justify-between gap-2">
                <button
                  onClick={() => handleReset(u)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Key className="w-3.5 h-3.5 text-slate-500" /> Resetar Senha
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
