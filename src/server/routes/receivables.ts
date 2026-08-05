import { Router } from "express";
import { db } from "../../db/index.js";
import {
  accounts_receivable, payments, receipts, proposals, service_orders,
  financial_entries, vessels,
} from "../../db/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";
import { requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";
import {
  serializeAccountReceivable, serializePayment, serializeReceipt,
} from "../serializers.js";

const router = Router();
const requireFinance = requirePermission([PERMISSIONS.FINANCEIRO_ADMINISTRACAO]);

// Helper: recalculate receivable status based on payments
async function recalcReceivable(arId: string) {
  const arList = await db.select().from(accounts_receivable).where(eq(accounts_receivable.id, arId));
  if (arList.length === 0) return;
  const ar = arList[0];
  const arPayments = await db.select().from(payments).where(eq(payments.contaReceberId, arId));
  const totalPaid = arPayments.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
  const original = Number(ar.valorOriginal) || 0;
  let status = "pendente";
  if (totalPaid >= original && original > 0) status = "pago";
  else if (totalPaid > 0) status = "parcial";
  await db.update(accounts_receivable).set({ status, updatedAt: new Date() }).where(eq(accounts_receivable.id, arId));
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
router.get("/", requireFinance, async (req: any, res: any) => {
  try {
    const all = await db.select().from(accounts_receivable).orderBy(desc(accounts_receivable.createdAt));
    const result = [];
    for (const ar of all) {
      const arPayments = await db.select().from(payments).where(eq(payments.contaReceberId, ar.id));
      const totalPaid = arPayments.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
      result.push(serializeAccountReceivable({ ...ar, valorPago: totalPaid }));
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- GET /api/receivables/:id ----------
router.get("/:id", requireFinance, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const arList = await db.select().from(accounts_receivable).where(eq(accounts_receivable.id, id));
    if (arList.length === 0) return res.status(404).json({ error: "Conta a receber não encontrada" });
    const ar = arList[0];
    const arPayments = await db.select().from(payments).where(eq(payments.contaReceberId, id)).orderBy(desc(payments.createdAt));
    const totalPaid = arPayments.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
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
    const arList = await db.select().from(accounts_receivable).where(eq(accounts_receivable.id, id));
    if (arList.length === 0) return res.status(404).json({ error: "Conta a receber não encontrada" });
    const ar = arList[0];

    const valor = Number(data.valor) || 0;
    const original = Number(ar.valorOriginal) || 0;
    if (valor <= 0) return res.status(400).json({ error: "Valor do pagamento deve ser maior que zero" });

    const arPayments = await db.select().from(payments).where(eq(payments.contaReceberId, id));
    const totalPaid = arPayments.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    if (totalPaid + valor > original) {
      return res.status(400).json({ error: "Soma dos pagamentos não pode superar o valor negociado" });
    }

    const inserted = await db.insert(payments).values({
      contaReceberId: id,
      propostaId: ar.propostaId,
      osId: ar.osId,
      embarcacaoId: ar.embarcacaoId,
      valor: valor.toString(),
      data: data.data || new Date().toISOString().split("T")[0],
      formaPagamento: data.formaPagamento || "PIX",
      observacao: data.observacao || "",
      lancadoPorNome: req.user?.nome || "Sistema",
    }).returning();

    // Also create a financial_entry for compatibility
    const prop = ar.propostaId
      ? (await db.select().from(proposals).where(eq(proposals.id, ar.propostaId!)))[0]
      : undefined;
    const vessel = ar.embarcacaoId
      ? (await db.select().from(vessels).where(eq(vessels.id, ar.embarcacaoId!)))[0]
      : undefined;
    await db.insert(financial_entries).values({
      embarcacaoId: ar.embarcacaoId,
      embarcacaoNome: vessel?.nome || prop?.embarcacaoNome || "Embarcação",
      clienteNome: vessel?.clienteNome || prop?.clienteNome || "",
      data: data.data || new Date().toISOString().split("T")[0],
      valor: valor.toString(),
      tipo: "parcela",
      formaPagamento: data.formaPagamento || "PIX",
      observacao: data.observacao || `Pagamento vinculado à proposta ${prop?.numero || ""}`,
      lancadoPorNome: req.user?.nome || "Sistema",
      propostaId: ar.propostaId,
      osId: ar.osId,
      contaReceberId: id,
    });

    // Update vessel valor_recebido
    if (ar.embarcacaoId) {
      await db.execute(sql`
        UPDATE vessels
        SET valor_recebido = (
          SELECT COALESCE(SUM(valor), 0) FROM financial_entries
          WHERE embarcacao_id = ${ar.embarcacaoId} AND tipo != 'despesa'
        )
        WHERE id = ${ar.embarcacaoId}
      `);
    }

    await recalcReceivable(id);

    res.json(serializePayment(inserted[0]));
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
