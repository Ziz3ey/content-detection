# LAPORAN LANGKAH 5 — PROMPT 6: Perbaikan Shell + Redesain Halaman Ringkasan

**Aplikasi**: Content Detection System — CSIRT Pemerintah Kabupaten Sumbawa  
**Tanggal**: 9 November 2026  
**Status Eksekusi**: Selesai Penuh (Tes: 68/68 Lulus, Build: Sukses 0 Galat, Zero Horizontal Overflow)

---

## 1. Temuan dan Perbaikan Butir 0.1 – 0.8 (Tahap 0)

### 0.1 Status sidebar tertukar / default salah di ≥1200px
- **Penyebab Akar**: Di `dashboard/src/layout/AppShell.jsx`, terdapat logic otomatis pada event resize `window.innerWidth < 1200` yang secara agresif menulis `localStorage.setItem(COLLAPSED_STORAGE_KEY, "true")`. Ketika browser kemudian dibuka pada ukuran 1440px desktop, status `true` yang tersimpan di `localStorage` terbawa, sehingga sidebar termuat dalam keadaan ciut (ikon saja).
- **Perbaikan Kode**:
  1. Di `AppShell.jsx`, persistence `localStorage` hanya diizinkan tersimpan saat pengguna secara eksplisit mengklik tombol ciutkan di viewport desktop (≥1200px).
  2. Nilai default sidebar pada desktop ≥1200px adalah `false` (Sidebar Penuh / expanded).
  3. Skrip verifikasi screenshot (`take-step06-and-pdf.js`) selalu membersihkan `localStorage.clear()` dan membuka konteks browser baru (`/json/new`) pada setiap skenario.
  4. Judul dan status sidebar pada tangkapan layar diturunkan secara dinamis dari keadaan DOM aktual (`aria-expanded` pada `.shell-sidebar__collapse-btn` dan class `.shell-sidebar--collapsed`), bukan ditulis manual.

### 0.2 Laci mobile (390px) menampilkan sidebar ciut tanpa label
- **Penyebab Akar**: Mode off-canvas (`isDrawerOpen`) membaca state `collapsed` umum tanpa isolasi. Jika status ciut tersimpan, sidebar laci mobile ikut merender markup ciut (hanya ikon, tanpa label teks navigasi, tanpa nama pengguna, dan tanpa label tombol Keluar).
- **Perbaikan Kode**:
  - Di `dashboard/src/layout/Sidebar.jsx`, ditambahkan logic `isEffectivelyCollapsed = collapsed && !isExpandedOverlay && !isDrawerOpen`.
  - Ketika `isDrawerOpen === true` (laci mobile), status ciut di-override sepenuhnya sehingga laci off-canvas selalu menampilkan teks lengkap: Brandmark penuh, label navigasi ("Ringkasan", "Pemindaian", dll.), nama pengguna ("Petugas Persandian"), dan tombol "Keluar".
  - Diuji dengan automated test di `layout.test.jsx`.

### 0.3 Tata letak item notifikasi rusak
- **Penyebab Akar**: Layout item notifikasi lama menggunakan layout flex horizontal sempit tanpa batas minimum yang jelas. Judul temuan dan URL target bertumpuk, tombol "Lihat detail" dan "Tandai dibaca" berebut ruang dengan teks informasi, dan tanggal/temuan terpotong.
- **Perbaikan Kode**:
  - Di `dashboard/src/layout/NotificationMenu.jsx`, setiap item notifikasi disusun ulang sebagai CSS Grid 3-kolom:
    - **Kolom Kiri**: Penanda belum dibaca (titik 8px warna primary di latar soft).
    - **Kolom Tengah**: Isi utama (min 240px pada desktop, lebar fleksibel di mobile) terdiri atas 3 baris terstruktur:
      - *Baris 1*: `StatusBadge` mini (`size="sm"`, "Terindikasi" / "Bebas indikasi" / "Gagal") + nama host situs OPD (URL lengkap di atribut `title` dengan teks semibold dan ellipsis).
      - *Baris 2*: Ringkasan temuan kategori (`--text-sm`, `--color-text-secondary`, line-clamp maksimal 2 baris).
      - *Baris 3*: Meta faktual (`--text-xs`, `--color-text-tertiary`): waktu pemindaian lokal + status pengiriman notifikasi email.
    - **Kolom Kanan**: Satu `IconButton` kecil "Tandai dibaca" (ikon `Check`, ukuran 32px, `label="Tandai dibaca"` wajib sebagai `aria-label` & `title`) khusus untuk item yang belum dibaca.
  - Seluruh baris notifikasi kini dapat difokus dengan keyboard (`tabIndex={0}`, `role="button"`) dan diaktifkan dengan `Enter` / `Space` / `Click` (otomatis menandai dibaca dan membuka detail riwayat). Tombol terpisah "Lihat detail" dihapus.
  - Lebar panel pada mobile adalah `calc(100vw - 32px)`.

