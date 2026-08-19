const ROLE_HOME = {
  eleve: "/accueil",
  formateur: "/accueil",
  referente: "/accueil",
  administrateur: "/accueil",
};

export function getRoleHome(role) {
  return ROLE_HOME[role] ?? "/accueil";
}
