import React from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Button } from "./Button.jsx";

/**
 * TABLE, TABLE_EMPTY, TABLE_SKELETON & PAGINATION
 *
 * Props Table:
 * - caption: string (caption tersembunyi secara visual untuk pembaca layar)
 * - maxHeight: string | number (bila diatur, kontainer memiliki scroll vertikal & header sticky)
 * - className: string
 * - children: ReactNode (thead, tbody, tfoot)
 *
 * Props TableRow:
 * - onRowClick: function (menjadikan baris dapat diklik & difokus dengan Enter/Space)
 * - isSelected: boolean
 * - className: string
 *
 * Props TableCell:
 * - numeric: boolean (perataan kanan + font Mono tabular-nums)
 * - className: string
 *
 * Props Pagination:
 * - page: number (1-based)
 * - pageSize: number
 * - total: number
 * - pageSizeOptions: number[] (default: [10, 25, 50])
 * - onChange: function({ page, pageSize })
 */

export function Table({
  caption,
  maxHeight,
  className = "",
  children,
  ...rest
}) {
  return (
    <div
      className={`ui-table-container ${maxHeight ? "has-max-height" : ""} ${className}`}
      style={maxHeight ? { maxHeight } : undefined}
      role="region"
      aria-label={caption || "Tabel Data"}
      tabIndex={0}
      {...rest}
    >
      <table className="ui-table">
        {caption && <caption className="ui-sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function TableRow({
  onRowClick,
  isSelected = false,
  className = "",
  children,
  ...rest
}) {
  const isInteractive = Boolean(onRowClick);

  const handleKeyDown = (e) => {
    if (isInteractive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onRowClick(e);
    }
  };

  return (
    <tr
      className={[
        "ui-table__row",
        isInteractive ? "is-clickable" : "",
        isSelected ? "is-selected" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onRowClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? "button" : undefined}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  numeric = false,
  className = "",
  children,
  as: Component = "td",
  ...rest
}) {
  return (
    <Component
      className={[
        "ui-table__cell",
        numeric ? "is-numeric" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function TableEmpty({
  icon: Icon = Inbox,
  title = "Tidak Ada Data",
  description = "Belum ada catatan atau data yang tersedia untuk ditampilkan.",
  action,
  colSpan = 6,
  className = "",
}) {
  return (
    <tr className={`ui-table__empty-row ${className}`}>
      <td colSpan={colSpan} className="ui-table__empty-cell">
        <div className="ui-table__empty-state">
          <div className="ui-table__empty-icon" aria-hidden="true">
            <Icon size={28} />
          </div>
          <h4 className="ui-table__empty-title">{title}</h4>
          {description && (
            <p className="ui-table__empty-desc">{description}</p>
          )}
          {action && <div className="ui-table__empty-action">{action}</div>}
        </div>
      </td>
    </tr>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
  className = "",
}) {
  return (
    <tbody className={`ui-table__skeleton-body ${className}`}>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={`skel-row-${rIdx}`} className="ui-table__skeleton-row">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={`skel-cell-${cIdx}`} className="ui-table__cell">
              <div
                className="ui-skeleton-bar"
                style={{
                  width: cIdx === 0 ? "30%" : cIdx === 1 ? "75%" : "50%",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function Pagination({
  page = 1,
  pageSize = 10,
  total = 0,
  pageSizeOptions = [10, 25, 50],
  onChange,
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(total, page * pageSize);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const handlePrev = () => {
    if (canPrev && onChange) {
      onChange({ page: page - 1, pageSize });
    }
  };

  const handleNext = () => {
    if (canNext && onChange) {
      onChange({ page: page + 1, pageSize });
    }
  };

  const handleSizeChange = (e) => {
    const newSize = Number(e.target.value);
    if (onChange) {
      onChange({ page: 1, pageSize: newSize });
    }
  };

  return (
    <div className={`ui-pagination ${className}`}>
      <div className="ui-pagination__info">
        <span>
          Menampilkan <strong>{startItem}</strong>–<strong>{endItem}</strong> dari <strong>{total}</strong> data
        </span>
      </div>

      <div className="ui-pagination__controls">
        {pageSizeOptions.length > 1 && (
          <div className="ui-pagination__size-select-wrap">
            <label htmlFor="ui-pagination-page-size" className="ui-pagination__size-label">
              Baris:
            </label>
            <select
              id="ui-pagination-page-size"
              value={pageSize}
              onChange={handleSizeChange}
              className="ui-pagination__size-select"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="ui-pagination__nav">
          <Button
            variant="secondary"
            size="sm"
            icon={ChevronLeft}
            disabled={!canPrev}
            onClick={handlePrev}
            aria-label="Halaman sebelumnya"
          >
            Sebelumnya
          </Button>
          <span className="ui-pagination__page-indicator" aria-current="page">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!canNext}
            onClick={handleNext}
            aria-label="Halaman berikutnya"
          >
            Berikutnya
            <ChevronRight size={14} className="ui-btn__icon-right" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Table;
