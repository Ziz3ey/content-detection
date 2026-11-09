import React from "react";
import {
  Menu,
} from "lucide-react";
import NotificationMenu from "./NotificationMenu.jsx";

const ROUTE_LABELS = {
  ringkasan: "Ringkasan",
  situs: "Manajemen situs",
  jadwal: "Jadwal pemeriksaan",
  pemeriksaan: "Pemindaian",
  hasil: "Hasil terbaru",
  riwayat: "Riwayat",
};

export function Topbar({
  activeRoute = "ringkasan",
  onToggleSidebar,
  connection = "online",
  notifications = [],
  unreadCount = 0,
  notificationOpen = false,
  onToggleNotification,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onViewNotification,
  onOpenHistory,
  user = "admin",
}) {
  const isOnline = connection === "online";
  const activeLabel = ROUTE_LABELS[activeRoute] || "Ringkasan";

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="shell-topbar" role="banner">
      {/* 1. Bagian Kiri: Tombol Menu (≤1024px) + Breadcrumb */}
      <div className="shell-topbar__left">
        <button
          type="button"
          className="shell-topbar__menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Buka menu navigasi"
          title="Buka menu navigasi"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <nav aria-label="Breadcrumb" className="shell-breadcrumb">
          <span className="shell-breadcrumb__root">Content Detection</span>
          <span className="shell-breadcrumb__sep" aria-hidden="true">/</span>
          <span className="shell-breadcrumb__current" aria-current="location">
            {activeLabel}
          </span>
        </nav>
      </div>

      {/* 2. Bagian Kanan: Indikator Koneksi + Notifikasi + Profil Ringkas */}
      <div className="shell-topbar__right">
        {/* Indikator Status Layanan: Teks Selalu Ada (Panjang di Desktop, Ringkas di Mobile) */}
        <div
          className="shell-connection"
          role="status"
          aria-label={isOnline ? "Layanan terhubung" : "Layanan tidak terhubung"}
          title={isOnline ? "Layanan terhubung" : "Layanan tidak terhubung"}
        >
          <span
            className={`shell-connection__dot ${isOnline ? "shell-connection__dot--online" : "shell-connection__dot--offline"}`}
            aria-hidden="true"
          />
          <span className="shell-connection__text shell-connection__text--desktop">
            {isOnline ? "Layanan terhubung" : "Layanan tidak terhubung"}
          </span>
          <span className="shell-connection__text shell-connection__text--mobile">
            {isOnline ? "Terhubung" : "Terputus"}
          </span>
        </div>

        {/* Menu Notifikasi */}
        <NotificationMenu
          notifications={notifications}
          unreadCount={unreadCount}
          open={notificationOpen}
          onToggle={onToggleNotification}
          onMarkRead={onMarkNotificationRead}
          onMarkAllRead={onMarkAllNotificationsRead}
          onView={onViewNotification}
          onOpenHistory={onOpenHistory}
        />

        {/* Profil Pengguna Ringkas */}
        <div className="shell-topbar__user desktop-only">
          <div className="shell-user-avatar" aria-hidden="true">
            {getInitials(user)}
          </div>
          <span className="shell-topbar__user-name">{user || "admin"}</span>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
