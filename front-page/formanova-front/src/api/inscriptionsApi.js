import { apiFetch } from "./client.js";

export function listInscriptions(token) {
  return apiFetch("/api/inscriptions", { token, fallbackMessage: "Impossible de charger les inscriptions." });
}

export function searchEleves(token, search) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/api/eleves${query}`, { token, fallbackMessage: "Impossible de rechercher des élèves." });
}

export function searchCoursPlanifies(token, search) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/api/cours-planifies${query}`, { token, fallbackMessage: "Impossible de rechercher des cours." });
}

// type: "promotion" | "cours". force: passe outre le contrôle des prérequis (statut "Forcée").
export function createInscription(token, { eleveId, type, cibleId, force = false }) {
  return apiFetch("/api/inscriptions", {
    token,
    method: "POST",
    body: { eleveId, type, cibleId, force },
    fallbackMessage: "Impossible de créer l'inscription.",
  });
}
