/**
 * Client des routes d'authentification et de gestion du profil courant.
 * Toutes les requêtes passent par `apiFetch` afin de partager la même gestion des erreurs.
 */
import { apiFetch } from "./client.js";

/** Connecte un utilisateur et renvoie son token accompagné de sa fiche. */
export async function login(identifiant, motDePasse) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: { identifiant, motDePasse },
    fallbackMessage: "Impossible de se connecter au backend.",
  });
}

/** Récupère auprès du backend le profil associé au token courant. */
export async function getProfil(token) {
  return apiFetch("/api/auth/profile", { token });
}

/** Met à jour les champs modifiables du profil authentifié. */
export async function updateProfil(token, data) {
  return apiFetch("/api/auth/profile", {
    token,
    method: "PATCH",
    body: data,
    fallbackMessage: "Impossible de mettre à jour le profil.",
  });
}

/**
 * Invalide le token côté serveur.
 * L'échec réseau est volontairement absorbé : la session locale doit toujours pouvoir être fermée.
 */
export async function logout(token) {
  if (!token) {
    return;
  }
  try {
    await apiFetch("/api/auth/logout", { token, method: "POST" });
  } catch {
    // Le logout local doit réussir même si le backend est injoignable.
  }
}
