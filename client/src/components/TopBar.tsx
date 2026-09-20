interface TopBarProps {
  title: string | null;
  onToggleSidebar: () => void;
  toggleButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export function TopBar({ title, onToggleSidebar, toggleButtonRef }: TopBarProps) {
  return (
    <div className="content-topbar">
      <button
        ref={toggleButtonRef}
        className="sidebar-toggle-button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <span className="hamburger-bar" />
        <span className="hamburger-bar" />
        <span className="hamburger-bar" />
      </button>
      {title && <span className="content-topbar-title">{title}</span>}
    </div>
  );
}
