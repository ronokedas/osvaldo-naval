import { Router } from "express";
import { db } from "../../db/index.js";
import { vessels } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const allVessels = await db.select().from(vessels).orderBy(desc(vessels.createdAt));
    res.json(allVessels.map(v => ({
      ...v,
      valorTotal: Number(v.valorTotal),
      valorRecebido: Number(v.valorRecebido)
    })));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const newVessel = await db.insert(vessels).values({
      nome: data.nome,
      tipo: data.tipo,
      clienteId: data.clienteId || null,
      clienteNome: data.clienteNome || "Sem Cliente",
      telefoneContato: data.telefoneContato,
      emailContato: data.emailContato,
      responsavelTecnico: data.responsavelTecnico,
      status: data.status || "aberta",
      etapaAtual: data.etapaAtual || "Análise Inicial",
      prazoRenovacao: data.prazoRenovacao,
      valorTotal: data.valorTotal ? data.valorTotal.toString() : "0",
      valorRecebido: data.valorRecebido ? data.valorRecebido.toString() : "0",
      arquivosAssociados: data.arquivosAssociados || [],
      progresso: data.progresso || 0,
    }).returning();
    
    res.json({
      ...newVessel[0],
      valorTotal: Number(newVessel[0].valorTotal),
      valorRecebido: Number(newVessel[0].valorRecebido)
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const updateData: any = { updatedAt: new Date() };
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.clienteId !== undefined) updateData.clienteId = data.clienteId;
    if (data.clienteNome !== undefined) updateData.clienteNome = data.clienteNome;
    if (data.telefoneContato !== undefined) updateData.telefoneContato = data.telefoneContato;
    if (data.emailContato !== undefined) updateData.emailContato = data.emailContato;
    if (data.responsavelTecnico !== undefined) updateData.responsavelTecnico = data.responsavelTecnico;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.etapaAtual !== undefined) updateData.etapaAtual = data.etapaAtual;
    if (data.prazoRenovacao !== undefined) updateData.prazoRenovacao = data.prazoRenovacao;
    if (data.valorTotal !== undefined) updateData.valorTotal = data.valorTotal.toString();
    if (data.valorRecebido !== undefined) updateData.valorRecebido = data.valorRecebido.toString();
    if (data.arquivosAssociados !== undefined) updateData.arquivosAssociados = data.arquivosAssociados;
    if (data.progresso !== undefined) updateData.progresso = data.progresso;

    const updated = await db.update(vessels).set(updateData).where(eq(vessels.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Not found" });
    
    res.json({
      ...updated[0],
      valorTotal: Number(updated[0].valorTotal),
      valorRecebido: Number(updated[0].valorRecebido)
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
