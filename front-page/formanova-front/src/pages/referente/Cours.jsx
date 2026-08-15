import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";
import { COURS } from "../../api/coursMock";

const COLUMNS = [
  { key: "nom", label: "Nom", width: "2.2fr" },
  { key: "technologie", label: "Technologie" },
  { key: "duree", label: "Durée" },
  { key: "cursus", label: "Cursus" },
  { key: "statut", label: "Statut", statusColumn: true },
];

export default function Cours() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const rows = COURS.filter((c) => c.nom.toLowerCase().includes(search.toLowerCase())).map(
    (c) => ({ ...c, cursus: c.cursusAssocies.map((a) => a.cursus).join(", ") })
  );

  return (
    <ReferenteLayout>
      <ListPageHeader
        title="Gestion des cours"
        subtitle="Unités pédagogiques rattachées à un ou plusieurs cursus."
        searchPlaceholder="Rechercher un cours"
        searchValue={search}
        onSearchChange={setSearch}
        actionLabel="+ Nouveau cours"
        onAction={() => navigate("/espace-referente/cours/nouveau")}
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        onRowClick={(row) => navigate(`/espace-referente/cours/${row.id}`)}
      />
    </ReferenteLayout>
  );
}
