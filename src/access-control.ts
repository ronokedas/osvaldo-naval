export const MODULE_ACCESS = {
  VESSELS: "module_vessels",
  REGISTRATIONS: "module_registrations",
  COMMITMENTS: "module_commitments",
  TASKS: "module_tasks",
  PROPOSALS: "module_proposals",
  RENEWALS: "module_renewals",
  SERVICE_ORDERS: "module_service_orders",
  FINANCIAL: "module_financial",
  PROTOCOLS: "module_protocols",
  DOCUMENTS: "module_documents",
  SETTINGS: "module_settings",
} as const;

export type ModuleId =
  | "vessels" | "registrations" | "commitments" | "tasks" | "proposals"
  | "renewals" | "service-orders" | "financial" | "protocols" | "documents" | "settings";

export const MODULE_ACCESS_MARKER = "module_access_configured";

export const MODULE_CATALOG: Array<{ id: ModuleId; label: string; permission: string; adminOnly?: boolean }> = [
  { id: "vessels", label: "Embarcações", permission: MODULE_ACCESS.VESSELS },
  { id: "registrations", label: "Cadastros", permission: MODULE_ACCESS.REGISTRATIONS },
  { id: "commitments", label: "Pendências e Compromissos", permission: MODULE_ACCESS.COMMITMENTS },
  { id: "tasks", label: "Tarefas", permission: MODULE_ACCESS.TASKS },
  { id: "proposals", label: "Propostas", permission: MODULE_ACCESS.PROPOSALS },
  { id: "renewals", label: "Renovações Anuais", permission: MODULE_ACCESS.RENEWALS },
  { id: "service-orders", label: "Ordens de Serviço", permission: MODULE_ACCESS.SERVICE_ORDERS },
  { id: "financial", label: "Financeiro", permission: MODULE_ACCESS.FINANCIAL },
  { id: "protocols", label: "Protocolos & Entregas", permission: MODULE_ACCESS.PROTOCOLS },
  { id: "documents", label: "Documentos", permission: MODULE_ACCESS.DOCUMENTS },
  { id: "settings", label: "Configurações do Sistema", permission: MODULE_ACCESS.SETTINGS, adminOnly: true },
];

const byId = new Map(MODULE_CATALOG.map((module) => [module.id, module]));
const modulePermissions = new Set(MODULE_CATALOG.map((module) => module.permission));

export const modulePermission = (module: ModuleId) => byId.get(module)!.permission;
export const moduleIdsFromPermissions = (permissions: unknown): ModuleId[] => {
  const values = Array.isArray(permissions) ? permissions : [];
  return MODULE_CATALOG.filter((module) => values.includes(module.permission)).map((module) => module.id);
};

export const defaultModulesForRole = (role: string): ModuleId[] => {
  if (role === "admin") return MODULE_CATALOG.map((module) => module.id);
  if (role === "financeiro") return ["vessels", "registrations", "commitments", "proposals", "renewals", "service-orders", "financial", "protocols"];
  return ["vessels", "commitments", "tasks", "service-orders", "protocols"];
};

export const hasModuleAccess = (user: any, module: ModuleId): boolean => {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (module === "settings") return false;
  return Array.isArray(user.permissions) && user.permissions.includes(modulePermission(module));
};

export const mergeModuleAccess = (permissions: unknown, modules: ModuleId[]): string[] => {
  const retained = (Array.isArray(permissions) ? permissions : []).filter((permission) => !modulePermissions.has(permission) && permission !== MODULE_ACCESS_MARKER && permission !== "documents_access");
  return [...new Set([...retained, ...modules.filter((module) => module !== "settings").map(modulePermission), MODULE_ACCESS_MARKER])];
};

/** Initializes legacy accounts once while preserving administrator-managed choices afterwards. */
export const initializeModuleAccess = (permissions: unknown, role: string): string[] => {
  const values = Array.isArray(permissions) ? permissions.filter((permission): permission is string => typeof permission === "string") : [];
  if (values.includes(MODULE_ACCESS_MARKER)) return values;
  const legacyDocumentsAccess = values.includes("documents_access");
  const defaults = defaultModulesForRole(role);
  if (legacyDocumentsAccess && !defaults.includes("documents")) defaults.push("documents");
  return mergeModuleAccess(values, defaults);
};
