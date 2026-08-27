import { Router } from "express";
import { db } from "../../db/index.js";
import { financial_entries, vessels, financial_attachments, notifications, users, clients, financial_categories, financial_suppliers, accounts_receivable, accounts_payable, payments } from "../../db/schema.js";
import { eq, desc, sql, and, or } from "drizzle-orm";
import { requireAdminAccess } from "../middleware/requireFinanceRole.js";
import { requireAuth, requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";
import { serializeFinancialEntry } from "../serializers.js";
import { 
  calculateFinancialStatus, 
  validateNfUnique, 
  validateMonetaryValue,
  generateFinancialCSV,
  notifyFinancialUpdate 
} from "../../utils/financial-utils.js";
import { paidAmount, receivableBalance } from "../financial-balance.js";
import { isValidEmailAddress, sendEmail } from "../mailer.js";

const router = Router();
router.use(requireAuth);
const requireFinanceWrite = requirePermission([PERMISSIONS.FINANCEIRO_ADMINISTRACAO]);

// GET - Resumo financeiro consolidado. Os saldos de recebíveis e pagamentos
// vêm das mesmas tabelas usadas pelas rotas de propostas e de baixa.
router.get("/summary", async (_req, res) => {
  try {
    const [entries, receivableRows, payableRows] = await Promise.all([
      db.select().from(financial_entries),
      db.select().from(accounts_receivable),
      db.select().from(accounts_payable),
    ]);
    const activeReceivables = receivableRows.filter((account) => account.status !== "cancelado");
    const receivablePayments = await db.select().from(payments).where(eq(payments.ativo, true));
    const paymentsByAccount = new Map<string, typeof receivablePayments>();
    for (const payment of receivablePayments) {
      if (!payment.contaReceberId) continue;
      const current = paymentsByAccount.get(payment.contaReceberId) || [];
      current.push(payment);
      paymentsByAccount.set(payment.contaReceberId, current);
    }
    const today = new Date().toISOString().slice(0, 10);
    const balances = activeReceivables.map((account) => ({
      account,
      paid: paidAmount(paymentsByAccount.get(account.id) || []),
      balance: receivableBalance(account.valorOriginal, paymentsByAccount.get(account.id) || []),
    }));
    const openPayables = payableRows.filter((account) => account.status !== "cancelado");
    const payablePayments = entries.filter((entry) => entry.contaPagarId && entry.tipo === "despesa");
    const payablePaid = new Map<string, number>();
    for (const entry of payablePayments) payablePaid.set(entry.contaPagarId!, (payablePaid.get(entry.contaPagarId!) || 0) + Number(entry.valor || 0));
    const payableBalance = (account: typeof payableRows[number]) => Math.max(0, Number(account.valorOriginal || 0) - (payablePaid.get(account.id) || 0));
    const totalReceived = balances.reduce((sum, item) => sum + item.paid, 0);
    const totalToReceive = balances.reduce((sum, item) => sum + item.balance, 0);
    const totalExpenses = entries.filter((entry) => entry.tipo === "despesa" && entry.isStorno !== true).reduce((sum, entry) => sum + Number(entry.valor || 0), 0);
    res.json({
      totalBilled: activeReceivables.reduce((sum, account) => sum + Number(account.valorOriginal || 0), 0),
      totalReceived,
      totalToReceive,
      totalExpenses,
      netProfit: totalReceived - totalExpenses,
      receivablesCount: activeReceivables.length,
      pendingReceivablesCount: balances.filter((item) => item.balance > 0.009).length,
      overdueReceivablesCount: balances.filter((item) => {
        const dueDate = (item.account as typeof item.account & { vencimento?: string }).vencimento;
        return item.balance > 0.009 && dueDate && dueDate < today;
      }).length,
      payablesOpen: openPayables.reduce((sum, account) => sum + payableBalance(account), 0),
      payablesPaid: payableRows.reduce((sum, account) => sum + (payablePaid.get(account.id) || 0), 0),
      payablesOverdueCount: openPayables.filter((account) => payableBalance(account) > 0.009 && account.vencimento && account.vencimento < today).length,
      payablesCount: payableRows.length,
    });
  } catch (error) {
    console.error("Erro ao carregar resumo financeiro:", error);
    res.status(500).json({ error: "Não foi possível carregar o resumo financeiro." });
  }
});

// GET - Listar todos os lançamentos financeiros
router.get("/", async (req, res) => {
  try {
    const { embarcacaoId, osId, tipo, dataInicio, dataFim, search } = req.query;
    
    const conditions: any[] = [];
    
    if (embarcacaoId) conditions.push(eq(financial_entries.embarcacaoId, embarcacaoId as string));
    if (osId) conditions.push(eq(financial_entries.osId, osId as string));
    if (tipo) conditions.push(eq(financial_entries.tipo, tipo as string));
    if (dataInicio && dataFim) {
      conditions.push(sql`${financial_entries.data} BETWEEN ${dataInicio} AND ${dataFim}`);
    }
    if (search) {
      conditions.push(or(
        sql`${financial_entries.embarcacaoNome} ILIKE ${`%${search}%`}`,
        sql`${financial_entries.clienteNome} ILIKE ${`%${search}%`}`,
        sql`${financial_entries.notaFiscalNumero} ILIKE ${`%${search}%`}`
      ));
    }

    const all = await db.select()
      .from(financial_entries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(financial_entries.createdAt));
    
    res.json(all.map(serializeFinancialEntry));
  } catch (error) {
    console.error("Erro ao buscar lançamentos financeiros:", error);
    res.status(500).json({ 
      error: "Erro ao buscar lançamentos", 
      message: "Não foi possível recuperar os dados financeiros. Tente novamente."
    });
  }
});

// POST - Enviar o PDF de um recibo para o cliente proprietário da embarcação.
router.post("/:id/send-receipt-email", requireFinanceWrite, async (req, res) => {
  try {
    const entry = (await db.select().from(financial_entries).where(eq(financial_entries.id, req.params.id)))[0];
    if (!entry) return res.status(404).json({ error: "Lançamento financeiro não encontrado." });
    if (entry.natureza === "saida" || entry.tipo === "despesa") return res.status(400).json({ error: "Recibos por e-mail estão disponíveis somente para recebimentos." });

    const vessel = entry.embarcacaoId
      ? (await db.select().from(vessels).where(eq(vessels.id, entry.embarcacaoId)))[0]
      : null;
    const client = vessel?.clienteId
      ? (await db.select().from(clients).where(eq(clients.id, vessel.clienteId)))[0]
      : null;
    const recipientEmail = String(req.body?.destinatarioEmail || client?.email || vessel?.emailContato || "").trim();
    if (!isValidEmailAddress(recipientEmail)) return res.status(422).json({ error: "O cliente proprietário da embarcação não possui um e-mail válido cadastrado." });

    const encoded = String(req.body?.pdfBase64 || "");
    const base64Data = encoded.includes("base64,") ? encoded.split("base64,")[1] : encoded;
    if (!base64Data) return res.status(400).json({ error: "O PDF do recibo é obrigatório." });
    const receiptNumber = entry.reciboNumero || `REC-${entry.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`;
    const result = await sendEmail({
      to: recipientEmail,
      subject: `Recibo ${receiptNumber} - Nautilus Projetos Navais`,
      text: `Prezado(a), segue em anexo o recibo ${receiptNumber} referente à embarcação ${entry.embarcacaoNome || vessel?.nome || ""}.`,
      attachments: [{
        filename: String(req.body?.filename || `Recibo_${receiptNumber.replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`),
        content: Buffer.from(base64Data, "base64"),
        contentType: "application/pdf",
      }],
    });
    if (!result.ok) return res.status(502).json({ error: result.error || "Não foi possível enviar o recibo por e-mail." });
    res.json({ ok: true, recipientEmail });
  } catch (error) {
    console.error("Erro ao enviar recibo por e-mail:", error);
    res.status(500).json({ error: "Não foi possível enviar o recibo por e-mail." });
  }
});

// GET - Exportar CSV
router.get("/export/csv", requireFinanceWrite, async (req, res) => {
  try {
    const entries = await db.select().from(financial_entries).orderBy(desc(financial_entries.createdAt));
    
    const csv = generateFinancialCSV(entries.map(serializeFinancialEntry));
    
    res.setHeader("Content-Type", "text/csv;charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="financeiro_${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    res.status(500).json({ 
      error: "Erro ao exportar CSV", 
      message: "Não foi possível gerar o arquivo CSV."
    });
  }
});

// POST - Criar novo lançamento financeiro
router.post("/", requireFinanceWrite, async (req, res) => {
  try {
    const data = req.body;
    const user = (req as any).user;

    if ((data.natureza === "entrada" || data.tipo !== "despesa") && data.contaReceberId) {
      return res.status(409).json({
        error: "Baixa vinculada deve usar a conta a receber",
        message: "Registre pagamentos de proposta pela rota de contas a receber para manter a OS sincronizada.",
      });
    }
    
    // Validar valor monetário
    const monetaryValidation = validateMonetaryValue(data.valor);
    if (!monetaryValidation.valid) {
      return res.status(400).json({ 
        error: "Valor inválido", 
        message: monetaryValidation.error 
      });
    }
    
    // Validar unicidade da NF se fornecida
    if (data.notaFiscalNumero && data.issuerId) {
      const nfValidation = await validateNfUnique(
        data.notaFiscalNumero,
        data.issuerId,
        data.nfSeries
      );
      
      if (!nfValidation.valid) {
        return res.status(409).json({ 
          error: "Nota Fiscal duplicada", 
          message: nfValidation.message 
        });
      }
    }
    
    // Validar estorno
    if (data.isStorno && !data.stornoReason) {
      return res.status(400).json({ 
        error: "Motivo obrigatório", 
        message: "É necessário informar o motivo do estorno." 
      });
    }
    
    if (data.isStorno && !data.originalPaymentId) {
      return res.status(400).json({ 
        error: "Pagamento original obrigatório", 
        message: "É necessário informar qual pagamento está sendo estornado." 
      });
    }
    
    const result = await db.transaction(async (tx) => {
      let categoriaId = data.categoriaId || null;
      let fornecedorId = data.fornecedorId || null;
      if (!categoriaId && data.categoriaNome) {
        const category = (await tx.insert(financial_categories).values({ nome: String(data.categoriaNome), natureza: data.natureza === "saida" ? "despesa" : "receita" }).onConflictDoNothing().returning())[0];
        categoriaId = category?.id || (await tx.select().from(financial_categories).where(eq(financial_categories.nome, String(data.categoriaNome))))[0]?.id || null;
      }
      if (!fornecedorId && data.fornecedorNome) {
        const supplier = (await tx.insert(financial_suppliers).values({ nome: String(data.fornecedorNome) }).returning())[0];
        fornecedorId = supplier?.id || null;
      }
      const inserted = await tx.insert(financial_entries).values({
        embarcacaoId: data.embarcacaoId,
        embarcacaoNome: data.embarcacaoNome,
        clienteNome: data.clienteNome,
        data: data.data || new Date().toISOString().split("T")[0],
        valor: data.valor.toString(),
        tipo: data.tipo,
        formaPagamento: data.formaPagamento,
        observacao: data.observacao,
        lancadoPorNome: user?.nome || data.lancadoPorNome,
        notaFiscalNumero: data.notaFiscalNumero,
        notaFiscalNome: data.notaFiscalNome,
        notaFiscalUrl: data.notaFiscalUrl,
        nfSeries: data.nfSeries,
        issuerId: data.issuerId,
        reciboNumero: data.reciboNumero,
        comprovanteDespesaUrl: data.comprovanteDespesaUrl,
        propostaId: data.propostaId,
        osId: data.osId,
        contaReceberId: data.contaReceberId,
        contaPagarId: data.contaPagarId,
        categoriaId,
        fornecedorId,
        natureza: data.natureza || (data.tipo === "despesa" ? "saida" : "entrada"),
        competencia: data.competencia,
        vencimento: data.vencimento,
        isStorno: data.isStorno || false,
        stornoReason: data.stornoReason,
        originalPaymentId: data.originalPaymentId,
        situacaoConciliacao: data.situacaoConciliacao || ((data.natureza || (data.tipo === "despesa" ? "saida" : "entrada")) === "entrada" && data.embarcacaoId ? "requer_conciliacao" : "conciliado"),
        notificationSent: false
      }).returning();
      
      const newEntry = inserted[0];
      
      // Processar anexos se fornecidos
      if (data.anexos && Array.isArray(data.anexos) && data.anexos.length > 0) {
        for (const anexo of data.anexos) {
          await tx.insert(financial_attachments).values({
            transactionId: newEntry.id,
            fileUrl: anexo.fileUrl,
            fileName: anexo.fileName,
            fileSize: anexo.fileSize,
            mimeType: anexo.mimeType,
            documentType: anexo.documentType || "outro",
            documentNumber: anexo.documentNumber,
            series: anexo.series,
            uploadedBy: user?.id,
            uploadedByName: user?.nome
          });
        }
      }
      
      // Atualizar status financeiro automaticamente (trigger faz isso, mas podemos notificar)
      if (newEntry.embarcacaoId && data.tipo !== "despesa") {
        await notifyFinancialUpdate(
          newEntry.id,
          data.isStorno ? "STORNO" : "PAYMENT_RECEIVED",
          user?.id,
          user?.nome
        );
        
        // Marcar notificação como enviada
        await tx.update(financial_entries)
          .set({ notificationSent: true })
          .where(eq(financial_entries.id, newEntry.id));
      }

      return newEntry;
    });
    
    res.status(201).json(serializeFinancialEntry(result));
  } catch (error: any) {
    console.error("Erro ao criar lançamento financeiro:", error);
    
    if (error.code === "23505") { // Unique violation
      return res.status(409).json({ 
        error: "Duplicidade", 
        message: "Já existe um lançamento com estes dados." 
      });
    }
    
    res.status(500).json({ 
      error: "Erro ao criar lançamento", 
      message: "Não foi possível salvar o lançamento financeiro. Verifique os dados e tente novamente." 
    });
  }
});

// PUT - Atualizar lançamento financeiro
router.put("/:id", requireFinanceWrite, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const user = (req as any).user;
    
    // Buscar lançamento existente
    const existing = await db.query.financial_entries.findFirst({
      where: eq(financial_entries.id, id)
    });
    
    if (!existing) {
      return res.status(404).json({ 
        error: "Não encontrado", 
        message: "Lançamento financeiro não encontrado." 
      });
    }

    if (existing.contaReceberId && (data.valor !== undefined || data.tipo !== undefined || data.natureza !== undefined || data.isStorno !== undefined)) {
      return res.status(409).json({
        error: "Pagamento vinculado protegido",
        message: "Altere ou estorne o pagamento pela conta a receber para manter o saldo da OS consistente.",
      });
    }
    
    // Validar valor monetário se fornecido
    if (data.valor !== undefined) {
      const monetaryValidation = validateMonetaryValue(data.valor);
      if (!monetaryValidation.valid) {
        return res.status(400).json({ 
          error: "Valor inválido", 
          message: monetaryValidation.error 
        });
      }
    }
    
    // Validar unicidade da NF se alterada
    if (data.notaFiscalNumero && data.issuerId) {
      const nfValidation = await validateNfUnique(
        data.notaFiscalNumero,
        data.issuerId,
        data.nfSeries,
        id // Excluir o atual da validação
      );
      
      if (!nfValidation.valid) {
        return res.status(409).json({ 
          error: "Nota Fiscal duplicada", 
          message: nfValidation.message 
        });
      }
    }
    
    const updateData: any = { 
      updatedAt: new Date(),
      notificationSent: false // Resetar para reenviar notificação
    };
    
    if (data.valor !== undefined) updateData.valor = data.valor.toString();
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.formaPagamento !== undefined) updateData.formaPagamento = data.formaPagamento;
    if (data.observacao !== undefined) updateData.observacao = data.observacao;
    if (data.notaFiscalNumero !== undefined) updateData.notaFiscalNumero = data.notaFiscalNumero;
    if (data.notaFiscalNome !== undefined) updateData.notaFiscalNome = data.notaFiscalNome;
    if (data.notaFiscalUrl !== undefined) updateData.notaFiscalUrl = data.notaFiscalUrl;
    if (data.natureza !== undefined) updateData.natureza = data.natureza;
    if (data.competencia !== undefined) updateData.competencia = data.competencia;
    if (data.vencimento !== undefined) updateData.vencimento = data.vencimento;
    if (data.nfSeries !== undefined) updateData.nfSeries = data.nfSeries;
    if (data.issuerId !== undefined) updateData.issuerId = data.issuerId;
    if (data.isStorno !== undefined) updateData.isStorno = data.isStorno;
    if (data.stornoReason !== undefined) updateData.stornoReason = data.stornoReason;
    
    const result = await db.transaction(async (tx) => {
      const updated = await tx.update(financial_entries)
        .set(updateData)
        .where(eq(financial_entries.id, id))
        .returning();
      
      if (updated.length === 0) return null;
      
      const entry = updated[0];
      
      // Disparar notificação se NF foi anexada/atualizada
      if (data.notaFiscalNumero && data.notaFiscalNumero !== existing.notaFiscalNumero) {
        await notifyFinancialUpdate(entry.id, "NF_ATTACHED", user?.id, user?.nome);
      }
      
      return entry;
    });
    
    if (!result) {
      return res.status(404).json({ 
        error: "Não encontrado", 
        message: "Lançamento não encontrado ou não pôde ser atualizado." 
      });
    }
    
    res.json(serializeFinancialEntry(result));
  } catch (error: any) {
    console.error("Erro ao atualizar lançamento financeiro:", error);
    
    if (error.code === "23505") {
      return res.status(409).json({ 
        error: "Duplicidade", 
        message: "Já existe uma Nota Fiscal com este número para este emitente." 
      });
    }
    
    res.status(500).json({ 
      error: "Erro ao atualizar", 
      message: "Não foi possível atualizar o lançamento. Tente novamente." 
    });
  }
});

