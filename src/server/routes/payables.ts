import { Router } from "express";
import { db } from "../../db/index.js";
import { accounts_payable, financial_categories, financial_entries, financial_suppliers, vessels } from "../../db/schema.js";
import { desc, eq, sql } from "drizzle-orm";
import { requireAuth, requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";

const router = Router();
const requireFinance = requirePermission([PERMISSIONS.FINANCEIRO_ADMINISTRACAO]);
const safe = (handler: (req: any, res: any) => Promise<unknown>) => async (req: any, res: any) => {
  try { await handler(req, res); }
  catch (error) {
    console.error("Erro na operação de contas a pagar:", error);
    if (!res.headersSent) res.status(500).json({ error: "Não foi possível concluir a operação financeira." });
  }
};

async function summary(id: string) {
  const account = (await db.select().from(accounts_payable).where(eq(accounts_payable.id, id)))[0];
  if (!account) return null;
  const rows = await db.select({ total: sql<string>`COALESCE(SUM(${financial_entries.valor}), 0)` })
    .from(financial_entries).where(eq(financial_entries.contaPagarId, id));
  const paid = Number(rows[0]?.total || 0);
  const original = Number(account.valorOriginal || 0);
  const status = paid >= original && original > 0 ? "pago" : paid > 0 ? "parcial" : account.status === "cancelado" ? "cancelado" : "pendente";
  if (status !== account.status) await db.update(accounts_payable).set({ status, updatedAt: new Date() }).where(eq(accounts_payable.id, id));
  return { ...account, valorOriginal: original, valorPago: paid, saldo: Math.max(0, original - paid), status };
}

router.get("/categories", requireAuth, safe(async (_req, res) => {
  res.json(await db.select().from(financial_categories).where(eq(financial_categories.ativo, true)).orderBy(financial_categories.nome));
}));

router.get("/suppliers", requireAuth, safe(async (_req, res) => {
  res.json(await db.select().from(financial_suppliers).where(eq(financial_suppliers.ativo, true)).orderBy(financial_suppliers.nome));
}));

router.post("/suppliers", requireFinance, safe(async (req: any, res) => {
  const data = req.body || {};
  if (!String(data.nome || "").trim()) return res.status(400).json({ error: "Nome do fornecedor é obrigatório" });
  const row = (await db.insert(financial_suppliers).values({ nome: data.nome.trim(), documento: data.documento, email: data.email, telefone: data.telefone }).returning())[0];
  res.status(201).json(row);
}));

router.get("/", requireAuth, safe(async (_req, res) => {
  const rows = await db.select().from(accounts_payable).orderBy(desc(accounts_payable.createdAt));
  const result = [];
  for (const row of rows) result.push(await summary(row.id));
  res.json(result.filter(Boolean));
}));

router.post("/", requireFinance, safe(async (req: any, res) => {
  const data = req.body || {};
  const valor = Number(data.valorOriginal);
  if (!String(data.descricao || "").trim() || !Number.isFinite(valor) || valor <= 0) return res.status(400).json({ error: "Descrição e valor positivo são obrigatórios" });
  const row = (await db.insert(accounts_payable).values({
    fornecedorId: data.fornecedorId || null,
    categoriaId: data.categoriaId || null,
    embarcacaoId: data.embarcacaoId || null,
    descricao: data.descricao.trim(), valorOriginal: valor.toFixed(2), vencimento: data.vencimento, competencia: data.competencia,
  }).returning())[0];
  res.status(201).json(await summary(row.id));
}));

router.post("/:id/payments", requireFinance, safe(async (req: any, res) => {
  const account = await summary(req.params.id);
  if (!account) return res.status(404).json({ error: "Conta a pagar não encontrada" });
  const valor = Number(req.body?.valor);
  if (!Number.isFinite(valor) || valor <= 0 || valor > (account.saldo || 0)) return res.status(400).json({ error: "Valor de baixa inválido" });
  const vessel = account.embarcacaoId ? (await db.select().from(vessels).where(eq(vessels.id, account.embarcacaoId)))[0] : undefined;
  const inserted = (await db.insert(financial_entries).values({
    embarcacaoId: account.embarcacaoId || null, embarcacaoNome: vessel?.nome || "Despesa da empresa", clienteNome: vessel?.clienteNome || "",
    data: req.body?.data || new Date().toISOString().slice(0, 10), valor: valor.toFixed(2), tipo: "despesa", natureza: "saida",
    formaPagamento: req.body?.formaPagamento || "PIX", observacao: req.body?.observacao || account.descricao, lancadoPorNome: req.user?.nome || "Sistema",
    contaPagarId: account.id, categoriaId: account.categoriaId || null, fornecedorId: account.fornecedorId || null,
    competencia: account.competencia, vencimento: account.vencimento,
  }).returning())[0];
  res.status(201).json({ entry: inserted, account: await summary(account.id) });
}));

router.post("/:id/cancel", requireFinance, safe(async (req: any, res) => {
  if (!String(req.body?.motivo || "").trim()) return res.status(400).json({ error: "Motivo obrigatório" });
  const updated = (await db.update(accounts_payable).set({ status: "cancelado", updatedAt: new Date() }).where(eq(accounts_payable.id, req.params.id)).returning())[0];
  if (!updated) return res.status(404).json({ error: "Conta a pagar não encontrada" });
  res.json(await summary(updated.id));
}));

export default router;
