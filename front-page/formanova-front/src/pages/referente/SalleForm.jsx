/** Formulaire de création et de modification d'une salle du référentiel. */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import FormCard from "../../components/FormCard";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import {
  getSalle,
  createSalle,
  updateSalle,
  deleteSalle,
} from "../../api/sallesApi";
import "./ReferenteForms.css";

export default function SalleForm() {
  const { salleId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isCreate = salleId === "nouveau";

  const [existing, setExisting] = useState(null);
  const [numeroBatiment, setNumeroBatiment] = useState("");
  const [numeroEtage, setNumeroEtage] = useState("");
  const [numeroSalle, setNumeroSalle] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (isCreate) {
      return;
    }
    getSalle(token, salleId)
      .then((data) => {
        setExisting(data);
        setNumeroBatiment(data.numeroBatiment);
        setNumeroEtage(String(data.numeroEtage));
        setNumeroSalle(String(data.numeroSalle));
      })
      .catch(() => setError("Salle introuvable."));
  }, [isCreate, salleId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const payload = {
        numeroBatiment,
        numeroEtage: Number(numeroEtage),
        numeroSalle: Number(numeroSalle),
      };
      if (isCreate) {
        await createSalle(token, payload);
      } else {
        await updateSalle(token, salleId, payload);
      }
      navigate("/espace-referente/salles");
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = () => {
    if (!existing || isSubmitting || isDeleting) {
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
    if (!existing || isDeleting) {
      return;
    }
    setError("");
    setIsDeleting(true);
    try {
      await deleteSalle(token, salleId);
      navigate("/espace-referente/salles", { replace: true });
    } catch (err) {
      setError(err.message || "Impossible de supprimer la salle.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ReferenteLayout>
      <p className="referente-breadcrumb">
        <Link to="/espace-referente/salles" className="referente-breadcrumb__link">
          Salles
        </Link>{" "}
        /{isCreate ? "Créer" : existing ? ` Bâtiment ${existing.numeroBatiment} · Étage ${existing.numeroEtage} · Salle ${existing.numeroSalle} / Modifier` : "Introuvable"}
      </p>

      {error && (
        <p className="referente-form-note referente-form-note--error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormCard title="Localisation de la salle">
          <div className="form-field-row">
            <TextField
              label="Numéro de bâtiment"
              name="numeroBatiment"
              type="text"
              maxLength={10}
              placeholder="Ex. A"
              value={numeroBatiment}
              onChange={(e) => setNumeroBatiment(e.target.value.toUpperCase())}
              required
            />
            <TextField
              label="Numéro d'étage"
              name="numeroEtage"
              type="number"
              min="0"
              placeholder="Ex. 2"
              value={numeroEtage}
              onChange={(e) => setNumeroEtage(e.target.value)}
              required
            />
            <TextField
              label="Numéro de salle"
              name="numeroSalle"
              type="number"
              min="0"
              placeholder="Ex. 12"
              value={numeroSalle}
              onChange={(e) => setNumeroSalle(e.target.value)}
              required
            />
          </div>

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
                disabled={isSubmitting || isDeleting}
              >
                Supprimer la salle
              </Button>
            )}
          </div>
        </FormCard>
      </form>

      <Modal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Supprimer cette salle ?"
        role="alertdialog"
        describedBy="delete-salle-description"
        closeDisabled={isDeleting}
        className="delete-confirmation-modal"
      >
        <div className="delete-confirmation">
          <div className="delete-confirmation__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
            </svg>
          </div>

          <p id="delete-salle-description" className="delete-confirmation__description">
            La salle <strong>« Bâtiment {existing?.numeroBatiment} · Étage {existing?.numeroEtage} · Salle {existing?.numeroSalle} »</strong> sera supprimée définitivement.
          </p>

          <div className="delete-confirmation__warning">
            <strong>Cette action est irréversible.</strong>
            <span>Vous ne pourrez pas récupérer cette salle après sa suppression.</span>
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