### 0.4 Indikator koneksi di mobile hanya titik
- **Penyebab Akar**: Kelas CSS `.mobile-only` sebelumnya menyembunyikan elemen teks status koneksi di breakpoint `≤640px`.
- **Perbaikan Kode**:
  - Di `dashboard/src/layout/Topbar.jsx`, indikator koneksi kini selalu menyertakan teks di seluruh ukuran layar.
  - Desktop menampilkan versi panjang: "Layanan terhubung" / "Layanan tidak terhubung".
  - Mobile (≤640px) menampilkan versi ringkas: "Terhubung" / "Terputus".
  - `aria-label` tetap lengkap dan informatif ("Status layanan: Terhubung").

### 0.5 Footer dashboard membocorkan URL API & salah istilah
- **Penyebab Akar**: Footer menampilkan string `API http://localhost:3004` di seluruh environment dan menggunakan istilah bahasa Inggris "rule".
- **Perbaikan Kode**:
  - Di `dashboard/src/layout/AppShell.jsx`, URL API dibungkus kondisional `{import.meta.env?.DEV && ...}` sehingga tidak pernah bocor di build produksi.
  - Frasa "rule" diganti dengan istilah baku bahasa Indonesia: "aturan" ("Hasil merupakan indikasi berdasarkan aturan yang tersedia.").

### 0.6 Verifikasi nilai token sebenarnya & pencegahan drift
- **Verifikasi File Token**:
  - Nilai aktual di `dashboard/src/styles/tokens.css` dan `dashboard/src/styles/tokens.js`:
    - `--color-accent` = `#945E00` (disepakati, kontras 5.44:1 di atas putih).
    - `--color-danger` = `#B3261E` (disepakati, kontras 6.54:1 di atas putih).
  - Ditambahkan token terpisah untuk penanda aksen aktif di atas latar sidebar gelap:
    - `--color-accent-on-dark`: `#F59E0B` (kontras 7.69:1 di atas `#0B1F3A`, memenuhi standar WCAG AAA).
    - Disinkronkan ke `tokens.css`, `tokens.js`, dan divalidasi oleh `tokens.test.js`.

### 0.7 Data tiruan (mock-api.js) sesuai format API nyata
- **Penyebab Akar**: Data tiruan Langkah 4 menggunakan penamaan properti lama non-standar (`targetUrl`, `createdAt`, `source`) yang tidak cocok dengan parser `historyToPage()` di `App.jsx`, sehingga kolom URL kosong dan bertuliskan "Data tidak tersedia" pada screenshot.
- **Perbaikan Kode**:
  - `audit-ui/tools/mock-api.js` ditulis ulang 100% selaras dengan kontrak `dashboard/src/api.js` dan fixture `App.test.jsx`:
    - Properti: `url`, `scannedAt`, `scanSource` (`"SCHEDULED"` / `"MANUAL"`), `crawlStatus` (`"success"` / `"failed"`), `textDetection`, `linkDetection`, `defacementDetection`.
    - Disediakan 4 skenario data lengkap:
      - `normal`: 14 situs OPD Pemkab Sumbawa, 40 scan realistis, 1 crawl failure bertanda GAGAL.
      - `indicated`: 4 situs dengan temuan indikasi aktif (Judi online, Pornografi, Penipuan, Tautan mencurigakan, Defacement).
      - `empty`: 0 situs, 0 riwayat scan.
      - `error`: simulasi galat backend 500/503 dengan auth session tetap valid.

