import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import SelectableList from "../../components/SelectableList";
import { getCours, createCours, updateCours, addCursusToCours } from "../../api/coursApi";
import { listCursus } from "../../api/cursusApi";
import "./ReferenteForms.css";

export default function CoursForm() {
  const { coursId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isCreate = coursId === "nouveau";

  const [existing, setExisting] = useState(null);
  const [cursusSource, setCursusSource] = useState([]);

  const [nom, setNom] = useState("");
  const [technologie, setTechnologie] = useState("");
  const [duree, setDuree] = useState("");
  const [description, setDescription] = useState("");
  const [objectifs, setObjectifs] = useState("");
  const [cursusAssocies, setCursusAssocies] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCursusId, setSelectedCursusId] = useState(null);

  useEffect(() => {
    if (isCreate) {
      return;
    }
    getCours(token, coursId)
      .then((data) => {
        setExisting(data);
        setNom(data.nom);
        setTechnologie(data.technologie);
        setDuree(data.duree);
        setDescription(data.description);
        setObjectifs(data.objectifs);
        setCursusAssocies(data.cursusAssocies);
      })
      .catch(() => setError("Cours introuvable."));
  }, [isCreate, coursId, token]);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }
    listCursus(token).then(setCursusSource).catch(() => {});
  }, [modalOpen, token]);

  const cursusDisponibles = cursusSource.filter(
    (c) => !cursusAssocies.some((a) => a.cursusId === c.id)
  );

  const handleAssocier = async () => {
    if (!selectedCursusId) return;
    try {
      const updated = await addCursusToCours(token, coursId, selectedCursusId);
      setCursusAssocies(updated.cursusAssocies);
      setSelectedCursusId(null);
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Impossible d'associer ce cursus.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const payload = { nom, technologie, duree, description, objectifs };
      if (isCreate) {
        const created = await createCours(token, payload);
        navigate(`/espace-referente/cours/${created.id}`);
      } else {
        await updateCours(token, coursId, payload);
        navigate("/espace-referente/cours");
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ReferenteLayout>
      <p className="referente-breadcrumb">
        <Link to="/espace-referente/cours" className="referente-breadcrumb__link">
          Cours
        </Link>{" "}
        / {isCreate ? "Créer" : existing ? `${existing.nom} / Modifier` : "Introuvable"}
      </p>

      {error && <p className="referente-form-note">{error}</p>}

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

            <Button type="submit" className="referente-form-submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </FormCard>
        </form>

        <FormCard
          title="Cursus associés"
          subtitle="Ce cours peut appartenir à plusieurs cursus."
          className="referente-detail-grid__col"
        >
          <div className="ordre-list">
            {cursusAssocies.map((c) => (
              <div key={c.cursusCoursId} className="ordre-item ordre-item--static">
                <span className="ordre-item__body">
                  <span className="ordre-item__title">{c.cursus}</span>
                  <span className="ordre-item__prerequis">position {c.position}</span>
                </span>
              </div>
            ))}
          </div>

          {existing ? (
            <button type="button" className="referente-add-row" onClick={() => setModalOpen(true)}>
              + Associer à un cursus
            </button>
          ) : (
            <p className="referente-form-note">Enregistrez d'abord le cours pour l'associer à un cursus.</p>
          )}
        </FormCard>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Associer ce cours à un cursus"
      >
        <SelectableList
          items={cursusDisponibles.map((c) => ({
            id: c.id,
            label: c.nom,
            sublabel: c.filiere,
          }))}
          selectedId={selectedCursusId}
          onSelect={setSelectedCursusId}
        />

        <Button onClick={handleAssocier} disabled={!selectedCursusId}>
          Associer
        </Button>
      </Modal>
    </ReferenteLayout>
  );
}
