import { Router } from "express";
import * as argon2 from "argon2";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth } from "../auth.js";
import { serializeUser } from "../serializers.js";

const router = Router();
const loginAttempts = new Map<string, { count: number; firstAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const attemptKey = `${req.ip || "unknown"}:${normalizedEmail}`;
  const now = Date.now();
  const attempt = loginAttempts.get(attemptKey);
  if (attempt && now - attempt.firstAt < LOGIN_WINDOW_MS && attempt.count >= LOGIN_MAX_ATTEMPTS) {
    return res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." });
  }
  if (!attempt || now - attempt.firstAt >= LOGIN_WINDOW_MS) loginAttempts.set(attemptKey, { count: 0, firstAt: now });

  try {
    const userList = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (userList.length === 0) {
      const current = loginAttempts.get(attemptKey) || { count: 0, firstAt: now };
      loginAttempts.set(attemptKey, { count: current.count + 1, firstAt: current.firstAt });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userList[0];
    if (user.ativo === false) return res.status(403).json({ error: "Acesso bloqueado" });
    if (user.passwordResetExpiresAt && new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
      return res.status(401).json({ error: "A senha temporária expirou. Solicite um novo reset ao administrador." });
    }
    const isValid = await argon2.verify(user.senha, password);
    if (!isValid) {
      const current = loginAttempts.get(attemptKey) || { count: 0, firstAt: now };
      loginAttempts.set(attemptKey, { count: current.count + 1, firstAt: current.firstAt });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    loginAttempts.delete(attemptKey);

    req.session.userId = user.id;
    req.session.userRole = user.role;

    res.json(serializeUser(user));
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Could not log out" });
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userList = await db.select().from(users).where(eq(users.id, req.session.userId));
    if (userList.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userList[0];
    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/me", requireAuth, async (req: any, res) => {
  try {
    const nome = String(req.body?.nome || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!nome) return res.status(400).json({ error: "O nome é obrigatório." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) return res.status(400).json({ error: "Informe um e-mail válido." });

    const themePreference = req.body?.themePreference;
    if (themePreference !== undefined && themePreference !== "classic" && themePreference !== "nautilus_dark") {
      return res.status(400).json({ error: "Tema inválido." });
    }
    const updateData: Record<string, unknown> = {
      nome,
      email,
      cargo: String(req.body?.cargo || "").trim(),
      avatarUrl: req.body?.avatarUrl ?? null,
      updatedAt: new Date(),
    };
    if (themePreference !== undefined) updateData.themePreference = themePreference;
    if (req.body?.senha) updateData.senha = await argon2.hash(String(req.body.senha));

    const updated = await db.update(users).set(updateData).where(eq(users.id, req.user.id)).returning();
    res.json(serializeUser(updated[0]));
  } catch (error) {
    if ((error as any)?.code === "23505") return res.status(409).json({ error: "Este e-mail já está cadastrado." });
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Não foi possível atualizar o perfil." });
  }
});

export default router;
