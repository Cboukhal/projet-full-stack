/** Client des promotions et de la planification de leurs cours. */
import { apiFetch } from "./client.js";

/** Liste les promotions accessibles. */
export function listPromotions(token) {
  return apiFetch("/api/promotions", { token, fallbackMessage: "Impossible de charger les promotions." });
}

/** Charge une promotion et ses informations associées. */
export function getPromotion(token, id) {
  return apiFetch(`/api/promotions/${id}`, { token, fallbackMessage: "Promotion introuvable." });
}

/** Crée une promotion à partir d'un cursus, d'un nom, d'une date et d'un effectif maximal. */
export function createPromotion(token, data) {
  return apiFetch("/api/promotions", {
    token, method: "POST", body: data, fallbackMessage: "Impossible de créer la promotion.",
  });
}

/** Met à jour les informations générales d'une promotion. */
export function updatePromotion(token, id, data) {
  return apiFetch(`/api/promotions/${id}`, {
    token, method: "PATCH", body: data, fallbackMessage: "Impossible de modifier la promotion.",
  });
}

/**
 * Enregistre en une requête les dates, le formateur et la salle de chaque cours planifié.
 * Chaque élément de `items` identifie la séance à modifier.
 */
export function updatePromotionPlanning(token, id, items) {
  return apiFetch(`/api/promotions/${id}/planning`, {
    token, method: "PATCH", body: { items }, fallbackMessage: "Impossible d'enregistrer la planification.",
  });
}
