import { useEffect, useId, useRef } from "react";
import "./Modal.css";

const FOCUSABLE_ELEMENTS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
  closeDisabled = false,
  describedBy,
  role = "dialog",
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  const titleId = useId();

  // Les références gardent le gestionnaire clavier à jour sans déplacer le focus à chaque rendu.
  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  }, [closeDisabled, onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    // Une action sûre peut demander le focus initial avec data-modal-initial-focus.
    const animationFrame = window.requestAnimationFrame(() => {
      const initialElement = dialog?.querySelector("[data-modal-initial-focus]");
      const firstFocusable = dialog?.querySelector(FOCUSABLE_ELEMENTS);
      (initialElement || firstFocusable || dialog)?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!closeDisabledRef.current) {
          event.preventDefault();
          onCloseRef.current();
        }
        return;
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

      const focusableElements = Array.from(dialog.querySelectorAll(FOCUSABLE_ELEMENTS));
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const focusIsOutside = !dialog.contains(document.activeElement);

      // Le focus reste dans la fenêtre lorsqu'on parcourt ses actions au clavier.
      if (event.shiftKey && (document.activeElement === firstElement || focusIsOutside)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (document.activeElement === lastElement || focusIsOutside)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;

      // Au retour, le clavier reprend naturellement sur le bouton qui a ouvert la fenêtre.
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !closeDisabled) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div
        ref={dialogRef}
        className={`modal ${className}`.trim()}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        <div className="modal__header">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            disabled={closeDisabled}
          >
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
