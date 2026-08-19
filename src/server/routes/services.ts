import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { services } from "../../db/schema.js";
import { requireAuth, requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";

const router = Router();
const asNonNegativeMoney = (value: unknown) => Math.max(0, Number(value) || 0);

router.get("/", requireAuth, async (_req, res) => {
  try {
    res.json(await db.select().from(services).orderBy(asc(services.nome)));
  } catch {
    res.status(500).json({ error: "Não foi possível carregar os serviços" });
  }
});

router.post("/", requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]), async (req, res) => {
  try {
    const nome = String(req.body?.nome || "").trim();
    if (!nome) return res.status(400).json({ error: "Nome do serviço é obrigatório" });

    const existing = (await db.select().from(services)).find((service) => service.nome.trim().toLowerCase() === nome.toLowerCase());
    if (existing) return res.status(409).json({ error: "Já existe um serviço com esse nome" });

    const created = (await db.insert(services).values({
      nome,
      valorPadrao: String(asNonNegativeMoney(req.body?.valorPadrao)),
      ativo: req.body?.ativo !== false,
    }).returning())[0];
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível cadastrar o serviço" });
  }
});

router.put("/:id", requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]), async (req, res) => {
  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (req.body?.nome !== undefined) {
      const nome = String(req.body.nome).trim();
      if (!nome) return res.status(400).json({ error: "Nome do serviço é obrigatório" });
      updateData.nome = nome;
    }
    if (req.body?.valorPadrao !== undefined) updateData.valorPadrao = String(asNonNegativeMoney(req.body.valorPadrao));
    if (req.body?.ativo !== undefined) updateData.ativo = Boolean(req.body.ativo);

    const updated = await db.update(services).set(updateData).where(eq(services.id, req.params.id)).returning();
    if (!updated.length) return res.status(404).json({ error: "Serviço não encontrado" });
    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível atualizar o serviço" });
  }
});

router.delete("/:id", requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]), async (req, res) => {
  try {
    const updated = await db.update(services).set({ ativo: false, updatedAt: new Date() }).where(eq(services.id, req.params.id)).returning();
    if (!updated.length) return res.status(404).json({ error: "Serviço não encontrado" });
    res.json({ message: "Serviço desativado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível desativar o serviço" });
  }
});

export default router;
