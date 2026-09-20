import { createChatCompletion, ChatMessage, ToolDefinition } from "./openrouter";
import { getExchangeRate } from "./tools/exchangeRate";
import { getCurrentWeather } from "./tools/weather";
import { rememberTravelerFact, getAllTravelerFacts } from "./tools/memory";
import { updateTripPlan, setTripDay, getTripWithDays } from "./tools/tripPlan";
import { getPublicHolidays } from "./tools/holidays";

const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_exchange_rate",
      description:
        "Get the current currency exchange rate between two ISO 4217 currency codes, optionally converting an amount.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "Three-letter source currency code, e.g. EUR" },
          to: { type: "string", description: "Three-letter target currency code, e.g. JPY" },
          amount: { type: "number", description: "Optional amount in the source currency to convert" },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Get the current weather conditions for a named location.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City name, optionally with country, e.g. 'Lisbon, Portugal'" },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remember_traveler_fact",
      description:
        "Save a durable fact about the traveler (home city, travel companions, preferences, budget, etc.) so it can be recalled in future, separate conversations instead of asking again.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "Short, consistent snake_case identifier for the fact, e.g. 'home_airport' or 'travel_companions'",
          },
          value: { type: "string", description: "The fact's value as a short string" },
        },
        required: ["key", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_trip_plan",
      description:
        "Update the traveler's single active trip plan — its destination, dates, and/or general notes. Only pass fields that are changing.",
      parameters: {
        type: "object",
        properties: {
          destination: { type: "string" },
          start_date: { type: "string", description: "ISO date, e.g. 2026-04-01" },
          end_date: { type: "string", description: "ISO date, e.g. 2026-04-10" },
          notes: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_trip_day",
      description:
        "Create or update a specific day of the trip's day-by-day itinerary, identified by its day number (1 = first day of the trip).",
      parameters: {
        type: "object",
        properties: {
          day_number: { type: "integer", description: "1-based day number within the trip" },
          date: { type: "string", description: "Optional ISO date for this day" },
          summary: { type: "string", description: "Short summary of the day's plan" },
          activities: {
            type: "array",
            items: { type: "string" },
            description: "List of planned activities for the day",
          },
        },
        required: ["day_number"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_public_holidays",
      description:
        "Get the public holidays for a country in a given year — useful for spotting long weekends or days when businesses may be closed during a trip.",
      parameters: {
        type: "object",
        properties: {
          country_code: {
            type: "string",
            description: "Two-letter ISO 3166-1 country code, e.g. FR for France, JP for Japan",
          },
          year: { type: "integer", description: "Four-digit year; defaults to the current year if omitted" },
        },
        required: ["country_code"],
      },
    },
  },
];

async function executeTool(name: string, args: Record<string, unknown>, conversationId: number): Promise<unknown> {
  switch (name) {
    case "get_exchange_rate":
      return getExchangeRate(
        String(args.from),
        String(args.to),
        typeof args.amount === "number" ? args.amount : undefined
      );
    case "get_current_weather":
      return getCurrentWeather(String(args.location));
    case "remember_traveler_fact":
      return rememberTravelerFact(String(args.key), String(args.value), conversationId);
    case "update_trip_plan":
      return updateTripPlan({
        destination: typeof args.destination === "string" ? args.destination : undefined,
        start_date: typeof args.start_date === "string" ? args.start_date : undefined,
        end_date: typeof args.end_date === "string" ? args.end_date : undefined,
        notes: typeof args.notes === "string" ? args.notes : undefined,
      });
    case "set_trip_day":
      return setTripDay(Number(args.day_number), {
        date: typeof args.date === "string" ? args.date : undefined,
        summary: typeof args.summary === "string" ? args.summary : undefined,
        activities: Array.isArray(args.activities) ? args.activities.map(String) : undefined,
      });
    case "get_public_holidays":
      return getPublicHolidays(String(args.country_code), typeof args.year === "number" ? args.year : undefined);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export interface ToolCallTrace {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export interface AgentResult {
  content: string;
  toolCalls: ToolCallTrace[];
}

const MAX_TOOL_ROUNDS = 4;

export async function runAgent(
  systemPrompt: string,
  history: ChatMessage[],
  conversationId: number
): Promise<AgentResult> {
  const facts = getAllTravelerFacts();
  const factsBlock =
    facts.length > 0
      ? "\n\nKnown facts about this traveler from previous conversations:\n" +
        facts.map((f) => `- ${f.key}: ${f.value}`).join("\n")
      : "";

  const trip = getTripWithDays();
  const tripBlock =
    trip.destination || trip.days.length > 0
      ? "\n\nCurrent trip plan on file (this is the live, ground-truth state — it may have been edited directly by the traveler outside this chat, so trust this over anything said earlier in the conversation):\n" +
        JSON.stringify(trip)
      : "";

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt + factsBlock + tripBlock },
    ...history,
  ];
  const toolCalls: ToolCallTrace[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const message = await createChatCompletion(messages, TOOLS);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { content: message.content ?? "", toolCalls };
    }

    messages.push(message);

    for (const call of message.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        // Malformed JSON from the model — proceed with empty args, the tool
        // implementation will surface a clear error for a missing field.
      }

      const trace: ToolCallTrace = { name: call.function.name, arguments: args };
      try {
        trace.result = await executeTool(call.function.name, args, conversationId);
      } catch (err) {
        trace.error = err instanceof Error ? err.message : String(err);
      }
      toolCalls.push(trace);

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(trace.error ? { error: trace.error } : trace.result),
      });
    }
  }

  throw new Error("Agent exceeded maximum tool-call rounds");
}