### 0.8 Irisan PDF kosong teratasi
- **Penyebab Akar**: Tangkapan layar pada viewport 1024px langsung memotong irisan sebelum `document.fonts.ready` selesai dan tanpa scroll reset (`window.scrollTo(0, 0)`), menghasilkan kotak abu-abu kosong pada irisan pertama.
- **Perbaikan Kode**:
  - Skrip menunggu `document.fonts.ready`, menunggu elemen target (`.ov-page` / `.pub-hero-card`), dan menjalankan `window.scrollTo(0, 0)` sebelum clipping.
  - Ditambahkan detektor irisan blank otomatis: jika ukuran file irisan PNG < 8KB pada irisan lanjutan, irisan dilewati dan dilaporkan.
  - Hasil pada Langkah 5: **0 irisan blank** ditemukan.

---

## 2. Keputusan Desain Halaman Ringkasan (Tahap 2)

1. **Header Halaman**:
   - Memakai komponen institucional `PageHeader` dengan `h1` "Ringkasan" dan deskripsi resmi: "Kondisi pemantauan situs web OPD berdasarkan pemindaian terbaru."
   - Aksi kanan: Tombol sekunder "Perbarui data" (ikon `RefreshCw`, status `loading` sinkron dengan pemuatan data) dan tombol primer "Mulai pemindaian" menuju `#/pemeriksaan`.
   - Menghapus hero card dekoratif lama ("PEMANTAUAN SITUS KABUPATEN SUMBAWA / Dashboard Monitoring"), kotak "SOC ENGINE AKTIF", dan "ENDPOINT API". Status koneksi telah terpusat di Topbar.

2. **Banner Kondisi (Conditional Banner)**:
   - Jika terdapat situs terindikasi (`sitesWithIndications > 0`): Menampilkan `Alert tone="danger"` ("N situs terindikasi pada pemindaian terbaru") dengan aksi tautan "Lihat hasil →" menuju `#/hasil`.
   - Jika ada pemindaian yang gagal (`failedScansCount > 0` dan tidak ada indikasi): Menampilkan `Alert tone="warning"` ("N pemindaian gagal dijalankan") dengan aksi tautan "Lihat riwayat →" menuju `#/riwayat`.
   - Jika kondisi bersih: Tidak ada banner yang ditampilkan untuk menjaga ketenangan visual petugas.

3. **Baris Metrik (StatCard)**:
   - 4 `StatCard` tersusun dalam grid adaptif (4 kolom ≥1200px, 2 kolom pada 768–1199px, 1 kolom pada <768px).
   - "Situs terdaftar": nilai `totalSites`, sub: "Situs OPD aktif dipantau", tone: default.
   - "Pemindaian terbaru": nilai `totalScans`, sub: "Dari riwayat pemeriksaan terakhir", tone: default.
   - "Situs terindikasi": nilai `sitesWithIndications`, sub: `sitesWithIndications > 0 ? "Perlu tindakan verifikasi" : "Tidak ada indikasi terdeteksi"`.
     - **Nada kartu**: `tone="danger"` **hanya bila nilai > 0**; pada nilai 0 bernada netral default (menghilangkan kesan alarm palsu).
   - "Situs bebas indikasi": nilai `Math.max(0, totalSites - sitesWithIndications)`, sub: "Kondisi aman dan bersih", tone: default.
   - Angka nilai menggunakan font Mono dengan `font-variant-numeric: tabular-nums;`. Fallback `"—"` saat memuat.
   - Seluruh chip status lama (`AKTIF`, `HISTORI`, `PERLU TINJAUAN`, `TERLINDUNGI`) dan ikon berlatar warna dekoratif telah dihapus.

