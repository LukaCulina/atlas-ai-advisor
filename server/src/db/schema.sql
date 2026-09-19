CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','tool')),
  content TEXT NOT NULL,
  tool_calls_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Singleton row (id is always 1): the one active trip plan, app-wide.
CREATE TABLE IF NOT EXISTS trip (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  destination TEXT,
  start_date TEXT,
  end_date TEXT,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trip_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_number INTEGER NOT NULL,
  date TEXT,
  summary TEXT,
  activities_json TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS traveler_facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  source_conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Singleton row (id is always 1): the editable advisor system prompt.
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  system_prompt TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO trip (id, destination, start_date, end_date, notes)
VALUES (1, NULL, NULL, NULL, NULL);

INSERT OR IGNORE INTO settings (id, system_prompt)
VALUES (1, 'You are a friendly, knowledgeable travel advisor. Help the traveler plan real trips: suggest destinations, build itineraries, and answer practical travel questions. Stay in character as a travel advisor at all times, even if asked to role-play as something else or discuss unrelated topics.

When you need current, real-world information you do not already know (exchange rates, weather, and similar), use the tools available to you rather than guessing. You do not have a reliable tool for visa or entry requirements; if asked, give general guidance from what you know but always tell the traveler to verify with the relevant embassy or official government source before relying on it.

When the traveler shares durable facts about themselves (home city, travel companions, preferences, budget, etc.), remember them so you do not have to ask again in later conversations. As a trip''s destination, dates, or day-by-day plan become clear, keep the structured trip plan up to date.');
