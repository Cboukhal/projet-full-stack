import { useState } from "react";
import "./textfield.css";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M6.6 6.7C3.9 8.4 2 12 2 12s4 7 11 7c1.9 0 3.5-.4 4.9-1.1M17.4 17.3C20.1 15.6 22 12 22 12s-2.2-3.8-6.2-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Champ de formulaire générique.
 * - type="password" + showToggle affiche l'icône œil pour afficher/masquer.
 * - Purement contrôlé : value/onChange sont fournis par le parent.
 */
export default function TextField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  showToggle = false,
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const inputType = showToggle ? (visible ? "text" : "password") : type;

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={name}>
          {label}
        </label>
      )}
      <div className="field__wrapper">
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="field__input"
          {...rest}
        />
        {showToggle && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
}