/** Client des sessions proposées à l'unité pour un cours. */
import { apiFetch } from "./client.js";

/** Liste les offres unitaires rattachées à un cours donné. */
export function listCoursOffresUnitaires(token, coursId) {
  return apiFetch(`/api/cours/${coursId}/offres-unitaires`, {
    token,
    fallbackMessage: "Impossible de charger les sessions à l'unité.",
  });
}

/** Crée une nouvelle session à l'unité pour un cours. */
export function createCoursOffreUnitaire(token, coursId, data) {
  return apiFetch(`/api/cours/${coursId}/offres-unitaires`, {
    token,
    method: "POST",
    body: data,
    fallbackMessage: "Impossible de créer la session à l'unité.",
  });
}

/**
 * Liste les offres unitaires, avec recherche textuelle et filtre optionnel sur les dates à venir.
 * `URLSearchParams` garantit l'encodage homogène des critères transmis au backend.
 */
export function listOffresCoursUnitaires(token, search = "", { upcoming = false } = {}) {
  const params = new URLSearchParams({ mode: "unite", search: search.trim() });
  if (upcoming) {
    params.set("upcoming", "1");
  }

  return apiFetch(`/api/offres-cours?${params.toString()}`, {
    token,
    fallbackMessage: "Impossible de charger les sessions à l'unité.",
  });
}

/** Modifie partiellement une offre de cours. */
export function updateOffreCours(token, offreId, data) {
  return apiFetch(`/api/offres-cours/${offreId}`, {
    token,
    method: "PATCH",
    body: data,
    fallbackMessage: "Impossible de modifier la session.",
  });
}

/** Supprime une offre de cours. */
export function deleteOffreCours(token, offreId) {
  return apiFetch(`/api/offres-cours/${offreId}`, {
    token,
    method: "DELETE",
    fallbackMessage: "Impossible de supprimer la session.",
  });
}
