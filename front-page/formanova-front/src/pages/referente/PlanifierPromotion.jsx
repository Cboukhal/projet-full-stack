import { useState } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import { CURSUS } from "../../api/cursusMock";
import "./PlanifierPromotion.css";

const STEPS = [
  { id: 1, label: "Informations" },
  { id: 2, label: "Dates" },
  { id: 3, label: "Confirmation" },
];

export default function PlanifierPromotion() {
  const { cursusId } = useParams();
  const navigate = useNavigate();
  const cursus = CURSUS.find((c) => c.id === cursusId);

  const [step, setStep] = useState(1);
  const [nom, setNom] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [effectifMax, setEffectifMax] = useState("");

  if (!cursus) {
    return <Navigate to="/espace-referente/cursus" replace />;
  }

  const handleCreate = () => {
    // TODO: brancher l'appel API une fois le back prêt
    console.log("Créer la promotion :", { cursusId, nom, dateDebut, effectifMax });
    navigate("/espace-referente/promotions");
  };

  return (
    <ReferenteLayout>
      <p className="referente-breadcrumb">
        <Link to={`/espace-referente/cursus/${cursus.id}`} className="referente-breadcrumb__link">
          Cursus
        </Link>{" "}
        / {cursus.nom} / Planifier une promotion
      </p>

      <div className="wizard-steps">
        {STEPS.map((s) => (
          <div key={s.id} className="wizard-step">
            <span
              className={
                "wizard-step__badge" + (s.id === step ? " wizard-step__badge--active" : "")
              }
            >
              {s.id}
            </span>
            <span
              className={
                "wizard-step__label" + (s.id === step ? " wizard-step__label--active" : "")
              }
            >
              {s.label}
            </span>
            {s.id < STEPS.length && <span className="wizard-step__line" />}
          </div>
        ))}
      </div>

      <FormCard className="wizard-card">
        {step === 1 && (
          <>
            <h2 className="form-card__title">Nouvelle promotion</h2>
            <p className="form-card__subtitle">
              Créée à partir du cursus {cursus.nom} ({cursus.nbCours} cours, {cursus.dureeMois}{" "}
              mois). Les dates de chaque cours seront calculées automatiquement.
            </p>

            <TextField
              name="nom"
              placeholder={`Nom de la promotion — ${cursus.nom} 2026-C`}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />

            <div className="form-field-row">
              <TextField
                name="dateDebut"
                placeholder="Date de début"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
              <TextField
                name="effectifMax"
                placeholder="Effectif maximum — 16"
                value={effectifMax}
                onChange={(e) => setEffectifMax(e.target.value)}
              />
            </div>

            <p className="referente-form-note">
              Durée calculée : {cursus.dureeMois} mois (fin estimée : 12 déc 2026)
            </p>

            <Button className="referente-form-submit" onClick={() => setStep(2)}>
              Suivant →
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="form-card__title">Dates des cours</h2>
            <p className="form-card__subtitle">
              Calculées automatiquement à partir de la date de début et de l'ordre du cursus.
              Ajustables plus tard depuis la planification de la promotion.
            </p>

            <div className="ordre-list">
              {cursus.ordrePedagogique.map((c, i) => (
                <div key={c.id} className="ordre-item ordre-item--static">
                  <span className="ordre-item__body">
                    <span className="ordre-item__title">
                      {i + 1}. {c.titre}
                    </span>
                    <span className="ordre-item__prerequis">
                      {dateDebut ? "Dates calculées à la création" : "En attente de la date de début"}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="wizard-actions">
              <button type="button" className="wizard-back" onClick={() => setStep(1)}>
                ← Précédent
              </button>
              <Button className="referente-form-submit" onClick={() => setStep(3)}>
                Suivant →
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="form-card__title">Confirmation</h2>
            <p className="form-card__subtitle">Vérifiez les informations avant de créer la promotion.</p>

            <p className="referente-form-note" style={{ marginTop: 0 }}>
              Cursus : {cursus.nom}
              <br />
              Nom de la promotion : {nom || `${cursus.nom} 2026-C`}
              <br />
              Date de début : {dateDebut || "à définir"}
              <br />
              Effectif maximum : {effectifMax || 16}
              <br />
              Durée estimée : {cursus.dureeMois} mois
            </p>

            <div className="wizard-actions">
              <button type="button" className="wizard-back" onClick={() => setStep(2)}>
                ← Précédent
              </button>
              <Button className="referente-form-submit" onClick={handleCreate}>
                Créer la promotion
              </Button>
            </div>
          </>
        )}
      </FormCard>
    </ReferenteLayout>
  );
}
