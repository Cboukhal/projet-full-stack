import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./ReferenteSidebar.css";

const NAV_ITEMS = [
  { to: "/espace-referente/filieres", label: "Filières" },
  { to: "/espace-referente/cursus", label: "Cursus" },
  { to: "/espace-referente/cours", label: "Cours" },
  { to: "/espace-referente/promotions", label: "Promotions" },
  { to: "/espace-referente/salles", label: "Salles" },
  { to: "/espace-referente/inscriptions", label: "Inscriptions" },
];

export default function ReferenteSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={"referente-sidebar" + (collapsed ? " referente-sidebar--collapsed" : "")}>
      <button
        type="button"
        className="referente-sidebar__toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
      >
        {collapsed ? "›" : "‹"}
      </button>

      <nav className="referente-sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              "referente-sidebar__link" + (isActive ? " referente-sidebar__link--active" : "")
            }
          >
            <span className="referente-sidebar__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
