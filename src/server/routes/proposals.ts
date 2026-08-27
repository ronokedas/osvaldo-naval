import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../../db/index.js";
import {
  proposals, vessels, service_orders, service_order_items, os_events, documents,
  proposal_acceptances, proposal_deliveries, accounts_receivable, payments,
  financial_entries, clients,
} from "../../db/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth, requirePermission } from "../auth.js";
import { PERMISSIONS } from "../permissions.js";
import {
  serializeProposal, serializeServiceOrder, serializeProposalAcceptance,
  serializeProposalDelivery, serializeAccountReceivable, serializePayment,
} from "../serializers.js";
import { sendEmail } from "../mailer.js";

const router = Router();
const requireProposalAccess = requireAuth;
const requireCommercialAccess = requirePermission([PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS]);
const serviceOrderNumberFromProposal = (proposalNumber: string) => {
  const reference = String(proposalNumber || "").trim().replace(/^DS\s*/i, "");
  return `OS ${reference}`;
};
const calculateProposalValues = (items: unknown, requestedDiscount: unknown) => {
  const subtotal = Array.isArray(items)
    ? items.reduce((sum, item: any) => sum + Math.max(0, Number(item?.quantidade) || 0) * Math.max(0, Number(item?.valorUnitario) || 0), 0)
    : 0;
  const valorDesconto = Math.min(subtotal, Math.max(0, Number(requestedDiscount) || 0));
  return { valorDesconto, valorTotal: subtotal - valorDesconto };
};

// Multer config for acceptance documents
const acceptanceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads", "acceptances");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"));
  }
});

const acceptanceUpload = multer({
  storage: acceptanceStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|png|jpe?g|gif|bmp|tiff?)$/i;
    const ext = path.extname(file.originalname);
    if (allowed.test(ext)) return cb(null, true);
    cb(new Error('Tipo de arquivo não permitido. Aceitos: PDF, DOC/DOCX e imagens.'));
  },
});

