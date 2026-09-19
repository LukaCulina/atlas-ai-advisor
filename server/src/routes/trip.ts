import { Router } from "express";
import { db } from "../db/db";

export const tripRouter = Router();

interface TripRow {
  id: number;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  updated_at: string;
}

interface TripDayRow {
  id: number;
  day_number: number;
  date: string | null;
  summary: string | null;
  activities_json: string | null;
  updated_at: string;
}

function dayToJson(row: TripDayRow) {
  const { activities_json, ...rest } = row;
  return { ...rest, activities: activities_json ? JSON.parse(activities_json) : [] };
}

function getTrip(): TripRow {
  return db.prepare("SELECT * FROM trip WHERE id = 1").get() as TripRow;
}

function getDays(): TripDayRow[] {
  return db.prepare("SELECT * FROM trip_days ORDER BY day_number ASC").all() as TripDayRow[];
}

tripRouter.get("/", (_req, res) => {
  res.json({ ...getTrip(), days: getDays().map(dayToJson) });
});

tripRouter.patch("/", (req, res) => {
  const fields = ["destination", "start_date", "end_date", "notes"] as const;
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of fields) {
    if (field in req.body) {
      updates.push(`${field} = ?`);
      values.push(req.body[field] === null ? null : String(req.body[field]));
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE trip SET ${updates.join(", ")} WHERE id = 1`).run(...values);

  res.json(getTrip());
});

tripRouter.post("/days", (req, res) => {
  const dayNumber = Number(req.body?.day_number);
  if (!Number.isInteger(dayNumber)) {
    return res.status(400).json({ error: "day_number is required and must be an integer" });
  }

  const date = req.body?.date ?? null;
  const summary = req.body?.summary ?? null;
  const activitiesJson = Array.isArray(req.body?.activities) ? JSON.stringify(req.body.activities) : null;

  const result = db
    .prepare("INSERT INTO trip_days (day_number, date, summary, activities_json) VALUES (?, ?, ?, ?)")
    .run(dayNumber, date, summary, activitiesJson);

  const day = db.prepare("SELECT * FROM trip_days WHERE id = ?").get(result.lastInsertRowid) as TripDayRow;
  res.status(201).json(dayToJson(day));
});

tripRouter.patch("/days/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM trip_days WHERE id = ?").get(req.params.id) as TripDayRow | undefined;
  if (!existing) {
    return res.status(404).json({ error: "Trip day not found" });
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if ("day_number" in req.body) {
    const dayNumber = Number(req.body.day_number);
    if (!Number.isInteger(dayNumber)) {
      return res.status(400).json({ error: "day_number must be an integer" });
    }
    updates.push("day_number = ?");
    values.push(dayNumber);
  }
  if ("date" in req.body) {
    updates.push("date = ?");
    values.push(req.body.date === null ? null : String(req.body.date));
  }
  if ("summary" in req.body) {
    updates.push("summary = ?");
    values.push(req.body.summary === null ? null : String(req.body.summary));
  }
  if ("activities" in req.body) {
    updates.push("activities_json = ?");
    values.push(Array.isArray(req.body.activities) ? JSON.stringify(req.body.activities) : null);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE trip_days SET ${updates.join(", ")} WHERE id = ?`).run(...values, req.params.id);

  const updated = db.prepare("SELECT * FROM trip_days WHERE id = ?").get(req.params.id) as TripDayRow;
  res.json(dayToJson(updated));
});

tripRouter.delete("/days/:id", (req, res) => {
  const result = db.prepare("DELETE FROM trip_days WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Trip day not found" });
  }
  res.status(204).send();
});
