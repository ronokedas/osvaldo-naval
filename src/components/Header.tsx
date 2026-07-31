import React from 'react';
import { User } from '../types';
import { NautilusLogo } from './NautilusLogo';
import { Bell, Search, UserCheck, Menu } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  onToggleMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  pendingAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSelectUser,
  onToggleMobileMenu,
  searchQuery,
  onSearchChange,
  pendingAlertsCount,
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
          
          <div className="flex items-center gap-2">
            <NautilusLogo variant="white" size="sm" showSubtitle={false} />
            <span className="hidden sm:inline-block text-[10px] font-bold tracking-widest text-blue-400 bg-blue-900/40 border border-blue-700/50 px-2 py-0.5 rounded uppercase">
              Projetos Navais
            </span>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 max-w-md hidden md:block">
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
              <UserCheck className="w-4 h-4 text-blue-400" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-200 leading-none">{currentUser.nome}</p>
                <p className="text-[10px] text-blue-300 uppercase tracking-wider font-mono">
                  {currentUser.role}
                </p>
              </div>
            </div>

            {/* Dropdown for instant user role switching */}
            <div className="absolute right-0 top-full mt-1 w-64 bg-[#0B192C] border border-slate-700 rounded-lg shadow-xl py-2 hidden group-hover:block z-50">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                Alternar Perfil da Equipe:
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                    u.id === currentUser.id ? 'bg-blue-900/30 text-blue-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{u.nome}</p>
                    <p className="text-[10px] text-slate-400">{u.cargo}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                    u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' :
                    u.role === 'financeiro' ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition relative">
              <Bell className="w-5 h-5" />
              {pendingAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 font-mono font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                  {pendingAlertsCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-bold text-sm flex items-center justify-center shadow-inner">
              {currentUser.nome.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
