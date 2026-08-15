import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import Button from "../../components/Button";
import { PROMOTIONS } from "../../api/promotionsMock";
import "./PlanifierCours.css";

export default function PlanifierCours() {
  const { promoId } = useParams();
  const promo = PROMOTIONS.find((p) => p.id === promoId);

  const [planning, setPlanning] = useState(promo?.planning ?? []);

  if (!promo) {
    return <Navigate to="/espace-referente/promotions" replace />;
  }

  const updateDate = (coursId, field, value) => {
    setPlanning((prev) =>
      prev.map((c) =>
        c.coursId === coursId
          ? {
              ...c,
              [field]: value,
              statut: c.dateDebut || field === "dateDebut" ? c.statut : c.statut,
            }
          : c
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: brancher l'appel API une fois le back prêt
    console.log("Enregistrer la planification :", planning);
  };

  const nbPlanifies = planning.filter((c) => c.statut === "planifié").length;

  return (
    <ReferenteLayout>
      <p className="referente-breadcrumb">
        <Link to="/espace-referente/promotions" className="referente-breadcrumb__link">
          Promotions
        </Link>{" "}
        /{" "}
        <Link
          to={`/espace-referente/promotions/${promo.id}`}
          className="referente-breadcrumb__link"
        >
          {promo.titre}
        </Link>{" "}
        / Planifier les cours
      </p>

      <div className="referente-detail-grid">
        <form onSubmit={handleSubmit} noValidate className="referente-detail-grid__col">
          <FormCard
            title="Planification des cours"
            subtitle="Respectez l'ordre défini dans le cursus. Alerte en cas d'écart."
          >
            <div className="planning-list">
              {planning.map((c, index) => (
                <div key={c.coursId} className="planning-row">
                  <div className="planning-row__title">
                    {index + 1}. {c.titre}
                  </div>
                  <div className="planning-row__dates">
                    <input
                      type="text"
                      className="planning-row__date-input"
                      placeholder="Date début"
                      value={c.dateDebut}
                      onChange={(e) => updateDate(c.coursId, "dateDebut", e.target.value)}
                    />
                    <input
                      type="text"
                      className="planning-row__date-input"
                      placeholder="Date fin"
                      value={c.dateFin}
                      onChange={(e) => updateDate(c.coursId, "dateFin", e.target.value)}
                    />
                  </div>
                  <span
                    className={
                      "planning-row__status " +
                      (c.statut === "planifié"
                        ? "planning-row__status--ok"
                        : "planning-row__status--pending")
                    }
                  >
                    {c.statut === "planifié" ? "✓ planifié" : "⚠ à planifier"}
                  </span>
                </div>
              ))}
            </div>

            <Button type="submit" className="referente-form-submit">
              Enregistrer la planification
            </Button>
          </FormCard>
        </form>

        <FormCard title="Récapitulatif" className="referente-detail-grid__col">
          <p className="referente-form-note" style={{ marginTop: 0 }}>
            Cursus : {promo.cursusNom}
            <br />
            Début : {promo.dateDebut}
            <br />
            Fin estimée : {promo.dateFinEstimee}
            <br />
            {nbPlanifies} / {promo.planning.length > 0 ? promo.planning.length : "?"} cours
            planifiés
          </p>

          <div className="planning-warning">
            <p className="planning-warning__title">⚠ Ordre à respecter</p>
            <p className="planning-warning__text">sauf forçage manuel.</p>
          </div>
        </FormCard>
      </div>
    </ReferenteLayout>
  );
}
