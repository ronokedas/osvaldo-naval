import { Router } from "express";
import { db } from "../../db/index.js";
import { certifiers } from "../../db/schema.js";
import { eq, asc } from "drizzle-orm";
import { requireAuth, requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const all = await db.select().from(certifiers).orderBy(asc(certifiers.nome));
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: "Não foi possível carregar as certificadoras" });
  }
});

router.post("/", requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]), async (req, res) => {
  try {
    const data = req.body || {};
    const nome = String(data.nome || "").trim();
    if (!nome) return res.status(400).json({ error: "Nome da certificadora é obrigatório" });

    const existing = (await db.select().from(certifiers)).find((c) => c.nome.trim().toLowerCase() === nome.toLowerCase());
    if (existing) return res.json(existing);

    const created = (await db.insert(certifiers).values({
      nome,
      codigoRegistro: data.codigoRegistro || null,
      telefoneContato: data.telefoneContato || null,
      email: data.email || null,
      ativo: data.ativo !== undefined ? data.ativo : true,
    }).returning())[0];
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível cadastrar a certificadora" });
  }
});

router.put("/:id", requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.codigoRegistro !== undefined) updateData.codigoRegistro = data.codigoRegistro;
    if (data.telefoneContato !== undefined) updateData.telefoneContato = data.telefoneContato;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;

    const updated = await db.update(certifiers).set(updateData).where(eq(certifiers.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Certificadora não encontrada" });

    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível atualizar a certificadora" });
  }
});

router.delete("/:id", requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]), async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete: apenas desativa
    const updated = await db.update(certifiers).set({ ativo: false, updatedAt: new Date() }).where(eq(certifiers.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Certificadora não encontrada" });
    res.json({ message: "Certificadora desativada com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível desativar a certificadora" });
  }
});

export default router;
