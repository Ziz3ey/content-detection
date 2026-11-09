import React from "react";

/**
 * CARD & STAT_CARD COMPONENTS
 *
 * Props Card:
 * - padding: "none" | "md" (default: "md")
 * - shadow: boolean (default: false, bila true menggunakan --shadow-1)
 * - className: string
 * - children: ReactNode
 *
 * Props CardHeader:
 * - title: ReactNode
 * - description: ReactNode
 * - action: ReactNode (slot aksi tombol di sebelah kanan)
 * - children: ReactNode
 *
 * Props StatCard:
 * - label: string (label kecil di atas)
 * - value: string | number (nilai angka utama)
 * - description: ReactNode (keterangan atau tren di bawah)
 * - tone: "default" | "danger" | "success" (default: "default")
 * - icon: LucideIcon component / ReactNode (opsional di sisi kanan)
 */

export function Card({
  padding = "md",
  shadow = false,
  className = "",
  children,
  ...rest
}) {
  const classNames = [
    "ui-card",
    `ui-card--padding-${padding}`,
    shadow ? "ui-card--shadow" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className = "",
  children,
  ...rest
}) {
  return (
    <div className={`ui-card-header ${className}`} {...rest}>
      <div className="ui-card-header__content">
        {title && <h3 className="ui-card-header__title">{title}</h3>}
        {description && (
          <p className="ui-card-header__description">{description}</p>
        )}
        {children}
      </div>
      {action && <div className="ui-card-header__action">{action}</div>}
    </div>
  );
}

export function CardBody({ className = "", children, ...rest }) {
  return (
    <div className={`ui-card-body ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...rest }) {
  return (
    <div className={`ui-card-footer ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  description,
  tone = "default",
  icon: Icon,
  className = "",
  ...rest
}) {
  return (
    <div className={`ui-stat-card ui-stat-card--${tone} ${className}`} {...rest}>
      <div className="ui-stat-card__main">
        <span className="ui-stat-card__label">{label}</span>
        <div className="ui-stat-card__value-wrap">
          <span className="ui-stat-card__value">{value}</span>
        </div>
        {description && (
          <span className="ui-stat-card__desc">{description}</span>
        )}
      </div>
      {Icon && (
        <div className="ui-stat-card__icon" aria-hidden="true">
          {React.isValidElement(Icon) ? Icon : <Icon size={20} />}
        </div>
      )}
    </div>
  );
}

export default Card;
