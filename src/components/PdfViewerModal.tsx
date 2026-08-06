import React from 'react';
import { X, FileText } from 'lucide-react';

interface PdfViewerModalProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ pdfUrl, title, onClose }) => {
  // Prevenir navegação ao tentar voltar
  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      onClose();
    };
    
    window.history.pushState({ pdfModal: true }, '', null);
    
    return () => {
      window.history.back();
    };
  }, [onClose]);

  // Handler para clique fora do modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold transition-all"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-slate-100 p-4 overflow-hidden">
          <iframe
            src={pdfUrl}
            className="w-full h-full rounded-xl border border-slate-200 shadow-inner"
            title={title}
          />
        </div>

        {/* Footer with instructions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Clique no botão "Fechar" ou fora do documento para retornar
          </p>
        </div>
      </div>
    </div>
  );
};
