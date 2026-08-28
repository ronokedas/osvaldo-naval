import { Router } from "express";
import { db } from "../../db/index.js";
import {
  protocols, protocol_dispatches, protocol_dispatch_documents, protocol_responses,
  protocol_response_documents, protocol_attachments, protocol_events,
  service_orders, documents, document_versions, deliveries, approved_document_files, users, notifications, os_events, vessels, clients,
} from "../../db/schema.js";
import { and, desc, eq, inArray, sql, ilike, count } from "drizzle-orm";
import { requireAuth, requirePermission, requireRole } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";
import { serializeProtocol } from "../serializers.js";
import { awaitingExternalLabel, deriveProtocolStatus, EXTERNAL_RESPONSE_TYPES, isValidProtocolAttachment } from "../protocol-workflow.js";
import { assertServicesCompleted, reconcileOsReadiness } from "../delivery-workflow.js";
import { sendEmail } from "../mailer.js";
import { paginationMeta, parsePagination } from "../pagination.js";

const router = Router();
const requireProtocolPermission = requirePermission([PERMISSIONS.REGISTRAR_ENVIO_RESPOSTA_EXTERNA]);
const EXTERNAL_TYPES = new Set(["capitania_dpc", "certificadora"]);
const today = () => new Date().toISOString().split("T")[0];

async function resolveProtocolRecipient(protocol: any) {
  const vessel = protocol.embarcacaoId
    ? (await db.select().from(vessels).where(eq(vessels.id, protocol.embarcacaoId)))[0]
    : null;
  const client = vessel?.clienteId
    ? (await db.select().from(clients).where(eq(clients.id, vessel.clienteId)))[0]
    : null;
  return String(client?.email || vessel?.emailContato || "").trim();
}

async function nextProtocolNumber(tx: any) {
  const year = new Date().getFullYear();
  const suffix = String(year).slice(-2);
  await tx.execute(sql`SELECT pg_advisory_xact_lock(${year * 1000 + 847})`);
  const rows = await tx.select({ numero: protocols.numeroProtocolo }).from(protocols);
  const max = rows.reduce((value: number, row: any) => {
    const match = String(row.numero || "").match(new RegExp(`^PROT-(\\d+)/${suffix}$`));
    return match ? Math.max(value, Number(match[1])) : value;
  }, 82);
  return `PROT-${String(max + 1).padStart(3, "0")}/${suffix}`;
}

async function hydrateProtocols(rows: any[]) {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const [dispatches, responses, attachments, events, finalFiles, deliveryRows] = await Promise.all([
    db.select().from(protocol_dispatches).where(inArray(protocol_dispatches.protocoloId, ids)).orderBy(protocol_dispatches.ciclo),
    db.select().from(protocol_responses).where(inArray(protocol_responses.protocoloId, ids)).orderBy(protocol_responses.createdAt),
    db.select().from(protocol_attachments).where(inArray(protocol_attachments.protocoloId, ids)).orderBy(protocol_attachments.createdAt),
    db.select().from(protocol_events).where(inArray(protocol_events.protocoloId, ids)).orderBy(protocol_events.createdAt),
    db.select().from(approved_document_files).where(inArray(approved_document_files.protocoloId, ids)).orderBy(approved_document_files.createdAt),
    rows.some((row) => row.osId)
      ? db.select().from(deliveries).where(inArray(deliveries.osId, rows.map((row) => row.osId).filter(Boolean)))
      : [],
  ]);
  const dispatchIds = dispatches.map((item) => item.id);
  const responseIds = responses.map((item) => item.id);
  const [dispatchDocuments, responseDocuments] = await Promise.all([
    dispatchIds.length ? db.select().from(protocol_dispatch_documents).where(inArray(protocol_dispatch_documents.remessaId, dispatchIds)) : [],
    responseIds.length ? db.select().from(protocol_response_documents).where(inArray(protocol_response_documents.respostaId, responseIds)) : [],
  ]);
  return rows.map((row) => {
    const rowDispatches = dispatches.filter((item) => item.protocoloId === row.id).map((dispatch) => ({
      ...dispatch,
      documentos: dispatchDocuments.filter((item) => item.remessaId === dispatch.id),
      respostas: responses.filter((response) => response.remessaId === dispatch.id).map((response) => ({
        ...response,
        documentos: responseDocuments.filter((item) => item.respostaId === response.id),
        anexos: attachments.filter((item) => item.respostaId === response.id),
      })),
    }));
    const latestDocuments = new Map<string, any>();
    rowDispatches.forEach((dispatch) => dispatch.documentos.forEach((item: any) => latestDocuments.set(item.documentoId, item)));
    return serializeProtocol({
      ...row, remessas: rowDispatches,
      anexos: attachments.filter((item) => item.protocoloId === row.id),
      arquivosFinais: finalFiles.filter((item) => item.protocoloId === row.id),
      entregaStatus: deliveryRows.find((item) => item.osId === row.osId)?.status || null,
      eventos: events.filter((item) => item.protocoloId === row.id),
      documentosIncluidos: latestDocuments.size ? [...latestDocuments.values()].map((item) => `${item.tituloDocumento} (V${item.versao})`) : row.documentosIncluidos || [],
    });
  });
}

