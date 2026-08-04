import { Router } from "express";
import { db } from "../../db/index.js";
import { critical_pendings } from "../../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const all = await db.select().from(critical_pendings);
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
