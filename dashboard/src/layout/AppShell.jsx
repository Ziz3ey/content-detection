import React, { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import { API_BASE_URL } from "../api.js";

const COLLAPSED_STORAGE_KEY = "content-detection:sidebar-collapsed";

export function AppShell({
  activeRoute = "ringkasan",
  onNavigate,
  user = "admin",
  onLogout,
  connection = "online",
  notifications = [],
  unreadCount = 0,
  notificationOpen = false,
  onToggleNotification,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onViewNotification,
  children,
}) {
  // 1. Status Ciut Sidebar (Khusus Desktop >= 1200px)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.innerWidth >= 1200) {
        return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";
      }
      return false;
    } catch {
      return false;
    }
  });

  // 2. Status Overlay Expanded (Khusus Tablet 768-1199px)
  const [isExpandedOverlay, setIsExpandedOverlay] = useState(false);

  // 3. Status Off-Canvas Drawer (Khusus Mobile < 768px)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const menuToggleRef = useRef(null);

  // Simpan preferensi ciut di localStorage HANYA saat di desktop (>= 1200px)
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.innerWidth >= 1200) {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
      }
    } catch {}
  }, [collapsed]);

  // Listener resize untuk reset status off-canvas & overlay saat berganti ukuran layar
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1200) {
        setIsExpandedOverlay(false);
        setIsDrawerOpen(false);
      } else if (window.innerWidth >= 768) {
        setIsDrawerOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock scroll body saat mobile drawer terbuka
  useEffect(() => {
    if (isDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isDrawerOpen]);

  // Keyboard accessibility: ESC closes drawer or expanded overlay, restores focus
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (isDrawerOpen) {
          event.preventDefault();
          setIsDrawerOpen(false);
          if (menuToggleRef.current) menuToggleRef.current.focus();
        } else if (isExpandedOverlay) {
          event.preventDefault();
          setIsExpandedOverlay(false);
          if (menuToggleRef.current) menuToggleRef.current.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, isExpandedOverlay]);

  // Handler toggle sidebar dari Topbar (Hamburger)
  const handleToggleFromTopbar = () => {
    if (window.innerWidth < 768) {
      setIsDrawerOpen((prev) => !prev);
    } else if (window.innerWidth < 1200) {
      setIsExpandedOverlay((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  // Handler toggle ciut/lebarkan dari Sidebar
  const handleToggleCollapse = () => {
    if (window.innerWidth >= 768 && window.innerWidth < 1200) {
      setIsExpandedOverlay((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  // Handler klik overlay latar belakang
  const handleOverlayClick = () => {
    setIsDrawerOpen(false);
    setIsExpandedOverlay(false);
    if (menuToggleRef.current) menuToggleRef.current.focus();
  };

  const isOverlayVisible = isDrawerOpen || isExpandedOverlay;

  return (
    <div className="shell-root">
      {/* Aksesibilitas: Tautan Lewati ke Konten Utama */}
      <a href="#main-content" className="shell-skip-link">
        Lewati ke konten utama
      </a>

      {/* Sidebar Navigasi Utama */}
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onLogout={onLogout}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        isDrawerOpen={isDrawerOpen}
        isExpandedOverlay={isExpandedOverlay}
        onCloseDrawer={() => {
          setIsDrawerOpen(false);
          setIsExpandedOverlay(false);
        }}
        user={user}
      />

      {/* Overlay Gelap untuk Mobile Drawer & Tablet Panel */}
      <div
        className={`shell-overlay ${isOverlayVisible ? "shell-overlay--visible" : ""}`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Wrapper Konten Utama */}
      <div className="shell-main-wrapper">
        <Topbar
          activeRoute={activeRoute}
          onToggleSidebar={handleToggleFromTopbar}
          connection={connection}
          notifications={notifications}
          unreadCount={unreadCount}
          notificationOpen={notificationOpen}
          onToggleNotification={onToggleNotification}
          onMarkNotificationRead={onMarkNotificationRead}
          onMarkAllNotificationsRead={onMarkAllNotificationsRead}
          onViewNotification={onViewNotification}
          onOpenHistory={() => onNavigate && onNavigate("riwayat")}
          user={user}
        />

        <main id="main-content" className="shell-content" tabIndex={-1}>
          <div className="shell-content-container">
            {children}
          </div>

          <footer className="app-footer">
            <span>CONTENT DETECTION</span>
            <span>Hasil merupakan indikasi berdasarkan aturan yang tersedia.</span>
            {import.meta.env?.DEV && (
              <span>
                API <code>{API_BASE_URL}</code>
              </span>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
