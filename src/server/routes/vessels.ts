import { Router } from "express";
import { db } from "../../db/index.js";
import { vessels, certifiers, service_orders, documents, document_versions, accounts_receivable, payments } from "../../db/schema.js";
import { eq, desc, inArray } from "drizzle-orm";
import { requireAuth, requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";
import { serializeVessel } from "../serializers.js";
import { receivableBalance } from "../financial-balance.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const allVessels = await db.select().from(vessels).orderBy(desc(vessels.createdAt));
    res.json(allVessels.map(serializeVessel));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]), async (req, res) => {
  try {
    const data = req.body;
    const newVessel = await db.insert(vessels).values({
      nome: data.nome,
      tipo: data.tipo,
      clienteId: data.clienteId || null,
      clienteNome: data.clienteNome || "Sem Cliente",
      telefoneContato: data.telefoneContato,
      emailContato: data.emailContato,
      responsavelTecnico: data.responsavelTecnico,
      status: data.status || "aberta",
      etapaAtual: data.etapaAtual || "Análise Inicial",
      prazoRenovacao: data.prazoRenovacao,
      valorTotal: data.valorTotal ? data.valorTotal.toString() : "0",
      valorRecebido: data.valorRecebido ? data.valorRecebido.toString() : "0",
      valorSinal: data.valorSinal ? data.valorSinal.toString() : "0",
      registro: data.registro,
      certificadoraId: data.certificadoraId || null,
      certificadoraPrincipal: data.certificadoraPrincipal,
      comprimento: data.comprimento ? data.comprimento.toString() : null,
      boca: data.boca ? data.boca.toString() : null,
      pontal: data.pontal ? data.pontal.toString() : null,
      descricao: data.descricao,
      arquivosAssociados: data.arquivosAssociados || [],
      progresso: data.progresso || 0,
    }).returning();
    
    res.json(serializeVessel(newVessel[0]));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.status === "concluida") {
      const orders = await db.select().from(service_orders).where(eq(service_orders.embarcacaoId, id));
      const activeOrders = orders.filter((item) => !["concluida", "cancelada"].includes(item.status));
      if (activeOrders.length) return res.status(409).json({ error: `A embarcação possui ${activeOrders.length} Ordem(ns) de Serviço ainda não concluída(s).` });
      const orderIds = orders.map((item) => item.id);
      const docs = orderIds.length ? await db.select().from(documents).where(inArray(documents.osId, orderIds)) : [];
      const docIds = docs.map((item) => item.id);
      const versions = docIds.length ? await db.select().from(document_versions).where(inArray(document_versions.documentoId, docIds)).orderBy(desc(document_versions.versao)) : [];
      const pendingDocs = docs.filter((doc) => {
        const latest = versions.find((version) => version.documentoId === doc.id);
        return !latest || latest.situacaoRevisao !== "revisado" || latest.situacaoAprovacao !== "aprovado" || (doc.aplicavelAnaliseExterna && doc.status !== "aprovado");
      });
      if (pendingDocs.length) return res.status(409).json({ error: `A embarcação possui ${pendingDocs.length} documento(s) pendente(s).` });
      const receivables = (await db.select().from(accounts_receivable).where(eq(accounts_receivable.embarcacaoId, id))).filter((item) => item.status !== "cancelado");
      const receivableIds = receivables.map((item) => item.id);
      const paidRows = receivableIds.length ? await db.select().from(payments).where(inArray(payments.contaReceberId, receivableIds)) : [];
      const balance = receivables.reduce((sum, receivable) => {
        return sum + receivableBalance(receivable.valorOriginal, paidRows.filter((payment) => payment.contaReceberId === receivable.id));
      }, 0);
      if (balance > 0.009) return res.status(409).json({ error: `A embarcação possui saldo financeiro pendente de R$ ${balance.toFixed(2).replace(".", ",")}.` });
    }
    
    const updateData: any = { updatedAt: new Date() };
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.clienteId !== undefined) updateData.clienteId = data.clienteId;
    if (data.clienteNome !== undefined) updateData.clienteNome = data.clienteNome;
    if (data.telefoneContato !== undefined) updateData.telefoneContato = data.telefoneContato;
    if (data.emailContato !== undefined) updateData.emailContato = data.emailContato;
    if (data.responsavelTecnico !== undefined) updateData.responsavelTecnico = data.responsavelTecnico;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.etapaAtual !== undefined) updateData.etapaAtual = data.etapaAtual;
    if (data.prazoRenovacao !== undefined) updateData.prazoRenovacao = data.prazoRenovacao;
    if (data.valorTotal !== undefined) updateData.valorTotal = data.valorTotal.toString();
    if (data.valorRecebido !== undefined) updateData.valorRecebido = data.valorRecebido.toString();
    if (data.valorSinal !== undefined) updateData.valorSinal = data.valorSinal.toString();
    if (data.registro !== undefined) updateData.registro = data.registro;
    if (data.certificadoraId !== undefined) updateData.certificadoraId = data.certificadoraId;
    if (data.comprimento !== undefined) updateData.comprimento = data.comprimento.toString();
    if (data.boca !== undefined) updateData.boca = data.boca.toString();
    if (data.pontal !== undefined) updateData.pontal = data.pontal.toString();
    if (data.certificadoraPrincipal !== undefined) updateData.certificadoraPrincipal = data.certificadoraPrincipal;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.arquivosAssociados !== undefined) updateData.arquivosAssociados = data.arquivosAssociados;
    if (data.progresso !== undefined) updateData.progresso = data.progresso;

    const updated = await db.update(vessels).set(updateData).where(eq(vessels.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Not found" });
    
    res.json(serializeVessel(updated[0]));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
