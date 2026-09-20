import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ConversationsProvider } from "./context/ConversationsContext";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { useMediaQuery } from "./hooks/useMediaQuery";

export interface LayoutOutletContext {
  setTopBarTitle: (title: string | null) => void;
}

const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";
const MOBILE_QUERY = "(max-width: 700px)";

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function Layout() {
  const location = useLocation();
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(getInitialCollapsed);
  const [topBarTitle, setTopBarTitle] = useState<string | null>(null);

  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close the mobile drawer when the route changes, adjusting state during
  // render (React's documented pattern for this) instead of in an effect.
  const [lastPathname, setLastPathname] = useState(location.pathname);
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, desktopCollapsed ? "1" : "0");
    } catch {
      // Private browsing / storage disabled — collapsed state just won't persist.
    }
  }, [desktopCollapsed]);

  useEffect(() => {
    if (!mobileOpen) return;

    const toggleEl = toggleButtonRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      toggleEl?.focus();
    };
  }, [mobileOpen]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) setMobileOpen((v) => !v);
    else setDesktopCollapsed((v) => !v);
  }, [isMobile]);

  const sidebarHidden = isMobile ? !mobileOpen : desktopCollapsed;

  return (
    <ConversationsProvider>
      <div className={`app-shell${desktopCollapsed ? " sidebar-collapsed" : ""}`}>
        {isMobile && mobileOpen && <div className="drawer-backdrop" onClick={() => setMobileOpen(false)} />}
        <Sidebar
          mobileOpen={mobileOpen}
          hidden={sidebarHidden}
          onCloseMobile={() => setMobileOpen(false)}
          closeButtonRef={closeButtonRef}
        />
        <div className="content-column">
          <TopBar title={topBarTitle} onToggleSidebar={toggleSidebar} toggleButtonRef={toggleButtonRef} />
          <main className="app-main">
            <Outlet context={{ setTopBarTitle } satisfies LayoutOutletContext} />
          </main>
        </div>
      </div>
    </ConversationsProvider>
  );
}
