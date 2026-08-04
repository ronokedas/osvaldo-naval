import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

// Make sure to load environment variables
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

// We use the env variables provided by Cloud SQL (as you mentioned: SQL_HOST, SQL_USER, SQL_PASSWORD, SQL_DB_NAME)
// Or the standard DATABASE_URL if available
const createPool = () => {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  const host = process.env.SQL_HOST || "localhost";
  const user = process.env.SQL_USER || "postgres";
  const password = process.env.SQL_PASSWORD || "postgres";
  const database = process.env.SQL_DB_NAME || "postgres";

  // Cloud SQL Unix Socket format: /cloudsql/PROJECT_ID:REGION:INSTANCE_ID
  if (host.startsWith("/cloudsql/") || host.startsWith("/app/cloudsql/")) {
    return new Pool({
      host: host, // Connect via unix socket
      user: user,
      password: password,
      database: database,
    });
  }

  return new Pool({
    host: host,
    user: user,
    password: password,
    database: database,
  });
};

export const pool = createPool();
export const db = drizzle(pool, { schema });
