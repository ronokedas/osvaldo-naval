import React, { useState } from 'react';
import { DocumentTask, Vessel } from '../types';
import { Search, Filter, FileText, Calendar, Ship, Download, ExternalLink, Hash } from 'lucide-react';

interface GlobalDocumentSearchProps {
  tasks: DocumentTask[];
  vessels: Vessel[];
}

export const GlobalDocumentSearch: React.FC<GlobalDocumentSearchProps> = ({ tasks, vessels }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [vesselTypeFilter, setVesselTypeFilter] = useState('');

  // Extract all tasks that have an attached file
  const tasksWithFiles = tasks.filter(t => t.arquivoNome || t.arquivoUrl);

  const filteredDocs = tasksWithFiles.filter((task) => {
    const vessel = vessels.find(v => v.id === task.embarcacaoId);
    const vesselType = vessel?.tipo || '';

    const matchesSearch =
      task.arquivoNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.embarcacaoNome.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = typeFilter ? task.tipo === typeFilter : true;
    const matchesVesselType = vesselTypeFilter ? vesselType === vesselTypeFilter : true;

    return matchesSearch && matchesType && matchesVesselType;
  });

  const uniqueVesselTypes = Array.from(new Set(vessels.map(v => v.tipo).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Busca Global de Documentos</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Pesquise por laudos, certificados, relatórios e ARTs anexados ao sistema.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome do arquivo, documento ou embarcação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Todos os tipos de doc.</option>
            <option value="ultrassom">Ultrassom</option>
            <option value="desenho">Desenho</option>
            <option value="art">ART</option>
            <option value="homologacao">Homologação</option>
            <option value="outro">Outro</option>
          </select>

          <select
            value={vesselTypeFilter}
            onChange={(e) => setVesselTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Todas embarcações</option>
            {uniqueVesselTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">Arquivo / Documento</th>
                  <th className="px-6 py-4">Embarcação</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
                            {task.arquivoNome || 'Documento sem nome'}
                          </p>
                          <p className="text-xs text-slate-500">{task.titulo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Ship className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{task.embarcacaoNome}</span>
                      </div>
                      <p className="text-xs text-slate-500 ml-6">{task.clienteNome}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {task.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {task.atualizadoEm.split(' ')[0]}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {task.arquivoUrl ? (
                        <a
                          href={task.arquivoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          title="Visualizar/Baixar"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Link indisp.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum documento encontrado</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Tente ajustar os filtros ou buscar por outros termos. Apenas tarefas com arquivos anexados aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
