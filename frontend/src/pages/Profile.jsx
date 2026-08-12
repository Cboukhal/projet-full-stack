import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Profil</h1>
      <p>Bienvenue, {user.nom}.</p>
      <p>Rôle : {user.role}</p>
      <p>Email : {user.email}</p>

      <button
        type="button"
        onClick={logout}
        style={{ marginTop: "1rem", padding: "0.7rem 1.2rem" }}
      >
        Se déconnecter
      </button>
    </main>
  );
}
