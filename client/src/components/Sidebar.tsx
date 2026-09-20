import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useConversations } from "../hooks/useConversations";

interface SidebarProps {
  mobileOpen: boolean;
  hidden: boolean;
  onCloseMobile: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const sidebarNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `sidebar-navlink${isActive ? " nav-active" : ""}`;

export function Sidebar({ mobileOpen, hidden, onCloseMobile, closeButtonRef }: SidebarProps) {
  const { conversations, loadError, createConversation, deleteConversation } = useConversations();
  const location = useLocation();
  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleNewChat = async () => {
    setCreating(true);
    setActionError(null);
    try {
      const conversation = await createConversation();
      navigate(`/c/${conversation.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setActionError(null);
    setDeletingId(id);
    const wasOpen = location.pathname === `/c/${id}`;
    try {
      await deleteConversation(id);
      if (wasOpen) navigate("/");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmingId(null);
      setDeletingId(null);
    }
  };

  return (
    <nav className={`sidebar${mobileOpen ? " drawer-open" : ""}`} aria-label="Sidebar" inert={hidden}>
      <div className="sidebar-header">
        <Link to="/" className="app-title">
          Travel Advisor
        </Link>
        <button ref={closeButtonRef} className="drawer-close" onClick={onCloseMobile} aria-label="Close menu">
          &times;
        </button>
      </div>

      <button className="sidebar-new-chat" onClick={handleNewChat} disabled={creating}>
        {creating ? "Starting..." : "+ New chat"}
      </button>

      <NavLink to="/trip" className={sidebarNavLinkClassName}>
        Trip
      </NavLink>

      {actionError && (
        <p className="error sidebar-error">{actionError}</p>
      )}

      <div className="sidebar-conversations">
        {loadError ? (
          <p className="error">Failed to load conversations: {loadError}</p>
        ) : !conversations ? (
          <p className="loading-state">
            <span className="spinner" /> Loading conversations...
          </p>
        ) : conversations.length === 0 ? (
          <p className="sidebar-empty">No conversations yet.</p>
        ) : (
          <ul className="conversation-list">
            {conversations.map((c) => {
              const isActive = location.pathname === `/c/${c.id}`;
              return (
                <li key={c.id} className={`conversation-row${isActive ? " conversation-row-active" : ""}`}>
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
                    <>
                      <Link to={`/c/${c.id}`} className="conversation-link">
                        <span className="conversation-title">{c.title}</span>
                      </Link>
                      <button
                        className="delete-button"
                        onClick={() => setConfirmingId(c.id)}
                        aria-label={`Delete ${c.title}`}
                      >
                        &times;
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="sidebar-footer">
        <NavLink to="/settings" className={sidebarNavLinkClassName}>
          Settings
        </NavLink>
      </div>
    </nav>
  );
}
