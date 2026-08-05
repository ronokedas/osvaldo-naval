export const PERMISSIONS = {
  CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS: "cadastrar_clientes_embarcacoes_propostas",
  REGISTRAR_ACEITE_AGENDAR: "registrar_aceite_agendar",
  EXECUTAR_VISTORIA: "executar_vistoria",
  ANEXAR_EDITAR_VERSOES: "anexar_editar_versoes",
  REVISAR_DOCUMENTOS: "revisar_documentos",
  APROVAR_TECNICAMENTE: "aprovar_tecnicamente",
  REGISTRAR_ENVIO_RESPOSTA_EXTERNA: "registrar_envio_resposta_externa",
  ENTREGAR_CONCLUIR: "entregar_concluir",
  FINANCEIRO_ADMINISTRACAO: "financeiro_administracao",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type Permission = (typeof PERMISSIONS)[PermissionKey];

// Convenience helper: returns true if user has the permission (admin always has all)
export function userHasPermission(user: any, perm: Permission): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  const perms: string[] = Array.isArray(user.permissions) ? user.permissions : [];
  return perms.includes(perm);
}