import React from "react";
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Globe2,
  History,
  LayoutDashboard,
  LogOut,
  X,
} from "lucide-react";
import BrandMark from "../components/BrandMark.jsx";

export const NAV_GROUPS = [
  {
    title: "Pemantauan",
    items: [
      { id: "ringkasan", label: "Ringkasan", hash: "#ringkasan", icon: LayoutDashboard },
      { id: "pemeriksaan", label: "Pemindaian", hash: "#pemeriksaan", icon: Activity },
      { id: "hasil", label: "Hasil terbaru", hash: "#hasil", icon: FileSearch },
      { id: "riwayat", label: "Riwayat", hash: "#riwayat", icon: History },
    ],
  },
  {
    title: "Pengelolaan",
    items: [
      { id: "situs", label: "Manajemen situs", hash: "#situs", icon: Globe2 },
      { id: "jadwal", label: "Jadwal pemeriksaan", hash: "#jadwal", icon: Calendar },
    ],
  },
];

export function Sidebar({
  activeRoute = "ringkasan",
  onNavigate,
  onLogout,
  collapsed = false,
  onToggleCollapse,
  isDrawerOpen = false,
  isExpandedOverlay = false,
  onCloseDrawer,
  user = "admin",
}) {
  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleItemClick = (e, routeId) => {
    e.preventDefault();
    if (onNavigate) onNavigate(routeId);
    if (onCloseDrawer) onCloseDrawer();
  };

  // Drawer off-canvas mobile SELALU berlabel penuh (tidak pernah ciut),
  // apapun status ciut yang tersimpan di localStorage.
  const isEffectivelyCollapsed = collapsed && !isExpandedOverlay && !isDrawerOpen;

  const sidebarClasses = [
    "shell-sidebar",
    isEffectivelyCollapsed ? "shell-sidebar--collapsed" : "",
    isExpandedOverlay ? "shell-sidebar--expanded-overlay" : "",
    isDrawerOpen ? "shell-sidebar--drawer-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside
      className={sidebarClasses}
      aria-label="Navigasi utama"
      id="sidebar-navigation"
    >
      {/* 1. Header (Brand) */}
      <div className="shell-sidebar__header">
        <a
          href="#ringkasan"
          className="shell-sidebar__brand-link"
          onClick={(e) => handleItemClick(e, "ringkasan")}
          title="Content Detection - CSIRT Kabupaten Sumbawa"
        >
          {isEffectivelyCollapsed ? (
            <BrandMark variant="icon" onDark={true} />
          ) : (
            <BrandMark variant="compact" onDark={true} />
          )}
        </a>

        {/* Tombol Tutup Khusus Drawer Mobile */}
        <button
          type="button"
          className="shell-sidebar__close-btn"
          onClick={onCloseDrawer}
          aria-label="Tutup menu navigasi"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {/* 2. Navigasi Dikelompokkan */}
      <nav className="shell-sidebar__nav" aria-label="Menu navigasi">
        {NAV_GROUPS.map((group, groupIdx) => (
          <React.Fragment key={group.title}>
            {groupIdx > 0 && <div className="shell-nav-divider" aria-hidden="true" />}
            <div className="shell-nav-group">
              <div className="shell-nav-group__label" id={`group-label-${group.title}`}>
                {group.title}
              </div>
              {group.items.map((item) => {
                const isActive = activeRoute === item.id;
                const IconComponent = item.icon;
                return (
                  <a
                    key={item.id}
                    href={item.hash}
                    className={`shell-nav-item ${isActive ? "shell-nav-item--active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    title={isEffectivelyCollapsed ? item.label : undefined}
                    onClick={(e) => handleItemClick(e, item.id)}
                  >
                    <span className="shell-nav-item__icon" aria-hidden="true">
                      <IconComponent size={18} />
                    </span>
                    <span className="shell-nav-item__text">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </nav>

      {/* 3. Bagian Bawah: Info Pengguna & Kontrol */}
      <div className="shell-sidebar__bottom">
        <div className="shell-sidebar__user">
          <div className="shell-user-avatar" aria-hidden="true">
            {getInitials(user)}
          </div>
          {!isEffectivelyCollapsed && (
            <div className="shell-user-info">
              <span className="shell-user-info__name">{user || "Administrator"}</span>
              <span className="shell-user-info__role">Administrator</span>
            </div>
          )}
        </div>

        <div className="shell-sidebar__bottom-actions">
          {/* Tombol Keluar */}
          <button
            type="button"
            className="shell-sidebar__logout-btn"
            onClick={onLogout}
            aria-label="Keluar dari sesi"
            title="Keluar dari sesi"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Keluar</span>
          </button>

          {/* Tombol Ciutkan / Lebarkan (Desktop / Tablet) */}
          <button
            type="button"
            className="shell-sidebar__collapse-btn desktop-only"
            onClick={onToggleCollapse}
            aria-expanded={!isEffectivelyCollapsed}
            aria-label={
              isEffectivelyCollapsed
                ? "Perluas menu sidebar"
                : "Ciutkan menu sidebar"
            }
            title={
              isEffectivelyCollapsed
                ? "Perluas menu sidebar"
                : "Ciutkan menu sidebar"
            }
          >
            {isEffectivelyCollapsed ? (
              <ChevronRight size={18} aria-hidden="true" />
            ) : (
              <ChevronLeft size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
