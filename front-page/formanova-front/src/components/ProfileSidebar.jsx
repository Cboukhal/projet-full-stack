import Button from "./Button";
import "./ProfileSidebar.css";

function PersonIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="var(--color-blue)" strokeWidth="1.4" />
      <path
        d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"
        stroke="var(--color-blue)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * infoLines: lignes de texte libres sous le nom (email, téléphone, spécialité...).
 * Le contenu varie selon le rôle, mais la structure visuelle reste la même partout.
 */
export default function ProfileSidebar({ name, role, infoLines = [], onEdit }) {
  return (
    <aside className="profile-sidebar">
      <div className="profile-sidebar__avatar">
        <PersonIcon />
      </div>
      <p className="profile-sidebar__name">{name}</p>
      <p className="profile-sidebar__role">{role}</p>

      <div className="profile-sidebar__info">
        {infoLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <Button variant="primary" onClick={onEdit} className="profile-sidebar__edit">
        Modifier votre profil
      </Button>
    </aside>
  );
}