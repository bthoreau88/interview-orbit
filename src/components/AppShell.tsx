import { Link, NavLink, Outlet } from "react-router";
import { OrbitWordmark } from "./OrbitWordmark";

export function AppShell() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <header className="shell-header">
        <div className="shell-header-inner">
          <Link to="/" className="brand">
            <OrbitWordmark />
          </Link>
          <nav aria-label="Primary">
            <div className="nav">
              <NavLink to="/" end>
                Home
              </NavLink>
              <NavLink to="/practice">Practice</NavLink>
              <NavLink to="/history">History</NavLink>
            </div>
          </nav>
        </div>
      </header>
      <main id="main" className="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="footer">
        <p>
          Local prototype. Recordings stay in this browser tab and are never uploaded. Feedback is rule-based, not AI
          grading.
        </p>
      </footer>
    </>
  );
}
