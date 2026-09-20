import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConversations } from "../hooks/useConversations";
import { useTopBarTitle } from "../hooks/useTopBarTitle";

const TITLE_PREVIEW_LENGTH = 60;

function previewTitle(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  return trimmed.length > TITLE_PREVIEW_LENGTH ? `${trimmed.slice(0, TITLE_PREVIEW_LENGTH).trim()}…` : trimmed;
}

export function Home() {
  useTopBarTitle(null);
  const { createConversation, updateTitleLocally } = useConversations();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    const content = draft.trim();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <div className="empty-state">
      <h1>Welcome to Travel Advisor</h1>
      <p>Start a new conversation to begin planning your trip.</p>

      <div className="chat-input">
        <label htmlFor="home-message-input" className="visually-hidden">
          Message
        </label>
        <textarea
          id="home-message-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about destinations, dates, weather, exchange rates..."
          rows={2}
          disabled={starting}
        />
        <button onClick={handleStart} disabled={starting || !draft.trim()}>
          {starting ? "Starting..." : "Send"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
