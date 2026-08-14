import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getProfil } from "../api/authApi.js";
import AppShell from "../components/AppSheLL.jsx";
import ProfileSidebar from "../components/ProfileSidebar.jsx";
import FormateurContent from "../components/profil/FormateurContent.jsx";
import EleveContent from "../components/profil/EleveContent.jsx";
import AdministrateurContent from "../components/profil/AdministrateurContent.jsx";
import "./profil.css";

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
  const { user, role, token } = useAuth();
  // On affiche d'abord la fiche déjà connue (reçue au login), puis on la rafraîchit depuis le backend.
  const [profile, setProfile] = useState(user);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!token) {
        return;
      }

      try {
        // Le profil renvoyé dépend du token, pas d'un paramètre choisi côté client.
        const remoteProfile = await getProfil(token);
        if (isMounted && remoteProfile) {
          setProfile(remoteProfile);
        }
      } catch {
        // Si le backend ne répond pas, on garde la session déjà chargée.
      }
    }

    loadProfile();

    // Évite de mettre à jour l'état si le composant est démonté avant la fin de l'appel.
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Construit les lignes d'info affichées sous le nom (email, téléphone, spécialité...).
  const infoLines = useMemo(() => {
    const lines = [profile?.email, profile?.telephone]
      .filter(Boolean)
      .map((value) => value);

    if (profile?.specialite) {
      lines.push(`Spécialité : ${profile.specialite}`);
    }

    if (role === "eleve") {
      lines.push("Accès apprenant");
    }

    return lines;
  }, [profile, role]);

  const navItems = NAV_ITEMS[role] ?? [{ to: "/profil", label: "Profil" }];

  return (
    <AppShell navItems={navItems}>
      <ProfileSidebar
        name={profile?.nom ?? user?.nom ?? "Utilisateur"}
        role={ROLE_LABELS[role] ?? role}
        infoLines={infoLines}
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