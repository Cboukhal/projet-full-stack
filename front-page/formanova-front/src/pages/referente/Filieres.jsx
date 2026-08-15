import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";
import { FILIERES } from "../../api/filieresMock";

const COLUMNS = [
  { key: "nom", label: "Nom", width: "2fr" },
  { key: "nbCursus", label: "Nb cursus" },
  { key: "nbEleves", label: "Nb élèves" },
  { key: "statut", label: "Statut", statusColumn: true },
];

export default function Filieres() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const rows = FILIERES.filter((f) => f.nom.toLowerCase().includes(search.toLowerCase())).map(
    (f) => ({ ...f, nbCursus: f.cursusRattaches.length })
  );

  return (
    <ReferenteLayout>
      <ListPageHeader
        title="Gestion des filières"
        subtitle="Systèmes et Réseaux, Développement... regroupent vos cursus."
        searchPlaceholder="Rechercher une filière"
        searchValue={search}
        onSearchChange={setSearch}
        actionLabel="+ Nouvelle filière"
        onAction={() => navigate("/espace-referente/filieres/nouveau")}
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        onRowClick={(row) => navigate(`/espace-referente/filieres/${row.id}`)}
      />
    </ReferenteLayout>
  );
}
