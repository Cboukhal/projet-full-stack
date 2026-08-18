import { apiFetch } from "./client.js";

export function listCours(token) {
  return apiFetch("/api/cours", { token, fallbackMessage: "Impossible de charger les cours." });
}

export function getCours(token, id) {
  return apiFetch(`/api/cours/${id}`, { token, fallbackMessage: "Cours introuvable." });
}

export function createCours(token, data) {
  return apiFetch("/api/cours", { token, method: "POST", body: data, fallbackMessage: "Impossible de créer le cours." });
}

export function updateCours(token, id, data) {
  return apiFetch(`/api/cours/${id}`, { token, method: "PATCH", body: data, fallbackMessage: "Impossible de modifier le cours." });
}

export function deleteCours(token, id) {
  return apiFetch(`/api/cours/${id}`, { token, method: "DELETE", fallbackMessage: "Impossible de supprimer le cours." });
}

// Associe ce cours à un cursus existant (même relation que addCoursToCursus, vue de l'autre côté).
export function addCursusToCours(token, coursId, cursusId) {
  return apiFetch(`/api/cours/${coursId}/cursus`, {
    token, method: "POST", body: { cursusId }, fallbackMessage: "Impossible d'associer ce cursus.",
  });
}
