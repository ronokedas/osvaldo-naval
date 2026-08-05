import nodemailer from "nodemailer";
import { db } from "../db/index.js";
import { app_configs } from "../db/schema.js";
import { eq } from "drizzle-orm";

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export async function getEmailConfig(): Promise<any | null> {
  const configList = await db.select().from(app_configs).where(eq(app_configs.id, "email"));
  if (configList.length === 0) return null;
  return configList[0].data as any;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  try {
    const config = await getEmailConfig();
    if (!config || !config.ativo) {
      return { ok: false, error: "Configuração de e-mail não está ativa." };
    }
    if (!config.smtpHost || !config.usuario || !config.senha) {
      return { ok: false, error: "Configuração SMTP incompleta. Verifique host, usuário e senha." };
    }

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
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Falha no envio de e-mail" };
  }
}