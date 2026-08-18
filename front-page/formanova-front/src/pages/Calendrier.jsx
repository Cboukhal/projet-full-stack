import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import { getMonPlanning } from "../api/planningApi";
import "./Calendrier.css";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven"];

// Ramène n'importe quelle date au lundi de sa semaine, pour construire une grille Lun-Ven fixe.
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dimanche
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Calendrier() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    getMonPlanning(token)
      .then((data) => {
        setCourses(data);
        setSelected(Object.fromEntries(data.map((c) => [c.id, true])));
      })
      .catch(() => {
        // Le calendrier reste vide si le backend est injoignable.
      });
  }, [token]);

  const today = new Date();
  const monday = useMemo(() => startOfWeek(today), []); // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(
    () =>
      DAY_LABELS.map((label, i) => {
        const date = new Date(monday);
        date.setDate(date.getDate() + i);
        return { label: `${label} ${date.getDate()}`, date, isToday: isSameDay(date, today) };
      }),
    [monday] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const toggleCourse = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Seuls les cours cochés, datés, et dont la date de début tombe dans la semaine affichée
  // sont positionnés sur la grille (un cours plus long n'est affiché que sur son jour de début).
  const visibleCourses = courses
    .filter((c) => selected[c.id] && c.dateDebut)
    .map((c) => {
      const debut = new Date(c.dateDebut);
      const col = days.findIndex((d) => isSameDay(d.date, debut));
      if (col === -1) {
        return null;
      }
      const meta = c.dateFin
        ? `${debut.toLocaleDateString("fr-FR")} → ${new Date(c.dateFin).toLocaleDateString("fr-FR")}`
        : debut.toLocaleDateString("fr-FR");
      return { ...c, col, meta };
    })
    .filter(Boolean);

  return (
    <AppShell title="Calendrier">
      <div className="calendar-page">
        <div className="calendar-page__header">
          <div>
            <h2 className="calendar-page__title">Mon calendrier</h2>
            <p className="calendar-page__note">Vue en lecture seule</p>
          </div>

          <div className="calendar-legend">
            {courses.map((c) => (
              <label key={c.id} className="calendar-legend__item">
                <input
                  type="checkbox"
                  checked={selected[c.id] ?? true}
                  onChange={() => toggleCourse(c.id)}
                />
                {c.titre}
              </label>
            ))}
          </div>
        </div>

        <div className="calendar-card">
          <div className="calendar-grid">
            {days.map((day, i) => (
              <div key={day.label} className="calendar-day-label" style={{ gridColumn: i + 1 }}>
                {day.label}
              </div>
            ))}

            {days.map((day, i) => (
              <div
                key={day.label}
                className={"calendar-day-body" + (day.isToday ? " calendar-day-body--today" : "")}
                style={{ gridColumn: i + 1 }}
              />
            ))}

            {visibleCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                className="calendar-event calendar-event--promotion"
                style={{ gridColumn: `${course.col + 1} / span 1` }}
                onClick={() => navigate(`/calendrier/${course.id}`)}
              >
                <p className="calendar-event__title">{course.titre}</p>
                <p className="calendar-event__meta">{course.meta}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
