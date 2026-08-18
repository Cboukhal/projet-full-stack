import "./FormCard.css";

export default function FormCard({ title, subtitle, children, className = "" }) {
  return (
    <div className={`form-card ${className}`.trim()}>
      {title && <h2 className="form-card__title">{title}</h2>}
      {subtitle && <p className="form-card__subtitle">{subtitle}</p>}
      {children}
    </div>
  );
}
