import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import { COURS } from "../../api/coursMock";
import "./ReferenteForms.css";

export default function CoursForm() {
  const { coursId } = useParams();
  const isCreate = coursId === "nouveau";
  const existing = !isCreate ? COURS.find((c) => c.id === coursId) : null;

  const [nom, setNom] = useState(existing?.nom ?? "");
  const [technologie, setTechnologie] = useState(existing?.technologie ?? "");
  const [duree, setDuree] = useState(existing?.duree ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [objectifs, setObjectifs] = useState(existing?.objectifs ?? "");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: brancher l'appel API une fois le back prêt
    console.log("Enregistrer cours :", { nom, technologie, duree, description, objectifs });
  };

  return (
    <ReferenteLayout>
      <p className="referente-breadcrumb">
        <Link to="/espace-referente/cours" className="referente-breadcrumb__link">
          Cours
        </Link>{" "}
        / {isCreate ? "Créer" : existing ? `${existing.nom} / Modifier` : "Introuvable"}
      </p>

      <div className="referente-detail-grid">
        <form onSubmit={handleSubmit} noValidate className="referente-detail-grid__col">
          <FormCard title="Informations générales">
            <TextField
              name="nom"
              placeholder="Nom du cours — Langage SQL"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />

            <div className="form-field-row">
              <TextField
                name="technologie"
                placeholder="Technologie — SQL Server"
                value={technologie}
                onChange={(e) => setTechnologie(e.target.value)}
              />
              <TextField
                name="duree"
                placeholder="Durée — 1 semaine"
                value={duree}
                onChange={(e) => setDuree(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="objectifs">
                Objectifs pédagogiques
              </label>
              <textarea
                id="objectifs"
                className="form-textarea"
                value={objectifs}
                onChange={(e) => setObjectifs(e.target.value)}
              />
            </div>

            <Button type="submit" className="referente-form-submit">
              Enregistrer
            </Button>
          </FormCard>
        </form>

        <FormCard
          title="Cursus associés"
          subtitle="Ce cours peut appartenir à plusieurs cursus."
          className="referente-detail-grid__col"
        >
          <div className="ordre-list">
            {(existing?.cursusAssocies ?? []).map((c) => (
              <div key={c.cursus} className="ordre-item ordre-item--static">
                <span className="ordre-item__body">
                  <span className="ordre-item__title">{c.cursus}</span>
                  <span className="ordre-item__prerequis">position {c.position}</span>
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="referente-add-row"
            onClick={() => console.log("TODO: associer ce cours à un cursus")}
          >
            + Associer à un cursus
          </button>
        </FormCard>
      </div>
    </ReferenteLayout>
  );
}
