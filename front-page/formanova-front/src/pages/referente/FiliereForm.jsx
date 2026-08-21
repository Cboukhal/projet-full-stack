/** Formulaire de création et de modification d'une filière. */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import {
  getFiliere,
  createFiliere,
  updateFiliere,
  deleteFiliere,
} from "../../api/filieresApi";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const hasDependencies = Boolean(
    existing && (existing.nbCursus > 0 || existing.nbEleves > 0),
  );

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

  const openDeleteModal = () => {
    if (!existing || hasDependencies || isSubmitting || isDeleting) {
      return;
    }

    setError("");
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
    setError("");
  };

  const handleDelete = async () => {
    if (!existing || hasDependencies || isSubmitting || isDeleting) {
      return;
    }

    setError("");
    setIsDeleting(true);
    try {
      await deleteFiliere(token, filiereId);
      navigate("/espace-referente/filieres", { replace: true });
    } catch (err) {
      // Le backend revérifie les dépendances pour couvrir une modification concurrente.
      setError(err.message || "Impossible de supprimer la filière.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ReferenteLayout>
      <p className="referente-breadcrumb">
        <Link to="/espace-referente/filieres" className="referente-breadcrumb__link">
          Filières
        </Link>{" "}
        /{isCreate ? "Créer" : existing ? ` ${existing.nom} / Modifier` : "Introuvable"}
      </p>

      {error && (
        <p className="referente-form-note referente-form-note--error" role="alert">
          {error}
        </p>
      )}

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

          <div className="referente-form-actions">
            <Button
              type="submit"
              className="referente-form-submit"
              disabled={isSubmitting || isDeleting}
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>

            {!isCreate && existing && (
              <Button
                type="button"
                variant="danger"
                className="referente-form-delete"
                onClick={openDeleteModal}
                disabled={hasDependencies || isSubmitting || isDeleting}
              >
                Supprimer la filière
              </Button>
            )}
          </div>

          {!isCreate && existing && hasDependencies && (
            <p className="referente-form-note">
              Suppression impossible : retirez d’abord tous les cursus et élèves rattachés à cette
              filière.
            </p>
          )}
        </FormCard>
      </form>

      <Modal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Supprimer cette filière ?"
        role="alertdialog"
        describedBy="delete-filiere-description"
        closeDisabled={isDeleting}
        className="delete-confirmation-modal"
      >
        <div className="delete-confirmation">
          <div className="delete-confirmation__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
            </svg>
          </div>

          <p id="delete-filiere-description" className="delete-confirmation__description">
            La filière <strong>« {existing?.nom} »</strong> sera supprimée définitivement.
          </p>

          <div className="delete-confirmation__warning">
            <strong>Cette action est irréversible.</strong>
            <span>Vous ne pourrez pas récupérer cette filière après sa suppression.</span>
          </div>

          {error && (
            <p className="delete-confirmation__error" role="alert">
              {error}
            </p>
          )}

          <div className="delete-confirmation__actions">
            <Button
              type="button"
              variant="text"
              className="delete-confirmation__cancel"
              onClick={closeDeleteModal}
              disabled={isDeleting}
              data-modal-initial-focus
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              className="delete-confirmation__submit"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </div>
        </div>
      </Modal>
    </ReferenteLayout>
  );
}
