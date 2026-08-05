import { Router } from "express";
import { db } from "../../db/index.js";
import { app_configs } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../auth.js";

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

export default router;
