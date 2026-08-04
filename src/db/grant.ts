import { db, pool } from "./index.js";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Granting privileges...");
  try {
    await db.execute(sql`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ai_studio_app_user`);
    await db.execute(sql`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ai_studio_app_user`);
    console.log("Privileges granted!");
  } catch (error) {
    console.error("Failed to grant privileges:", error);
  } finally {
    pool.end();
  }
}
run();