async function ensureDeliveryTask(tx: any, protocol: any, actor: any) {
  if (!protocol.osId) return null;
  const [order, osDocs, osProtocols] = await Promise.all([
    tx.select().from(service_orders).where(eq(service_orders.id, protocol.osId)).then((rows: any[]) => rows[0]),
    tx.select().from(documents).where(eq(documents.osId, protocol.osId)),
    tx.select().from(protocols).where(eq(protocols.osId, protocol.osId)),
  ]);
  const required = osDocs.filter((doc: any) => doc.aplicavelAnaliseExterna);
  if (!order || !required.length || required.some((doc: any) => doc.status !== "aprovado")) return null;
  const finalFiles = await tx.select().from(approved_document_files).where(inArray(approved_document_files.protocoloId, osProtocols.map((item: any) => item.id)));
  if (required.some((doc: any) => !finalFiles.some((file: any) => file.documentoId === doc.id))) return null;
  const existing = (await tx.select().from(deliveries).where(eq(deliveries.osId, protocol.osId)))[0];
  if (existing) return existing;
  const eligibleUsers = (await tx.select().from(users).where(eq(users.ativo, true))).filter((user: any) => Array.isArray(user.permissions) && user.permissions.includes(PERMISSIONS.EXECUTAR_ENTREGAS));
  const assignee = eligibleUsers.length === 1 ? eligibleUsers[0] : null;
  const delivery = (await tx.insert(deliveries).values({ osId: protocol.osId, status: "pendente", responsavelId: assignee?.id || null }).returning())[0];
  await tx.update(service_orders).set({ status: "aguardando_entrega", updatedAt: new Date() }).where(eq(service_orders.id, protocol.osId));
  await tx.insert(os_events).values({ osId: protocol.osId, tipo: "tarefa_entrega", autorId: actor?.id, autorNome: actor?.nome || "Sistema", descricao: assignee ? `Tarefa de entrega criada e atribuída a ${assignee.nome}.` : "Tarefa de entrega criada, aguardando atribuição de um entregador." });
  if (assignee) await tx.insert(notifications).values({ usuarioId: assignee.id, tipo: "entrega_atribuida", titulo: "Nova entrega atribuída", mensagem: `Os documentos finais da OS ${order.numero} estão prontos para entrega.`, osId: protocol.osId, prioridade: "alta" });
  return delivery;
}

router.get("/list", requireAuth, async (req: any, res: any) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const conditions: any[] = [];
    if (req.query.status && req.query.status !== 'todos') conditions.push(eq(protocols.status, String(req.query.status)));
    if (req.query.tipo && req.query.tipo !== 'todos') conditions.push(eq(protocols.tipoProtocolo, String(req.query.tipo)));
    const q = String(req.query.q || '').trim();
    if (q) conditions.push(ilike(protocols.numeroProtocolo, `%${q}%`));
    const where = conditions.length ? and(...conditions) : undefined;
    const [rows, totalRows] = await Promise.all([
      db.select().from(protocols).where(where).orderBy(desc(protocols.createdAt), desc(protocols.id)).limit(limit).offset(offset),
      db.select({ total: count() }).from(protocols).where(where),
    ]);
    res.json({ items: await hydrateProtocols(rows), pagination: paginationMeta(page, limit, Number(totalRows[0]?.total || 0)) });
  } catch (error) {
    if (error instanceof Error && (error.message === 'INVALID_PAGE' || error.message === 'INVALID_LIMIT')) return res.status(400).json({ error: 'Parâmetros de paginação inválidos.' });
    console.error(error);
    res.status(500).json({ error: 'Não foi possível carregar os protocolos.' });
  }
});

