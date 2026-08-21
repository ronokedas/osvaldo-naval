import { Router } from "express";
import { db } from "../../db/index.js";
import { app_configs } from "../../db/schema.js";
import * as schema from "../../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../auth.js";
import express from "express";

const router = Router();

router.get("/:type", requireAuth, async (req, res) => {
  try {
    const { type } = req.params; // email, signature, logo
    const configList = await db.select().from(app_configs).where(eq(app_configs.id, type));
    if (configList.length === 0) return res.json({});
    
    // Hide password for non-admins maybe, but the UI expects it for now
    // In a real app we wouldn't send SMTP password to the UI. We'll nullify it if not admin.
    let data = configList[0].data as any;
    if (type === "email" && req.session.userRole !== "admin") {
      data = { ...data, senha: "" };
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:type", requireRole(["admin"]), async (req, res) => {
  try {
    const { type } = req.params;
    
    // Check if exists
    const existing = await db.select().from(app_configs).where(eq(app_configs.id, type));
    let dataToSave = req.body;
    
    if (existing.length > 0) {
      if (type === "email" && !dataToSave.senha) {
        // preserve old password if not updated
        const oldData = existing[0].data as any;
        dataToSave.senha = oldData.senha;
      }
      await db.update(app_configs).set({ data: dataToSave, updatedAt: new Date() }).where(eq(app_configs.id, type));
    } else {
      await db.insert(app_configs).values({ id: type, data: dataToSave });
    }
    
    // return saved without password
    if (type === "email") dataToSave.senha = "";
    res.json(dataToSave);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/email/test", requireRole(["admin"]), async (req, res) => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ ok: false, error: "E-mail de destino é obrigatório" });
    }
    const configList = await db.select().from(app_configs).where(eq(app_configs.id, "email"));
    if (configList.length === 0 || !(configList[0].data as any)?.ativo) {
      return res.status(400).json({ ok: false, error: "Configuração de e-mail não está ativa." });
    }
    const config = configList[0].data as any;
    if (!config.smtpHost || !config.usuario || !config.senha) {
      return res.status(400).json({ ok: false, error: "Configuração SMTP incompleta. Verifique host, usuário e senha." });
    }

    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort) || 587,
      secure: config.usarTlsSsl === true,
      auth: {
        user: config.usuario,
        pass: config.senha,
      },
    });

    await transporter.sendMail({
      from: `"${config.nomeRemetente || "Nautilus Projetos Navais"}" <${config.emailRemetente || config.usuario}>`,
      to: targetEmail,
      subject: "Teste de Configuração SMTP - Nautilus",
      text: "Este é um e-mail de teste enviado pelo Sistema Nautilus. Se você recebeu esta mensagem, a configuração SMTP está funcionando corretamente.",
    });

    res.json({ ok: true, message: "E-mail de teste enviado com sucesso." });
  } catch (err: any) {
    console.error("SMTP test error:", err);
    res.status(502).json({ ok: false, error: err?.message || "Falha ao conectar ao SMTP. Verifique a configuração." });
  }
});

const DATA_TABLES = [
  "users", "clients", "certifiers", "vessels", "tasks", "proposals", 
  "proposal_acceptances", "proposal_deliveries", "accounts_receivable", 
  "payments", "receipts", "financial_entries", "financial_categories", 
  "financial_suppliers", "accounts_payable", "financial_attachments", 
  "protocols", "critical_pendings", "app_configs", "service_orders", 
  "service_order_items", "schedules", "documents", "document_versions", 
  "external_submissions", "external_responses", "deliveries", "os_events", 
  "notifications", "services", "service_order_item_comments", "commitments", 
  "commitment_attachments"
];

