import { Router } from "express";
import { db } from "../../db/index.js";
import { tasks, vessels } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../auth.js";
import { serializeTask } from "../serializers.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const all = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    const allVessels = await db.select().from(vessels);
    const vesselById = new Map(allVessels.map((v) => [v.id, v]));
    res.json(all.map((task) => serializeTask(task, vesselById.get(task.embarcacaoId || ""))));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const inserted = await db.insert(tasks).values({
      embarcacaoId: data.embarcacaoId,
      embarcacaoNome: data.embarcacaoNome,
      clienteNome: data.clienteNome,
      titulo: data.titulo,
      tipo: data.tipo,
      status: data.status || "pendente",
      responsavelNome: data.responsavelNome,
      responsavelId: data.responsavelId || null,
      responsavelCargo: data.responsavelCargo,
      certificadora: data.certificadora,
      prazo: data.prazo,
      arquivoNome: data.arquivoNome,
      arquivoUrl: data.arquivoUrl,
      atualizadoEm: data.atualizadoEm,
      dataCriacao: data.dataCriacao,
      prazoVencimento: data.prazo || data.prazoVencimento,
      anexos: data.anexos || [],
      observacoes: data.observacoes
    }).returning();
    res.json(serializeTask(inserted[0]));
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
    if (data.responsavelId !== undefined) updateData.responsavelId = data.responsavelId || null;
    if (data.responsavelCargo !== undefined) updateData.responsavelCargo = data.responsavelCargo;
    if (data.certificadora !== undefined) updateData.certificadora = data.certificadora;
    if (data.prazo !== undefined) updateData.prazo = data.prazo;
    if (data.arquivoNome !== undefined) updateData.arquivoNome = data.arquivoNome;
    if (data.arquivoUrl !== undefined) updateData.arquivoUrl = data.arquivoUrl;
    if (data.historicoNotas !== undefined) updateData.historicoNotas = data.historicoNotas;
    
    const updated = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(serializeTask(updated[0]));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
