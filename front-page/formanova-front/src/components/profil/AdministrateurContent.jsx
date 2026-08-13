import Button from "../button.jsx";
import "./administrateurcontent.css";

// TODO: remplacer par les vraies données du back
const UTILISATEURS = [
  { id: 1, nom: "Camille Dubois", role: "Élève", email: "camille.dubois@mail.fr", statut: "Actif" },
  { id: 2, nom: "Julien Marchand", role: "Formateur", email: "j.marchand@organisme.fr", statut: "Actif" },
  { id: 3, nom: "Marie Petit", role: "Référente", email: "m.petit@organisme.fr", statut: "Actif" },
  { id: 4, nom: "Hugo Riva", role: "Élève", email: "hugo.riva@mail.fr", statut: "Suspendu" },
];

export default function AdministrateurContent() {
  return (
    <>
      <h1 className="profil-content__title">Comptes utilisateurs</h1>
      <p className="profil-content__subtitle">
        Créez des comptes et attribuez un rôle à chaque utilisateur (Élève, Référente, Formateur,
        Administrateur).
      </p>

      <div className="users-toolbar">
        <input
          type="text"
          placeholder="Rechercher un utilisateur"
          className="users-toolbar__search"
        />
        <Button variant="primary" className="users-toolbar__add">
          + Nouveau compte
        </Button>
      </div>

      <div className="users-table">
        <div className="users-table__row users-table__row--head">
          <span>Nom</span>
          <span>Rôle</span>
          <span>Email</span>
          <span>Statut</span>
          <span>Actions</span>
        </div>

        {UTILISATEURS.map((u) => (
          <div className="users-table__row" key={u.id}>
            <span>{u.nom}</span>
            <span>{u.role}</span>
            <span className="users-table__email">{u.email}</span>
            <span
              className={
                "users-table__status " +
                (u.statut === "Actif"
                  ? "users-table__status--active"
                  : "users-table__status--suspended")
              }
            >
              {u.statut}
            </span>
            <span className="users-table__actions">
              <button type="button" className="users-table__action">
                Éditer
              </button>{" "}
              ·{" "}
              <button type="button" className="users-table__action users-table__action--danger">
                Suppr.
              </button>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}