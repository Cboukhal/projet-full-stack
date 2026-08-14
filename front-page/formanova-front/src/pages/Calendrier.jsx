import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { COURSES } from "../api/coursesMock";
import "./Calendrier.css";

// TODO: remplacer par les vraies données du planning (back)
const DAYS = [
  { id: "lun12", label: "Lun 12", isToday: true },
  { id: "mar13", label: "Mar 13" },
  { id: "mer14", label: "Mer 14" },
  { id: "jeu15", label: "Jeu 15" },
  { id: "ven16", label: "Ven 16" },
];

export default function Calendrier() {
  const navigate = useNavigate();

  // Filtre : un cours de l'élève = une entrée cochable dans la légende,
  // au lieu d'un filtre par type (Promotion / à l'unité).
  const [selected, setSelected] = useState(() =>
    Object.fromEntries(COURSES.map((c) => [c.id, true]))
  );

  const toggleCourse = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const visibleCourses = COURSES.filter((c) => selected[c.id]);

  return (
    <AppShell title="Calendrier">
      <div className="calendar-page">
        <div className="calendar-page__header">
          <div>
            <h2 className="calendar-page__title">Mon calendrier</h2>
            <p className="calendar-page__note">Vue en lecture seule</p>
          </div>

          <div className="calendar-legend">
            {COURSES.map((c) => (
              <label key={c.id} className="calendar-legend__item">
                <input
                  type="checkbox"
                  checked={selected[c.id]}
                  onChange={() => toggleCourse(c.id)}
                />
                {c.shortTitle}
              </label>
            ))}
          </div>
        </div>

        <div className="calendar-card">
          <div className="calendar-grid">
            {DAYS.map((day, i) => (
              <div key={day.id} className="calendar-day-label" style={{ gridColumn: i + 1 }}>
                {day.label}
              </div>
            ))}

            {DAYS.map((day, i) => (
              <div
                key={day.id}
                className={
                  "calendar-day-body" + (day.isToday ? " calendar-day-body--today" : "")
                }
                style={{ gridColumn: i + 1 }}
              />
            ))}

            {visibleCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                className={`calendar-event calendar-event--${course.type}`}
                style={{
                  gridColumn: `${course.calendar.startCol} / span ${course.calendar.span}`,
                }}
                onClick={() => navigate(`/calendrier/${course.id}`)}
              >
                <p className="calendar-event__title">{course.shortTitle}</p>
                <p className="calendar-event__meta">{course.calendar.meta}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}