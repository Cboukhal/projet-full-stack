import { useParams, Link, Navigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import PersonIcon from "../components/PersonIcon";
import { COURSES } from "../api/coursesMock";
import "./CourseDetail.css";

export default function CourseDetail() {
  const { courseId } = useParams();
  const course = COURSES.find((c) => c.id === courseId);

  // Cours introuvable (mauvais id, ou lien direct sur un cours qui n'existe plus)
  if (!course) {
    return <Navigate to="/calendrier" replace />;
  }

  return (
    <AppShell title="Calendrier">
      <div className="course-detail">
        <p className="course-detail__breadcrumb">
          <Link to="/calendrier" className="course-detail__breadcrumb-link">
            Calendrier
          </Link>{" "}
          / {course.title}
        </p>

        <div className="course-detail__grid">
          <section className="course-detail__main">
            <div className="course-detail__badges">
              <span className="badge badge--info">{course.category}</span>
              <span className="badge badge--success">{course.status}</span>
            </div>

            <h1 className="course-detail__title">{course.title}</h1>
            <p className="course-detail__meta">
              {course.dateRange} · {course.programme}
            </p>

            <h2 className="course-detail__heading">Description</h2>
            <p className="course-detail__text">{course.description}</p>

            <h2 className="course-detail__heading">Objectifs pédagogiques</h2>
            <ul className="course-detail__list">
              {course.objectifs.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>

            <h2 className="course-detail__heading">Prérequis</h2>
            <div className="course-detail__prerequis">{course.prerequis}</div>
          </section>

          <aside className="course-detail__sidebar">
            <h2 className="course-detail__heading course-detail__heading--first">
              Infos pratiques
            </h2>
            <ul className="course-detail__infos">
              <li>{course.infosPratiques.periode}</li>
              <li>{course.infosPratiques.horaires}</li>
              <li>{course.infosPratiques.lieu}</li>
              <li>Promotion : {course.infosPratiques.promotion}</li>
            </ul>

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
          </aside>
        </div>
      </div>
    </AppShell>
  );
}