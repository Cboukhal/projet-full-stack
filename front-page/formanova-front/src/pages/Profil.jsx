import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfil } from "../api/authApi";
import AppShell from "../components/AppShell";
import ProfileSidebar from "../components/ProfileSidebar";
import EditProfileModal from "../components/EditProfileModal";
import FormateurContent from "../components/profil/FormateurContent";
import EleveContent from "../components/profil/EleveContent";
import AdministrateurContent from "../components/profil/AdministrateurContent";
import "./Profil.css";

const ROLE_LABELS = {
  formateur: "Formateur",
  eleve: "Élève",
  administrateur: "Administrateur",
  referente: "Référente",
};

export default function Profil() {
  const { user, role, token, updateUser } = useAuth();
  // On affiche d'abord la fiche déjà connue (reçue au login), puis on la rafraîchit depuis le backend.
  const [profile, setProfile] = useState(user);
  const [isEditing, setIsEditing] = useState(false);

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
    const lines = [profile?.email, profile?.telephone].filter(Boolean);
    if (profile?.specialite) {
      lines.push(`Spécialité : ${profile.specialite}`);
    }
    return lines;
  }, [profile]);

  const navLinks = role === "eleve" ? [{ to: "/calendrier", label: "Mon calendrier" }] : [];

  return (
    <AppShell title="Profil" navLinks={navLinks}>
      <div className="profil-layout">
        <ProfileSidebar
          name={profile?.nom ?? user?.nom ?? "Utilisateur"}
          role={ROLE_LABELS[role] ?? role}
          infoLines={infoLines}
          onEdit={() => setIsEditing(true)}
        />

        <section className="profil-content">
          {role === "formateur" && <FormateurContent />}
          {role === "eleve" && <EleveContent />}
          {role === "administrateur" && <AdministrateurContent />}
        </section>
      </div>

      {isEditing && (
        <EditProfileModal
          profile={profile}
          role={role}
          token={token}
          onClose={() => setIsEditing(false)}
          onSaved={(updated) => {
            setProfile(updated);
            updateUser(updated);
            setIsEditing(false);
          }}
        />
      )}
    </AppShell>
  );
}