router.get("/", requireProposalAccess, async (req, res) => {
  try {
    const all = await db.select().from(proposals).orderBy(desc(proposals.createdAt));
    res.json(all.map(serializeProposal));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireCommercialAccess, async (req, res) => {
  try {
    const data = req.body;
    const embarcacaoId = typeof data.embarcacaoId === 'string' && data.embarcacaoId.trim() ? data.embarcacaoId : null;
    const embarcacoesIds = Array.isArray(data.embarcacoesIds)
      ? data.embarcacoesIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      : (embarcacaoId ? [embarcacaoId] : []);
    if (!embarcacaoId && embarcacoesIds.length === 0) {
      return res.status(400).json({ error: 'A proposta precisa estar vinculada a uma embarcação.' });
    }
    
    const currentYear = new Date().getFullYear();
    const yearSuffix = String(currentYear).slice(-2);
    const yearCount = await db.select().from(proposals).where(
      sql`extract(year from created_at) = ${currentYear}`
    );
    const nextSeq = yearCount.length + 51;
    const formattedSeq = String(nextSeq).padStart(3, '0');
    const proposalNumber = data.numero || `DS ${formattedSeq}/${yearSuffix}`;
    
    const itens = Array.isArray(data.itens) ? data.itens : [];
    const values = calculateProposalValues(itens, data.valorDesconto);
    const inserted = await db.insert(proposals).values({
      numero: proposalNumber,
      dataEmissao: data.dataEmissao || new Date().toISOString().split("T")[0],
      validadeDias: data.validadeDias,
      clienteId: data.clienteId || null,
      embarcacaoId: embarcacaoId || embarcacoesIds[0],
      embarcacoesIds,
      embarcacaoNome: data.embarcacaoNome,
      clienteNome: data.clienteNome,
      destinatario: data.destinatario,
      assunto: data.assunto,
      prazoEntregaDias: data.prazoEntregaDias,
      condicoesPagamento: data.condicaoPagamento || data.condicoesPagamento,
      status: data.status || "rascunho",
      itens,
      valorDesconto: values.valorDesconto.toString(),
      valorTotal: values.valorTotal.toString(),
      observacoes: data.observacoesGerais || data.observacoes,
      ano: data.ano,
      elaboradoPor: data.elaboradoPor,
      aceiteData: data.aceiteData,
      aceiteAssinaturaNome: data.aceiteAssinaturaNome,
    }).returning();
    
    if (inserted[0].status === "aprovado" && inserted[0].embarcacaoId) {
      await db.update(vessels).set({ valorTotal: inserted[0].valorTotal }).where(eq(vessels.id, inserted[0].embarcacaoId));
    }
    
    res.json(serializeProposal(inserted[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/renewal", requireCommercialAccess, async (req: any, res) => {
  try {
    const original = (await db.select().from(proposals).where(eq(proposals.id, req.params.id)))[0];
    if (!original) return res.status(404).json({ error: "Proposta não encontrada" });
    if (original.status !== "aprovado" || !original.aceiteData) return res.status(400).json({ error: "A renovação só pode ser gerada a partir de uma proposta aceita" });
    const dueAt = new Date(`${original.aceiteData}T00:00:00`); dueAt.setDate(dueAt.getDate() + 365);
    if (dueAt > new Date()) return res.status(400).json({ error: "Esta proposta ainda não atingiu o prazo anual de renovação" });
    const year = new Date().getFullYear(); const total = await db.select().from(proposals);
    const numero = `DS ${String(total.filter((p) => new Date(p.createdAt || Date.now()).getFullYear() === year).length + 51).padStart(3, "0")}/${String(year).slice(-2)}`;
    const created = (await db.insert(proposals).values({
      numero, dataEmissao: new Date().toISOString().slice(0, 10), validadeDias: original.validadeDias,
      clienteId: original.clienteId, clienteNome: original.clienteNome, embarcacaoId: original.embarcacaoId,
      embarcacoesIds: original.embarcacoesIds || (original.embarcacaoId ? [original.embarcacaoId] : []), embarcacaoNome: original.embarcacaoNome,
      destinatario: original.destinatario, assunto: `Renovação anual — ${original.assunto || original.numero}`,
      prazoEntregaDias: original.prazoEntregaDias, condicoesPagamento: original.condicoesPagamento, itens: original.itens,
      valorDesconto: original.valorDesconto,
      valorTotal: original.valorTotal, observacoes: `Renovação gerada da proposta ${original.numero}. ${original.observacoes || ""}`,
      ano: year, elaboradoPor: req.user?.nome || original.elaboradoPor, status: "rascunho", renovacaoDeId: original.id,
    }).returning())[0];
    res.status(201).json(serializeProposal(created));
  } catch (error) { console.error(error); res.status(500).json({ error: "Não foi possível gerar a proposta de renovação" }); }
});

router.put("/renewals/:id/base-date", requireCommercialAccess, async (req: any, res) => {
  try {
    const aceiteData = String(req.body?.aceiteData || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(aceiteData)) {
      return res.status(400).json({ error: "Informe uma data de aceite válida." });
    }
    const updated = await db.update(proposals)
      .set({ aceiteData, updatedAt: new Date() })
      .where(eq(proposals.id, req.params.id))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "Proposta não encontrada." });
    res.json(serializeProposal(updated[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Não foi possível atualizar a data de renovação." });
  }
});

router.put("/:id", requireCommercialAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const current = (await db.select().from(proposals).where(eq(proposals.id, id)))[0];
    if (!current) return res.status(404).json({ error: "Not found" });
    const updateData: any = { updatedAt: new Date() };
    if (data.status !== undefined) updateData.status = data.status;
    if (data.clienteId !== undefined) updateData.clienteId = data.clienteId || null;
    if (data.embarcacoesIds !== undefined) updateData.embarcacoesIds = data.embarcacoesIds;
    if (data.itens !== undefined) updateData.itens = data.itens;
    if (data.itens !== undefined || data.valorDesconto !== undefined) {
      const values = calculateProposalValues(data.itens !== undefined ? data.itens : current.itens, data.valorDesconto !== undefined ? data.valorDesconto : current.valorDesconto);
      updateData.valorDesconto = values.valorDesconto.toString();
      updateData.valorTotal = values.valorTotal.toString();
    }
    if (data.destinatario !== undefined) updateData.destinatario = data.destinatario;
    if (data.assunto !== undefined) updateData.assunto = data.assunto;
    if (data.prazoEntregaDias !== undefined) updateData.prazoEntregaDias = data.prazoEntregaDias;
    if (data.condicaoPagamento !== undefined) updateData.condicoesPagamento = data.condicaoPagamento;
    if (data.observacoesGerais !== undefined) updateData.observacoes = data.observacoesGerais;
    if (data.elaboradoPor !== undefined) updateData.elaboradoPor = data.elaboradoPor;
    if (data.aceiteData !== undefined) updateData.aceiteData = data.aceiteData;
    if (data.aceiteAssinaturaNome !== undefined) updateData.aceiteAssinaturaNome = data.aceiteAssinaturaNome;
    
    const updated = await db.update(proposals).set(updateData).where(eq(proposals.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: "Not found" });
    
    if (data.status === "aprovado" && updated[0].embarcacaoId) {
      await db.update(vessels).set({ valorTotal: updated[0].valorTotal }).where(eq(vessels.id, updated[0].embarcacaoId));
    }
    
    res.json(serializeProposal(updated[0]));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- GET /api/proposals/:id/acceptance ----------
router.get("/:id/acceptance", requireProposalAccess, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const propList = await db.select().from(proposals).where(eq(proposals.id, id));
    if (propList.length === 0) return res.status(404).json({ error: "Proposta não encontrada" });
    const prop = propList[0];

    const accList = await db.select().from(proposal_acceptances).where(eq(proposal_acceptances.propostaId, id));
    const arList = await db.select().from(accounts_receivable).where(eq(accounts_receivable.propostaId, id));
    const osList = prop.osId
      ? await db.select().from(service_orders).where(eq(service_orders.id, prop.osId!))
      : [];

    let arWithPayments = null;
    let latestPayment = null;
    if (arList.length > 0) {
      const ar = arList[0];
      const arPayments = await db.select().from(payments).where(eq(payments.contaReceberId, ar.id));
      const totalPaid = arPayments.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
      arWithPayments = serializeAccountReceivable({ ...ar, valorPago: totalPaid });
      latestPayment = arPayments.length > 0 ? serializePayment(arPayments[arPayments.length - 1]) : null;
    }

    res.json({
      proposal: serializeProposal(prop),
      acceptance: accList.length > 0 ? serializeProposalAcceptance(accList[0]) : null,
      receivable: arWithPayments,
      payment: latestPayment,
      os: osList.length > 0 ? serializeServiceOrder(osList[0]) : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/proposals/:id/send-email ----------
router.post("/:id/send-email", requireCommercialAccess, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const propList = await db.select().from(proposals).where(eq(proposals.id, id));
    if (propList.length === 0) return res.status(404).json({ error: "Proposta não encontrada" });
    const prop = propList[0];

    if (!data.destinatarioEmail) {
      return res.status(400).json({ error: "Destinatário de e-mail é obrigatório" });
    }

    const pdfs = Array.isArray(data.pdfs) && data.pdfs.length
      ? data.pdfs
      : data.pdfBase64
        ? [{ filename: `Proposta_${prop.numero.replace(/\//g, '-')}.pdf`, base64: data.pdfBase64 }]
        : [];
    if (!pdfs.length) {
      return res.status(400).json({ error: "PDF da proposta é obrigatório" });
    }

    const subject = data.assunto || `Proposta ${prop.numero} - Nautilus Projetos Navais`;
    const message = data.mensagem || `Prezado(a), segue em anexo a proposta ${prop.numero} referente à embarcação ${prop.embarcacaoNome}.`;

    const result = await sendEmail({
      to: data.destinatarioEmail,
      subject,
      text: message,
      attachments: pdfs.map((pdf: any, index: number) => {
        const encoded = String(pdf.base64 || "");
        const base64Data = encoded.includes("base64,") ? encoded.split("base64,")[1] : encoded;
        return {
          filename: String(pdf.filename || `Proposta_${prop.numero.replace(/\//g, '-')}_${index + 1}.pdf`),
          content: Buffer.from(base64Data, "base64"),
          contentType: "application/pdf",
        };
      }),
    });

    // Register delivery
    await db.insert(proposal_deliveries).values({
      propostaId: id,
      canal: "email",
      destinatario: data.destinatarioEmail,
      status: result.ok ? "enviado" : "falha",
      erro: result.ok ? undefined : result.error,
      usuarioId: req.user?.id,
      usuarioNome: req.user?.nome || "Sistema",
    });

    if (!result.ok) {
      return res.status(502).json({ error: result.error, ok: false });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/proposals/:id/deliveries ----------
router.post("/:id/deliveries", requireCommercialAccess, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const propList = await db.select().from(proposals).where(eq(proposals.id, id));
    if (propList.length === 0) return res.status(404).json({ error: "Proposta não encontrada" });

    const inserted = await db.insert(proposal_deliveries).values({
      propostaId: id,
      canal: data.canal || "email",
      destinatario: data.destinatario || "",
      status: data.status || "enviado",
      erro: data.erro,
      usuarioId: req.user?.id,
      usuarioNome: req.user?.nome || "Sistema",
    }).returning();

    res.json(serializeProposalDelivery(inserted[0]));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- GET /api/proposals/:id/deliveries ----------
router.get("/:id/deliveries", requireProposalAccess, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const list = await db.select().from(proposal_deliveries)
      .where(eq(proposal_deliveries.propostaId, id))
      .orderBy(desc(proposal_deliveries.createdAt));
    res.json(list.map(serializeProposalDelivery));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- POST /api/proposals/:id/accept (multipart, idempotent, transactional) ----------
router.post("/:id/accept",
  requirePermission([PERMISSIONS.REGISTRAR_ACEITE_AGENDAR]),
  acceptanceUpload.single("documento"),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const propList = await db.select().from(proposals).where(eq(proposals.id, id));
      if (propList.length === 0) return res.status(404).json({ error: "Proposta não encontrada" });
      const prop = propList[0];

      // If proposal already has an OS, return it (idempotent)
      if (prop.osId) {
        const existingOs = await db.select().from(service_orders).where(eq(service_orders.id, prop.osId!));
        if (existingOs.length > 0) {
          return res.json({ created: false, os: serializeServiceOrder(existingOs[0]), redirecionarAgendamento: true });
        }
      }

      const data = req.body || {};
      const meio = data.meio || "outro";
      const responsavelNome = data.responsavelNome || prop.aceiteAssinaturaNome || "Cliente";
      const aceiteData = data.data || prop.aceiteData || new Date().toISOString().split("T")[0];
      const situacaoFinanceira = data.situacaoFinanceira || "pendente";
      const valorTotal = Number(prop.valorTotal) || 0;

      // Financial validation
      let valorRecebido = 0;
      if (situacaoFinanceira === "parcial") {
        valorRecebido = Number(data.valorRecebido) || 0;
        if (valorRecebido <= 0 || valorRecebido >= valorTotal) {
          return res.status(400).json({ error: "Pagamento parcial deve ser maior que zero e menor que o total" });
        }
      } else if (situacaoFinanceira === "integral") {
        valorRecebido = Number(data.valorRecebido) || valorTotal;
        if (valorRecebido !== valorTotal) {
          return res.status(400).json({ error: "Pagamento integral deve ser exatamente igual ao total da proposta" });
        }
      }

      const documentoUrl = req.file ? `/api/proposals/${id}/acceptance-document/${req.file.filename}` : undefined;
      const documentoNome = req.file ? req.file.originalname : undefined;

      const result = await db.transaction(async (tx) => {
        // 1. Mark proposal as aprovado
        await tx.update(proposals).set({
          status: "aprovado",
          aceiteData,
          aceiteAssinaturaNome: responsavelNome,
          updatedAt: new Date(),
        }).where(eq(proposals.id, id));

        // 2. Save acceptance (unique per proposal)
        await tx.insert(proposal_acceptances).values({
          propostaId: id,
          meio,
          responsavelNome,
          data: aceiteData,
          observacao: data.observacao || "",
          usuarioId: req.user?.id,
          usuarioNome: req.user?.nome || "Sistema",
          documentoUrl,
          documentoNome,
          origem: "normal",
        }).onConflictDoNothing();

        // 3. Create account receivable
        const ar = (await tx.insert(accounts_receivable).values({
          propostaId: id,
          embarcacaoId: prop.embarcacaoId,
          clienteId: prop.clienteId,
          valorOriginal: prop.valorTotal || "0",
          status: situacaoFinanceira === "pendente" ? "pendente" : situacaoFinanceira === "integral" ? "pago" : "parcial",
        }).onConflictDoNothing().returning())[0];

        let createdPayment = null;
        // 4. Register payment if received
        if (situacaoFinanceira !== "pendente" && ar) {
          const entry = (await tx.insert(financial_entries).values({
            embarcacaoId: prop.embarcacaoId,
            embarcacaoNome: prop.embarcacaoNome,
            clienteNome: prop.clienteNome,
            data: data.dataPagamento || aceiteData,
            valor: valorRecebido.toString(),
            tipo: situacaoFinanceira === "integral" ? "quitacao" : "parcela",
            formaPagamento: data.formaPagamento || "PIX",
            observacao: `Pagamento registrado no aceite da proposta ${prop.numero}`,
            lancadoPorNome: req.user?.nome || "Sistema",
            propostaId: id,
            contaReceberId: ar?.id,
            situacaoConciliacao: "conciliado",
          }).returning())[0];
          createdPayment = (await tx.insert(payments).values({
            contaReceberId: ar.id,
            propostaId: id,
            embarcacaoId: prop.embarcacaoId,
            financialEntryId: entry.id,
            valor: valorRecebido.toString(),
            data: data.dataPagamento || aceiteData,
            formaPagamento: data.formaPagamento || "PIX",
            observacao: `Pagamento registrado no aceite da proposta ${prop.numero}`,
            lancadoPorNome: req.user?.nome || "Sistema",
          }).returning())[0];
        }

        // 5. Recalculate aggregate vessel values from all accepted proposals/payments.
        if (prop.embarcacaoId) {
          await tx.execute(sql`
            UPDATE vessels
            SET valor_total = (
                  SELECT COALESCE(SUM(valor_original), 0) FROM accounts_receivable
                  WHERE embarcacao_id = ${prop.embarcacaoId}
                ),
                valor_recebido = (
                  SELECT COALESCE(SUM(valor), 0) FROM payments
                  WHERE embarcacao_id = ${prop.embarcacaoId} AND ativo = TRUE
                )
            WHERE id = ${prop.embarcacaoId}
          `);
        }

        // 6. Create one OS per vessel. A single-vessel proposal keeps the clean
        // commercial reference (DS 055/26 -> OS 055/26); multiple vessels use
        // deterministic suffixes (OS 055/26-01, OS 055/26-02).
        const vesselIds = Array.from(new Set([
          ...(Array.isArray(prop.embarcacoesIds) ? prop.embarcacoesIds : []),
          ...(prop.embarcacaoId ? [prop.embarcacaoId] : []),
        ].filter(Boolean))) as string[];
        const osVessels = vesselIds.length ? vesselIds : [null];
        const createdOrders: any[] = [];
        const itens = (prop.itens || []) as any[];
        for (let orderIndex = 0; orderIndex < osVessels.length; orderIndex += 1) {
          const vesselId = osVessels[orderIndex];
          const baseNumber = serviceOrderNumberFromProposal(prop.numero);
          const numero = osVessels.length > 1 ? `${baseNumber}-${String(orderIndex + 1).padStart(2, "0")}` : baseNumber;
          const os = (await tx.insert(service_orders).values({
            numero,
            propostaId: id,
            embarcacaoId: vesselId,
            clienteId: prop.clienteId,
            status: "aguardando_agendamento",
            dataAceite: aceiteData,
            observacoes: `Criado a partir do aceite da proposta ${prop.numero}`,
          }).returning())[0];
          createdOrders.push(os);

          for (const item of itens) {
            await tx.insert(service_order_items).values({
              osId: os.id,
              descricao: item.descricao || "Item",
              quantidade: item.quantidade || 1,
              valorUnitario: (item.valorUnitario || 0).toString(),
              tipo: inferTipo(item.descricao || ""),
              status: "pendente",
            });
            await tx.insert(documents).values({
              osId: os.id,
              titulo: item.descricao || "Documento técnico",
              tipo: inferTipo(item.descricao || ""),
              status: "em_elaboracao",
            });
          }

          await tx.insert(os_events).values({
            osId: os.id,
            tipo: "criacao",
            autorId: req.user?.id,
            autorNome: req.user?.nome || "Sistema",
            descricao: `Ordem de Serviço criada a partir do aceite da proposta ${prop.numero}.`,
            dados: { meio, situacaoFinanceira, valorRecebido },
          });
        }
        const os = createdOrders[0];

        // Keep the first OS as the proposal's primary shortcut.
        await tx.update(proposals).set({ osId: os.id }).where(eq(proposals.id, id));

        // Link account receivable to OS
        if (ar) {
          await tx.update(accounts_receivable).set({ osId: os.id, updatedAt: new Date() }).where(eq(accounts_receivable.id, ar.id));
          await tx.update(payments).set({ osId: os.id }).where(eq(payments.contaReceberId, ar.id));
          await tx.update(financial_entries).set({ osId: os.id }).where(eq(financial_entries.contaReceberId, ar.id));
        }

        return { os, ordens: createdOrders, ar, createdPayment };
      });

      res.json({
        created: true,
        os: serializeServiceOrder(result.os),
        ordens: result.ordens.map(serializeServiceOrder),
        redirecionarAgendamento: true,
        receivable: result.ar ? serializeAccountReceivable(result.ar) : null,
        payment: result.createdPayment ? serializePayment(result.createdPayment) : null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Signed acceptance files contain personal signatures and are intentionally not public.
router.get("/:id/acceptance-document/:file", requireProposalAccess, async (req: any, res: any) => {
  const acceptance = (await db.select().from(proposal_acceptances)
    .where(eq(proposal_acceptances.propostaId, req.params.id)))[0];
  if (!acceptance?.documentoUrl) return res.status(404).json({ error: "Documento de aceite não encontrado" });
  const stored = path.basename(acceptance.documentoUrl);
  if (req.params.file !== stored) return res.status(404).json({ error: "Arquivo de aceite não encontrado" });
  return res.sendFile(path.join(process.cwd(), "uploads", "acceptances", stored));
});

router.get("/renewals/due", requireProposalAccess, async (_req, res) => {
  try {
    const limit = new Date(); limit.setDate(limit.getDate() - 365);
    const due = (await db.select().from(proposals).where(eq(proposals.status, "aprovado")))
      .filter((proposal) => proposal.aceiteData && new Date(`${proposal.aceiteData}T00:00:00`) <= limit && !proposal.renovacaoDeId)
      .map((proposal) => ({ ...serializeProposal(proposal), renovacaoDisponivel: true }));
    res.json(due);
  } catch (error) { console.error(error); res.status(500).json({ error: "Não foi possível carregar renovações" }); }
});

function inferTipo(descricao: string): string {
  const d = (descricao || "").toLowerCase();
  if (d.includes("ultrassom") || d.includes("espessura") || d.includes("solda")) return "ultrassom";
  if (d.includes("desenho") || d.includes("plano") || d.includes("croqui")) return "desenho";
  if (d.includes("art") || d.includes("responsabilidade")) return "art";
  if (d.includes("homologa")) return "homologacao";
  if (d.includes("relatorio") || d.includes("memoria")) return "relatorio";
  return "outro";
}

export default router;
