import { useEffect, useState } from "react";

import { getProfil, login as loginApi, logout as logoutApi } from "../api/authApi";
import {
  AUTH_STORAGE_KEY,
  clearStoredAuth,
  loadStoredAuth,
  parseStoredAuth,
  saveStoredAuth,
} from "../authSession";
import { AuthContext } from "./AuthContext";

function loadInitialSession() {
  const auth = loadStoredAuth();
  return { auth, isLoading: Boolean(auth) };
}

export function AuthProvider({ children }) {
  const [{ auth, isLoading }, setSession] = useState(loadInitialSession);

  // Au démarrage, valide le token restauré avant de laisser les routes rediriger.
  useEffect(() => {
    if (!isLoading || !auth?.token) {
      return undefined;
    }

    let isCancelled = false;

    getProfil(auth.token)
      .then((user) => {
        if (isCancelled) {
          return;
        }

        const restoredAuth = { ...auth, user };
        saveStoredAuth(restoredAuth);
        setSession({ auth: restoredAuth, isLoading: false });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        if (error?.status === 401) {
          clearStoredAuth();
          setSession({ auth: null, isLoading: false });
          return;
        }

        // Une panne temporaire du backend ne doit pas effacer une session locale valide.
        setSession({ auth, isLoading: false });
      });

    return () => {
      isCancelled = true;
    };
  }, [auth, isLoading]);

  // Synchronise connexion et déconnexion entre les onglets du même navigateur.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== AUTH_STORAGE_KEY) {
        return;
      }

      const nextAuth = parseStoredAuth(event.newValue);
      setSession({ auth: nextAuth, isLoading: Boolean(nextAuth) });
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Connexion : appelle le backend puis mémorise la session en état et en localStorage.
  async function login(identifiant, motDePasse) {
    const result = await loginApi(identifiant, motDePasse);
    saveStoredAuth(result);
    setSession({ auth: result, isLoading: false });
    return result;
  }

  // Déconnexion : invalide le token côté serveur puis nettoie la session locale.
  function logout() {
    void logoutApi(auth?.token);
    clearStoredAuth();
    setSession({ auth: null, isLoading: false });
  }

  // Fusionne des champs modifiés dans l'utilisateur courant (après édition du profil)
  // et les repersiste, pour que le reste de l'app (nom affiché, etc.) reste à jour.
  function updateUser(patch) {
    setSession((previousSession) => {
      if (!previousSession.auth) {
        return previousSession;
      }

      const nextAuth = {
        ...previousSession.auth,
        user: { ...previousSession.auth.user, ...patch },
      };
      saveStoredAuth(nextAuth);
      return { ...previousSession, auth: nextAuth };
    });
  }

  const value = {
    token: auth?.token ?? null,
    user: auth?.user ?? null,
    role: auth?.user?.role ?? null,
    isAuthenticated: Boolean(auth?.token),
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
