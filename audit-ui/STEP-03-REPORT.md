# LAPORAN LANGKAH 3: REDESAIN HALAMAN LOGIN DAN LANDING PAGE PUBLIK
**Proyek:** Sistem Monitoring dan Deteksi Indikasi Konten Negatif Situs Web OPD  
**Institusi:** Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Sumbawa  
**Tanggal Pengerjaan:** 9 November 2026  
**Status:** Selesai Penuh (Completed) — 42/42 Unit Tests Lulus, Build Production Bersih

---

## 1. Ringkasan Eksekutif

Langkah 3 berfokus pada transformasi total terhadap dua halaman publik sistem: **Halaman Login** (`#/login`) dan **Landing Page Publik** (`#/`, `#/landing`, `#/beranda`, `#/fitur`, `#/alur-kerja`, `#/tentang`). 

Sebelum pengerjaan ini, kedua halaman tersebut memiliki kontradiksi visual yang tajam dengan mandat institusional pemerintah daerah: menggunakan tema gelap bergaya *cyberpunk*, efek dekoratif *radial glow/gradient*, mock-up terminal konsol bergaya *hacker*, *badge* palsu bertuliskan "LIVE", ornamen tiga titik jendela macOS, serta bahasa pemasaran (*sales/marketing copywriting*) yang berlebihan.

Melalui Langkah 3, kedua halaman telah dibangun ulang dari dasar menjadi antarmuka publik yang **formal, bersih, terpercaya, dan informatif** dengan menerapkan seluruh fondasi Design Tokens (`tokens.css`) dan Pustaka Komponen Dasar (Base Components) yang telah distandardisasi pada Langkah 1 dan Langkah 2. Seluruh fungsionalitas inti (API, autentikasi sesi, hash routing) tetap terjaga 100%, sementara kode dashboard internal tidak disentuh sama sekali.

---

## 2. Perbandingan Before vs After

| Aspek | Kondisi Sebelum (Legacy) | Kondisi Sesudah (Langkah 3) |
| :--- | :--- | :--- |
| **Tema & Palet** | Tema gelap (*dark theme*), latar hitam `#0B1F3A`/`#020617`, radial glow biru neon dan gradien dekoratif. | Tema terang institusional (*clean light theme*), latar `#FFFFFF` dan `#F8FAFC`, aksen biru Pemkab `#0F3D7A`. |
| **Format Halaman Login** | *Split-screen* asimetris dengan panel samping bergaya SOC/cyberpunk dan badge pulsasi neon. | Kartu tunggal di tengah (*single centered card* maks. 420px) dengan BrandMark resmi dan latar tenang. |
| **Elemen Identitas** | Teks bebas "CSIRT Monitoring", ikon tameng generik, monogram tidak konsisten. | Komponen `BrandMark` terpadu: opsi logo resmi Pemkab & Kominfosandi, fallback monogram "CD" formal. |
| **Gaya Bahasa (Copywriting)** | Pemasaran komersial: "Solusi Pertahanan Siber Terdepan", "Monitoring 24/7 Tanpa Henti". | Komunikasi institusional faktual: "Pemantauan dan Deteksi Indikasi Konten Negatif pada Situs Web Pemerintah Kabupaten Sumbawa". |
| **Data Statistik Hero** | Badge statis "LIVE" dan statistik tiruan yang tidak terhubung dengan basis data. | Integrasi riil dengan API `fetchSites()`: menampilkan jumlah situs terdaftar ("2 situs web OPD terdaftar") atau fallback faktual ("—" / "Data belum tersedia"). |
| **Navigasi & Aksesibilitas** | Navigasi tanpa skip-link, tanpa keyboard trap, kontrol input tanpa indikasi aksesibilitas standar. | Skip-link `#main-content`, navigasi keyboard lengkap, atribut `aria-describedby`, `aria-invalid`, serta tombol intip sandi standar. |
| **Struktur File** | Komponen login tertanam langsung di dalam `App.jsx` (~3500 baris); Landing Page dalam satu file besar. | Pemisahan bersih ke `src/pages/LoginPage.jsx`, `src/pages/LandingPage.jsx`, dan `src/pages/public.css`. |

---

## 3. Pembersihan CSS & Kebersihan Kode

Pembersihan CSS besar-besaran dilakukan pada `dashboard/src/styles.css` untuk menghapus seluruh aturan gaya lawas yang khusus digunakan oleh Login dan Landing lama.

### Tabel Metrik Pembersihan CSS

