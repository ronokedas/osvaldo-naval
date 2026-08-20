import React from 'react';
import { User } from '../types';
import {
  LayoutDashboard,
  Ship,
  CheckSquare,
  FileText,
  DollarSign,
  FileCheck,
  Users,
  Settings,
  Server,
  X,
  ChevronRight,
  Search,
  Send,
  ClipboardList,
  BellRing,
  ContactRound,
  CalendarClock,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'vessels'
  | 'tasks'
  | 'proposals'
  | 'service-orders'
  | 'financial'
  | 'protocols'
  | 'team'
  | 'settings'
  | 'documents'
  | 'commitments'
  | 'registrations'
  | 'renewals';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentUser: User;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  myTasksCount: number;
  onOpenProfile?: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  isMobileOpen,
  onCloseMobile,
  myTasksCount,
  onOpenProfile,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Visão Geral',
      icon: LayoutDashboard,
      roles: ['admin', 'financeiro', 'tecnico'],
    },
    {
      id: 'vessels' as TabType,
      label: 'Embarcações',
      icon: Ship,
      roles: ['admin', 'financeiro', 'tecnico'],
    },
    { id: 'registrations' as TabType, label: 'Cadastros', icon: ContactRound, roles: ['admin', 'financeiro'] },
    {
      id: 'commitments' as TabType,
      label: 'Pendências e Compromissos',
      icon: BellRing,
      roles: ['admin', 'financeiro', 'tecnico'],
    },
    {
      id: 'tasks' as TabType,
      label: currentUser.role === 'tecnico' ? 'Minhas Tarefas' : 'Tarefas da Equipe',
      icon: CheckSquare,
      badge: myTasksCount > 0 ? myTasksCount : undefined,
      roles: [],
    },
    {
      id: 'proposals' as TabType,
      label: 'Propostas',
      icon: FileText,
      roles: ['admin', 'financeiro'],
    },
    {
      id: 'renewals' as TabType,
      label: 'Renovações Anuais',
      icon: CalendarClock,
      roles: ['admin', 'financeiro'],
    },
    {
      id: 'service-orders' as TabType,
      label: 'Ordens de Serviço',
      icon: ClipboardList,
      roles: ['admin', 'financeiro', 'tecnico'],
    },
    {
      id: 'financial' as TabType,
      label: 'Financeiro',
      icon: DollarSign,
      roles: ['admin', 'financeiro'],
    },
    {
      id: 'protocols' as TabType,
      label: 'Protocolos & Entregas',
      icon: Send,
      roles: [],
    },
    {
      id: 'documents' as TabType,
      label: 'Busca de Documentos',
      icon: Search,
      roles: ['admin', 'financeiro', 'tecnico'],
    },
    {
      id: 'settings' as TabType,
      label: 'Configurações do Sistema',
      icon: Settings,
      roles: ['admin', 'financeiro', 'tecnico'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(currentUser.role));

  const handleNavClick = (tab: TabType) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky md:top-16 md:h-[calc(100vh-4rem)] left-0 bottom-0 w-64 shrink-0 bg-[#0B192C] text-slate-300 border-r border-slate-800 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Mobile Header Close */}
          <div className="flex items-center justify-between md:hidden pb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm">Menu Nautilus</span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-3 mb-2">
              Menu Principal
            </p>
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-white text-blue-900'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Profile */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500 space-y-2">
          {/* User Profile Mini Badge at bottom */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl p-2.5 flex items-center justify-between gap-2.5 text-left transition cursor-pointer group"
            title="Clique para editar seu perfil, foto e senha"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser.nome.charAt(0)
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate transition">{currentUser.nome}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.cargo || currentUser.role}</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-800 text-blue-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
              Perfil
            </span>
          </button>

          <button
            onClick={onLogout}
            className="w-full text-center px-3 py-2 text-xs font-bold text-red-400 bg-red-950/30 rounded-lg hover:bg-red-900/50 transition cursor-pointer"
          >
            Sair do Sistema
          </button>
          <p className="font-semibold text-slate-400 truncate">Nautilus Projetos Navais</p>
          <p className="text-[10px]">Belém/PA — (91) 3247-3278</p>
          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-600">
            <span>v2.6.0 (VPS)</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sistema online" />
          </div>
        </div>
      </aside>
    </>
  );
};
