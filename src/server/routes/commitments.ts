import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../../db/index.js";
import { commitments, commitment_attachments, vessels, users, notifications } from "../../db/schema.js";
import { and, desc, eq, inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../auth.js";

const router = Router();
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => { const dir = path.join(process.cwd(), "uploads"); fs.mkdirSync(dir, { recursive: true }); cb(null, dir); },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`),
});
const pdfUpload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024, files: 10 }, fileFilter: (_req, file, cb) => /\.pdf$/i.test(path.extname(file.originalname)) ? cb(null, true) : cb(new Error("Apenas arquivos PDF são aceitos.")) });
const serialize = (c: any, vessel?: any, user?: any, attachments: any[] = []) => ({ ...c, vencimento: c.vencimento?.slice(0, 10).split('-').reverse().join('/') || c.vencimento, embarcacaoNome: vessel?.nome || "", responsavelNome: user?.nome || "", anexos: attachments });
const normalizeDate = (value: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(value || '') ? value.split('/').reverse().join('-') : value;
const isAdmin = (req: any) => req.session?.user?.role === "admin" || req.user?.role === "admin";

router.get("/", requireAuth, async (_req: any, res) => {
  try {
    const all = await db.select().from(commitments).orderBy(desc(commitments.createdAt));
    const vs = await db.select().from(vessels); const us = await db.select().from(users);
    const ids = all.map(c => c.id); const files = ids.length ? await db.select().from(commitment_attachments).where(inArray(commitment_attachments.compromissoId, ids)) : [];
    res.json(all.map(c => serialize(c, vs.find(v => v.id === c.embarcacaoId), us.find(u => u.id === c.responsavelId), files.filter(f => f.compromissoId === c.id))));
  } catch { res.status(500).json({ error: "Não foi possível carregar pendências" }); }
});

router.post("/", requireRole(["admin"]), async (req: any, res) => {
  try {
    const { titulo, embarcacaoId, responsavelId, vencimento, observacoes, prioridade, destinatarios } = req.body || {};
    if (!titulo?.trim() || !embarcacaoId || !responsavelId || !vencimento) return res.status(400).json({ error: "Título, embarcação, vencimento e responsável são obrigatórios" });
    const recipients = Array.from(new Set(Array.isArray(destinatarios) && destinatarios.length ? destinatarios : [responsavelId]));
    const validUsers = await db.select({ id: users.id }).from(users).where(inArray(users.id, recipients));
    if (validUsers.length !== recipients.length) return res.status(400).json({ error: "Há usuários selecionados inválidos para notificação" });
    const [created] = await db.insert(commitments).values({ titulo: titulo.trim(), embarcacaoId, responsavelId, vencimento: normalizeDate(vencimento), observacoes, prioridade: prioridade || "normal", destinatarios: recipients, criadoPorId: req.user.id }).returning();
    await db.insert(notifications).values(recipients.map((usuarioId: string) => ({ usuarioId, tipo: "compromisso_criado", titulo: "Nova pendência atribuída", mensagem: `${created.titulo} — prazo ${created.vencimento}`, prioridade: created.prioridade, compromissoId: created.id } as any)));
    res.status(201).json(serialize(created));
  } catch (error) { console.error("Erro ao criar compromisso:", error); res.status(500).json({ error: "Não foi possível criar o compromisso" }); }
});

router.put("/:id", requireAuth, async (req: any, res) => {
  try {
    const [current] = await db.select().from(commitments).where(eq(commitments.id, req.params.id));
    if (!current) return res.status(404).json({ error: "Pendência não encontrada" });
    const actorId = req.user?.id || req.session?.userId;
    const actor = req.user || (actorId ? (await db.select().from(users).where(eq(users.id, actorId)))[0] : null);
    const isAdminActor = actor?.role === "admin";
    if (!isAdminActor && current.responsavelId !== actorId) return res.status(403).json({ error: "Sem permissão" });
    const editableFields = ["titulo", "embarcacaoId", "responsavelId", "vencimento", "observacoes", "prioridade", "status", "destinatarios"];
    if (!isAdminActor && Object.keys(req.body || {}).some(k => k !== "status")) return res.status(403).json({ error: "O responsável só pode alterar o status" });
    if (req.body?.status && !["aberto", "em_andamento", "aguardando_retorno", "resolvido"].includes(req.body.status)) return res.status(400).json({ error: "Status inválido" });
    const data: any = { updatedAt: new Date() }; editableFields.forEach(k => { if (req.body?.[k] !== undefined) data[k] = k === "vencimento" ? normalizeDate(req.body[k]) : req.body[k]; });
    const statusChanged = req.body?.status && req.body.status !== current.status;
    const [updated] = await db.update(commitments).set(data).where(eq(commitments.id, req.params.id)).returning();
    if (statusChanged) {
      const recipients = Array.isArray(current.destinatarios) && current.destinatarios.length ? current.destinatarios : [current.responsavelId];
      await db.insert(notifications).values(recipients.map((usuarioId: string) => ({ usuarioId, tipo: "compromisso_status", titulo: "Status de pendência alterado", mensagem: `${current.titulo}: ${current.status} → ${req.body.status}`, prioridade: "alta", compromissoId: current.id } as any)));
    }
    res.json(updated);
  } catch { res.status(500).json({ error: "Não foi possível atualizar a pendência" }); }
});

router.post("/:id/anexos", requireRole(["admin"]), pdfUpload.array("files", 10), async (req: any, res) => {
  try {
    const [c] = await db.select().from(commitments).where(eq(commitments.id, req.params.id)); if (!c) return res.status(404).json({ error: "Pendência não encontrada" });
    const files = (req.files || []) as Express.Multer.File[];
    if (!files.length) return res.status(400).json({ error: "Selecione ao menos um PDF" });
    const inserted = await db.insert(commitment_attachments).values(files.map(f => ({ compromissoId: c.id, nomeOriginal: f.originalname, nomeFisico: f.filename, url: `/api/upload/files/${encodeURIComponent(f.filename)}`, tipoMime: f.mimetype, tamanho: f.size, autorId: req.user.id }))).returning();
    res.status(201).json(inserted);
  } catch (e: any) { res.status(400).json({ error: e?.message || "Falha no upload" }); }
});

router.delete("/:id/anexos/:attachmentId", requireRole(["admin"]), async (req: any, res) => {
  const [file] = await db.select().from(commitment_attachments).where(and(eq(commitment_attachments.id, req.params.attachmentId), eq(commitment_attachments.compromissoId, req.params.id)));
  if (!file) return res.status(404).json({ error: "Anexo não encontrado" });
  await db.delete(commitment_attachments).where(eq(commitment_attachments.id, file.id)); try { fs.unlinkSync(path.join(process.cwd(), "uploads", file.nomeFisico)); } catch {} res.json({ ok: true });
});

router.delete("/:id", requireRole(["admin"]), async (req, res) => { const deleted = await db.delete(commitments).where(eq(commitments.id, req.params.id)).returning(); if (!deleted.length) return res.status(404).json({ error: "Pendência não encontrada" }); res.json({ ok: true }); });
export default router;