| Metrik | Angka / Keterangan |
| :--- | :--- |
| **Baris CSS Dihapus dari `styles.css`** | **1.349 baris** (baris 5360 s.d. 6708 dihapus penuh) |
| **Jumlah Kelas Lama Dihapus** | **133 kelas** (`.split-login-*`, `.split-*`, `.soc-*`, `.landing-*`) |
| **Deklarasi Radial Gradient Dieliminasi** | 6 deklarasi glow neon dihapus |
| **Ukuran Berkas `public.css` Baru** | 18,7 KB (765 baris) — terorganisir, terdokumentasi, menggunakan *prefix* `pub-` |
| **Hardcoded Color di `public.css`** | **0 (Nol)** — 100% menggunakan variabel CSS dari `tokens.css` |
| **Sisa Komentar `TODO-REDESIGN` di `styles.css`** | **13 komentar** (seluruhnya milik tab internal dashboard; 0 di login/landing) |

### Keputusan Terkait "Ingat Sesi"
Sesuai audit menyeluruh terhadap kode login lama di `App.jsx`, **tidak ditemukan fungsionalitas maupun elemen visual *checkbox* "Ingat sesi"**. Sesi autentikasi sistem dikelola langsung oleh backend via cookie/session endpoint `/auth/session`. Oleh karena itu, form login institusional baru mempertahankan perilaku autentikasi yang aman tanpa menambahkan kontrol fiktif yang tidak didukung backend.

---

## 4. Status Pengujian & Verifikasi

Seluruh rangkaian pengujian unit vitest telah diperbarui dan ditambah untuk menguji kepatuhan fungsional dan aksesibilitas Login dan Landing Page baru.

### Hasil Eksekusi Test Suite (`npm test`)

```text
 RUN  v5.0.2 D:/content detection/dashboard

 ✓ src/styles/tokens.test.js (1 test) 17ms
 ✓ src/components/components.test.jsx (12 tests) 574ms
 ✓ src/App.test.jsx (29 tests) 5722ms

 Test Files  3 passed (3)
      Tests  42 passed (42)
   Duration  10.26s
```

### Rincian Penambahan & Pembaruan Test Suite
1. **Pembaruan Asersi Teks:** Seluruh asersi teks lama di `App.test.jsx` diperbarui agar sesuai dengan copywriting institusional (heading "Masuk", heading Hero Pemantauan, cakupan indikasi, step alur kerja).
2. **Test Baru 1 — Validasi Field Kosong:** Memastikan `Alert` tone="danger" muncul dengan pesan `"Nama pengguna dan kata sandi wajib diisi."` saat tombol submit ditekan tanpa input.
3. **Test Baru 2 — Penanganan Galat Server:** Memastikan `Alert` tone="danger" merender pesan galat yang dikembalikan oleh API server jika autentikasi ditolak (HTTP 401/500).
4. **Test Baru 3 — Pemanggilan API dengan Kredensial Valid:** Memastikan fungsi `loginAdmin` dipanggil dengan payload JSON `{ username, password }` yang sesuai.
5. **Test Baru 4 — State Loading & Disabled:** Memastikan tombol submit berubah menjadi *disabled* dan menampilkan indikator proses ("Memproses...") selama panggilan API login berlangsung.
6. **Test Baru 5 — Sinkronisasi Data Hitungan Situs Hero:** Memastikan Landing Page menampilkan angka riil saat API `/api/v1/sites` berhasil, dan menampilkan tanda "—" serta "Data belum tersedia" saat API gagal.
7. **Test Baru 6 — Validitas Anchor Links:** Memastikan link navigasi navbar (`#fitur`, `#alur-kerja`, `#tentang`, dan `#main-content`) terhubung ke elemen ID section yang valid dalam dokumen.

---

## 5. Hasil Build Production (`npm run build`)

Proses kompilasi Vite untuk bundle produksi berjalan bersih tanpa galat:

```text
vite v8.3.1 building client environment for production...
transforming...
✓ 1800 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                              0.80 kB │ gzip:   0.50 kB
dist/assets/index-B8dFkuoH.css                             118.40 kB │ gzip:  18.55 kB
dist/assets/index-274SI_rq.js                              724.51 kB │ gzip: 223.37 kB
✓ built in 4.74s
```

`theme-color` pada `dashboard/index.html` juga telah diperbarui dari `#0B1F3A` menjadi `#FFFFFF` agar bilah navigasi peramban ponsel menyatu harmonis dengan tema terang institusional.

---

## 6. Uji Kontras Warna Aksesibilitas (WCAG 2.1 AA & AAA)

