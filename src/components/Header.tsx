import React from 'react';
import { User, LogoConfig, InternalNotification } from '../types';
import { NautilusLogo } from './NautilusLogo';
import { Bell, Search, UserCheck, Menu } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  users: User[];
  logoConfig?: LogoConfig;
  onSelectUser: (user: User) => void;
  onToggleMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  pendingAlertsCount: number;
  criticalPendings: any[];
  notifications: InternalNotification[];
  onGoHome: () => void;
  onToggleProfile?: () => void;
  onLogout: () => void;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  logoConfig,
  onSelectUser,
  onToggleMobileMenu,
  searchQuery,
  onSearchChange,
  pendingAlertsCount,
  criticalPendings,
  notifications,
  onGoHome,
  onToggleProfile,
  onLogout,
  onOpenNotifications,
}) => {
  return (
    <header className="bg-[#061224] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <button
            type="button"
            onClick={onGoHome}
            aria-label="Voltar para a tela inicial"
            title="Voltar para a tela inicial"
            className="flex items-center gap-3 rounded-xl cursor-pointer transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <NautilusLogo variant="white" size="sm" showSubtitle={true} hideTextOnMobile={true} logoConfig={logoConfig} />
          </button>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 max-w-md hidden md:block min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar embarcação, cliente ou documento..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        {/* Right: Quick Role Switcher + Notification Bell + User Avatar */}
        <div className="flex items-center gap-3">
          {/* Quick User Role Switcher for Testing/Demonstration */}
          <div className="relative group hidden sm:block">
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 hover:border-blue-500/50 px-3 py-1.5 rounded-lg cursor-pointer transition">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover shrink-0 border border-blue-400" />
              ) : (
                <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <div className="text-left">
                <p className="text-xs font-bold text-slate-200 leading-none">{currentUser.nome}</p>
                <p className="text-[10px] text-blue-300 uppercase tracking-wider font-mono">
                  {currentUser.role}
                </p>
              </div>
            </div>

            {/* Dropdown for instant profile editing or user role switching */}
            <div className="absolute right-0 top-full mt-1 w-64 bg-[#0B192C] border border-slate-700 rounded-xl shadow-2xl py-2 hidden group-hover:block z-50">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                Sua Conta:
              </div>

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
                onClick={onLogout}
                className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/30 transition cursor-pointer mt-1"
              >
                Sair do Sistema
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative group">
            <button 
              onClick={onOpenNotifications}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition relative cursor-pointer"
              aria-label="Ver notificações"
              title="Notificações e Alertas"
            >
              <Bell className={`w-5 h-5 ${pendingAlertsCount > 0 ? 'text-amber-400' : ''}`} />
              {pendingAlertsCount > 0 && (
                <span className={`absolute top-1 right-1 w-4 h-4 ${
                  pendingAlertsCount > 9 ? 'bg-red-500' : 'bg-amber-500'
                } text-slate-950 font-mono font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse`}>
                  {pendingAlertsCount > 9 ? '9+' : pendingAlertsCount}
                </span>
              )}
            </button>
            
            {/* Tooltip inteligente ao passar o mouse */}
            {pendingAlertsCount > 0 && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#0B192C] border border-slate-700 rounded-xl shadow-2xl py-3 px-4 hidden group-hover:block z-50 pointer-events-none">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resumo dos Alertas</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Críticos
                    </span>
                    <span className="font-mono font-bold text-red-400">{criticalPendings.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Em Execução
                    </span>
                    <span className="font-mono font-bold text-orange-400">
                      {notifications.filter(n => !n.lida && (n.tipo === 'vistoria_inicio' || n.tipo === 'vistoria_conclusao')).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Documentos
                    </span>
                    <span className="font-mono font-bold text-purple-400">
                      {notifications.filter(n => !n.lida && n.tipo === 'documento_anexado').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700">
                    <span className="text-slate-200 font-bold">Total</span>
                    <span className="font-mono font-bold text-amber-400">{pendingAlertsCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button 
              onClick={onToggleProfile}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-bold text-sm flex items-center justify-center shadow-inner overflow-hidden border border-slate-700 hover:border-blue-400 transition"
              title="Meu Perfil"
            >
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                currentUser.nome.charAt(0)
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
