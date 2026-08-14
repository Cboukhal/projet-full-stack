import { useState } from "react";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";

// TODO: remplacer par les vraies données du back
const COURS = [
  { id: 1, nom: "Algorithmique + Init. Programmation", techno: "Java", duree: "2 sem.", cursus: "CDA", statut: "Actif" },
  { id: 2, nom: "Web Client HTML & CSS", techno: "HTML/CSS", duree: "2 sem.", cursus: "CDA, D2WM", statut: "Actif" },
  { id: 3, nom: "Langage SQL", techno: "SQL Server", duree: "1 sem.", cursus: "CDA, ASR", statut: "Actif" },
  { id: 4, nom: "SQL avancé", techno: "Transact SQL", duree: "1 sem.", cursus: "CDA", statut: "Actif" },
];

const COLUMNS = [
  { key: "nom", label: "Nom", width: "2.2fr" },
  { key: "techno", label: "Technologie" },
  { key: "duree", label: "Durée" },
  { key: "cursus", label: "Cursus" },
  { key: "statut", label: "Statut", statusColumn: true },
];

export default function Cours() {
  const [search, setSearch] = useState("");

  const rows = COURS.filter((c) => c.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <ReferenteLayout>
      <ListPageHeader
        title="Gestion des cours"
        subtitle="Unités pédagogiques rattachées à un ou plusieurs cursus."
        searchPlaceholder="Rechercher un cours"
        searchValue={search}
        onSearchChange={setSearch}
        actionLabel="+ Nouveau cours"
        onAction={() => console.log("TODO: ouvrir le formulaire de création de cours")}
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        onRowClick={(row) => console.log("TODO: détail cours", row)}
      />
    </ReferenteLayout>
  );
}
