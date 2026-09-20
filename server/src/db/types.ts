export interface ConversationRow {
  id: number;
  title: string;
  pinned: number;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls_json: string | null;
  created_at: string;
}

export interface TripRow {
  id: number;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  updated_at: string;
}

export interface TripDayRow {
  id: number;
  day_number: number;
  date: string | null;
  summary: string | null;
  activities_json: string | null;
  updated_at: string;
}

export interface SettingsRow {
  id: number;
  system_prompt: string;
  updated_at: string;
}

export function tripDayToJson(row: TripDayRow) {
  const { activities_json, ...rest } = row;
  return { ...rest, activities: activities_json ? JSON.parse(activities_json) : [] };
}
