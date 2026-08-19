import { apiFetch } from "./client.js";

/**
 * Demande au backend l'envoi d'un lien de réinitialisation par e-mail.
 * Cette route est publique : aucun token de connexion n'est nécessaire.
 */
export function requestPasswordReset(email) {
  return apiFetch("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
    fallbackMessage: "Impossible d'envoyer l'e-mail de réinitialisation.",
  });
}

/**
 * Enregistre le nouveau mot de passe à l'aide du token reçu dans l'e-mail.
 */
export function resetPassword(token, newPassword, confirmPassword) {
  return apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: { token, newPassword, confirmPassword },
    fallbackMessage: "Impossible de réinitialiser le mot de passe.",
  });
}