// Ordem de restauração respeitando as dependências das chaves estrangeiras.
// As tabelas não incluídas no backup são simplesmente ignoradas.
const RESTORE_ORDER = [
  "users", "clients", "certifiers", "financial_categories", "financial_suppliers", "services",
  "vessels", "proposals", "tasks", "proposal_acceptances", "proposal_deliveries",
  "service_orders", "accounts_payable", "accounts_receivable", "payments", "receipts",
  "financial_entries", "financial_attachments", "protocols", "critical_pendings",
  "service_order_items", "schedules", "documents", "document_versions",
  "external_submissions", "external_responses", "deliveries", "os_events", "commitments",
  "commitment_attachments", "service_order_item_comments", "notifications", "app_configs"
];

const DATA_TABLE_SET = new Set(DATA_TABLES);

const unwrapRestoreError = (error: any) => {
  const cause = error?.cause;
  return {
    code: error?.code || cause?.code,
    message: error?.message || cause?.message || "",
    detail: error?.detail || cause?.detail,
    constraint: error?.constraint || cause?.constraint,
  };
};

const getRestoreErrorMessage = (error: any) => {
  const code = unwrapRestoreError(error).code;
  if (code === "23505") return "O backup contém registros duplicados.";
  if (code === "23503") return "O backup contém referências entre registros inválidas.";
  if (code === "23502") return "O backup não contém um campo obrigatório.";
  if (code === "23514") return "O backup viola uma regra de validação do banco.";
  if (code === "22P02") return "O backup contém um valor em formato inválido.";
  if (code === "22001") return "Um valor do backup excede o tamanho permitido pela estrutura atual do banco.";
  if (code === "22007") return "O backup contém uma data em formato inválido.";
  if (code === "42804") return "Um valor do backup não corresponde ao tipo da coluna no banco.";
  if (code === "42501") return "O usuário do banco não tem permissão para restaurar os dados.";
  if (code === "42P01" || code === "42703") return "A estrutura do banco está desatualizada para este backup.";
  if (code === "ECONNREFUSED") return "Não foi possível conectar ao banco de dados.";
  return "O banco recusou um ou mais registros do backup.";
};

router.get("/data/backup", requireRole(["admin"]), async (req, res) => {
  try {
    const backup: Record<string, any[]> = {};
    for (const tableName of DATA_TABLES) {
      if ((schema as any)[tableName]) {
        backup[tableName] = await db.select().from((schema as any)[tableName]);
      }
    }
    res.json(backup);
  } catch (error) {
    console.error("Backup error:", error);
    res.status(500).json({ error: "Erro ao gerar backup" });
  }
});

