/** Routes d'atterrissage après authentification, regroupées par rôle applicatif. */
const ROLE_HOME = {
  eleve: "/accueil",
  formateur: "/accueil",
  referente: "/accueil",
  administrateur: "/accueil",
};

/** Renvoie la page d'accueil autorisée pour un rôle, avec un repli sûr. */
export function getRoleHome(role) {
  return ROLE_HOME[role] ?? "/accueil";
}
