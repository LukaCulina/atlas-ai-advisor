import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConversations } from "../hooks/useConversations";
import { useTopBarTitle } from "../hooks/useTopBarTitle";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea";
import { SendIcon } from "../components/SendIcon";

const TITLE_PREVIEW_LENGTH = 60;

function previewTitle(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  return trimmed.length > TITLE_PREVIEW_LENGTH ? `${trimmed.slice(0, TITLE_PREVIEW_LENGTH).trim()}…` : trimmed;
}

const STARTER_SUGGESTIONS = [
  "Suggest a relaxing beach destination for next month",
  "Plan a 5-day itinerary for Kyoto",
  "What's the weather like in Lisbon right now?",
  "How much is 200 EUR in Japanese yen?",
  "Are there any public holidays in Italy in November?",
  "I want a budget-friendly city break in Europe",
  "What should I pack for a trip to Iceland in winter?",
  "Suggest a family-friendly destination in Southeast Asia",
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function Home() {
  useTopBarTitle(null);
  const { createConversation, updateTitleLocally } = useConversations();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions] = useState(() => pickRandom(STARTER_SUGGESTIONS, 4));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useAutoResizeTextarea(textareaRef, draft);

  const startConversation = async (content: string) => {
    if (!content || starting) return;

    setStarting(true);
    setError(null);
    try {
      const conversation = await createConversation();
      updateTitleLocally(conversation.id, previewTitle(content));
      navigate(`/c/${conversation.id}`, { state: { pendingMessage: content } });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStarting(false);
    }
  };

  const handleStart = () => startConversation(draft.trim());

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <div className="empty-state">
      <h1>Welcome to Atlas</h1>
      <p>Start a new conversation to begin planning your trip.</p>

      <div className="suggestion-chips">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className="suggestion-chip"
            onClick={() => startConversation(s)}
            disabled={starting}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="chat-input">
        <label htmlFor="home-message-input" className="visually-hidden">
          Message
        </label>
        <textarea
          id="home-message-input"
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about destinations, dates, weather, exchange rates..."
          rows={1}
          disabled={starting}
        />
        {draft.trim() && (
          <button className="chat-send-button" onClick={handleStart} disabled={starting} aria-label="Send message">
            <SendIcon />
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
