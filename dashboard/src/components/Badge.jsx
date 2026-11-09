import React from "react";

/**
 * BADGE COMPONENT
 *
 * Props:
 * - tone: "neutral" | "info" | "success" | "warning" | "danger" | "category" (default: "neutral")
 * - category: "gambling" | "fraud" | "pornography" | "link" | "defacement" (khusus tone="category")
 * - icon: LucideIcon component / ReactNode (opsional)
 * - dot: boolean (menampilkan dot indikator kecil)
 * - children: ReactNode (teks label badge)
 * - className: string
 */

export function Badge({
  tone = "neutral",
  category,
  icon: Icon,
  dot = false,
  children,
  className = "",
  ...rest
}) {
  const isCategory = tone === "category" && category;

  const classNames = [
    "ui-badge",
    isCategory ? `ui-badge--cat-${category}` : `ui-badge--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classNames} {...rest}>
      {dot && <span className="ui-badge__dot" aria-hidden="true" />}
      {Icon && (
        <span className="ui-badge__icon" aria-hidden="true">
          {React.isValidElement(Icon) ? Icon : <Icon size={12} />}
        </span>
      )}
      <span className="ui-badge__text">{children}</span>
    </span>
  );
}

export default Badge;