router.get("/", requireAuth, async (req: any, res: any) => {
  try {
    const conditions: any[] = [];
    if (req.query.osId) conditions.push(eq(protocols.osId, String(req.query.osId)));
    if (req.query.status) conditions.push(eq(protocols.status, String(req.query.status)));
    if (req.query.tipo) conditions.push(eq(protocols.tipoProtocolo, String(req.query.tipo)));
    const rows = conditions.length
      ? await db.select().from(protocols).where(and(...conditions)).orderBy(desc(protocols.createdAt))
      : await db.select().from(protocols).orderBy(desc(protocols.createdAt));
    res.json(await hydrateProtocols(rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível carregar os protocolos" });
  }
});

router.get("/:id/email-recipient", requireAuth, async (req, res) => {
  const protocol = (await db.select().from(protocols).where(eq(protocols.id, req.params.id)))[0];
  if (!protocol) return res.status(404).json({ error: "Protocolo não encontrado." });
  const email = await resolveProtocolRecipient(protocol);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) {
    return res.status(422).json({ error: "O cliente proprietário da embarcação não possui um e-mail válido cadastrado." });
  }
  res.json({ email });
});

router.get("/:id", requireAuth, async (req, res) => {
  const rows = await db.select().from(protocols).where(eq(protocols.id, req.params.id));
  if (!rows.length) return res.status(404).json({ error: "Protocolo não encontrado" });
  res.json((await hydrateProtocols(rows))[0]);
});

router.post("/:id/send-email", requireProtocolPermission, async (req: any, res: any) => {
  try {
    const protocol = (await db.select().from(protocols).where(eq(protocols.id, req.params.id)))[0];
    if (!protocol) return res.status(404).json({ error: "Protocolo não encontrado." });
    const { destinatarioEmail, assunto, mensagem, pdfBase64, filename } = req.body || {};
    const recipientEmail = String(destinatarioEmail || await resolveProtocolRecipient(protocol)).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(recipientEmail)) return res.status(422).json({ error: "O cliente proprietário da embarcação não possui um e-mail válido cadastrado." });
    const encoded = String(pdfBase64 || "");
    const base64Data = encoded.includes("base64,") ? encoded.split("base64,")[1] : encoded;
    if (!base64Data) return res.status(400).json({ error: "O PDF do termo é obrigatório." });
    const result = await sendEmail({
      to: recipientEmail,
      subject: String(assunto || `Termo de Protocolo ${protocol.numeroProtocolo}`),
      text: String(mensagem || `Segue o Termo de Protocolo ${protocol.numeroProtocolo} da Nautilus Projetos Navais.`),
      attachments: [{ filename: String(filename || `Protocolo_${protocol.numeroProtocolo.replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`), content: Buffer.from(base64Data, "base64"), contentType: "application/pdf" }],
    });
    await db.insert(protocol_events).values({ protocoloId: protocol.id, tipo: result.ok ? "termo_enviado_email" : "falha_envio_termo_email", descricao: result.ok ? `Termo enviado por e-mail para ${recipientEmail}.` : `Falha ao enviar termo por e-mail: ${result.error || "erro desconhecido"}.`, autorId: req.user?.id, autorNome: req.user?.nome });
    if (!result.ok) return res.status(502).json({ error: result.error || "Não foi possível enviar o e-mail." });
    res.json({ ok: true });
  } catch (error) {
    console.error("Erro ao enviar termo por e-mail:", error);
    res.status(500).json({ error: "Não foi possível enviar o termo por e-mail." });
  }
});

