import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { app_configs } from "../../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();

// Institutional branding is shared by every authenticated user. This route
// deliberately exposes only the saved logo presentation data, never settings
// such as SMTP or administrative configuration.
router.get("/logo", requireAuth, async (_req, res) => {
  try {
    const row = (await db.select({ data: app_configs.data }).from(app_configs).where(eq(app_configs.id, "logo")))[0];
    const data = row?.data && typeof row.data === "object" ? row.data as Record<string, unknown> : {};
    res.json({
      imagemUrl: typeof data.imagemUrl === "string" ? data.imagemUrl : undefined,
      nomeEmpresa: typeof data.nomeEmpresa === "string" ? data.nomeEmpresa : undefined,
      subtitulo: typeof data.subtitulo === "string" ? data.subtitulo : undefined,
      ativo: data.ativo !== false,
    });
  } catch {
    res.status(500).json({ error: "Não foi possível carregar a identidade visual." });
  }
});

export default router;
