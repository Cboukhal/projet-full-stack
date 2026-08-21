/** Contexte React exposant la session courante à l'ensemble de l'application. */
import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

/**
 * Retourne l'API d'authentification fournie par `AuthProvider`.
 * L'erreur explicite évite qu'un composant consomme silencieusement un contexte absent.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>");
  }
  return context;
}
