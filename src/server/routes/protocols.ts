import { Router } from "express";
import { db } from "../../db/index.js";
import { protocols } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../auth.js";
import { serializeProtocol } from "../serializers.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const all = await db.select().from(protocols).orderBy(desc(protocols.createdAt));
    res.json(all.map(serializeProtocol));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    const inserted = await db.insert(protocols).values({
      numeroProtocolo: data.numeroProtocolo,
      dataEnvio: data.dataEnvio || new Date().toISOString().split("T")[0],
      embarcacaoId: data.embarcacaoId,
      embarcacaoNome: data.embarcacaoNome,
      clienteNome: data.clienteNome,
      destinatario: data.destinatario,
      orgaoOuEmpresa: data.orgaoOuEmpresa,
      tipoProtocolo: data.tipoProtocolo,
      responsavelEnvioNome: data.responsavelEnvioNome,
      status: data.status || "em_trânsito",
      codigoRastreio: data.codigoRastreio,
      documentosIncluidos: data.documentosIncluidos || [],
      observacoes: data.observacoes
    }).returning();
    res.json(serializeProtocol(inserted[0]));
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
    
    const updated = await db.update(protocols).set(updateData).where(eq(protocols.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(serializeProtocol(updated[0]));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
