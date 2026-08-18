import { apiFetch } from "./client.js";

export function listPromotions(token) {
  return apiFetch("/api/promotions", { token, fallbackMessage: "Impossible de charger les promotions." });
}

export function getPromotion(token, id) {
  return apiFetch(`/api/promotions/${id}`, { token, fallbackMessage: "Promotion introuvable." });
}

// data: { cursusId, nom, dateDebut, effectifMax }
export function createPromotion(token, data) {
  return apiFetch("/api/promotions", {
    token, method: "POST", body: data, fallbackMessage: "Impossible de créer la promotion.",
  });
}

export function updatePromotion(token, id, data) {
  return apiFetch(`/api/promotions/${id}`, {
    token, method: "PATCH", body: data, fallbackMessage: "Impossible de modifier la promotion.",
  });
}

// items: [{ id, dateDebut, dateFin, formateurId?, salle? }]
export function updatePromotionPlanning(token, id, items) {
  return apiFetch(`/api/promotions/${id}/planning`, {
    token, method: "PATCH", body: { items }, fallbackMessage: "Impossible d'enregistrer la planification.",
  });
}
