import { useState } from "react";
import TextField from "./TextField";
import Button from "./Button";
import "./InscriptionForm.css";

export default function InscriptionForm({ title = "Inscription" }) {
  const [eleve, setEleve] = useState("");
  const [cible, setCible] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: brancher l'appel API une fois le back prêt
    console.log("Nouvelle inscription :", { eleve, cible });
  };

  return (
    <aside className="inscription-form">
      <h2 className="inscription-form__title">{title}</h2>
      <p className="inscription-form__subtitle">À une promotion ou à un cours à l'unité.</p>

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          name="eleve"
          placeholder="Rechercher un élève"
          value={eleve}
          onChange={(e) => setEleve(e.target.value)}
        />

        <TextField
          name="cible"
          placeholder="Promotion ou cours"
          value={cible}
          onChange={(e) => setCible(e.target.value)}
        />

        <div className="inscription-form__note">
          <p className="inscription-form__note-title">Vérification de l'ordre des cours</p>
          <p className="inscription-form__note-text">Contrôle des prérequis. Forçage possible.</p>
        </div>

        <Button type="submit">Valider l'inscription</Button>
      </form>
    </aside>
  );
}
