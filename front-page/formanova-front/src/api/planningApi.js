/** Client du planning personnel de l'élève connecté. */
import { apiFetch } from "./client.js";

/** Charge les séances issues des promotions et des inscriptions à l'unité pour le calendrier. */
export function getMonPlanning(token) {
  return apiFetch("/api/mon-planning", { token, fallbackMessage: "Impossible de charger le planning." });
}

/** Charge le détail d'une séance précise du planning personnel. */
export function getMonPlanningDetail(token, coursPlanifieId) {
  return apiFetch(`/api/mon-planning/${coursPlanifieId}`, { token, fallbackMessage: "Cours introuvable." });
}
