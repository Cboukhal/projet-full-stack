import "./Button.css";

/**
 * Bouton générique de l'app.
 * variant: "primary" | "danger" | "text"
 */
export default function Button({ children, variant = "primary", className = "", ...rest }) {
  return (
    <button className={`btn btn--${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
