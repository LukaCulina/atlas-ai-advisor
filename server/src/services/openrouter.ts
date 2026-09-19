const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export async function createChatCompletion(
  messages: ChatMessage[],
  tools?: ToolDefinition[]
): Promise<ChatMessage> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5",
      messages,
      ...(tools ? { tools } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { choices?: { message?: ChatMessage }[] };
  const message = data.choices?.[0]?.message;

  if (!message) {
    throw new Error("OpenRouter response did not include a message");
  }

  return message;
}
