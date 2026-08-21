import CourseCard from "../CourseCard";
import iconAlgo from "../../assets/images/icon-algo.jpg";
import iconPoo from "../../assets/images/icon-poo.jpg";
import iconJava from "../../assets/images/icon-java.jpg";

// TODO: remplacer par le planning réel de l'utilisateur connecté (back)
const COURS = [
  {
    id: 1,
    icon: iconAlgo,
    title: "Algorithmique + Init. Programmation",
    subtitle: "CDA — Promo 2026-A · 12–23 jan 2026",
  },
  {
    id: 2,
    icon: iconPoo,
    title: "Programmation Orientée Objet",
    subtitle: "CDA — Promo 2026-A · 16 fév–6 mars 2026",
  },
  {
    id: 3,
    icon: iconJava,
    title: "Java Frameworks — API Web",
    subtitle: "CDA — Promo 2025-D · à venir",
  },
];

export default function FormateurContent() {
  return (
    <>
      <h1 className="profil-content__title">Cours et promotions animés</h1>

      {COURS.map((c) => (
        <CourseCard key={c.id} icon={c.icon} title={c.title} subtitle={c.subtitle} />
      ))}
    </>
  );
}