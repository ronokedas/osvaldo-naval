import React from 'react';
import { TabType } from './Sidebar';
import { User } from '../types';
import { hasModuleAccess, ModuleId } from '../access-control';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  DollarSign, 
  BellRing
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentUser: User;
  myTasksCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  myTasksCount,
}) => {
  // Atalhos requisitados pelo Osvaldo: Início, Agenda da Equipe, Financeiro, Pendências
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Início',
      icon: LayoutDashboard,
      roles: ['admin', 'financeiro', 'tecnico'],
    },
    {
      id: 'tasks' as TabType,
      label: 'Agenda Equipe',
      icon: CalendarCheck,
      module: 'tasks' as ModuleId,
      badge: myTasksCount > 0 ? myTasksCount : undefined,
    },
    {
      id: 'financial' as TabType,
      label: 'Financeiro',
      icon: DollarSign,
      module: 'financial' as ModuleId,
    },
    { 
      id: 'commitments' as TabType, 
      label: 'Pendências', 
      icon: BellRing, 
      module: 'commitments' as ModuleId,
    },
  ];

  const visibleItems = navItems.filter((item) => !item.module || hasModuleAccess(currentUser, item.module));

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.slice(0, 5).map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'fill-blue-100' : ''}`} />
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
