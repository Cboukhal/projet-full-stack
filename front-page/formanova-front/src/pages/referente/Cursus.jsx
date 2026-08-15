import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";
import { CURSUS } from "../../api/cursusMock";

const COLUMNS = [
  { key: "nom", label: "Nom" },
  { key: "filiere", label: "Filière", width: "1.6fr" },
  { key: "nbCours", label: "Nb cours" },
  { key: "duree", label: "Durée" },
  { key: "statut", label: "Statut", statusColumn: true },
];

export default function Cursus() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const rows = CURSUS.filter((c) => c.nom.toLowerCase().includes(search.toLowerCase())).map(
    (c) => ({ ...c, duree: `${c.dureeMois} mois` })
  );

  return (
    <ReferenteLayout>
      <ListPageHeader
        title="Gestion des cursus"
        subtitle="CDA, TSSR, ASR... définissez la filière et l'ordre pédagogique."
        searchPlaceholder="Rechercher un cursus"
        searchValue={search}
        onSearchChange={setSearch}
        actionLabel="+ Nouveau cursus"
        onAction={() => navigate("/espace-referente/cursus/nouveau")}
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        onRowClick={(row) => navigate(`/espace-referente/cursus/${row.id}`)}
      />
    </ReferenteLayout>
  );
}
