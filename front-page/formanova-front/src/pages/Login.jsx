import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import Button from "../components/Button";
import { getRoleHome } from "../authRoutes";
import "./Login.css";

export default function Login() {
  const [form, setForm] = useState({ identifiant: "", motDePasse: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { user } = await login(form.identifiant, form.motDePasse);
      navigate(getRoleHome(user.role), { replace: true });
    } catch (err) {
      setError(err.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="login-title">Connexion</h1>
      <p className="login-subtitle">
        Connectez-vous avec votre identifiant et votre mot de passe pour accéder à votre espace.
      </p>

      {error && <div className="login-error">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Identifiant"
          name="identifiant"
          value={form.identifiant}
          onChange={handleChange}
          autoComplete="username"
        />

        <TextField
          label="Mot de passe"
          name="motDePasse"
          value={form.motDePasse}
          onChange={handleChange}
          showToggle
          autoComplete="current-password"
        />

        <div className="login-forgot">
          <Link to="/mot-de-passe-oublie" className="login-forgot__link">
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </AuthLayout>
  );
}
