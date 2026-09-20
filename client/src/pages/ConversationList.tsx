import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Conversation } from "../api/client";
import { formatDateTime } from "../utils/dates";

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .listConversations()
      .then(setConversations)
      .catch((err) => setLoadError(err.message));
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setActionError(null);
    try {
      const conversation = await api.createConversation();
      navigate(`/c/${conversation.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setActionError(null);
    setDeletingId(id);
    try {
      await api.deleteConversation(id);
      setConversations((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmingId(null);
      setDeletingId(null);
    }
  };

  if (loadError) return <p className="error">Failed to load conversations: {loadError}</p>;
  if (!conversations)
    return (
      <p className="loading-state">
        <span className="spinner" /> Loading conversations...
      </p>
    );

  return (
    <div>
      <div className="page-header">
        <h1>Conversations</h1>
        <button onClick={handleCreate} disabled={creating}>
          {creating ? "Starting..." : "New conversation"}
        </button>
      </div>

      {actionError && <p className="error">{actionError}</p>}

      {conversations.length === 0 ? (
        <p>No conversations yet — start one to begin planning your trip.</p>
      ) : (
        <ul className="conversation-list">
          {conversations.map((c) => (
            <li key={c.id} className="conversation-row">
              <Link to={`/c/${c.id}`} className="conversation-link">
                <span className="conversation-title">{c.title}</span>
                <span className="conversation-meta">Updated {formatDateTime(c.updated_at)}</span>
              </Link>
              {confirmingId === c.id ? (
                <span className="delete-confirm">
                  <span className="delete-confirm-warning">This can't be undone.</span>
                  <button
                    className="delete-button-confirm"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id ? "Deleting..." : "Confirm delete"}
                  </button>
                  <button onClick={() => setConfirmingId(null)} disabled={deletingId === c.id}>
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  className="delete-button"
                  onClick={() => setConfirmingId(c.id)}
                  aria-label={`Delete ${c.title}`}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
