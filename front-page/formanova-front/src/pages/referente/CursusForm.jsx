import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import { CURSUS } from "../../api/cursusMock";
import "./ReferenteForms.css";

function withPrerequis(list) {
  return list.map((item, i) => ({
    ...item,
    prerequis: i === 0 ? "Aucun prérequis" : "Prérequis : cours précédent",
  }));
}

export default function CursusForm() {
  const { cursusId } = useParams();
  const navigate = useNavigate();
  const isCreate = cursusId === "nouveau";
  const existing = !isCreate ? CURSUS.find((c) => c.id === cursusId) : null;

  const [nom, setNom] = useState(existing?.nom ?? "");
  const [filiere, setFiliere] = useState(existing?.filiere ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [ordre, setOrdre] = useState(() => withPrerequis(existing?.ordrePedagogique ?? []));
  const [dragIndex, setDragIndex] = useState(null);

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    setOrdre((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return withPrerequis(next);
    });
    setDragIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: brancher l'appel API une fois le back prêt
    console.log("Enregistrer cursus :", { nom, filiere, description, ordre });
  };

  return (
    <ReferenteLayout>
      <p className="referente-breadcrumb">
        <Link to="/espace-referente/cursus" className="referente-breadcrumb__link">
          Cursus
        </Link>{" "}
        / {isCreate ? "Créer" : existing ? `${existing.nom} / Modifier` : "Introuvable"}
      </p>

      <div className="referente-detail-grid">
        <form onSubmit={handleSubmit} noValidate className="referente-detail-grid__col">
          <FormCard title="Informations générales">
            <TextField
              name="nom"
              placeholder="Nom du cursus — CDA"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
            <TextField
              name="filiere"
              placeholder="Filière — Développement"
              value={filiere}
              onChange={(e) => setFiliere(e.target.value)}
            />
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

            {existing && (
              <p className="referente-form-note">
                Durée totale estimée : {existing.dureeMois} mois
                <br />
                {existing.nbCours} cours · dernière modif. {existing.dernModif}
              </p>
            )}

            <Button type="submit" className="referente-form-submit">
              Enregistrer
            </Button>
          </FormCard>

          {existing && (
            <button
              type="button"
              className="referente-add-row"
              style={{ marginTop: 16 }}
              onClick={() => navigate(`/espace-referente/cursus/${existing.id}/planifier-promotion`)}
            >
              Planifier une promotion à partir de ce cursus →
            </button>
          )}
        </form>

        <FormCard
          title="Ordre pédagogique des cours"
          subtitle="Glissez-déposez pour réorganiser. L'ordre définit les prérequis."
          className="referente-detail-grid__col"
        >
          <div className="ordre-list">
            {ordre.map((item, index) => (
              <div
                key={item.id}
                className="ordre-item"
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
              >
                <span className="ordre-item__handle" aria-hidden="true">
                  ☰
                </span>
                <span className="ordre-item__body">
                  <span className="ordre-item__title">
                    {index + 1}. {item.titre}
                  </span>
                  <span className="ordre-item__prerequis">{item.prerequis}</span>
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="referente-add-row"
            onClick={() => console.log("TODO: ajouter un cours au cursus")}
          >
            + Ajouter un cours
          </button>
        </FormCard>
      </div>
    </ReferenteLayout>
  );
}
