/** Formulaire de création et de modification d'un cursus, avec gestion de son ordre pédagogique. */
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import SelectableList from "../../components/SelectableList";
import {
  getCursus,
  createCursus,
  updateCursus,
  addCoursToCursus,
  removeCoursFromCursus,
  reorderCoursInCursus,
} from "../../api/cursusApi";
import { listFilieres } from "../../api/filieresApi";
import { listCours } from "../../api/coursApi";
import "./ReferenteForms.css";

// Le prérequis affiché ("cours précédent") se déduit simplement de la position dans la liste ;
// le backend applique la même règle côté inscriptions (voir _prerequis_satisfaits).
function withPrerequis(list) {
  return list.map((item, i) => ({
    ...item,
    prerequis: i === 0 ? "Aucun prérequis" : "Prérequis : cours précédent",
  }));
}

export default function CursusForm() {
  const { cursusId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isCreate = cursusId === "nouveau";

  const [existing, setExisting] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [coursDisponiblesSource, setCoursDisponiblesSource] = useState([]);

  const [nom, setNom] = useState("");
  const [filiereId, setFiliereId] = useState("");
  const [description, setDescription] = useState("");
  const [dureeMois, setDureeMois] = useState("");
  const [ordre, setOrdre] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCoursId, setSelectedCoursId] = useState(null);

  useEffect(() => {
    listFilieres(token).then(setFilieres).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (isCreate) {
      return;
    }
    getCursus(token, cursusId)
      .then((data) => {
        setExisting(data);
        setNom(data.nom);
        setFiliereId(data.filiereId);
        setDescription(data.description);
        setDureeMois(data.dureeMois);
        setOrdre(withPrerequis(data.ordrePedagogique));
      })
      .catch(() => setError("Cursus introuvable."));
  }, [isCreate, cursusId, token]);

  // Recharge le cursus depuis le backend après une action sur l'ordre pédagogique (ajout,
  // retrait, réordonnancement) : plus simple et plus sûr que de recalculer l'état localement.
  const refreshCursus = () =>
    getCursus(token, cursusId).then((data) => {
      setExisting(data);
      setOrdre(withPrerequis(data.ordrePedagogique));
    });

  useEffect(() => {
    if (!modalOpen) {
      return;
    }
    listCours(token).then(setCoursDisponiblesSource).catch(() => {});
  }, [modalOpen, token]);

  const coursDisponibles = coursDisponiblesSource.filter(
    (c) => !ordre.some((o) => o.coursId === c.id)
  );

  const handleDrop = async (index) => {
    if (dragIndex === null || dragIndex === index) return;
    const moved = ordre[dragIndex];
    setDragIndex(null);
    try {
      // Positions 1-indexées côté API ; le backend renumérote tout le reste de l'ordre.
      await reorderCoursInCursus(token, cursusId, moved.id, index + 1);
      await refreshCursus();
    } catch (err) {
      setError(err.message || "Impossible de réordonner ce cours.");
    }
  };

  const handleAjouter = async () => {
    if (!selectedCoursId) return;
    try {
      await addCoursToCursus(token, cursusId, selectedCoursId);
      await refreshCursus();
      setSelectedCoursId(null);
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Impossible d'ajouter ce cours.");
    }
  };

  const handleRetirer = async (linkId) => {
    try {
      await removeCoursFromCursus(token, cursusId, linkId);
      await refreshCursus();
    } catch (err) {
      setError(err.message || "Impossible de retirer ce cours.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!filiereId) {
      setError("La filière est requise.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { nom, filiereId, description, dureeMois: Number(dureeMois) || 0 };
      if (isCreate) {
        const created = await createCursus(token, payload);
        navigate(`/espace-referente/cursus/${created.id}`);
      } else {
        await updateCursus(token, cursusId, payload);
        navigate("/espace-referente/cursus");
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
        <Link to="/espace-referente/cursus" className="referente-breadcrumb__link">
          Cursus
        </Link>{" "}
        / {isCreate ? "Créer" : existing ? `${existing.nom} / Modifier` : "Introuvable"}
      </p>

      {error && <p className="referente-form-note">{error}</p>}

      <div className="referente-detail-grid">
        <form onSubmit={handleSubmit} noValidate className="referente-detail-grid__col">
          <FormCard title="Informations générales">
            <TextField
              name="nom"
              placeholder="Nom du cursus — CDA"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />

            <div className="form-field">
              <label className="form-field__label" htmlFor="filiere">
                Filière
              </label>
              <select
                id="filiere"
                className="form-textarea"
                value={filiereId}
                onChange={(e) => setFiliereId(e.target.value)}
              >
                <option value="">— Choisir une filière —</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>

            <TextField
              name="dureeMois"
              type="number"
              placeholder="Durée (en mois)"
              value={dureeMois}
              onChange={(e) => setDureeMois(e.target.value)}
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

            <Button type="submit" className="referente-form-submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
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
                <button
                  type="button"
                  className="ordre-item__remove"
                  aria-label={`Retirer ${item.titre}`}
                  onClick={() => handleRetirer(item.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {existing ? (
            <button type="button" className="referente-add-row" onClick={() => setModalOpen(true)}>
              + Ajouter un cours
            </button>
          ) : (
            <p className="referente-form-note">Enregistrez d'abord le cursus pour lui ajouter des cours.</p>
          )}
        </FormCard>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ajouter un cours au cursus">
        <SelectableList
          items={coursDisponibles.map((c) => ({
            id: c.id,
            label: c.nom,
            sublabel: c.technologie,
          }))}
          selectedId={selectedCoursId}
          onSelect={setSelectedCoursId}
        />

        <Button onClick={handleAjouter} disabled={!selectedCoursId}>
          Ajouter
        </Button>
      </Modal>
    </ReferenteLayout>
  );
}
