import { Router } from "express";
import { db } from "../../db/index.js";
import { financial_entries, vessels } from "../../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { requireRole } from "../auth.js";
import { serializeFinancialEntry } from "../serializers.js";

const router = Router();
const requireFinanceAccess = requireRole(["admin", "financeiro"]);

router.get("/", requireFinanceAccess, async (req, res) => {
  try {
    const all = await db.select().from(financial_entries).orderBy(desc(financial_entries.createdAt));
    res.json(all.map(serializeFinancialEntry));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireFinanceAccess, async (req, res) => {
  try {
    const data = req.body;
    
    const result = await db.transaction(async (tx) => {
      const inserted = await tx.insert(financial_entries).values({
        embarcacaoId: data.embarcacaoId,
        embarcacaoNome: data.embarcacaoNome,
        clienteNome: data.clienteNome,
        data: data.data || new Date().toISOString().split("T")[0],
        valor: data.valor ? data.valor.toString() : "0",
        tipo: data.tipo,
        formaPagamento: data.formaPagamento,
        observacao: data.observacao,
        lancadoPorNome: data.lancadoPorNome,
      }).returning();
      
      const newEntry = inserted[0];
      
      // Calculate received
      if (data.embarcacaoId && data.tipo !== "despesa") {
        await tx.execute(sql`
          UPDATE vessels 
          SET valor_recebido = (
            SELECT COALESCE(SUM(valor), 0) FROM financial_entries 
            WHERE embarcacao_id = ${data.embarcacaoId} AND tipo != 'despesa'
          )
          WHERE id = ${data.embarcacaoId}
        `);
      }
      return newEntry;
    });
    
    res.json(serializeFinancialEntry(result));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireFinanceAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const updateData: any = { updatedAt: new Date() };
    if (data.valor !== undefined) updateData.valor = data.valor.toString();
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.formaPagamento !== undefined) updateData.formaPagamento = data.formaPagamento;
    if (data.observacao !== undefined) updateData.observacao = data.observacao;
    if (data.notaFiscalNumero !== undefined) updateData.notaFiscalNumero = data.notaFiscalNumero;
    if (data.notaFiscalNome !== undefined) updateData.notaFiscalNome = data.notaFiscalNome;
    if (data.notaFiscalUrl !== undefined) updateData.notaFiscalUrl = data.notaFiscalUrl;
    
    const result = await db.transaction(async (tx) => {
      const updated = await tx.update(financial_entries).set(updateData).where(eq(financial_entries.id, id)).returning();
      if (updated.length === 0) return null;
      
      const entry = updated[0];
      
      if (entry.embarcacaoId) {
        await tx.execute(sql`
          UPDATE vessels 
          SET valor_recebido = (
            SELECT COALESCE(SUM(valor), 0) FROM financial_entries 
            WHERE embarcacao_id = ${entry.embarcacaoId} AND tipo != 'despesa'
          )
          WHERE id = ${entry.embarcacaoId}
        `);
      }
      return entry;
    });
    
    if (!result) return res.status(404).json({ error: "Not found" });
    
    res.json(serializeFinancialEntry(result));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
