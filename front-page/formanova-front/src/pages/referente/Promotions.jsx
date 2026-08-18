import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import InscriptionForm from "../../components/InscriptionForm";
import { listPromotions } from "../../api/promotionsApi";
import { listCursus } from "../../api/cursusApi";
import "./Promotions.css";

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
  const navigate = useNavigate();
  const { token } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [nbCursus, setNbCursus] = useState(0);

  const load = () => {
    listPromotions(token).then(setPromotions).catch(() => {});
    listCursus(token).then((data) => setNbCursus(data.length)).catch(() => {});
  };

  useEffect(load, [token]);

  const stats = [
    { id: 1, value: promotions.filter((p) => p.statut === "en cours").length, label: "Promotions actives" },
    { id: 2, value: promotions.reduce((sum, p) => sum + p.elevesInscrits, 0), label: "Élèves inscrits" },
    { id: 3, value: nbCursus, label: "Cursus disponibles" },
  ];

  return (
    <ReferenteLayout>
      <div className="promotions-page">
        <section className="promotions-page__main">
          <h1 className="promotions-page__title">Gestion des promotions</h1>
          <p className="promotions-page__subtitle">Créez, modifiez et planifiez vos promotions.</p>

          <div className="promotions-stats">
            {stats.map((s) => (
              <div key={s.id} className="stat-card">
                <span className="stat-card__value">{s.value}</span>
                <span className="stat-card__label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="promotions-list">
            {promotions.map((p) => (
              <button
                key={p.id}
                type="button"
                className="promotion-card"
                onClick={() => navigate(`/espace-referente/promotions/${p.id}`)}
              >
                <span className="promotion-card__icon">
                  <BookmarkIcon />
                </span>
                <span className="promotion-card__body">
                  <span className="promotion-card__title">{p.titre}</span>
                  <span className="promotion-card__meta">
                    {p.elevesInscrits} élèves · {p.statut}
                  </span>
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
            onClick={() => navigate("/espace-referente/cursus")}
          >
            + Planifier un cursus
          </button>
        </section>

        <InscriptionForm title="Inscription" onDone={load} />
      </div>
    </ReferenteLayout>
  );
}
