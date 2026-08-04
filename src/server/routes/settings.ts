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
  // Real implementation would connect to SMTP here using nodemailer
  // Since we don't have real credentials, we will just simulate success
  // or return an error to show it requires real SMTP.
  res.json({
    success: true,
    message: "Função de envio real de e-mail requer configuração SMTP válida. (Simulado com sucesso)"
  });
});

export default router;
