import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

export const requireRole = (roles) => {
  return async (req, res, next) => {
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
