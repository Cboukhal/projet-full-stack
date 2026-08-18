import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";
import InscriptionForm from "../../components/InscriptionForm";
import { listInscriptions } from "../../api/inscriptionsApi";
import "./Inscriptions.css";

const COLUMNS = [
  { key: "eleve", label: "Élève" },
  { key: "cible", label: "Promotion / cours", width: "1.6fr" },
  { key: "type", label: "Type" },
  { key: "statut", label: "Statut", statusColumn: true },
];

export default function Inscriptions() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [inscriptions, setInscriptions] = useState([]);

  const load = () => {
    listInscriptions(token).then(setInscriptions).catch(() => {});
  };

  useEffect(load, [token]);

  const rows = inscriptions.filter((i) => i.eleve.toLowerCase().includes(search.toLowerCase()));

  return (
    <ReferenteLayout>
      <div className="inscriptions-page">
        <section className="inscriptions-page__main">
          <ListPageHeader
            title="Gestion des inscriptions"
            subtitle="Élèves inscrits à une promotion ou à un cours à l'unité."
            searchPlaceholder="Rechercher un élève"
            searchValue={search}
            onSearchChange={setSearch}
          />

          <DataTable columns={COLUMNS} rows={rows} />
        </section>

        <InscriptionForm title="Nouvelle inscription" onDone={load} />
      </div>
    </ReferenteLayout>
  );
}
