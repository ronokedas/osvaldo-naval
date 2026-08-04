import { Router } from "express";
import { db } from "../../db/index.js";
import { proposals, vessels } from "../../db/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth } from "../auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const all = await db.select().from(proposals).orderBy(desc(proposals.createdAt));
    res.json(all.map(p => ({
      ...p,
      valorTotal: Number(p.valorTotal)
    })));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    
    // Auto-generate DS number
    const currentYear = new Date().getFullYear();
    const yearSuffix = String(currentYear).slice(-2);
    // Rough count for current year
    const yearCount = await db.select().from(proposals).where(
      sql`extract(year from created_at) = ${currentYear}`
    );
    const nextSeq = yearCount.length + 51;
    const formattedSeq = String(nextSeq).padStart(3, '0');
    const proposalNumber = data.numero || `DS ${formattedSeq}/${yearSuffix}`;
    
    const inserted = await db.insert(proposals).values({
      numero: proposalNumber,
      dataEmissao: data.dataEmissao || new Date().toISOString().split("T")[0],
      validadeDias: data.validadeDias,
      embarcacaoId: data.embarcacaoId,
      embarcacaoNome: data.embarcacaoNome,
      clienteNome: data.clienteNome,
      destinatario: data.destinatario,
      assunto: data.assunto,
      prazoEntregaDias: data.prazoEntregaDias,
      condicoesPagamento: data.condicoesPagamento,
      status: data.status || "rascunho",
      itens: data.itens || [],
      valorTotal: data.valorTotal ? data.valorTotal.toString() : "0",
      observacoes: data.observacoes
    }).returning();
    
    // Update vessel valor total if aprovado
    if (inserted[0].status === "aprovado" && inserted[0].embarcacaoId) {
      await db.update(vessels).set({ valorTotal: inserted[0].valorTotal }).where(eq(vessels.id, inserted[0].embarcacaoId));
    }
    
    res.json({
      ...inserted[0],
      valorTotal: Number(inserted[0].valorTotal)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const updateData: any = { updatedAt: new Date() };
    if (data.status !== undefined) updateData.status = data.status;
    if (data.valorTotal !== undefined) updateData.valorTotal = data.valorTotal.toString();
    if (data.itens !== undefined) updateData.itens = data.itens;
    // ... other fields if needed ...
    
    const updated = await db.update(proposals).set(updateData).where(eq(proposals.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Not found" });
    
    if (data.status === "aprovado" && updated[0].embarcacaoId) {
      await db.update(vessels).set({ valorTotal: updated[0].valorTotal }).where(eq(vessels.id, updated[0].embarcacaoId));
    }
    
    res.json({
      ...updated[0],
      valorTotal: Number(updated[0].valorTotal)
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
