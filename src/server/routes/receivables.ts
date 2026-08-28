import { Router } from "express";
import { db } from "../../db/index.js";
import {
  accounts_receivable, payments, receipts, proposals, service_orders,
  financial_entries, vessels,
} from "../../db/schema.js";
import { eq, desc, and, sql, count, inArray } from "drizzle-orm";
import { requireAuth, requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";
import {
  serializeAccountReceivable, serializePayment, serializeReceipt,
} from "../serializers.js";
import { paidAmount, receivableStatus } from "../financial-balance.js";
import { reconcileOsReadiness } from "../delivery-workflow.js";
import { paginationMeta, parsePagination } from "../pagination.js";

const router = Router();
const requireFinance = requirePermission([PERMISSIONS.FINANCEIRO_ADMINISTRACAO]);

// Helper: recalculate receivable status based on payments
async function recalcReceivable(arId: string, tx: any = db) {
  const arList = await tx.select().from(accounts_receivable).where(eq(accounts_receivable.id, arId));
  if (arList.length === 0) return;
  const ar = arList[0];
  const arPayments = await tx.select().from(payments).where(eq(payments.contaReceberId, arId));
  const totalPaid = paidAmount(arPayments);
  const original = Number(ar.valorOriginal) || 0;
  const status = receivableStatus(original, arPayments);
  await tx.update(accounts_receivable).set({ status, updatedAt: new Date() }).where(eq(accounts_receivable.id, arId));
  return { totalPaid, original, status };
}

// Helper: generate receipt number REC-AAAA-000001
async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const all = await db.select().from(receipts);
  const prefix = `REC-${year}-`;
  const count = all.filter((r) => r.numero.startsWith(prefix)).length;
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}

