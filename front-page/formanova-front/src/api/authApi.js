// Adresse du backend Django, configurable via une variable d'environnement Vite.
const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

// Récupère un message d'erreur lisible renvoyé par le backend, ou un message par défaut.
async function readErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    return payload.detail || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

// Connexion : envoie identifiant/mot de passe, reçoit un token + la fiche utilisateur.
export async function login(identifiant, motDePasse) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifiant, motDePasse }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Impossible de se connecter au backend."));
  }

  return await response.json();
}
 
// Récupère le profil de l'utilisateur connecté à partir de son token (pas de la BDD locale).
export async function getProfil(token) {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Token absent/invalide ou profil introuvable : on laisse l'appelant gérer le cas "pas de profil".
  if (response.status === 401 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Impossible de récupérer le profil."));
  }

  return await response.json();
}

// Déconnexion : invalide le token côté serveur pour empêcher sa réutilisation.
export async function logout(token) {
  if (!token) {
    return;
  }

  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Le logout local doit réussir même si le backend est injoignable.
  }
}