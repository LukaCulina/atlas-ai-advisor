import { createChatCompletion, ChatMessage, ToolDefinition } from "./openrouter";
import { getExchangeRate } from "./tools/exchangeRate";
import { getCurrentWeather } from "./tools/weather";

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
];

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "get_exchange_rate":
      return getExchangeRate(
        String(args.from),
        String(args.to),
        typeof args.amount === "number" ? args.amount : undefined
      );
    case "get_current_weather":
      return getCurrentWeather(String(args.location));
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

export async function runAgent(initialMessages: ChatMessage[]): Promise<AgentResult> {
  const messages: ChatMessage[] = [...initialMessages];
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
        trace.result = await executeTool(call.function.name, args);
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
