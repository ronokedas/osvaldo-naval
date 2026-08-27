import React from 'react';
import { Calendar, Wrench, FileEdit, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  status: string;
}

interface Step {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  statuses: string[];
}

const STEPS: Step[] = [
  {
    id: 1,
    label: '1. Agendamento',
    sublabel: 'Definição de data e técnico',
    icon: Calendar,
    statuses: ['aguardando_agendamento'],
  },
  {
    id: 2,
    label: '2. Vistoria em Campo',
    sublabel: 'Execução e medições',
    icon: Wrench,
    statuses: ['visita_agendada', 'vistoria_em_execucao'],
  },
  {
    id: 3,
    label: '3. Laudos & Revisão',
    sublabel: 'Elaboração documental V1/V2',
    icon: FileEdit,
    statuses: ['documentacao_em_elaboracao', 'revisao_interna'],
  },
  {
    id: 4,
    label: '4. Análise Externa',
    sublabel: 'Certificadora / Marinha',
    icon: ShieldCheck,
    statuses: ['aguardando_envio_externo', 'em_analise_externa', 'exigencia_externa', 'aprovado_externamente'],
  },
  {
    id: 5,
    label: '5. Entrega & Pendências',
    sublabel: 'Remessas e financeiro',
    icon: CheckCircle2,
    statuses: ['aguardando_entrega'],
  },
  {
    id: 6,
    label: '6. Validação Final',
    sublabel: 'Conferência administrativa',
    icon: CheckCircle2,
    statuses: ['validacao_final', 'concluida'],
  },
];

export const OsWorkflowStepper: React.FC<Props> = ({ status }) => {
  // Determine current step index
  let currentStepIdx = 0;
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i].statuses.includes(status)) {
      currentStepIdx = i;
      break;
    }
  }

  const isExigencia = status === 'exigencia_externa';
  const isConcluida = status === 'concluida';

  return (
    <div className="bg-slate-900/90 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Esteira de Progresso da OS
        </span>
        {isExigencia && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" /> Exigência Externa Pendente
          </span>
        )}
        {isConcluida && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Serviço 100% Concluído
          </span>
        )}
      </div>

      {/* Stepper Grid / Flex */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-3">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isPassed = idx < currentStepIdx;
          const isCurrent = idx === currentStepIdx;

          return (
            <div
              key={step.id}
              className={`relative rounded-xl p-3 flex flex-col justify-between transition-all duration-200 ${
                isCurrent
                  ? 'bg-gradient-to-b from-blue-600 to-blue-700 border-2 border-blue-400 shadow-lg shadow-blue-900/40 text-white'
                  : isPassed
                  ? 'bg-slate-800/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/40 border border-slate-700/50 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                    isCurrent
                      ? 'bg-white text-blue-900 shadow-sm'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </span>
                {isCurrent && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                )}
              </div>

              <div>
                <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-white font-extrabold' : isPassed ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] mt-0.5 opacity-80 line-clamp-1">
                  {step.sublabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
