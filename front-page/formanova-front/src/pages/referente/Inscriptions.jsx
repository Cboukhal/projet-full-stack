import { useState } from "react";
import ReferenteLayout from "../../components/ReferenteLayout";
import ListPageHeader from "../../components/ListPageHeader";
import DataTable from "../../components/DataTable";
import InscriptionForm from "../../components/InscriptionForm";
import "./Inscriptions.css";

// TODO: remplacer par les vraies données du back
const INSCRIPTIONS = [
  { id: 1, eleve: "Camille Dubois", cible: "CDA — Promo 2026-A", type: "Promotion", statut: "Validée" },
  { id: 2, eleve: "Hugo Riva", cible: "SQL avancé", type: "Unité", statut: "Validée" },
  { id: 3, eleve: "Léa Fontaine", cible: "TSSR — Promo 2026-B", type: "Promotion", statut: "Validée" },
  { id: 4, eleve: "Nabil Kacem", cible: "JavaScript initiation", type: "Unité", statut: "Forcée" },
  { id: 5, eleve: "Emma Roussel", cible: "CDA — Promo 2026-A", type: "Promotion", statut: "Annulée" },
];

const COLUMNS = [
  { key: "eleve", label: "Élève" },
  { key: "cible", label: "Promotion / cours", width: "1.6fr" },
  { key: "type", label: "Type" },
  { key: "statut", label: "Statut", statusColumn: true },
];

export default function Inscriptions() {
  const [search, setSearch] = useState("");

  const rows = INSCRIPTIONS.filter((i) =>
    i.eleve.toLowerCase().includes(search.toLowerCase())
  );

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

          <DataTable
            columns={COLUMNS}
            rows={rows}
            onRowClick={(row) => console.log("TODO: détail inscription", row)}
          />
        </section>

        <InscriptionForm title="Nouvelle inscription" />
      </div>
    </ReferenteLayout>
  );
}
