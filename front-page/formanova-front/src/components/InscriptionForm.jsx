import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { searchEleves, createInscription } from "../api/inscriptionsApi";
import { listOffresCoursUnitaires } from "../api/offresCoursApi";
import { listPromotions } from "../api/promotionsApi";
import Button from "./Button";
import "./InscriptionForm.css";

function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getOffreLabel(offre) {
  const titre = offre.titre || offre.coursNom || offre.cours?.nom || "Cours";
  const debut = formatDateTime(offre.dateDebut);
  const fin = formatDateTime(offre.dateFin);
  const periode = [debut, fin].filter(Boolean).join(" → ");
  return [titre, periode, offre.salle].filter(Boolean).join(" · ");
}

/**
 * Formulaire d'inscription d'un élève à une promotion ou à un cours à l'unité.
 * onDone: appelé après une inscription réussie (pour rafraîchir une liste parente, si besoin).
 */
export default function InscriptionForm({ title = "Inscription", onDone }) {
  const { token } = useAuth();
  const [type, setType] = useState("promotion");
  const [eleveQuery, setEleveQuery] = useState("");
  const [eleveResults, setEleveResults] = useState([]);
  const [eleveId, setEleveId] = useState("");
  const [cibleOptions, setCibleOptions] = useState([]);
  const [cibleId, setCibleId] = useState("");
  const [message, setMessage] = useState("");
  const [needsForce, setNeedsForce] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCiblesLoading, setIsCiblesLoading] = useState(false);
  const [cibleError, setCibleError] = useState("");

  // En dessous de 2 caractères, on n'interroge pas le backend : la liste dérivée reste vide.
  const visibleEleveResults = eleveQuery.trim().length < 2 ? [] : eleveResults;

  useEffect(() => {
    if (eleveQuery.trim().length < 2) {
      return;
    }
    const timeout = setTimeout(() => {
      searchEleves(token, eleveQuery).then(setEleveResults).catch(() => setEleveResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [eleveQuery, token]);

  useEffect(() => {
    let isCurrentRequest = true;

    const loadCibles = async () => {
      await Promise.resolve();
      if (!isCurrentRequest) return;
      setIsCiblesLoading(true);
      setCibleError("");

      try {
        const data = type === "promotion"
          ? await listPromotions(token)
          : await listOffresCoursUnitaires(token, "", { upcoming: true });
        if (!isCurrentRequest) return;
        setCibleOptions(Array.isArray(data) ? data : data.items || data.offres || []);
      } catch (err) {
        if (!isCurrentRequest) return;
        setCibleOptions([]);
        setCibleError(err.message || "Impossible de charger les choix disponibles.");
      } finally {
        if (isCurrentRequest) setIsCiblesLoading(false);
      }
    };

    loadCibles();

    return () => {
      isCurrentRequest = false;
    };
  }, [type, token]);

  // La cible sélectionnée change de sens selon le type : on la réinitialise au clic, pas en effet.
  const selectType = (nextType) => {
    setType(nextType);
    setCibleId("");
    setIsCiblesLoading(true);
    setMessage("");
    setNeedsForce(false);
  };

  const submit = async (force = false) => {
    setMessage("");
    setIsSubmitting(true);
    try {
      await createInscription(token, { eleveId, type, cibleId, force });
      setMessage("Inscription enregistrée.");
      setNeedsForce(false);
      setEleveQuery("");
      setEleveId("");
      setCibleId("");
      onDone?.();
    } catch (err) {
      if (err.message?.includes("Prérequis")) {
        setNeedsForce(true);
        setMessage(err.message);
      } else {
        setNeedsForce(false);
        setMessage(err.message || "Une erreur est survenue.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!eleveId || !cibleId) {
      setMessage("Choisissez un élève et une cible.");
      return;
    }
    submit(false);
  };

  return (
    <aside className="inscription-form">
      <h2 className="inscription-form__title">{title}</h2>
      <p className="inscription-form__subtitle">À une promotion ou à un cours à l'unité.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="inscription-form__type">
          <label>
            <input
              type="radio"
              name="type"
              checked={type === "promotion"}
              onChange={() => selectType("promotion")}
            />
            Promotion
          </label>
          <label>
            <input
              type="radio"
              name="type"
              checked={type === "cours"}
              onChange={() => selectType("cours")}
            />
            Cours à l'unité
          </label>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="eleve-search">
            Élève
          </label>
          <input
            id="eleve-search"
            className="field__input"
            placeholder="Rechercher un élève"
            value={eleveId ? visibleEleveResults.find((e) => e.id === eleveId)?.nom ?? eleveQuery : eleveQuery}
            onChange={(e) => {
              setEleveQuery(e.target.value);
              setEleveId("");
            }}
          />
          {!eleveId && visibleEleveResults.length > 0 && (
            <ul className="inscription-form__suggestions">
              {visibleEleveResults.map((e) => (
                <li key={e.id}>
                  <button type="button" onClick={() => { setEleveId(e.id); setEleveQuery(e.nom); setEleveResults([]); }}>
                    {e.nom}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="cible">
            {type === "promotion" ? "Promotion" : "Cours"}
          </label>
          <select
            id="cible"
            className="field__input"
            value={cibleId}
            disabled={isCiblesLoading}
            onChange={(e) => {
              setCibleId(e.target.value);
              setMessage("");
              setNeedsForce(false);
            }}
          >
            <option value="">
              {isCiblesLoading ? "Chargement…" : "— Choisir —"}
            </option>
            {cibleOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {type === "promotion" ? c.titre : getOffreLabel(c)}
              </option>
            ))}
          </select>
          {!isCiblesLoading && cibleError && (
            <p className="inscription-form__field-message" role="alert">
              {cibleError}
            </p>
          )}
          {!isCiblesLoading && !cibleError && type === "cours" && cibleOptions.length === 0 && (
            <p className="inscription-form__field-message">
              Aucune session à l’unité n’est disponible.
            </p>
          )}
        </div>

        <div className="inscription-form__note">
          <p className="inscription-form__note-title">Vérification de l'ordre des cours</p>
          <p className="inscription-form__note-text">Contrôle des prérequis. Forçage possible.</p>
        </div>

        {message && <p className="inscription-form__message">{message}</p>}

        <Button type="submit" disabled={isSubmitting || isCiblesLoading || Boolean(cibleError)}>
          Valider l'inscription
        </Button>

        {needsForce && (
          <Button type="button" variant="text" onClick={() => submit(true)} disabled={isSubmitting}>
            Forcer malgré le prérequis manquant
          </Button>
        )}
      </form>
    </aside>
  );
}
