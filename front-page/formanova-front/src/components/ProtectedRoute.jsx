import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Enveloppe une route qui nécessite d'être connecté.
 * Redirige vers /login si aucun utilisateur n'est authentifié, et vers /profil
 * si le rôle connecté ne fait pas partie de allowedRoles (quand cette prop est fournie).
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    // Le temps de relire la session dans localStorage, on n'affiche rien
    // (on pourra mettre un petit loader ici plus tard).
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/profil" replace />;
  }

  return children;
}