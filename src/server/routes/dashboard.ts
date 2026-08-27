import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  accounts_receivable,
  deliveries,
  documents,
  payments,
  proposals,
  schedules,
  service_order_items,
  service_orders,
  users,
  vessels,
} from "../../db/schema.js";
import { requireAuth } from "../auth.js";
import { isDeliveryActionPending } from "../delivery-workflow.js";
import { hasModuleAccess } from "../permissions.js";

const router = Router();

const EXTERNAL_OS_STATUSES = ["aguardando_envio_externo", "em_analise_externa", "exigencia_externa"];
const toNumber = (value: unknown) => Number(value) || 0;

const formatDate = (value: unknown) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

router.get("/summary", requireAuth, async (req: any, res: any) => {
  try {
    const currentUser = req.user;
    const isManagement = currentUser?.role === "admin" || currentUser?.role === "financeiro";
    const canViewVessels = hasModuleAccess(currentUser, "vessels");
    const canViewOrders = hasModuleAccess(currentUser, "service-orders");
    const canViewProposals = hasModuleAccess(currentUser, "proposals");
    const canViewFinancial = hasModuleAccess(currentUser, "financial");

    const [allVessels, allOrders, allItems, allDocuments, allSchedules, allUsers, allReceivables, allPayments, allProposals, allDeliveries] = await Promise.all([
      db.select().from(vessels),
      db.select().from(service_orders).orderBy(desc(service_orders.createdAt)),
      db.select().from(service_order_items),
      db.select().from(documents),
      db.select().from(schedules),
      db.select().from(users),
      db.select().from(accounts_receivable),
      db.select().from(payments).where(eq(payments.ativo, true)),
      db.select().from(proposals),
      db.select().from(deliveries),
    ]);

    const visibleOrderIds = isManagement
      ? new Set(allOrders.map((order) => order.id))
      : new Set(
          allOrders
            .filter((order) =>
              allItems.some((item) => item.osId === order.id && item.tecnicoResponsavelId === currentUser?.id)
            )
            .map((order) => order.id)
        );
    const visibleOrders = allOrders.filter((order) => visibleOrderIds.has(order.id));
    const visibleItems = allItems.filter((item) => visibleOrderIds.has(item.osId));
    const visibleDocuments = allDocuments.filter((document) => visibleOrderIds.has(document.osId));
    const visibleSchedules = allSchedules.filter((schedule) => visibleOrderIds.has(schedule.osId));

    const paymentsByReceivable = new Map<string, number>();
    allPayments.forEach((payment) => {
      if (!payment.contaReceberId) return;
      paymentsByReceivable.set(
        payment.contaReceberId,
        (paymentsByReceivable.get(payment.contaReceberId) || 0) + toNumber(payment.valor)
      );
    });

    const activeReceivables = allReceivables.filter((account) => account.status !== "cancelado");
    const receivableBalance = (account: typeof allReceivables[number]) =>
      Math.max(0, toNumber(account.valorOriginal) - (paymentsByReceivable.get(account.id) || 0));
    const openVessels = allVessels.filter((vessel) => vessel.status === "aberta");
    const activeDocuments = visibleDocuments.filter((document) => document.status !== "aprovado");
    const documentsInExecution = activeDocuments.filter((document) => ["em_elaboracao", "em_revisao"].includes(document.status));
    const awaitingCertifierOrders = visibleOrders.filter((order) => EXTERNAL_OS_STATUSES.includes(order.status));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const until = new Date(today);
    until.setDate(until.getDate() + 5);
    const upcomingDeadlines = visibleSchedules
      .filter((schedule) => schedule.status !== "cancelado" && schedule.data)
      .map((schedule) => ({
        id: schedule.id,
        osId: schedule.osId,
        titulo: "Agendamento de serviço",
        prazo: formatDate(schedule.data),
        horario: schedule.horario || "",
        responsavelId: schedule.tecnicoResponsavelId || "",
      }))
      .filter((item) => {
        const date = new Date(`${item.prazo}T00:00:00`);
        return date >= today && date <= until;
      })
      .sort((a, b) => a.prazo.localeCompare(b.prazo));

    const activeItems = visibleItems.filter((item) => item.status !== "concluido");
    const visibleUsers = isManagement ? allUsers : allUsers.filter((user) => user.id === currentUser?.id);
    const teamWorkload = visibleUsers
      .filter((user) => user.ativo !== false)
      .map((user) => ({
        userId: user.id,
        nome: user.nome,
        cargo: user.cargo || user.role,
        avatarUrl: user.avatarUrl || "",
        activeItems: activeItems.filter((item) => item.tecnicoResponsavelId === user.id).length,
      }));

    const byStatus = (statuses: string[]) => visibleOrders.filter((order) => statuses.includes(order.status)).length;
    const activeDeliveries = allDeliveries.filter((delivery) => isDeliveryActionPending(delivery.status));
    const visibleDeliveryCount = isManagement
      ? activeDeliveries.length
      : activeDeliveries.filter((delivery) => delivery.responsavelId === currentUser?.id).length;
    const vesselById = new Map(allVessels.map((vessel) => [vessel.id, vessel]));
    const orderById = new Map(allOrders.map((order) => [order.id, order]));
    const financialPendencies = activeReceivables
      .map((account) => ({ account, balance: receivableBalance(account) }))
      .filter((item) => item.balance > 0.009)
      .map(({ account, balance }) => ({
        receivableId: account.id,
        vesselId: account.embarcacaoId || undefined,
        vesselName: vesselById.get(account.embarcacaoId || "")?.nome || "Embarcação não informada",
        osId: account.osId || undefined,
        osNumber: account.osId ? orderById.get(account.osId)?.numero : undefined,
        balance,
      }));

    res.json({
      metrics: {
        openVessels: canViewVessels ? openVessels.length : 0,
        documentsInExecution: canViewOrders ? documentsInExecution.length : 0,
        awaitingCertifier: canViewOrders ? awaitingCertifierOrders.length : 0,
        totalToReceive: canViewFinancial ? activeReceivables.reduce((sum, account) => sum + receivableBalance(account), 0) : 0,
      },
      pipeline: {
        propostas: canViewProposals ? allProposals.filter((proposal) => ["rascunho", "enviado"].includes(proposal.status)).length : 0,
        vistorias: canViewOrders ? byStatus(["visita_agendada", "vistoria_em_execucao"]) : 0,
        laudos: canViewOrders ? byStatus(["documentacao_em_elaboracao", "revisao_interna"]) : 0,
        certificadoras: canViewOrders ? awaitingCertifierOrders.length : 0,
        entrega: canViewOrders ? visibleDeliveryCount : 0,
        faturamento: canViewFinancial ? activeReceivables.filter((account) => receivableBalance(account) > 0.009).length : 0,
      },
      financialPendencies: isManagement ? financialPendencies : [],
      deadlines: upcomingDeadlines,
      teamWorkload,
    });
  } catch (error) {
    console.error("Erro ao carregar resumo do dashboard:", error);
    res.status(500).json({ error: "Não foi possível carregar o resumo do dashboard." });
  }
});

export default router;
