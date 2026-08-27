import { and, eq, inArray, or } from "drizzle-orm";
import {
  accounts_receivable, approved_document_files, deliveries, delivery_dispatches, delivery_dispatch_documents,
  documents, document_versions, os_events, payments, protocol_dispatch_documents,
  protocols, service_order_items, service_orders,
  vessels,
} from "../db/schema.js";
import { receivableBalance } from "./financial-balance.js";

export type CompletionBlocker = { tipo: string; titulo: string; detalhe: string; saldo?: number };

/** A delivery is actionable only while the deliverer still has work to do. */
export const isDeliveryActionPending = (status: string | null | undefined) =>
  ["pendente", "em_entrega", "aguardando_complemento"].includes(status || "");

/** A service order can only leave the execution phase after every service item
 * has explicitly gone through the employee's start -> complete flow. */
export const getPendingServiceItems = (items: any[]) =>
  items.filter((item) => item.status !== "concluido");

export const allServicesCompleted = (items: any[]) =>
  items.length > 0 && getPendingServiceItems(items).length === 0;

export const assertServicesCompleted = async (tx: any, osId: string) => {
  const items = await tx.select().from(service_order_items).where(eq(service_order_items.osId, osId));
  if (!allServicesCompleted(items)) {
    const error: any = new Error("SERVICES_NOT_COMPLETED");
    error.pendingItems = getPendingServiceItems(items);
    throw error;
  }
  return items;
};

/** One canonical eligibility check used by the OS view and every state transition. */
export async function getOsReadinessBlockers(order: any, tx: any): Promise<CompletionBlocker[]> {
  const [items, docs, deliveryRows, receivables] = await Promise.all([
    tx.select().from(service_order_items).where(eq(service_order_items.osId, order.id)),
    tx.select().from(documents).where(eq(documents.osId, order.id)),
    tx.select().from(deliveries).where(eq(deliveries.osId, order.id)),
    tx.select().from(accounts_receivable).where(or(eq(accounts_receivable.osId, order.id), order.propostaId ? eq(accounts_receivable.propostaId, order.propostaId) : eq(accounts_receivable.osId, order.id))),
  ]);
  const docIds = docs.map((doc: any) => doc.id);
  const [versions, protocolRows] = await Promise.all([
    docIds.length ? tx.select().from(document_versions).where(inArray(document_versions.documentoId, docIds)) : [],
    tx.select().from(protocols).where(eq(protocols.osId, order.id)),
  ]);
  const protocolIds = protocolRows.map((protocol: any) => protocol.id);
  const approvedFiles = protocolIds.length ? await tx.select().from(approved_document_files).where(inArray(approved_document_files.protocoloId, protocolIds)) : [];
  const blockers: CompletionBlocker[] = [];
  const unfinished = getPendingServiceItems(items);
  if (!items.length || unfinished.length) blockers.push({ tipo: "servicos", titulo: "Serviços pendentes", detalhe: !items.length ? "A OS não possui serviços concluídos." : `${unfinished.length} serviço(s) ainda não concluído(s).` });
  for (const doc of docs) {
    const latest = versions.filter((version: any) => version.documentoId === doc.id).sort((a: any, b: any) => Number(b.versao) - Number(a.versao))[0];
    if (!latest || latest.situacaoRevisao !== "revisado" || latest.situacaoAprovacao !== "aprovado") blockers.push({ tipo: "documento", titulo: doc.titulo, detalhe: "Documento sem revisão e aprovação técnica final." });
    else if (doc.aplicavelAnaliseExterna && doc.status !== "aprovado") blockers.push({ tipo: "protocolo", titulo: doc.titulo, detalhe: "Documento aplicável sem aprovação externa." });
    else if (doc.aplicavelAnaliseExterna && !approvedFiles.some((file: any) => file.documentoId === doc.id)) blockers.push({ tipo: "arquivo_final", titulo: doc.titulo, detalhe: "Documento final aprovado/carimbado ainda não foi anexado." });
  }
  const delivery = deliveryRows[0];
  if (!delivery) blockers.push({ tipo: "entrega", titulo: "Entrega não preparada", detalhe: "A tarefa do entregador será criada após anexar os documentos finais aprovados." });
  else {
    const dispatches = await tx.select().from(delivery_dispatches).where(eq(delivery_dispatches.deliveryId, delivery.id));
    const dispatchIds = dispatches.map((dispatch: any) => dispatch.id);
    const dispatchDocuments = dispatchIds.length
      ? await tx.select().from(delivery_dispatch_documents).where(inArray(delivery_dispatch_documents.remessaEntregaId, dispatchIds))
      : [];
    const dispatchedFileIds = new Set(dispatchDocuments.map((item: any) => item.arquivoAprovadoId));
    const pendingFinalFiles = approvedFiles.filter((file: any) => !dispatchedFileIds.has(file.id));
    const finalDispatch = dispatches.find((dispatch: any) => dispatch.tipo === "final" && dispatch.status === "entregue" && dispatch.comprovanteUrl);
    if (pendingFinalFiles.length) blockers.push({ tipo: "entrega", titulo: "Documento final pendente de envio", detalhe: `${pendingFinalFiles.length} documento(s) final(is) ainda não foram incluídos em uma remessa ao cliente.` });
    else if (!finalDispatch) blockers.push({ tipo: "entrega", titulo: "Entrega final não comprovada", detalhe: "Uma remessa final com recebedor e comprovante ainda precisa ser registrada." });
  }
  const activeReceivables = receivables.filter((item: any) => item.status !== "cancelado");
  const arIds = activeReceivables.map((item: any) => item.id);
  const paidRows = arIds.length ? await tx.select().from(payments).where(inArray(payments.contaReceberId, arIds)) : [];
  const balance = activeReceivables.reduce((sum: number, receivable: any) => sum + receivableBalance(receivable.valorOriginal, paidRows.filter((payment: any) => payment.contaReceberId === receivable.id)), 0);
  if (balance > 0.009) blockers.push({ tipo: "financeiro", titulo: "Saldo financeiro pendente", detalhe: `Saldo em aberto: R$ ${balance.toFixed(2).replace(".", ",")}.`, saldo: balance });
  return blockers;
}

