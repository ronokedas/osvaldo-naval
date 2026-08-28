import { Router } from "express";
import { db } from "../../db/index.js";
import { service_orders, documents, deliveries, delivery_dispatches, delivery_dispatch_documents, approved_document_files, os_finalization_reviews, service_order_items, service_order_item_comments, schedules, os_events, external_submissions, external_responses, document_versions, proposals, vessels, clients, users, notifications, protocols } from "../../db/schema.js";
import { eq, and, desc, sql, inArray, or, ilike, count } from "drizzle-orm";
import { requireAuth, requirePermission, requireRole } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";
import { serializeServiceOrder, serializeSchedule, serializeDocument, serializeDocumentVersion, serializeExternalSubmission, serializeExternalResponse, serializeDelivery, serializeOsEvent, serializeNotification, serializeProtocol } from "../serializers.js";
import { allServicesCompleted, assertServicesCompleted, getOsReadinessBlockers, isDeliveryActionPending, reconcileOsReadiness, reconcileVesselCompletion } from "../delivery-workflow.js";
import { paginationMeta, parsePagination } from "../pagination.js";

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
    const [all, allProposals, allVessels, allClients, allItems, allUsers, allDeliveries, allDeliveryDispatches] = await Promise.all([
      db.select().from(service_orders).orderBy(desc(service_orders.createdAt)),
      db.select().from(proposals),
      db.select().from(vessels),
      db.select().from(clients),
      db.select().from(service_order_items),
      db.select().from(users),
      db.select().from(deliveries),
      db.select().from(delivery_dispatches).orderBy(desc(delivery_dispatches.createdAt)),
    ]);
    const currentUser = allUsers.find((user) => user.id === req.session.userId);
    const isManagement = currentUser?.role === "admin" || currentUser?.role === "financeiro";
    const visible = isManagement
      ? all
      : all.filter((order) => allItems.some((item) => item.osId === order.id && item.tecnicoResponsavelId === currentUser?.id) || allDeliveries.some((delivery) => delivery.osId === order.id && delivery.responsavelId === currentUser?.id));
    res.json(visible.map((order) => {
      const proposal = allProposals.find((item) => item.id === order.propostaId);
      const vessel = allVessels.find((item) => item.id === order.embarcacaoId);
      const client = allClients.find((item) => item.id === order.clienteId);
      const items = allItems.filter((item) => item.osId === order.id);
      const delivery = allDeliveries.find((item) => item.osId === order.id);
      const lastDispatch = delivery ? allDeliveryDispatches.find((item) => item.deliveryId === delivery.id) : undefined;
      const deliveryActionPending = Boolean(delivery && isDeliveryActionPending(delivery.status));
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
        entregaResumo: delivery ? {
          ...serializeDelivery(delivery),
          acaoEntregaPendente: deliveryActionPending,
          ultimaRemessa: lastDispatch ? { ...lastDispatch } : undefined,
        } : undefined,
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

// Lightweight paginated collection. Full documents, remittances and timeline
// remain exclusive to GET /:id so the Kanban does not load the entire dossier.
router.get("/list", requireAuth, async (req: any, res: any) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const conditions: any[] = [];
    if (req.query.status && req.query.status !== 'todos') conditions.push(eq(service_orders.status, String(req.query.status)));
    const q = String(req.query.q || '').trim();
    if (q) conditions.push(or(ilike(service_orders.numero, `%${q}%`), ilike(service_orders.status, `%${q}%`)));
    const currentUser = req.user;
    if (currentUser.role !== 'admin' && currentUser.role !== 'financeiro') {
      const assigned = await db.select({ osId: service_order_items.osId }).from(service_order_items).where(eq(service_order_items.tecnicoResponsavelId, currentUser.id));
      const ids = [...new Set(assigned.map((row) => row.osId))];
      if (!ids.length) return res.json({ items: [], pagination: paginationMeta(page, limit, 0) });
      conditions.push(inArray(service_orders.id, ids));
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const [rows, totalRows] = await Promise.all([
      db.select().from(service_orders).where(where).orderBy(desc(service_orders.createdAt), desc(service_orders.id)).limit(limit).offset(offset),
      db.select({ total: count() }).from(service_orders).where(where),
    ]);
    const vesselIds = rows.map((row) => row.embarcacaoId).filter(Boolean) as string[];
    const proposalIds = rows.map((row) => row.propostaId).filter(Boolean) as string[];
    const [vesselRows, clientRows, proposalRows, itemRows] = await Promise.all([
      vesselIds.length ? db.select().from(vessels).where(inArray(vessels.id, vesselIds)) : [],
      rows.length ? db.select().from(clients).where(inArray(clients.id, rows.map((row) => row.clienteId).filter(Boolean) as string[])) : [],
      proposalIds.length ? db.select().from(proposals).where(inArray(proposals.id, proposalIds)) : [],
      rows.length ? db.select().from(service_order_items).where(inArray(service_order_items.osId, rows.map((row) => row.id))) : [],
    ]);
    const vesselMap = new Map<string, any>(vesselRows.map((row: any) => [row.id, row] as [string, any]));
    const clientMap = new Map<string, any>(clientRows.map((row: any) => [row.id, row] as [string, any]));
    const proposalMap = new Map<string, any>(proposalRows.map((row: any) => [row.id, row] as [string, any]));
    res.json({ items: rows.map((row) => ({ ...serializeServiceOrder(row), propostaNumero: proposalMap.get(row.propostaId || '')?.numero, embarcacaoNome: vesselMap.get(row.embarcacaoId || '')?.nome, clienteNome: clientMap.get(row.clienteId || '')?.nome, quantidadeServicos: itemRows.filter((item) => item.osId === row.id).length })), pagination: paginationMeta(page, limit, Number(totalRows[0]?.total || 0)) });
  } catch (error) {
    if (error instanceof Error && (error.message === 'INVALID_PAGE' || error.message === 'INVALID_LIMIT')) return res.status(400).json({ error: 'Parâmetros de paginação inválidos.' });
    console.error('Erro ao carregar lista paginada de OS:', error);
    res.status(500).json({ error: 'Não foi possível carregar as Ordens de Serviço.' });
  }
});

router.post("/notifications/read-all", requireAuth, async (req: any, res: any) => {
  try {
    await db.update(notifications)
      .set({ lida: true })
      .where(and(eq(notifications.usuarioId, req.session.userId), eq(notifications.lida, false)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Não foi possível marcar as notificações como lidas" });
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
      if (data.status === "concluido" && current.status !== "em_execucao") return res.status(409).json({ error: "Inicie o serviço antes de concluí-lo." });
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
    if (allServicesCompleted(allItems)) {
      // Avançar automaticamente a OS para "documentação em elaboração" (Laudos & Revisão)
      const currentOs = (await db.select().from(service_orders).where(eq(service_orders.id, current.osId)))[0];
      if (currentOs && ["visita_agendada", "vistoria_em_execucao"].includes(currentOs.status)) {
        await db.update(service_orders).set({
          status: "documentacao_em_elaboracao",
          updatedAt: new Date(),
        }).where(eq(service_orders.id, current.osId));
        const orderDocuments = await db.select().from(documents).where(eq(documents.osId, current.osId));
        const orderDocumentIds = orderDocuments.map((document) => document.id);
        const existingVersions = orderDocumentIds.length
          ? await db.select().from(document_versions).where(inArray(document_versions.documentoId, orderDocumentIds))
          : [];
        for (const document of orderDocuments) {
          if (existingVersions.some((version) => version.documentoId === document.id)) {
            await db.update(documents).set({ status: "em_revisao", updatedAt: new Date() }).where(eq(documents.id, document.id));
          }
        }
        await logEvent(current.osId, "transicao_automatica", actor, "Todos os serviços concluídos. OS avançou automaticamente para Documentação em Elaboração.");
      }
      for (const admin of admins)
        await notify(admin.id, "os_itens_concluidos", "Serviços concluídos", "Todos os itens da OS foram concluídos. A OS avançou para Documentação em Elaboração.", current.osId, "alta");
    }
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
    const canViewEntireOrder = currentUser?.role === "admin" || currentUser?.role === "financeiro";
    const assignedDelivery = (await db.select().from(deliveries).where(eq(deliveries.osId, id))).some((delivery) => delivery.responsavelId === currentUser?.id);
    const isAssignedToOrder = allItems.some((item) => item.tecnicoResponsavelId === currentUser?.id) || os.responsavelTecnicoId === currentUser?.id || assignedDelivery;
    if (!canViewEntireOrder && !isAssignedToOrder) {
      return res.status(403).json({ error: "Você não está atribuído a esta Ordem de Serviço." });
    }
    const items = canViewEntireOrder
      ? allItems
      : allItems.filter((item) => item.tecnicoResponsavelId === currentUser?.id);
    const itemIds = items.map((item) => item.id);
    const itemComments = itemIds.length
      ? await db.select().from(service_order_item_comments).where(inArray(service_order_item_comments.itemId, itemIds)).orderBy(service_order_item_comments.createdAt)
      : [];
    const sched = await db.select().from(schedules).where(eq(schedules.osId, id));
    const docs = await db.select().from(documents).where(eq(documents.osId, id));
    const subs = await db.select().from(external_submissions).where(eq(external_submissions.osId, id));
    const canonicalProtocols = await db.select().from(protocols).where(eq(protocols.osId, id)).orderBy(desc(protocols.createdAt));
    const deliv = await db.select().from(deliveries).where(eq(deliveries.osId, id));
    const deliveryIds = deliv.map((delivery) => delivery.id);
    const [deliveryDispatchRows, finalFiles] = await Promise.all([
      deliveryIds.length ? db.select().from(delivery_dispatches).where(inArray(delivery_dispatches.deliveryId, deliveryIds)) : [],
      canonicalProtocols.length ? db.select().from(approved_document_files).where(inArray(approved_document_files.protocoloId, canonicalProtocols.map((protocol) => protocol.id))) : [],
    ]);
    const dispatchIds = deliveryDispatchRows.map((dispatch) => dispatch.id);
    const dispatchDocuments = dispatchIds.length ? await db.select().from(delivery_dispatch_documents).where(inArray(delivery_dispatch_documents.remessaEntregaId, dispatchIds)) : [];
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
      protocolos: canonicalProtocols.map(serializeProtocol),
      entregas: deliv.map((delivery) => ({ ...serializeDelivery(delivery), documentosAprovados: finalFiles, remessas: deliveryDispatchRows.filter((dispatch) => dispatch.deliveryId === delivery.id).map((dispatch) => ({ ...dispatch, arquivosAprovados: finalFiles.filter((file) => dispatchDocuments.some((link) => link.remessaEntregaId === dispatch.id && link.arquivoAprovadoId === file.id)) })) })),
      bloqueiosConclusao: await getOsReadinessBlockers(os, db),
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
    if (data.concluirVistoria) {
      try { await assertServicesCompleted(db, id); } catch (error: any) {
        if (error.message === "SERVICES_NOT_COMPLETED") return res.status(409).json({ error: "Conclua todos os serviços da OS antes de avançar para a documentação." });
        throw error;
      }
    }
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
    const serviceItems = await db.select().from(service_order_items).where(eq(service_order_items.osId, doc.osId));
    const servicesAreComplete = allServicesCompleted(serviceItems);

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

    await db.update(documents).set({ status: servicesAreComplete ? "em_revisao" : "em_elaboracao", updatedAt: new Date() }).where(eq(documents.id, id));
    if (servicesAreComplete) {
      const activeProtocol = doc.aplicavelAnaliseExterna
        ? (await db.select().from(protocols).where(eq(protocols.osId, doc.osId)).orderBy(desc(protocols.createdAt)))[0]
        : null;
      if (activeProtocol && ["exigencia_recebida", "correcao_em_elaboracao"].includes(activeProtocol.status)) {
        await db.update(protocols).set({ status: "correcao_em_elaboracao", updatedAt: new Date() }).where(eq(protocols.id, activeProtocol.id));
        await db.update(service_orders).set({ status: "exigencia_externa", updatedAt: new Date() }).where(eq(service_orders.id, doc.osId));
      } else {
        await db.update(service_orders).set({ status: "revisao_interna", updatedAt: new Date() }).where(eq(service_orders.id, doc.osId));
      }
    }

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

    res.json({ ...serializeDocumentVersion(version), aguardandoConclusaoServicos: !servicesAreComplete });
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
    try { await assertServicesCompleted(db, doc.osId); } catch (error: any) {
      if (error.message === "SERVICES_NOT_COMPLETED") return res.status(409).json({ error: "Conclua todos os serviços da OS antes de aprovar documentos." });
      throw error;
    }

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
    const activeCorrectionProtocol = doc.aplicavelAnaliseExterna
      ? (await db.select().from(protocols).where(eq(protocols.osId, doc.osId)).orderBy(desc(protocols.createdAt)))[0]
      : null;
    const nextOsStatus = activeCorrectionProtocol && ["exigencia_recebida", "correcao_em_elaboracao"].includes(activeCorrectionProtocol.status)
      ? "exigencia_externa"
      : allReadyForExternal
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
    const activeCorrectionProtocol = doc.aplicavelAnaliseExterna
      ? (await db.select().from(protocols).where(eq(protocols.osId, doc.osId)).orderBy(desc(protocols.createdAt)))[0]
      : null;
    await db.update(service_orders).set({ status: activeCorrectionProtocol && ["exigencia_recebida", "correcao_em_elaboracao"].includes(activeCorrectionProtocol.status) ? "exigencia_externa" : "aguardando_envio_externo", updatedAt: new Date() }).where(eq(service_orders.id, doc.osId));

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
  return res.status(410).json({ error: "Envios externos agora são registrados exclusivamente no módulo Protocolos & Entregas." });
  /* legacy compatibility code retained below for rollback */
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
  return res.status(410).json({ error: "Respostas externas agora são registradas exclusivamente no módulo Protocolos & Entregas, com comprovante obrigatório." });
  /* legacy compatibility code retained below for rollback */
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

// ---------- GET /api/service-orders/deliveries/mine ----------
router.get("/deliveries/mine", requirePermission([PERMISSIONS.EXECUTAR_ENTREGAS]), async (req: any, res: any) => {
  try {
    const rows = await db.select().from(deliveries).where(eq(deliveries.responsavelId, req.user.id));
    const active = rows.filter((row) => isDeliveryActionPending(row.status));
    res.json(active.map(serializeDelivery));
  } catch { res.status(500).json({ error: "Não foi possível carregar as entregas atribuídas." }); }
});

async function getAssignedDelivery(osId: string, user: any, tx: any = db) {
  const delivery = (await tx.select().from(deliveries).where(eq(deliveries.osId, osId)))[0];
  if (!delivery) throw new Error("DELIVERY_NOT_FOUND");
  if (user.role !== "admin" && delivery.responsavelId !== user.id) throw new Error("DELIVERY_NOT_ASSIGNED");
  return delivery;
}

// ---------- POST /api/service-orders/:id/delivery/start ----------
router.post("/:id/delivery/start", requirePermission([PERMISSIONS.EXECUTAR_ENTREGAS]), async (req: any, res: any) => {
  try {
    const result = await db.transaction(async (tx) => {
      const delivery = await getAssignedDelivery(req.params.id, req.user, tx);
      if (!isDeliveryActionPending(delivery.status)) throw new Error("INVALID_DELIVERY_STATE");
      const updated = (await tx.update(deliveries).set({ status: "em_entrega", iniciadaEm: delivery.iniciadaEm || new Date(), updatedAt: new Date() }).where(eq(deliveries.id, delivery.id)).returning())[0];
      await tx.insert(os_events).values({ osId: req.params.id, tipo: "entrega_iniciada", autorId: req.user.id, autorNome: req.user.nome, descricao: `${req.user.nome} iniciou a tarefa de entrega.` });
      return updated;
    });
    res.json(serializeDelivery(result));
  } catch (error: any) { res.status(error.message === "DELIVERY_NOT_ASSIGNED" ? 403 : 409).json({ error: error.message === "DELIVERY_NOT_ASSIGNED" ? "Esta entrega não está atribuída a você." : "A entrega não pode ser iniciada neste estado." }); }
});

// ---------- POST /api/service-orders/:id/delivery/dispatches ----------
router.post("/:id/delivery/dispatches", requirePermission([PERMISSIONS.EXECUTAR_ENTREGAS]), async (req: any, res: any) => {
  try {
    const data = req.body || {};
    const fileIds = Array.isArray(data.arquivosAprovadosIds) ? data.arquivosAprovadosIds : [];
    if (!["parcial", "final"].includes(data.tipo) || !data.dataEntrega || !data.meioEntrega || !data.nomeRecebedor || !data.destino || !data.comprovanteUrl || !data.comprovanteNome || !fileIds.length) return res.status(400).json({ error: "Tipo, documentos, data, meio, recebedor, destino e comprovante são obrigatórios." });
    if (data.meioEntrega === "correio" && !data.referencia) return res.status(400).json({ error: "Informe o código de rastreio para entrega por correio." });
    if (data.meioEntrega === "portal" && !data.referencia) return res.status(400).json({ error: "Informe a referência do portal." });
    const result = await db.transaction(async (tx) => {
      const delivery = await getAssignedDelivery(req.params.id, req.user, tx);
      if (!isDeliveryActionPending(delivery.status)) throw new Error("INVALID_DELIVERY_STATE");
      const allowedFiles = await tx.select().from(approved_document_files).where(inArray(approved_document_files.id, fileIds));
      const allowedDocs = allowedFiles.length ? await tx.select().from(documents).where(inArray(documents.id, allowedFiles.map((file) => file.documentoId))) : [];
      if (allowedFiles.length !== fileIds.length || allowedDocs.some((doc) => doc.osId !== req.params.id)) throw new Error("INVALID_FINAL_FILE");
      const dispatch = (await tx.insert(delivery_dispatches).values({ deliveryId: delivery.id, tipo: data.tipo, status: "entregue", dataEntrega: data.dataEntrega, meioEntrega: data.meioEntrega, nomeRecebedor: data.nomeRecebedor, destino: data.destino, referencia: data.referencia || null, comprovanteUrl: data.comprovanteUrl, comprovanteNome: data.comprovanteNome, entreguePorId: req.user.id, entreguePorNome: req.user.nome }).returning())[0];
      await tx.insert(delivery_dispatch_documents).values(fileIds.map((arquivoAprovadoId: string) => ({ remessaEntregaId: dispatch.id, arquivoAprovadoId })));
      const nextStatus = data.tipo === "final" ? "pronta_validacao" : "aguardando_reativacao";
      await tx.update(deliveries).set({ status: nextStatus, dataEntrega: data.dataEntrega, meioEntrega: data.meioEntrega, nomeRecebedor: data.nomeRecebedor, comprovanteUrl: data.comprovanteUrl, comprovanteNome: data.comprovanteNome, entreguePorId: req.user.id, concluidaEm: new Date(), updatedAt: new Date() }).where(eq(deliveries.id, delivery.id));
      await tx.update(notifications).set({ lida: true }).where(and(
        eq(notifications.usuarioId, delivery.responsavelId || req.user.id),
        eq(notifications.osId, req.params.id),
        eq(notifications.tipo, "entrega_atribuida"),
        eq(notifications.lida, false),
      ));
      await tx.insert(os_events).values({ osId: req.params.id, tipo: "remessa_entrega", autorId: req.user.id, autorNome: req.user.nome, descricao: `Entrega ${data.tipo} registrada por ${data.meioEntrega} para ${data.nomeRecebedor}.`, dados: { remessaId: dispatch.id, tipo: data.tipo } });
      await reconcileOsReadiness(req.params.id, tx, req.user);
      return dispatch;
    });
    res.status(201).json(result);
  } catch (error: any) {
    const code = ["DELIVERY_NOT_ASSIGNED"].includes(error.message) ? 403 : ["INVALID_FINAL_FILE"].includes(error.message) ? 400 : 409;
    res.status(code).json({ error: error.message === "DELIVERY_NOT_ASSIGNED" ? "Esta entrega não está atribuída a você." : error.message === "INVALID_FINAL_FILE" ? "Selecione somente documentos finais aprovados desta OS." : "A remessa não pode ser registrada neste estado." });
  }
});

// ---------- POST /api/service-orders/:id/final-review ----------
router.post("/:id/final-review", requireRole(["admin"]), async (req: any, res: any) => {
  try {
    const decision = req.body?.decisao;
    if (!["aprovar", "devolver"].includes(decision)) return res.status(400).json({ error: "Decisão de validação inválida." });
    if (decision === "devolver") return res.status(409).json({ error: "Para reabrir uma entrega, anexe um documento final suplementar na aba Protocolos." });
    if (decision === "devolver" && !String(req.body?.observacao || "").trim()) return res.status(400).json({ error: "Informe o motivo da devolução para o entregador." });
    const result = await db.transaction(async (tx) => {
      const order = (await tx.select().from(service_orders).where(eq(service_orders.id, req.params.id)))[0];
      if (!order) throw new Error("OS_NOT_FOUND");
      if (decision === "aprovar") {
        try { await assertServicesCompleted(tx, order.id); } catch (error: any) {
          if (error.message === "SERVICES_NOT_COMPLETED") throw new Error("NOT_READY_SERVICES");
          throw error;
        }
        const blockers = await getOsReadinessBlockers(order, tx);
        if (order.status !== "validacao_final" || blockers.length) throw new Error("NOT_READY");
        await tx.update(service_orders).set({ status: "concluida", dataConclusao: new Date().toISOString().slice(0, 10), updatedAt: new Date() }).where(eq(service_orders.id, order.id));
        await tx.update(deliveries).set({ status: "concluida", updatedAt: new Date() }).where(eq(deliveries.osId, order.id));
        await tx.insert(os_finalization_reviews).values({ osId: order.id, decisao: "aprovada", observacao: req.body?.observacao || null, administradorId: req.user.id, administradorNome: req.user.nome });
        await tx.insert(os_events).values({ osId: order.id, tipo: "conclusao", autorId: req.user.id, autorNome: req.user.nome, descricao: "Validação Final aprovada. Ordem de Serviço concluída." });
        await reconcileVesselCompletion(order.embarcacaoId, tx);
        return "concluida";
      }
      const delivery = (await tx.select().from(deliveries).where(eq(deliveries.osId, order.id)))[0];
      if (delivery) await tx.update(deliveries).set({ status: "aguardando_complemento", motivoReabertura: req.body.observacao, concluidaEm: null, updatedAt: new Date() }).where(eq(deliveries.id, delivery.id));
      await tx.update(service_orders).set({ status: "aguardando_entrega", updatedAt: new Date() }).where(eq(service_orders.id, order.id));
      await tx.insert(os_finalization_reviews).values({ osId: order.id, decisao: "devolvida", observacao: req.body.observacao, administradorId: req.user.id, administradorNome: req.user.nome });
      await tx.insert(os_events).values({ osId: order.id, tipo: "validacao_devolvida", autorId: req.user.id, autorNome: req.user.nome, descricao: `Validação Final devolvida para entrega: ${req.body.observacao}` });
      return "aguardando_entrega";
    });
    res.json({ status: result });
  } catch (error: any) { res.status(["NOT_READY", "NOT_READY_SERVICES"].includes(error.message) ? 409 : 404).json({ error: error.message === "NOT_READY_SERVICES" ? "Conclua todos os serviços da OS antes da Validação Final." : error.message === "NOT_READY" ? "A OS ainda possui pendências para a Validação Final." : "OS não encontrada." }); }
});

// ---------- POST /api/service-orders/:id/deliver ----------
router.post("/:id/deliver", requirePermission([PERMISSIONS.ENTREGAR_CONCLUIR]), async (req: any, res: any) => {
  try {
    return res.status(410).json({ error: "Este registro antigo foi desativado. Use as remessas de entrega da etapa 5." });
    const { id } = req.params;
    const data = req.body || {};
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });

    if (!data.dataEntrega || !data.meioEntrega || !data.nomeRecebedor || !data.comprovanteUrl || !data.comprovanteNome) {
      return res.status(400).json({ error: "Data, meio de entrega, recebedor e comprovante são obrigatórios" });
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
router.post("/:id/complete", requireRole(["admin"]), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });

    if (osList[0].status !== "validacao_final") return res.status(409).json({ error: "A OS precisa passar pela etapa Validação Final antes da conclusão." });
    const blockers = await getOsReadinessBlockers(osList[0], db);
    if (blockers.length) return res.status(409).json({ error: "A OS possui pendências e não pode ser concluída.", bloqueios: blockers });

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
