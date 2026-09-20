import { createChatCompletion, ChatMessage } from "./openrouter";

const TITLE_SYSTEM_PROMPT =
  "You generate short, concise titles for chat conversations. Given the user's " +
  "first message, respond with ONLY a 3-6 word title. No quotes, no trailing " +
  "punctuation, no preamble, no explanation.";

const MAX_TITLE_LENGTH = 60;
const DEFAULT_TITLE = "New conversation";

export async function generateConversationTitle(firstUserMessage: string): Promise<string> {
  const messages: ChatMessage[] = [
    { role: "system", content: TITLE_SYSTEM_PROMPT },
    { role: "user", content: firstUserMessage },
  ];

  const response = await createChatCompletion(messages);
  return sanitizeTitle(response.content ?? "");
}

function sanitizeTitle(raw: string): string {
  const trimmed = raw
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!trimmed) {
    return DEFAULT_TITLE;
  }

  return trimmed.length > MAX_TITLE_LENGTH ? trimmed.slice(0, MAX_TITLE_LENGTH).trim() : trimmed;
}
