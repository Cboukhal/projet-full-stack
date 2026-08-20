/** Client des inscriptions et des listes de personnes ou de cours utilisées par leurs formulaires. */
import { apiFetch } from "./client.js";

/** Liste les inscriptions existantes. */
export function listInscriptions(token) {
  return apiFetch("/api/inscriptions", { token, fallbackMessage: "Impossible de charger les inscriptions." });
}

/** Recherche des élèves par nom ou identifiant ; une recherche vide renvoie la liste par défaut. */
export function searchEleves(token, search) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/api/eleves${query}`, { token, fallbackMessage: "Impossible de rechercher des élèves." });
}

/** Liste ou filtre les formateurs proposés lors d'une planification. */
export function listFormateurs(token, search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/api/formateurs${query}`, { token, fallbackMessage: "Impossible de charger les formateurs." });
}

/** Recherche les cours planifiés pouvant servir de cible à une inscription. */
export function searchCoursPlanifies(token, search) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/api/cours-planifies${query}`, { token, fallbackMessage: "Impossible de rechercher des cours." });
}

/**
 * Inscrit un élève à une promotion ou à un cours planifié.
 * `force` permet à une référente de passer outre les prérequis et produit un statut « Forcée ».
 */
export function createInscription(token, { eleveId, type, cibleId, force = false }) {
  return apiFetch("/api/inscriptions", {
    token,
    method: "POST",
    body: { eleveId, type, cibleId, force },
    fallbackMessage: "Impossible de créer l'inscription.",
  });
}
