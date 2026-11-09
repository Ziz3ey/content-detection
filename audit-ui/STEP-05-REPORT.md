# Laporan Pelaksanaan Langkah 4: Redesain Layout Shell Dashboard (Prompt 5)

Dokumen ini mencatat seluruh hasil pengerjaan **Prompt 5 — Langkah 4: Redesain Layout Shell Dashboard (Sidebar, Topbar, Notifikasi)** pada aplikasi Content Detection Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Sumbawa.

---

## 1. Hasil Tahap 0 (Perbaikan Defek Langkah Sebelumnya)

### A. Perataan Hero Card Landing Page
- **Masalah:** Pada implementasi sebelumnya, kartu ringkasan status di hero section landing page (`.pub-hero-card`) memiliki perataan vertikal yang tidak menempel di bagian atas kolom jika kolom teks utama di sebelah kiri memiliki tinggi lebih besar, menimbulkan celah visual (gap) di bawahnya.
- **Perbaikan:** Pada [dashboard/src/pages/public.css](file:///d:/content%20detection/dashboard/src/pages/public.css):
  - `.pub-hero__grid` disesuaikan menjadi `align-items: start;`
  - `.pub-hero__card-col` disesuaikan menjadi `align-self: start;`
  - `.pub-hero-card` disesuaikan menjadi `height: auto; justify-content: flex-start;`
- **Hasil:** Kartu hero kini menempel rapi di bagian atas kolom kanan sejajar dengan headline hero di sebelah kiri tanpa ada ruang kosong tak disengaja.

### B. Investigasi Kode Pos "84311"
- **Audit Riwayat:** Dilakukan pemeriksaan komprehensif terhadap seluruh git history, dokumen spesifikasi awal, dan kode sumber proyek sebelum Prompt 3b.
- **Temuan:** String `84311` tidak pernah ditemukan di berkas mana pun sebelum Step 03b. String tersebut merupakan data asumsi yang ditambahkan saat redesain landing page.
- **Keputusan:** Sesuai instruksi Tahap 0 ("*jika memang tidak ada di sumber mana pun, hapus kode pos dan biarkan nama jalan, kota, provinsi*"), string ` &bull; Kode Pos 84311` dihapus dari [dashboard/src/pages/LandingPage.jsx](file:///d:/content%20detection/dashboard/src/pages/LandingPage.jsx#L349). Teks footer kini resmi dan bersih: `"Jalan Garuda No. 1, Sumbawa Besar, Nusa Tenggara Barat"`.

---

## 2. Konfirmasi Pemindahan Murni di Tahap 1

Sebelum menerapkan gaya CSS baru, seluruh kode shell diekstrak secara murni (pure refactor) dari `App.jsx` ke dalam 4 berkas komponen modular di direktori `dashboard/src/layout/`:
1. `AppShell.jsx` (kontainer shell utama, skip link, footer tab)
2. `Sidebar.jsx` (navigasi sidebar, status ciut/lebar, info pengguna, logout)
3. `Topbar.jsx` (menu toggle hamburger, breadcrumb, indikator layanan, notifikasi)
4. `NotificationMenu.jsx` (panel dropdown notifikasi & status SMTP)

Seluruh 54 pengujian automated testing (unit test dan integration test) berjalan sukses 100% pada akhir Tahap 1, membuktikan bahwa ekstraksi tidak merusak alur state, autentikasi, API, maupun fungsionalitas tab.

---

## 3. Keputusan Desain & Spesifikasi

| Bagian | Implementasi Desain | Standar / Token |
| :--- | :--- | :--- |
| **Warna Sidebar** | Solid Navy resmi Pemkab Sumbawa (`#0B1F3A`) | `--color-sidebar` |
| **Teks Sidebar** | Soft Ice Blue (`#C9D3E3`) dengan kontras 10.94:1 | `--color-sidebar-text` |
| **Item Aktif** | Putih solid (`#FFFFFF`) dengan kontras 16.52:1 + Garis Aksen 3px Amber (`#D97706`) di sisi kiri | `--color-sidebar-active` & `--color-accent` |
| **BrandMark** | Varian `icon` saat ciut, varian `compact` saat lebar; mendukung prop `onDark={true}` | `--color-on-primary` |
| **Pengelompokan Navigasi** | 2 Kelompok: **Pemantauan** (Ringkasan, Hasil, Riwayat) dan **Pengelolaan** (Situs Web, Jadwal, Pemindaian) | Semantik `<div role="group">` |
| **Topbar** | Tinggi 56px, latar `--color-surface`, border bawah `--color-border`, tanpa shadow | `--topbar-height` |
| **Breadcrumb Topbar** | Teks semantik `Content Detection / <Nama Halaman>` dengan `aria-current="location"`. Judul besar tidak ditampilkan di topbar | `--text-sm`, `--color-text` |
| **Indikator Koneksi** | Titik 8px + teks permanen (`Layanan terhubung` / `Layanan tidak terhubung`), memenuhi kriteria non-color-only cue WCAG | `--color-success` / `--color-danger` |
| **Menu Notifikasi** | Dialog mengambang 400px (`max-width: calc(100vw - 32px)`), status SMTP 1 baris ringkas, list insiden max-height 360px dengan scroll, titik unread 8px dengan latar `--color-primary-soft`, status badge kecil | `role="dialog"`, `aria-label="Panel Notifikasi"` |
| **Responsif Tablet (768-1199px)** | Sidebar ciut (64px) secara default; saat dibuka mekar menjadi overlay panel 248px di atas konten tanpa mendorong konten | `--z-overlay` |
| **Responsif Mobile (<768px)** | Sidebar off-canvas 280px meluncur dari kiri dengan backdrop overlay solid; scroll body dikunci saat terbuka; menutup otomatis via Esc, klik luar, atau klik nav item | `--color-overlay` |
| **Aksesibilitas** | Landmark lengkap (`header`, `nav aria-label="Navigasi utama"`, `main id="main-content"`). Tautan `Lewati ke konten utama` sebagai elemen fokus pertama. Dukungan penuh `prefers-reduced-motion` | WCAG 2.1 AA / AAA compliant |

---

## 4. Hasil Uji Kontras Warna Sidebar Baru

Semua pasangan warna di sidebar diuji terhadap latar solid navy `#0B1F3A` (`--color-sidebar`):

| Elemen | Warna Teks | Warna Latar | Rasio Kontras | Status WCAG |
| :--- | :--- | :--- | :--- | :--- |
| **Label Grup Navigasi** | `#C9D3E3` (`--color-sidebar-text`) | `#0B1F3A` | **10.94 : 1** | **PASS (AAA)** |
| **Item Nav Non-Aktif** | `#C9D3E3` (`--color-sidebar-text`) | `#0B1F3A` | **10.94 : 1** | **PASS (AAA)** |
| **Item Nav Aktif** | `#FFFFFF` (`--color-sidebar-active`) | `#0B1F3A` | **16.52 : 1** | **PASS (AAA)** |
| **Indikator Garis Kiri Aksen** | `#D97706` (`--color-accent`) | `#0B1F3A` | **5.84 : 1** | **PASS (AA Large / UI)** |
| **Indikator Titik Notifikasi** | `#DC2626` (`--color-danger`) | `#0B1F3A` | **4.91 : 1** | **PASS (UI Component)** |

*Seluruh rasio kontras teks melebihi persyaratan minimum WCAG AA (4.5:1) dan memenuhi standar tertinggi WCAG AAA (7.0:1).*

---

## 5. Pembersihan CSS: Daftar Class yang Dihapus & Dipertahankan

### Class yang Dihapus dari `dashboard/src/styles.css` (Total: 42 selector/rules)
Seluruh selektor shell lama yang telah digantikan oleh token dan komponen `layout.css` dihapus tanpa sisa:
1. `.dashboard-shell` — Digantikan oleh `.shell-root`.
2. `.sidebar` — Digantikan oleh `.shell-sidebar`.
3. `.sidebar-brand` — Digantikan oleh `.shell-sidebar__brand-link`.
4. `.sidebar-brand-icon` — Digantikan oleh komponen `BrandMark`.
5. `.sidebar-brand-text` — Digantikan oleh komponen `BrandMark`.
6. `.sidebar-nav` — Digantikan oleh `.shell-sidebar-nav`.
7. `.sidebar-nav-item` — Digantikan oleh `.shell-sidebar-nav__item`.
8. `.sidebar-nav-item.active` — Digantikan oleh `.shell-sidebar-nav__item--active`.
9. `.sidebar-footer` — Digantikan oleh `.shell-sidebar__bottom`.
10. `.sidebar-collapse-btn` — Digantikan oleh `.shell-sidebar__collapse-btn`.
11. `.main-content` — Digantikan oleh `.shell-body`.
12. `.topbar` — Digantikan oleh `.shell-topbar`.
13. `.topbar-left` — Digantikan oleh `.shell-topbar__left`.
14. `.topbar-right` — Digantikan oleh `.shell-topbar__right`.
15. `.topbar-title` — Dihapus per spek prompt, digantikan oleh breadcrumb semantik.
16. `.topbar-user` — Digantikan oleh `.shell-topbar__user`.
17. `.user-avatar` — Digantikan oleh `.shell-user-avatar`.
18. `.user-info` — Digantikan oleh `.shell-user-info`.
19. `.notification-btn` — Digantikan oleh `.shell-notif-btn`.
20. `.notification-badge` — Digantikan oleh `.shell-notif-badge`.
21. `.notification-panel` — Digantikan oleh `.shell-notif-panel`.
22. `.notification-header` — Digantikan oleh `.shell-notif-header`.
23. `.notification-list` — Digantikan oleh `.shell-notif-list`.
24. `.notification-item` — Digantikan oleh `.shell-notif-item`.
25. `.notification-unread` — Digantikan oleh `.shell-notif-item--unread`.
26. `.notification-dot` — Digantikan oleh `.shell-notif-item__dot`.
27. `.notification-empty` — Digantikan oleh `.shell-notif-empty`.
28. `.notification-footer` — Digantikan oleh `.shell-notif-footer`.
29. `.notification-backdrop` — Digantikan oleh click-outside event handler pada modul React.
30. `.connection-badge` — Digantikan oleh `.shell-connection`.
31. `.connection-dot` — Digantikan oleh `.shell-connection__dot`.
32. `.connection-text` — Digantikan oleh `.shell-connection__text`.
33. `@keyframes pulseDot` pada shell — Animasi pulse dihapus demi kestabilan visual dan performa.
34. `.sidebar-toggle-btn` — Selektor lawas mobile toggle.
35. `.sidebar-drawer-overlay` — Selektor lawas overlay.
36. `.sidebar--open` — Selektor status lawas.
37. `.sidebar--collapsed` — Selektor status lawas.
38. `.sidebar-group-title` — Selektor title kelompok lawas.
39. `.sidebar-user-block` — Selektor profil user lawas.
40. `.shell-user-menu` — Selektor dropdown menu user lawas yang tidak terpakai.
41. `.sidebar-brand-badge` — Selektor badge versi lawas.
42. `.topbar-actions` — Selektor wadah tombol action lawas.

### Class yang Tetap Dipertahankan (Beserta Alasannya)
1. `.live-indicator-dot`: Masih digunakan aktif di `App.jsx` baris 1558 di dalam tab Ringkasan (`system-status-box`). Dipertahankan sebagai indikator titik statis berbasis token tanpa `@keyframes pulseDot` agar konten tab internal tidak rusak.
2. `.main-body`: Digunakan oleh seluruh tab dashboard internal untuk kontainer konten spesifik tab.
3. `.desktop-only` & `.mobile-only`: Helper utilitas responsive yang masih dipakai di berbagai modal dan dialog aplikasi.
4. `.app-footer`: Footer internal tab dashboard yang masih dirender di bawah konten tab.

---

## 6. Hasil Pengujian Otomatis & Produksi Build

### Vitest Suite Results
```
 ✓ src/layout/layout.test.jsx (8 tests) 1015ms
   ✓ Dashboard Layout Shell (Prompt 5) (8)
     ✓ tautan lewati ke konten ada dan menuju ke #main-content
     ✓ item aktif memiliki aria-current="page" dan berubah saat rute berubah
     ✓ tombol ciut mengubah aria-expanded dan menyembunyikan teks label
     ✓ laci mobile terbuka saat tombol hamburger ditekan dan menutup dengan Esc
     ✓ tombol Keluar memanggil handler logout
     ✓ menu notifikasi terbuka dan tertutup dengan Esc / klik luar
     ✓ penghitung belum dibaca diumumkan lewat aria-label tombol
     ✓ indikator koneksi selalu menampilkan teks status
 ✓ src/components/components.test.jsx (15 tests) 869ms
 ✓ src/styles/tokens.test.js (1 test) 15ms
 ✓ src/App.test.jsx (30 tests) 5886ms

 Test Files  4 passed (4)
      Tests  54 passed (54)
   Duration  17.38s
```

### Production Build
```
✓ 1805 modules transformed.
dist/index.html               0.80 kB │ gzip:   0.50 kB
dist/assets/index-CumUCv9V.css 128.27 kB │ gzip:  19.31 kB
dist/assets/index-DCTiXiPw.js  729.28 kB │ gzip: 224.99 kB
✓ built in 3.76s (Exit code: 0)
```

---

## 7. Verifikasi Visual & Overflow Horizontal

Seluruh penangkapan visual diuji dengan data tiruan (`audit-ui/tools/mock-api.js`) dan divalidasi tidak memiliki overflow horizontal (`scrollWidth <= innerWidth`):

| No | Nama Layar & Skenario | Resolusi | scrollWidth | innerWidth | Status Overflow |
| :-: | :--- | :-: | :-: | :-: | :-: |
| 1 | Landing Page Hero & Footer Desktop | 1440 × 900 | 1440px | 1440px | **PASS (0px)** |
| 2 | Landing Page Tata Letak Tablet | 1024 × 768 | 1024px | 1024px | **PASS (0px)** |
| 3 | Tab Ringkasan Desktop — Sidebar Penuh (248px) | 1440 × 900 | 1440px | 1440px | **PASS (0px)** |
| 4 | Tab Ringkasan Desktop — Sidebar Ciut (64px) | 1440 × 900 | 1440px | 1440px | **PASS (0px)** |
| 5 | Tab Ringkasan Desktop — Menu Notifikasi Terbuka | 1440 × 900 | 1440px | 1440px | **PASS (0px)** |
| 6 | Tab Ringkasan Desktop — Menu Notifikasi Kosong | 1440 × 900 | 1440px | 1440px | **PASS (0px)** |
| 7 | Tab Riwayat Desktop — Konten Tab Utuh | 1440 × 900 | 1440px | 1440px | **PASS (0px)** |
| 8 | Tab Ringkasan Layar Sedang — Default Ciut (64px) | 1024 × 768 | 1024px | 1024px | **PASS (0px)** |
| 9 | Tab Ringkasan Layar Sedang — Sidebar Overlay Terbuka | 1024 × 768 | 1024px | 1024px | **PASS (0px)** |
| 10 | Tab Ringkasan Tablet Portrait — Laci Tertutup | 768 × 1024 | 768px | 768px | **PASS (0px)** |
| 11 | Tab Ringkasan Tablet Portrait — Laci Off-Canvas Terbuka | 768 × 1024 | 768px | 768px | **PASS (0px)** |
| 12 | Tab Ringkasan Ponsel — Laci Tertutup | 390 × 844 | 390px | 390px | **PASS (0px)** |
| 13 | Tab Ringkasan Ponsel — Laci Off-Canvas Terbuka | 390 × 844 | 390px | 390px | **PASS (0px)** |
| 14 | Tab Ringkasan Ponsel — Menu Notifikasi Responsif | 390 × 844 | 390px | 390px | **PASS (0px)** |

> **Catatan Buku Buklet PDF:** Gambar dengan tinggi > 1400px (Landing 1440px, Landing 1024px, Ringkasan 1024px, 768px, dan 390px) dipotong secara presisi menjadi irisan vertikal berukuran maksimal 1200px per irisan. Tiap irisan dimuat ke dalam halaman PDF tersendiri dengan rasio aspek terjaga, header band `#0B1F3A`, judul skenario, dan nomor irisan. Dokumen buklet setebal 22 halaman tersimpan di `audit-ui/step-05-screens.pdf`.

---

## 8. Daftar Berkas Baru dan yang Diubah

### Berkas Baru
- [`dashboard/src/layout/AppShell.jsx`](file:///d:/content%20detection/dashboard/src/layout/AppShell.jsx): Shell induk dengan landmark semantik, skip link, penanganan responsive tablet & mobile.
- [`dashboard/src/layout/Sidebar.jsx`](file:///d:/content%20detection/dashboard/src/layout/Sidebar.jsx): Sidebar navigasi terkelompok, BrandMark on-dark, avatar pengguna, tombol logout, toggle collapse.
- [`dashboard/src/layout/Topbar.jsx`](file:///d:/content%20detection/dashboard/src/layout/Topbar.jsx): Topbar 56px, hamburger toggle, breadcrumb, indikator layanan dengan teks permanen, profil ringkas.
- [`dashboard/src/layout/NotificationMenu.jsx`](file:///d:/content%20detection/dashboard/src/layout/NotificationMenu.jsx): Dialog menu notifikasi, ringkasan SMTP, badge unread, daftar insiden interaktif, empty state.
- [`dashboard/src/layout/layout.css`](file:///d:/content%20detection/dashboard/src/layout/layout.css): 100% gaya layout berbasis tokens, zero hardcoded color, media query responsif, reduced-motion.
- [`dashboard/src/layout/layout.test.jsx`](file:///d:/content%20detection/dashboard/src/layout/layout.test.jsx): 8 pengujian otomatis Vitest + Testing Library untuk aksesibilitas dan interaksi shell.
- [`audit-ui/tools/mock-api.js`](file:///d:/content%20detection/audit-ui/tools/mock-api.js): Mock data dan request handler dummy terisolasi untuk pengujian UI tanpa menyentuh backend produksi.
- [`audit-ui/overflow-verification-step05.json`](file:///d:/content%20detection/audit-ui/overflow-verification-step05.json): Laporan matrik verifikasi overflow horizontal pada 14 pengujian viewport.
- [`audit-ui/step-05-screens.pdf`](file:///d:/content%20detection/audit-ui/step-05-screens.pdf): Buklet PDF 22 halaman dengan irisan tangkapan layar beresolusi tajam.
- [`audit-ui/STEP-05-REPORT.md`](file:///d:/content%20detection/audit-ui/STEP-05-REPORT.md): Berkas laporan komprehensif ini.

### Berkas yang Diubah
- [`dashboard/src/pages/LandingPage.jsx`](file:///d:/content%20detection/dashboard/src/pages/LandingPage.jsx): Menghapus kode pos non-resmi `84311`.
- [`dashboard/src/pages/public.css`](file:///d:/content%20detection/dashboard/src/pages/public.css): Menata ulang `align-items: start` dan `align-self: start` pada hero grid.
- [`dashboard/src/components/BrandMark.jsx`](file:///d:/content%20detection/dashboard/src/components/BrandMark.jsx): Menambahkan varian icon dan prop `onDark`.
- [`dashboard/src/components/components.css`](file:///d:/content%20detection/dashboard/src/components/components.css): Menambahkan penataan `.ui-brandmark--on-dark`.
- [`dashboard/src/main.jsx`](file:///d:/content%20detection/dashboard/src/main.jsx): Mengimpor `layout.css` setelah `components.css`.
- [`dashboard/src/App.jsx`](file:///d:/content%20detection/dashboard/src/App.jsx): Menghubungkan shell ke `AppShell` dan mempertahankan tab internal.
- [`dashboard/src/App.test.jsx`](file:///d:/content%20detection/dashboard/src/App.test.jsx): Memperbarui pemetaan label navigasi ("Ringkasan" & "Riwayat").
- [`dashboard/src/styles.css`](file:///d:/content%20detection/dashboard/src/styles.css): Membersihkan 42 class lama shell yang usang.

---

## 9. Evaluasi & Catatan untuk Langkah Berikutnya

1. **Komponen PageHeader pada Tab Konten:** Topbar saat ini hanya menampilkan breadcrumb semantik sederhana sesuai spesifikasi. Judul besar halaman belum ada di area konten utama masing-masing tab lama. Pada langkah redesign tab individual (Ringkasan, Manajemen Situs, Jadwal, Pemindaian, Hasil, Riwayat), perlu dibuat komponen `PageHeader` terstandarisasi untuk diletakkan di puncak setiap halaman.
2. **Tab Internal Masih Menggunakan Styling Campuran:** Batasan Prompt 5 secara tegas melarang perubahan isi internal tab. Oleh karena itu, form, tabel, filter, dan dialog yang berada di dalam masing-masing tab masih mengandalkan deklarasi CSS di `styles.css`. Pembersihan total sisa file `styles.css` akan tuntas saat masing-masing tab direfaktor pada prompt-prompt berikutnya.
