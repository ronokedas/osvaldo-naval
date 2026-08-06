import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { userHasPermission, Permission } from "./permissions.js";

export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
};

export const requireRole = (roles: string[]) => {
  return async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    try {
      const userList = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (userList.length === 0) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      const user = userList[0];
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: "Acesso negado: permissões insuficientes" });
      }
      req.user = user;
      next();
    } catch (err) {
      console.error("Error in requireRole:", err);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  };
};

export const requirePermission = (perms: Permission[]) => {
  return async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    try {
      const userList = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (userList.length === 0) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      const user = userList[0];
      const allowed = perms.some((p) => userHasPermission(user, p));
      if (!allowed) {
        return res.status(403).json({ error: "Acesso negado: permissões insuficientes" });
      }
      req.user = user;
      next();
    } catch (err) {
      console.error("Error in requirePermission:", err);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  };
};