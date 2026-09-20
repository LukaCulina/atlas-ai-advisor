import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api, ApiError, type ConversationWithMessages, type Message } from "../api/client";
import { TripPlanPanel } from "../components/TripPlanPanel";

export function Chat() {
  const { id } = useParams<{ id: string }>();
  const conversationId = Number(id);

  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [tripRefreshSignal, setTripRefreshSignal] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .getConversation(conversationId)
      .then(setConversation)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      });
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !conversation || sending) return;

    const optimisticUserMessage: Message = {
      id: -Date.now(),
      conversation_id: conversation.id,
      role: "user",
      content,
      tool_calls_json: null,
      created_at: new Date().toISOString(),
    };

    setConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, optimisticUserMessage] } : prev));
    setDraft("");
    setSendError(null);
    setSending(true);

    try {
      const assistantMessage = await api.sendMessage(conversation.id, content);
      setConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, assistantMessage] } : prev));
      setTripRefreshSignal((n) => n + 1);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (notFound) {
    return (
      <div>
        <p>This conversation doesn't exist or was deleted.</p>
        <Link to="/">Back to conversations</Link>
      </div>
    );
  }

  if (loadError) return <p className="error">Failed to load conversation: {loadError}</p>;
  if (!conversation) return <p>Loading conversation...</p>;

  return (
    <div>
      <h1>{conversation.title}</h1>
      <div className="chat-layout">
        <div className="chat-page">
          <div className="message-list">
            {conversation.messages.length === 0 && (
              <p className="chat-empty">Say hello to start planning your trip.</p>
            )}
            {conversation.messages.map((m) => (
              <div key={m.id} className={`message message-${m.role}`}>
                <div className="message-bubble">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
                {toolNames(m.tool_calls_json).length > 0 && (
                  <div className="message-tools">Used live data: {toolNames(m.tool_calls_json).join(", ")}</div>
                )}
              </div>
            ))}
            {sending && (
              <div className="message message-assistant">
                <div className="message-bubble message-pending">Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {sendError && <p className="error">{sendError}</p>}

          <div className="chat-input">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about destinations, dates, weather, exchange rates..."
              rows={2}
              disabled={sending}
            />
            <button onClick={handleSend} disabled={sending || !draft.trim()}>
              Send
            </button>
          </div>
        </div>

        <TripPlanPanel refreshSignal={tripRefreshSignal} />
      </div>
    </div>
  );
}

function toolNames(toolCallsJson: string | null): string[] {
  if (!toolCallsJson) return [];
  try {
    const calls = JSON.parse(toolCallsJson) as { name: string }[];
    return [...new Set(calls.map((c) => c.name))];
  } catch {
    return [];
  }
}