4. **Grafik Analitik (`Visualizations.jsx`)**:
   - Disusun dalam 2 `Card` sejajar berdampingan pada layar ≥1024px, dan bertumpuk 1 kolom pada <1024px dengan tinggi kartu yang seragam.
   - **BarChart**:
     - Batang solid warna `--color-primary` (`#0F3D7A`), khusus batang hari ini memakai `--color-primary-hover` (`#0B3063`).
     - Sudut atas batang membulat halus (`rx="3"`), tanpa bayangan dan tanpa filter `feDropShadow` ("barGlow").
     - Garis grid horizontal 1px `--color-border-subtle`, sumbu Y integer (bilangan bulat).
     - Aksesibilitas: Keyboard focusable (`tabIndex={0}`, `role="img"`, `aria-label="<Hari>: <N> pemindaian"`).
     - State kosong: Menampilkan sumbu koordinat dengan teks netral terpusat "Belum ada pemindaian dalam 7 hari terakhir."
     - Dilengkapi tabel data alternatif tersembunyi visual (`.sr-only`) dan `aria-labelledby` ke judul kartu.
   - **DonutChart**:
     - Segmen solid sesuai token kategori `--color-cat-*` dengan pemisah 2px permukaan antar segmen.
     - Ketebalan cincin proporsional tipis (radius 68, stroke width 12px / ~17% radius).
     - Total temuan terpusat dalam angka Mono dengan label "temuan".
     - Legenda berupa daftar `<ul>`: swatch persegi 10px, nama kategori bahasa Indonesia baku ("Judi online", "Pornografi", "Penipuan", "Tautan mencurigakan", "Perubahan halaman"), jumlah temuan, dan persentase.
     - Setiap item legenda dapat difokus keyboard dan menyorot segmen terkait (hover/focus).
     - State nol temuan: Menampilkan ikon `CircleCheck` kecil dan teks "Tidak ada temuan pada riwayat pemindaian terbaru." (tanpa cincin kosong dan tanpa kotak hijau lama).
     - Dilengkapi tabel data alternatif tersembunyi visual (`.sr-only`).

5. **Tabel "Pemindaian terbaru"**:
   - Ditempatkan dalam `Card` dengan `CardHeader` (judul "Pemindaian terbaru", deskripsi "5 pemindaian terakhir", aksi tombol ghost "Lihat semua riwayat →").
   - Kolom:
     - **Situs**: Nama instansi OPD bila terdaftar, disertai host di bawahnya dalam font Mono `--text-xs` `--color-text-tertiary`.
     - **Waktu**: Format lokal Indonesia (fallback `"—"` bila data hilang).
     - **Sumber**: `Badge` netral ("Manual" / "Terjadwal").
     - **Hasil**: `StatusBadge` fungsional ("Bebas indikasi", "Terindikasi", atau "Gagal").
     - **Aksi**: Tombol ghost kecil "Detail" dengan ikon panah.
   - Baris dapat diklik dan difokus dengan keyboard (`onRowClick` pemicu `onViewHistory` dan navigasi ke `#riwayat`).
   - Pada layar kecil (≤640px): Kolom Waktu dan Sumber disembunyikan dari kolom terpisah dan otomatis dipindahkan menjadi baris meta kecil di bawah nama situs; tidak ada overflow horizontal.
   - State memuat: `TableSkeleton` 5 baris.
   - State kosong: `TableEmpty` "Belum ada pemindaian" dengan tombol aksi "Mulai pemindaian".
   - State galat: `Alert tone="danger"` dengan tombol aksi "Coba lagi".

---

## 3. Daftar Class CSS yang Dihapus dan Dipertahankan

