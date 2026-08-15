import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import Button from "../../components/Button";
import { PROMOTIONS } from "../../api/promotionsMock";
import "./ReferenteForms.css";

export default function PromotionDetail() {
  const { promoId } = useParams();
  const navigate = useNavigate();
  const promo = PROMOTIONS.find((p) => p.id === promoId);

  if (!promo) {
    return <Navigate to="/espace-referente/promotions" replace />;
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
            Début : {promo.dateDebut} · Fin estimée : {promo.dateFinEstimee}
            <br />
            {promo.elevesInscrits} / {promo.effectifMax} élèves inscrits
            <br />
            {coursPlanifies} / {promo.planning.length} cours planifiés
          </p>

          <Button
            onClick={() => navigate(`/espace-referente/promotions/${promo.id}/planifier-cours`)}
            className="referente-form-submit"
          >
            Planifier les cours →
          </Button>
        </FormCard>
      </div>
    </ReferenteLayout>
  );
}
