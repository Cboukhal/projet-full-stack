import { apiFetch } from "./client.js";

// Connexion : envoie identifiant/mot de passe, reçoit un token + la fiche utilisateur.
export async function login(identifiant, motDePasse) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: { identifiant, motDePasse },
    fallbackMessage: "Impossible de se connecter au backend.",
  });
}

// Récupère le profil de l'utilisateur connecté à partir de son token (pas de la BDD locale).
export async function getProfil(token) {
  return apiFetch("/api/auth/profile", { token });
}

// Modifie la fiche de l'utilisateur connecté (nom, email, téléphone, spécialité).
export async function updateProfil(token, data) {
  return apiFetch("/api/auth/profile", {
    token,
    method: "PATCH",
    body: data,
    fallbackMessage: "Impossible de mettre à jour le profil.",
  });
}

// Déconnexion : invalide le token côté serveur pour empêcher sa réutilisation.
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
