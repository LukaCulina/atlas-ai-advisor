import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "..", "data", "app.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

// Guarded migration: `CREATE TABLE IF NOT EXISTS` above only applies to a
// brand-new database, so a column added to an existing table needs its own
// one-time check here — this keeps the app self-healing against any
// pre-existing database file instead of requiring a manual wipe.
const conversationColumns = db.prepare("PRAGMA table_info(conversations)").all() as { name: string }[];
if (!conversationColumns.some((c) => c.name === "pinned")) {
  db.exec("ALTER TABLE conversations ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0");
}
