import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import ProfileSidebar from "../components/ProfileSidebar";
import FormateurContent from "../components/profil/FormateurContent";
import EleveContent from "../components/profil/EleveContent";
import AdministrateurContent from "../components/profil/AdministrateurContent";
import "./Profil.css";

// TODO: à remplacer par les infos de profil renvoyées par le back (endpoint /me par ex).
// Mocké par rôle pour l'instant, le temps de finaliser le design.
const MOCK_INFO = {
  formateur: {
    infoLines: ["j.marchand@organisme.fr", "06 98 76 54 32", "Spécialité : Développement Java"],
  },
  eleve: {
    infoLines: ["camille.dubois@mail.fr", "06 12 34 56 78", "Inscrite depuis sept. 2025"],
  },
  administrateur: {
    infoLines: ["s.lenoir@organisme.fr", "Accès complet à la plateforme"],
  },
};

const ROLE_LABELS = {
  formateur: "Formateur",
  eleve: "Élève",
  administrateur: "Administrateur",
  referente: "Référente",
};

// Liens de nav propres à chaque rôle. "Mon calendrier" pointe vers une page
// pas encore construite - à ajuster/retirer si ce n'est pas voulu.
const NAV_ITEMS = {
  eleve: [
    { to: "/profil", label: "Profil" },
    { to: "/calendrier", label: "Mon calendrier" },
  ],
  formateur: [{ to: "/profil", label: "Profil" }],
  administrateur: [{ to: "/profil", label: "Profil" }],
};

export default function Profil() {
  const { user, role } = useAuth();

  const mock = MOCK_INFO[role] ?? { infoLines: [] };
  const navItems = NAV_ITEMS[role] ?? [{ to: "/profil", label: "Profil" }];

  return (
    <AppShell navItems={navItems}>
      <ProfileSidebar
        name={user?.nom ?? "Utilisateur"}
        role={ROLE_LABELS[role] ?? role}
        infoLines={mock.infoLines}
        onEdit={() => console.log("TODO: ouvrir l'édition du profil")}
      />

      <section className="profil-content">
        {role === "formateur" && <FormateurContent />}
        {role === "eleve" && <EleveContent />}
        {role === "administrateur" && <AdministrateurContent />}
      </section>
    </AppShell>
  );
}