import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { documentLibraryAudit, documentLibraryFiles, documentLibraryFolders, users } from "../../db/schema.js";
import { requireAuth } from "../auth.js";
import { hasModuleAccess } from "../permissions.js";

const router = Router();
const libraryDir = path.resolve(process.cwd(), "uploads", "document-library");
const has = (user: any, permission: string) => user?.role === "admin" || (Array.isArray(user?.permissions) && user.permissions.includes(permission));
const canAccess = (user: any) => hasModuleAccess(user, "documents");
const canWriteFolder = (user: any, folder: any) => user?.role === "admin" || folder?.ownerUserId === user?.id;
const safeFileName = (name: string) => name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").slice(0, 180) || "arquivo";

fs.mkdirSync(libraryDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, libraryDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeFileName(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|xls|xlsx|dwg|dxf|png|jpe?g|gif|bmp|tiff?)$/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error("Tipo de arquivo não permitido.") as any, false);
  },
});

async function audit(actorId: string, action: string, ids: { fileId?: string; folderId?: string }, details: Record<string, unknown> = {}) {
  await db.insert(documentLibraryAudit).values({ actorId, action, fileId: ids.fileId, folderId: ids.folderId, details });
}
async function getFolder(id: string) {
  return (await db.select().from(documentLibraryFolders).where(eq(documentLibraryFolders.id, id)))[0];
}
async function getFile(id: string) {
  return (await db.select().from(documentLibraryFiles).where(eq(documentLibraryFiles.id, id)))[0];
}
function guardAccess(req: any, res: any): boolean {
  if (!canAccess(req.user)) { res.status(403).json({ error: "Você não tem acesso ao módulo de documentos." }); return false; }
  return true;
}

router.use(requireAuth);

router.get("/overview", async (req: any, res) => {
  try {
    if (!guardAccess(req, res)) return;
    const [allUsers, folders, files] = await Promise.all([
      db.select().from(users),
      db.select().from(documentLibraryFolders),
      db.select().from(documentLibraryFiles).where(isNull(documentLibraryFiles.trashedAt)).orderBy(desc(documentLibraryFiles.uploadedAt)),
    ]);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const allowedUsers = allUsers.filter((u) => u.ativo !== false && canAccess(u)).map((u) => ({ id: u.id, nome: u.nome, email: u.email, avatarUrl: u.avatarUrl }));
    res.json({
      users: allowedUsers,
      folders,
      files: files.map((file) => ({ ...file, uploadedByName: userMap.get(file.uploadedById)?.nome || "Usuário removido" })),
    });
  } catch { res.status(500).json({ error: "Não foi possível carregar os documentos." }); }
});

router.get("/folders/:id", async (req: any, res) => {
  try {
    if (!guardAccess(req, res)) return;
    const folder = await getFolder(req.params.id);
    if (!folder) return res.status(404).json({ error: "Pasta não encontrada." });
    const [folders, files, allUsers] = await Promise.all([
      db.select().from(documentLibraryFolders).where(eq(documentLibraryFolders.parentId, folder.id)),
      db.select().from(documentLibraryFiles).where(and(eq(documentLibraryFiles.folderId, folder.id), isNull(documentLibraryFiles.trashedAt))).orderBy(desc(documentLibraryFiles.uploadedAt)),
      db.select().from(users),
    ]);
    const userMap = new Map(allUsers.map((u) => [u.id, u.nome]));
    res.json({ folder, folders, files: files.map((f) => ({ ...f, uploadedByName: userMap.get(f.uploadedById) || "Usuário removido" })) });
  } catch { res.status(500).json({ error: "Não foi possível abrir a pasta." }); }
});

router.post("/folders", async (req: any, res) => {
  try {
    if (!guardAccess(req, res)) return;
    const name = String(req.body.name || "").trim();
    const parentId = req.body.parentId || null;
    if (!name || name.length > 120) return res.status(400).json({ error: "Informe um nome de pasta de até 120 caracteres." });
    const parent = parentId ? await getFolder(parentId) : undefined;
    const ownerUserId = parent?.ownerUserId || (req.user.role === "admin" ? req.body.ownerUserId : req.user.id);
    if (!ownerUserId || (parentId && !parent)) return res.status(404).json({ error: "Pasta de destino não encontrada." });
    if (req.user.role !== "admin" && ownerUserId !== req.user.id) return res.status(403).json({ error: "Você só pode criar pastas no seu espaço." });
    const folder = (await db.insert(documentLibraryFolders).values({ name, parentId, ownerUserId, createdById: req.user.id }).returning())[0];
    await audit(req.user.id, "folder_created", { folderId: folder.id }, { name });
    res.status(201).json(folder);
  } catch { res.status(500).json({ error: "Não foi possível criar a pasta." }); }
});

