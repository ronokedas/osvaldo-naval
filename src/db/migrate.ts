import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index.js";

async function run() {
  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("Migrations complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

run();
