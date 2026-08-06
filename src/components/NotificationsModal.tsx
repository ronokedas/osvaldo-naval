import React from 'react';
import { InternalNotification } from '../types';
import { Bell, AlertTriangle, CheckCircle, Info, X, Clock, FileText, Wrench, UserCheck } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InternalNotification[];
  criticalPendings?: any[];
  onMarkAsRead?: (id: string) => void;
  onNavigateToOS?: (osId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  criticalPendings = [],
  onMarkAsRead,
  onNavigateToOS,
}) => {
  if (!isOpen) return null;

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'atribuicao':
        return <UserCheck className="w-5 h-5 text-blue-500" />;
      case 'revisao':
      case 'exigencia':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'aprovacao':
      case 'entrega':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'documento_anexado':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'vistoria_inicio':
      case 'vistoria_conclusao':
        return <Wrench className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const getPrioridadeClass = (prioridade?: string) => {
    switch (prioridade) {
      case 'critica':
        return 'bg-red-50 border-red-200';
      case 'alta':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const allItems = [
    ...criticalPendings.map((cp) => ({
      id: cp.id,
      tipo: 'pendencia_critica',
      titulo: cp.titulo,
      mensagem: cp.detalhe,
      embarcacaoNome: cp.embarcacaoNome,
      data: cp.data,
      lida: false,
      prioridade: 'alta' as const,
      isCriticalPending: true,
    })),
    ...notifications.map((n) => ({
      ...n,
      isCriticalPending: false,
    })),
  ].sort((a, b) => {
    const dateA = new Date(a.data || a.createdAt || 0).getTime();
    const dateB = new Date(b.data || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-16 right-4 md:right-8 w-full max-w-md max-h-[70vh] bg-white rounded-2xl shadow-2xl z-50 border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-white" />
            <h2 className="font-bold text-white text-lg">Notificações e Alertas</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition text-white"
            aria-label="Fechar notificações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {allItems.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhuma notificação</p>
              <p className="text-slate-400 text-sm mt-1">Você está em dia!</p>
            </div>
          ) : (
            allItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border ${getPrioridadeClass(item.prioridade)} transition hover:shadow-md cursor-pointer ${
                  !item.lida ? 'border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => {
                  if (!item.isCriticalPending && item.osId && onNavigateToOS) {
                    onNavigateToOS(item.osId);
                  }
                  if (onMarkAsRead && !item.isCriticalPending) {
                    onMarkAsRead(item.id);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {item.isCriticalPending ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    getNotificationIcon(item.tipo)
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-bold text-sm ${item.prioridade === 'critica' ? 'text-red-700' : item.prioridade === 'alta' ? 'text-amber-700' : 'text-slate-900'}`}>
                        {item.titulo}
                      </h3>
                      {!item.lida && !item.isCriticalPending && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                      )}
                    </div>
                    {item.mensagem && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.mensagem}</p>
                    )}
                    {item.embarcacaoNome && (
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        🚢 {item.embarcacaoNome}
                      </p>
                    )}
                    {(item.data || item.createdAt) && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(item.data || item.createdAt!).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {allItems.length > 0 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </>
  );
};
