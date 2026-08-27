import { Router } from "express";
import { db } from "../../db/index.js";
import { tasks, vessels, service_orders, service_order_items, users, clients } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";
import { serializeTask } from "../serializers.js";
import { TeamAgendaItem, TeamAgendaPeriod, TeamAgendaResponse, TeamAgendaServiceStatus } from "../../types/index.js";
import { AGENDA_TIMEZONE, agendaDateInPeriod, getAgendaPeriodRange, getAgendaWeekRange, isValidAgendaDate, isValidAgendaTime } from "../team-agenda.js";

const router = Router();

const periods = new Set<TeamAgendaPeriod>(['today', 'week', 'upcoming', 'history']);
const statuses = new Set<TeamAgendaServiceStatus>(['pendente', 'em_execucao', 'concluido', 'cancelada']);
const normalize = (value: unknown) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

router.get('/agenda', requireAuth, async (req, res) => {
  try {
    const period = String(req.query.period || 'today') as TeamAgendaPeriod;
    const employeeId = req.query.employeeId ? String(req.query.employeeId) : undefined;
    const status = req.query.status ? String(req.query.status) as TeamAgendaServiceStatus : undefined;
    const query = normalize(req.query.q);
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    if (!periods.has(period) || (status && !statuses.has(status)) || !Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Parâmetros de agenda inválidos.' });
    }

    const [orders, items, allUsers, allVessels, allClients] = await Promise.all([
      db.select().from(service_orders),
      db.select().from(service_order_items),
      db.select().from(users),
      db.select().from(vessels),
      db.select().from(clients),
    ]);
    const orderById = new Map(orders.map((order) => [order.id, order]));
    const userById = new Map(allUsers.map((user) => [user.id, user]));
    const vesselById = new Map(allVessels.map((vessel) => [vessel.id, vessel]));
    const clientById = new Map(allClients.map((client) => [client.id, client]));
    const employees = allUsers.filter((user) => user.ativo !== false).map((user) => ({ id: user.id, nome: user.nome, cargo: user.cargo || undefined, role: user.role as any, avatarUrl: user.avatarUrl || undefined })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    const agendaItems: TeamAgendaItem[] = items.flatMap((item) => {
      const order = orderById.get(item.osId);
      const responsible = item.tecnicoResponsavelId ? userById.get(item.tecnicoResponsavelId) : undefined;
      if (!order || !responsible || !isValidAgendaDate(item.dataAgendada) || !isValidAgendaTime(item.horarioAgendado)) return [];
      const itemStatus: TeamAgendaServiceStatus = order.status === 'cancelada' ? 'cancelada' : (['pendente', 'em_execucao', 'concluido'].includes(item.status) ? item.status as TeamAgendaServiceStatus : 'pendente');
      const vessel = vesselById.get(order.embarcacaoId || '');
      const client = clientById.get(order.clienteId || '');
      const result: TeamAgendaItem = {
        id: item.id,
        serviceOrderId: order.id,
        serviceOrderNumber: order.numero,
        serviceOrderStatus: order.status as any,
        descricao: item.descricao,
        tipo: item.tipo || undefined,
        status: itemStatus,
        dataAgendada: item.dataAgendada,
        horarioAgendado: item.horarioAgendado,
        localAgendado: item.localAgendado || undefined,
        contatoAgendamento: item.contatoAgendamento || undefined,
        observacoesAgendamento: item.observacoesAgendamento || undefined,
        embarcacaoNome: vessel?.nome || undefined,
        clienteNome: client?.nome || undefined,
        responsavel: { id: responsible.id, nome: responsible.nome, cargo: responsible.cargo || undefined, role: responsible.role as any, avatarUrl: responsible.avatarUrl || undefined },
      };
      return [result];
    }).filter((item) => {
      if (employeeId && item.responsavel.id !== employeeId) return false;
      if (status && item.status !== status) return false;
      if (!query) return true;
      return normalize([item.descricao, item.serviceOrderNumber, item.responsavel.nome, item.responsavel.cargo, item.embarcacaoNome, item.clienteNome].join(' ')).includes(query);
    }).sort((a, b) => `${a.dataAgendada} ${a.horarioAgendado} ${a.responsavel.nome} ${a.descricao}`.localeCompare(`${b.dataAgendada} ${b.horarioAgendado} ${b.responsavel.nome} ${b.descricao}`, 'pt-BR'));

    const week = getAgendaWeekRange();
    const count = (target: TeamAgendaPeriod) => agendaItems.filter((item) => agendaDateInPeriod(item.dataAgendada, target)).length;
    const todayItems = agendaItems.filter((item) => agendaDateInPeriod(item.dataAgendada, 'today'));
    const periodItems = agendaItems.filter((item) => agendaDateInPeriod(item.dataAgendada, period));
    const total = periodItems.length;
    const offset = (page - 1) * limit;
    const body: TeamAgendaResponse = {
      period,
      timezone: AGENDA_TIMEZONE,
      range: getAgendaPeriodRange(period),
      counts: { today: count('today'), todayPending: todayItems.filter((item) => !['concluido', 'cancelada'].includes(item.status)).length, week: count('week'), upcoming: count('upcoming'), history: count('history') },
      employees,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      items: periodItems.slice(offset, offset + limit),
    };
    res.json(body);
  } catch (error) {
    console.error('Erro ao carregar agenda da equipe:', error);
    res.status(500).json({ error: 'Não foi possível carregar a agenda da equipe.' });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const all = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    const allVessels = await db.select().from(vessels);
    const vesselById = new Map(allVessels.map((v) => [v.id, v]));
    res.json(all.map((task) => serializeTask(task, vesselById.get(task.embarcacaoId || ""))));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requirePermission([PERMISSIONS.EXECUTAR_VISTORIA]), async (req, res) => {
  try {
    const data = req.body;
    const inserted = await db.insert(tasks).values({
      embarcacaoId: data.embarcacaoId,
      embarcacaoNome: data.embarcacaoNome,
      clienteNome: data.clienteNome,
      titulo: data.titulo,
      tipo: data.tipo,
      status: data.status || "pendente",
      responsavelNome: data.responsavelNome,
      responsavelId: data.responsavelId || null,
      responsavelCargo: data.responsavelCargo,
      certificadora: data.certificadora,
      prazo: data.prazo,
      arquivoNome: data.arquivoNome,
      arquivoUrl: data.arquivoUrl,
      atualizadoEm: data.atualizadoEm,
      dataCriacao: data.dataCriacao,
      prazoVencimento: data.prazo || data.prazoVencimento,
      anexos: data.anexos || [],
      observacoes: data.observacoes
    }).returning();
    res.json(serializeTask(inserted[0]));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requirePermission([PERMISSIONS.EXECUTAR_VISTORIA]), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updateData: any = { updatedAt: new Date() };
    if (data.status !== undefined) updateData.status = data.status;
    if (data.responsavelNome !== undefined) updateData.responsavelNome = data.responsavelNome;
    if (data.responsavelId !== undefined) updateData.responsavelId = data.responsavelId || null;
    if (data.responsavelCargo !== undefined) updateData.responsavelCargo = data.responsavelCargo;
    if (data.certificadora !== undefined) updateData.certificadora = data.certificadora;
    if (data.prazo !== undefined) updateData.prazo = data.prazo;
    if (data.arquivoNome !== undefined) updateData.arquivoNome = data.arquivoNome;
    if (data.arquivoUrl !== undefined) updateData.arquivoUrl = data.arquivoUrl;
    if (data.historicoNotas !== undefined) updateData.historicoNotas = data.historicoNotas;
    
    const updated = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(serializeTask(updated[0]));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
