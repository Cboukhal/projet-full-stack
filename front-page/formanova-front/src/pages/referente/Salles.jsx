/** Liste des salles du référentiel (bâtiment, étage, numéro), avec accès à la création. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";
import { listSalles } from "../../api/sallesApi";

const COLUMNS = [
  { key: "numeroBatiment", label: "Bâtiment" },
  { key: "numeroEtage", label: "Étage" },
  { key: "numeroSalle", label: "Salle" },
];

export default function Salles() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [salles, setSalles] = useState([]);

  useEffect(() => {
    let isMounted = true;
    listSalles(token)
      .then((data) => {
        if (isMounted) setSalles(data);
      })
      .catch(() => {
        // La liste reste vide si le backend est injoignable.
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  // La recherche cible directement les numéros affichés, pas de champ texte dédié.
  const rows = salles.filter((s) =>
    `${s.numeroBatiment} ${s.numeroEtage} ${s.numeroSalle}`.includes(search.trim()),
  );

  return (
    <ReferenteLayout>
      <ListPageHeader
        title="Gestion des salles"
        subtitle="Bâtiment, étage et numéro de salle utilisés pour la planification."
        searchPlaceholder="Rechercher un numéro"
        searchValue={search}
        onSearchChange={setSearch}
        actionLabel="+ Nouvelle salle"
        onAction={() => navigate("/espace-referente/salles/nouveau")}
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        onRowClick={(row) => navigate(`/espace-referente/salles/${row.id}`)}
      />
    </ReferenteLayout>
  );
}