router.post("/", requireProtocolPermission, async (req: any, res: any) => {
  try {
    const data = req.body || {};
    const isExternal = EXTERNAL_TYPES.has(data.tipoProtocolo);
    const selections = Array.isArray(data.documentos) ? data.documentos : [];
    if (isExternal && !data.osId) return res.status(400).json({ error: "Selecione uma Ordem de Serviço para a análise externa." });
    if (isExternal && !selections.length) return res.status(400).json({ error: "Selecione ao menos um documento aprovado internamente." });
    const created = await db.transaction(async (tx) => {
      let order: any;
      const selected: Array<{ doc: any; version: any }> = [];
      if (isExternal) {
        order = (await tx.select().from(service_orders).where(eq(service_orders.id, data.osId)))[0];
        if (!order) throw new Error("OS_NOT_FOUND");
        await assertServicesCompleted(tx, order.id);
        for (const selection of selections) {
          const doc = (await tx.select().from(documents).where(and(eq(documents.id, selection.documentoId), eq(documents.osId, order.id))))[0];
          if (!doc) throw new Error("INVALID_DOCUMENT");
          const version = (await tx.select().from(document_versions).where(and(eq(document_versions.documentoId, doc.id), eq(document_versions.versao, Number(selection.versao)))))[0];
          if (!version || version.situacaoAprovacao !== "aprovado" || version.situacaoRevisao !== "revisado") throw new Error("DOCUMENT_NOT_APPROVED");
          selected.push({ doc, version });
        }
      }
      const number = await nextProtocolNumber(tx);
      const status = "rascunho";
      const protocol = (await tx.insert(protocols).values({
        numeroProtocolo: number, dataEnvio: data.dataEnvio || today(), embarcacaoId: data.embarcacaoId || order?.embarcacaoId || null,
        embarcacaoNome: data.embarcacaoNome, clienteNome: data.clienteNome, destinatario: data.destinatario,
        orgaoOuEmpresa: data.orgaoOuEmpresa, tipoProtocolo: data.tipoProtocolo || "outros", responsavelEnvioNome: req.user?.nome || "Sistema",
        status, codigoRastreio: data.codigoRastreio || null, documentosIncluidos: selected.map(({ doc, version }) => `${doc.titulo} (V${version.versao})`),
        observacoes: data.observacoes, osId: data.osId || null, canal: data.canal || "portal", cicloAtual: 0, requerConciliacao: false,
      }).returning())[0];
      if (isExternal) {
        const dispatch = (await tx.insert(protocol_dispatches).values({ protocoloId: protocol.id, ciclo: 0, tipo: "inicial", dataEnvio: data.dataEnvio || today(), referenciaExterna: data.codigoRastreio || null, canal: data.canal || "portal", destinatario: data.destinatario, observacao: data.observacoes, enviadoPorId: req.user?.id, enviadoPorNome: req.user?.nome }).returning())[0];
        for (const { doc, version } of selected) {
          await tx.insert(protocol_dispatch_documents).values({ remessaId: dispatch.id, documentoId: doc.id, versaoId: version.id, versao: version.versao, tituloDocumento: doc.titulo, resultado: "aguardando_analise" });
        }
      }
      await tx.insert(protocol_events).values({ protocoloId: protocol.id, tipo: "rascunho", descricao: "Pacote preparado; aguardando envio comprovado.", autorId: req.user?.id, autorNome: req.user?.nome });
      return protocol;
    });
    res.status(201).json((await hydrateProtocols([created]))[0]);
  } catch (error: any) {
    const messages: Record<string, string> = { OS_NOT_FOUND: "Ordem de Serviço não encontrada.", INVALID_DOCUMENT: "Um documento não pertence à OS selecionada.", DOCUMENT_NOT_APPROVED: "Todos os documentos devem estar revisados e aprovados tecnicamente na versão selecionada.", SERVICES_NOT_COMPLETED: "Conclua todos os serviços da OS antes de preparar o envio externo." };
    console.error(error);
    res.status(messages[error?.message] ? 400 : 500).json({ error: messages[error?.message] || "Não foi possível gerar o protocolo" });
  }
});

router.post("/:id/confirm-dispatch", requireProtocolPermission, async (req: any, res: any) => {
  try {
    const data = req.body || {};
    if (!['portal','presencial','correio'].includes(data.canal)) return res.status(400).json({ error: 'Canal de confirmação inválido.' });
    if (!data.comprovanteUrl || !data.comprovanteNome) return res.status(400).json({ error: 'Anexe o comprovante do envio antes de avançar a OS.' });
    if (data.canal === 'correio' && !data.referenciaExterna) return res.status(400).json({ error: 'Informe o código de rastreio.' });
    await db.transaction(async (tx) => {
      const protocol = (await tx.select().from(protocols).where(eq(protocols.id, req.params.id)))[0];
      if (!protocol?.osId || protocol.status !== 'rascunho') throw new Error('INVALID_STATE');
      await assertServicesCompleted(tx, protocol.osId);
      const dispatch = (await tx.select().from(protocol_dispatches).where(and(eq(protocol_dispatches.protocoloId, protocol.id), eq(protocol_dispatches.ciclo, protocol.cicloAtual))))[0];
      if (!dispatch) throw new Error('DISPATCH_NOT_FOUND');
      await tx.update(protocol_dispatches).set({ situacao: 'enviado_comprovado', canal: data.canal, referenciaExterna: data.referenciaExterna || dispatch.referenciaExterna, comprovanteUrl: data.comprovanteUrl, comprovanteNome: data.comprovanteNome, enviadoEm: new Date() }).where(eq(protocol_dispatches.id, dispatch.id));
      await tx.update(protocols).set({ status: 'aguardando_analise', canal: data.canal, updatedAt: new Date() }).where(eq(protocols.id, protocol.id));
      await tx.update(service_orders).set({ status: 'em_analise_externa', updatedAt: new Date() }).where(eq(service_orders.id, protocol.osId));
      const docs = await tx.select().from(protocol_dispatch_documents).where(eq(protocol_dispatch_documents.remessaId, dispatch.id));
      for (const item of docs) await tx.update(documents).set({ status: 'em_analise_externa', aplicavelAnaliseExterna: true, updatedAt: new Date() }).where(eq(documents.id, item.documentoId));
      await tx.insert(protocol_events).values({ protocoloId: protocol.id, tipo: 'envio_comprovado', descricao: `Envio por ${data.canal} comprovado; aguardando análise externa.`, autorId: req.user?.id, autorNome: req.user?.nome });
    });
    res.json({ ok: true });
  } catch (error: any) { res.status(['INVALID_STATE', 'SERVICES_NOT_COMPLETED'].includes(error.message) ? 409 : 500).json({ error: error.message === 'SERVICES_NOT_COMPLETED' ? 'Conclua todos os serviços da OS antes de confirmar o envio.' : error.message === 'INVALID_STATE' ? 'O protocolo não está pronto para confirmação.' : 'Não foi possível confirmar o envio.' }); }
});

