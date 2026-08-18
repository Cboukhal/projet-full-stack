import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import { getFiliere, createFiliere, updateFiliere } from "../../api/filieresApi";
import "./ReferenteForms.css";

export default function FiliereForm() {
  const { filiereId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isCreate = filiereId === "nouveau";

  const [existing, setExisting] = useState(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [statut, setStatut] = useState("Actif");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isCreate) {
      return;
    }
    getFiliere(token, filiereId)
      .then((data) => {
        setExisting(data);
        setNom(data.nom);
        setDescription(data.description);
        setStatut(data.statut);
      })
      .catch(() => setError("Filière introuvable."));
  }, [isCreate, filiereId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (isCreate) {
        await createFiliere(token, { nom, description, statut });
      } else {
        await updateFiliere(token, filiereId, { nom, description, statut });
      }
      navigate("/espace-referente/filieres");
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ReferenteLayout>
      <p className="referente-breadcrumb">
        <Link to="/espace-referente/filieres" className="referente-breadcrumb__link">
          Filières
        </Link>{" "}
        /{isCreate ? "Créer" : existing ? `${existing.nom} / Modifier` : "Introuvable"}
      </p>

      {error && <p className="referente-form-note">{error}</p>}

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

          <Button type="submit" className="referente-form-submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </FormCard>
      </form>
    </ReferenteLayout>
  );
}
