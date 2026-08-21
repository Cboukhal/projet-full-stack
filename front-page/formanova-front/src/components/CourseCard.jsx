import SectionCard from "./SectionCard";
import "./CourseCard.css";

/**
 * icon: optionnelle (les cours "à l'unité" côté élève n'en ont pas dans la maquette).
 * meta: ligne supplémentaire (ex: progression, statut "Terminé"/"À venir").
 */
export default function CourseCard({ icon, title, subtitle, meta }) {
  return (
    <SectionCard className="course-card">
      {icon && <img src={icon} alt="" className="course-card__icon" />}
      <div className="course-card__body">
        <p className="course-card__title">{title}</p>
        {subtitle && <p className="course-card__subtitle">{subtitle}</p>}
        {meta && <p className="course-card__meta">{meta}</p>}
      </div>
    </SectionCard>
  );
}