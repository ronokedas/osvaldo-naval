import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { userHasPermission, Permission } from "./permissions.js";

export const requireAuth = async (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const user = (await db.select().from(users).where(eq(users.id, req.session.userId)))[0];
    if (!user || user.ativo === false) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

export const requireRole = (roles: string[]) => {
  return async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const userList = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (userList.length === 0) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = userList[0];
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden: insufficient permissions" });
      }
      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  };
};

export const requirePermission = (perms: Permission[]) => {
  return async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const userList = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (userList.length === 0) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = userList[0];
      const allowed = perms.some((p) => userHasPermission(user, p));
      if (!allowed) {
        return res.status(403).json({ error: "Forbidden: insufficient permissions" });
      }
      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  };
};
