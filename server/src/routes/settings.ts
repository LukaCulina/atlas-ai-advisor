import { Router } from "express";
import { db } from "../db/db";

export const settingsRouter = Router();

interface SettingsRow {
  id: number;
  system_prompt: string;
  updated_at: string;
}

function getSettings(): SettingsRow {
  return db.prepare("SELECT * FROM settings WHERE id = 1").get() as SettingsRow;
}

settingsRouter.get("/", (_req, res) => {
  res.json(getSettings());
});

settingsRouter.patch("/", (req, res) => {
  const systemPrompt = typeof req.body?.system_prompt === "string" ? req.body.system_prompt.trim() : "";
  if (!systemPrompt) {
    return res.status(400).json({ error: "system_prompt is required" });
  }

  db.prepare("UPDATE settings SET system_prompt = ?, updated_at = datetime('now') WHERE id = 1").run(systemPrompt);

  res.json(getSettings());
});
