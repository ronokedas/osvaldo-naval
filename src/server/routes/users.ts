import { Router } from "express";
import crypto from "crypto";
import * as argon2 from "argon2";
import { db } from "../../db/index.js";
import { users, documentLibraryAudit } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../auth.js";
import { serializeUser } from "../serializers.js";

const router = Router();
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());

// Administrators receive the management representation; other authenticated
// users receive only the directory fields needed by assignment screens.
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const allUsers = await db.select().from(users);
    if (req.user.role === "admin") return res.json(allUsers.map(serializeUser));
    res.json(allUsers.filter((u) => u.ativo !== false).map((u) => ({
      id: u.id, nome: u.nome, cargo: u.cargo || "", role: u.role, ativo: true, avatarUrl: u.avatarUrl || undefined,
    })));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireRole(["admin"]), async (req, res) => {
  try {
    const { nome, email, role, senha, avatarUrl, cargo, ativo, permissions } = req.body;
    if (!nome?.trim() || !email?.trim() || !senha) return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios" });
    if (!isValidEmail(email)) return res.status(400).json({ error: "Informe um e-mail válido" });
    const hashedPassword = await argon2.hash(senha || "123456");
    const newUser = await db.insert(users).values({
      nome,
      email: email.trim().toLowerCase(),
      role: role || "tecnico",
      senha: hashedPassword,
      avatarUrl,
      cargo,
      ativo: ativo !== false,
      permissions: Array.isArray(permissions) ? permissions : [],
    }).returning();
    
    res.status(201).json(serializeUser(newUser[0]));
  } catch (error) {
    if ((error as any)?.code === "23505") return res.status(409).json({ error: "Este e-mail já está cadastrado" });
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, role, senha, avatarUrl, cargo, ativo, permissions } = req.body;
    
    const updateData: any = {};
    if (nome) updateData.nome = nome;
    if (email) {
      if (!isValidEmail(email)) return res.status(400).json({ error: "Informe um e-mail válido" });
      updateData.email = email.trim().toLowerCase();
    }
    if (role) updateData.role = role;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (cargo !== undefined) updateData.cargo = cargo;
    if (ativo !== undefined) updateData.ativo = ativo;
    if (permissions !== undefined) updateData.permissions = Array.isArray(permissions) ? permissions : [];
    if (senha) {
      updateData.senha = await argon2.hash(senha);
      updateData.passwordResetExpiresAt = null;
    }
    updateData.updatedAt = new Date();

    const updatedUser = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    
    if (updatedUser.length === 0) return res.status(404).json({ error: "Not found" });
    if (permissions !== undefined) {
      await db.insert(documentLibraryAudit).values({ actorId: (req as any).user.id, action: "permissions_updated", details: { targetUserId: id, permissions: updateData.permissions } });
    }
    res.json(serializeUser(updatedUser[0]));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/reset-password", requireRole(["admin"]), async (req, res) => {
  try {
    const password = `Nautilus-${crypto.randomBytes(6).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const updated = await db.update(users).set({ senha: await argon2.hash(password), passwordResetExpiresAt: expiresAt, updatedAt: new Date() }).where(eq(users.id, req.params.id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
    await db.insert(documentLibraryAudit).values({ actorId: (req as any).user.id, action: "password_reset", details: { targetUserId: req.params.id, expiresAt } });
    res.json({ user: serializeUser(updated[0]), temporaryPassword: password, expiresAt });
  } catch {
    res.status(500).json({ error: "Não foi possível redefinir a senha" });
  }
});

export default router;
