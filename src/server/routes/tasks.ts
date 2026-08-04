import { Router } from "express";
import { db } from "../../db/index.js";
import { tasks } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const all = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const inserted = await db.insert(tasks).values({
      embarcacaoId: data.embarcacaoId,
      titulo: data.titulo,
      tipo: data.tipo,
      status: data.status || "pendente",
      responsavelNome: data.responsavelNome,
      dataCriacao: data.dataCriacao,
      prazoVencimento: data.prazoVencimento,
      anexos: data.anexos || [],
      observacoes: data.observacoes
    }).returning();
    res.json(inserted[0]);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updateData: any = { updatedAt: new Date() };
    if (data.status !== undefined) updateData.status = data.status;
    if (data.responsavelNome !== undefined) updateData.responsavelNome = data.responsavelNome;
    if (data.historicoNotas !== undefined) updateData.historicoNotas = data.historicoNotas;
    
    const updated = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