router.post("/:id/responses", requireProtocolPermission, async (req: any, res: any) => {
  try {
    const data = req.body || {};
    if (!EXTERNAL_RESPONSE_TYPES.has(data.tipo)) return res.status(400).json({ error: "Resultado externo inválido." });
    if (!Array.isArray(data.anexos) || !data.anexos.length || data.anexos.some((item: any) => !isValidProtocolAttachment(item))) return res.status(400).json({ error: "Anexe ao menos um comprovante válido da resposta externa." });
    if (!Array.isArray(data.documentosIds) || !data.documentosIds.length) return res.status(400).json({ error: "Selecione os documentos afetados pela resposta." });
    await db.transaction(async (tx) => {
      const protocol = (await tx.select().from(protocols).where(eq(protocols.id, req.params.id)))[0];
      if (!protocol || !protocol.osId) throw new Error("PROTOCOL_NOT_FOUND");
      if (!["aguardando_analise", "correcao_enviada"].includes(protocol.status)) throw new Error("INVALID_STATE");
      await assertServicesCompleted(tx, protocol.osId);
      const dispatch = (await tx.select().from(protocol_dispatches).where(and(eq(protocol_dispatches.protocoloId, protocol.id), eq(protocol_dispatches.ciclo, protocol.cicloAtual))))[0];
      if (!dispatch) throw new Error("DISPATCH_NOT_FOUND");
      const dispatchDocs = await tx.select().from(protocol_dispatch_documents).where(eq(protocol_dispatch_documents.remessaId, dispatch.id));
      const selected = dispatchDocs.filter((item) => data.documentosIds.includes(item.documentoId));
      if (selected.length !== data.documentosIds.length) throw new Error("INVALID_DOCUMENT");
      const response = (await tx.insert(protocol_responses).values({ protocoloId: protocol.id, remessaId: dispatch.id, tipo: data.tipo, data: data.data || today(), motivo: data.motivo, registradoPorId: req.user?.id, registradoPorNome: req.user?.nome }).returning())[0];
      for (const item of selected) {
        await tx.insert(protocol_response_documents).values({ respostaId: response.id, documentoId: item.documentoId, resultado: data.tipo, observacao: data.motivo });
        await tx.update(protocol_dispatch_documents).set({ resultado: data.tipo, updatedAt: new Date() }).where(eq(protocol_dispatch_documents.id, item.id));
        await tx.update(documents).set({ status: data.tipo === "exigencia" ? "exigencia" : "aprovado", updatedAt: new Date() }).where(eq(documents.id, item.documentoId));
      }
      for (const attachment of data.anexos) await tx.insert(protocol_attachments).values({ protocoloId: protocol.id, respostaId: response.id, tipo: "resposta_externa", arquivoUrl: attachment.arquivoUrl, arquivoNome: attachment.arquivoNome, tipoMime: attachment.tipoMime, tamanho: Number(attachment.tamanho) || 0, enviadoPorId: req.user?.id, enviadoPorNome: req.user?.nome });
      if (data.tipo === "exigencia") {
        await tx.update(protocols).set({ status: "exigencia_recebida", updatedAt: new Date() }).where(eq(protocols.id, protocol.id));
        await tx.update(service_orders).set({ status: "exigencia_externa", updatedAt: new Date() }).where(eq(service_orders.id, protocol.osId));
      } else {
        const allDispatches = await tx.select().from(protocol_dispatches).where(eq(protocol_dispatches.protocoloId, protocol.id)).orderBy(protocol_dispatches.ciclo);
        const allItems = await tx.select().from(protocol_dispatch_documents).where(inArray(protocol_dispatch_documents.remessaId, allDispatches.map((item) => item.id)));
        const latest = new Map<string, any>();
        allDispatches.forEach((dispatchRow) => allItems.filter((item) => item.remessaId === dispatchRow.id).forEach((item) => latest.set(item.documentoId, item)));
        const resultingStatus = deriveProtocolStatus([...latest.values()].map((item) => item.resultado));
        const allApproved = resultingStatus === "aprovado";
        await tx.update(protocols).set({ status: resultingStatus, updatedAt: new Date() }).where(eq(protocols.id, protocol.id));
        if (allApproved) {
          await tx.update(service_orders).set({ status: "aguardando_entrega", updatedAt: new Date() }).where(eq(service_orders.id, protocol.osId));
          // The task is intentionally not created until the stamped/final files are attached.
        }
      }
      const description = data.tipo === "exigencia" ? "Exigência externa recebida; correção necessária." : data.tipo === "aprovado_com_observacoes" ? "Documentos aprovados externamente com observações." : "Documentos aprovados externamente.";
      await tx.insert(protocol_events).values({ protocoloId: protocol.id, tipo: data.tipo, descricao: description, dados: { documentosIds: data.documentosIds }, autorId: req.user?.id, autorNome: req.user?.nome });
      await tx.insert(os_events).values({ osId: protocol.osId, tipo: data.tipo === "exigencia" ? "exigencia" : "resposta_externa", autorId: req.user?.id, autorNome: req.user?.nome, descricao: description, dados: { protocoloId: protocol.id, respostaId: response.id } });
    });
    const rows = await db.select().from(protocols).where(eq(protocols.id, req.params.id));
    res.json((await hydrateProtocols(rows))[0]);
  } catch (error: any) {
    const messages: Record<string, string> = { PROTOCOL_NOT_FOUND: "Protocolo de análise externa não encontrado.", INVALID_STATE: "Este protocolo não está aguardando resposta externa.", DISPATCH_NOT_FOUND: "Remessa atual não encontrada.", INVALID_DOCUMENT: "Documento não pertence à remessa atual.", SERVICES_NOT_COMPLETED: "Conclua todos os serviços da OS antes de registrar a resposta externa." };
    console.error(error);
    res.status(messages[error?.message] ? 400 : 500).json({ error: messages[error?.message] || "Não foi possível registrar a resposta" });
  }
});