### Class yang Dihapus dari `dashboard/src/styles.css` (Terbukti Eksklusif Ringkasan)
1. `.page-intro`, `.page-intro-main`, `.intro-copy`, `.eyebrow`, `.eyebrow-dot` (Digantikan oleh `PageHeader` dan `tokens.css`).
2. `.system-status-box`, `.status-box-header`, `.status-box-indicator`, `.api-base-row`, `.api-base-label`, `.api-base-code` (Status koneksi dipindahkan ke Topbar; URL API disembunyikan di production).
3. `.live-indicator-dot` (Diverifikasi melalui pencarian ke seluruh `src/`: hanya dipakai di header Ringkasan lama, 0 pengguna tersisa).
4. `.summary-grid`, `.summary-card`, `.summary-card--primary`, `.summary-card--indigo`, `.summary-card--warning`, `.summary-card--success`, `.summary-card-top`, `.summary-card-icon`, `.summary-card-body`, `.summary-card-label`, `.summary-card-value`, `.summary-card-sub`, `.summary-badge` (Digantikan oleh `StatCard` institucional di `overview.css`).
5. `.chart-grid`, `.chart-card`, `.chart-card-header`, `.chart-card-title`, `.chart-card-subtitle`, `.chart-header-tag`, `.chart-card-body`, `.chart-placeholder` (Digantikan oleh `ov-charts-grid` dan `Card` institucional).
6. `.visualizations`, `.visualizations-body`, `.bar-chart-container`, `.bar-chart-svg`, `.bar-rect`, `.bar-value`, `.bar-label`, `.chart-sub-hint`, `.chart-hover-indicator`, `.chart-empty-state`, `.chart-empty-icon`, `.chart-empty-heading`, `.chart-empty-text`, `.donut-chart-wrapper`, `.donut-svg-holder`, `.donut-chart-svg`, `.donut-slice`, `.visualizations-legend`, `.legend-item`, `.legend-swatch`, `.legend-label`, `.legend-val`, `.legend-pct`, `.donut-empty`, `.chart-empty-note`, `.empty-note-text` (Digantikan oleh class `ov-*` di `overview.css` dan `Visualizations.jsx`).
7. `.recent-activity-section` (Digantikan oleh `ov-recent-scans-section`).

### Class yang Dipertahankan di `dashboard/src/styles.css` (Masih Digunakan Tab Lain)
1. `.page-title` dan `.page-subtitle`: Dipertahankan karena masih dipakai di `ScheduleManagement.jsx`, `SiteManagement.jsx`, dan `App.jsx`.
2. `.table-wrap`, `.table`, `.table th`, `.table td`, `.url-cell`: Dipertahankan karena masih dipakai pada tab Riwayat dan Hasil.
3. `.badge-blue`, `.badge-gray`, `.badge-amber`, `.badge-green`, `.badge-red`: Dipertahankan karena dipakai aktif pada tab Riwayat, Hasil, dan filter badge.
4. `.results-summary-cards`, `.result-summary-card`, `.history-summary-cards`, `.history-summary-card`: Dipertahankan karena dipakai oleh tab Hasil Deteksi dan Riwayat Pemindaian.
5. `.empty-state-simple`: Dipertahankan sementara untuk kompatibilitas tab Riwayat.

---

## 4. Hasil Perhitungan Kontras (Dihitung Ulang dari File Token)

Kontras dihitung menggunakan formula WCAG 2.1 relative luminance langsung dari nilai di `dashboard/src/styles/tokens.js`:

$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

| Pasangan Warna | Nilai Hex Token | Rasio Kontras | Standar WCAG | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Aksen Daerah pada Latar Terang** | `--color-accent` (`#945E00`) di atas `--color-surface` (`#FFFFFF`) | **5.44 : 1** | WCAG AA Normal Text (≥4.5:1) | **LULUS** |
| **Status Bahaya pada Latar Terang** | `--color-danger` (`#B3261E`) di atas `--color-surface` (`#FFFFFF`) | **6.54 : 1** | WCAG AA Normal Text (≥4.5:1) | **LULUS** |
| **Aksen Aktif pada Sidebar Gelap** | `--color-accent-on-dark` (`#F59E0B`) di atas `--color-sidebar` (`#0B1F3A`) | **7.69 : 1** | WCAG AAA Normal Text (≥7.0:1) | **LULUS** |
| **Teks Navigasi pada Sidebar Gelap** | `--color-sidebar-text` (`#C9D3E3`) di atas `--color-sidebar` (`#0B1F3A`) | **10.94 : 1** | WCAG AAA Normal Text (≥7.0:1) | **LULUS** |
| **Teks Aktif / Ikon Putih di Sidebar** | White (`#FFFFFF`) di atas `--color-sidebar` (`#0B1F3A`) | **16.52 : 1** | WCAG AAA Normal Text (≥7.0:1) | **LULUS** |
| **Warna Utama pada Latar Terang** | `--color-primary` (`#0F3D7A`) di atas `--color-surface` (`#FFFFFF`) | **10.67 : 1** | WCAG AAA Normal Text (≥7.0:1) | **LULUS** |

