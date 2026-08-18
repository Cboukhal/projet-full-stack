import AppShell from "./AppShell";
import ReferenteSidebar from "./ReferenteSidebar";
import "./ReferenteLayout.css";

export default function ReferenteLayout({ children }) {
  return (
    <AppShell>
      <div className="referente-layout">
        <ReferenteSidebar />
        <main className="referente-content">{children}</main>
      </div>
    </AppShell>
  );
}
