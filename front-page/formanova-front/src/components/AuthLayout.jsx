import "./authlayout.css"
import logo from "../assets/images/logo.jpg";

/**
 * Coquille commune aux écrans d'authentification (connexion, inscription...).
 * Le panneau gauche est fixe (branding), le panneau droit reçoit le contenu (children).
 */
export default function AuthLayout({
  brandTitle = "Organisme de formation",
  brandSubtitle = "Service pédagogique",
  brandTagline = "Filières, cursus, cours et promotions gérés en un seul endroit.",
  children,
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <aside className="auth-brand">
          <div className="auth-brand__logo-box">
            {/* <LogoMark /> */}
            <img
              src={logo}
              alt="Formanova"
              className="auth-brand__logo-img"
            />
          </div>

          <h2 className="auth-brand__title">{brandTitle}</h2>
          <p className="auth-brand__subtitle">{brandSubtitle}</p>

          <div className="auth-brand__divider" />

          <p className="auth-brand__tagline">{brandTagline}</p>
        </aside>

        <section className="auth-content">{children}</section>
      </div>
    </div>
  );
}