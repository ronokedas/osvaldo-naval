import { db } from "../db/index.js";
import { financial_entries, payments, vessels, service_orders, service_order_items } from "../db/schema.js";
import { eq, sql, and } from "drizzle-orm";

export type FinancialStatus = "PENDENTE" | "PARCIAL" | "PAGO";

/**
 * Calcula o status financeiro de uma OS ou embarcação baseado nos pagamentos vinculados
 * @param orderId - ID da OS ou embarcacao
 * @param type - 'os' ou 'embarcacao'
 * @returns objeto com status, valor total, valor recebido e percentual
 */
export async function calculateFinancialStatus(
  orderId: string, 
  type: "os" | "embarcacao" = "embarcacao"
): Promise<{
  status: FinancialStatus;
  totalValue: number;
  receivedValue: number;
  percentage: number;
}> {
  const fieldName = type === "os" ? "osId" : "embarcacaoId";
  
  // Soma todos os pagamentos (receitas) vinculados
  const result = await db
    .select({
      totalRecebido: sql<number>`COALESCE(SUM(CASE WHEN tipo != 'despesa' THEN valor::numeric ELSE 0 END), 0)::numeric`,
      totalDespesas: sql<number>`COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor::numeric ELSE 0 END), 0)::numeric`,
    })
    .from(financial_entries)
    .where(eq((financial_entries as any)[fieldName], orderId));

  const totalRecebido = parseFloat(result[0].totalRecebido.toString()) || 0;
  const totalDespesas = parseFloat(result[0].totalDespesas.toString()) || 0;
  
  // Busca valor total da OS ou embarcação
  let totalValue = 0;
  if (type === "os") {
    const items = await db.select().from(service_order_items).where(eq(service_order_items.osId, orderId));
    totalValue = items.reduce((sum, item) => sum + (parseFloat(item.valorUnitario?.toString() || "0") * (item.quantidade || 1)), 0);
  } else {
    const vessel = await db.query.vessels.findFirst({
      where: eq(vessels.id, orderId)
    });
    if (vessel) {
      totalValue = parseFloat(vessel.valorTotal?.toString() || "0");
    }
  }

  // Calcula percentual
  const percentage = totalValue > 0 ? (totalRecebido / totalValue) * 100 : 0;
  
  // Determina status
  let status: FinancialStatus = "PENDENTE";
  if (percentage >= 100) {
    status = "PAGO";
  } else if (percentage > 0) {
    status = "PARCIAL";
  }

  return {
    status,
    totalValue,
    receivedValue: totalRecebido,
    percentage: Math.round(percentage * 100) / 100
  };
}

/**
 * Atualiza o status financeiro de uma OS/embarcação e registra no histórico
 * @param orderId - ID da OS ou embarcacao
 * @param type - 'os' ou 'embarcacao'
 * @param tx - transação opcional do banco
 */
export async function updateOrderFinancialStatus(
  orderId: string,
  type: "os" | "embarcacao" = "embarcacao",
  userId?: string,
  userName?: string
): Promise<void> {
  const statusData = await calculateFinancialStatus(orderId, type);
  
  const fieldName = type === "os" ? "os_id" : "embarcacao_id";
  const tableName = type === "os" ? "service_orders" : "vessels";
  
  // Atualiza valor recebido e status
  await db.execute(sql`
    UPDATE ${sql.identifier(tableName)}
    SET 
      valor_recebido = ${statusData.receivedValue},
      updated_at = NOW()
    WHERE id = ${orderId}
  `);

  // Registra no histórico de status financeiro (tabela a ser criada na migração)
  // Isso será tratado na migration SQL com trigger
}

/**
 * Valida se um número de Nota Fiscal já existe para o mesmo emitente e série
 * @param documentNumber - Número da NF
 * @param series - Série da NF (opcional)
 * @param issuerId - ID do emitente
 * @returns true se já existe, false caso contrário
 */
export async function validateNfUnique(
  documentNumber: string,
  issuerId: string,
  series?: string,
  excludeEntryId?: string
): Promise<{ valid: boolean; message?: string }> {
  const conditions: any[] = [
    eq(financial_entries.notaFiscalNumero, documentNumber),
    eq(financial_entries.issuerId, issuerId)
  ];

  if (series) {
    conditions.push(eq(financial_entries.nfSeries, series));
  }

  if (excludeEntryId) {
    conditions.push(sql`${financial_entries.id} != ${excludeEntryId}`);
  }

  const existing = await db.query.financial_entries.findFirst({
    where: and(...conditions)
  });

  if (existing) {
    return {
      valid: false,
      message: `Já existe uma Nota Fiscal número ${documentNumber}${series ? ` série ${series}` : ""} cadastrada para este emitente.`
    };
  }

  return { valid: true };
}

/**
 * Valida um valor monetário
 * @param value - Valor a validar
 * @returns objeto com validação e valor em centavos
 */
