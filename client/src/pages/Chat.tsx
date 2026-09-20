import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api, ApiError, type ConversationWithMessages, type Message } from "../api/client";
import { TripPlanPanel } from "../components/TripPlanPanel";
import { useConversations } from "../hooks/useConversations";
import { useTopBarTitle } from "../hooks/useTopBarTitle";

type DisplayMessage = Message & { status?: "sending" | "failed" };
type DisplayConversation = Omit<ConversationWithMessages, "messages"> & { messages: DisplayMessage[] };

export function Chat() {
  const { id } = useParams<{ id: string }>();
  const conversationId = Number(id);

  const [conversation, setConversation] = useState<DisplayConversation | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [tripRefreshSignal, setTripRefreshSignal] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    // Wait for the re-render that clears `disabled` before focusing — a
    // disabled textarea silently refuses focus().
    if (!sending) textareaRef.current?.focus();
  }, [sending]);

  useTopBarTitle(conversation?.title ?? null);
  const { updateTitleLocally } = useConversations();

  const sendContent = async (content: string, tempId: number) => {
    if (!conversation) return;
    setSending(true);

    try {
      const response = await api.sendMessage(conversation.id, content);
      const { conversationTitle, ...assistantMessage } = response;
      setConversation((prev) => {
        if (!prev) return prev;
        const messages = prev.messages.map((m) => (m.id === tempId ? { ...m, status: undefined } : m));
        return {
          ...prev,
          messages: [...messages, assistantMessage],
          ...(conversationTitle ? { title: conversationTitle } : {}),
        };
      });
      if (conversationTitle) updateTitleLocally(conversation.id, conversationTitle);
      setTripRefreshSignal((n) => n + 1);
    } catch {
      setConversation((prev) =>
        prev
          ? { ...prev, messages: prev.messages.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)) }
          : prev
      );
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !conversation || sending) return;

    const tempId = -Date.now();
    const optimisticUserMessage: DisplayMessage = {
      id: tempId,
      conversation_id: conversation.id,
      role: "user",
      content,
      tool_calls_json: null,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, optimisticUserMessage] } : prev));
    setDraft("");
    await sendContent(content, tempId);
  };

  const handleRetry = (message: DisplayMessage) => {
    if (sending) return;
    setConversation((prev) =>
      prev
        ? { ...prev, messages: prev.messages.map((m) => (m.id === message.id ? { ...m, status: "sending" } : m)) }
        : prev
    );
    sendContent(message.content, message.id);
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
  if (!conversation)
    return (
      <p className="loading-state">
        <span className="spinner" /> Loading conversation...
      </p>
    );

  return (
    <div className="chat-layout">
      <div className="chat-page">
        <div className="message-list">
          {conversation.messages.length === 0 && (
            <p className="chat-empty">Say hello to start planning your trip.</p>
          )}
          {conversation.messages.map((m) => (
            <div key={m.id} className={`message message-${m.role}${m.status === "failed" ? " message-failed" : ""}`}>
              <div className="message-bubble">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
              {m.status === "failed" && (
                <div className="message-failed-note">
                  Failed to send.
                  <button onClick={() => handleRetry(m)} disabled={sending}>
                    Retry
                  </button>
                </div>
              )}
              {toolNames(m.tool_calls_json).length > 0 && (
                <div className="message-tools">Used live data: {toolNames(m.tool_calls_json).join(", ")}</div>
              )}
            </div>
          ))}
          {sending && (
            <div className="message message-assistant">
              <div className="message-bubble message-pending">
                <span className="spinner" /> Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input">
          <label htmlFor="chat-message-input" className="visually-hidden">
            Message
          </label>
          <textarea
            id="chat-message-input"
            ref={textareaRef}
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
