export const EXTERNAL_APPROVED_RESULTS = new Set(["aprovado", "aprovado_com_observacoes"]);
export const EXTERNAL_RESPONSE_TYPES = new Set(["aprovado", "aprovado_com_observacoes", "exigencia"]);

export function isValidProtocolAttachment(attachment: any) {
  return Boolean(attachment?.arquivoUrl?.startsWith("/api/upload/files/") && String(attachment?.arquivoNome || "").trim());
}

export function deriveProtocolStatus(latestDocumentResults: string[]) {
  if (!latestDocumentResults.length) return "aguardando_analise";
  if (latestDocumentResults.includes("exigencia")) return "exigencia_recebida";
  if (latestDocumentResults.every((result) => EXTERNAL_APPROVED_RESULTS.has(result))) return "aprovado";
  return "aguardando_analise";
}

export function awaitingExternalLabel(cycle: number) {
  return cycle > 0
    ? `Protocolo de correção ${cycle} enviado — aguardando análise da certificadora.`
    : "Protocolo inicial enviado — aguardando análise da certificadora.";
}
