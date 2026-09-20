import { Link, NavLink, Outlet } from "react-router-dom";

const navLinkClassName = ({ isActive }: { isActive: boolean }) => (isActive ? "nav-active" : undefined);

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-title">
          Travel Advisor
        </Link>
        <nav>
          <NavLink to="/" end className={navLinkClassName}>
            Conversations
          </NavLink>
          <NavLink to="/settings" className={navLinkClassName}>
            Settings
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
