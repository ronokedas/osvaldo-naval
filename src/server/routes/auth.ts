import { Router } from "express";
import * as argon2 from "argon2";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth } from "../auth.js";

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
    const isValid = await argon2.verify(user.senha, password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;

    res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    });
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
    res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
