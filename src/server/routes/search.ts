import { Router } from "express";
import { desc, ilike, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { clients, documents, proposals, protocols, service_orders, vessels } from "../../db/schema.js";
import { requireAuth } from "../auth.js";
import { hasModuleAccess } from "../permissions.js";

const router = Router();
router.get("/", requireAuth, async (req: any, res) => {
  const q = String(req.query.q || '').trim();
  const limit = Number(req.query.limit || 12);
  if (!q) return res.json([]);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) return res.status(400).json({ error: "Limite de busca inválido." });
  const pattern = `%${q}%`;
  try {
    const results: any[] = [];
    if (hasModuleAccess(req.user, 'registrations') || hasModuleAccess(req.user, 'vessels')) {
      const rows = await db.select().from(clients).where(or(ilike(clients.nome, pattern), ilike(clients.email, pattern), ilike(clients.cnpjCpf, pattern))).orderBy(clients.nome).limit(limit);
      results.push(...rows.map((row) => ({ id: row.id, type: 'cliente', title: row.nome, detail: row.email || row.cnpjCpf || '' })));
    }
    if (hasModuleAccess(req.user, 'vessels')) {
      const rows = await db.select().from(vessels).where(or(ilike(vessels.nome, pattern), ilike(vessels.registro, pattern), ilike(vessels.clienteNome, pattern))).orderBy(desc(vessels.createdAt)).limit(limit);
      results.push(...rows.map((row) => ({ id: row.id, type: 'embarcacao', title: row.nome, detail: `${row.registro || ''} · ${row.clienteNome || ''}` })));
    }
    if (hasModuleAccess(req.user, 'proposals')) {
      const rows = await db.select().from(proposals).where(or(ilike(proposals.numero, pattern), ilike(proposals.assunto, pattern), ilike(proposals.embarcacaoNome, pattern), ilike(proposals.clienteNome, pattern))).orderBy(desc(proposals.createdAt)).limit(limit);
      results.push(...rows.map((row) => ({ id: row.id, type: 'proposta', title: row.numero, detail: `${row.embarcacaoNome || ''} · ${row.clienteNome || ''}` })));
    }
    if (hasModuleAccess(req.user, 'service-orders')) {
      const rows = await db.select().from(service_orders).where(or(ilike(service_orders.numero, pattern), sql`${service_orders.id}::text ILIKE ${pattern}`)).orderBy(desc(service_orders.createdAt)).limit(limit);
      results.push(...rows.map((row) => ({ id: row.id, type: 'ordem', title: `OS ${row.numero}`, detail: row.status })));
      const docs = await db.select().from(documents).where(ilike(documents.titulo, pattern)).limit(limit);
      results.push(...docs.map((row) => ({ id: row.id, type: 'documento', title: row.titulo, detail: 'Documento de Ordem de Serviço' })));
    }
    if (hasModuleAccess(req.user, 'protocols')) {
      const rows = await db.select().from(protocols).where(or(ilike(protocols.numeroProtocolo, pattern), ilike(protocols.embarcacaoNome, pattern), ilike(protocols.clienteNome, pattern))).orderBy(desc(protocols.createdAt)).limit(limit);
      results.push(...rows.map((row) => ({ id: row.id, type: 'protocolo', title: row.numeroProtocolo, detail: row.status })));
    }
    res.json(results.slice(0, limit));
  } catch (error) {
    console.error("Erro na busca global:", error);
    res.status(500).json({ error: "Não foi possível realizar a busca." });
  }
});
export default router;
