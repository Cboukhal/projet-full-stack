import { MOCK_USERS } from "./mockData";

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

function fakeDelay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fakeToken(identifiant) {
  return btoa(`${identifiant}:${Date.now()}`);
}

function buildMockLoginResult(identifiant, motDePasse) {
  const user = MOCK_USERS.find(
    (entry) => entry.identifiant === identifiant && entry.motDePasse === motDePasse
  );

  if (!user) {
    const error = new Error("Identifiant ou mot de passe incorrect.");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const { motDePasse: _omit, ...userWithoutPassword } = user;

  return {
    token: fakeToken(user.identifiant),
    user: userWithoutPassword,
  };
}

export async function login(identifiant, motDePasse) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifiant, motDePasse }),
    });

    if (!response.ok) {
      throw new Error("Backend indisponible");
    }

    return await response.json();
  } catch (error) {
    const result = buildMockLoginResult(identifiant, motDePasse);
    if (error && error.code === "INVALID_CREDENTIALS") {
      throw error;
    }
    return result;
  }
}

export async function getProfil(role) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile?role=${encodeURIComponent(role)}`);
    if (!response.ok) {
      throw new Error("Backend indisponible");
    }
    return await response.json();
  } catch {
    await fakeDelay(300);
    const user = MOCK_USERS.find((entry) => entry.role === role);
    if (!user) {
      return null;
    }
    const { motDePasse: _omit, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}