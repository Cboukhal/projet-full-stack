import { useState } from "react";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";

// TODO: remplacer par les vraies données du back
const FILIERES = [
  { id: 1, nom: "Développement", nbCursus: 4, nbEleves: 42, statut: "Actif" },
  { id: 2, nom: "Systèmes et Réseaux", nbCursus: 3, nbEleves: 22, statut: "Actif" },
];

const COLUMNS = [
  { key: "nom", label: "Nom", width: "2fr" },
  { key: "nbCursus", label: "Nb cursus" },
  { key: "nbEleves", label: "Nb élèves" },
  { key: "statut", label: "Statut", statusColumn: true },
];

export default function Filieres() {
  const [search, setSearch] = useState("");

  const rows = FILIERES.filter((f) => f.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <ReferenteLayout>
      <ListPageHeader
        title="Gestion des filières"
        subtitle="Systèmes et Réseaux, Développement... regroupent vos cursus."
        searchPlaceholder="Rechercher une filière"
        searchValue={search}
        onSearchChange={setSearch}
        actionLabel="+ Nouvelle filière"
        onAction={() => console.log("TODO: ouvrir le formulaire de création de filière")}
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        onRowClick={(row) => console.log("TODO: détail filière", row)}
      />
    </ReferenteLayout>
  );
}
