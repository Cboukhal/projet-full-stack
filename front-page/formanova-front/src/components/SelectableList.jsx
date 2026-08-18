import "./SelectableList.css";

/**
 * items: [{ id, label, sublabel? }]
 */
export default function SelectableList({ items, selectedId, onSelect }) {
  if (items.length === 0) {
    return <p className="selectable-list__empty">Rien à ajouter — tout est déjà associé.</p>;
  }

  return (
    <div className="selectable-list">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={
            "selectable-list__item" +
            (item.id === selectedId ? " selectable-list__item--selected" : "")
          }
          onClick={() => onSelect(item.id)}
        >
          <span className="selectable-list__label">{item.label}</span>
          {item.sublabel && <span className="selectable-list__sublabel">{item.sublabel}</span>}
        </button>
      ))}
    </div>
  );
}
