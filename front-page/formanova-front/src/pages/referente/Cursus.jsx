import { useState } from "react";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";

// TODO: remplacer par les vraies données du back
const CURSUS = [
  { id: 1, nom: "CDA", filiere: "Développement", nbCours: 24, duree: "11 mois", statut: "Actif" },
  { id: 2, nom: "TSSR", filiere: "Systèmes et Réseaux", nbCours: 16, duree: "9 mois", statut: "Actif" },
  { id: 3, nom: "ASR", filiere: "Systèmes et Réseaux", nbCours: 18, duree: "10 mois", statut: "Actif" },
  { id: 4, nom: "D2WM", filiere: "Développement", nbCours: 14, duree: "8 mois", statut: "Brouillon" },
  { id: 5, nom: "EADL", filiere: "Développement", nbCours: 20, duree: "12 mois", statut: "Actif" },
];

const COLUMNS = [
  { key: "nom", label: "Nom" },
  { key: "filiere", label: "Filière", width: "1.6fr" },
  { key: "nbCours", label: "Nb cours" },
  { key: "duree", label: "Durée" },
  { key: "statut", label: "Statut", statusColumn: true },
];

export default function Cursus() {
  const [search, setSearch] = useState("");

  const rows = CURSUS.filter((c) => c.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <ReferenteLayout>
      <ListPageHeader
        title="Gestion des cursus"
        subtitle="CDA, TSSR, ASR... définissez la filière et l'ordre pédagogique."
        searchPlaceholder="Rechercher un cursus"
        searchValue={search}
        onSearchChange={setSearch}
        actionLabel="+ Nouveau cursus"
        onAction={() => console.log("TODO: ouvrir le formulaire de création de cursus")}
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        onRowClick={(row) => console.log("TODO: détail cursus", row)}
      />
    </ReferenteLayout>
  );
}
