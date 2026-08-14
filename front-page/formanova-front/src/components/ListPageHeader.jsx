import "./ListPageHeader.css";

export default function ListPageHeader({
  title,
  subtitle,
  searchPlaceholder = "Rechercher",
  searchValue,
  onSearchChange,
  actionLabel,
  onAction,
}) {
  return (
    <div className="list-page-header">
      <h1 className="list-page-header__title">{title}</h1>
      {subtitle && <p className="list-page-header__subtitle">{subtitle}</p>}

      <div className="list-page-header__toolbar">
        <input
          type="text"
          className="list-page-header__search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />

        {actionLabel && (
          <button type="button" className="list-page-header__action" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
