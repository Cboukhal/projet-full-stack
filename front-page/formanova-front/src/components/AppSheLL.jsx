import { NavLink } from "react-router-dom";
import "./appshell.css";

function AvatarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Coquille commune à toutes les pages affichées après connexion.
 * navItems: [{ to, label }] - liens affichés au centre du bandeau, propres au rôle connecté.
 */
export default function AppShell({ navItems = [], children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__logo">
          <span className="app-header__logo-badge">F</span>
          <span className="app-header__logo-name">Formanova</span>
        </div>

        <nav className="app-header__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                "app-header__nav-link" + (isActive ? " app-header__nav-link--active" : "")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/profil" className="app-header__avatar" aria-label="Mon profil">
          <AvatarIcon />
        </NavLink>
      </header>

      <main className="app-body">{children}</main>

      <footer className="app-footer">Aide · Mentions légales</footer>
    </div>
  );
}