import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api, ApiError, type ConversationWithMessages, type Message } from "../api/client";
import { TripPlanPanel } from "../components/TripPlanPanel";
import { SendIcon } from "../components/SendIcon";
import { useConversations } from "../hooks/useConversations";
import { useTopBarTitle } from "../hooks/useTopBarTitle";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea";
import { useMediaQuery, MOBILE_QUERY } from "../hooks/useMediaQuery";

type DisplayMessage = Message & { status?: "sending" | "failed" };
type DisplayConversation = Omit<ConversationWithMessages, "messages"> & { messages: DisplayMessage[] };

export function Chat() {
  const { id } = useParams<{ id: string }>();
  const conversationId = Number(id);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const [conversation, setConversation] = useState<DisplayConversation | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [tripRefreshSignal, setTripRefreshSignal] = useState(0);
  const [tripPanelOpen, setTripPanelOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSubmittedRef = useRef(false);
  const tripToggleButtonRef = useRef<HTMLButtonElement>(null);
  const tripCloseButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let ignore = false;
    api
      .getConversation(conversationId)
      .then((data) => {
        if (!ignore) setConversation(data);
      })
      .catch((err) => {
        if (ignore) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      ignore = true;
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  useEffect(() => {
    // Wait for the re-render that clears `disabled` before focusing — a
    // disabled textarea silently refuses focus().
    if (!sending) textareaRef.current?.focus();
  }, [sending]);

  useEffect(() => {
    if (!isMobile || !tripPanelOpen) return;

    const toggleEl = tripToggleButtonRef.current;
    document.body.style.overflow = "hidden";
    tripCloseButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTripPanelOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      toggleEl?.focus();
    };
  }, [isMobile, tripPanelOpen]);

  useAutoResizeTextarea(textareaRef, draft);

  const { conversations, updateTitleLocally } = useConversations();
  // Prefer the shared sidebar list's title over the conversation's own
  // fetched copy: on a freshly-created chat, the sidebar already has the
  // optimistic preview title (set by Home before navigating here) while
  // our own GET still reflects the DB's still-default title, so falling
  // back to `conversation.title` first would show a stale "New
  // conversation" flash the sidebar never shows.
  const sidebarTitle = conversations?.find((c) => c.id === conversationId)?.title;
  useTopBarTitle(sidebarTitle ?? conversation?.title ?? null);

  const sendContent = useCallback(
    async (content: string, tempId: number) => {
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
        if (usedTripTool(assistantMessage.tool_calls_json)) setTripPanelOpen(true);
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
    },
    [conversation, updateTitleLocally]
  );

  const submitMessage = useCallback(
    async (content: string) => {
      if (!conversation) return;

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
      await sendContent(content, tempId);
    },
    [conversation, sendContent]
  );

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !conversation || sending) return;
    setDraft("");
    await submitMessage(content);
  };

  useEffect(() => {
    const pendingMessage = (location.state as { pendingMessage?: string } | null)?.pendingMessage;
    if (!conversation || !pendingMessage || pendingSubmittedRef.current) return;

    pendingSubmittedRef.current = true;
    navigate(location.pathname, { replace: true, state: null });
    submitMessage(pendingMessage);
  }, [conversation, location.state, location.pathname, navigate, submitMessage]);

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

  const trailingSuggestions = lastSuggestions(conversation.messages);

  return (
    <div className={`chat-layout${tripPanelOpen ? " chat-trip-open" : ""}`}>
      <div className="chat-page">
        <div className="chat-page-header">
          <button
            ref={tripToggleButtonRef}
            type="button"
            className="trip-panel-toggle"
            onClick={() => setTripPanelOpen((v) => !v)}
            aria-pressed={tripPanelOpen}
          >
            Trip plan
          </button>
        </div>

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
              {usedLiveData(m.tool_calls_json) && <div className="message-tools">✓ Live data used</div>}
            </div>
          ))}
          {trailingSuggestions.length > 0 && (
            <div className="suggestion-chips">
              {trailingSuggestions.map((s) => (
                <button key={s} type="button" className="suggestion-chip" onClick={() => submitMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
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
            rows={1}
            disabled={sending}
          />
          {draft.trim() && (
            <button className="chat-send-button" onClick={handleSend} disabled={sending} aria-label="Send message">
              <SendIcon />
            </button>
          )}
        </div>
      </div>

      <div className="trip-panel-wrapper" inert={!tripPanelOpen}>
        <button
          ref={tripCloseButtonRef}
          type="button"
          className="trip-panel-close"
          onClick={() => setTripPanelOpen(false)}
          aria-label="Close trip plan"
        >
          &times;
        </button>
        <TripPlanPanel refreshSignal={tripRefreshSignal} />
      </div>
    </div>
  );
}

const LIVE_DATA_TOOLS = new Set(["get_exchange_rate", "get_current_weather", "get_public_holidays"]);
const TRIP_TOOLS = new Set(["update_trip_plan", "set_trip_day"]);

function usedAnyTool(toolCallsJson: string | null, toolNames: Set<string>): boolean {
  if (!toolCallsJson) return false;
  try {
    const calls = JSON.parse(toolCallsJson) as { name: string }[];
    return calls.some((c) => toolNames.has(c.name));
  } catch {
    return false;
  }
}

function usedLiveData(toolCallsJson: string | null): boolean {
  return usedAnyTool(toolCallsJson, LIVE_DATA_TOOLS);
}

function usedTripTool(toolCallsJson: string | null): boolean {
  return usedAnyTool(toolCallsJson, TRIP_TOOLS);
}

function lastSuggestions(messages: DisplayMessage[]): string[] {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant" || !last.suggestions_json) return [];
  try {
    const parsed = JSON.parse(last.suggestions_json);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}
