import React from "react";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Inbox,
} from "lucide-react";

/**
 * FEEDBACK COMPONENTS: ALERT, SPINNER, EMPTY_STATE, PAGE_HEADER
 *
 * Props Alert:
 * - tone: "info" | "success" | "warning" | "danger" (default: "info")
 * - title: ReactNode (opsional)
 * - icon: LucideIcon component / ReactNode (opsional, default berdasarkan tone)
 * - action: ReactNode (slot aksi tombol opsional di kanan)
 * - onClose: function (opsional, menampilkan tombol silang tutup)
 * - children: ReactNode
 *
 * Props Spinner:
 * - size: "sm" | "md" | "lg" (default: "md")
 * - label: string (default: "Memuat...")
 *
 * Props EmptyState:
 * - icon: LucideIcon component / ReactNode
 * - title: ReactNode
 * - description: ReactNode
 * - action: ReactNode
 *
 * Props PageHeader:
 * - title: ReactNode (WAJIB)
 * - description: ReactNode
 * - breadcrumb: ReactNode
 * - action: ReactNode
 */

const ALERT_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
};

export function Alert({
  tone = "info",
  title,
  icon: customIcon,
  action,
  onClose,
  className = "",
  children,
  ...rest
}) {
  const IconComponent = customIcon || ALERT_ICONS[tone] || Info;
  const role = tone === "danger" || tone === "warning" ? "alert" : "status";

  return (
    <div
      role={role}
      className={["ui-alert", `ui-alert--${tone}`, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <div className="ui-alert__icon" aria-hidden="true">
        {React.isValidElement(IconComponent) ? (
          IconComponent
        ) : (
          <IconComponent size={18} />
        )}
      </div>

      <div className="ui-alert__content">
        {title && <h4 className="ui-alert__title">{title}</h4>}
        <div className="ui-alert__body">{children}</div>
      </div>

      {action && <div className="ui-alert__action">{action}</div>}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ui-alert__close"
          aria-label="Tutup pemberitahuan"
          title="Tutup pemberitahuan"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function Spinner({ size = "md", label = "Memuat data...", className = "" }) {
  const sizePx = size === "sm" ? 16 : size === "lg" ? 32 : 24;

  return (
    <div
      className={["ui-spinner-wrap", `ui-spinner-wrap--${size}`, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
    >
      <svg
        className="ui-spinner-svg"
        viewBox="0 0 24 24"
        width={sizePx}
        height={sizePx}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
      <span className="ui-spinner__text">{label}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "Tidak Ada Data",
  description,
  action,
  className = "",
}) {
  return (
    <div className={`ui-empty-state ${className}`}>
      <div className="ui-empty-state__icon" aria-hidden="true">
        {React.isValidElement(Icon) ? Icon : <Icon size={32} />}
      </div>
      <h3 className="ui-empty-state__title">{title}</h3>
      {description && (
        <p className="ui-empty-state__desc">{description}</p>
      )}
      {action && <div className="ui-empty-state__action">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  action,
  className = "",
}) {
  return (
    <header className={`ui-page-header ${className}`}>
      {breadcrumb && <div className="ui-page-header__breadcrumb">{breadcrumb}</div>}
      <div className="ui-page-header__main">
        <div className="ui-page-header__title-wrap">
          <h1 className="ui-page-header__title">{title}</h1>
          {description && (
            <p className="ui-page-header__description">{description}</p>
          )}
        </div>
        {action && <div className="ui-page-header__action">{action}</div>}
      </div>
    </header>
  );
}