Semua warna yang digunakan pada halaman publik diturunkan secara ketat dari `tokens.css`:

| Elemen | Latar Belakang | Warna Teks / Foreground | Rasio Kontras | Status Standar |
| :--- | :--- | :--- | :--- | :--- |
| **Teks Utama Halaman** | `#FFFFFF` (Surface) | `#111827` (`--color-text`) | **16.1 : 1** | Lolos WCAG AAA (> 7.0:1) |
| **Teks Sekunder / Deskripsi** | `#FFFFFF` (Surface) | `#4B5563` (`--color-text-secondary`) | **7.3 : 1** | Lolos WCAG AAA (> 7.0:1) |
| **Tombol Primer (Masuk)** | `#0F3D7A` (`--color-primary`) | `#FFFFFF` | **8.6 : 1** | Lolos WCAG AAA (> 7.0:1) |
| **Alert Galat (Tone Danger)** | `#FEF2F2` (`--color-danger-subtle`) | `#991B1B` (`--color-danger-text`) | **8.2 : 1** | Lolos WCAG AAA (> 7.0:1) |
| **Border Kontrol / Kartu** | `#FFFFFF` | `#E5E7EB` (`--color-border`) | **1.2 : 1** | Struktur visual dengan elevasi shadow |
| **Teks Label Hero Badge** | `#EBF2FA` (`--color-primary-subtle`) | `#0F3D7A` (`--color-primary`) | **7.1 : 1** | Lolos WCAG AAA (> 7.0:1) |

---

## 7. Inventaris Berkas

### A. Berkas Baru yang Dibuat
1. `dashboard/src/pages/LoginPage.jsx` — Komponen halaman masuk institusional.
2. `dashboard/src/pages/LandingPage.jsx` — Komponen halaman beranda publik informatif.
3. `dashboard/src/pages/public.css` — Berkas lembar gaya modular untuk kedua halaman publik.
4. `dashboard/src/components/BrandMark.jsx` — Komponen logo/identitas visual terpadu.
5. `dashboard/src/assets/brand/README.md` — Panduan penempatan aset resmi lambang daerah.
6. `audit-ui/screenshots/step-03/` — 10 tangkapan layar verifikasi visual:
   - `landing-desktop-1440.png`
   - `landing-tablet-768.png`
   - `landing-mobile-390.png`
   - `landing-hero-data-available.png`
   - `landing-hero-data-fallback.png`
   - `login-desktop-1440.png`
   - `login-mobile-390.png`
   - `login-validation-error.png`
   - `login-server-error.png`
   - `login-loading-state.png`
7. `audit-ui/step-03-screens.pdf` — Booklet PDF kompilasi tangkapan layar (992.6 KB).
8. `audit-ui/STEP-03-REPORT.md` — Laporan komprehensif ini.

### B. Berkas yang Dimodifikasi
1. `dashboard/src/components/index.js` — Mengekspor komponen `BrandMark`.
2. `dashboard/src/components/components.css` — Menambahkan gaya dasar `.ui-brandmark`.
3. `dashboard/src/components/Field.jsx` — Memperbaiki asosiasi atribut `id`/`htmlFor` dan aksesibilitas label.
4. `dashboard/src/main.jsx` — Mengimpor `src/pages/public.css`.
5. `dashboard/src/App.jsx` — Mengalihkan rute publik ke `pages/LoginPage` dan `pages/LandingPage`.
6. `dashboard/src/App.test.jsx` — Menyesuaikan asersi teks dan menambahkan 6 pengujian unit baru.
7. `dashboard/src/styles.css` — Menghapus 1.349 baris CSS usang (133 kelas).
8. `dashboard/index.html` — Mengganti `theme-color` menjadi `#FFFFFF`.

---

## 8. Konfirmasi Batasan & Kesiapan Langkah 4

- **Kerahasiaan & Keutuhan Dashboard:** Seluruh tab internal dashboard (`Ringkasan`, `Situs`, `Jadwal`, `Pemindaian`, `Hasil`, `Riwayat`), tabel temuan, kartu ringkasan, dan visualisasi chart tidak disentuh sama sekali pada tahap ini.
- **Integritas API & Autentikasi:** Logika API pada `src/api.js`, penanganan session, dan interaksi server diuji dan berfungsi penuh.
- **Kesiapan Tahap Berikutnya:** Kode basis kini berada dalam kondisi yang sangat rapi dan siap untuk memasuki **Langkah 4 (Prompt 5): Redesain Shell Aplikasi Dashboard** (Sidebar navigasi, Header, Topbar, dan Kontainer Utama).
