import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
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

export interface StoredEmailConfig {
  smtpHost: string;
  smtpPort: number;
  usuario: string;
  senha?: string;
  nomeRemetente: string;
  emailRemetente: string;
  usarTlsSsl: boolean;
  ativo: boolean;
  envioAutomaticoPropostas?: boolean;
  envioAutomaticoProtocolos?: boolean;
  envioAutomaticoRecibos?: boolean;
}

export const isValidEmailAddress = (value: unknown) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function validateEmailConfig(config: Partial<StoredEmailConfig>, requirePassword = true): string | null {
  if (!config.smtpHost?.trim()) return "Informe o servidor SMTP.";
  const port = Number(config.smtpPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return "Informe uma porta SMTP válida.";
  if (!config.usuario?.trim()) return "Informe o usuário SMTP.";
  if (!isValidEmailAddress(config.emailRemetente)) return "Informe um e-mail remetente válido.";
  if (requirePassword && !config.senha?.trim()) return "Informe a senha SMTP.";
  return null;
}

/** O segredo nunca é enviado para o navegador. */
export function toSafeEmailConfig(config: Partial<StoredEmailConfig> | null | undefined) {
  const { senha: secret, ...safe } = config || {};
  return { ...safe, senhaConfigurada: Boolean(secret) };
}

/**
 * Portas 587/2525 usam STARTTLS; TLS implícito (`secure: true`) é somente
 * para 465. Isso evita o erro ESOCKET "wrong version number" da Brevo.
 */
export function createEmailTransport(config: StoredEmailConfig) {
  return nodemailer.createTransport(getSmtpTransportOptions(config));
}

export function getSmtpTransportOptions(config: StoredEmailConfig): SMTPTransport.Options {
  const port = Number(config.smtpPort) || 587;
  const implicitTls = port === 465;
  const options: SMTPTransport.Options = {
    host: config.smtpHost,
    port,
    secure: implicitTls,
    requireTLS: !implicitTls && config.usarTlsSsl === true,
    auth: { user: config.usuario, pass: config.senha },
  };
  return options;
}

export async function getEmailConfig(): Promise<StoredEmailConfig | null> {
  const configList = await db.select().from(app_configs).where(eq(app_configs.id, "email"));
  if (configList.length === 0) return null;
  return configList[0].data as StoredEmailConfig;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  try {
    const config = await getEmailConfig();
    if (!config || !config.ativo) {
      return { ok: false, error: "Configuração de e-mail não está ativa." };
    }
    const validationError = validateEmailConfig(config);
    if (validationError) return { ok: false, error: validationError };

    const transporter = createEmailTransport(config);

    await transporter.sendMail({
      from: `"${config.nomeRemetente || "Nautilus Projetos Navais"}" <${config.emailRemetente}>`,
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
