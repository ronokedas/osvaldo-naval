import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";

import { createServer as createViteServer } from "vite";

import authRoutes from "./src/server/routes/auth.js";
import usersRoutes from "./src/server/routes/users.js";
import vesselsRoutes from "./src/server/routes/vessels.js";
import proposalsRoutes from "./src/server/routes/proposals.js";
import tasksRoutes from "./src/server/routes/tasks.js";
import financeRoutes from "./src/server/routes/finance.js";
import protocolsRoutes from "./src/server/routes/protocols.js";
import pendingsRoutes from "./src/server/routes/critical_pendings.js";
import settingsRoutes from "./src/server/routes/settings.js";
import uploadsRoutes from "./src/server/routes/uploads.js";
import { pool } from "./src/db/index.js";


async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === "production";
  const sessionSecret = process.env.SESSION_SECRET;

  if (isProduction && !sessionSecret) {
    throw new Error("SESSION_SECRET must be configured in production.");
  }

  if (process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
  }

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));
  
  // Basic Security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  const PgSession = connectPgSimple(session);

  // Session data is persisted in PostgreSQL, so login sessions survive restarts.
  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true, tableName: "user_sessions" }),
      secret: sessionSecret || "development-only-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.COOKIE_SECURE === "true",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  app.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));

  // Serve uploads dir statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/vessels", vesselsRoutes);
  app.use("/api/proposals", proposalsRoutes);
  app.use("/api/tasks", tasksRoutes);
  app.use("/api/finance", financeRoutes);
  app.use("/api/protocols", protocolsRoutes);
  app.use("/api/critical-pendings", pendingsRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/upload", uploadsRoutes);

  // Global Error Handler for API
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("API Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nautilus Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
