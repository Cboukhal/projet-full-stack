/** Client des cursus et de leur ordre pédagogique de cours. */
import { apiFetch } from "./client.js";

/** Liste les cursus accessibles à l'utilisateur courant. */
export function listCursus(token) {
  return apiFetch("/api/cursus", { token, fallbackMessage: "Impossible de charger les cursus." });
}

/** Charge le détail d'un cursus. */
export function getCursus(token, id) {
  return apiFetch(`/api/cursus/${id}`, { token, fallbackMessage: "Cursus introuvable." });
}

/** Crée un cursus. */
export function createCursus(token, data) {
  return apiFetch("/api/cursus", { token, method: "POST", body: data, fallbackMessage: "Impossible de créer le cursus." });
}

/** Met à jour partiellement un cursus. */
export function updateCursus(token, id, data) {
  return apiFetch(`/api/cursus/${id}`, { token, method: "PATCH", body: data, fallbackMessage: "Impossible de modifier le cursus." });
}

/** Supprime un cursus. */
export function deleteCursus(token, id) {
  return apiFetch(`/api/cursus/${id}`, { token, method: "DELETE", fallbackMessage: "Impossible de supprimer le cursus." });
}

/** Ajoute un cours existant à la fin de l'ordre pédagogique du cursus. */
export function addCoursToCursus(token, cursusId, coursId) {
  return apiFetch(`/api/cursus/${cursusId}/cours`, {
    token, method: "POST", body: { coursId }, fallbackMessage: "Impossible d'ajouter ce cours au cursus.",
  });
}

/** Retire un cours du cursus ; le backend renumérote ensuite les positions restantes. */
export function removeCoursFromCursus(token, cursusId, linkId) {
  return apiFetch(`/api/cursus/${cursusId}/cours/${linkId}`, {
    token, method: "DELETE", fallbackMessage: "Impossible de retirer ce cours du cursus.",
  });
}

/** Déplace une association cours-cursus à une nouvelle position pédagogique. */
export function reorderCoursInCursus(token, cursusId, linkId, position) {
  return apiFetch(`/api/cursus/${cursusId}/cours/${linkId}`, {
    token, method: "PATCH", body: { position }, fallbackMessage: "Impossible de réordonner ce cours.",
  });
}
