import { useState } from "react";
import TextField from "./TextField.jsx";
import Button from "./Button.jsx";
import { updateProfil } from "../api/authApi.js";
import "./editprofilemodal.css";

/**
 * Formulaire de modification du profil, affiché en superposition.
 * profile: fiche actuelle (pré-remplit le formulaire).
 * role: utilisé pour n'afficher "Spécialité" qu'aux formateurs.
 * onClose: ferme la modale sans rien enregistrer.
 * onSaved(updatedProfile): appelé après une sauvegarde réussie côté backend.
 */
export default function EditProfileModal({ profile, role, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: profile?.nom ?? "",
    email: profile?.email ?? "",
    telephone: profile?.telephone ?? "",
    specialite: profile?.specialite ?? "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const updated = await updateProfil(token, form);
      onSaved(updated);
    } catch (err) {
      setError(err.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-profile-overlay" role="dialog" aria-modal="true">
      <div className="edit-profile-modal">
        <h2 className="edit-profile-modal__title">Modifier votre profil</h2>

        {error && <div className="edit-profile-modal__error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <TextField label="Nom" name="nom" value={form.nom} onChange={handleChange} />
          <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
          <TextField label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} />

          {role === "formateur" && (
            <TextField
              label="Spécialité"
              name="specialite"
              value={form.specialite}
              onChange={handleChange}
            />
          )}

          <div className="edit-profile-modal__actions">
            <Button type="button" variant="text" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
