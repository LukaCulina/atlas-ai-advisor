import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

const navLinkClassName = ({ isActive }: { isActive: boolean }) => (isActive ? "nav-active" : undefined);

export function Layout() {
  const location = useLocation();
  const conversationsActive = location.pathname === "/" || location.pathname.startsWith("/c/");

  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close the drawer when the route changes, adjusting state during render
  // (React's documented pattern for this) instead of in an effect.
  const [lastPathname, setLastPathname] = useState(location.pathname);
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;

    const hamburgerEl = hamburgerRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      hamburgerEl?.focus();
    };
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-left">
          <button
            ref={hamburgerRef}
            className="hamburger-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
          <Link to="/" className="app-title">
            Travel Advisor
          </Link>
        </div>
        <nav>
          <NavLink to="/" className={conversationsActive ? "nav-active" : undefined}>
            Conversations
          </NavLink>
          <NavLink to="/trip" className={navLinkClassName}>
            Trip
          </NavLink>
          <NavLink to="/settings" className={navLinkClassName}>
            Settings
          </NavLink>
        </nav>
      </header>

      {menuOpen && <div className="drawer-backdrop" onClick={() => setMenuOpen(false)} />}
      <nav
        className={`drawer${menuOpen ? " drawer-open" : ""}`}
        aria-label="Mobile navigation"
        inert={!menuOpen}
      >
        <button ref={closeButtonRef} className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
          &times;
        </button>
        <NavLink to="/" className={conversationsActive ? "nav-active" : undefined}>
          Conversations
        </NavLink>
        <NavLink to="/trip" className={navLinkClassName}>
          Trip
        </NavLink>
        <NavLink to="/settings" className={navLinkClassName}>
          Settings
        </NavLink>
      </nav>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
