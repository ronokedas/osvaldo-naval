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
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
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

export const OS_STATUS_LABELS: Record<string, string> = {
  aguardando_agendamento: "Aguardando Agendamento",
  visita_agendada: "Visita Agendada",
  vistoria_em_execucao: "Vistoria em Execução",
  documentacao_em_elaboracao: "Documentação em Elaboração",
  revisao_interna: "Revisão Interna",
  aguardando_envio_externo: "Aguardando Envio Externo",
  em_analise_externa: "Em Análise Externa",
  exigencia_externa: "Exigência Externa",
  aprovado_externamente: "Aprovado Externamente",
  aguardando_entrega: "Aguardando Entrega",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const serializeServiceOrder = (os: any) => ({
  ...os,
  statusLabel: OS_STATUS_LABELS[os.status] || os.status,
  numero: os.numero || "OS sem número",
});

export const serializeSchedule = (s: any) => ({
  ...s,
  status: s.status || "pendente",
});

export const serializeDocument = (doc: any) => ({
  ...doc,
  versaoAtual: Number(doc.versaoAtual) || 0,
});

export const serializeDocumentVersion = (dv: any) => ({
  ...dv,
  versao: Number(dv.versao) || 0,
  tamanho: Number(dv.tamanho) || 0,
  versaoLabel: `V${Number(dv.versao) || 0}`,
});

export const serializeExternalSubmission = (sub: any) => ({
  ...sub,
  versaoEnviada: sub.versaoEnviada ? Number(sub.versaoEnviada) : undefined,
});

export const serializeExternalResponse = (res: any) => ({
  ...res,
  versaoAprovada: res.versaoAprovada ? Number(res.versaoAprovada) : undefined,
});

export const serializeDelivery = (del: any) => ({
  ...del,
  status: del.status || "pendente",
});

export const serializeOsEvent = (ev: any) => ({
  ...ev,
  dados: ev.dados || {},
});

export const serializeNotification = (n: any) => ({
  ...n,
  lida: n.lida === true,
  osId: n.osId || n.os_id || undefined,
  compromissoId: n.compromissoId || n.compromisso_id || undefined,
});

export const serializeProposalAcceptance = (a: any) => ({
  ...a,
  meio: a.meio || "outro",
  responsavelNome: a.responsavelNome || "Cliente",
  data: a.data || "",
  observacao: a.observacao || "",
  usuarioNome: a.usuarioNome || "",
  documentoUrl: a.documentoUrl || undefined,
  documentoNome: a.documentoNome || undefined,
  origem: a.origem || "normal",
});

export const serializeProposalDelivery = (d: any) => ({
  ...d,
  canal: d.canal || "email",
  destinatario: d.destinatario || "",
  status: d.status || "enviado",
  erro: d.erro || undefined,
  usuarioNome: d.usuarioNome || "",
});

export const serializeAccountReceivable = (ar: any) => {
  const valorOriginal = Number(ar.valorOriginal) || 0;
  const valorPago = Number(ar.valorPago) || 0;
  return {
    ...ar,
    valorOriginal,
    valorPago,
    saldo: Math.max(0, valorOriginal - valorPago),
    status: ar.status || "pendente",
  };
};

export const serializePayment = (p: any) => ({
  ...p,
  valor: Number(p.valor) || 0,
  data: p.data || "",
  formaPagamento: p.formaPagamento || "PIX",
  observacao: p.observacao || "",
  lancadoPorNome: p.lancadoPorNome || "Sistema",
});

export const serializeReceipt = (r: any) => ({
  ...r,
  numero: r.numero || "",
  dataEmissao: r.dataEmissao || "",
  emissorNome: r.emissorNome || "",
  status: r.status || "ativo",
});
