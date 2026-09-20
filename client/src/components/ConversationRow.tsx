import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Conversation } from "../api/client";
import { useConversations } from "../hooks/useConversations";
import { PinIcon } from "./PinIcon";

// Matches (and slightly exceeds) .conversation-menu's min-width, so the
// clamping math in toggleMenu has an accurate box size to work with.
const MENU_WIDTH = 180;

export function ConversationRow({ conversation: c }: { conversation: Conversation }) {
  const { deleteConversation, renameConversation, togglePin } = useConversations();
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === `/c/${c.id}`;

  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [savingRename, setSavingRename] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (menuPos !== null) {
      setMenuPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    // Anchor the menu's right edge to the button by default, but clamp to
    // both viewport edges so it can never render off-screen on a narrow
    // mobile drawer.
    const left = Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8);
    setMenuPos({ top: rect.bottom + 4, left: Math.max(8, left) });
  };

  useEffect(() => {
    if (menuPos === null) return;

    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPos(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuPos(null);
    };
    const onScroll = () => setMenuPos(null);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [menuPos]);

  const handleDelete = async () => {
    setActionError(null);
    setDeleting(true);
    const wasOpen = location.pathname === `/c/${c.id}`;
    try {
      await deleteConversation(c.id);
      if (wasOpen) navigate("/");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirming(false);
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (renaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renaming]);

  const startRename = () => {
    setMenuPos(null);
    setRenaming(true);
    setRenameDraft(c.title);
  };

  const cancelRename = () => setRenaming(false);

  const saveRename = async () => {
    const title = renameDraft.trim();
    if (!title || title === c.title) {
      setRenaming(false);
      return;
    }
    setSavingRename(true);
    setActionError(null);
    try {
      await renameConversation(c.id, title);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingRename(false);
      setRenaming(false);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  };

  const handleTogglePin = async () => {
    setMenuPos(null);
    setActionError(null);
    try {
      await togglePin(c.id, !c.pinned);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <li className={`conversation-row${isActive ? " conversation-row-active" : ""}`}>
      {actionError && <p className="error sidebar-error">{actionError}</p>}
      {confirming ? (
        <span className="delete-confirm">
          <span className="delete-confirm-warning">This can't be undone.</span>
          <button className="delete-button-confirm" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Confirm delete"}
          </button>
          <button onClick={() => setConfirming(false)} disabled={deleting}>
            Cancel
          </button>
        </span>
      ) : renaming ? (
        <input
          ref={renameInputRef}
          className="conversation-rename-input"
          value={renameDraft}
          onChange={(e) => setRenameDraft(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={cancelRename}
          disabled={savingRename}
          aria-label={`Rename ${c.title}`}
        />
      ) : (
        <>
          <Link to={`/c/${c.id}`} className="conversation-link">
            <span className="conversation-title">{c.title}</span>
          </Link>
          {c.pinned === 1 && (
            <span className="conversation-pin-icon" aria-label="Pinned">
              <PinIcon />
            </span>
          )}
          <button
            className="conversation-menu-button"
            onClick={toggleMenu}
            aria-label={`More options for ${c.title}`}
            aria-haspopup="true"
            aria-expanded={menuPos !== null}
          >
            &#8942;
          </button>
          {menuPos && (
            <div
              className="conversation-menu"
              ref={menuRef}
              role="menu"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button className="conversation-menu-item" role="menuitem" onClick={handleTogglePin}>
                {c.pinned ? "Unpin conversation" : "Pin conversation"}
              </button>
              <button className="conversation-menu-item" role="menuitem" onClick={startRename}>
                Rename conversation
              </button>
              <button
                className="conversation-menu-item conversation-menu-item-danger"
                role="menuitem"
                onClick={() => {
                  setMenuPos(null);
                  setConfirming(true);
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
}
