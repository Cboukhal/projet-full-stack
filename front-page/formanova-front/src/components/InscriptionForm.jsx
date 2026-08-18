import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { searchEleves, searchCoursPlanifies, createInscription } from "../api/inscriptionsApi";
import { listPromotions } from "../api/promotionsApi";
import Button from "./Button";
import "./InscriptionForm.css";

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
    if (type === "promotion") {
      listPromotions(token).then(setCibleOptions).catch(() => setCibleOptions([]));
    } else {
      searchCoursPlanifies(token, "").then(setCibleOptions).catch(() => setCibleOptions([]));
    }
  }, [type, token]);

  // La cible sélectionnée change de sens selon le type : on la réinitialise au clic, pas en effet.
  const selectType = (nextType) => {
    setType(nextType);
    setCibleId("");
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
          <select id="cible" className="field__input" value={cibleId} onChange={(e) => setCibleId(e.target.value)}>
            <option value="">— Choisir —</option>
            {cibleOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {type === "promotion" ? c.titre : `${c.titre} (${c.promotionNom})`}
              </option>
            ))}
          </select>
        </div>

        <div className="inscription-form__note">
          <p className="inscription-form__note-title">Vérification de l'ordre des cours</p>
          <p className="inscription-form__note-text">Contrôle des prérequis. Forçage possible.</p>
        </div>

        {message && <p className="inscription-form__message">{message}</p>}

        <Button type="submit" disabled={isSubmitting}>
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
