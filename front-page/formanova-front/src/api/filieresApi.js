/** Client CRUD des filières de formation. */
import { apiFetch } from "./client.js";

/** Liste toutes les filières accessibles. */
export function listFilieres(token) {
  return apiFetch("/api/filieres", { token, fallbackMessage: "Impossible de charger les filières." });
}

/** Charge le détail d'une filière. */
export function getFiliere(token, id) {
  return apiFetch(`/api/filieres/${id}`, { token, fallbackMessage: "Filière introuvable." });
}

/** Crée une filière. */
export function createFiliere(token, data) {
  return apiFetch("/api/filieres", { token, method: "POST", body: data, fallbackMessage: "Impossible de créer la filière." });
}

/** Met à jour partiellement une filière. */
export function updateFiliere(token, id, data) {
  return apiFetch(`/api/filieres/${id}`, { token, method: "PATCH", body: data, fallbackMessage: "Impossible de modifier la filière." });
}

/** Supprime une filière. */
export function deleteFiliere(token, id) {
  return apiFetch(`/api/filieres/${id}`, { token, method: "DELETE", fallbackMessage: "Impossible de supprimer la filière." });
}