/** Advances only to review readiness; this function never concludes an OS. */
export async function reconcileOsReadiness(osId: string, tx: any, actor?: any) {
  const order = (await tx.select().from(service_orders).where(eq(service_orders.id, osId)))[0];
  if (!order || ["concluida", "cancelada"].includes(order.status)) return { order, blockers: [] as CompletionBlocker[], changed: false };
  const blockers = await getOsReadinessBlockers(order, tx);
  const targetStatus = blockers.length === 0 ? "validacao_final" : "aguardando_entrega";
  if (order.status !== targetStatus && ["aguardando_entrega", "validacao_final"].includes(order.status)) {
    await tx.update(service_orders).set({ status: targetStatus, updatedAt: new Date() }).where(eq(service_orders.id, osId));
    await tx.insert(os_events).values({ osId, tipo: "validacao_final", autorId: actor?.id, autorNome: actor?.nome || "Sistema", descricao: targetStatus === "validacao_final" ? "Todos os requisitos foram atendidos. OS enviada para Validação Final." : "Uma pendência reapareceu. OS retornou para Entrega & Pendências.", dados: { bloqueios: blockers } });
    return { order: { ...order, status: targetStatus }, blockers, changed: true };
  }
  return { order, blockers, changed: false };
}

/** A vessel is closed only after an administrator has closed every linked OS. */
export async function reconcileVesselCompletion(vesselId: string | null | undefined, tx: any) {
  if (!vesselId) return false;
  const orders = await tx.select().from(service_orders).where(eq(service_orders.embarcacaoId, vesselId));
  if (orders.some((order: any) => !["concluida", "cancelada"].includes(order.status))) return false;
  const receivables = (await tx.select().from(accounts_receivable).where(eq(accounts_receivable.embarcacaoId, vesselId))).filter((item: any) => item.status !== "cancelado");
  const paidRows = receivables.length ? await tx.select().from(payments).where(inArray(payments.contaReceberId, receivables.map((item: any) => item.id))) : [];
  const balance = receivables.reduce((sum: number, item: any) => sum + receivableBalance(item.valorOriginal, paidRows.filter((payment: any) => payment.contaReceberId === item.id)), 0);
  if (balance > 0.009) return false;
  await tx.update(vessels).set({ status: "concluida", updatedAt: new Date() }).where(eq(vessels.id, vesselId));
  return true;
}
