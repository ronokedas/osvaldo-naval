import fs from "fs";
import path from "path";
import { db, pool } from "./index.js";
import {
  proposals, financial_entries, proposal_acceptances,
  accounts_receivable, payments, service_orders,
} from "./schema.js";
import { eq, and, sql } from "drizzle-orm";

async function backup() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0].replace("T", "-");
  const backupDir = path.resolve(process.cwd(), "backups", `proposal-flow-${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const uploadsSrc = path.resolve(process.cwd(), "uploads");
  const uploadsDst = path.join(backupDir, "uploads");
  if (fs.existsSync(uploadsSrc)) {
    fs.cpSync(uploadsSrc, uploadsDst, { recursive: true });
  }
  console.log(`Backup criado em ${backupDir}`);
  return backupDir;
}

async function run() {
  console.log("Executando migração de dados do fluxo de proposta/aceite/financeiro...");
  try {
    const allProposals = await db.select().from(proposals);
    const approvedProposals = allProposals.filter((p) => p.status === "aprovado");
    console.log(`Encontradas ${approvedProposals.length} propostas aprovadas.`);

    const existingAcceptances = await db.select().from(proposal_acceptances);
    const existingReceivables = await db.select().from(accounts_receivable);
    const alreadyConverted = approvedProposals.length > 0
      && approvedProposals.every((proposal) =>
        existingAcceptances.some((acceptance) => acceptance.propostaId === proposal.id)
        && existingReceivables.some((receivable) => receivable.propostaId === proposal.id)
      );
    if (alreadyConverted) {
      console.log("Fluxo de proposta já convertido; nenhuma migração de dados necessária.");
      return;
    }

    await backup();

    const byVessel = new Map<string, any[]>();
    for (const p of approvedProposals) {
      if (!p.embarcacaoId) continue;
      const list = byVessel.get(p.embarcacaoId) || [];
      list.push(p);
      byVessel.set(p.embarcacaoId, list);
    }

    let acceptancesCreated = 0;
    let receivablesCreated = 0;
    let paymentsLinked = 0;
    let ambiguous = 0;

    for (const prop of approvedProposals) {
      const existingAcc = await db.select().from(proposal_acceptances)
        .where(eq(proposal_acceptances.propostaId, prop.id));
      if (existingAcc.length === 0) {
        await db.insert(proposal_acceptances).values({
          propostaId: prop.id,
          meio: "outro",
          responsavelNome: prop.aceiteAssinaturaNome || "Cliente (legado)",
          data: prop.aceiteData || new Date().toISOString().split("T")[0],
          observacao: "Aceite registrado por migração de dados legados.",
          origem: "legado",
        });
        acceptancesCreated++;
      }

      const existingAr = await db.select().from(accounts_receivable)
        .where(eq(accounts_receivable.propostaId, prop.id));
      if (existingAr.length === 0) {
        const os = prop.osId
          ? (await db.select().from(service_orders).where(eq(service_orders.id, prop.osId!)))[0]
          : undefined;
        await db.insert(accounts_receivable).values({
          propostaId: prop.id,
          osId: os?.id || null,
          embarcacaoId: prop.embarcacaoId,
          clienteId: prop.clienteId,
          valorOriginal: prop.valorTotal || "0",
          status: "pendente",
        });
        receivablesCreated++;
      }

      const vesselProposals = prop.embarcacaoId ? (byVessel.get(prop.embarcacaoId) || []) : [];
      if (vesselProposals.length === 1 && prop.embarcacaoId) {
        const vesselEntries = await db.select().from(financial_entries)
          .where(and(
            eq(financial_entries.embarcacaoId, prop.embarcacaoId!),
            sql`${financial_entries.tipo} != 'despesa'`
          ));
        const ar = (await db.select().from(accounts_receivable)
          .where(eq(accounts_receivable.propostaId, prop.id)))[0];
        if (ar) {
          for (const entry of vesselEntries) {
            const existingPay = await db.select().from(payments)
              .where(and(
                eq(payments.contaReceberId, ar.id),
                eq(payments.valor, entry.valor || "0"),
                eq(payments.data, entry.data || ""),
                eq(payments.observacao, entry.observacao || "Pagamento vinculado por migração.")
              ));
            if (existingPay.length === 0) {
              await db.insert(payments).values({
                contaReceberId: ar.id,
                propostaId: prop.id,
                osId: ar.osId,
                embarcacaoId: prop.embarcacaoId,
                valor: entry.valor || "0",
                data: entry.data,
                formaPagamento: entry.formaPagamento,
                observacao: entry.observacao || "Pagamento vinculado por migração.",
                lancadoPorNome: entry.lancadoPorNome,
              });
              paymentsLinked++;
            }
          }
        }
      } else if (vesselProposals.length > 1) {
        ambiguous++;
        console.log(`  [AMBÍGUO] Embarcação ${prop.embarcacaoId} tem ${vesselProposals.length} propostas aprovadas. Conciliação manual necessária.`);
      }
    }

    const allAr = await db.select().from(accounts_receivable);
    for (const ar of allAr) {
      const arPayments = await db.select().from(payments)
        .where(eq(payments.contaReceberId, ar.id));
      const totalPaid = arPayments.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
      const original = Number(ar.valorOriginal) || 0;
      let status = "pendente";
      if (totalPaid >= original && original > 0) status = "pago";
      else if (totalPaid > 0) status = "parcial";
      await db.update(accounts_receivable).set({ status }).where(eq(accounts_receivable.id, ar.id));
    }

    console.log(`Aceites legados criados: ${acceptancesCreated}`);
    console.log(`Contas a receber criadas: ${receivablesCreated}`);
    console.log(`Pagamentos vinculados: ${paymentsLinked}`);
    console.log(`Casos ambíguos para conciliação manual: ${ambiguous}`);
    console.log("Migração de dados concluída com sucesso!");
  } catch (err) {
    console.error("Falha na migração de dados:", err);
    process.exitCode = 1;
  } finally {
    pool.end();
  }
}

run();
