import { Router } from "express";
import { db } from "../../db/index.js";
import { service_orders, documents, deliveries, service_order_items, service_order_item_comments, schedules, os_events, external_submissions, external_responses, document_versions, proposals, vessels, clients, users, notifications } from "../../db/schema.js";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { requireAuth, requirePermission, requireRole } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";
import { serializeServiceOrder, serializeSchedule, serializeDocument, serializeDocumentVersion, serializeExternalSubmission, serializeExternalResponse, serializeDelivery, serializeOsEvent, serializeNotification } from "../serializers.js";

const router = Router();

// Helper: generate OS number
async function generateOsNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const all = await db.select().from(service_orders);
  const prefix = `OS-${year}-`;
  const count = all.filter((o) => o.numero.startsWith(prefix)).length;
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

// Helper: log event
async function logEvent(osId: string, tipo: string, user: any, descricao: string, dados: any = {}) {
  await db.insert(os_events).values({ osId, tipo, autorId: user?.id, autorNome: user?.nome || "Sistema", descricao, dados });
}

// Helper: create notification
async function notify(usuarioId: string, tipo: string, titulo: string, mensagem: string, osId?: string, prioridade: "normal" | "alta" | "critica" = "normal") {
  await db.insert(notifications).values({ usuarioId, tipo, titulo, mensagem, osId, prioridade });
}

// Notify every person who must follow an OS change: active administrators and
// the employees assigned to the OS, its schedule or one of its services.
async function notifyOsStakeholders(
  osId: string,
  tipo: string,
  titulo: string,
  mensagem: string,
  prioridade: "normal" | "alta" | "critica" = "normal",
  additionalUserIds: Array<string | null | undefined> = [],
  includeAllAssignedUsers = true,
) {
  const [admins, orderRows, itemRows, scheduleRows] = await Promise.all([
    db.select().from(users).where(and(eq(users.role, "admin"), eq(users.ativo, true))),
    db.select().from(service_orders).where(eq(service_orders.id, osId)),
    db.select().from(service_order_items).where(eq(service_order_items.osId, osId)),
    db.select().from(schedules).where(eq(schedules.osId, osId)),
  ]);
  const recipientIds = new Set<string>();
  admins.forEach((user) => recipientIds.add(user.id));
  if (includeAllAssignedUsers) {
    if (orderRows[0]?.responsavelTecnicoId) recipientIds.add(orderRows[0].responsavelTecnicoId);
    itemRows.forEach((item) => { if (item.tecnicoResponsavelId) recipientIds.add(item.tecnicoResponsavelId); });
    scheduleRows.forEach((schedule) => { if (schedule.tecnicoResponsavelId) recipientIds.add(schedule.tecnicoResponsavelId); });
  }
  additionalUserIds.forEach((userId) => { if (userId) recipientIds.add(userId); });
  await Promise.all([...recipientIds].map((userId) => notify(userId, tipo, titulo, mensagem, osId, prioridade)));
}

// Helper: infer doc type
function inferTipo(descricao: string): string {
  const d = (descricao || "").toLowerCase();
  if (d.includes("ultrassom") || d.includes("espessura") || d.includes("solda")) return "ultrassom";
  if (d.includes("desenho") || d.includes("plano") || d.includes("croqui")) return "desenho";
  if (d.includes("art") || d.includes("responsabilidade")) return "art";
  if (d.includes("homologa")) return "homologacao";
  return "outro";
}

