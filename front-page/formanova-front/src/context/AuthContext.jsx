import { createContext, useContext, useState, useEffect } from "react";
import { login as loginApi, logout as logoutApi } from "../api/authApi";

// Contexte React qui partage la session (token + utilisateur) dans toute l'app.
const AuthContext = createContext(null);

// Clé utilisée pour persister la session dans le localStorage du navigateur.
const STORAGE_KEY = "formanova_auth";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null); // { token, user } | null
  const [isLoading, setIsLoading] = useState(true);

  // Recharge la session depuis le stockage local au démarrage de l'app.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAuth(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Connexion : appelle le backend puis mémorise la session en état et en localStorage.
  async function login(identifiant, motDePasse) {
    const result = await loginApi(identifiant, motDePasse);
    setAuth(result);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    return result;
  }

  // Déconnexion : invalide le token côté serveur puis nettoie la session locale.
  function logout() {
    logoutApi(auth?.token);
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  // Valeur exposée aux composants via useAuth().
  const value = {
    token: auth?.token ?? null,
    user: auth?.user ?? null,
    role: auth?.user?.role ?? null,
    isAuthenticated: Boolean(auth?.token),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>");
  }
  return context;
}