router.post("/data/restore", requireRole(["admin"]), express.json({ limit: '200mb' }), async (req, res) => {
  let restoreStage = "validando o arquivo";
  try {
    const backupData = req.body;
    if (!backupData || typeof backupData !== 'object' || Array.isArray(backupData)) {
      return res.status(400).json({ error: "Formato de backup inválido" });
    }

    const backupTables = Object.keys(backupData);
    const unknownTables = backupTables.filter((tableName) => !DATA_TABLE_SET.has(tableName));
    if (unknownTables.length > 0) {
      return res.status(400).json({ error: "O backup contém tabelas não suportadas." });
    }

    const invalidTables = backupTables.filter((tableName) => !Array.isArray(backupData[tableName]));
    if (invalidTables.length > 0) {
      return res.status(400).json({ error: "Cada tabela do backup deve conter uma lista de registros." });
    }

    await db.transaction(async (tx) => {
      // CASCADE permite limpar dependências sem exigir privilégios de superusuário.
      for (const tableName of backupTables) {
        if ((schema as any)[tableName]) {
          restoreStage = `limpando a tabela ${tableName}`;
          await tx.execute(sql.raw(`TRUNCATE TABLE "${tableName}" CASCADE;`));
        }
      }

      for (const tableName of RESTORE_ORDER) {
        if ((schema as any)[tableName] && backupData[tableName]?.length > 0) {
          const tableConfig = (schema as any)[tableName];
          const rows = backupData[tableName];

          for (let i = 0; i < rows.length; i += 100) {
            const batchNumber = Math.floor(i / 100) + 1;
            restoreStage = `inserindo dados em ${tableName} (lote ${batchNumber})`;
            let chunk = rows.slice(i, i + 100);
            
            // Fix for "You can't mix objects with different keys in insert array"
            const allKeys = new Set<string>();
            for (const row of chunk) {
              if (row && typeof row === 'object') {
                Object.keys(row).forEach(k => allKeys.add(k));
              }
            }
            chunk = chunk.map((row: any) => {
              if (!row || typeof row !== 'object') return row;
              const newRow: any = {};
              for (const k of allKeys) {
                let val = row[k] !== undefined ? row[k] : null;
                
                // Fix for "value.toISOString is not a function":
                // If the column in schema is a timestamp/date, Drizzle requires a Date object
                const columnDef = tableConfig[k];
                if (columnDef?.dataType === 'date') {
                  if (val) {
                    const date = new Date(val);
                    val = isNaN(date.getTime()) ? null : date;
                  } else {
                    val = null;
                  }
                } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
                  // Fallback for any date-like string if columnDef is somehow not indexed by k
                  const date = new Date(val);
                  if (!isNaN(date.getTime())) {
                    val = date;
                  }
                }
                
                newRow[k] = val;
              }
              return newRow;
            });

            try {
              await tx.insert(tableConfig).values(chunk);
            } catch (error: any) {
              console.error(`Restore error in table ${tableName}, batch ${batchNumber}:`, {
                code: error?.code,
                detail: error?.detail,
                constraint: error?.constraint,
                message: error?.message || error?.cause?.message,
              });
              throw error;
            }
          }
        }
      }
    });

    res.json({ ok: true, message: "Backup restaurado com sucesso" });
  } catch (error: any) {
    const restoreError = unwrapRestoreError(error);
    console.error("Restore error:", {
      stage: restoreStage,
      ...restoreError,
      raw: error
    });
    const errorCode = restoreError.code;
    const errorSuffix = errorCode ? ` (código ${errorCode})` : "";
    const rawMsg = error?.message || error?.cause?.message || String(error);
    const safeMessage = ` Detalhe: ${rawMsg.replace(/[\r\n]+/g, " ").slice(0, 300)}`;
    
    res.status(500).json({
      error: `Erro ao restaurar backup ao ${restoreStage}. ${getRestoreErrorMessage(error)}${errorSuffix}.${safeMessage}`
    });
  }
});

router.post("/data/wipe", requireRole(["admin"]), async (req, res) => {
  try {
    const { level } = req.body;
    
    let tablesToWipe: string[] = [];

    if (level === "transactions") {
      tablesToWipe = [
        "tasks", "proposals", "proposal_acceptances", "proposal_deliveries",
        "accounts_receivable", "payments", "receipts", "financial_entries",
        "accounts_payable", "financial_attachments", "protocols", "critical_pendings",
        "service_orders", "service_order_items", "schedules", "documents",
        "document_versions", "external_submissions", "external_responses",
        "deliveries", "os_events", "notifications", "service_order_item_comments",
        "commitments", "commitment_attachments"
      ];
    } else if (level === "all") {
      tablesToWipe = DATA_TABLES.filter(t => t !== "users" && t !== "app_configs");
    } else {
      return res.status(400).json({ error: "Nível de wipe inválido" });
    }

    await db.transaction(async (tx) => {
      await tx.execute(sql`SET session_replication_role = 'replica';`);
      for (const tableName of tablesToWipe) {
        if ((schema as any)[tableName]) {
          await tx.execute(sql.raw(`TRUNCATE TABLE "${tableName}" CASCADE;`));
        }
      }

      if (level === "transactions") {
        await tx.execute(sql`
          UPDATE "vessels" 
          SET "valor_total" = 0, 
              "valor_recebido" = 0, 
              "valor_sinal" = 0, 
              "progresso" = 0, 
              "status" = 'aberta',
              "etapa_atual" = NULL
        `);
      }

      await tx.execute(sql`SET session_replication_role = 'origin';`);
    });

    res.json({ ok: true, message: "Limpeza de dados concluída com sucesso." });
  } catch (error) {
    console.error("Wipe error:", error);
    res.status(500).json({ error: "Erro ao limpar dados." });
  }
});

export default router;
