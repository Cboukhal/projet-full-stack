const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

async function readErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    return payload.detail || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

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
 
export async function getProfil(role) {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile?role=${encodeURIComponent(role)}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Impossible de récupérer le profil."));
  }

  return await response.json();
}