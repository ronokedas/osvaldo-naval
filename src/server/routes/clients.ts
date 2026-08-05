import { Router } from "express";
import { db } from "../../db/index.js";
import { clients } from "../../db/schema.js";
import { asc } from "drizzle-orm";
import { requireAuth, requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    res.json(await db.select().from(clients).orderBy(asc(clients.nome)));
  } catch {
    res.status(500).json({ error: "Não foi possível carregar os clientes" });
  }
});

router.post("/", requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]), async (req, res) => {
  try {
    const data = req.body || {};
    const nome = String(data.nome || "").trim();
    if (!nome) return res.status(400).json({ error: "Nome do cliente é obrigatório" });

    const existing = (await db.select().from(clients)).find((client) => client.nome.trim().toLowerCase() === nome.toLowerCase());
    if (existing) return res.json(existing);

    const created = (await db.insert(clients).values({
      nome,
      email: data.email || null,
      telefone: data.telefone || null,
      cnpjCpf: data.cnpjCpf || null,
      endereco: data.endereco || null,
    }).returning())[0];
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: "Não foi possível cadastrar o cliente" });
  }
});

export default router;
