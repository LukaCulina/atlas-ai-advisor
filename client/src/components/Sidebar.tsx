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
  const { conversations, loadError, deleteConversation, renameConversation } = useConversations();
  const location = useLocation();
  const navigate = useNavigate();

  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openMenu, setOpenMenu] = useState<{ id: number; top: number; right: number } | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [savingRenameId, setSavingRenameId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const conversationsContainerRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    if (openMenu?.id === id) {
      setOpenMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenMenu({ id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
  };

  useEffect(() => {
    if (openMenu === null) return;

    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    const onScroll = () => setOpenMenu(null);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    const scrollContainer = conversationsContainerRef.current;
    scrollContainer?.addEventListener("scroll", onScroll);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      scrollContainer?.removeEventListener("scroll", onScroll);
    };
  }, [openMenu]);

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

  useEffect(() => {
    if (renamingId !== null) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  const startRename = (id: number, currentTitle: string) => {
    setOpenMenu(null);
    setRenamingId(id);
    setRenameDraft(currentTitle);
  };

  const cancelRename = () => setRenamingId(null);

  const saveRename = async (id: number, currentTitle: string) => {
    const title = renameDraft.trim();
    if (!title || title === currentTitle) {
      setRenamingId(null);
      return;
    }
    setSavingRenameId(id);
    setActionError(null);
    try {
      await renameConversation(id, title);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingRenameId(null);
      setRenamingId(null);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: number, currentTitle: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRename(id, currentTitle);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
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

      <div className="sidebar-conversations" ref={conversationsContainerRef}>
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
                  ) : renamingId === c.id ? (
                    <input
                      ref={renameInputRef}
                      className="conversation-rename-input"
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onKeyDown={(e) => handleRenameKeyDown(e, c.id, c.title)}
                      onBlur={cancelRename}
                      disabled={savingRenameId === c.id}
                      aria-label={`Rename ${c.title}`}
                    />
                  ) : (
                    <>
                      <Link to={`/c/${c.id}`} className="conversation-link">
                        <span className="conversation-title">{c.title}</span>
                      </Link>
                      <button
                        className="conversation-menu-button"
                        onClick={(e) => toggleMenu(e, c.id)}
                        aria-label={`More options for ${c.title}`}
                        aria-haspopup="true"
                        aria-expanded={openMenu?.id === c.id}
                      >
                        &#8942;
                      </button>
                      {openMenu?.id === c.id && (
                        <div
                          className="conversation-menu"
                          ref={menuRef}
                          role="menu"
                          style={{ top: openMenu.top, right: openMenu.right }}
                        >
                          <button
                            className="conversation-menu-item"
                            role="menuitem"
                            onClick={() => startRename(c.id, c.title)}
                          >
                            Rename conversation
                          </button>
                          <button
                            className="conversation-menu-item conversation-menu-item-danger"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenu(null);
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