// ---------- POST /api/protocols/:id/final-documents ----------
router.post("/:id/final-documents", requireProtocolPermission, async (req: any, res: any) => {
  try {
    const data = req.body || {};
    if (!data.documentoId || !data.arquivoUrl || !data.arquivoNome) return res.status(400).json({ error: "Documento e arquivo final aprovado são obrigatórios." });
    await db.transaction(async (tx) => {
      const protocol = (await tx.select().from(protocols).where(eq(protocols.id, req.params.id)))[0];
      if (!protocol?.osId || protocol.status !== "aprovado") throw new Error("INVALID_STATE");
      await assertServicesCompleted(tx, protocol.osId);
      const doc = (await tx.select().from(documents).where(and(eq(documents.id, data.documentoId), eq(documents.osId, protocol.osId))))[0];
      if (!doc || doc.status !== "aprovado") throw new Error("INVALID_DOCUMENT");
      const existing = await tx.select().from(approved_document_files).where(and(eq(approved_document_files.protocoloId, protocol.id), eq(approved_document_files.documentoId, doc.id)));
      if (existing.length) throw new Error("FINAL_FILE_EXISTS");
      const dispatchRows = await tx.select().from(protocol_dispatches).where(eq(protocol_dispatches.protocoloId, protocol.id));
      const dispatchDocs = dispatchRows.length ? await tx.select().from(protocol_dispatch_documents).where(inArray(protocol_dispatch_documents.remessaId, dispatchRows.map((item) => item.id))) : [];
      const latest = dispatchDocs.filter((item) => item.documentoId === doc.id).sort((a, b) => Number(b.versao) - Number(a.versao))[0];
      await tx.insert(approved_document_files).values({ protocoloId: protocol.id, respostaId: data.respostaId || null, documentoId: doc.id, versaoId: latest?.versaoId || null, arquivoUrl: data.arquivoUrl, arquivoNome: data.arquivoNome, tipoMime: data.tipoMime || null, tamanho: Number(data.tamanho) || 0, enviadoPorId: req.user.id, enviadoPorNome: req.user.nome });
      await tx.insert(protocol_events).values({ protocoloId: protocol.id, tipo: "arquivo_final", descricao: `Documento final aprovado anexado: ${doc.titulo}.`, dados: { documentoId: doc.id }, autorId: req.user.id, autorNome: req.user.nome });
      await ensureDeliveryTask(tx, protocol, req.user);
      await reconcileOsReadiness(protocol.osId, tx, req.user);
    });
    const rows = await db.select().from(protocols).where(eq(protocols.id, req.params.id));
    res.json((await hydrateProtocols(rows))[0]);
  } catch (error: any) {
    const errors: Record<string, string> = { INVALID_STATE: "Anexe o documento final somente depois da aprovação externa completa.", INVALID_DOCUMENT: "Documento inválido ou ainda não aprovado externamente.", FINAL_FILE_EXISTS: "Já existe um documento final aprovado preservado para este documento.", SERVICES_NOT_COMPLETED: "Conclua todos os serviços da OS antes de anexar os documentos finais." };
    res.status(errors[error.message] ? 409 : 500).json({ error: errors[error.message] || "Não foi possível anexar o documento final." });
  }
});

