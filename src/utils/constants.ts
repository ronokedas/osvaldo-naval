// Constants and configuration values for the Nautilus application

export const APP_CONSTANTS = {
  // Session configuration
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  
  // File upload limits
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Proposal defaults
  DEFAULT_PROPOSAL_SEQUENCE_START: 51,
  DEFAULT_PROPOSAL_VALIDITY_DAYS: 30,
  
  // Task types
  TASK_TYPES: ['ultrassom', 'desenho', 'art', 'homologacao', 'relatorio', 'memoria'] as const,
  
  // Task statuses
  TASK_STATUSES: ['pendente', 'execucao', 'em_revisao', 'enviado', 'exigencia', 'aprovado'] as const,
  
  // Vessel statuses
  VESSEL_STATUSES: ['aberta', 'concluida'] as const,
  
  // Proposal statuses
  PROPOSAL_STATUSES: ['rascunho', 'enviado', 'aprovado', 'recusado', 'faturado'] as const,
  
  // Payment methods
  PAYMENT_METHODS: ['PIX', 'Transferência', 'Boleto', 'Dinheiro', 'Cartão'] as const,
  
  // Notification priorities
  NOTIFICATION_PRIORITIES: ['normal', 'alta', 'critica'] as const,
  
  // Document version origins
  DOCUMENT_ORIGINS: ['vistoria', 'correcao_interna', 'exigencia_externa'] as const,
  
  // Delivery statuses
  DELIVERY_STATUSES: ['pendente', 'impresso', 'entregue'] as const,
  
  // Standard tasks for new vessels
  STANDARD_VESSEL_TASKS: [
    { tipo: 'ultrassom', titulo: 'Relatório de Medição de Espessura (Ultrassom)', prazo: '10 dias' },
    { tipo: 'desenho', titulo: 'Croqui de Sondagem e Estrutura', prazo: '15 dias' },
    { tipo: 'art', titulo: 'Emissão de ART (CREA)', prazo: '5 dias' },
    { tipo: 'homologacao', titulo: 'Homologação na Certificadora', prazo: '30 dias' }
  ],
  
  // User roles
  USER_ROLES: ['admin', 'tecnico', 'financeiro'] as const,
  
  // Certification entities
  CERTIFICADORAS: ['Amazon Naval', 'DNV', 'ABS', 'LR', 'BV', 'NK', 'ClassNK'] as const,
};

export const API_ENDPOINTS = {
  AUTH: {
    ME: '/api/auth/me',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
  },
  VESSELS: '/api/vessels',
  CLIENTS: '/api/clients',
  PROPOSALS: '/api/proposals',
  TASKS: '/api/tasks',
  FINANCE: '/api/finance',
  PROTOCOLS: '/api/protocols',
  CRITICAL_PENDINGS: '/api/critical-pendings',
  SETTINGS: {
    EMAIL: '/api/settings/email',
    SIGNATURE: '/api/settings/signature',
    LOGO: '/api/settings/logo',
  },
  USERS: '/api/users',
  SERVICE_ORDERS: '/api/service-orders',
  RECEIVABLES: '/api/receivables',
  UPLOADS: '/api/upload',
} as const;

export const UI_DEFAULTS = {
  ITEMS_PER_PAGE: 10,
  SEARCH_DEBOUNCE_MS: 300,
  NOTIFICATION_AUTO_DISMISS_MS: 5000,
} as const;

export const DATE_FORMATS = {
  DATE_INPUT: 'YYYY-MM-DD',
  DATETIME_DISPLAY: 'DD/MM/YYYY HH:mm',
  DATE_DISPLAY: 'DD/MM/YYYY',
} as const;
