const asNumber = (value: unknown) => Number(value) || 0;

export const serializeUser = (user: any) => ({
  id: user.id,
  nome: user.nome,
  email: user.email,
  role: user.role,
  cargo: user.cargo || (user.role === "admin" ? "Administrador" : user.role === "financeiro" ? "Financeiro" : "Técnico"),
  ativo: user.ativo !== false,
  acessoAtivo: user.ativo !== false,
  avatarUrl: user.avatarUrl || undefined,
  createdAt: user.createdAt,
});

export const serializeVessel = (vessel: any) => ({
  ...vessel,
  registro: vessel.registro || "Não informado",
  certificadoraPrincipal: vessel.certificadoraPrincipal || "A definir",
  valorTotal: asNumber(vessel.valorTotal),
  valorSinal: asNumber(vessel.valorSinal),
  valorRecebido: asNumber(vessel.valorRecebido),
  criadoEm: vessel.criadoEm || vessel.createdAt,
  descricao: vessel.descricao || "",
});

export const serializeTask = (task: any, vessel?: any) => ({
  ...task,
  embarcacaoNome: task.embarcacaoNome || vessel?.nome || "Embarcação não informada",
  clienteNome: task.clienteNome || vessel?.clienteNome || "Cliente não informado",
  responsavelId: task.responsavelId || "",
  responsavelNome: task.responsavelNome || "Não atribuído",
  responsavelCargo: task.responsavelCargo || "",
  certificadora: task.certificadora || vessel?.certificadoraPrincipal || "A definir",
  prazo: task.prazo || task.prazoVencimento || "Não informado",
  arquivoNome: task.arquivoNome || undefined,
  arquivoUrl: task.arquivoUrl || undefined,
  historicoNotas: task.historicoNotas || [],
  atualizadoEm: task.atualizadoEm || task.updatedAt || task.createdAt,
});

export const serializeProposal = (proposal: any) => ({
  ...proposal,
  embarcacaoNome: proposal.embarcacaoNome || "Geral",
  clienteNome: proposal.clienteNome || "Não informado",
  dataEmissao: proposal.dataEmissao || proposal.createdAt?.toISOString?.().slice(0, 10) || "",
  ano: proposal.ano || new Date(proposal.createdAt || Date.now()).getFullYear(),
  prazoEntregaDias: proposal.prazoEntregaDias || 0,
  condicaoPagamento: proposal.condicoesPagamento || "Não informado",
  observacoesGerais: proposal.observacoes || "",
  elaboradoPor: proposal.elaboradoPor || "Nautilus Projetos Navais",
  itens: proposal.itens || [],
  valorTotal: asNumber(proposal.valorTotal),
  criadoEm: proposal.createdAt,
});

export const serializeFinancialEntry = (entry: any) => ({
  ...entry,
  embarcacaoNome: entry.embarcacaoNome || "Embarcação não informada",
  clienteNome: entry.clienteNome || "",
  valor: asNumber(entry.valor),
  observacao: entry.observacao || "",
  lancadoPorNome: entry.lancadoPorNome || "Sistema",
  formaPagamento: entry.formaPagamento || "PIX",
});

export const serializeProtocol = (protocol: any) => ({
  ...protocol,
  embarcacaoNome: protocol.embarcacaoNome || "Embarcação não informada",
  clienteNome: protocol.clienteNome || "",
  documentosIncluidos: protocol.documentosIncluidos || [],
});