---

## 5. Hasil Pengujian Otomatis dan Build

### Unit & Integration Tests (Vitest)
```
 ✓ src/layout/layout.test.jsx (11 tests) 2389ms
 ✓ src/pages/dashboard/overview.test.jsx (11 tests) 4102ms
 ✓ src/styles/tokens.test.js (1 test) 30ms
 ✓ src/components/components.test.jsx (15 tests) 1368ms
 ✓ src/App.test.jsx (30 tests) 17020ms

 Test Files  5 passed (5)
      Tests  68 passed (68)
   Duration  25.04s
```
Semua 68 tes lulus tanpa kegagalan atau regresi.

### Production Build (Vite)
```
✓ 1807 modules transformed.
dist/index.html                                              0.80 kB │ gzip:   0.50 kB
dist/assets/index-obJQVgjn.css                             125.58 kB │ gzip:  18.98 kB
dist/assets/index-Dhyl9Se6.js                              734.85 kB │ gzip: 226.73 kB
✓ built in 8.16s (exit code: 0)
```
Build produksi berhasil tanpa error.

---

## 6. Hasil Pengukuran Horizontal Overflow

Verifikasi overflow horizontal diukur menggunakan CDP di Google Chrome headless di seluruh skenario dan viewport. Data tersimpan di `audit-ui/overflow-verification-step06.json`:

| No | Halaman & Skenario | Viewport | `scrollWidth` | `innerWidth` | Hasil |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | 01. Ringkasan — 1440px Skenario Normal (Sidebar Penuh) | 1440px | 1440px | 1440px | **PASS (0 Overflow)** |
| 2 | 02. Ringkasan — 1440px Sidebar Ciut (Collapsed) (Sidebar Ciut) | 1440px | 1440px | 1440px | **PASS (0 Overflow)** |
| 3 | 03. Shell — 1440px Menu Notifikasi Terbuka (Sidebar Ciut) | 1440px | 1440px | 1440px | **PASS (0 Overflow)** |
| 4 | 04. Ringkasan — 1440px Skenario Terindikasi (Indicated) (Sidebar Penuh) | 1440px | 1440px | 1440px | **PASS (0 Overflow)** |
| 5 | 05. Ringkasan — 1440px Skenario Kosong (Empty State) (Sidebar Penuh) | 1440px | 1440px | 1440px | **PASS (0 Overflow)** |
| 6 | 06. Ringkasan — 1440px Skenario Galat Backend (Error State) (Sidebar Penuh) | 1440px | 1440px | 1440px | **PASS (0 Overflow)** |
| 7 | 07. Ringkasan — 1024px Tablet Skenario Normal (Sidebar Penuh) | 1024px | 1024px | 1024px | **PASS (0 Overflow)** |
| 8 | 08. Ringkasan — 1024px Tablet Skenario Terindikasi (Sidebar Penuh) | 1024px | 1024px | 1024px | **PASS (0 Overflow)** |
| 9 | 09. Ringkasan — 768px Tablet Skenario Normal (Sidebar Penuh) | 768px | 768px | 768px | **PASS (0 Overflow)** |
| 10 | 10. Ringkasan — 768px Tablet Skenario Terindikasi (Sidebar Penuh) | 768px | 768px | 768px | **PASS (0 Overflow)** |
| 11 | 11. Ringkasan — 390px Ponsel Skenario Normal (Sidebar Penuh) | 390px | 390px | 390px | **PASS (0 Overflow)** |
| 12 | 12. Shell — 390px Ponsel Laci Navigasi Terbuka (Laci Mobile Terbuka) | 390px | 390px | 390px | **PASS (0 Overflow)** |
| 13 | 13. Shell — 390px Ponsel Menu Notifikasi Responsif (Sidebar Penuh) | 390px | 390px | 390px | **PASS (0 Overflow)** |
| 14 | 14. Ringkasan — 390px Ponsel Skenario Terindikasi (Sidebar Penuh) | 390px | 390px | 390px | **PASS (0 Overflow)** |
| 15 | 15. Landing Page — 1024px Verifikasi Tidak Blank (Cacat 0.8) | 1024px | 1024px | 1024px | **PASS (0 Overflow)** |