router.post("/upload", upload.single("file"), async (req: any, res) => {
  try {
    if (!guardAccess(req, res)) { if (req.file) fs.unlink(req.file.path, () => undefined); return; }
    if (!has(req.user, "documents_upload")) { if (req.file) fs.unlink(req.file.path, () => undefined); return res.status(403).json({ error: "Você não tem permissão para enviar documentos." }); }
    if (!req.file) return res.status(400).json({ error: "Selecione um arquivo." });
    const folder = req.body.folderId ? await getFolder(req.body.folderId) : undefined;
    const ownerUserId = folder?.ownerUserId || (req.user.role === "admin" ? req.body.ownerUserId : req.user.id);
    if ((req.body.folderId && !folder) || !ownerUserId) { fs.unlink(req.file.path, () => undefined); return res.status(404).json({ error: "Pasta de destino não encontrada." }); }
    if (req.user.role !== "admin" && ((folder && !canWriteFolder(req.user, folder)) || ownerUserId !== req.user.id)) { fs.unlink(req.file.path, () => undefined); return res.status(403).json({ error: "Você só pode enviar arquivos na sua pasta." }); }
    const file = (await db.insert(documentLibraryFiles).values({ ownerUserId, folderId: folder?.id || null, originalName: req.file.originalname, storedName: req.file.filename, mimeType: req.file.mimetype, size: req.file.size, uploadedById: req.user.id }).returning())[0];
    await audit(req.user.id, "file_uploaded", { fileId: file.id, folderId: folder?.id }, { originalName: file.originalName, size: file.size });
    res.status(201).json(file);
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => undefined);
    res.status(500).json({ error: "Não foi possível salvar o documento." });
  }
});

router.get("/files/:id/content", async (req: any, res) => {
  try {
    if (!guardAccess(req, res)) return;
    const file = await getFile(req.params.id);
    if (!file || (file.trashedAt && req.user.role !== "admin")) return res.status(404).json({ error: "Documento não encontrado." });
    const diskPath = path.resolve(libraryDir, path.basename(file.storedName));
    if (!diskPath.startsWith(libraryDir) || !fs.existsSync(diskPath)) return res.status(404).json({ error: "Arquivo não encontrado no armazenamento." });
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.type(file.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", req.query.download === "1" ? `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}` : `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    res.sendFile(diskPath);
  } catch { res.status(500).json({ error: "Não foi possível abrir o documento." }); }
});

router.post("/files/:id/trash", async (req: any, res) => {
  try {
    if (!guardAccess(req, res)) return;
    if (!has(req.user, "documents_delete")) return res.status(403).json({ error: "Você não tem permissão para mover documentos para a lixeira." });
    const file = await getFile(req.params.id);
    if (!file || file.trashedAt) return res.status(404).json({ error: "Documento não encontrado." });
    await db.update(documentLibraryFiles).set({ trashedAt: new Date(), trashedById: req.user.id }).where(eq(documentLibraryFiles.id, file.id));
    await audit(req.user.id, "file_trashed", { fileId: file.id }, { originalName: file.originalName });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Não foi possível mover o documento para a lixeira." }); }
});

router.get("/trash", async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "A lixeira é restrita ao administrador." });
    const [files, allUsers] = await Promise.all([db.select().from(documentLibraryFiles).orderBy(desc(documentLibraryFiles.trashedAt)), db.select().from(users)]);
    const userMap = new Map(allUsers.map((u) => [u.id, u.nome]));
    res.json(files.filter((f) => f.trashedAt).map((f) => ({ ...f, uploadedByName: userMap.get(f.uploadedById), trashedByName: userMap.get(f.trashedById || "") })));
  } catch { res.status(500).json({ error: "Não foi possível carregar a lixeira." }); }
});

router.post("/files/:id/restore", async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Somente administradores podem restaurar documentos." });
    const file = await getFile(req.params.id);
    if (!file || !file.trashedAt) return res.status(404).json({ error: "Documento não encontrado na lixeira." });
    await db.update(documentLibraryFiles).set({ trashedAt: null, trashedById: null }).where(eq(documentLibraryFiles.id, file.id));
    await audit(req.user.id, "file_restored", { fileId: file.id }, { originalName: file.originalName });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Não foi possível restaurar o documento." }); }
});

router.delete("/files/:id", async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Somente administradores podem excluir definitivamente." });
    const file = await getFile(req.params.id);
    if (!file || !file.trashedAt) return res.status(404).json({ error: "Envie o documento para a lixeira antes de excluí-lo definitivamente." });
    if (String(req.body.confirmName || "") !== file.originalName) return res.status(400).json({ error: "Digite o nome completo do documento para confirmar." });
    const diskPath = path.resolve(libraryDir, path.basename(file.storedName));
    if (!diskPath.startsWith(libraryDir)) return res.status(400).json({ error: "Caminho de arquivo inválido." });
    try { await fs.promises.unlink(diskPath); } catch (error: any) { if (error.code !== "ENOENT") return res.status(500).json({ error: "Não foi possível remover o arquivo do VPS. O registro foi preservado." }); }
    await db.delete(documentLibraryFiles).where(eq(documentLibraryFiles.id, file.id));
    await audit(req.user.id, "file_deleted_permanently", { fileId: file.id }, { originalName: file.originalName });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Não foi possível excluir o documento definitivamente." }); }
});

export default router;
