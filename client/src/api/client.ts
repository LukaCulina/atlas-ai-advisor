export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls_json: string | null;
  created_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface TripDay {
  id: number;
  day_number: number;
  date: string | null;
  summary: string | null;
  activities: string[];
  updated_at: string;
}

export interface Trip {
  id: number;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  updated_at: string;
}

export interface TripWithDays extends Trip {
  days: TripDay[];
}

export interface Settings {
  id: number;
  system_prompt: string;
  updated_at: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  listConversations: () => request<Conversation[]>("/conversations"),

  getConversation: (id: number) => request<ConversationWithMessages>(`/conversations/${id}`),

  createConversation: (title?: string) =>
    request<Conversation>("/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  deleteConversation: (id: number) =>
    request<void>(`/conversations/${id}`, { method: "DELETE" }),

  sendMessage: (conversationId: number, content: string) =>
    request<Message>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  getTrip: () => request<TripWithDays>("/trip"),

  updateTrip: (fields: Partial<Pick<Trip, "destination" | "start_date" | "end_date" | "notes">>) =>
    request<Trip>("/trip", { method: "PATCH", body: JSON.stringify(fields) }),

  addTripDay: (fields: { day_number: number; date?: string; summary?: string; activities?: string[] }) =>
    request<TripDay>("/trip/days", { method: "POST", body: JSON.stringify(fields) }),

  updateTripDay: (
    id: number,
    fields: Partial<{ day_number: number; date: string; summary: string; activities: string[] }>
  ) => request<TripDay>(`/trip/days/${id}`, { method: "PATCH", body: JSON.stringify(fields) }),

  deleteTripDay: (id: number) => request<void>(`/trip/days/${id}`, { method: "DELETE" }),

  getSettings: () => request<Settings>("/settings"),

  updateSettings: (systemPrompt: string) =>
    request<Settings>("/settings", { method: "PATCH", body: JSON.stringify({ system_prompt: systemPrompt }) }),
};
