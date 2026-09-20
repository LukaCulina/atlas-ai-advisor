import { createChatCompletion, ChatMessage } from "./openrouter";

const SUGGESTIONS_MODEL = process.env.OPENROUTER_FAST_MODEL || "anthropic/claude-haiku-4.5";

const SUGGESTIONS_SYSTEM_PROMPT =
  "You suggest short follow-up messages for a travel-planning chatbot. Given the traveler's " +
  "last message and the assistant's reply below, suggest 1 to 3 short, natural next messages " +
  "the traveler might send to continue the conversation. Respond with ONLY a JSON array of " +
  'strings, e.g. ["...", "..."]. No other text. If no good follow-up makes sense, respond with [].';

export async function generateFollowUpSuggestions(
  lastUserMessage: string,
  assistantReply: string
): Promise<string[]> {
  const messages: ChatMessage[] = [
    { role: "system", content: SUGGESTIONS_SYSTEM_PROMPT },
    { role: "user", content: `Traveler: ${lastUserMessage}\nAssistant: ${assistantReply}` },
  ];

  const response = await createChatCompletion(messages, undefined, SUGGESTIONS_MODEL);
  return parseSuggestions(response.content ?? "");
}

function parseSuggestions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw.trim());
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string" && s.trim().length > 0).slice(0, 3);
  } catch {
    return [];
  }
}