// ---------- GET /api/service-orders ----------
router.get("/", requireAuth, async (req: any, res: any) => {
  try {
    const [all, allProposals, allVessels, allClients, allItems, allUsers] = await Promise.all([
      db.select().from(service_orders).orderBy(desc(service_orders.createdAt)),
      db.select().from(proposals),
      db.select().from(vessels),
      db.select().from(clients),
      db.select().from(service_order_items),
      db.select().from(users),
    ]);
    const currentUser = allUsers.find((user) => user.id === req.session.userId);
    const isManagement = currentUser?.role === "admin" || currentUser?.role === "financeiro";
    const visible = isManagement
      ? all
      : all.filter((order) => allItems.some((item) => item.osId === order.id && item.tecnicoResponsavelId === currentUser?.id));
    res.json(visible.map((order) => {
      const proposal = allProposals.find((item) => item.id === order.propostaId);
      const vessel = allVessels.find((item) => item.id === order.embarcacaoId);
      const client = allClients.find((item) => item.id === order.clienteId);
      const items = allItems.filter((item) => item.osId === order.id);
      const visibleItems = isManagement ? items : items.filter((item) => item.tecnicoResponsavelId === currentUser?.id);
      return {
        ...serializeServiceOrder(order),
        propostaNumero: proposal?.numero || undefined,
        embarcacaoNome: vessel?.nome || proposal?.embarcacaoNome || undefined,
        clienteNome: client?.nome || proposal?.clienteNome || undefined,
        quantidadeServicos: items.length,
        servicosSemResponsavel: items.filter((item) => !item.tecnicoResponsavelId).length,
        servicosSemAgendamento: items.filter((item) => !item.dataAgendada || !item.horarioAgendado).length,
        servicos: visibleItems.map((item) => ({
          ...item,
          valorUnitario: Number(item.valorUnitario) || 0,
          responsavelNome: allUsers.find((user) => user.id === item.tecnicoResponsavelId)?.nome || undefined,
        })),
        tecnicosIds: items.map((item) => item.tecnicoResponsavelId).filter(Boolean),
      };
    }));
  } catch (error) {
    console.error("Erro ao carregar lista de OS:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- GET /api/service-orders/pending-actions (dashboards) ----------
router.get("/pending-actions", requireAuth, async (req: any, res: any) => {
  try {
    const all = await db.select().from(service_orders).orderBy(desc(service_orders.createdAt));
    const docs = await db.select().from(documents);
    const result: any = {
      aguardandoEntrega: [],
      aguardandoRevisao: [],
      aguardandoCorrecao: [],
      aguardandoEnvioExterno: [],
      aguardandoRespostaExterna: [],
    };
    for (const os of all) {
      const osDocs = docs.filter((d) => d.osId === os.id);
      if (os.status === "aguardando_entrega") result.aguardandoEntrega.push(serializeServiceOrder(os));
      if (osDocs.some((d) => d.status === "em_revisao")) result.aguardandoRevisao.push(serializeServiceOrder(os));
      if (osDocs.some((d) => d.status === "exigencia")) result.aguardandoCorrecao.push(serializeServiceOrder(os));
      if (os.status === "aguardando_envio_externo") result.aguardandoEnvioExterno.push(serializeServiceOrder(os));
      if (os.status === "em_analise_externa") result.aguardandoRespostaExterna.push(serializeServiceOrder(os));
    }
    res.json(result);
  } catch (error) {
    console.error("Erro ao carregar detalhe da OS:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Static notification routes must precede /:id, otherwise "notifications"
// is interpreted as an OS id by Express.
router.get("/notifications", requireAuth, async (req: any, res: any) => {
  try {
    const list = await db.select().from(notifications)
      .where(eq(notifications.usuarioId, req.session.userId))
      .orderBy(desc(notifications.createdAt));
    res.json(list.map(serializeNotification));
  } catch {
    res.status(500).json({ error: "Não foi possível carregar notificações" });
  }
});

router.post("/notifications/:id/read", requireAuth, async (req: any, res: any) => {
  try {
    const updated = await db.update(notifications).set({ lida: true })
      .where(and(eq(notifications.id, req.params.id), eq(notifications.usuarioId, req.session.userId)))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "Notificação não encontrada" });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Não foi possível atualizar a notificação" });
  }
});

// ---------- PUT /api/service-orders/items/:itemId ----------
router.put("/items/:itemId", requireAuth, async (req: any, res: any) => {
  try {
    const current = (await db.select().from(service_order_items).where(eq(service_order_items.id, req.params.itemId)))[0];
    if (!current) return res.status(404).json({ error: "Item da OS não encontrado" });
    const actor = req.user;
    const isAdmin = actor?.role === "admin";
    if (!isAdmin && current.tecnicoResponsavelId !== actor?.id) return res.status(403).json({ error: "Você só pode atualizar itens atribuídos a você" });
    const data = req.body || {}; const update: any = { updatedAt: new Date() };
    if (isAdmin && data.tecnicoResponsavelId !== undefined) update.tecnicoResponsavelId = data.tecnicoResponsavelId || null;
    if (data.relatorioUrl !== undefined) { update.relatorioUrl = data.relatorioUrl || null; update.relatorioNome = data.relatorioNome || null; }
    if (data.status !== undefined) {
      if (!["pendente", "em_execucao", "concluido"].includes(data.status)) return res.status(400).json({ error: "Status inválido" });
      update.status = data.status;
    }
    const resultingTechnicianId = update.tecnicoResponsavelId !== undefined ? update.tecnicoResponsavelId : current.tecnicoResponsavelId;
    const resultingStatus = update.status !== undefined ? update.status : current.status;
    if (data.status !== undefined && resultingStatus !== "pendente" && !resultingTechnicianId) {
      return res.status(400).json({ error: "Atribua um funcionário antes de iniciar ou concluir este serviço." });
    }
    if (data.status !== undefined && resultingStatus !== "pendente" && (!current.dataAgendada || !current.horarioAgendado)) {
      return res.status(400).json({ error: "Agende a data e o horário do serviço antes de iniciá-lo." });
    }
    const updated = (await db.update(service_order_items).set(update).where(eq(service_order_items.id, current.id)).returning())[0];
    await logEvent(current.osId, "item_os", actor, `Item "${current.descricao}" atualizado para ${updated.status}.`);
    const assignmentChanged = updated.tecnicoResponsavelId !== current.tecnicoResponsavelId;
    const statusChanged = updated.status !== current.status;
    const statusTitle = updated.status === "em_execucao" ? "Serviço iniciado" : updated.status === "concluido" ? "Serviço concluído" : "Serviço reaberto";
    await notifyOsStakeholders(
      current.osId,
      assignmentChanged ? "atribuicao" : statusChanged ? `servico_${updated.status}` : "item_os",
      assignmentChanged ? "Responsável pelo serviço atualizado" : statusChanged ? statusTitle : "Serviço da OS atualizado",
      assignmentChanged
        ? `${actor?.nome || "Administrador"} atribuiu o serviço "${current.descricao}" a um responsável.`
        : statusChanged
          ? `${actor?.nome || "Responsável"} alterou "${current.descricao}" para ${updated.status === "em_execucao" ? "em execução" : updated.status === "concluido" ? "concluído" : "pendente"}.`
          : `${actor?.nome || "Responsável"} atualizou os dados de "${current.descricao}".`,
      "alta",
      [updated.tecnicoResponsavelId, current.tecnicoResponsavelId],
      false,
    );
    const admins = await db.select().from(users).where(and(eq(users.role, "admin"), eq(users.ativo, true)));
    const allItems = await db.select().from(service_order_items).where(eq(service_order_items.osId, current.osId));
    if (allItems.length && allItems.every((item) => item.status === "concluido")) for (const admin of admins) await notify(admin.id, "os_itens_concluidos", "Serviços concluídos", "Todos os itens da OS foram concluídos e aguardam validação administrativa.", current.osId, "alta");
    res.json(updated);
  } catch (error) { console.error(error); res.status(500).json({ error: "Não foi possível atualizar o item da OS" }); }
});

// ---------- POST /api/service-orders/items/:itemId/schedule ----------
router.post("/items/:itemId/schedule", requireRole(["admin"]), async (req: any, res: any) => {
  try {
    const item = (await db.select().from(service_order_items).where(eq(service_order_items.id, req.params.itemId)))[0];
    if (!item) return res.status(404).json({ error: "Serviço da OS não encontrado" });
    const data = req.body || {};
    const technicianId = data.tecnicoResponsavelId || item.tecnicoResponsavelId;
    if (!technicianId) return res.status(400).json({ error: "Selecione o funcionário responsável pelo serviço." });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.data || ""))) return res.status(400).json({ error: "Selecione uma data válida." });
    if (!/^(?:[01]\d|2[0-3]):(?:00|30)$/.test(String(data.horario || ""))) return res.status(400).json({ error: "Selecione um horário em intervalos de 30 minutos." });
    const updated = (await db.update(service_order_items).set({
      tecnicoResponsavelId: technicianId,
      dataAgendada: data.data,
      horarioAgendado: data.horario,
      localAgendado: String(data.local || "").trim() || null,
      contatoAgendamento: String(data.contato || "").trim() || null,
      observacoesAgendamento: String(data.observacoes || "").trim() || null,
      updatedAt: new Date(),
    }).where(eq(service_order_items.id, item.id)).returning())[0];
    const order = (await db.select().from(service_orders).where(eq(service_orders.id, item.osId)))[0];
    if (order && order.status === "aguardando_agendamento") {
      await db.update(service_orders).set({ status: "visita_agendada", updatedAt: new Date() }).where(eq(service_orders.id, item.osId));
    }
    await logEvent(item.osId, "agendamento_servico", req.user, `Serviço "${item.descricao}" agendado para ${data.data} às ${data.horario}.`, { itemId: item.id });
    await notifyOsStakeholders(
      item.osId,
      "agendamento_servico",
      "Serviço agendado",
      `${req.user.nome} agendou "${item.descricao}" para ${data.data.split("-").reverse().join("/")} às ${data.horario}.`,
      "alta",
      [technicianId, item.tecnicoResponsavelId],
      false,
    );
    res.json(updated);
  } catch (error) {
    console.error("Erro ao agendar serviço da OS:", error);
    res.status(500).json({ error: "Não foi possível agendar o serviço." });
  }
});

// ---------- POST /api/service-orders/items/:itemId/comments ----------
router.post("/items/:itemId/comments", requireAuth, async (req: any, res: any) => {
  try {
    const item = (await db.select().from(service_order_items).where(eq(service_order_items.id, req.params.itemId)))[0];
    if (!item) return res.status(404).json({ error: "Serviço da OS não encontrado" });
    const actor = req.user;
    if (actor?.role !== "admin" && item.tecnicoResponsavelId !== actor?.id) {
      return res.status(403).json({ error: "Somente o administrador e o responsável pelo serviço podem comentar." });
    }
    const texto = String(req.body?.texto || "").trim();
    if (!texto) return res.status(400).json({ error: "Escreva uma observação antes de enviar." });
    if (texto.length > 2000) return res.status(400).json({ error: "A observação deve ter no máximo 2.000 caracteres." });
    const comment = (await db.insert(service_order_item_comments).values({
      itemId: item.id,
      osId: item.osId,
      autorId: actor.id,
      autorNome: actor.nome,
      texto,
    }).returning())[0];
    await logEvent(item.osId, "observacao_servico", actor, `${actor.nome} adicionou uma observação em "${item.descricao}".`, { itemId: item.id, commentId: comment.id });
    await notifyOsStakeholders(
      item.osId,
      "observacao_servico",
      "Nova observação no serviço",
      `${actor.nome} comentou em "${item.descricao}": ${texto}`,
      "normal",
      [item.tecnicoResponsavelId],
      false,
    );
    res.status(201).json(comment);
  } catch (error) {
    console.error("Erro ao registrar observação do serviço:", error);
    res.status(500).json({ error: "Não foi possível registrar a observação." });
  }
});

// ---------- GET /api/service-orders/:id (detail with relations) ----------
router.get("/:id", requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });
    const os = osList[0];

    const allItems = await db.select().from(service_order_items).where(eq(service_order_items.osId, id));
    const currentUser = (await db.select().from(users).where(eq(users.id, req.session.userId)))[0];
    const items = currentUser?.role === "admin" || currentUser?.role === "financeiro"
      ? allItems
      : allItems.filter((item) => item.tecnicoResponsavelId === currentUser?.id);
    const itemIds = items.map((item) => item.id);
    const itemComments = itemIds.length
      ? await db.select().from(service_order_item_comments).where(inArray(service_order_item_comments.itemId, itemIds)).orderBy(service_order_item_comments.createdAt)
      : [];
    const sched = await db.select().from(schedules).where(eq(schedules.osId, id));
    const docs = await db.select().from(documents).where(eq(documents.osId, id));
    const subs = await db.select().from(external_submissions).where(eq(external_submissions.osId, id));
    const deliv = await db.select().from(deliveries).where(eq(deliveries.osId, id));
    const events = await db.select().from(os_events).where(eq(os_events.osId, id)).orderBy(desc(os_events.createdAt));

    const docIds = docs.map((d) => d.id);
    const versions = docIds.length
      ? await db.select().from(document_versions).where(inArray(document_versions.documentoId, docIds)).orderBy(desc(document_versions.versao))
      : [];
    const subIds = subs.map((s) => s.id);
    const responses = subIds.length
      ? await db.select().from(external_responses).where(inArray(external_responses.submissaoId, subIds))
      : [];

    let proposal = null;
    if (os.propostaId) {
      const propList = await db.select().from(proposals).where(eq(proposals.id, os.propostaId!));
      proposal = propList[0] || null;
    }
    let vessel = null;
    if (os.embarcacaoId) {
      const vList = await db.select().from(vessels).where(eq(vessels.id, os.embarcacaoId!));
      vessel = vList[0] || null;
    }
    let tecnico = null;
    if (os.responsavelTecnicoId) {
      const tList = await db.select().from(users).where(eq(users.id, os.responsavelTecnicoId!));
      tecnico = tList[0] || null;
    }

    res.json({
      ...serializeServiceOrder(os),
      itens: items.map((item) => ({
        ...item,
        valorUnitario: Number(item.valorUnitario) || 0,
        observacoes: itemComments.filter((comment) => comment.itemId === item.id),
      })),
      agendamento: sched.map(serializeSchedule),
      documentos: docs.map((d) => ({
        ...serializeDocument(d),
        versoes: versions.filter((v) => v.documentoId === d.id).map(serializeDocumentVersion),
      })),
      submissoesExternas: subs.map((s) => ({
        ...serializeExternalSubmission(s),
        respostas: responses.filter((r) => r.submissaoId === s.id).map(serializeExternalResponse),
      })),
      entregas: deliv.map(serializeDelivery),
      eventos: events.map(serializeOsEvent),
      proposta: proposal ? { ...proposal, valorTotal: Number(proposal.valorTotal) || 0 } : null,
      embarcacao: vessel,
      tecnicoResponsavel: tecnico ? { id: tecnico.id, nome: tecnico.nome, email: tecnico.email } : null,
    });
  } catch (error) {
    console.error("Erro ao carregar detalhe da OS:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/service-orders/:id/schedule ----------
router.post("/:id/schedule", requirePermission([PERMISSIONS.REGISTRAR_ACEITE_AGENDAR]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });
    const os = osList[0];

    const existing = await db.select().from(schedules).where(eq(schedules.osId, id));
    let schedule;
    if (existing.length > 0) {
      schedule = (await db.update(schedules).set({
        status: data.status || existing[0].status,
        data: data.data !== undefined ? data.data : existing[0].data,
        horario: data.horario !== undefined ? data.horario : existing[0].horario,
        local: data.local !== undefined ? data.local : existing[0].local,
        contato: data.contato !== undefined ? data.contato : existing[0].contato,
        observacoes: data.observacoes !== undefined ? data.observacoes : existing[0].observacoes,
        tecnicoResponsavelId: data.tecnicoResponsavelId !== undefined ? data.tecnicoResponsavelId : existing[0].tecnicoResponsavelId,
        updatedAt: new Date(),
      }).where(eq(schedules.id, existing[0].id)).returning())[0];
    } else {
      schedule = (await db.insert(schedules).values({
        osId: id,
        status: data.status || "pendente",
        data: data.data,
        horario: data.horario,
        local: data.local,
        contato: data.contato,
        observacoes: data.observacoes,
        tecnicoResponsavelId: data.tecnicoResponsavelId || os.responsavelTecnicoId,
      }).returning())[0];
    }

    const hasFullSchedule = schedule.data && schedule.status === "agendado";
    const newStatus = hasFullSchedule ? "visita_agendada" : "aguardando_agendamento";
    await db.update(service_orders).set({
      status: newStatus,
      responsavelTecnicoId: schedule.tecnicoResponsavelId || os.responsavelTecnicoId,
      updatedAt: new Date(),
    }).where(eq(service_orders.id, id));

    await logEvent(id, "agendamento", req.user,
      hasFullSchedule
        ? `Agendamento da visita marcado para ${schedule.data} às ${schedule.horario || "a definir"}.`
        : "Agendamento salvo como pendente.");

    await notifyOsStakeholders(
      id,
      "agendamento",
      existing.length ? "Agendamento alterado" : "Visita agendada",
      hasFullSchedule
        ? `${req.user?.nome || "Administrador"} agendou a visita para ${schedule.data} às ${schedule.horario || "horário a definir"}${schedule.local ? `, em ${schedule.local}` : ""}.`
        : `${req.user?.nome || "Administrador"} alterou o agendamento da OS.`,
      "alta",
      [schedule.tecnicoResponsavelId, existing[0]?.tecnicoResponsavelId],
    );

    const osUpdated = (await db.select().from(service_orders).where(eq(service_orders.id, id)))[0];
    res.json({ schedule: serializeSchedule(schedule), os: serializeServiceOrder(osUpdated) });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/service-orders/:id/vistoria ----------
router.post("/:id/vistoria", requirePermission([PERMISSIONS.EXECUTAR_VISTORIA]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });
    const os = osList[0];

    const prevStatus = os.status;
    const nextStatus = data.concluirVistoria ? "documentacao_em_elaboracao" : "vistoria_em_execucao";
    
    // Buscar informações da OS para notificações
    const proposal = os.propostaId ? (await db.select().from(proposals).where(eq(proposals.id, os.propostaId!)))[0] : null;
    const vessel = os.embarcacaoId ? (await db.select().from(vessels).where(eq(vessels.id, os.embarcacaoId!)))[0] : null;
    
    await db.update(service_orders).set({
      status: nextStatus,
      responsavelTecnicoId: req.user?.role === "admin" ? os.responsavelTecnicoId : req.user.id,
      updatedAt: new Date(),
    }).where(eq(service_orders.id, id));

    const isConcluding = data.concluirVistoria && prevStatus !== "vistoria_em_execucao";
    
    await logEvent(id, "vistoria", req.user,
      isConcluding
        ? "Vistoria executada. Iniciando elaboração da documentação."
        : "Vistoria iniciada/em execução.",
      { observacoes: data.observacoes || "" });

    await notifyOsStakeholders(
      id,
      isConcluding ? "vistoria_conclusao" : "vistoria_inicio",
      isConcluding ? "Vistoria concluída" : "Vistoria em execução",
      isConcluding
        ? `${req.user?.nome || "O responsável"} concluiu a vistoria da embarcação ${vessel?.nome || "não identificada"}. Documentação em elaboração.`
        : `${req.user?.nome || "O responsável"} iniciou a vistoria da embarcação ${vessel?.nome || "não identificada"}.`,
      "alta",
      [req.user?.id],
    );

    // Se estiver concluindo a vistoria, criar documentos pendentes automaticamente
    if (isConcluding && proposal) {
      const itens = await db.select().from(service_order_items).where(eq(service_order_items.osId, id));
      const existingDocuments = await db.select().from(documents).where(eq(documents.osId, id));
      for (const item of itens) {
        if (existingDocuments.some((document) => document.titulo.trim().toLowerCase() === item.descricao.trim().toLowerCase())) continue;
        const tipoDoc = inferTipo(item.descricao);
        await db.insert(documents).values({
          osId: id,
          titulo: item.descricao,
          tipo: tipoDoc,
          status: "em_elaboracao",
          versaoAtual: 0,
        });
      }
      await logEvent(id, "documento", req.user, "Documentos criados automaticamente após conclusão da vistoria.");
    }

    const osUpdated = (await db.select().from(service_orders).where(eq(service_orders.id, id)))[0];
    res.json(serializeServiceOrder(osUpdated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/documents/:id/versions (upload new version) ----------
router.post("/documents/:id/versions", requirePermission([PERMISSIONS.ANEXAR_EDITAR_VERSOES]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const docList = await db.select().from(documents).where(eq(documents.id, id));
    if (docList.length === 0) return res.status(404).json({ error: "Documento não encontrado" });
    const doc = docList[0];

    // Atomic increment: lock document, compute next version
    const updatedDoc = (await db.update(documents).set({
      versaoAtual: sql`${documents.versaoAtual} + 1`,
      updatedAt: new Date(),
    }).where(eq(documents.id, id)).returning())[0];

    const nextVersion = Number(updatedDoc.versaoAtual);

    const version = (await db.insert(document_versions).values({
      documentoId: id,
      versao: nextVersion,
      arquivoNomeFisico: data.arquivoNomeFisico || data.fileName || "",
      arquivoNomeOriginal: data.arquivoNomeOriginal || data.originalName || "",
      tamanho: data.tamanho || 0,
      tipoMime: data.tipoMime || data.mimeType,
      autorId: req.user.id,
      autorNome: req.user.nome,
      data: new Date().toISOString().split("T")[0],
      comentario: data.comentario,
      origem: data.origem || "correcao_interna",
      situacaoRevisao: "pendente",
      situacaoAprovacao: "pendente",
      pdfUrl: data.pdfUrl || null,
    }).returning())[0];

    await db.update(documents).set({ status: "em_revisao", updatedAt: new Date() }).where(eq(documents.id, id));
    await db.update(service_orders).set({ status: "revisao_interna", updatedAt: new Date() }).where(eq(service_orders.id, doc.osId));

    await logEvent(doc.osId, "upload", req.user, `Nova versão V${nextVersion} anexada ao documento "${doc.titulo}".`,
      { documentoId: id, versao: nextVersion, origem: data.origem || "correcao_interna" });

    await notifyOsStakeholders(
      doc.osId,
      "documento_anexado",
      "Novo documento anexado",
      `${req.user?.nome || "O responsável"} anexou a versão V${nextVersion} do documento "${doc.titulo}".`,
      "alta",
      [req.user?.id],
    );

    res.json(serializeDocumentVersion(version));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/documents/:id/review ----------
router.post("/documents/:id/review", requirePermission([PERMISSIONS.REVISAR_DOCUMENTOS]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const docList = await db.select().from(documents).where(eq(documents.id, id));
    if (docList.length === 0) return res.status(404).json({ error: "Documento não encontrado" });
    const doc = docList[0];

    const versions = await db.select().from(document_versions).where(eq(document_versions.documentoId, id)).orderBy(desc(document_versions.versao));
    const latest = versions[0];
    if (!latest) return res.status(400).json({ error: "O documento ainda não possui uma versão para revisar" });
    const isOk = data.aprovado !== false;
    if (latest) {
      await db.update(document_versions).set({
        situacaoRevisao: "revisado",
        situacaoAprovacao: isOk ? latest.situacaoAprovacao : "reprovado",
        comentario: data.comentario || latest.comentario,
        updatedAt: new Date(),
      }).where(eq(document_versions.id, latest.id));
    }

    await db.update(documents).set({ status: isOk ? "aguardando_envio" : "em_elaboracao", updatedAt: new Date() }).where(eq(documents.id, id));
    const allDocuments = await db.select().from(documents).where(eq(documents.osId, doc.osId));
    const allReadyForExternal = allDocuments.length > 0 && allDocuments.every((item) => ["aguardando_envio", "em_analise_externa", "aprovado"].includes(item.status));
    const hasDocumentInReview = allDocuments.some((item) => item.status === "em_revisao");
    const nextOsStatus = allReadyForExternal
      ? "aguardando_envio_externo"
      : hasDocumentInReview
        ? "revisao_interna"
        : "documentacao_em_elaboracao";
    await db.update(service_orders).set({ status: nextOsStatus, updatedAt: new Date() }).where(eq(service_orders.id, doc.osId));

    await logEvent(doc.osId, "revisao", req.user,
      isOk ? `Revisão interna do documento "${doc.titulo}" concluída.` : `Revisão do documento "${doc.titulo}" apontou correções.`,
      { documentoId: id, aprovado: isOk, comentario: data.comentario || "" });

    const matchingItem = (await db.select().from(service_order_items).where(eq(service_order_items.osId, doc.osId)))
      .find((item) => item.descricao.trim().toLowerCase() === doc.titulo.trim().toLowerCase());
    await notifyOsStakeholders(
      doc.osId,
      isOk ? "revisao_aprovada" : "correcao_solicitada",
      isOk ? "Documento revisado com sucesso" : "Correções solicitadas",
      isOk
        ? `${req.user?.nome || "Administrador"} revisou e aprovou internamente o documento "${doc.titulo}".`
        : `${req.user?.nome || "Administrador"} solicitou correções no documento "${doc.titulo}"${data.comentario ? `: ${data.comentario}` : "."}`,
      isOk ? "normal" : "alta",
      [matchingItem?.tecnicoResponsavelId, latest.autorId],
    );

    res.json({ ok: true, aprovado: isOk, documentStatus: isOk ? "aguardando_envio" : "em_elaboracao", osStatus: nextOsStatus });
  } catch (error) {
    console.error("Erro ao revisar documento da OS:", error);
    res.status(500).json({ error: "Não foi possível concluir a revisão do documento" });
  }
});

// ---------- POST /api/documents/:id/approve (technical approval) ----------
router.post("/documents/:id/approve", requirePermission([PERMISSIONS.APROVAR_TECNICAMENTE]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const docList = await db.select().from(documents).where(eq(documents.id, id));
    if (docList.length === 0) return res.status(404).json({ error: "Documento não encontrado" });
    const doc = docList[0];

    const versions = await db.select().from(document_versions).where(eq(document_versions.documentoId, id)).orderBy(desc(document_versions.versao));
    const latest = versions[0];
    if (!latest) return res.status(400).json({ error: "Documento sem versões para aprovar" });

    await db.update(document_versions).set({
      situacaoAprovacao: "aprovado",
      aprovadoPorId: req.user.id,
      aprovadoEm: new Date().toISOString().split("T")[0],
      updatedAt: new Date(),
    }).where(eq(document_versions.id, latest.id));

    await db.update(documents).set({ status: "aguardando_envio", updatedAt: new Date() }).where(eq(documents.id, id));
    await db.update(service_orders).set({ status: "aguardando_envio_externo", updatedAt: new Date() }).where(eq(service_orders.id, doc.osId));

    await logEvent(doc.osId, "aprovacao", req.user, `Aprovação técnica do documento "${doc.titulo}" (V${latest.versao}).`, { documentoId: id, versao: latest.versao });

    await notifyOsStakeholders(
      doc.osId,
      "aprovacao",
      "Documento aprovado tecnicamente",
      `${req.user?.nome || "Responsável técnico"} aprovou tecnicamente o documento "${doc.titulo}" (V${latest.versao}).`,
      "alta",
      [latest.autorId],
    );

    res.json({ ok: true, versaoAprovada: latest.versao });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/service-orders/:id/submit-external ----------
router.post("/:id/submit-external", requirePermission([PERMISSIONS.REGISTRAR_ENVIO_RESPOSTA_EXTERNA]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });

    if (!data.documentoId || !data.versaoEnviada) return res.status(400).json({ error: "Documento e versão aprovada são obrigatórios" });
    const doc = (await db.select().from(documents).where(and(eq(documents.id, data.documentoId), eq(documents.osId, id))))[0];
    if (!doc) return res.status(400).json({ error: "Documento não pertence a esta OS" });
    const version = (await db.select().from(document_versions).where(and(eq(document_versions.documentoId, data.documentoId), eq(document_versions.versao, Number(data.versaoEnviada)))))[0];
    if (!version || version.situacaoAprovacao !== "aprovado") return res.status(400).json({ error: "A versão precisa estar aprovada tecnicamente antes do envio" });

    const sub = (await db.insert(external_submissions).values({
      osId: id,
      documentoId: data.documentoId,
      versaoEnviada: data.versaoEnviada,
      orgaoOuCertificadora: data.orgaoOuCertificadora || "Órgão",
      dataEnvio: data.dataEnvio || new Date().toISOString().split("T")[0],
      protocolo: data.protocolo,
      observacao: data.observacao,
      responsavelEnvioId: req.user.id,
    }).returning())[0];

    if (data.documentoId) {
      await db.update(documents).set({ status: "em_analise_externa", updatedAt: new Date() }).where(eq(documents.id, data.documentoId));
    }
    await db.update(service_orders).set({ status: "em_analise_externa", updatedAt: new Date() }).where(eq(service_orders.id, id));

    await logEvent(id, "envio_externo", req.user,
      `Envio externo registrado: V${data.versaoEnviada || "?"} para ${data.orgaoOuCertificadora || "órgão"} (protocolo: ${data.protocolo || "sem protocolo"}).`,
      { submissaoId: sub.id });

    await notifyOsStakeholders(
      id,
      "envio_externo",
      "Documento enviado para análise externa",
      `${req.user?.nome || "Administrador"} enviou "${doc.titulo}" para ${data.orgaoOuCertificadora || "o órgão responsável"}.`,
      "alta",
    );

    res.json(serializeExternalSubmission(sub));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/service-orders/:id/external-response ----------
router.post("/:id/external-response", requirePermission([PERMISSIONS.REGISTRAR_ENVIO_RESPOSTA_EXTERNA]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });

    if (!data.submissaoId) return res.status(400).json({ error: "submissaoId é obrigatório" });

    const resp = (await db.insert(external_responses).values({
      submissaoId: data.submissaoId,
      tipo: data.tipo || "exigencia",
      data: data.data || new Date().toISOString().split("T")[0],
      motivo: data.motivo,
      anexoUrl: data.anexoUrl,
      anexoNome: data.anexoNome,
      versaoAprovada: data.versaoAprovada,
    }).returning())[0];

    const sub = (await db.select().from(external_submissions).where(and(eq(external_submissions.id, data.submissaoId), eq(external_submissions.osId, id))))[0];
    if (!sub) return res.status(400).json({ error: "Submissão não pertence a esta OS" });

    if (data.tipo === "aprovacao") {
      if (sub?.documentoId) {
        await db.update(documents).set({ status: "aprovado", updatedAt: new Date() }).where(eq(documents.id, sub.documentoId!));
        if (data.versaoAprovada) {
          const vList = await db.select().from(document_versions).where(and(
            eq(document_versions.documentoId, sub.documentoId!),
            eq(document_versions.versao, data.versaoAprovada)
          ));
          if (vList.length > 0) {
            await db.update(document_versions).set({ situacaoAprovacao: "aprovado", updatedAt: new Date() }).where(eq(document_versions.id, vList[0].id));
          }
        }
      }
      const allDocuments = await db.select().from(documents).where(eq(documents.osId, id));
      const allApproved = allDocuments.length > 0 && allDocuments.every((document) => document.status === "aprovado");
      if (allApproved) {
        await db.update(service_orders).set({ status: "aguardando_entrega", updatedAt: new Date() }).where(eq(service_orders.id, id));
        const existingDeliv = await db.select().from(deliveries).where(eq(deliveries.osId, id));
        if (existingDeliv.length === 0) await db.insert(deliveries).values({ osId: id, status: "pendente" });
      } else {
        await db.update(service_orders).set({ status: "documentacao_em_elaboracao", updatedAt: new Date() }).where(eq(service_orders.id, id));
      }
      await logEvent(id, "resposta_externa", req.user, "Aprovação externa registrada.", { versaoAprovada: data.versaoAprovada });
      const lucas = (await db.select().from(users).where(eq(users.email, "lucas@nautilus.eng.br")))[0];
      if (lucas) {
        await notify(lucas.id, "entrega", "📄 Entrega Pendente", `Uma OS alcançou aprovação externa e aguarda entrega.`, id, "alta");
      }
      await notifyOsStakeholders(
        id,
        "aprovacao_externa",
        "Documento aprovado externamente",
        `${req.user?.nome || "Administrador"} registrou a aprovação externa de um documento da OS.`,
        "alta",
      );
    } else {
      if (sub?.documentoId) {
        await db.update(documents).set({ status: "exigencia", updatedAt: new Date() }).where(eq(documents.id, sub.documentoId!));
      }
      await db.update(service_orders).set({ status: "exigencia_externa", updatedAt: new Date() }).where(eq(service_orders.id, id));
      await logEvent(id, "exigencia", req.user,
        `Exigência externa registrada: ${data.motivo || "sem motivo"}. Nova versão necessária.`,
        { submissaoId: data.submissaoId });
      await notifyOsStakeholders(
        id,
        "exigencia",
        "Correção externa solicitada",
        `${req.user?.nome || "Administrador"} registrou uma exigência externa${data.motivo ? `: ${data.motivo}` : "."}`,
        "critica",
      );
    }

    res.json(serializeExternalResponse(resp));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/service-orders/:id/print-confirm (Lucas confirma impressão) ----------
router.post("/:id/print-confirm", requirePermission([PERMISSIONS.ENTREGAR_CONCLUIR]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });

    const existing = await db.select().from(deliveries).where(eq(deliveries.osId, id));
    let delivery;
    if (existing.length > 0) {
      delivery = (await db.update(deliveries).set({
        status: "impresso",
        dataImpressao: new Date().toISOString().split("T")[0],
        impressoPorId: req.user.id,
        updatedAt: new Date(),
      }).where(eq(deliveries.id, existing[0].id)).returning())[0];
    } else {
      delivery = (await db.insert(deliveries).values({
        osId: id,
        status: "impresso",
        dataImpressao: new Date().toISOString().split("T")[0],
        impressoPorId: req.user.id,
      }).returning())[0];
    }

    await logEvent(id, "impressao", req.user, `Lucas confirmou a impressão dos documentos da OS.`);

    await notifyOsStakeholders(
      id,
      "impressao_confirmada",
      "Impressão confirmada",
      `${req.user?.nome || "Responsável"} confirmou a impressão dos documentos da OS.`,
      "normal",
    );

    res.json(serializeDelivery(delivery));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/service-orders/:id/deliver ----------
router.post("/:id/deliver", requirePermission([PERMISSIONS.ENTREGAR_CONCLUIR]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });

    if (!data.dataEntrega || !data.meioEntrega || !data.nomeRecebedor) {
      return res.status(400).json({ error: "Data, meio de entrega e nome do recebedor são obrigatórios" });
    }

    const existing = await db.select().from(deliveries).where(eq(deliveries.osId, id));
    let delivery;
    if (existing.length > 0) {
      delivery = (await db.update(deliveries).set({
        status: "entregue",
        dataEntrega: data.dataEntrega,
        meioEntrega: data.meioEntrega,
        nomeRecebedor: data.nomeRecebedor,
        comprovanteUrl: data.comprovanteUrl,
        comprovanteNome: data.comprovanteNome,
        entreguePorId: req.user.id,
        updatedAt: new Date(),
      }).where(eq(deliveries.id, existing[0].id)).returning())[0];
    } else {
      delivery = (await db.insert(deliveries).values({
        osId: id,
        status: "entregue",
        dataEntrega: data.dataEntrega,
        meioEntrega: data.meioEntrega,
        nomeRecebedor: data.nomeRecebedor,
        comprovanteUrl: data.comprovanteUrl,
        comprovanteNome: data.comprovanteNome,
        entreguePorId: req.user.id,
      }).returning())[0];
    }

    await logEvent(id, "entrega", req.user,
      `Entrega registrada: ${data.meioEntrega} para ${data.nomeRecebedor} em ${data.dataEntrega}${data.comprovanteUrl ? " com comprovante." : " (sem comprovante)."}`);

    await notifyOsStakeholders(
      id,
      "entrega_confirmada",
      "Entrega confirmada",
      `${req.user?.nome || "Responsável"} confirmou a entrega dos documentos da OS para ${data.nomeRecebedor}.`,
      "alta",
    );

    res.json(serializeDelivery(delivery));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/service-orders/:id/complete ----------
router.post("/:id/complete", requirePermission([PERMISSIONS.ENTREGAR_CONCLUIR]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });

    const docs = await db.select().from(documents).where(eq(documents.osId, id));
    const items = await db.select().from(service_order_items).where(eq(service_order_items.osId, id));
    if (!items.length || items.some((item) => item.status !== "concluido")) {
      return res.status(400).json({ error: "Todos os serviços da OS precisam estar concluídos antes do encerramento." });
    }
    const pendingExternal = docs.some(
      (d) => ["em_analise_externa", "exigencia", "aguardando_envio", "em_revisao"].includes(d.status)
    );
    if (pendingExternal) {
      return res.status(400).json({ error: "Há documentos exigidos sem aprovação externa. Conclusão bloqueada." });
    }

    const deliv = await db.select().from(deliveries).where(eq(deliveries.osId, id));
    const delivered = deliv.some((d) => d.status === "entregue" && d.dataEntrega && d.meioEntrega && d.nomeRecebedor);
    if (!delivered) {
      return res.status(400).json({ error: "Entrega pendente. Registre data, meio e recebedor antes de concluir." });
    }

    await db.update(service_orders).set({
      status: "concluida",
      dataConclusao: new Date().toISOString().split("T")[0],
      updatedAt: new Date(),
    }).where(eq(service_orders.id, id));

    await logEvent(id, "conclusao", req.user, "Ordem de Serviço concluída.");

    await notifyOsStakeholders(
      id,
      "os_concluida",
      "Ordem de Serviço concluída",
      `${req.user?.nome || "Administrador"} concluiu a Ordem de Serviço.`,
      "alta",
    );

    const osUpdated = (await db.select().from(service_orders).where(eq(service_orders.id, id)))[0];
    res.json(serializeServiceOrder(osUpdated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/service-orders/:id/cancel ----------
router.post("/:id/cancel", requirePermission([PERMISSIONS.FINANCEIRO_ADMINISTRACAO]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });

    await db.update(service_orders).set({ status: "cancelada", updatedAt: new Date() }).where(eq(service_orders.id, id));
    await logEvent(id, "cancelamento", req.user, `OS cancelada. Motivo: ${data.motivo || "não informado"}.`);

    await notifyOsStakeholders(
      id,
      "os_cancelada",
      "Ordem de Serviço cancelada",
      `${req.user?.nome || "Administrador"} cancelou a OS. Motivo: ${data.motivo || "não informado"}.`,
      "critica",
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
