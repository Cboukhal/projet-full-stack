/** Client CRUD des salles (bâtiment, étage, numéro de salle). */
import { apiFetch } from "./client.js";

/** Liste toutes les salles. */
export function listSalles(token) {
  return apiFetch("/api/salles", { token, fallbackMessage: "Impossible de charger les salles." });
}

/** Charge le détail d'une salle. */
export function getSalle(token, id) {
  return apiFetch(`/api/salles/${id}`, { token, fallbackMessage: "Salle introuvable." });
}

/** Crée une salle. */
export function createSalle(token, data) {
  return apiFetch("/api/salles", { token, method: "POST", body: data, fallbackMessage: "Impossible de créer la salle." });
}

/** Met à jour une salle. */
export function updateSalle(token, id, data) {
  return apiFetch(`/api/salles/${id}`, { token, method: "PATCH", body: data, fallbackMessage: "Impossible de modifier la salle." });
}

/** Supprime une salle. */
export function deleteSalle(token, id) {
  return apiFetch(`/api/salles/${id}`, { token, method: "DELETE", fallbackMessage: "Impossible de supprimer la salle." });
}

/** Libellé affiché dans les sélecteurs de salle, aussi utilisé comme valeur stockée sur un cours planifié. */
export function formatSalleLabel(salle) {
  return `Bâtiment ${salle.numeroBatiment} · Étage ${salle.numeroEtage} · Salle ${salle.numeroSalle}`;
}
