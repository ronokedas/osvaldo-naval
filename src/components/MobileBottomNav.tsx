import React from 'react';
import { TabType } from './Sidebar';
import { User } from '../types';
import { hasModuleAccess, ModuleId } from '../access-control';
import { 
  LayoutDashboard, 
  Ship, 
  FileText, 
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
      module: 'vessels' as ModuleId,
    },
    {
      id: 'proposals' as TabType,
      label: 'Propostas',
      icon: FileText,
      module: 'proposals' as ModuleId,
    },
    { id: 'commitments' as TabType, label: 'Pendências', icon: BellRing, module: 'commitments' as ModuleId },
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
