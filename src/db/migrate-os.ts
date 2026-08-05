import fs from "fs";
import path from "path";
import { db, pool } from "./index.js";
import {
  clients, proposals, vessels, tasks, service_orders, service_order_items,
  documents, document_versions, schedules, os_events, users,
} from "./schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function backup() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0].replace("T", "-");
  const backupDir = path.resolve(process.cwd(), "backups", stamp);
  fs.mkdirSync(backupDir, { recursive: true });
  const uploadsSrc = path.resolve(process.cwd(), "uploads");
  const uploadsDst = path.join(backupDir, "uploads");
  if (fs.existsSync(uploadsSrc)) {
    fs.cpSync(uploadsSrc, uploadsDst, { recursive: true });
  }
  console.log(`Backup de uploads criado em ${uploadsDst}`);
  return backupDir;
}

function inferTipo(descricao: string): string {
  const d = (descricao || "").toLowerCase();
  if (d.includes("ultrassom") || d.includes("espessura") || d.includes("solda")) return "ultrassom";
  if (d.includes("desenho") || d.includes("plano") || d.includes("croqui")) return "desenho";
  if (d.includes("art") || d.includes("responsabilidade")) return "art";
  if (d.includes("homologa")) return "homologacao";
  if (d.includes("relatorio") || d.includes("memoria")) return "relatorio";
  return "outro";
}

async function generateOsNumber(year: number): Promise<string> {
  // Count existing OS for current year
  const all = await db.select().from(service_orders);
  const prefix = `OS-${year}-`;
  const count = all.filter((o) => o.numero.startsWith(prefix)).length;
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

async function run() {
  console.log("Executando migração de dados para Ordem de Serviço...");
  try {
    const backupDir = await backup();
    console.log(`Backup em ${backupDir}`);

    // ---- 1. Create clients from existing globals initials ----
    // 2. Create OS for approved proposals
    const allProposals = await db.select().from(proposals);
    const approvedProposals = allProposals.filter((p) => p.status === "aprovado");

    console.log(`Encontradas ${approvedProposals.length} propostas aprovadas para criar OS.`);
    for (const prop of approvedProposals) {
      // Skip if proposal already has an OS
      if (prop.osId) {
        const existing = await db.select().from(service_orders).where(eq(service_orders.id, prop.osId!));
        if (existing.length > 0) continue;
      }

      const year = prop.ano || new Date().getFullYear();
      const numero = await generateOsNumber(year);
      const inserted = await db.insert(service_orders).values({
        numero,
        propostaId: prop.id,
        embarcacaoId: prop.embarcacaoId,
        clienteId: prop.clienteId,
        status: "aguardando_agendamento",
        dataAceite: prop.aceiteData,
        observacoes: `Criado automaticamente a partir do aceite da proposta ${prop.numero}`,
      }).returning();
      const os = inserted[0];

      // Link proposal back to OS
      await db.update(proposals).set({ osId: os.id }).where(eq(proposals.id, prop.id));

      // Create OS items from proposal items
      const itens = (prop.itens || []) as any[];
      for (const item of itens) {
        await db.insert(service_order_items).values({
          osId: os.id,
          descricao: item.descricao || "Item",
          quantidade: item.quantidade || 1,
          valorUnitario: (item.valorUnitario || 0).toString(),
          tipo: inferTipo(item.descricao || ""),
          status: "pendente",
        });
        await db.insert(documents).values({
          osId: os.id,
          titulo: item.descricao || "Documento técnico",
          tipo: inferTipo(item.descricao || ""),
          status: "em_elaboracao",
        });
      }

      // Create event
      await db.insert(os_events).values({
        osId: os.id,
        tipo: "criacao",
        autorNome: "Sistema (Migração)",
        descricao: `Ordem de Serviço criada automaticamente a partir do aceite da proposta ${prop.numero}.`,
      });

      // ---- Link legacy tasks to this OS (by proposal or vessel) ----
      const legacyTasks = await db.select().from(tasks).where(isNull(tasks.osId));
      for (const t of legacyTasks) {
        const matches = (t.embarcacaoId && prop.embarcacaoId && t.embarcacaoId === prop.embarcacaoId);
        if (matches) {
          await db.update(tasks).set({ osId: os.id, legacy: true }).where(eq(tasks.id, t.id));
          // Convert single-file task to document V1
          if (t.arquivoUrl) {
            await ensureDocumentFromLegacyTask(os.id, t);
          }
        }
      }
    }

    // ---- Convert remaining orphan tasks (no approved proposal) to legacy documents ----
    const orphanTasks = await db.select().from(tasks).where(isNull(tasks.osId));
    for (const t of orphanTasks) {
      if (t.arquivoUrl) {
        // Create a minimal OS container if none exists for vessel
        const vesselOs = t.embarcacaoId
          ? (await db.select().from(service_orders).where(eq(service_orders.embarcacaoId, t.embarcacaoId)))[0]
          : undefined;
        const targetOs = vesselOs || (await createLegacyOsForTask(t));
        if (targetOs) {
          await db.update(tasks).set({ osId: targetOs.id, legacy: true }).where(eq(tasks.id, t.id));
          await ensureDocumentFromLegacyTask(targetOs.id, t);
        }
      }
    }

    console.log("Migração de dados concluída com sucesso!");
  } catch (err) {
    console.error("Falha na migração de dados:", err);
    process.exitCode = 1;
  } finally {
    pool.end();
  }
}

async function createLegacyOsForTask(task: any) {
  const year = new Date().getFullYear();
  const numero = await generateOsNumber(year);
  const inserted = await db.insert(service_orders).values({
    numero,
    embarcacaoId: task.embarcacaoId,
    status: "concluida", // legacy data assumed processed
    observacoes: "OS legada criada para preservar tarefas/documentos antigos sem proposta aprovada.",
  }).returning();
  return inserted[0];
}

async function ensureDocumentFromLegacyTask(osId: string, task: any) {
  // Find existing document for this task title
  const existingDocs = await db.select().from(documents).where(and(eq(documents.osId, osId), eq(documents.titulo, task.titulo)));
  let doc = existingDocs[0];
  let versao = 1;
  if (doc) {
    versao = (doc.versaoAtual || 0) + 1;
  } else {
    const inserted = await db.insert(documents).values({
      osId,
      titulo: task.titulo,
      tipo: inferTipo(task.tipo || task.titulo || ""),
      status: task.status === "aprovado" ? "aprovado" : "em_elaboracao",
      versaoAtual: 1,
    }).returning();
    doc = inserted[0];
  }

  const fileNameFisico = task.arquivoUrl ? task.arquivoUrl.replace(/^\/uploads\//, "") : "";
  if (fileNameFisico) {
    await db.insert(document_versions).values({
      documentoId: doc.id,
      versao,
      arquivoNomeFisico: fileNameFisico,
      arquivoNomeOriginal: task.arquivoNome || fileNameFisico,
      autorId: task.responsavelId,
      autorNome: task.responsavelNome || "Sistema (Migração)",
      data: task.atualizadoEm || new Date().toISOString().split("T")[0],
      comentario: "Versão convertida de arquivo legado (migração).",
      origem: "vistoria",
      situacaoRevisao: task.status === "aprovado" ? "revisado" : "pendente",
      situacaoAprovacao: task.status === "aprovado" ? "aprovado" : "pendente",
    });
    await db.update(documents).set({ versaoAtual: versao }).where(eq(documents.id, doc.id));
  }
}

run();
