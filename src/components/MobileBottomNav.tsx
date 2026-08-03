import React from 'react';
import { TabType } from './Sidebar';
import { User } from '../types';
import { 
  LayoutDashboard, 
  Ship, 
  CheckSquare, 
  FileText, 
  DollarSign, 
  FileCheck 
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
  // Define nav items similarly to Sidebar but optimized for mobile
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Início',
      icon: LayoutDashboard,
      roles: ['admin', 'financeiro', 'tecnico'],
    },
    {
      id: 'vessels' as TabType,
      label: 'Frota',
      icon: Ship,
      roles: ['admin', 'tecnico'],
    },
    {
      id: 'tasks' as TabType,
      label: 'Tarefas',
      icon: CheckSquare,
      roles: ['admin', 'financeiro', 'tecnico'],
      badge: myTasksCount > 0 ? myTasksCount : undefined,
    },
    {
      id: 'proposals' as TabType,
      label: 'Propostas',
      icon: FileText,
      roles: ['admin', 'financeiro'],
    },
    {
      id: 'documents' as TabType,
      label: 'Busca',
      icon: FileCheck,
      roles: ['admin', 'tecnico', 'financeiro'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(currentUser.role));

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
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                    {item.badge}
                  </span>
                )}
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
