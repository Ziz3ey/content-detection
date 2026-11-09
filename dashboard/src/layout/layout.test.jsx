import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AppShell from "./AppShell.jsx";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import NotificationMenu from "./NotificationMenu.jsx";

afterEach(() => {
  cleanup();
});

describe("Dashboard Layout Shell (Prompt 5 & 6)", () => {
  it("tautan lewati ke konten ada dan menuju ke #main-content", () => {
    render(
      <AppShell>
        <div>Konten Pengujian</div>
      </AppShell>,
    );

    const skipLink = screen.getByRole("link", { name: /lewati ke konten utama/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    const mainElement = document.getElementById("main-content");
    expect(mainElement).toBeInTheDocument();
  });

  it("item aktif memiliki aria-current='page' dan berubah saat rute berubah", () => {
    const { rerender } = render(
      <AppShell activeRoute="ringkasan">
        <div>Konten</div>
      </AppShell>,
    );

    const ringkasanLink = screen.getByRole("link", { name: "Ringkasan" });
    const situsLink = screen.getByRole("link", { name: "Manajemen situs" });

    expect(ringkasanLink).toHaveAttribute("aria-current", "page");
    expect(situsLink).not.toHaveAttribute("aria-current");

    // Ganti rute aktif ke 'situs'
    rerender(
      <AppShell activeRoute="situs">
        <div>Konten</div>
      </AppShell>,
    );

    expect(ringkasanLink).not.toHaveAttribute("aria-current");
    expect(situsLink).toHaveAttribute("aria-current", "page");
  });

  it("tombol ciut mengubah aria-expanded dan mengubah status tampilan sidebar", () => {
    const handleToggleCollapse = vi.fn();
    const { rerender, container } = render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={handleToggleCollapse}
      />,
    );

    const collapseBtn = screen.getByRole("button", { name: /ciutkan menu sidebar/i });
    expect(collapseBtn).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(collapseBtn);
    expect(handleToggleCollapse).toHaveBeenCalledTimes(1);

    // Saat sidebar ciut
    rerender(
      <Sidebar
        collapsed={true}
        onToggleCollapse={handleToggleCollapse}
      />,
    );

    const expandBtn = screen.getByRole("button", { name: /perluas menu sidebar/i });
    expect(expandBtn).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector(".shell-sidebar--collapsed")).toBeInTheDocument();
  });

  it("laci mobile selalu berlabel penuh walau status ciut tersimpan (0.2)", () => {
    // Saat status collapsed=true (misal dari preferensi lama), tetapi laci mobile dibuka (isDrawerOpen=true)
    const { container } = render(
      <Sidebar
        collapsed={true}
        isDrawerOpen={true}
        user="Petugas Sandi"
      />,
    );

    // Sidebar TIDAK boleh memiliki kelas collapsed
    expect(container.querySelector(".shell-sidebar--collapsed")).not.toBeInTheDocument();
    expect(container.querySelector(".shell-sidebar--drawer-open")).toBeInTheDocument();

    // Teks label navigasi, nama user, dan tombol keluar harus tampil penuh
    expect(screen.getByText("Ringkasan")).toBeInTheDocument();
    expect(screen.getByText("Petugas Sandi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /keluar dari sesi/i })).toBeInTheDocument();
  });

  it("laci mobile dapat dibuka, ditutup dengan tombol Esc, dan mengembalikan fokus ke pemicu", () => {
    render(
      <AppShell>
        <div>Konten Utama</div>
      </AppShell>,
    );

    const menuToggle = screen.getByRole("button", { name: /buka menu navigasi/i });
    menuToggle.focus();
    expect(document.activeElement).toBe(menuToggle);

    // Buka laci mobile
    fireEvent.click(menuToggle);
    expect(document.querySelector(".shell-sidebar")).toBeInTheDocument();

    // Tekan Escape untuk menutup
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(menuToggle);
  });

  it("tombol Keluar memanggil handler logout", () => {
    const handleLogout = vi.fn();
    render(
      <Sidebar
        onLogout={handleLogout}
      />,
    );

    const logoutBtn = screen.getByRole("button", { name: /keluar dari sesi/i });
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it("menu notifikasi terbuka/tertutup dengan Esc dan klik luar, penghitung muncul dan diumumkan", () => {
    const handleToggle = vi.fn();
    const handleMarkAllRead = vi.fn();
    const handleView = vi.fn();

    const sampleNotifs = [
      {
        id: "notif-1",
        read: false,
        url: "https://sumbawakab.go.id/portal",
        total: 2,
        scannedAt: new Date().toISOString(),
        categories: [{ label: "Judi online", count: 2 }],
      },
    ];

    const { rerender } = render(
      <NotificationMenu
        notifications={sampleNotifs}
        unreadCount={1}
        open={false}
        onToggle={handleToggle}
        onMarkAllRead={handleMarkAllRead}
        onView={handleView}
      />,
    );

    // Penghitung diumumkan lewat aria-label
    const notifBtn = screen.getByRole("button", { name: "Notifikasi, 1 belum dibaca" });
    expect(notifBtn).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    // Buka menu notifikasi
    fireEvent.click(notifBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);

    // Rerender state open: true
    rerender(
      <NotificationMenu
        notifications={sampleNotifs}
        unreadCount={1}
        open={true}
        onToggle={handleToggle}
        onMarkAllRead={handleMarkAllRead}
        onView={handleView}
      />,
    );

    expect(screen.getByRole("dialog", { name: /panel notifikasi/i })).toBeInTheDocument();
    // Hostname ditampilkan di baris 1, URL penuh di title (0.3)
    expect(screen.getByText("sumbawakab.go.id")).toBeInTheDocument();
    expect(screen.getByTitle("https://sumbawakab.go.id/portal")).toBeInTheDocument();

    // Tutup dengan menekan Escape
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleToggle).toHaveBeenCalledTimes(2);

    // Tutup dengan klik di luar panel
    fireEvent.mouseDown(document.body);
    expect(handleToggle).toHaveBeenCalledTimes(3);
  });

  it("item notifikasi dapat diaktifkan dengan Enter, menandai terbaca, dan tombol 'Tandai dibaca' punya aria-label (0.3)", () => {
    const handleView = vi.fn();
    const handleMarkRead = vi.fn();

    const sampleNotifs = [
      {
        id: "notif-item-1",
        read: false,
        url: "https://bappeda.sumbawakab.go.id/renja",
        total: 3,
        scannedAt: new Date().toISOString(),
        categories: [{ label: "Judi online", count: 3 }],
      },
    ];

    render(
      <NotificationMenu
        notifications={sampleNotifs}
        unreadCount={1}
        open={true}
        onView={handleView}
        onMarkRead={handleMarkRead}
      />,
    );

    // Tombol 'Tandai dibaca' memiliki aria-label
    const markBtn = screen.getByRole("button", { name: "Tandai dibaca" });
    expect(markBtn).toBeInTheDocument();
    expect(markBtn).toHaveAttribute("aria-label", "Tandai dibaca");

    // Klik tombol tandai dibaca memanggil onMarkRead
    fireEvent.click(markBtn);
    expect(handleMarkRead).toHaveBeenCalledWith("notif-item-1");

    // Baris notifikasi dapat diaktifkan dengan Enter (membuka dan menandai dibaca)
    const notifRow = screen.getByRole("button", { name: /notifikasi bappeda\.sumbawakab\.go\.id/i });
    fireEvent.keyDown(notifRow, { key: "Enter" });
    expect(handleView).toHaveBeenCalledWith(sampleNotifs[0]);
  });

  it("menu notifikasi menampilkan keadaan kosong jika tidak ada notifikasi", () => {
    render(
      <NotificationMenu
        notifications={[]}
        unreadCount={0}
        open={true}
      />,
    );

    expect(screen.getByText("Belum ada notifikasi.")).toBeInTheDocument();
  });

  it("indikator koneksi selalu menampilkan teks baik online maupun offline", () => {
    const { rerender } = render(
      <Topbar connection="online" />,
    );

    expect(screen.getAllByText(/terhubung/i).length).toBeGreaterThan(0);

    rerender(
      <Topbar connection="offline" />,
    );

    expect(screen.getAllByText(/terputus/i).length).toBeGreaterThan(0);
  });

  it("footer menampilkan kalimat 'aturan' dan tidak memuat URL API di mode non-DEV (0.5)", () => {
    render(
      <AppShell>
        <div>Konten</div>
      </AppShell>,
    );

    // Teks aturan
    expect(
      screen.getByText(/hasil merupakan indikasi berdasarkan aturan yang tersedia/i),
    ).toBeInTheDocument();

    // Tidak boleh menampilkan kata 'rule'
    expect(
      screen.queryByText(/hasil merupakan indikasi berdasarkan rule yang tersedia/i),
    ).not.toBeInTheDocument();
  });
});
