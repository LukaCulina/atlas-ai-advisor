import { db } from "../../db/db";

interface TripFields {
  destination?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

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

function getTrip(): TripRow {
  return db.prepare("SELECT * FROM trip WHERE id = 1").get() as TripRow;
}

export function getTripWithDays() {
  const days = db.prepare("SELECT * FROM trip_days ORDER BY day_number ASC").all() as TripDayRow[];
  return {
    ...getTrip(),
    days: days.map(({ activities_json, ...rest }) => ({
      ...rest,
      activities: activities_json ? JSON.parse(activities_json) : [],
    })),
  };
}

export function updateTripPlan(fields: TripFields) {
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (updates.length === 0) {
    return getTrip();
  }

  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE trip SET ${updates.join(", ")} WHERE id = 1`).run(...values);

  return getTrip();
}

interface TripDayFields {
  date?: string;
  summary?: string;
  activities?: string[];
}

export function setTripDay(dayNumber: number, fields: TripDayFields) {
  const existing = db.prepare("SELECT id FROM trip_days WHERE day_number = ?").get(dayNumber) as
    | { id: number }
    | undefined;

  const activitiesJson = fields.activities ? JSON.stringify(fields.activities) : undefined;

  let id: number;
  if (existing) {
    const updates: string[] = [];
    const values: unknown[] = [];
    if (fields.date !== undefined) {
      updates.push("date = ?");
      values.push(fields.date);
    }
    if (fields.summary !== undefined) {
      updates.push("summary = ?");
      values.push(fields.summary);
    }
    if (activitiesJson !== undefined) {
      updates.push("activities_json = ?");
      values.push(activitiesJson);
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      db.prepare(`UPDATE trip_days SET ${updates.join(", ")} WHERE id = ?`).run(...values, existing.id);
    }
    id = existing.id;
  } else {
    const result = db
      .prepare("INSERT INTO trip_days (day_number, date, summary, activities_json) VALUES (?, ?, ?, ?)")
      .run(dayNumber, fields.date ?? null, fields.summary ?? null, activitiesJson ?? null);
    id = Number(result.lastInsertRowid);
  }

  return db.prepare("SELECT * FROM trip_days WHERE id = ?").get(id);
}
