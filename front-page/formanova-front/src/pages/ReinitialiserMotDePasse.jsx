/** Seconde étape du parcours : validation du jeton et choix du nouveau secret. */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import TextField from "../components/TextField";
import { resetPassword } from "../api/passwordResetApi";
import { useAuth } from "../context/AuthContext";
import "./PasswordReset.css";

export default function ReinitialiserMotDePasse() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Django place ce token dans le lien envoyé par e-mail : ?token=...
  const [token] = useState(
    () => location.state?.passwordResetToken || searchParams.get("token")?.trim() || "",
  );
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Conserve le jeton dans l'état de navigation tout en nettoyant rapidement l'URL visible.
  useEffect(() => {
    if (!searchParams.has("token")) {
      return;
    }

    // Retire le secret de la barre d'adresse pour éviter sa fuite dans l'historique ou le Referer.
    const safeParams = new URLSearchParams(searchParams);
    safeParams.delete("token");
    const safeSearch = safeParams.toString();

    navigate(
      { pathname: location.pathname, search: safeSearch ? `?${safeSearch}` : "" },
      {
        replace: true,
        state: { ...location.state, passwordResetToken: token },
      },
    );
  }, [location.pathname, location.state, navigate, searchParams, token]);

  /** Synchronise les deux champs contrôlés du formulaire. */
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  /** Effectue les contrôles immédiats avant de déléguer la validation complète au backend. */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.newPassword || !form.confirmPassword) {
      setError("Renseignez et confirmez votre nouveau mot de passe.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    // Même contrôle rapide que le validateur de longueur configuré dans Django.
    // Le backend reste l'autorité et applique aussi les autres règles de sécurité.
    if (form.newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await resetPassword(token, form.newPassword, form.confirmPassword);

      // Un changement de mot de passe invalide la session précédente, y compris dans localStorage.
      logout();
      setSuccess(response?.detail || "Votre mot de passe a bien été réinitialisé.");
      setForm({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.message || "Le lien est invalide ou a expiré. Demandez un nouveau lien.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Message partagé par le cas d'un lien tronqué ou ouvert sans son paramètre secret.
  const missingTokenMessage =
    "Ce lien de réinitialisation est incomplet. Demandez un nouveau lien depuis la page « Mot de passe oublié ».";

  return (
    <AuthLayout>
      <div className="password-reset">
        <h1 className="password-reset__title">Nouveau mot de passe</h1>
        <p className="password-reset__subtitle">
          Choisissez un nouveau mot de passe, puis saisissez-le une seconde fois pour le confirmer.
        </p>

        {!token && (
          <div className="password-reset__alert password-reset__alert--error" role="alert">
            {missingTokenMessage}
          </div>
        )}

        {error && (
          <div className="password-reset__alert password-reset__alert--error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div
            className="password-reset__alert password-reset__alert--success"
            role="status"
            aria-live="polite"
          >
            {success}
          </div>
        )}

        {token && !success && (
          <form
            className="password-reset__form"
            onSubmit={handleSubmit}
            aria-busy={isSubmitting}
            noValidate
          >
            <TextField
              label="Nouveau mot de passe"
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={handleChange}
              autoComplete="new-password"
              showToggle
              required
              minLength={8}
              disabled={isSubmitting}
            />

            <TextField
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              showToggle
              required
              minLength={8}
              disabled={isSubmitting}
            />

            <p className="password-reset__hint">
              Utilisez au moins 8 caractères et évitez un mot de passe trop courant,
              entièrement numérique ou proche de vos informations personnelles.
            </p>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Réinitialisation..." : "Enregistrer le mot de passe"}
            </Button>
          </form>
        )}

        <p className="password-reset__back">
          <Link
            to={success ? "/login" : token ? "/mot-de-passe-oublie" : "/login"}
            className="password-reset__link"
          >
            {success ? "Se connecter" : token ? "Demander un nouveau lien" : "Retour à la connexion"}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
