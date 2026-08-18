import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";
import { listCursus } from "../../api/cursusApi";

const COLUMNS = [
  { key: "nom", label: "Nom" },
  { key: "filiere", label: "Filière", width: "1.6fr" },
  { key: "nbCours", label: "Nb cours" },
  { key: "duree", label: "Durée" },
  { key: "statut", label: "Statut", statusColumn: true },
];

export default function Cursus() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [cursusList, setCursusList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    listCursus(token)
      .then((data) => {
        if (isMounted) setCursusList(data);
      })
      .catch(() => {
        // La liste reste vide si le backend est injoignable.
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  const rows = cursusList
    .filter((c) => c.nom.toLowerCase().includes(search.toLowerCase()))
    .map((c) => ({ ...c, duree: `${c.dureeMois} mois` }));

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
