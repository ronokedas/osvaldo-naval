import test from "node:test";
import assert from "node:assert/strict";
import { awaitingExternalLabel, deriveProtocolStatus, isValidProtocolAttachment } from "./protocol-workflow.js";

test("a package is approved only when every selected document is approved", () => {
  assert.equal(deriveProtocolStatus(["aprovado", "aprovado_com_observacoes"]), "aprovado");
  assert.equal(deriveProtocolStatus(["aprovado", "aguardando_analise"]), "aguardando_analise");
});

test("an external requirement keeps the dossier open", () => {
  assert.equal(deriveProtocolStatus(["aprovado", "exigencia"]), "exigencia_recebida");
});

test("external evidence must be an authenticated local upload", () => {
  assert.equal(isValidProtocolAttachment({ arquivoUrl: "/api/upload/files/prova.pdf", arquivoNome: "prova.pdf" }), true);
  assert.equal(isValidProtocolAttachment({ arquivoUrl: "https://example.com/prova.pdf", arquivoNome: "prova.pdf" }), false);
  assert.equal(isValidProtocolAttachment({ arquivoUrl: "/api/upload/files/prova.pdf" }), false);
});

test("correction cycles receive an automatic, unambiguous label", () => {
  assert.match(awaitingExternalLabel(0), /inicial/);
  assert.match(awaitingExternalLabel(2), /correção 2/);
});