// ---------- POST /api/protocols/:id/final-documents/supplemental ----------
// An administrator can append a new final file after a delivery was completed.
// The prior file and dispatch remain immutable; only the delivery task is reopened.
router.post("/:id/final-documents/supplemental", requireRole(["admin"]), async (req: any, res: any) => {
  try {
    const data = req.body || {};
    if (!data.documentoId || !data.arquivoUrl || !data.arquivoNome) return res.status(400).json({ error: "Documento e arquivo suplementar são obrigatórios." });
    await db.transaction(async (tx) => {
      const protocol = (await tx.select().from(protocols).where(eq(protocols.id, req.params.id)))[0];
      if (!protocol?.osId || protocol.status !== "aprovado") throw new Error("INVALID_STATE");
      const [order, doc] = await Promise.all([
        tx.select().from(service_orders).where(eq(service_orders.id, protocol.osId)).then((rows: any[]) => rows[0]),
        tx.select().from(documents).where(and(eq(documents.id, data.documentoId), eq(documents.osId, protocol.osId))).then((rows: any[]) => rows[0]),
      ]);
      if (!order || !doc || doc.status !== "aprovado") throw new Error("INVALID_DOCUMENT");
      const latestVersion = (await tx.select().from(document_versions).where(eq(document_versions.documentoId, doc.id)).orderBy(desc(document_versions.versao)))[0];
      const file = (await tx.insert(approved_document_files).values({
        protocoloId: protocol.id, documentoId: doc.id, versaoId: latestVersion?.id || null,
        arquivoUrl: data.arquivoUrl, arquivoNome: data.arquivoNome, tipoMime: data.tipoMime || null,
        tamanho: Number(data.tamanho) || 0, enviadoPorId: req.user.id, enviadoPorNome: req.user.nome,
      }).returning())[0];
      let delivery = (await tx.select().from(deliveries).where(eq(deliveries.osId, order.id)))[0];
      if (!delivery) {
        const eligibleUsers = (await tx.select().from(users).where(eq(users.ativo, true))).filter((user: any) => Array.isArray(user.permissions) && user.permissions.includes(PERMISSIONS.EXECUTAR_ENTREGAS));
        const assignee = eligibleUsers.length === 1 ? eligibleUsers[0] : null;
        delivery = (await tx.insert(deliveries).values({ osId: order.id, status: "pendente", responsavelId: assignee?.id || null, motivoReabertura: `Documento suplementar anexado: ${file.arquivoNome}` }).returning())[0];
      } else {
        delivery = (await tx.update(deliveries).set({ status: "pendente", concluidaEm: null, motivoReabertura: `Documento suplementar anexado: ${file.arquivoNome}`, updatedAt: new Date() }).where(eq(deliveries.id, delivery.id)).returning())[0];
      }
      await tx.update(service_orders).set({ status: "aguardando_entrega", updatedAt: new Date() }).where(eq(service_orders.id, order.id));
      await tx.insert(protocol_events).values({ protocoloId: protocol.id, tipo: "arquivo_final_suplementar", descricao: `Documento final suplementar anexado e entrega reaberta: ${doc.titulo}.`, dados: { documentoId: doc.id, arquivoId: file.id }, autorId: req.user.id, autorNome: req.user.nome });
      await tx.insert(os_events).values({ osId: order.id, tipo: "entrega_reativada", autorId: req.user.id, autorNome: req.user.nome, descricao: `Entrega reaberta após anexação do documento suplementar ${file.arquivoNome}.`, dados: { documentoId: doc.id, arquivoId: file.id } });
      if (delivery.responsavelId) await tx.insert(notifications).values({ usuarioId: delivery.responsavelId, tipo: "entrega_atribuida", titulo: "Nova entrega reaberta", mensagem: `Um documento suplementar da OS ${order.numero} foi disponibilizado para entrega.`, osId: order.id, prioridade: "alta" });
      await reconcileOsReadiness(order.id, tx, req.user);
    });
    const rows = await db.select().from(protocols).where(eq(protocols.id, req.params.id));
    res.json((await hydrateProtocols(rows))[0]);
  } catch (error: any) {
    const errors: Record<string, string> = { INVALID_STATE: "Anexe documento suplementar somente em protocolo aprovado.", INVALID_DOCUMENT: "Documento inválido ou não aprovado para esta OS." };
    res.status(errors[error.message] ? 409 : 500).json({ error: errors[error.message] || "Não foi possível reabrir a entrega." });
  }
});

