import { Link, NavLink } from "react-router-dom";
import { useConversations } from "../hooks/useConversations";
import { ConversationRow } from "./ConversationRow";
import { TripIcon } from "./TripIcon";

interface SidebarProps {
  mobileOpen: boolean;
  hidden: boolean;
  onCloseMobile: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const sidebarNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `sidebar-navlink${isActive ? " nav-active" : ""}`;

export function Sidebar({ mobileOpen, hidden, onCloseMobile, closeButtonRef }: SidebarProps) {
  const { conversations, loadError } = useConversations();

  return (
    <nav className={`sidebar${mobileOpen ? " drawer-open" : ""}`} aria-label="Sidebar" inert={hidden}>
      <div className="sidebar-header">
        <Link to="/" className="app-title">
          Atlas
        </Link>
        <button ref={closeButtonRef} className="drawer-close" onClick={onCloseMobile} aria-label="Close menu">
          &times;
        </button>
      </div>

      <Link to="/" className="sidebar-new-chat">
        + New chat
      </Link>

      <NavLink to="/trip" className={sidebarNavLinkClassName}>
        <TripIcon />
        Trip
      </NavLink>

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
          <>
            {conversations.some((c) => c.pinned) && (
              <>
                <p className="sidebar-section-label">Pinned</p>
                <ul className="conversation-list">
                  {conversations.filter((c) => c.pinned).map((c) => (
                    <ConversationRow key={c.id} conversation={c} />
                  ))}
                </ul>
              </>
            )}
            <div className="sidebar-section-header">
              <p className="sidebar-section-label">Recents</p>
              <Link to="/conversations" className="sidebar-see-all">
                Search all
              </Link>
            </div>
            <ul className="conversation-list">
              {conversations.filter((c) => !c.pinned).map((c) => (
                <ConversationRow key={c.id} conversation={c} />
              ))}
            </ul>
          </>
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
