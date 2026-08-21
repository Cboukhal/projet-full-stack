/** Fiche détaillée d'une occurrence de cours visible dans le planning élève. */
import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import PersonIcon from "../components/PersonIcon";
import { getMonPlanningDetail } from "../api/planningApi";
import "./CourseDetail.css";

/** Formate une date API selon les conventions françaises. */
function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : null;
}

/** Extrait l'heure et les minutes d'une date API. */
function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null;
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const [course, setCourse] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // L'API vérifie que le cours demandé appartient bien au planning de l'élève.
  useEffect(() => {
    getMonPlanningDetail(token, courseId)
      .then(setCourse)
      .catch(() => setNotFound(true));
  }, [courseId, token]);

  // Cours introuvable (mauvais id, ou lien direct sur un cours qui n'existe plus)
  if (notFound) {
    return <Navigate to="/calendrier" replace />;
  }

  if (!course) {
    return null;
  }

  // Les objectifs sont un simple champ texte côté backend (pas un tableau) : on affiche
  // une ligne par saut de ligne pour retrouver une présentation en liste.
  const objectifs = course.objectifs
    ? course.objectifs.split("\n").map((line) => line.trim()).filter(Boolean)
    : [];
  const periode = [formatDate(course.dateDebut), formatDate(course.dateFin)].filter(Boolean).join(" → ");
  const horaires = [formatTime(course.dateDebut), formatTime(course.dateFin)].filter(Boolean).join(" - ");
  const contexte = course.promotionNom || "Cours à l’unité";

  return (
    <AppShell title="Calendrier">
      <div className="course-detail">
        <p className="course-detail__breadcrumb">
          <Link to="/calendrier" className="course-detail__breadcrumb-link">
            Calendrier
          </Link>{" "}
          / {course.titre}
        </p>

        {/* Le contenu pédagogique et les informations pratiques restent séparés. */}
        <div className="course-detail__grid">
          <section className="course-detail__main">
            <div className="course-detail__badges">
              <span className="badge badge--info">{course.technologie || "Cours"}</span>
              <span className="badge badge--success">{course.statut}</span>
            </div>

            <h1 className="course-detail__title">{course.titre}</h1>
            <p className="course-detail__meta">
              {periode || "Dates à confirmer"} · {contexte}
            </p>

            <h2 className="course-detail__heading">Description</h2>
            <p className="course-detail__text">{course.description || "Aucune description."}</p>

            {objectifs.length > 0 && (
              <>
                <h2 className="course-detail__heading">Objectifs pédagogiques</h2>
                <ul className="course-detail__list">
                  {objectifs.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <aside className="course-detail__sidebar">
            <h2 className="course-detail__heading course-detail__heading--first">
              Infos pratiques
            </h2>
            <ul className="course-detail__infos">
              <li>{periode || "Période à confirmer"}</li>
              <li>{horaires || "Horaires à confirmer"}</li>
              <li>{course.salle || "Salle à confirmer"}</li>
              <li>{course.promotionNom ? `Promotion : ${course.promotionNom}` : "Cours à l’unité"}</li>
            </ul>

            {course.formateur && (
              <>
                <h2 className="course-detail__heading">Formateur</h2>
                <div className="course-detail__formateur">
                  <div className="course-detail__formateur-avatar">
                    <PersonIcon size={28} />
                  </div>
                  <div>
                    <p className="course-detail__formateur-name">{course.formateur.nom}</p>
                    <p className="course-detail__formateur-specialite">
                      {course.formateur.specialite}
                    </p>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
