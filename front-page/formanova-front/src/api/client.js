/**
 * Socle HTTP commun à tous les clients d'API du frontend.
 * Il centralise l'URL du backend, l'authentification, la sérialisation JSON et les erreurs métier.
 */

// Adresse du backend Django, configurable via une variable d'environnement Vite.
export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

/** Erreur applicative enrichie du statut HTTP renvoyé par le backend. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Extrait un message utilisateur du JSON d'erreur, avec repli si la réponse n'est pas lisible. */
async function readErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    // Les validateurs de mot de passe Django renvoient plusieurs conseils.
    // On les conserve tous pour aider l'utilisateur à corriger sa saisie.
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      return [payload.detail, ...payload.errors].filter(Boolean).join(" ");
    }
    return payload.detail || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

/**
 * Appelle une route du backend et renvoie son contenu JSON.
 * Le corps est sérialisé automatiquement, le token devient un en-tête Bearer et les réponses
 * non réussies sont converties en `ApiError`. Une réponse 204 produit explicitement `null`.
 */
export async function apiFetch(path, { token, method = "GET", body, fallbackMessage } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(
      await readErrorMessage(response, fallbackMessage || "Une erreur est survenue."),
      response.status,
    );
  }

  if (response.status === 204) {
    return null;
  }
  return await response.json();
}
