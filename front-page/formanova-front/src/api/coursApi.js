/** Client des opérations CRUD et des associations de cursus pour les cours. */
import { apiFetch } from "./client.js";

/** Liste les cours visibles par l'utilisateur authentifié. */
export function listCours(token) {
  return apiFetch("/api/cours", { token, fallbackMessage: "Impossible de charger les cours." });
}

/** Charge un cours à partir de son identifiant interne. */
export function getCours(token, id) {
  return apiFetch(`/api/cours/${id}`, { token, fallbackMessage: "Cours introuvable." });
}

/** Charge un cours depuis son slug public, préalablement encodé pour l'URL. */
export function getCoursBySlug(token, slug) {
  return apiFetch(`/api/cours/par-slug/${encodeURIComponent(slug)}`, {
    token,
    fallbackMessage: "Cours introuvable.",
  });
}

/** Crée un cours avec les données saisies dans le formulaire référente. */
export function createCours(token, data) {
  return apiFetch("/api/cours", { token, method: "POST", body: data, fallbackMessage: "Impossible de créer le cours." });
}

/** Applique une modification partielle à un cours. */
export function updateCours(token, id, data) {
  return apiFetch(`/api/cours/${id}`, { token, method: "PATCH", body: data, fallbackMessage: "Impossible de modifier le cours." });
}

/** Supprime un cours existant. */
export function deleteCours(token, id) {
  return apiFetch(`/api/cours/${id}`, { token, method: "DELETE", fallbackMessage: "Impossible de supprimer le cours." });
}

/** Associe le cours à un cursus existant, depuis le point de vue de la fiche cours. */
export function addCursusToCours(token, coursId, cursusId) {
  return apiFetch(`/api/cours/${coursId}/cursus`, {
    token, method: "POST", body: { cursusId }, fallbackMessage: "Impossible d'associer ce cursus.",
  });
}
