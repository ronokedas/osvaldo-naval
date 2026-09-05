import { Router } from "express";
import { db } from "../../db/index.js";
import { clients } from "../../db/schema.js";
import { asc, desc, eq, ilike, or, count } from "drizzle-orm";
import { requireAuth, requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";
import { paginationMeta, parsePagination } from "../pagination.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    res.json(await db.select().from(clients).orderBy(asc(clients.nome)));
  } catch {
    res.status(500).json({ error: "Não foi possível carregar os clientes" });
  }
});

// Paginated collection for large administrative lists. The legacy GET above
// intentionally remains an array for existing consumers.
router.get("/list", requireAuth, async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const q = String(req.query.q || '').trim();
    const where = q
      ? or(
          ilike(clients.nome, `%${q}%`),
          ilike(clients.responsavel, `%${q}%`),
          ilike(clients.email, `%${q}%`),
          ilike(clients.cnpjCpf, `%${q}%`)
        )
      : undefined;
    const [items, totalRows] = await Promise.all([
      db.select().from(clients).where(where).orderBy(asc(clients.nome), desc(clients.id)).limit(limit).offset(offset),
      db.select({ total: count() }).from(clients).where(where),
    ]);
    res.json({ items, pagination: paginationMeta(page, limit, Number(totalRows[0]?.total || 0)) });
  } catch (error) {
    if (error instanceof Error && (error.message === 'INVALID_PAGE' || error.message === 'INVALID_LIMIT')) return res.status(400).json({ error: 'Parâmetros de paginação inválidos.' });
    res.status(500).json({ error: 'Não foi possível carregar os clientes' });
  }
});

router.post("/", requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]), async (req, res) => {
  try {
    const data = req.body || {};
    const nome = String(data.nome || "").trim();
    if (!nome) return res.status(400).json({ error: "Nome do cliente é obrigatório" });

    // Validate CPF/CNPJ if provided
    const cnpjCpf = data.cnpjCpf ? String(data.cnpjCpf).replace(/\D/g, "") : null;
    if (cnpjCpf) {
      const isValid = cnpjCpf.length === 11 ? validateCPF(cnpjCpf) : cnpjCpf.length === 14 ? validateCNPJ(cnpjCpf) : false;
      if (!isValid) {
        return res.status(400).json({ error: "CPF/CNPJ inválido. Por favor, verifique os números digitados." });
      }
    }

    const existing = (await db.select().from(clients)).find((client) => client.nome.trim().toLowerCase() === nome.toLowerCase());
    if (existing) return res.json(existing);

    const created = (await db.insert(clients).values({
      nome,
      responsavel: data.responsavel ? String(data.responsavel).trim() : null,
      email: data.email || null,
      telefone: data.telefone || null,
      whatsapp: data.whatsapp || null,
      cnpjCpf: cnpjCpf || null,
      endereco: data.endereco || null,
    }).returning())[0];
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: "Não foi possível cadastrar o cliente" });
  }
});

router.put("/:id", requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]), async (req, res) => {
  try {
    const data = req.body || {};
    const nome = String(data.nome || "").trim();
    if (!nome) return res.status(400).json({ error: "Nome do cliente é obrigatório" });
    const cnpjCpf = data.cnpjCpf ? String(data.cnpjCpf).replace(/\D/g, "") : null;
    if (cnpjCpf && !(cnpjCpf.length === 11 ? validateCPF(cnpjCpf) : cnpjCpf.length === 14 ? validateCNPJ(cnpjCpf) : false)) return res.status(400).json({ error: "CPF/CNPJ inválido. Por favor, verifique os números digitados." });
    
    const updated = await db.update(clients).set({
      nome,
      responsavel: data.responsavel !== undefined ? (data.responsavel ? String(data.responsavel).trim() : null) : undefined,
      email: data.email || null,
      telefone: data.telefone || null,
      whatsapp: data.whatsapp || null,
      cnpjCpf,
      endereco: data.endereco || null,
      updatedAt: new Date()
    }).where(eq(clients.id, req.params.id)).returning();
    
    if (!updated.length) return res.status(404).json({ error: "Cliente não encontrado" });
    res.json(updated[0]);
  } catch {
    res.status(500).json({ error: "Não foi possível atualizar o cliente" });
  }
});

// CPF validation algorithm
function validateCPF(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let dv1 = 11 - (sum % 11);
  if (dv1 >= 10) dv1 = 0;
  if (parseInt(cpf[9]) !== dv1) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  let dv2 = 11 - (sum % 11);
  if (dv2 >= 10) dv2 = 0;
  if (parseInt(cpf[10]) !== dv2) return false;
  
  return true;
}

// CNPJ validation algorithm
function validateCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  
  let weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weights[i];
  }
  let dv1 = sum % 11;
  dv1 = dv1 < 2 ? 0 : 11 - dv1;
  if (parseInt(cnpj[12]) !== dv1) return false;
  
  weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weights[i];
  }
  let dv2 = sum % 11;
  dv2 = dv2 < 2 ? 0 : 11 - dv2;
  if (parseInt(cnpj[13]) !== dv2) return false;
  
  return true;
}

export default router;
