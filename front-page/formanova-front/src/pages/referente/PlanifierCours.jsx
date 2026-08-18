import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import Button from "../../components/Button";
import { getPromotion, updatePromotionPlanning } from "../../api/promotionsApi";
import "./PlanifierCours.css";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

export default function PlanifierCours() {
  const { promoId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [promo, setPromo] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [planning, setPlanning] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPromotion(token, promoId)
      .then((data) => {
        setPromo(data);
        setPlanning(data.planning);
      })
      .catch(() => setNotFound(true));
  }, [promoId, token]);

  if (notFound) {
    return <Navigate to="/espace-referente/promotions" replace />;
  }

  if (!promo) {
    return null;
  }

  // Ne met à jour que la date saisie ; le statut ("planifié"/"à planifier") n'est pas recalculé
  // ici, il vient toujours du backend après enregistrement (voir handleSubmit).
  const updateDate = (id, field, value) => {
    setPlanning((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const updated = await updatePromotionPlanning(
        token,
        promo.id,
        planning.map((c) => ({ id: c.id, dateDebut: c.dateDebut || null, dateFin: c.dateFin || null }))
      );
      setPromo(updated);
      setPlanning(updated.planning);
      navigate(`/espace-referente/promotions/${promo.id}`);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
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

      {error && <p className="inscription-form__message">{error}</p>}

      <div className="referente-detail-grid">
        <form onSubmit={handleSubmit} noValidate className="referente-detail-grid__col">
          <FormCard
            title="Planification des cours"
            subtitle="Respectez l'ordre défini dans le cursus. Alerte en cas d'écart."
          >
            <div className="planning-list">
              {planning.map((c, index) => (
                <div key={c.id} className="planning-row">
                  <div className="planning-row__title">
                    {index + 1}. {c.titre}
                  </div>
                  <div className="planning-row__dates">
                    {/* slice(0, 16) : l'input datetime-local attend "YYYY-MM-DDTHH:mm",
                        sans les secondes/le fuseau que renvoie l'ISO du backend. */}
                    <input
                      type="datetime-local"
                      className="planning-row__date-input"
                      value={c.dateDebut ? c.dateDebut.slice(0, 16) : ""}
                      onChange={(e) => updateDate(c.id, "dateDebut", e.target.value)}
                    />
                    <input
                      type="datetime-local"
                      className="planning-row__date-input"
                      value={c.dateFin ? c.dateFin.slice(0, 16) : ""}
                      onChange={(e) => updateDate(c.id, "dateFin", e.target.value)}
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

            <Button type="submit" className="referente-form-submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer la planification"}
            </Button>
          </FormCard>
        </form>

        <FormCard title="Récapitulatif" className="referente-detail-grid__col">
          <p className="referente-form-note" style={{ marginTop: 0 }}>
            Cursus : {promo.cursusNom}
            <br />
            Début : {formatDate(promo.dateDebut)}
            <br />
            Fin estimée : {formatDate(promo.dateFinEstimee)}
            <br />
            {nbPlanifies} / {planning.length > 0 ? planning.length : "?"} cours planifiés
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
