import { useState } from "react";
import { ConversationRow } from "../components/ConversationRow";
import { useConversations } from "../hooks/useConversations";

export function ConversationsPage() {
  const { conversations, loadError } = useConversations();
  const [query, setQuery] = useState("");

  const filtered = conversations?.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="conversations-page">
      <h1>Conversations</h1>
      <input
        type="search"
        className="conversations-search"
        placeholder="Search conversations..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loadError ? (
        <p className="error">Failed to load conversations: {loadError}</p>
      ) : !conversations ? (
        <p className="loading-state">
          <span className="spinner" /> Loading conversations...
        </p>
      ) : filtered!.length === 0 ? (
        <p className="sidebar-empty">{query ? "No conversations match your search." : "No conversations yet."}</p>
      ) : (
        <>
          {filtered!.some((c) => c.pinned) && (
            <>
              <p className="sidebar-section-label">Pinned</p>
              <ul className="conversation-list">
                {filtered!.filter((c) => c.pinned).map((c) => (
                  <ConversationRow key={c.id} conversation={c} />
                ))}
              </ul>
            </>
          )}
          <p className="sidebar-section-label">Recents</p>
          <ul className="conversation-list">
            {filtered!.filter((c) => !c.pinned).map((c) => (
              <ConversationRow key={c.id} conversation={c} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
