import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getProfil } from "../api/authApi.js";
import "../styles/profile.css";

export default function Profile() {
  // On s'appuie sur la session locale pour afficher un premier état immédiat.
  const { user, role, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const initials = useMemo(() => {
    // Génère les initiales pour l'avatar visuel.
    const sourceName = profile?.nom || user?.nom || "Profil";
    return sourceName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [profile, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      // Si aucun rôle n'est disponible, on arrête simplement le chargement.
      if (!role) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        // On remplace les données locales par celles du backend si elles existent.
        const remoteProfile = await getProfil(role);
        if (isMounted && remoteProfile) {
          setProfile(remoteProfile);
        }
      } catch (fetchError) {
        // En cas d'échec réseau, on garde l'ancien profil et on affiche l'erreur.
        if (isMounted) {
          setError(fetchError.message || "Impossible de charger le profil.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [role]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    // État d'attente pendant la récupération du profil.
    return (
      <main className="profile-page profile-page--loading">
        <div className="profile-card">
          <p className="profile-status">Chargement du profil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-shell">
        <header className="profile-hero">
          {/* Petit bloc visuel pour donner un repère immédiat à l'utilisateur. */}
          <div className="profile-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="profile-hero__text">
            <p className="profile-kicker">Espace personnel</p>
            <h1>{profile?.nom || user.nom}</h1>
            <p className="profile-subtitle">
              {profile?.role || user.role} - tableau de bord simple pour suivre votre compte.
            </p>
          </div>
          <button type="button" className="profile-logout" onClick={logout}>
            Se déconnecter
          </button>
        </header>

        {error && <div className="profile-alert">{error}</div>}

        <div className="profile-grid">
          {/* Carte principale avec les informations du compte. */}
          <article className="profile-card">
            <h2>Informations</h2>
            <dl className="profile-list">
              <div>
                <dt>Nom</dt>
                <dd>{profile?.nom || user.nom}</dd>
              </div>
              <div>
                <dt>Rôle</dt>
                <dd>{profile?.role || user.role}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{profile?.email || user.email}</dd>
              </div>
              {profile?.telephone && (
                <div>
                  <dt>Téléphone</dt>
                  <dd>{profile.telephone}</dd>
                </div>
              )}
              {profile?.specialite && (
                <div>
                  <dt>Spécialité</dt>
                  <dd>{profile.specialite}</dd>
                </div>
              )}
            </dl>
          </article>

          {/* Résumé pédagogique pour garder une page simple et utile. */}
          <article className="profile-card profile-card--accent">
            <h2>Résumé</h2>
            <p>
              Le profil affiché vient du backend Django. Cette page peut servir de base pour
              ajouter les cours, les promotions ou les absences plus tard.
            </p>
            <div className="profile-meta">
              <span>Connexion active</span>
              <strong>{profile?.identifiant || user.identifiant}</strong>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
