import { Router } from "express";
import * as argon2 from "argon2";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../auth.js";

const router = Router();

// Only admin can list all users for management
router.get("/", requireRole(["admin", "financeiro", "tecnico"]), async (req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      nome: users.nome,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    }).from(users);
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireRole(["admin"]), async (req, res) => {
  try {
    const { nome, email, role, senha, avatarUrl } = req.body;
    const hashedPassword = await argon2.hash(senha || "123456");
    const newUser = await db.insert(users).values({
      nome,
      email,
      role: role || "tecnico",
      senha: hashedPassword,
      avatarUrl,
    }).returning();
    
    const u = newUser[0];
    res.json({ id: u.id, nome: u.nome, email: u.email, role: u.role, avatarUrl: u.avatarUrl });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, role, senha, avatarUrl } = req.body;
    
    const updateData: any = {};
    if (nome) updateData.nome = nome;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (senha) updateData.senha = await argon2.hash(senha);
    updateData.updatedAt = new Date();

    const updatedUser = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    
    if (updatedUser.length === 0) return res.status(404).json({ error: "Not found" });
    const u = updatedUser[0];
    res.json({ id: u.id, nome: u.nome, email: u.email, role: u.role, avatarUrl: u.avatarUrl });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
