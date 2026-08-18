import React,{useEffect,useRef} from 'react';
import { User, LogoConfig } from '../types';
import { NautilusLogo } from './NautilusLogo';
import { Bell, Search, UserCheck, Menu, AlertTriangle, CheckCircle, Clock, FileText, Wrench } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  users: User[];
  logoConfig?: LogoConfig;
  onSelectUser: (user: User) => void;
  onToggleMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults?: { id: string; type: string; title: string; detail?: string }[];
  onSelectSearchResult?: (result: { id: string; type: string; title: string; detail?: string }) => void;
  pendingAlertsCount: number;
  criticalAlertsCount?: number;
  executionAlertsCount?: number;
  documentAlertsCount?: number;
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
  searchResults = [],
  onSelectSearchResult,
  pendingAlertsCount,
  criticalAlertsCount = 0,
  executionAlertsCount = 0,
  documentAlertsCount = 0,
  onGoHome,
  onToggleProfile,
  onLogout,
  onOpenNotifications,
}) => {
  const searchBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) onSearchChange(''); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, [onSearchChange]);
  // Calcula total de alertas inteligentes por categoria
  const hasCriticalAlerts = criticalAlertsCount > 0;
  const hasExecutionAlerts = executionAlertsCount > 0;
  const hasDocumentAlerts = documentAlertsCount > 0;

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
          <div ref={searchBoxRef} className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar embarcação, cliente ou documento..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
            {searchQuery.trim() && <div className="absolute top-full mt-2 left-0 right-0 bg-[#0B192C] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"><div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-700">Resultados encontrados</div>{searchResults.length ? searchResults.map(r=><button type="button" key={`${r.type}-${r.id}`} onClick={()=>{onSelectSearchResult?.(r);onSearchChange('')}} className="w-full text-left px-3 py-2 hover:bg-slate-800"><p className="text-sm font-bold text-white">{r.title}</p><p className="text-xs text-slate-400">{r.type}{r.detail?` · ${r.detail}`:''}</p></button>) : <p className="px-3 py-4 text-sm text-slate-400">Nenhum resultado encontrado.</p>}</div>}
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

          {/* Notifications Bell with Smart Badges */}
          <div className="relative group">
            <button 
              onClick={onOpenNotifications}
              className={`p-2 rounded-lg transition relative cursor-pointer ${
                hasCriticalAlerts 
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30 animate-pulse' 
                  : hasExecutionAlerts 
                    ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-900/30'
                    : hasDocumentAlerts
                      ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              aria-label="Ver notificações"
              title={
                hasCriticalAlerts ? "⚠️ Alertas Críticos pendentes!" :
                hasExecutionAlerts ? "🔧 Vistorias em execução!" :
                hasDocumentAlerts ? "📄 Documentos para revisão!" :
                "Notificações e Alertas"
              }
            >
              <Bell className={`w-5 h-5 ${hasCriticalAlerts ? 'animate-bounce' : ''}`} />
              
              {/* Badge principal com total */}
              {pendingAlertsCount > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 font-mono font-bold text-[10px] rounded-full flex items-center justify-center shadow-lg ${
                  hasCriticalAlerts 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : hasExecutionAlerts 
                      ? 'bg-orange-500 text-white'
                      : hasDocumentAlerts
                        ? 'bg-purple-500 text-white'
                        : 'bg-amber-500 text-slate-950 animate-pulse'
                }`}>
                  {pendingAlertsCount > 9 ? '9+' : pendingAlertsCount}
                </span>
              )}
              
              {/* Tooltip inteligente com detalhamento por categoria */}
              {(hasCriticalAlerts || hasExecutionAlerts || hasDocumentAlerts) && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#0B192C] border border-slate-700 rounded-xl shadow-2xl py-3 px-4 hidden group-hover:block z-50">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pb-2 border-b border-slate-800">
                    Resumo dos Alertas
                  </div>
                  <div className="space-y-2">
                    {hasCriticalAlerts && (
                      <div className="flex items-center justify-between gap-2 p-2 bg-red-950/30 border border-red-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-bold text-red-300">Críticos</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-red-400">{criticalAlertsCount}</span>
                      </div>
                    )}
                    {hasExecutionAlerts && (
                      <div className="flex items-center justify-between gap-2 p-2 bg-orange-950/30 border border-orange-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-orange-400" />
                          <span className="text-xs font-bold text-orange-300">Em Execução</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-orange-400">{executionAlertsCount}</span>
                      </div>
                    )}
                    {hasDocumentAlerts && (
                      <div className="flex items-center justify-between gap-2 p-2 bg-purple-950/30 border border-purple-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-bold text-purple-300">Documentos</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-purple-400">{documentAlertsCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500 text-center">
                    Clique no sino para ver detalhes
                  </div>
                </div>
              )}
            </button>
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
