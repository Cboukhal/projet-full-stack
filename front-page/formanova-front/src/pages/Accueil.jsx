import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import "./Accueil.css";

function getNavLinks(role) {
  if (role === "referente") {
    return [{ to: "/espace-referente/filieres", label: "Gérer les filières" }];
  }

  if (role === "eleve") {
    return [{ to: "/calendrier", label: "Mon calendrier" }];
  }

  return [];
}

export default function Accueil() {
  const { user, role } = useAuth();
  const displayName = user?.nom?.trim() || user?.identifiant || "Utilisateur";

  return (
    <AppShell title="Accueil" navLinks={getNavLinks(role)}>
      <section className="accueil-page" aria-labelledby="accueil-title">
        <div className="accueil-card" aria-live="polite">
          <h1 id="accueil-title" className="accueil-card__title">
            Formanova
          </h1>

          <p className="accueil-card__welcome">Bienvenue {displayName}</p>
        </div>
      </section>
    </AppShell>
  );
}
