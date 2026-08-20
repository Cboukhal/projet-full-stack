/** Formulaire de création et de modification d'un cours, avec gestion de ses sessions à l'unité. */
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
  getCours,
  getCoursBySlug,
  createCours,
  updateCours,
  deleteCours,
  addCursusToCours,
} from "../../api/coursApi";
import { listCursus } from "../../api/cursusApi";
import {
  createCoursOffreUnitaire,
  deleteOffreCours,
  listCoursOffresUnitaires,
} from "../../api/offresCoursApi";
import { listFormateurs } from "../../api/inscriptionsApi";
import { listSalles, formatSalleLabel } from "../../api/sallesApi";
import { getCoursPath } from "../../coursRoutes";
import "./ReferenteForms.css";

const EMPTY_UNIT_OFFER = {
  dateDebut: "",
  dateFin: "",
  salle: "",
  formateurId: "",
};

function formatSessionDate(value) {
  if (!value) return "Date à confirmer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function CoursForm() {
  const { coursNom = "" } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isCreate = coursNom === "nouveau";

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
  const [isDeleting, setIsDeleting] = useState(false);

  const [offresUnitaires, setOffresUnitaires] = useState([]);
  const [isOffresLoading, setIsOffresLoading] = useState(true);
  const [offresError, setOffresError] = useState("");
  const [isOffreModalOpen, setIsOffreModalOpen] = useState(false);
  const [offreDraft, setOffreDraft] = useState(EMPTY_UNIT_OFFER);
  const [offreFormError, setOffreFormError] = useState("");
  const [isCreatingOffre, setIsCreatingOffre] = useState(false);
  const [offreToDelete, setOffreToDelete] = useState(null);
  const [offreDeleteError, setOffreDeleteError] = useState("");
  const [isDeletingOffre, setIsDeletingOffre] = useState(false);
  const [formateurs, setFormateurs] = useState([]);
  const [salles, setSalles] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCursusId, setSelectedCursusId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const hasDependencies = cursusAssocies.length > 0 || offresUnitaires.length > 0;
  const existingId = existing?.id ?? null;
  const offreToDeleteNbInscrits = Number(offreToDelete?.nbInscrits || 0);

  const deleteDependencyMessage = offresUnitaires.length > 0
    ? "Suppression impossible : supprimez d’abord les sessions à l’unité et les éventuels cursus associés."
    : "Suppression impossible : retirez d’abord ce cours de tous les cursus associés.";

  useEffect(() => {
    if (isCreate) {
      return;
    }
    // Les anciennes URL numériques restent valides, puis sont remplacées par l'URL avec slug.
    const courseRequest = /^\d+$/.test(coursNom)
      ? getCours(token, coursNom)
      : getCoursBySlug(token, coursNom);
    let isCurrentRequest = true;

    courseRequest
      .then((data) => {
        if (!isCurrentRequest) return;

        setExisting(data);
        setNom(data.nom);
        setTechnologie(data.technologie);
        setDuree(data.duree);
        setDescription(data.description);
        setObjectifs(data.objectifs);
        setCursusAssocies(data.cursusAssocies);
        setError("");

        if (coursNom !== data.slug) {
          navigate(getCoursPath(data), { replace: true });
        }
      })
      .catch(() => {
        if (!isCurrentRequest) return;

        setExisting(null);
        setCursusAssocies([]);
        setError("Cours introuvable.");
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [coursNom, isCreate, navigate, token]);

  useEffect(() => {
    if (!existingId) return undefined;

    let isCurrentRequest = true;

    const loadOffres = async () => {
      // Le point d'attente évite une mise à jour d'état synchrone dans l'effet.
      await Promise.resolve();
      if (!isCurrentRequest) return;
      setIsOffresLoading(true);
      setOffresError("");

      try {
        const data = await listCoursOffresUnitaires(token, existingId);
        if (!isCurrentRequest) return;
        setOffresUnitaires(Array.isArray(data) ? data : data.items || data.offres || []);
      } catch (err) {
        if (!isCurrentRequest) return;
        setOffresError(err.message || "Impossible de charger les sessions à l'unité.");
      } finally {
        if (isCurrentRequest) setIsOffresLoading(false);
      }
    };

    loadOffres();

    return () => {
      isCurrentRequest = false;
    };
  }, [existingId, token]);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }
    listCursus(token).then(setCursusSource).catch(() => {});
  }, [modalOpen, token]);

  // Chargé à chaque ouverture de la modal seulement, pas à chaque frappe.
  useEffect(() => {
    if (!isOffreModalOpen) {
      return;
    }
    listFormateurs(token).then(setFormateurs).catch(() => setFormateurs([]));
    listSalles(token).then(setSalles).catch(() => setSalles([]));
  }, [isOffreModalOpen, token]);

  const cursusDisponibles = cursusSource.filter(
    (c) => !cursusAssocies.some((a) => a.cursusId === c.id)
  );

  const handleAssocier = async () => {
    if (!existing || !selectedCursusId) return;
    try {
      const updated = await addCursusToCours(token, existing.id, selectedCursusId);
      setCursusAssocies(updated.cursusAssocies);
      setSelectedCursusId(null);
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Impossible d'associer ce cursus.");
    }
  };

  const openOffreModal = () => {
    if (!existing) return;
    setOffreDraft({ ...EMPTY_UNIT_OFFER });
    setOffreFormError("");
    setIsOffreModalOpen(true);
  };

  const closeOffreModal = () => {
    if (isCreatingOffre) return;
    setIsOffreModalOpen(false);
    setOffreFormError("");
  };

  const handleCreateOffre = async (event) => {
    event.preventDefault();
    setOffreFormError("");

    if (!existing || !offreDraft.dateDebut || !offreDraft.dateFin) {
      setOffreFormError("Les dates de début et de fin sont obligatoires.");
      return;
    }

    const start = new Date(offreDraft.dateDebut);
    const end = new Date(offreDraft.dateFin);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setOffreFormError("La date de fin doit être postérieure à la date de début.");
      return;
    }

    setIsCreatingOffre(true);
    try {
      const response = await createCoursOffreUnitaire(token, existing.id, {
        dateDebut: offreDraft.dateDebut,
        dateFin: offreDraft.dateFin,
        salle: offreDraft.salle.trim(),
        formateurId: offreDraft.formateurId || null,
      });
      const created = response.offre || response;
      setOffresUnitaires((current) =>
        [...current, created].sort((a, b) =>
          String(a.dateDebut || "").localeCompare(String(b.dateDebut || "")),
        ),
      );
      setOffresError("");
      setIsOffreModalOpen(false);
      setOffreDraft({ ...EMPTY_UNIT_OFFER });
    } catch (err) {
      setOffreFormError(err.message || "Impossible de créer la session à l'unité.");
    } finally {
      setIsCreatingOffre(false);
    }
  };

  const openDeleteOffreModal = (offre) => {
    setOffreToDelete(offre);
    setOffreDeleteError("");
  };

  const closeDeleteOffreModal = () => {
    if (isDeletingOffre) return;
    setOffreToDelete(null);
    setOffreDeleteError("");
  };

  const handleDeleteOffre = async () => {
    if (!offreToDelete || isDeletingOffre) return;

    setOffreDeleteError("");
    setIsDeletingOffre(true);
    try {
      // Le backend revérifie les inscriptions au dernier moment et peut refuser la suppression.
      await deleteOffreCours(token, offreToDelete.id);
      setOffresUnitaires((current) =>
        current.filter((offre) => offre.id !== offreToDelete.id),
      );
      setOffreToDelete(null);
    } catch (err) {
      setOffreDeleteError(err.message || "Impossible de supprimer la session.");
    } finally {
      setIsDeletingOffre(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isCreate && !existing) {
      setError("Le cours doit être chargé avant d’être modifié.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { nom, technologie, duree, description, objectifs };
      if (isCreate) {
        const created = await createCours(token, payload);
        navigate(getCoursPath(created), { replace: true });
      } else {
        await updateCours(token, existing.id, payload);
        navigate("/espace-referente/cours");
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = () => {
    if (!existing || hasDependencies || isOffresLoading || isSubmitting || isDeleting) {
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
    if (!existing || hasDependencies || isOffresLoading || isSubmitting || isDeleting) {
      return;
    }

    setError("");
    setIsDeleting(true);
    try {
      await deleteCours(token, existing.id);
      navigate("/espace-referente/cours", { replace: true });
    } catch (err) {
      // Django revérifie l'association à un cursus au moment exact de la suppression.
      setError(err.message || "Impossible de supprimer le cours.");
    } finally {
      setIsDeleting(false);
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

      {error && (
        <p className="referente-form-note referente-form-note--error" role="alert">
          {error}
        </p>
      )}

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

            <div className="referente-form-actions">
              <Button
                type="submit"
                className="referente-form-submit"
                disabled={isSubmitting || isDeleting || (!isCreate && !existing)}
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>

              {!isCreate && existing && (
                <Button
                  type="button"
                  variant="danger"
                  className="referente-form-delete"
                  onClick={openDeleteModal}
                  disabled={hasDependencies || isOffresLoading || isSubmitting || isDeleting}
                >
                  Supprimer le cours
                </Button>
              )}
            </div>

            {!isCreate && existing && hasDependencies && (
              <p className="referente-form-note">
                {deleteDependencyMessage}
              </p>
            )}
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

      {existing && (
        <FormCard
          title="Cours à l’unité"
          subtitle="Planifiez ce cours indépendamment d’une promotion."
          className="unit-offers-card"
        >
          {isOffresLoading && (
            <div className="unit-offers-state" role="status">
              <span className="unit-offers-state__spinner" aria-hidden="true" />
              Chargement des sessions…
            </div>
          )}

          {!isOffresLoading && offresError && (
            <p className="unit-offers-state unit-offers-state--error" role="alert">
              {offresError}
            </p>
          )}

          {!isOffresLoading && !offresError && offresUnitaires.length === 0 && (
            <div className="unit-offers-empty">
              <span className="unit-offers-empty__icon" aria-hidden="true">＋</span>
              <div>
                <strong>Aucun cours à l'unité de planifié</strong>
                <p>Vous pouvez planifier un cours à l’unité pour permettre une inscription directe.</p>
              </div>
            </div>
          )}

          {!isOffresLoading && offresUnitaires.length > 0 && (
            <div className="unit-offers-list">
              {offresUnitaires.map((offre) => (
                <article key={offre.id} className="unit-offer-item">
                  <div className="unit-offer-item__calendar" aria-hidden="true">
                    <span>{new Date(offre.dateDebut).toLocaleDateString("fr-FR", { day: "2-digit" })}</span>
                    <small>{new Date(offre.dateDebut).toLocaleDateString("fr-FR", { month: "short" })}</small>
                  </div>
                  <div className="unit-offer-item__body">
                    <strong>
                      {formatSessionDate(offre.dateDebut)} → {formatSessionDate(offre.dateFin)}
                    </strong>
                    <span>
                      {offre.salle || "Salle à confirmer"}
                      {(offre.formateurNom || offre.formateur?.nom) &&
                        ` · ${offre.formateurNom || offre.formateur.nom}`}
                    </span>
                  </div>
                  <div className="unit-offer-item__actions">
                    <span className="unit-offer-item__status">
                      {offre.statut || "Planifiée"}
                    </span>
                    <button
                      type="button"
                      className="unit-offer-item__delete"
                      onClick={() => openDeleteOffreModal(offre)}
                      disabled={isDeletingOffre}
                      aria-label={`Supprimer la session du ${formatSessionDate(offre.dateDebut)}`}
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <button type="button" className="referente-add-row" onClick={openOffreModal}>
            + Planifier un cours à l’unité
          </button>
        </FormCard>
      )}

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

      <Modal
        open={isOffreModalOpen}
        onClose={closeOffreModal}
        title="Nouveau cours à l’unité"
        describedBy="unit-offer-description"
        closeDisabled={isCreatingOffre}
        className="unit-offer-modal"
      >
        <form className="unit-offer-form" onSubmit={handleCreateOffre} noValidate>
          <p id="unit-offer-description" className="unit-offer-form__intro">
            Ce cours sera disponible pour une inscription directe, sans promotion.
          </p>

          <div className="unit-offer-form__dates">
            <div className="field">
              <label className="field__label" htmlFor="unit-offer-start">
                Début <span aria-hidden="true">*</span>
              </label>
              <input
                id="unit-offer-start"
                className="field__input"
                type="datetime-local"
                value={offreDraft.dateDebut}
                onChange={(event) =>
                  setOffreDraft((current) => ({ ...current, dateDebut: event.target.value }))
                }
                required
                disabled={isCreatingOffre}
                data-modal-initial-focus
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="unit-offer-end">
                Fin <span aria-hidden="true">*</span>
              </label>
              <input
                id="unit-offer-end"
                className="field__input"
                type="datetime-local"
                value={offreDraft.dateFin}
                min={offreDraft.dateDebut || undefined}
                onChange={(event) =>
                  setOffreDraft((current) => ({ ...current, dateFin: event.target.value }))
                }
                required
                disabled={isCreatingOffre}
              />
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="unit-offer-formateur">
              Formateur
            </label>
            <select
              id="unit-offer-formateur"
              className="field__input"
              value={offreDraft.formateurId}
              onChange={(event) =>
                setOffreDraft((current) => ({ ...current, formateurId: event.target.value }))
              }
              disabled={isCreatingOffre}
            >
              <option value="">— À définir —</option>
              {formateurs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="unit-offer-room">
              Salle
            </label>
            <select
              id="unit-offer-room"
              className="field__input"
              value={offreDraft.salle}
              onChange={(event) =>
                setOffreDraft((current) => ({ ...current, salle: event.target.value }))
              }
              disabled={isCreatingOffre}
            >
              <option value="">— À définir —</option>
              {salles.map((s) => (
                <option key={s.id} value={formatSalleLabel(s)}>
                  {formatSalleLabel(s)}
                </option>
              ))}
            </select>
          </div>

          {offreFormError && (
            <p className="unit-offer-form__error" role="alert">
              {offreFormError}
            </p>
          )}

          <div className="unit-offer-form__actions">
            <Button
              type="button"
              variant="text"
              className="unit-offer-form__cancel"
              onClick={closeOffreModal}
              disabled={isCreatingOffre}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="unit-offer-form__submit"
              disabled={isCreatingOffre}
            >
              {isCreatingOffre ? "Création…" : "Créer la session"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(offreToDelete)}
        onClose={closeDeleteOffreModal}
        title="Supprimer cette session ?"
        role="alertdialog"
        describedBy="delete-unit-offer-description"
        closeDisabled={isDeletingOffre}
        className="delete-confirmation-modal"
      >
        <div className="delete-confirmation">
          <div className="delete-confirmation__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
            </svg>
          </div>

          <p id="delete-unit-offer-description" className="delete-confirmation__description">
            La session du <strong>{formatSessionDate(offreToDelete?.dateDebut)}</strong> sera
            supprimée définitivement.
          </p>

          <div className="delete-confirmation__warning">
            <strong>Cette action est irréversible.</strong>
            <span>La session disparaîtra des choix d’inscription.</span>
          </div>

          {(offreDeleteError || offreToDeleteNbInscrits > 0) && (
            <p className="delete-confirmation__error" role="alert">
              {offreDeleteError ||
                `Suppression impossible : ${offreToDeleteNbInscrits} inscription${
                  offreToDeleteNbInscrits > 1 ? "s" : ""
                } existe${offreToDeleteNbInscrits > 1 ? "nt" : ""} pour cette session.`}
            </p>
          )}

          <div className="delete-confirmation__actions">
            <Button
              type="button"
              variant="text"
              className="delete-confirmation__cancel"
              onClick={closeDeleteOffreModal}
              disabled={isDeletingOffre}
              data-modal-initial-focus
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              className="delete-confirmation__submit"
              onClick={handleDeleteOffre}
              disabled={isDeletingOffre || offreToDeleteNbInscrits > 0}
            >
              {isDeletingOffre ? "Suppression…" : "Supprimer la session"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Supprimer ce cours ?"
        role="alertdialog"
        describedBy="delete-cours-description"
        closeDisabled={isDeleting}
        className="delete-confirmation-modal"
      >
        <div className="delete-confirmation">
          <div className="delete-confirmation__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
            </svg>
          </div>

          <p id="delete-cours-description" className="delete-confirmation__description">
            Le cours <strong>« {existing?.nom} »</strong> sera supprimé définitivement.
          </p>

          <div className="delete-confirmation__warning">
            <strong>Cette action est irréversible.</strong>
            <span>Vous ne pourrez pas récupérer ce cours après sa suppression.</span>
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