export function validateMonetaryValue(value: any): { valid: boolean; valueInCents?: number; error?: string } {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: "Valor é obrigatório" };
  }

  let numericValue: number;
  
  if (typeof value === "number") {
    numericValue = value;
  } else if (typeof value === "string") {
    // Remove formatação BRL (R$, pontos, vírgulas)
    const cleaned = value.replace(/[R$\s.]/g, "").replace(",", ".");
    numericValue = parseFloat(cleaned);
  } else {
    return { valid: false, error: "Formato de valor inválido" };
  }

  if (isNaN(numericValue)) {
    return { valid: false, error: "Valor deve ser numérico" };
  }

  if (numericValue < 0) {
    return { valid: false, error: "Valor não pode ser negativo" };
  }

  // Converte para centavos (inteiro) para precisão
  const valueInCents = Math.round(numericValue * 100);

  return { valid: true, valueInCents };
}

/**
 * Converte valor em centavos para string decimal
 * @param cents - Valor em centavos
 * @returns String formatada como decimal
 */
export function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Converte string decimal para centavos
 * @param decimalStr - String decimal (ex: "1000.00")
 * @returns Valor em centavos
 */
export function decimalStringToCents(decimalStr: string): number {
  return Math.round(parseFloat(decimalStr) * 100);
}

/**
 * Gera CSV para exportação financeira
 * @param entries - Lista de lançamentos financeiros
 * @returns String CSV com colunas bruta e formatada
 */
export function generateFinancialCSV(entries: any[]): string {
  const headers = [
    "ID",
    "Data",
    "Embarcação",
    "Cliente",
    "Tipo",
    "Forma Pagamento",
    "Valor Bruto",
    "Valor Formatado (BRL)",
    "Nota Fiscal",
    "Série NF",
    "Observação",
    "Lançado Por"
  ];

  const rows = entries.map(entry => {
    const valorBruto = parseFloat(entry.valor?.toString() || "0").toFixed(2);
    const valorFormatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(parseFloat(valorBruto));

    return [
      entry.id,
      entry.data || "",
      entry.embarcacaoNome || "",
      entry.clienteNome || "",
      entry.tipo || "",
      entry.formaPagamento || "",
      valorBruto, // Coluna bruta para importação
      valorFormatado, // Coluna formatada para leitura humana
      entry.notaFiscalNumero || "",
      entry.nfSeries || "",
      (entry.observacao || "").replace(/"/g, '""'), // Escape quotes
      entry.lancadoPorNome || ""
    ].map(cell => `"${cell}"`).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Dispara notificações para interessados em atualizações financeiras
 * @param entryId - ID do lançamento financeiro
 * @param eventType - Tipo de evento (PAYMENT_RECEIVED, NF_ATTACHED, STORNO, etc)
 * @param userId - ID do usuário que realizou a ação
 * @param userName - Nome do usuário
 */
export async function notifyFinancialUpdate(
  entryId: string,
  eventType: "PAYMENT_RECEIVED" | "NF_ATTACHED" | "STORNO" | "STATUS_CHANGED",
  userId?: string,
  userName?: string
): Promise<void> {
  try {
    const entry = await db.query.financial_entries.findFirst({
      where: eq(financial_entries.id, entryId)
    });

    if (!entry) return;

    const notifications: any[] = [];
    
    // Notificação para Admin/Financeiro
    let titulo = "";
    let mensagem = "";
    
    switch (eventType) {
      case "PAYMENT_RECEIVED":
        titulo = "Novo pagamento recebido";
        mensagem = `Pagamento de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(entry.valor?.toString() || "0"))} registrado para ${entry.embarcacaoNome || entry.embarcacaoId}.`;
        break;
      case "NF_ATTACHED":
        titulo = "Nota Fiscal anexada";
        mensagem = `NF ${entry.notaFiscalNumero}${entry.nfSeries ? `/${entry.nfSeries}` : ""} anexada ao lançamento de ${entry.embarcacaoNome || entry.embarcacaoId}.`;
        break;
      case "STORNO":
        titulo = "Estorno registrado";
        mensagem = `Estorno de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(entry.valor?.toString() || "0"))} registrado para ${entry.embarcacaoNome || entry.embarcacaoId}. Motivo: ${entry.stornoReason || "Não informado"}.`;
        break;
      case "STATUS_CHANGED":
        titulo = "Status financeiro atualizado";
        mensagem = `O status financeiro de ${entry.embarcacaoNome || entry.embarcacaoId} foi atualizado.`;
        break;
    }

    // Buscar usuários admin e financeiro
    const { users } = await import("../db/schema.js");
    const interestedUsers = await db.query.users.findMany({
      where: sql`${users.role} IN ('admin', 'financeiro') AND ${users.ativo} = true`
    });

    for (const user of interestedUsers) {
      notifications.push({
        usuarioId: user.id,
        tipo: "FINANCE_UPDATE",
        titulo,
        mensagem,
        osId: entry.osId,
        prioridade: eventType === "STORNO" ? "alta" : "normal",
        createdAt: new Date()
      });
    }

    if (notifications.length > 0) {
      const { notifications: notificationsTable } = await import("../db/schema.js");
      await db.insert(notificationsTable).values(notifications);
    }
  } catch (error) {
    console.error("Erro ao disparar notificações financeiras:", error);
    // Não lança erro para não quebrar o fluxo principal
  }
}
