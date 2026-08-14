/**
 * Data normalization utilities
 * Centralized functions for normalizing API responses
 */

import { Vessel, DocumentTask, FinancialEntry, Proposal } from '../types';

/**
 * Normalizes vessel data from API response
 */
export const normalizeVessel = (vessel: any): Vessel => ({
  ...vessel,
  registro: vessel.registro || 'Não informado',
  certificadoraPrincipal: vessel.certificadoraPrincipal || 'A definir',
  valorTotal: Number(vessel.valorTotal) || 0,
  valorSinal: Number(vessel.valorSinal) || 0,
  valorRecebido: Number(vessel.valorRecebido) || 0,
  criadoEm: vessel.criadoEm || vessel.createdAt || new Date().toISOString(),
});

/**
 * Normalizes task data from API response
 */
export const normalizeTask = (task: any, vesselById: Map<string, Vessel>): DocumentTask => {
  const vessel = vesselById.get(task.embarcacaoId);
  return {
    ...task,
    embarcacaoNome: task.embarcacaoNome || vessel?.nome || 'Embarcação não informada',
    clienteNome: task.clienteNome || vessel?.clienteNome || 'Cliente não informado',
    responsavelId: task.responsavelId || '',
    responsavelNome: task.responsavelNome || 'Não atribuído',
    certificadora: task.certificadora || vessel?.certificadoraPrincipal || 'A definir',
    prazo: task.prazo || task.prazoVencimento || 'Não informado',
    historicoNotas: task.historicoNotas || [],
    atualizadoEm: task.atualizadoEm || task.updatedAt || task.createdAt || new Date().toISOString(),
  } as DocumentTask;
};

/**
 * Normalizes financial entry data from API response
 */
export const normalizeFinancialEntry = (entry: any): FinancialEntry => ({
  ...entry,
  embarcacaoNome: entry.embarcacaoNome || 'Embarcação não informada',
  clienteNome: entry.clienteNome || '',
  valor: Number(entry.valor) || 0,
  observacao: entry.observacao || '',
  lancadoPorNome: entry.lancadoPorNome || 'Sistema',
  formaPagamento: entry.formaPagamento || 'PIX',
});

/**
 * Normalizes proposal data from API response
 */
export const normalizeProposal = (proposal: any): Proposal => ({
  ...proposal,
  embarcacaoNome: proposal.embarcacaoNome || 'Geral',
  clienteNome: proposal.clienteNome || 'Não informado',
  ano: Number(proposal.ano) || new Date(proposal.createdAt || Date.now()).getFullYear(),
  prazoEntregaDias: Number(proposal.prazoEntregaDias) || 0,
  condicaoPagamento: proposal.condicaoPagamento || proposal.condicoesPagamento || 'Não informado',
  observacoesGerais: proposal.observacoesGerais || proposal.observacoes || '',
  elaboradoPor: proposal.elaboradoPor || 'Nautilus Projetos Navais',
  itens: proposal.itens || [],
  valorTotal: Number(proposal.valorTotal) || 0,
  criadoEm: proposal.criadoEm || proposal.createdAt || new Date().toISOString(),
});
