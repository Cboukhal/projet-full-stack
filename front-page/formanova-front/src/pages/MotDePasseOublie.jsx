import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import TextField from "../components/TextField";
import { requestPasswordReset } from "../api/passwordResetApi";
import "./PasswordReset.css";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Saisissez l'adresse e-mail associée à votre compte.");
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset(normalizedEmail);

      // Le message reste volontairement neutre pour ne pas révéler si un compte existe.
      setSuccess(
        response?.detail ||
          "Si un compte correspond à cette adresse, un lien de réinitialisation vient d'être envoyé.",
      );
    } catch (err) {
      setError(err.message || "Une erreur est survenue. Réessayez dans quelques instants.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="password-reset">
        <h1 className="password-reset__title">Mot de passe oublié</h1>
        <p className="password-reset__subtitle">
          Indiquez l'adresse e-mail de votre compte. Nous vous enverrons un lien pour choisir un
          nouveau mot de passe.
        </p>

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

        {!success && (
          <form
            className="password-reset__form"
            onSubmit={handleSubmit}
            aria-busy={isSubmitting}
            noValidate
          >
            <TextField
              label="Adresse e-mail"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nom@exemple.fr"
              autoComplete="email"
              inputMode="email"
              required
              disabled={isSubmitting}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Envoi en cours..." : "Envoyer le lien"}
            </Button>
          </form>
        )}

        <p className="password-reset__back">
          <Link to="/login" className="password-reset__link">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
