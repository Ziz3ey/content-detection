import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Loader2,
  Clock,
  CheckCircle2,
  MinusCircle,
} from "lucide-react";
import { Badge } from "./Badge.jsx";

/**
 * STATUS_BADGE COMPONENT
 *
 * Mengkodekan status domain dengan teks label dan ikon wajib:
 * - status: "clean" | "indicated" | "failed" | "running" | "pending" | "active" | "inactive"
 * - children: ReactNode (opsional, menimpa teks default)
 * - className: string
 */

const STATUS_CONFIG = {
  clean: {
    label: "Bebas indikasi",
    tone: "success",
    Icon: ShieldCheck,
  },
  indicated: {
    label: "Terindikasi",
    tone: "danger",
    Icon: AlertTriangle,
  },
  failed: {
    label: "Gagal",
    tone: "danger",
    Icon: XCircle,
  },
  running: {
    label: "Berjalan",
    tone: "info",
    Icon: Loader2,
    spin: true,
  },
  pending: {
    label: "Menunggu",
    tone: "warning",
    Icon: Clock,
  },
  active: {
    label: "Aktif",
    tone: "success",
    Icon: CheckCircle2,
  },
  inactive: {
    label: "Nonaktif",
    tone: "neutral",
    Icon: MinusCircle,
  },
};

export function StatusBadge({ status = "clean", children, className = "", ...rest }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.clean;
  const displayText = children !== undefined ? children : config.label;
  const IconComponent = config.Icon;

  return (
    <Badge
      tone={config.tone}
      className={`ui-status-badge ui-status-badge--${status} ${className}`}
      {...rest}
    >
      <span className={`ui-status-badge__icon ${config.spin ? "is-spinning" : ""}`} aria-hidden="true">
        <IconComponent size={12} />
      </span>
      <span className="ui-status-badge__label">{displayText}</span>
    </Badge>
  );
}

export default StatusBadge;
