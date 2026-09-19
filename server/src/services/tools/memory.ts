import { db } from "../../db/db";

export function rememberTravelerFact(key: string, value: string, sourceConversationId: number) {
  db.prepare(
    `INSERT INTO traveler_facts (key, value, source_conversation_id)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       source_conversation_id = excluded.source_conversation_id,
       updated_at = datetime('now')`
  ).run(key, value, sourceConversationId);

  return { key, value };
}

export function getAllTravelerFacts(): { key: string; value: string }[] {
  return db.prepare("SELECT key, value FROM traveler_facts ORDER BY key ASC").all() as {
    key: string;
    value: string;
  }[];
}