**Kesimpulan Ukur**: Seluruh skenario dan ukuran layar memenuhi `scrollWidth <= innerWidth`. Zero horizontal overflow.

---

## 7. Daftar File Baru dan yang Diubah

### File Baru
1. `dashboard/src/pages/dashboard/OverviewPage.jsx` — Komponen halaman Ringkasan redesain lengkap.
2. `dashboard/src/pages/dashboard/overview.css` — Stylesheet berbasis token untuk halaman Ringkasan (class berawalan `ov-`).
3. `dashboard/src/pages/dashboard/overview.test.jsx` — 11 tes unit otomatis untuk interaksi dan a11y Ringkasan.
4. `audit-ui/overflow-verification-step06.json` — Laporan data ukur overflow horizontal.
5. `audit-ui/step-06-screens.pdf` — Buku PDF 25 halaman berisi tangkapan layar beririsan maksimal 1200px dan rasio terjaga.
6. `audit-ui/STEP-06-REPORT.md` — Laporan komprehensif langkah 5.

### File yang Diubah
1. `dashboard/src/Visualizations.jsx` — Didesain ulang sesuai token, SVG solid colors, accessible tables (`.sr-only`), keyboard support, penanganan zero findings baru.
2. `dashboard/src/layout/AppShell.jsx` — Perbaikan default collapse desktop, teks footer bahasa Indonesia "aturan", proteksi DEV environment untuk URL API.
3. `dashboard/src/layout/Sidebar.jsx` — Laci mobile selalu tampil penuh (`isEffectivelyCollapsed`).
4. `dashboard/src/layout/Topbar.jsx` — Teks status koneksi di mobile ("Terhubung" / "Terputus").
5. `dashboard/src/layout/NotificationMenu.jsx` — Rekonstruksi layout grid 3-kolom, aktivasi baris langsung, host title.
6. `dashboard/src/layout/layout.css` — Penyesuaian layout notifikasi, status koneksi mobile, token aksen sidebar.
7. `dashboard/src/layout/layout.test.jsx` — Penambahan pengujian otomatis untuk butir 0.2, 0.3, 0.5.
8. `dashboard/src/styles/tokens.css` — Penambahan token `--color-accent-on-dark: #F59E0B;`.
9. `dashboard/src/styles/tokens.js` — Penambahan `accentOnDark: "#F59E0B"`.
10. `dashboard/src/styles/tokens.test.js` — Sinkronisasi token JS/CSS.
11. `dashboard/src/styles.css` — Pembersihan class eksklusif Ringkasan lama.
12. `dashboard/src/App.jsx` — Integrasi `OverviewPage` terpisah dengan injeksi props state riwayat & refresh.
13. `dashboard/src/App.test.jsx` — Pembaruan asersi teks "Dashboard Monitoring" menjadi "Ringkasan" dan stat card labels.
14. `dashboard/src/main.jsx` — Import `overview.css`.
15. `audit-ui/tools/mock-api.js` — Penyesuaian schema data dan penanganan skenario error/normal/indicated/empty.

---

## 8. Hal yang Masih Lemah / Catatan Langkah Berikutnya

1. **Tab Lain Belum Diredesain**:
   - Tab Situs (`SiteManagement.jsx`), Jadwal (`ScheduleManagement.jsx`), Pemindaian, Hasil Deteksi, dan Riwayat Pemindaian masih menggunakan form workbench lama dan stylesheet legacy `styles.css`.
2. **Ketergantungan Polling Global**:
   - Polling job pemindaian latar belakang masih tertanam di level root `App.jsx`. Pada langkah redesain tab Pemindaian dan Riwayat berikutnya, status job dapat dikapsulkan lebih rapi ke custom hook khusus.
3. **Pembersihan CSS Bertahap**:
   - Class-class umum seperti `.table`, `.table-wrap`, dan varian `.badge-*` lama dipertahankan dengan sengaja di `styles.css` agar tidak merusak tampilan tab Hasil dan Riwayat sebelum tab tersebut diredesain.
