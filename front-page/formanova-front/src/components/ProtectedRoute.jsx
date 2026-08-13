import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Enveloppe une route qui nécessite d'être connecté.
 * Redirige vers /login si aucun utilisateur n'est authentifié.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Le temps de relire la session dans localStorage, on n'affiche rien
    // (on pourra mettre un petit loader ici plus tard).
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}