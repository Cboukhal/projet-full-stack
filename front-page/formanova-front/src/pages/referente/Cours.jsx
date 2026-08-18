import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";
import { listCours } from "../../api/coursApi";

const COLUMNS = [
  { key: "nom", label: "Nom", width: "2.2fr" },
  { key: "technologie", label: "Technologie" },
  { key: "duree", label: "Durée" },
  { key: "cursus", label: "Cursus" },
  { key: "statut", label: "Statut", statusColumn: true },
];

export default function Cours() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [coursList, setCoursList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    listCours(token)
      .then((data) => {
        if (isMounted) setCoursList(data);
      })
      .catch(() => {
        // La liste reste vide si le backend est injoignable.
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  const rows = coursList
    .filter((c) => c.nom.toLowerCase().includes(search.toLowerCase()))
    .map((c) => ({ ...c, cursus: c.cursusAssocies.map((a) => a.cursus).join(", ") }));

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
