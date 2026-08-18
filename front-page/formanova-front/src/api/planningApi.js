import { apiFetch } from "./client.js";

// Planning de l'élève connecté (promotions + cours à l'unité), pour le calendrier.
export function getMonPlanning(token) {
  return apiFetch("/api/mon-planning", { token, fallbackMessage: "Impossible de charger le planning." });
}

export function getMonPlanningDetail(token, coursPlanifieId) {
  return apiFetch(`/api/mon-planning/${coursPlanifieId}`, { token, fallbackMessage: "Cours introuvable." });
}
