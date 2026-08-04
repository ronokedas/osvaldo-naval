import fs from "fs";
import path from "path";
import * as argon2 from "argon2";
import { db, pool } from "./index.js";
import { users, clients, vessels, tasks, proposals, financial_entries, protocols, critical_pendings, app_configs } from "./schema.js";
import { v4 as uuidv4 } from "uuid";

async function run() {
  console.log("Seeding database from nautilus_db.json...");
  
  try {
    const dataPath = path.resolve(process.cwd(), "data", "nautilus_db.json");
    if (!fs.existsSync(dataPath)) {
      console.log("No nautilus_db.json found, skipping seed.");
      return;
    }
    
    const dbJson = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    
    // Hash passwords and insert users
    if (dbJson.users && dbJson.users.length > 0) {
      console.log(`Importing ${dbJson.users.length} users...`);
      for (const user of dbJson.users) {
        const hashedPassword = await argon2.hash(user.senha || "123456");
        await db.insert(users).values({
          nome: user.nome,
          email: user.email,
          role: user.role,
          senha: hashedPassword,
          avatarUrl: user.avatarUrl,
        });
      }
    }

    // Create a default client for vessels since it wasn't strictly enforced in JSON
    console.log("Creating default client...");
    const defaultClient = await db.insert(clients).values({
      nome: "Cliente Genérico",
      email: "contato@cliente.com",
    }).returning();
    const clientId = defaultClient[0].id;
    
    // Insert vessels
    const vesselIdMap = new Map();
    if (dbJson.vessels && dbJson.vessels.length > 0) {
      console.log(`Importing ${dbJson.vessels.length} vessels...`);
      for (const v of dbJson.vessels) {
        const result = await db.insert(vessels).values({
          nome: v.nome,
          tipo: v.tipo,
          clienteId: clientId,
          clienteNome: v.clienteNome,
          telefoneContato: v.telefoneContato,
          emailContato: v.emailContato,
          responsavelTecnico: v.responsavelTecnico,
          status: v.status,
          etapaAtual: v.etapaAtual,
          prazoRenovacao: v.prazoRenovacao,
          valorTotal: v.valorTotal ? v.valorTotal.toString() : "0",
          valorRecebido: v.valorRecebido ? v.valorRecebido.toString() : "0",
          arquivosAssociados: v.arquivosAssociados || [],
          progresso: v.progresso || 0,
        }).returning();
        vesselIdMap.set(v.id, result[0].id);
      }
    }

    // Insert tasks
    if (dbJson.tasks && dbJson.tasks.length > 0) {
      console.log(`Importing ${dbJson.tasks.length} tasks...`);
      for (const t of dbJson.tasks) {
        const realVesselId = vesselIdMap.get(t.embarcacaoId);
        if (!realVesselId) continue;
        
        await db.insert(tasks).values({
          embarcacaoId: realVesselId,
          titulo: t.titulo,
          tipo: t.tipo,
          status: t.status,
          responsavelNome: t.responsavelNome,
          dataCriacao: t.dataCriacao,
          prazoVencimento: t.prazoVencimento,
          anexos: t.anexos || [],
          protocoloGerado: t.protocoloGerado || false,
          dataConclusao: t.dataConclusao,
          arquivosRecebidos: t.arquivosRecebidos || [],
          historicoNotas: t.historicoNotas || [],
          observacoes: t.observacoes,
        });
      }
    }

    // Insert proposals
    if (dbJson.proposals && dbJson.proposals.length > 0) {
      console.log(`Importing ${dbJson.proposals.length} proposals...`);
      for (const p of dbJson.proposals) {
        const realVesselId = vesselIdMap.get(p.embarcacaoId);
        if (!realVesselId) continue;
        
        await db.insert(proposals).values({
          numero: p.numero,
          dataEmissao: p.dataEmissao,
          validadeDias: p.validadeDias,
          embarcacaoId: realVesselId,
          embarcacaoNome: p.embarcacaoNome,
          clienteNome: p.clienteNome,
          destinatario: p.destinatario,
          assunto: p.assunto,
          prazoEntregaDias: p.prazoEntregaDias,
          condicoesPagamento: p.condicoesPagamento,
          status: p.status,
          itens: p.itens || [],
          valorTotal: p.valorTotal ? p.valorTotal.toString() : "0",
          observacoes: p.observacoes,
        });
      }
    }

    // Insert financial entries
    if (dbJson.financialEntries && dbJson.financialEntries.length > 0) {
      console.log(`Importing ${dbJson.financialEntries.length} financial entries...`);
      for (const f of dbJson.financialEntries) {
        const realVesselId = vesselIdMap.get(f.embarcacaoId);
        if (!realVesselId) continue;
        
        await db.insert(financial_entries).values({
          embarcacaoId: realVesselId,
          embarcacaoNome: f.embarcacaoNome,
          clienteNome: f.clienteNome,
          data: f.data,
          valor: f.valor ? f.valor.toString() : "0",
          tipo: f.tipo,
          formaPagamento: f.formaPagamento,
          observacao: f.observacao,
          lancadoPorNome: f.lancadoPorNome,
          notaFiscalNumero: f.notaFiscalNumero,
          notaFiscalNome: f.notaFiscalNome,
          notaFiscalUrl: f.notaFiscalUrl,
          reciboNumero: f.reciboNumero,
          comprovanteDespesaUrl: f.comprovanteDespesaUrl,
        });
      }
    }

    // Insert protocols
    if (dbJson.protocols && dbJson.protocols.length > 0) {
      console.log(`Importing ${dbJson.protocols.length} protocols...`);
      for (const p of dbJson.protocols) {
        const realVesselId = vesselIdMap.get(p.embarcacaoId);
        if (!realVesselId) continue;
        
        await db.insert(protocols).values({
          numeroProtocolo: p.numeroProtocolo,
          dataEnvio: p.dataEnvio,
          embarcacaoId: realVesselId,
          embarcacaoNome: p.embarcacaoNome,
          clienteNome: p.clienteNome,
          destinatario: p.destinatario,
          orgaoOuEmpresa: p.orgaoOuEmpresa,
          tipoProtocolo: p.tipoProtocolo,
          responsavelEnvioNome: p.responsavelEnvioNome,
          status: p.status,
          codigoRastreio: p.codigoRastreio,
          comprovanteUrl: p.comprovanteUrl,
          comprovanteNome: p.comprovanteNome,
          documentosIncluidos: p.documentosIncluidos || [],
          observacoes: p.observacoes,
        });
      }
    }

    // Insert critical pendings
    if (dbJson.criticalPendings && dbJson.criticalPendings.length > 0) {
      console.log(`Importing ${dbJson.criticalPendings.length} critical pendings...`);
      for (const c of dbJson.criticalPendings) {
        await db.insert(critical_pendings).values({
          tipo: c.tipo,
          titulo: c.titulo,
          embarcacaoNome: c.embarcacaoNome,
          detalhe: c.detalhe,
          urgencia: c.urgencia,
          data: c.data,
        });
      }
    }

    // Insert app configs
    console.log(`Importing configs...`);
    if (dbJson.emailConfig) {
      await db.insert(app_configs).values({ id: "email", data: dbJson.emailConfig });
    }
    if (dbJson.signatureConfig) {
      await db.insert(app_configs).values({ id: "signature", data: dbJson.signatureConfig });
    }
    if (dbJson.logoConfig) {
      await db.insert(app_configs).values({ id: "logo", data: dbJson.logoConfig });
    }

    // Clear password in JSON (or delete it altogether)
    console.log("Securing nautilus_db.json (removing users with passwords)...");
    delete dbJson.users;
    fs.writeFileSync(dataPath, JSON.stringify(dbJson, null, 2));

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Failed to seed database:", err);
  } finally {
    pool.end();
  }
}

run();
