import { Router } from "express";
import * as argon2 from "argon2";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth } from "../auth.js";
import { serializeUser } from "../serializers.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const userList = await db.select().from(users).where(eq(users.email, email));
    if (userList.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userList[0];
    if (user.ativo === false) return res.status(403).json({ error: "Acesso bloqueado" });
    const isValid = await argon2.verify(user.senha, password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;

    res.json(serializeUser(user));
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
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
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default router;