router.post("/:id/resend", requireProtocolPermission, async (req: any, res: any) => {
  try {
    const data = req.body || {};
    const selections = Array.isArray(data.documentos) ? data.documentos : [];
    if (!selections.length) return res.status(400).json({ error: "Selecione os documentos corrigidos." });
    await db.transaction(async (tx) => {
      const protocol = (await tx.select().from(protocols).where(eq(protocols.id, req.params.id)))[0];
      if (!protocol?.osId) throw new Error("PROTOCOL_NOT_FOUND");
      if (!["exigencia_recebida", "correcao_em_elaboracao"].includes(protocol.status)) throw new Error("INVALID_STATE");
      await assertServicesCompleted(tx, protocol.osId);
      const cycle = Number(protocol.cicloAtual) + 1;
      const selected: Array<{ doc: any; version: any }> = [];
      for (const selection of selections) {
        const doc = (await tx.select().from(documents).where(and(eq(documents.id, selection.documentoId), eq(documents.osId, protocol.osId))))[0];
        const version = doc ? (await tx.select().from(document_versions).where(and(eq(document_versions.documentoId, doc.id), eq(document_versions.versao, Number(selection.versao)))))[0] : null;
        if (!doc || !doc.aplicavelAnaliseExterna || !version || version.situacaoRevisao !== "revisado" || version.situacaoAprovacao !== "aprovado") throw new Error("DOCUMENT_NOT_APPROVED");
        selected.push({ doc, version });
      }
      const dispatch = (await tx.insert(protocol_dispatches).values({ protocoloId: protocol.id, ciclo: cycle, tipo: "correcao", dataEnvio: data.dataEnvio || today(), referenciaExterna: data.referenciaExterna, canal: data.canal || protocol.canal || "portal", destinatario: protocol.destinatario, observacao: data.observacao, enviadoPorId: req.user?.id, enviadoPorNome: req.user?.nome }).returning())[0];
      for (const { doc, version } of selected) {
        await tx.insert(protocol_dispatch_documents).values({ remessaId: dispatch.id, documentoId: doc.id, versaoId: version.id, versao: version.versao, tituloDocumento: doc.titulo, resultado: "aguardando_analise" });
        await tx.update(documents).set({ status: "em_analise_externa", updatedAt: new Date() }).where(eq(documents.id, doc.id));
      }
      await tx.update(protocols).set({ status: "correcao_enviada", cicloAtual: cycle, dataEnvio: data.dataEnvio || today(), updatedAt: new Date() }).where(eq(protocols.id, protocol.id));
      await tx.update(service_orders).set({ status: "em_analise_externa", updatedAt: new Date() }).where(eq(service_orders.id, protocol.osId));
      const description = awaitingExternalLabel(cycle);
      await tx.insert(protocol_events).values({ protocoloId: protocol.id, tipo: "correcao_enviada", descricao: description, dados: { ciclo: cycle }, autorId: req.user?.id, autorNome: req.user?.nome });
      await tx.insert(os_events).values({ osId: protocol.osId, tipo: "envio_externo", descricao: description, dados: { protocoloId: protocol.id, ciclo: cycle }, autorId: req.user?.id, autorNome: req.user?.nome });
    });
    const rows = await db.select().from(protocols).where(eq(protocols.id, req.params.id));
    res.json((await hydrateProtocols(rows))[0]);
  } catch (error: any) {
    const messages: Record<string, string> = { PROTOCOL_NOT_FOUND: "Protocolo não encontrado.", INVALID_STATE: "O protocolo não possui exigência aberta.", DOCUMENT_NOT_APPROVED: "As correções precisam estar revisadas e aprovadas tecnicamente antes do reenvio.", SERVICES_NOT_COMPLETED: "Conclua todos os serviços da OS antes de reenviar a correção." };
    console.error(error);
    res.status(messages[error?.message] ? 400 : 500).json({ error: messages[error?.message] || "Não foi possível reenviar a correção" });
  }
});

router.put("/:id", requireProtocolPermission, async (_req, res) => {
  res.status(405).json({ error: "O status do protocolo é calculado pelo histórico. Registre um envio ou uma resposta externa." });
});

export default router;
