import "./authlayout.css"

function LogoMark() {
  // Placeholder vectoriel - à remplacer par le vrai logo (ex: src/assets/logo.svg)
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <path
        d="M10 30c0-11 8-19 18-19s18 8 18 19"
        stroke="var(--color-blue)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M28 11c6-3 13-3 18 1l-8 4-10-5Z"
        fill="var(--color-orange)"
      />
      <text
        x="28"
        y="34"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="var(--color-blue)"
        fontFamily="var(--font-base)"
      >
        F
      </text>
    </svg>
  );
}

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
            <LogoMark />
            <div className="auth-brand__logo-text">
              <span className="auth-brand__logo-name">Formanova</span>
              <span className="auth-brand__logo-tagline">
                TRAINING · EDUCATION · MANAGEMENT
              </span>
            </div>
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