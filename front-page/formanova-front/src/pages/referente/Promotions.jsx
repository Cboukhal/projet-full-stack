import ReferenteLayout from "../../components/ReferenteLayout";
import InscriptionForm from "../../components/InscriptionForm";
import "./Promotions.css";

// TODO: remplacer par les vraies données du back
const STATS = [
  { id: 1, value: 24, label: "Promotions actives" },
  { id: 2, value: 156, label: "Élèves inscrits" },
  { id: 3, value: 7, label: "Cursus disponibles" },
];

const PROMOTIONS = [
  { id: 1, titre: "CDA — Promo 2026-A", meta: "14 élèves · en cours" },
  { id: 2, titre: "TSSR — Promo 2026-B", meta: "10 élèves · en cours" },
  { id: 3, titre: "ASR — Promo 2026-C", meta: "12 élèves · à venir" },
];

function BookmarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"
        stroke="var(--color-blue)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Promotions() {
  return (
    <ReferenteLayout>
      <div className="promotions-page">
        <section className="promotions-page__main">
          <h1 className="promotions-page__title">Gestion des promotions</h1>
          <p className="promotions-page__subtitle">Créez, modifiez et planifiez vos promotions.</p>

          <div className="promotions-stats">
            {STATS.map((s) => (
              <div key={s.id} className="stat-card">
                <span className="stat-card__value">{s.value}</span>
                <span className="stat-card__label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="promotions-list">
            {PROMOTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="promotion-card"
                onClick={() => console.log("TODO: détail promotion", p)}
              >
                <span className="promotion-card__icon">
                  <BookmarkIcon />
                </span>
                <span className="promotion-card__body">
                  <span className="promotion-card__title">{p.titre}</span>
                  <span className="promotion-card__meta">{p.meta}</span>
                </span>
                <span className="promotion-card__chevron" aria-hidden="true">
                  ›
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="promotions-page__add-link"
            onClick={() => console.log("TODO: ouvrir le formulaire de planification de cursus")}
          >
            + Planifier un cursus
          </button>
        </section>

        <InscriptionForm title="Inscription" />
      </div>
    </ReferenteLayout>
  );
}
