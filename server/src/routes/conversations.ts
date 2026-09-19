import { Router } from "express";
import { db } from "../db/db";
import { ChatMessage } from "../services/openrouter";
import { runAgent } from "../services/agent";

export const conversationsRouter = Router();

interface ConversationRow {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls_json: string | null;
  created_at: string;
}

interface SettingsRow {
  id: number;
  system_prompt: string;
  updated_at: string;
}

conversationsRouter.post("/", (req, res) => {
  const title = typeof req.body?.title === "string" && req.body.title.trim() ? req.body.title.trim() : "New conversation";

  const result = db
    .prepare("INSERT INTO conversations (title) VALUES (?)")
    .run(title);

  const conversation = db
    .prepare("SELECT * FROM conversations WHERE id = ?")
    .get(result.lastInsertRowid) as ConversationRow;

  res.status(201).json(conversation);
});

conversationsRouter.get("/", (_req, res) => {
  const conversations = db
    .prepare("SELECT * FROM conversations ORDER BY updated_at DESC")
    .all() as ConversationRow[];

  res.json(conversations);
});

conversationsRouter.get("/:id", (req, res) => {
  const conversation = db
    .prepare("SELECT * FROM conversations WHERE id = ?")
    .get(req.params.id) as ConversationRow | undefined;

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const messages = db
    .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC")
    .all(conversation.id) as MessageRow[];

  res.json({ ...conversation, messages });
});

conversationsRouter.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM conversations WHERE id = ?").run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  res.status(204).send();
});

conversationsRouter.post("/:id/messages", async (req, res) => {
  const conversation = db
    .prepare("SELECT * FROM conversations WHERE id = ?")
    .get(req.params.id) as ConversationRow | undefined;

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content) {
    return res.status(400).json({ error: "content is required" });
  }

  const insertMessage = db.prepare(
    "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)"
  );
  insertMessage.run(conversation.id, "user", content);

  const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get() as SettingsRow;
  const history = db
    .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC")
    .all(conversation.id) as MessageRow[];

  const chatMessages: ChatMessage[] = [
    { role: "system", content: settings.system_prompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  let agentResult;
  try {
    agentResult = await runAgent(chatMessages);
  } catch (err) {
    console.error("Agent run failed:", err);
    return res.status(502).json({ error: "Failed to get a response from the advisor" });
  }

  const assistantResult = db
    .prepare("INSERT INTO messages (conversation_id, role, content, tool_calls_json) VALUES (?, ?, ?, ?)")
    .run(
      conversation.id,
      "assistant",
      agentResult.content,
      agentResult.toolCalls.length > 0 ? JSON.stringify(agentResult.toolCalls) : null
    );

  db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conversation.id);

  const assistantMessage = db
    .prepare("SELECT * FROM messages WHERE id = ?")
    .get(assistantResult.lastInsertRowid) as MessageRow;

  res.status(201).json(assistantMessage);
});
