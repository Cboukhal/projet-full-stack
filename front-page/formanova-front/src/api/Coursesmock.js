// TODO: remplacer par les vraies données du back (endpoint /cours ou équivalent)
// Une seule source de vérité pour éviter de dupliquer les infos entre le
// calendrier (positionnement, légende) et la page de détail d'un cours.

export const COURSES = [
  {
    id: "algorithmique-init-programmation",
    title: "Algorithmique et Initiation à la Programmation",
    shortTitle: "Algorithmique",
    category: "Promotion",
    status: "En cours",
    type: "promotion", // "promotion" | "unite" - pilote le style de la carte calendrier
    dateRange: "12 – 23 janvier 2026",
    programme: "CDA — Promo 2026-A",
    description:
      "Introduction aux concepts fondamentaux de la programmation : logique algorithmique, variables, structures de contrôle. Travaux pratiques guidés en fin de session.",
    objectifs: [
      "Comprendre les bases de la logique de programmation",
      "Écrire et exécuter des algorithmes simples",
      "Manipuler variables, boucles et conditions",
    ],
    prerequis: "Aucun — premier cours du cursus",
    infosPratiques: {
      periode: "Du 12 au 23 jan 2026",
      horaires: "9h – 17h",
      lieu: "Salle B204 · Présentiel",
      promotion: "CDA 2026-A",
    },
    formateur: {
      nom: "Julien Marchand",
      specialite: "Développement Java",
    },
    calendar: {
      day: "lun12",
      startCol: 1,
      span: 2,
      meta: "9h–17h · Promotion",
    },
  },
  {
    id: "sql-initiation",
    title: "SQL initiation",
    shortTitle: "SQL initiation",
    category: "Cours à l'unité",
    status: "À venir",
    type: "unite",
    dateRange: "15 janvier 2026",
    programme: "Cours à l'unité",
    description: "Bases du langage SQL : requêtes de sélection, filtres, jointures simples.",
    objectifs: [
      "Écrire des requêtes SELECT simples",
      "Filtrer et trier des résultats",
      "Comprendre les jointures de base",
    ],
    prerequis: "Aucun prérequis particulier",
    infosPratiques: {
      periode: "15 jan 2026",
      horaires: "9h – 17h",
      lieu: "À distance",
      promotion: "Cours à l'unité",
    },
    formateur: {
      nom: "Marie Petit",
      specialite: "Bases de données",
    },
    calendar: {
      day: "jeu15",
      startCol: 4,
      span: 1,
      meta: "à l'unité · 9h–17h",
    },
  },
];