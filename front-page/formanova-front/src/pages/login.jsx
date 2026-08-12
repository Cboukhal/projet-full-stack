import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const ROLE_HOME = {
  eleve: "/profil",
  formateur: "/profil",
  referente: "/espace-referente",
  administrateur: "/profil",
};

export default function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { user } = await login(identifiant, motDePasse);
      navigate(ROLE_HOME[user.role] ?? "/profil");
    } catch (err) {
      setError(err.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <aside className="login-brand">
        <div className="login-brand__logo">
          <span>F</span>
        </div>
        <h1>Organisme de formation</h1>
        <p>Service pédagogique</p>
        <div className="login-brand__divider" />
        <p className="login-brand__tagline">
          Filières, cursus, cours et promotions gérés en un seul endroit.
        </p>
      </aside>

      <main className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Connexion</h2>
          <p className="login-form__subtitle">
            Connectez-vous avec votre identifiant et votre mot de passe pour
            accéder à votre espace.
          </p>

          {error && <div className="login-error">{error}</div>}

          <div className="field">
            <label htmlFor="identifiant">Identifiant</label>
            <input
              id="identifiant"
              type="text"
              autoComplete="username"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="motDePasse">Mot de passe</label>
            <input
              id="motDePasse"
              type="password"
              autoComplete="current-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
            />
          </div>

          <div className="field-row">
            <button type="button" className="link-button">
              Mot de passe oublié ?
            </button>
          </div>

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>

          <p className="login-note">Vos données sont protégées.</p>
        </form>
      </main>
    </div>
  );
}