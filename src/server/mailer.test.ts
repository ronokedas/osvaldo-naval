import assert from "node:assert/strict";
import test from "node:test";
import { getSmtpTransportOptions, toSafeEmailConfig, validateEmailConfig, type StoredEmailConfig } from "./mailer.js";

const config: StoredEmailConfig = {
  smtpHost: "smtp-relay.brevo.com",
  smtpPort: 587,
  usuario: "smtp-user",
  senha: "secret",
  nomeRemetente: "Amazon Naval",
  emailRemetente: "contato@amazonnaval.com.br",
  usarTlsSsl: true,
  ativo: true,
};

test("usa STARTTLS, e não TLS implícito, na porta 587", () => {
  const options = getSmtpTransportOptions(config) as any;
  assert.equal(options.secure, false);
  assert.equal(options.requireTLS, true);
});

test("usa TLS implícito na porta 465", () => {
  const options = getSmtpTransportOptions({ ...config, smtpPort: 465 }) as any;
  assert.equal(options.secure, true);
  assert.equal(options.requireTLS, false);
});

test("não expõe senha SMTP ao serializar a configuração", () => {
  const safe = toSafeEmailConfig(config);
  assert.equal("senha" in safe, false);
  assert.equal(safe.senhaConfigurada, true);
});

test("valida campos SMTP obrigatórios", () => {
  assert.equal(validateEmailConfig({ ...config, smtpPort: 70000 }), "Informe uma porta SMTP válida.");
  assert.equal(validateEmailConfig({ ...config, emailRemetente: "invalido" }), "Informe um e-mail remetente válido.");
  assert.equal(validateEmailConfig({ ...config, senha: "" }), "Informe a senha SMTP.");
});
