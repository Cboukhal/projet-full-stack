import "./SectionCard.css";

export default function SectionCard({ children, className = "" }) {
  return <div className={`section-card ${className}`.trim()}>{children}</div>;
}