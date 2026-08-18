import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import Button from "../../components/Button";
import { getPromotion } from "../../api/promotionsApi";
import "./ReferenteForms.css";
import "./PlanifierCours.css";

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "";
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

export default function PromotionDetail() {
  const { promoId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [promo, setPromo] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getPromotion(token, promoId)
      .then(setPromo)
      .catch(() => setNotFound(true));
  }, [promoId, token]);

  if (notFound) {
    return <Navigate to="/espace-referente/promotions" replace />;
  }

  if (!promo) {
    return null;
  }

  const coursPlanifies = promo.planning.filter((c) => c.statut === "planifié").length;

  return (
    <ReferenteLayout>
      <p className="referente-breadcrumb">
        <Link to="/espace-referente/promotions" className="referente-breadcrumb__link">
          Promotions
        </Link>{" "}
        / {promo.titre}
      </p>

      <div className="referente-detail-grid">
        <FormCard title={promo.titre} className="referente-detail-grid__col">
          <p className="referente-form-note" style={{ marginTop: 0 }}>
            Cursus : {promo.cursusNom}
            <br />
            Début : {formatDate(promo.dateDebut)} · Fin estimée : {formatDate(promo.dateFinEstimee)}
            <br />
            {promo.elevesInscrits} / {promo.effectifMax} élèves inscrits
          </p>

          <Button
            onClick={() => navigate(`/espace-referente/promotions/${promo.id}/planifier-cours`)}
            className="referente-form-submit"
          >
            Planifier les cours →
          </Button>
        </FormCard>

        <FormCard
          title="Cours planifiés"
          subtitle={`${coursPlanifies} / ${promo.planning.length || "?"} cours planifiés`}
          className="referente-detail-grid__col"
        >
          {promo.planning.length === 0 && (
            <p className="referente-form-note" style={{ marginTop: 0 }}>
              Aucun cours planifié pour l'instant.
            </p>
          )}

          <div className="ordre-list">
            {promo.planning.map((c, i) => (
              <div key={c.id} className="ordre-item ordre-item--static">
                <span className="ordre-item__body">
                  <span className="ordre-item__title">
                    {i + 1}. {c.titre}
                  </span>
                  <span className="ordre-item__prerequis">
                    {c.statut === "planifié"
                      ? `${formatDateTime(c.dateDebut)} → ${formatDateTime(c.dateFin)}`
                      : "Date non planifiée"}
                  </span>
                </span>
                <span
                  className={
                    c.statut === "planifié"
                      ? "planning-row__status planning-row__status--ok"
                      : "planning-row__status planning-row__status--pending"
                  }
                  style={{ marginLeft: "auto" }}
                >
                  {c.statut === "planifié" ? "✓ planifié" : "⚠ à planifier"}
                </span>
              </div>
            ))}
          </div>
        </FormCard>
      </div>
    </ReferenteLayout>
  );
}
