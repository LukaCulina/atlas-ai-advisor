import { useEffect, useRef, useState } from "react";
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
  const { conversations, loadError, deleteConversation } = useConversations();
  const location = useLocation();
  const navigate = useNavigate();

  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openMenuId === null) return;

    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenuId]);

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

      <Link to="/" className="sidebar-new-chat">
        + New chat
      </Link>

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
                        className="conversation-menu-button"
                        onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                        aria-label={`More options for ${c.title}`}
                        aria-haspopup="true"
                        aria-expanded={openMenuId === c.id}
                      >
                        &#8942;
                      </button>
                      {openMenuId === c.id && (
                        <div className="conversation-menu" ref={menuRef} role="menu">
                          <button
                            className="conversation-menu-item conversation-menu-item-danger"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null);
                              setConfirmingId(c.id);
                            }}
                          >
                            Delete conversation
                          </button>
                        </div>
                      )}
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
