import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";
import { listFilieres } from "../../api/filieresApi";

const COLUMNS = [
  { key: "nom", label: "Nom", width: "2fr" },
  { key: "nbCursus", label: "Nb cursus" },
  { key: "nbEleves", label: "Nb élèves" },
  { key: "statut", label: "Statut", statusColumn: true },
];

export default function Filieres() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [filieres, setFilieres] = useState([]);

  useEffect(() => {
    let isMounted = true;
    listFilieres(token)
      .then((data) => {
        if (isMounted) setFilieres(data);
      })
      .catch(() => {
        // La liste reste vide si le backend est injoignable.
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  const rows = filieres.filter((f) => f.nom.toLowerCase().includes(search.toLowerCase()));

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
