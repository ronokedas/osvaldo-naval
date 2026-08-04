import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const dbCredentials = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.SQL_HOST || "localhost",
      user: process.env.SQL_USER || "postgres",
      password: process.env.SQL_PASSWORD || "postgres",
      database: process.env.SQL_DB_NAME || "postgres",
    };

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials,
} satisfies Config;
