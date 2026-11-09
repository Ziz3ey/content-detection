import React, { useEffect, useRef } from "react";
import {
  Bell,
  Check,
  CheckCheck,
} from "lucide-react";
import { formatTime } from "../formatters.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { IconButton } from "../components/Button.jsx";

export function NotificationMenu({
  notifications = [],
  unreadCount = 0,
  open = false,
  onToggle,
  onMarkRead,
  onMarkAllRead,
  onView,
  onOpenHistory,
}) {
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  // Keyboard accessibility: ESC closes panel and returns focus to trigger
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (onToggle) onToggle();
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      }
    }

    function handleClickOutside(event) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        if (onToggle) onToggle();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onToggle]);

  const getHostLabel = (value) => {
    try {
      return new URL(value).hostname;
    } catch {
      return value || "Situs Web";
    }
  };

  return (
    <div className="shell-notif">
      {/* Tombol Pemicu Notifikasi */}
      <button
        ref={triggerRef}
        type="button"
        className="shell-notif-btn"
        aria-label={`Notifikasi, ${unreadCount} belum dibaca`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onToggle}
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="shell-notif-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel Dropdown Menu Notifikasi */}
      {open && (
        <section
          ref={panelRef}
          className="shell-notif-panel"
          role="dialog"
          aria-label="Panel Notifikasi"
        >
          {/* Header Panel */}
          <div className="shell-notif-header">
            <div className="shell-notif-header__top">
              <h2 className="shell-notif-title">Notifikasi</h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="shell-notif-mark-all"
                  onClick={onMarkAllRead}
                >
                  <CheckCheck size={14} aria-hidden="true" />
                  Tandai semua dibaca
                </button>
              )}
            </div>
            <div className="shell-notif-smtp">
              <span>Layanan notifikasi email insiden aktif</span>
            </div>
          </div>

          {/* Isi Notifikasi */}
          {notifications.length === 0 ? (
            <p className="shell-notif-empty">Belum ada notifikasi.</p>
          ) : (
            <ul className="shell-notif-list" role="list">
              {notifications.map((notification) => {
                const isUnread = !notification.read;
                const hostName = getHostLabel(notification.url);
                const status =
                  notification.status ||
                  (notification.total > 0 ? "indicated" : "clean");
                const statusLabel =
                  status === "indicated"
                    ? "Indikasi"
                    : status === "failed"
                      ? "Gagal"
                      : "Bebas";

                const summaryText =
                  notification.categories && notification.categories.length > 0
                    ? notification.categories
                        .map(
                          (c) =>
                            `${c.label || c.category}: ${c.count || 1} temuan`,
                        )
                        .join(" · ")
                    : notification.total > 0
                      ? `${notification.total} temuan indikasi terdeteksi`
                      : "Pemindaian selesai tanpa indikasi temuan";

                const emailStatus =
                  notification.emailSent === false
                    ? "Email belum terkirim"
                    : "Email terkirim";

                const handleActivate = () => {
                  if (isUnread && onMarkRead) {
                    onMarkRead(notification.id);
                  }
                  if (onView) {
                    onView(notification);
                  }
                };

                return (
                  <li
                    key={notification.id}
                    className={`shell-notif-item ${isUnread ? "shell-notif-item--unread" : ""}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`Notifikasi ${hostName}, ${notification.total || 1} temuan`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleActivate();
                      }
                    }}
                    onClick={handleActivate}
                  >
                    {/* Kolom Kiri: Penanda Belum Dibaca (Titik 8px) */}
                    <div className="shell-notif-item__marker" aria-hidden="true">
                      {isUnread && <span className="shell-notif-item__dot" />}
                    </div>

                    {/* Kolom Isi (Minimal 240px) */}
                    <div className="shell-notif-item__content">
                      {/* Baris 1: StatusBadge kecil + Nama host situs */}
                      <div className="shell-notif-item__row1">
                        <StatusBadge status={status} size="sm">
                          {statusLabel}
                        </StatusBadge>
                        <span
                          className="shell-notif-item__host"
                          title={notification.url}
                        >
                          {hostName}
                        </span>
                      </div>

                      {/* Baris 2: Ringkasan temuan (maks 2 baris) */}
                      <div className="shell-notif-item__summary">
                        {summaryText}
                      </div>

                      {/* Baris 3: Meta satu baris */}
                      <div className="shell-notif-item__meta">
                        <span>{formatTime(notification.scannedAt)}</span>
                        <span aria-hidden="true">&bull;</span>
                        <span>{emailStatus}</span>
                      </div>
                    </div>

                    {/* Aksi Kanan Atas: IconButton Tandai Dibaca (khusus item belum dibaca) */}
                    {isUnread && (
                      <div className="shell-notif-item__action">
                        <IconButton
                          label="Tandai dibaca"
                          icon={Check}
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onMarkRead) onMarkRead(notification.id);
                          }}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer Panel */}
          <div className="shell-notif-footer">
            <a
              href="#riwayat"
              className="shell-notif-footer-link"
              onClick={(e) => {
                e.preventDefault();
                if (onToggle) onToggle();
                if (onOpenHistory) onOpenHistory();
                window.location.hash = "riwayat";
              }}
            >
              Buka riwayat pemindaian
            </a>
          </div>
        </section>
      )}
    </div>
  );
}

export default NotificationMenu;
