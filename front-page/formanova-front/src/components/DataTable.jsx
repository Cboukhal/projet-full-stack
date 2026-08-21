import "./DataTable.css";

const SUCCESS_VALUES = ["actif", "validée", "validee"];
const WARNING_VALUES = ["forcée", "forcee"];
const DANGER_VALUES = ["suspendu", "annulée", "annulee"];

function statusClass(value) {
  const v = String(value).trim().toLowerCase();
  if (SUCCESS_VALUES.includes(v)) return "success";
  if (WARNING_VALUES.includes(v)) return "warning";
  if (DANGER_VALUES.includes(v)) return "danger";
  return "muted"; // ex: "Brouillon", "à venir"
}

/**
 * columns: [{ key, label, width?, statusColumn? }]
 * rows: [{ id, ...valeurs indexées par column.key }]
 */
export default function DataTable({ columns, rows, onRowClick }) {
  const gridTemplateColumns = columns.map((c) => c.width || "1fr").join(" ") + " 20px";

  return (
    <div className="data-table">
      <div className="data-table__row data-table__row--head" style={{ gridTemplateColumns }}>
        {columns.map((col) => (
          <span key={col.key}>{col.label}</span>
        ))}
        <span aria-hidden="true" />
      </div>

      {rows.map((row) => (
        <div
          key={row.id}
          className={"data-table__row" + (onRowClick ? " data-table__row--clickable" : "")}
          style={{ gridTemplateColumns }}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
        >
          {columns.map((col) => (
            <span
              key={col.key}
              className={col.statusColumn ? `data-table__status data-table__status--${statusClass(row[col.key])}` : undefined}
            >
              {row[col.key]}
            </span>
          ))}
          <span className="data-table__chevron" aria-hidden="true">
            ›
          </span>
        </div>
      ))}

      {rows.length === 0 && <p className="data-table__empty">Aucun résultat.</p>}
    </div>
  );
}