// ---------- GET /api/receivables ----------
router.get("/", requireAuth, async (req: any, res: any) => {
  try {
    const all = await db.select().from(accounts_receivable).orderBy(desc(accounts_receivable.createdAt));
    const [allProposals, allOrders] = await Promise.all([
      db.select().from(proposals), db.select().from(service_orders),
    ]);
    const proposalsById = new Map(allProposals.map((proposal) => [proposal.id, proposal]));
    const ordersById = new Map(allOrders.map((order) => [order.id, order]));
    const result = [];
    for (const ar of all) {
      const arPayments = await db.select().from(payments).where(eq(payments.contaReceberId, ar.id));
      result.push(serializeAccountReceivable({
        ...ar,
        valorPago: paidAmount(arPayments),
        propostaNumero: proposalsById.get(ar.propostaId)?.numero,
        osNumero: ar.osId ? ordersById.get(ar.osId)?.numero : undefined,
      }));
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/list", requireAuth, async (req: any, res: any) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status && req.query.status !== 'todos' ? String(req.query.status) : undefined;
    const where = status ? eq(accounts_receivable.status, status) : undefined;
    const [rows, totalRows] = await Promise.all([
      db.select().from(accounts_receivable).where(where).orderBy(desc(accounts_receivable.createdAt), desc(accounts_receivable.id)).limit(limit).offset(offset),
      db.select({ total: count() }).from(accounts_receivable).where(where),
    ]);
    const [allProposals, allOrders] = await Promise.all([db.select().from(proposals), db.select().from(service_orders)]);
    const proposalsById = new Map(allProposals.map((proposal) => [proposal.id, proposal]));
    const ordersById = new Map(allOrders.map((order) => [order.id, order]));
    const ids = rows.map((row) => row.id);
    const paymentRows = ids.length ? await db.select().from(payments).where(inArray(payments.contaReceberId, ids)) : [];
    const paymentsByAccount = new Map<string, typeof paymentRows>();
    for (const payment of paymentRows) {
      if (!payment.contaReceberId) continue;
      const list = paymentsByAccount.get(payment.contaReceberId) || [];
      list.push(payment);
      paymentsByAccount.set(payment.contaReceberId, list);
    }
    res.json({
      items: rows.map((row) => serializeAccountReceivable({ ...row, valorPago: paidAmount(paymentsByAccount.get(row.id) || []), propostaNumero: proposalsById.get(row.propostaId)?.numero, osNumero: row.osId ? ordersById.get(row.osId)?.numero : undefined })),
      pagination: paginationMeta(page, limit, Number(totalRows[0]?.total || 0)),
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'INVALID_PAGE' || error.message === 'INVALID_LIMIT')) return res.status(400).json({ error: 'Parâmetros de paginação inválidos.' });
    console.error(error);
    res.status(500).json({ error: 'Não foi possível carregar as contas a receber.' });
  }
});

// ---------- GET /api/receivables/:id ----------
router.get("/:id", requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const arList = await db.select().from(accounts_receivable).where(eq(accounts_receivable.id, id));
    if (arList.length === 0) return res.status(404).json({ error: "Conta a receber não encontrada" });
    const ar = arList[0];
    const arPayments = await db.select().from(payments).where(eq(payments.contaReceberId, id)).orderBy(desc(payments.createdAt));
    const totalPaid = paidAmount(arPayments);
    res.json({
      ...serializeAccountReceivable({ ...ar, valorPago: totalPaid }),
      pagamentos: arPayments.map(serializePayment),
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/receivables/:id/payments ----------
router.post("/:id/payments", requireFinance, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const valor = Number(data.valor) || 0;
    if (valor <= 0) return res.status(400).json({ error: "Valor do pagamento deve ser maior que zero" });
    const result = await db.transaction(async (tx) => {
      // Serializes simultaneous payments for the same receivable.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${id}))`);
      const ar = (await tx.select().from(accounts_receivable).where(eq(accounts_receivable.id, id)))[0];
      if (!ar) return { error: "Conta a receber não encontrada", status: 404 };
      const arPayments = await tx.select().from(payments).where(eq(payments.contaReceberId, id));
      if (paidAmount(arPayments) + valor > (Number(ar.valorOriginal) || 0) + 0.009) {
        return { error: "Soma dos pagamentos não pode superar o valor negociado", status: 400 };
      }
      const [prop, vessel] = await Promise.all([
        ar.propostaId ? tx.select().from(proposals).where(eq(proposals.id, ar.propostaId)).then((rows: any[]) => rows[0]) : undefined,
        ar.embarcacaoId ? tx.select().from(vessels).where(eq(vessels.id, ar.embarcacaoId)).then((rows: any[]) => rows[0]) : undefined,
      ]);
      const insertedEntries: any[] = await tx.insert(financial_entries).values({
        embarcacaoId: ar.embarcacaoId, embarcacaoNome: vessel?.nome || prop?.embarcacaoNome || "Embarcação",
        clienteNome: vessel?.clienteNome || prop?.clienteNome || "", data: data.data || new Date().toISOString().split("T")[0],
        valor: valor.toString(), tipo: data.tipo || "parcela", natureza: "entrada", formaPagamento: data.formaPagamento || "PIX",
        observacao: data.observacao || `Pagamento vinculado à proposta ${prop?.numero || ""}`,
        lancadoPorNome: req.user?.nome || "Sistema", propostaId: ar.propostaId, osId: ar.osId, contaReceberId: id,
        notaFiscalNumero: data.notaFiscalNumero, notaFiscalNome: data.notaFiscalNome, notaFiscalUrl: data.notaFiscalUrl,
        situacaoConciliacao: "conciliado",
      }).returning() as any;
      const entry = insertedEntries[0];
      const insertedPayments: any[] = await tx.insert(payments).values({
        contaReceberId: id, propostaId: ar.propostaId, osId: ar.osId, embarcacaoId: ar.embarcacaoId,
        financialEntryId: entry.id, valor: valor.toString(), data: data.data || new Date().toISOString().split("T")[0],
        formaPagamento: data.formaPagamento || "PIX", observacao: data.observacao || "", lancadoPorNome: req.user?.nome || "Sistema",
      }).returning() as any;
      const payment = insertedPayments[0];
      await recalcReceivable(id, tx);
      if (ar.embarcacaoId) await tx.execute(sql`
        UPDATE vessels SET valor_recebido = COALESCE((SELECT SUM(valor) FROM payments WHERE embarcacao_id = ${ar.embarcacaoId} AND ativo = TRUE), 0)
        WHERE id = ${ar.embarcacaoId}`);
      if (ar.osId) await reconcileOsReadiness(ar.osId, tx, req.user);
      return { payment, entry };
    });
    if ("error" in result) return res.status(result.status).json({ error: result.error });
    res.status(201).json({ payment: serializePayment(result.payment), financialEntry: result.entry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/payments/:id/receipt ----------
router.post("/payments/:id/receipt", requireFinance, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const payList = await db.select().from(payments).where(eq(payments.id, id));
    if (payList.length === 0) return res.status(404).json({ error: "Pagamento não encontrado" });
    const pay = payList[0];

    // Check if receipt already exists for this payment
    const existing = await db.select().from(receipts).where(eq(receipts.paymentId, id));
    if (existing.length > 0) {
      return res.json(serializeReceipt(existing[0]));
    }

    const numero = await generateReceiptNumber();
    const inserted = await db.insert(receipts).values({
      numero,
      dataEmissao: new Date().toISOString().split("T")[0],
      emissorNome: req.user?.nome || "Sistema",
      paymentId: id,
      contaReceberId: pay.contaReceberId,
      status: "ativo",
    }).returning();

    res.json(serializeReceipt(inserted[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
