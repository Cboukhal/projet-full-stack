import "./button.css";

/**
 * Bouton générique de l'app.
 * variant: "primary" | "text"
 */
export default function Button({ children, variant = "primary", className = "", ...rest }) {
  return (
    <button className={`btn btn--${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}