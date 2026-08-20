/** Construction centralisée des URLs de consultation et de création des cours. */
const COURS_BASE_PATH = "/espace-referente/cours";

export const NEW_COURS_PATH = `${COURS_BASE_PATH}/nouveau`;

/** Construit l'URL lisible d'un cours sans exposer son identifiant numérique. */
export function getCoursPath(cours) {
  if (!cours?.slug) {
    return COURS_BASE_PATH;
  }
  return `${COURS_BASE_PATH}/${encodeURIComponent(cours.slug)}`;
}
