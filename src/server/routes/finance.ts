import { Router } from "express";
import { db } from "../../db/index.js";
import { financial_entries, vessels, financial_attachments, notifications, users, clients } from "../../db/schema.js";
import { eq, desc, sql, and, or } from "drizzle-orm";
import { requireFinanceAccess, requireAdminAccess } from "../middleware/requireFinanceRole.js";
import { serializeFinancialEntry } from "../serializers.js";
import { 
  calculateFinancialStatus, 
  validateNfUnique, 
  validateMonetaryValue,
  generateFinancialCSV,
  notifyFinancialUpdate 
} from "../../utils/financial-utils.js";

const router = Router();

// GET - Listar todos os lançamentos financeiros
router.get("/", requireFinanceAccess, async (req, res) => {
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

// GET - Exportar CSV
router.get("/export/csv", requireFinanceAccess, async (req, res) => {
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
router.post("/", requireFinanceAccess, async (req, res) => {
  try {
    const data = req.body;
    const user = (req as any).user;
    
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
        isStorno: data.isStorno || false,
        stornoReason: data.stornoReason,
        originalPaymentId: data.originalPaymentId,
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
router.put("/:id", requireFinanceAccess, async (req, res) => {
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
router.get("/status/:id", requireFinanceAccess, async (req, res) => {
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
