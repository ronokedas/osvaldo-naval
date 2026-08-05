import { Router } from "express";
import * as argon2 from "argon2";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../auth.js";
import { serializeUser } from "../serializers.js";

const router = Router();
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());

// Only admin can list all users for management
router.get("/", requireRole(["admin", "financeiro", "tecnico"]), async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers.map(serializeUser));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireRole(["admin"]), async (req, res) => {
  try {
    const { nome, email, role, senha, avatarUrl, cargo, ativo } = req.body;
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
    const { nome, email, role, senha, avatarUrl, cargo, ativo } = req.body;
    
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
    if (senha) updateData.senha = await argon2.hash(senha);
    updateData.updatedAt = new Date();

    const updatedUser = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    
    if (updatedUser.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(serializeUser(updatedUser[0]));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/reset-password", requireRole(["admin"]), async (req, res) => {
  try {
    const password = "Nautilus2026!";
    const updated = await db.update(users).set({ senha: await argon2.hash(password), updatedAt: new Date() }).where(eq(users.id, req.params.id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json({ user: serializeUser(updated[0]), temporaryPassword: password });
  } catch {
    res.status(500).json({ error: "Não foi possível redefinir a senha" });
  }
});

export default router;