// DELETE - Excluir lançamento financeiro (apenas admin)
router.delete("/:id", requireAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    // Verificar se existe
    const existing = await db.query.financial_entries.findFirst({
      where: eq(financial_entries.id, id)
    });
    
    if (!existing) {
      return res.status(404).json({ 
        error: "Não encontrado", 
        message: "Lançamento financeiro não encontrado." 
      });
    }

    if (existing.contaReceberId) {
      return res.status(409).json({
        error: "Pagamento vinculado protegido",
        message: "Pagamentos vinculados não podem ser excluídos pelo histórico financeiro; use estorno auditável.",
      });
    }
    
    await db.transaction(async (tx) => {
      // Primeiro excluir anexos (cascade já faria, mas explicitamos)
      await tx.delete(financial_attachments).where(eq(financial_attachments.transactionId, id));
      
      // Excluir lançamento
      await tx.delete(financial_entries).where(eq(financial_entries.id, id));
    });
    
    res.json({ 
      success: true, 
      message: `Lançamento financeiro excluído por ${user.nome}.` 
    });
  } catch (error: any) {
    console.error("Erro ao excluir lançamento financeiro:", error);
    
    res.status(500).json({ 
      error: "Erro ao excluir", 
      message: "Não foi possível excluir o lançamento. Tente novamente." 
    });
  }
});

// GET - Buscar status financeiro de uma embarcação/OS
router.get("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    
    const status = await calculateFinancialStatus(id, (type as "os" | "embarcacao") || "embarcacao");
    
    res.json(status);
  } catch (error) {
    console.error("Erro ao calcular status financeiro:", error);
    res.status(500).json({ 
      error: "Erro ao calcular status", 
      message: "Não foi possível calcular o status financeiro." 
    });
  }
});

export default router;
