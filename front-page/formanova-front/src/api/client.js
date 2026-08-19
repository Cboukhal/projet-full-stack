// Adresse du backend Django, configurable via une variable d'environnement Vite.
export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Récupère un message d'erreur lisible renvoyé par le backend, ou un message par défaut.
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
 * Appelle l'API backend en ajoutant le token d'authentification et en gérant les erreurs.
 * method: GET|POST|PATCH|DELETE. body: objet JS sérialisé automatiquement.
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
