import { NavLink } from "react-router-dom";
import logo from "../assets/images/logo.jpg";
import "./AppShell.css";

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
 * Coquille commune à toutes les pages affichées après connexion :
 * logo à gauche, titre de la page + liens complémentaires centrés, avatar (-> /profil) à droite.
 *
 * title: libellé de la page courante (ex: "Profil", "Calendrier").
 * navLinks: liens optionnels affichés à côté du titre (ex: "Mon calendrier" sur la page Profil,
 *           visible uniquement pour les rôles qui y ont accès).
 */
export default function AppShell({ title, navLinks = [], children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__logo">
          <img src={logo} alt="Formanova" className="app-header__logo-img" />
        </div>

        <div className="app-header__center">
          {title && <span className="app-header__title">{title}</span>}
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                "app-header__nav-link" + (isActive ? " app-header__nav-link--active" : "")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <NavLink to="/profil" className="app-header__avatar" aria-label="Mon profil">
          <AvatarIcon />
        </NavLink>
      </header>

      <main className="app-body">{children}</main>

      <footer className="app-footer">Aide · Mentions légales</footer>
    </div>
  );
}