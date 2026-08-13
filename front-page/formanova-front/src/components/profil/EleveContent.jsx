import CourseCard from "../CourseCard";
import iconCda from "../../assets/images/icon-cda.jpg";

// TODO: remplacer par les vraies données du back
const CURSUS = {
  icon: iconCda,
  title: "CDA — Promo 2026-A",
  subtitle: "Développement · 12 jan – 15 déc 2026",
  meta: "9 / 24 cours suivis",
};

const COURS_UNITE = [
  { id: 1, title: "SQL avancé", meta: "Terminé — 14 mars 2026" },
  { id: 2, title: "Gestion de projet", meta: "À venir — 20 avr 2026" },
];

export default function EleveContent() {
  return (
    <>
      <h1 className="profil-content__title">Mon cursus</h1>

      <CourseCard
        icon={CURSUS.icon}
        title={CURSUS.title}
        subtitle={CURSUS.subtitle}
        meta={CURSUS.meta}
      />

      <h2 className="profil-content__subheading">Cours suivis à l'unité</h2>

      {COURS_UNITE.map((c) => (
        <CourseCard key={c.id} title={c.title} meta={c.meta} />
      ))}
    </>
  );
}