import { apiFetch } from "./client.js";

export function listFilieres(token) {
  return apiFetch("/api/filieres", { token, fallbackMessage: "Impossible de charger les filières." });
}

export function getFiliere(token, id) {
  return apiFetch(`/api/filieres/${id}`, { token, fallbackMessage: "Filière introuvable." });
}

export function createFiliere(token, data) {
  return apiFetch("/api/filieres", { token, method: "POST", body: data, fallbackMessage: "Impossible de créer la filière." });
}

export function updateFiliere(token, id, data) {
  return apiFetch(`/api/filieres/${id}`, { token, method: "PATCH", body: data, fallbackMessage: "Impossible de modifier la filière." });
}

export function deleteFiliere(token, id) {
  return apiFetch(`/api/filieres/${id}`, { token, method: "DELETE", fallbackMessage: "Impossible de supprimer la filière." });
}
