import { Request, Response, NextFunction } from "express";

/**
 * Middleware para validar permissões financeiras
 * Apenas usuários com role 'admin' ou 'financeiro' podem acessar rotas financeiras
 */
export function requireFinanceAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ 
        error: "Não autorizado", 
        message: "Usuário não autenticado" 
      });
    }

    const allowedRoles = ["admin", "financeiro"];
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: "Acesso negado", 
        message: "Você não tem permissão para acessar recursos financeiros. Apenas administradores e usuários do setor financeiro podem realizar esta ação." 
      });
    }

    next();
  } catch (error) {
    console.error("Erro no middleware requireFinanceAccess:", error);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: "Erro ao validar permissões" 
    });
  }
}

/**
 * Middleware específico para operações de escrita (criar/editar)
 * Requer role 'admin' ou 'financeiro'
 */
export function requireFinanceWriteAccess(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ 
      error: "Não autorizado", 
      message: "Usuário não autenticado" 
    });
  }

  const allowedRoles = ["admin", "financeiro"];
  
  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({ 
      error: "Acesso negado", 
      message: "Você não tem permissão para criar ou editar lançamentos financeiros" 
    });
  }

  next();
}

/**
 * Middleware específico para operações de exclusão
 * Apenas 'admin' pode excluir lançamentos financeiros
 */
export function requireAdminAccess(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ 
      error: "Não autorizado", 
      message: "Usuário não autenticado" 
    });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ 
      error: "Acesso negado", 
      message: "Apenas administradores podem excluir lançamentos financeiros" 
    });
  }

  next();
}
