import { Router } from "express";
import { db } from "../../db/index.js";
import { service_orders, documents, deliveries, service_order_items, schedules, os_events, external_submissions, external_responses, document_versions, proposals, vessels, users, notifications, proposal_acceptances, accounts_receivable, tasks } from "../../db/schema.js";
import { eq, and, desc, sql, inArray, isNull, gt, lt, or } from "drizzle-orm";
import { requireAuth, requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";
import { serializeServiceOrder, serializeSchedule, serializeDocument, serializeDocumentVersion, serializeExternalSubmission, serializeExternalResponse, serializeDelivery, serializeOsEvent, serializeNotification, serializeProposal } from "../serializers.js";

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
    const all = await db.select().from(service_orders).orderBy(desc(service_orders.createdAt));
    res.json(all.map(serializeServiceOrder));
  } catch (error) {
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
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- GET /api/service-orders/admin-dashboard (central notifications & pending items) ----------
router.get("/admin-dashboard", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.session.userId;
    const now = new Date();
    
    // 1. Notificações não lidas do admin
    const unreadNotifications = await db.select().from(notifications)
      .where(and(eq(notifications.usuarioId, userId), eq(notifications.lida, false)))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
    
    // 2. Propostas aguardando aceite (status = enviado)
    const proposalsPendingAcceptance = await db.select().from(proposals)
      .where(eq(proposals.status, "enviado"))
      .orderBy(desc(proposals.createdAt));
    
    // 3. OS com serviço concluído esperando revisão (status = aguardando_entrega ou documentos em revisão)
    const allOS = await db.select().from(service_orders).orderBy(desc(service_orders.createdAt));
    const allDocs = await db.select().from(documents);
    const osConcluidasEsperandoRevisao: any[] = [];
    const osComDocumentosParaRevisar: any[] = [];
    
    for (const os of allOS) {
      const osDocs = allDocs.filter((d) => d.osId === os.id);
      if (os.status === "aguardando_entrega") {
        osConcluidasEsperandoRevisao.push(serializeServiceOrder(os));
      }
      if (osDocs.some((d) => d.status === "em_revisao")) {
        osComDocumentosParaRevisar.push(serializeServiceOrder(os));
      }
    }
    
    // 4. Vencimentos próximos (tarefas com prazo vencendo em 7 dias)
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const tasksWithApproachingDeadlines = await db.select().from(tasks)
      .where(and(
        tasks.prazoVencimento,
        gt(tasks.prazoVencimento, now.toISOString().split('T')[0]),
        lt(tasks.prazoVencimento, sevenDaysFromNow.toISOString().split('T')[0])
      ))
      .orderBy(desc(tasks.prazoVencimento));
    
    // 5. Documentos anexados recentemente (últimas 48h) para revisão
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const recentDocuments = await db.select().from(document_versions)
      .where(gt(document_versions.createdAt, twoDaysAgo))
      .orderBy(desc(document_versions.createdAt))
      .limit(10);
    
    // 6. Contagens de pendências críticas por tipo
    const pendingCounts = {
      propostasAguardandoAceite: proposalsPendingAcceptance.length,
      osAguardandoRevisao: osConcluidasEsperandoRevisao.length,
      documentosEmRevisao: osComDocumentosParaRevisar.length,
      vencimentosProximos: tasksWithApproachingDeadlines.length,
      notificacoesNaoLidas: unreadNotifications.length,
    };
    
    res.json({
      notificacoesNaoLidas: unreadNotifications.map(serializeNotification),
      propostasAguardandoAceite: proposalsPendingAcceptance.map(serializeProposal),
      osConcluidasEsperandoRevisao,
      osComDocumentosParaRevisar,
      vencimentosProximos: tasksWithApproachingDeadlines,
      documentosRecentes: recentDocuments.map(serializeDocumentVersion),
      pendingCounts,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    res.status(500).json({ error: "Não foi possível carregar o painel do admin" });
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

// ---------- GET /api/service-orders/:id (detail with relations) ----------
router.get("/:id", requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const osList = await db.select().from(service_orders).where(eq(service_orders.id, id));
    if (osList.length === 0) return res.status(404).json({ error: "OS não encontrada" });
    const os = osList[0];

    const items = await db.select().from(service_order_items).where(eq(service_order_items.osId, id));
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
      itens: items,
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
      proposta: proposal,
      embarcacao: vessel,
      tecnicoResponsavel: tecnico ? { id: tecnico.id, nome: tecnico.nome, email: tecnico.email } : null,
    });
  } catch (error) {
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
    await db.update(service_orders).set({ status: newStatus, updatedAt: new Date() }).where(eq(service_orders.id, id));

    await logEvent(id, "agendamento", req.user,
      hasFullSchedule
        ? `Agendamento da visita marcado para ${schedule.data} às ${schedule.horario || "a definir"}.`
        : "Agendamento salvo como pendente.");

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
      responsavelTecnicoId: req.user.id,
      updatedAt: new Date(),
    }).where(eq(service_orders.id, id));

    const isConcluding = data.concluirVistoria && prevStatus !== "vistoria_em_execucao";
    
    await logEvent(id, "vistoria", req.user,
      isConcluding
        ? "Vistoria executada. Iniciando elaboração da documentação."
        : "Vistoria iniciada/em execução.",
      { observacoes: data.observacoes || "" });

    // Notificar Deisy (admin/comercial) quando vistoria for iniciada ou concluída
    const deisyUsers = await db.select().from(users).where(sql`${users.role} IN ('admin', 'comercial')`);
    for (const u of deisyUsers) {
      await notify(
        u.id,
        isConcluding ? "vistoria_conclusao" : "vistoria_inicio",
        isConcluding ? "✅ Vistoria Concluída" : "🔧 Vistoria em Execução",
        isConcluding
          ? `Osvaldo concluiu a vistoria da embarcação ${vessel?.nome || "não identificada"}. Documentação em elaboração.`
          : `Osvaldo iniciou a vistoria da embarcação ${vessel?.nome || "não identificada"}.`,
        id,
        "alta" // prioridade alta para vistoria
      );
    }

    // Se estiver concluindo a vistoria, criar documentos pendentes automaticamente
    if (isConcluding && proposal) {
      const itens = await db.select().from(service_order_items).where(eq(service_order_items.osId, id));
      for (const item of itens) {
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

    // Notificar Deisy sobre novo documento anexado
    const deisyUsers = await db.select().from(users).where(sql`${users.role} IN ('admin', 'comercial')`);
    for (const u of deisyUsers) {
      await notify(
        u.id,
        "documento_anexado",
        "📄 Novo Documento Anexado",
        `Osvaldo anexou a versão V${nextVersion} do documento "${doc.titulo}". Verifique se está OK.`,
        doc.osId,
        "alta" // prioridade alta para documento anexado
      );
    }

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
    if (latest) {
      await db.update(document_versions).set({ situacaoRevisao: "revisado", updatedAt: new Date() }).where(eq(document_versions.id, latest.id));
    }

    const isOk = data.aprovado !== false;
    await db.update(documents).set({ status: isOk ? "aguardando_envio" : "em_elaboracao", updatedAt: new Date() }).where(eq(documents.id, id));
    await db.update(service_orders).set({ status: isOk ? "aguardando_envio_externo" : "documentacao_em_elaboracao", updatedAt: new Date() }).where(eq(service_orders.id, doc.osId));

    await logEvent(doc.osId, "revisao", req.user,
      isOk ? `Revisão interna do documento "${doc.titulo}" concluída.` : `Revisão do documento "${doc.titulo}" apontou correções.`,
      { documentoId: id });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
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
      // Notificar Osvaldo e Deisy sobre documento aprovado externamente
      const osvaldoUsers = await db.select().from(users).where(sql`${users.role} IN ('admin', 'tecnico')`);
      for (const u of osvaldoUsers) {
        await notify(
          u.id,
          "documento_aprovado_externo",
          "✅ Documento Aprovado Externamente",
          `Documento da OS foi aprovado pela empresa externa. Lucas deve imprimir e entregar.`,
          id,
          "alta"
        );
      }
    } else {
      if (sub?.documentoId) {
        await db.update(documents).set({ status: "exigencia", updatedAt: new Date() }).where(eq(documents.id, sub.documentoId!));
      }
      await db.update(service_orders).set({ status: "exigencia_externa", updatedAt: new Date() }).where(eq(service_orders.id, id));
      await logEvent(id, "exigencia", req.user,
        `Exigência externa registrada: ${data.motivo || "sem motivo"}. Nova versão necessária.`,
        { submissaoId: data.submissaoId });
      const editors = await db.select().from(users).where(sql`${users.permissions}::jsonb ? ${PERMISSIONS.ANEXAR_EDITAR_VERSOES}`);
      for (const e of editors) {
        await notify(e.id, "exigencia", "Exigência externa", `Exigência registrada na OS. Nova versão necessária.`, id);
      }
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

    // Notificar Osvaldo e Deisy sobre impressão confirmada
    const osvaldoUsers = await db.select().from(users).where(sql`${users.role} IN ('admin', 'tecnico')`);
    for (const u of osvaldoUsers) {
      await notify(
        u.id,
        "impressao_confirmada",
        "🖨️ Impressão Confirmada",
        `Lucas confirmou que os documentos da OS foram impressos e estão em andamento para entrega.`,
        id,
        "normal"
      );
    }

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

    // Notificar Osvaldo e Deisy sobre entrega confirmada
    const osvaldoUsers = await db.select().from(users).where(sql`${users.role} IN ('admin', 'tecnico')`);
    for (const u of osvaldoUsers) {
      await notify(
        u.id,
        "entrega_confirmada",
        "✅ Entrega Confirmada",
        `Lucas confirmou a entrega dos documentos da OS.`,
        id,
        "normal"
      );
    }

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

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
