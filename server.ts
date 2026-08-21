import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import compression from "compression";

import { createServer as createViteServer } from "vite";

import authRoutes from "./src/server/routes/auth.js";
import usersRoutes from "./src/server/routes/users.js";
import clientsRoutes from "./src/server/routes/clients.js";
import vesselsRoutes from "./src/server/routes/vessels.js";
import proposalsRoutes from "./src/server/routes/proposals.js";
import tasksRoutes from "./src/server/routes/tasks.js";
import financeRoutes from "./src/server/routes/finance.js";
import protocolsRoutes from "./src/server/routes/protocols.js";
import pendingsRoutes from "./src/server/routes/critical_pendings.js";
import settingsRoutes from "./src/server/routes/settings.js";
import uploadsRoutes from "./src/server/routes/uploads.js";
import serviceOrdersRoutes from "./src/server/routes/service-orders.js";
import receivablesRoutes from "./src/server/routes/receivables.js";
import payablesRoutes from "./src/server/routes/payables.js";
import commitmentsRoutes from "./src/server/routes/commitments.js";
import certifiersRoutes from "./src/server/routes/certifiers.js";
import servicesRoutes from "./src/server/routes/services.js";
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
  app.use(compression());
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

  // Signed acceptance documents have their own authenticated route below.
  app.use("/uploads", (req, res, next) => {
    if (req.path.startsWith("/acceptances/")) return res.status(404).end();
    return express.static(path.join(process.cwd(), "uploads"))(req, res, next);
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/clients", clientsRoutes);
  app.use("/api/vessels", vesselsRoutes);
  app.use("/api/proposals", proposalsRoutes);
  app.use("/api/tasks", tasksRoutes);
  app.use("/api/finance", financeRoutes);
  app.use("/api/protocols", protocolsRoutes);
  app.use("/api/critical-pendings", pendingsRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/upload", uploadsRoutes);
  app.use("/api/service-orders", serviceOrdersRoutes);
  app.use("/api/receivables", receivablesRoutes);
  app.use("/api/payables", payablesRoutes);
  app.use("/api/commitments", commitmentsRoutes);
  app.use("/api/certifiers", certifiersRoutes);
  app.use("/api/services", servicesRoutes);
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
    
    // Configura headers de cache mais inteligentes para arquivos estáticos
    app.use(express.static(distPath, {
      setHeaders: (res, pathStr, stat) => {
        // Arquivos gerados com hash pelo Vite (.js, .css, .woff2) em /assets
        if (pathStr.includes('/assets/') && (pathStr.endsWith('.js') || pathStr.endsWith('.css') || pathStr.endsWith('.woff2'))) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (pathStr.endsWith('index.html')) {
          // Nunca fazer cache do index.html (pra quando atualizar versão baixar a nova)
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else {
          // Outros assets estáticos curtos
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
      }
    }));

    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nautilus Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
