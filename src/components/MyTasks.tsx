import React, { useState } from 'react';
import { DocumentTask, User, TaskStatus, Certificadora } from '../types';
import {
  CheckSquare,
  Clock,
  Award,
  Upload,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Send,
  Calendar,
  MessageSquare,
  ArrowRight,
  FileText,
} from 'lucide-react';

interface MyTasksProps {
  tasks: DocumentTask[];
  currentUser: User;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus, certificadora?: Certificadora) => void;
  onUploadTaskFile: (taskId: string, fileName: string, fileUrl: string) => void;
  onAddTaskNote: (taskId: string, text: string) => void;
}

export const MyTasks: React.FC<MyTasksProps> = ({
  tasks,
  currentUser,
  onUpdateTaskStatus,
  onUploadTaskFile,
  onAddTaskNote,
}) => {
  const [filterTab, setFilterTab] = useState<'hoje' | 'semana' | 'todas'>('hoje');
  const [selectedTask, setSelectedTask] = useState<DocumentTask | null>(null);
  const [noteText, setNoteText] = useState('');
  const [simulatedFile, setSimulatedFile] = useState<File | null>(null);

  // Filter tasks assigned to user or all if admin
  const userTasks = currentUser.role === 'tecnico'
    ? tasks.filter((t) => t.responsavelId === currentUser.id)
    : tasks;

  const filteredTasks = userTasks.filter((t) => {
    if (filterTab === 'hoje') {
      return t.prazo.toLowerCase().includes('hoje') || t.status === 'execucao' || t.status === 'pendente';
    }
    if (filterTab === 'semana') {
      return t.status !== 'baixado';
    }
    return true;
  });

  const handleSimulatedFileUpload = (taskId: string) => {
    const defaultFileName = simulatedFile ? simulatedFile.name : `laudo_${selectedTask?.embarcacaoNome || 'vessel'}_v2.pdf`;
    const defaultUrl = `/uploads/${Date.now()}_${defaultFileName}`;

    onUploadTaskFile(taskId, defaultFileName, defaultUrl);

    if (selectedTask) {
      setSelectedTask({
        ...selectedTask,
        arquivoNome: defaultFileName,
        arquivoUrl: defaultUrl,
      });
    }

    setSimulatedFile(null);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !noteText.trim()) return;

    onAddTaskNote(selectedTask.id, noteText);
    setNoteText('');
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* Mobile Header Title */}
      <div className="bg-[#0B192C] text-white p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-500/50 rounded-xl text-blue-400">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black">Tarefas em Campo & CAD</h1>
              <p className="text-xs text-slate-300 font-medium">
                {currentUser.nome} ({currentUser.cargo})
              </p>
            </div>
          </div>
          <span className="bg-blue-600 text-white font-mono font-black text-xs px-2.5 py-1 rounded-full">
            {filteredTasks.length}
          </span>
        </div>

        {/* Filter Toggle Pills */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-900/80 p-1 rounded-xl text-xs font-bold text-center">
          <button
            onClick={() => setFilterTab('hoje')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              filterTab === 'hoje' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setFilterTab('semana')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              filterTab === 'semana' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Esta semana
          </button>
          <button
            onClick={() => setFilterTab('todas')}
            className={`py-2 rounded-lg transition cursor-pointer ${
              filterTab === 'todas' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-4">
        {filteredTasks.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 hover:border-blue-400 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">
                  {t.tipo}
                </span>
                <h3 className="text-base font-bold text-slate-900">{t.titulo}</h3>
                <p className="text-xs font-bold text-slate-800">{t.embarcacaoNome}</p>
                <p className="text-xs text-slate-500">{t.clienteNome}</p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                  t.status === 'execucao'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : t.status === 'enviado'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : t.status === 'exigencia'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {t.status === 'execucao'
                  ? 'Em execução'
                  : t.status === 'enviado'
                  ? 'Na certificadora'
                  : t.status === 'exigencia'
                  ? 'Exigência'
                  : t.status === 'pronto'
                  ? 'Pronto'
                  : 'Pendente'}
              </span>
            </div>

            {/* Certifying Body & Prazo */}
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Prazo: <strong className="text-slate-900">{t.prazo}</strong>
              </span>
              <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                {t.certificadora}
              </span>
            </div>

            {/* Attached file if present */}
            {t.arquivoNome && (
              <div className="flex items-center gap-2 text-xs font-mono text-blue-800 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{t.arquivoNome}</span>
              </div>
            )}

            {/* One-touch Status Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs font-bold">
              <button
                onClick={() => onUpdateTaskStatus(t.id, 'pendente')}
                className={`py-2 rounded-xl border transition flex items-center justify-center gap-1 cursor-pointer ${
                  t.status === 'pendente'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Pendente
              </button>

              <button
                onClick={() => onUpdateTaskStatus(t.id, 'execucao')}
                className={`py-2 rounded-xl border transition flex items-center justify-center gap-1 cursor-pointer ${
                  t.status === 'execucao'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Em execução
              </button>

              <button
                onClick={() => onUpdateTaskStatus(t.id, 'enviado')}
                className={`py-2 rounded-xl border transition flex items-center justify-center gap-1 cursor-pointer ${
                  t.status === 'enviado'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                Certificadora
              </button>
            </div>

            <button
              onClick={() => setSelectedTask(t)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <FileText className="w-4 h-4" /> Anexar Laudo / Ver Detalhes
            </button>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="font-bold text-base text-slate-800">Todas as tarefas em dia!</p>
            <p className="text-xs text-slate-400 mt-1">Nenhum documento pendente neste filtro.</p>
          </div>
        )}
      </div>

      {/* Detail & File Upload Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedTask.titulo}</h3>
                <p className="text-slate-500">{selectedTask.embarcacaoNome}</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Upload File Zone */}
            <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 p-5 rounded-2xl text-center space-y-3">
              <Upload className="w-8 h-8 text-blue-600 mx-auto" />
              <div>
                <p className="font-bold text-slate-800">Anexar Documento / Desenho (PDF, DWG)</p>
                <p className="text-[11px] text-slate-500">
                  Insira o relatório de medição de ultrassom ou prancha CAD em até 25MB.
                </p>
              </div>

              <input
                type="file"
                onChange={(e) => setSimulatedFile(e.target.files?.[0] || null)}
                className="hidden"
                id="task-file-input"
              />

              <div className="flex items-center justify-center gap-2">
                <label
                  htmlFor="task-file-input"
                  className="px-4 py-2 bg-[#0B192C] text-white font-bold rounded-xl cursor-pointer hover:bg-slate-800 transition"
                >
                  Selecionar Arquivo
                </label>
                <button
                  type="button"
                  onClick={() => handleSimulatedFileUpload(selectedTask.id)}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl cursor-pointer hover:bg-blue-500 transition"
                >
                  Confirmar Envio
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
