import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import { FILIERES } from "../../api/filieresMock";
import "./ReferenteForms.css";

export default function FiliereForm() {
  const { filiereId } = useParams();
  const isCreate = filiereId === "nouveau";
  const existing = !isCreate ? FILIERES.find((f) => f.id === filiereId) : null;

  const [nom, setNom] = useState(existing?.nom ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [statut, setStatut] = useState(existing?.statut ?? "");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: brancher l'appel API une fois le back prêt
    console.log("Enregistrer filière :", { nom, description, statut });
  };

  return (
    <ReferenteLayout>
      <p className="referente-breadcrumb">
        <Link to="/espace-referente/filieres" className="referente-breadcrumb__link">
          Filières
        </Link>{" "}
        /{isCreate ? "Créer" : existing ? `${existing.nom} / Modifier` : "Introuvable"}
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <FormCard title="Informations générales">
          <TextField
            name="nom"
            placeholder="Nom de la filière — Développement"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
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

          <TextField
            name="statut"
            placeholder="Statut — Actif"
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
          />

          {existing && existing.cursusRattaches.length > 0 && (
            <>
              <h3 className="referente-form-subheading">Cursus rattachés</h3>
              <div className="tag-list">
                {existing.cursusRattaches.map((c) => (
                  <span key={c} className="tag">
                    {c}
                  </span>
                ))}
              </div>
              <p className="referente-form-note">
                {existing.cursusRattaches.length} cursus utilisent cette filière · non modifiable
                ici
              </p>
            </>
          )}

          <Button type="submit" className="referente-form-submit">
            Enregistrer
          </Button>
        </FormCard>
      </form>
    </ReferenteLayout>
  );
}
