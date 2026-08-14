import { Router } from "express";
import { db } from "../../db/index.js";
import { vessels } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../auth.js";
import { serializeVessel } from "../serializers.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const allVessels = await db.select().from(vessels).orderBy(desc(vessels.createdAt));
    res.json(allVessels.map(serializeVessel));
  } catch (error) {
    console.error("Error fetching vessels:", error);
    res.status(500).json({ error: "Erro ao buscar embarcações" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    
    // Validation
    if (!data.nome) {
      return res.status(400).json({ error: "Nome da embarcação é obrigatório" });
    }
    if (!data.tipo) {
      return res.status(400).json({ error: "Tipo da embarcação é obrigatório" });
    }
    
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
      valorSinal: data.valorSinal ? data.valorSinal.toString() : "0",
      registro: data.registro,
      certificadoraPrincipal: data.certificadoraPrincipal,
      descricao: data.descricao,
      arquivosAssociados: data.arquivosAssociados || [],
      progresso: data.progresso || 0,
    }).returning();
    
    res.json(serializeVessel(newVessel[0]));
  } catch (error) {
    console.error("Error creating vessel:", error);
    res.status(500).json({ error: "Erro ao criar embarcação" });
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
    if (data.valorSinal !== undefined) updateData.valorSinal = data.valorSinal.toString();
    if (data.registro !== undefined) updateData.registro = data.registro;
    if (data.certificadoraPrincipal !== undefined) updateData.certificadoraPrincipal = data.certificadoraPrincipal;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.arquivosAssociados !== undefined) updateData.arquivosAssociados = data.arquivosAssociados;
    if (data.progresso !== undefined) updateData.progresso = data.progresso;

    const updated = await db.update(vessels).set(updateData).where(eq(vessels.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Embarcação não encontrada" });
    
    res.json(serializeVessel(updated[0]));
  } catch (error) {
    console.error("Error updating vessel:", error);
    res.status(500).json({ error: "Erro ao atualizar embarcação" });
  }
});

export default router;
