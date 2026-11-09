# LAPORAN LANGKAH 4b: PERBAIKAN KUALITAS LANDING PAGE DAN LOGIN (SETELAH LANGKAH 3)

**Proyek:** Sistem Monitoring dan Deteksi Indikasi Konten Negatif Situs Web OPD  
**Institusi:** Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Sumbawa  
**Tanggal:** 9 November 2026  
**Status:** Selesai Penuh (Completed) — 46/46 Unit Tests Lulus, Build Production Bersih, Zero Horizontal Overflow

---

## 1. Temuan Investigasi Masalah (A1 – A4)

### A1. Overflow Horizontal & Tabel Cakupan di Mobile (≤ 768px)
* **Temuan Awal:** Pada viewport mobile (390px), tabel HTML standar dengan 2 atau 3 kolom kaku menyebabkan kolom deskripsi terpotong di tepi kanan layar atau memaksa peramban memunculkan scroll horizontal yang merusak estetika antarmuka.
* **Solusi & Implementasi:**
  - Ditambahkan media query responsif pada `.pub-scope-table` di `public.css` untuk layar `≤ 768px`.
  - Struktur tabel diubah menjadi **daftar kartu bertumpuk (*stacked list*)**: elemen `thead` disembunyikan (`display: none`), sedangkan setiap `tr.pub-scope-row` diubah menjadi flexbox vertikal berjarak aman.
  - Nama kategori tampil sebagai judul tebal (`font-size: var(--text-md)`), deskripsi faktual di bawahnya (`font-size: var(--text-15)`), dan metode pemeriksaan tampil sebagai catatan ringkas di bawah deskripsi (`Metode: [Metode]`).
* **Verifikasi Otomatis:** Diuji langsung di headless Chrome dan Vitest; terbukti `scrollWidth <= innerWidth` pada 390px, 768px, 1024px, dan 1440px dengan **Zero Horizontal Overflow**.

---

### A2. Analisis Footer Landing Page yang Tampak Kosong
* **Penyebab Utama:** Kode footer institusional pada `LandingPage.jsx` sebenarnya sudah terpasang lengkap sejak Langkah 3. Namun, pada tangkapan layar desktop sebelumnya, viewport tinggi dipatok secara statis pada `1950px`, sedangkan tinggi dokumen aktual adalah `2.473px`. Akibatnya, tangkapan layar terpotong tepat pada garis batas atas footer (`border-top`), sehingga teks footer tidak sempat masuk ke bidang bidik.
* **Perbaikan Konten Footer:**
  Footer diperkaya dan dilengkapi dengan seluruh pernyataan legal dan keterangan prototipe penelitian sesuai riwayat awal:
  1. **Identitas Instansi Lengkap:** Lambang BrandMark resmi, Dinas Komunikasi, Informatika, Statistik dan Persandian Pemerintah Kabupaten Sumbawa.
  2. **Alamat Kantor Resmi:** Jalan Garuda No. 1, Sumbawa Besar, Nusa Tenggara Barat, Kode Pos 84311.
  3. **Hak Cipta:** `© 2026 Pemerintah Kabupaten Sumbawa • Dinas Komunikasi, Informatika, Statistik dan Persandian. Hak cipta dilindungi undang-undang.`
  4. **Pernyataan Prototipe Penelitian:** *"Prototipe Penelitian — Dikembangkan untuk mendukung CSIRT Kabupaten Sumbawa dalam pemantauan integritas dan deteksi dini insiden siber pada situs web instansi daerah. Seluruh hasil pemindaian bersifat indikasi awal yang memerlukan verifikasi analis."*
* **Perbaikan Skrip Screenshot:** Skrip kini membaca tinggi render aktual dokumen (`document.documentElement.scrollHeight`) secara dinamis sebelum menangkap gambar, menjamin 100% footer tampak utuh.

---

### A3. Distorsi Rasio Aspek Gambar pada PDF
* **Penyebab:** Skrip generator PDF lama meregangkan dimensi gambar secara independen (`boxWidth` dan `boxHeight`) agar mengisi penuh kotak halaman tanpa memperhitungkan rasio aspek asli (*intrinsic aspect ratio*). Akibatnya, gambar bertipe *tall-mobile* (390px dengan tinggi ribuan pixel) ditarik melebar secara horizontal sehingga teks tampak melar.
* **Solusi & Implementasi:**
  - Skrip membaca dimensi pixel murni dari header biner PNG (*IHDR chunk*).
  - Skalasi dihitung seragam: `scale = Math.min(boxWidth / imgWidth, boxHeight / imgHeight)`.
  - Gambar diposisikan presisi di tengah bidang cetak A4 (portrait untuk halaman vertikal, landscape untuk desktop).
  - Berkas baru dikemas pada `audit-ui/step-03b-screens.pdf` (1.301,8 KB).

---

### A4. Temuan Keamanan Backend: Endpoint `GET /api/v1/sites` Terbuka Publik
* **Hasil Pemeriksaan Kode Backend:**
  Pemeriksaan terhadap `services/aggregator-service/src/routes/index.js` (baris 78–82) menemukan implementasi berikut:
  ```javascript
  // Site collection read endpoint - public for Landing Page and Dashboard synchronization
  if (pathname === "/api/v1/sites" && request.method === "GET") {
    await listSitesController(request, response, sites);
    return;
  }

  // All routes below require admin authentication
  const session = auth.authenticate(request);
  ```
* **Status Endpoint:** **TERBUKA TANPA LOGIN (PUBLIC ANONYMOUS ACCESS)**.
* **TEMUAN KEAMANAN (Information Disclosure / Sensitive Data Exposure):**
  Endpoint mengembalikan seluruh isi tabel `sites` melalui `sites.findAll()`:
  - `id`: ID internal database SQLite (UUID).
  - `name`: Nama instansi/OPD sasaran.
  - `url` & `allowedHost`: Alamat lengkap situs target pemantauan.
  - `status`: Status aktif/nonaktif target.
  - `maxDepth` & `maxPages`: Parameter teknis limitasi perayapan (*crawler quota*).
  - **`baselineHtml`**: Seluruh dokumen kode sumber HTML acuan yang tersimpan di server!
  
  Membuka endpoint ini secara anonim memungkinkan pihak luar memetakan target pemantauan internal Pemkab Sumbawa serta mengunduh basis data snapshot HTML tanpa autentikasi.
* **Tindakan Sesuai Mandat:**
  - **Backend TIDAK diubah** pada langkah ini (menjaga kepatuhan aturan).
  - Pemanggilan API `fetchSites()` dari `LandingPage.jsx` **dihapus sepenuhnya**.
  - Kartu hero diganti menjadi kartu statis non-numerik berjudul **"Ruang lingkup pemeriksaan"**.
  - **Rekomendasi Resmi:** Backend memerlukan endpoint publik minimal terisolasi, misalnya `GET /api/v1/public/stats`, yang hanya mengembalikan agregasi numerik `{ activeSitesCount: 2 }` tanpa membocorkan daftar URL, parameter crawl, maupun baseline HTML.

---

## 2. Perbaikan Desain & Tipografi (B1 – B6)

### B1. Skala Tipografi Institusional
* **Penambahan Token Desain (`tokens.css` & `tokens.js`):**
  - `--text-15: 15px;` (deskripsi tabel dan daftar)
  - `--text-28: 28px;` (judul `h2` seksi)
  - `--text-4xl: 40px;` (judul `h1` hero desktop)
* **Penerapan Skala Baru:**
  - Paragraf hero: `18px` (`--text-lg`), panjang baris dibatasi maks. `68ch`.
  - `h1` hero: `40px` (`--text-4xl`) di desktop, `30px` (`--text-3xl`) di mobile.
  - Judul seksi `h2`: `28px` (`--text-28`) di desktop, `24px` di mobile.
  - Deskripsi tabel & alur kerja: `15px` (`--text-15`), `color: var(--color-text-secondary)`.
  - Spasi vertikal antar-seksi: `64px` (desktop), `48px` (mobile).
  - Login: tinggi input & tombol `40px`, teks form `14–15px`.

### B2. Penghapusan Badge Kategori & Penambahan Kolom Metode
* Seluruh badge warna-warni yang redundan ("Gambling", "Fraud", "Link Anomali", dll.) **telah dihapus**.
* Ditambahkan kolom ketiga **"Metode"** berupa teks netral formal (`--color-text-tertiary`):
  - Judi online &rarr; *"Pencocokan kata kunci"*
  - Pornografi &rarr; *"Pencocokan kata kunci"*
  - Penipuan &rarr; *"Pencocokan kata kunci"*
  - Tautan atau elemen mencurigakan &rarr; *"Aturan URL dan HTML"*
  - Perubahan halaman &rarr; *"Perbandingan dengan kondisi acuan"*
* Di tampilan mobile, kolom metode bertransformasi menjadi label baris kecil `Metode: [Metode]` di bawah deskripsi.

### B3. Perbaikan Deskripsi Faktual Sesuai Kode Sumber Microservices
Seluruh deskripsi pada Landing Page diverifikasi silang langsung dengan kode repositori:

| Kategori | Deskripsi Baru yang Faktual | Bukti Kode Implementasi |
| :--- | :--- | :--- |
| **Judi online** | Mencocokkan teks, judul, dan atribut dokumen halaman dengan daftar kata kunci promosi perjudian, taruhan daring, togel, dan slot. | `services/text-detection-service/src/config/patterns.js:2-14` (`CATEGORY_PATTERNS.gambling`) |
| **Pornografi** | Mencocokkan teks dan elemen dokumen halaman dengan daftar kata kunci dan istilah vulgar konten pornografi (analisis berbasis teks, tidak memproses citra atau video). | `services/text-detection-service/src/config/patterns.js:15-24` (`CATEGORY_PATTERNS.pornography`) |
| **Penipuan** | Mencocokkan teks halaman dengan pola klaim hadiah palsu, undian tanpa izin, bantuan dana fiktif, dan tawaran pinjaman online ilegal. | `services/text-detection-service/src/config/patterns.js:25-34` (`CATEGORY_PATTERNS.fraud`) |
| **Tautan atau elemen mencurigakan** | Memeriksa tautan keluar terhadap aturan anomali struktur URL, penggunaan alamat IP langsung, penyematan kredensial, dan domain berisiko. | `services/link-detection-service/src/detectors/` (7 detektor: `credentials`, `encoded-structure`, `ip-hostname`, `subdomain`, `suspicious-hostname`, `suspicious-path`, `url-length`) |
| **Perubahan halaman (defacement)** | Membandingkan nilai hash SHA-256 dan judul halaman terhadap data acuan baseline yang tersimpan, serta mendeteksi kata kunci umum peretasan. | `services/defacement-service/src/detectors/` (`content-hash-detector.js`, `title-detector.js`, `pattern-detector.js`) |

> **Catatan B3:** Istilah nama algoritma internal (*"Aho-Corasick"*) telah dihapus sepenuhnya dari seluruh teks publik landing page.

### B4. Ritme Visual & Hierarki
- **Hero:** Latar putih bersih (`--color-surface`) dengan **garis aksen emas institusional** (`--color-accent` #945E00, tinggi 3px, lebar 48px) tepat di atas label kecil sistem.
- **Alternasi Seksi:** Latar abu-abu tenang (`--color-bg` #F1F3F6) hanya diaplikasikan pada Seksi Cakupan Pemeriksaan (`#fitur`), sedangkan Seksi Hero, Cara Kerja, Catatan, dan Footer berlatar putih bersih (`--color-surface`).
- **Jarak Tipografi:** Jarak judul seksi ke deskripsi disetel `12px`, dan jarak grup judul ke konten adalah `32px`.
- **Nomor Langkah Cara Kerja:** Ditampilkan lebih tegas dengan font IBM Plex Mono 14px tebal (`--color-primary`), dilengkapi garis atas 2px `--color-primary` pada setiap kartu langkah.

### B5. Hero Card Kanan: "Ruang lingkup pemeriksaan"
- Judul kartu: `<h2>Ruang lingkup pemeriksaan</h2>` (`font-size: var(--text-md)`).
- Menampilkan 3 baris faktual dengan ikon Lucide 16px berwarna `--color-primary` (tanpa lingkaran latar):
  1. `<FileText />` Teks dan elemen HTML halaman
  2. `<ExternalLink />` Tautan dan pengalihan
  3. `<GitCompare />` Perubahan halaman terhadap kondisi acuan
- Tinggi kartu disejajarkan penuh dengan blok hero sebelah kiri menggunakan flexbox `align-items: stretch`.

### B6. Penyempurnaan Halaman Login
- Placeholder redundan ("Masukkan nama pengguna", "Masukkan kata sandi") telah dihapus; field dibiarkan bersih.
- Posisi kartu login diatur pada `~38%` tinggi viewport menggunakan `padding-top: clamp(32px, 12vh, 96px)`, sehingga tidak mengambang canggung di tengah layar tinggi.
- Teks proses login ("Memproses...") dilengkapi dengan atribut aksesibilitas `aria-live="polite"` untuk pembaca layar.

### B7. Pengujian Dinamis Komponen BrandMark
- Dilakukan uji coba penempatan file SVG sementara `dashboard/src/assets/brand/logo-pemkab.svg`.
- Komponen `BrandMark` terbukti sukses mendeteksi berkas SVG melalui `import.meta.glob` dan merender tag `<img>` resmi ber-alt `"Lambang Pemerintah Kabupaten Sumbawa"`.
- Setelah pengujian unit selesai, file SVG uji sementara dihapus kembali. Komponen kembali menampilkan monogram fallback institusional `"CD"` dengan sempurna.

---

## 3. Hasil Verifikasi Pengujian & Build

### Hasil Eksekusi Test Suite (`npm test`)

```text
 RUN  v5.0.2 D:/content detection/dashboard

 ✓ src/styles/tokens.test.js (1 test) 24ms
 ✓ src/components/components.test.jsx (15 tests) 672ms
 ✓ src/App.test.jsx (30 tests) 5024ms

 Test Files  3 passed (3)
      Tests  46 passed (46)
   Duration  20.12s
```
*Seluruh 46 pengujian lulus 100%.*

### Hasil Verifikasi Build Produksi (`npm run build`)
Kompilasi produksi Vite berhasil sempurna dalam 3.69 detik:
```text
vite v8.3.1 building client environment for production...
✓ 1800 modules transformed.
dist/index.html               0.80 kB │ gzip:  0.50 kB
dist/assets/index-BC2CIIQL.css 120.97 kB │ gzip: 18.98 kB
dist/assets/index-B3_x_Yf8.js 724.14 kB │ gzip: 223.43 kB
✓ built in 3.69s
```

---

## 4. Laporan Verifikasi Horizontal Overflow (A1 & C3)

Pengujian layout nyata dilakukan di Chromium Headless pada seluruh ukuran layar:

| Halaman | Viewport | Lebar Konten (`scrollWidth`) | Lebar Layar (`innerWidth`) | Status Overflow |
| :--- | :---: | :---: | :---: | :---: |
| **Landing Page** | 1440 x 900 px | 1440 px | 1440 px | **PASS (Zero Overflow)** |
| **Landing Page** | 1024 x 768 px | 1024 px | 1024 px | **PASS (Zero Overflow)** |
| **Landing Page** | 768 x 1024 px | 768 px | 768 px | **PASS (Zero Overflow)** |
| **Landing Page** | 390 x 844 px | 390 px | 390 px | **PASS (Zero Overflow)** |
| **Login Page** | 1440 x 900 px | 1440 px | 1440 px | **PASS (Zero Overflow)** |
| **Login Page** | 390 x 844 px | 390 px | 390 px | **PASS (Zero Overflow)** |

Data tersimpan dalam file JSON: [`audit-ui/overflow-verification.json`](file:///d:/content%20detection/audit-ui/overflow-verification.json).

---

## 5. Inventaris Berkas yang Dimodifikasi & Baru

1. **Berkas yang Dimodifikasi:**
   - [`dashboard/src/styles/tokens.css`](file:///d:/content%20detection/dashboard/src/styles/tokens.css): Penambahan token `--text-15`, `--text-28`, `--text-4xl`.
   - [`dashboard/src/styles/tokens.js`](file:///d:/content%20detection/dashboard/src/styles/tokens.js): Sinkronisasi objek tipografi.
   - [`dashboard/src/pages/LandingPage.jsx`](file:///d:/content%20detection/dashboard/src/pages/LandingPage.jsx): Hapus `fetchSites`, kartu statis hero, aksen emas, tabel 3-kolom tanpa badge, deskripsi faktual, footer lengkap.
   - [`dashboard/src/pages/LoginPage.jsx`](file:///d:/content%20detection/dashboard/src/pages/LoginPage.jsx): Hapus placeholder redundan, `aria-live="polite"` pada loading submit.
   - [`dashboard/src/pages/public.css`](file:///d:/content%20detection/dashboard/src/pages/public.css): Penyesuaian tipografi, tabel bertumpuk di mobile, posisi kartu login ~38%, padding seksi 64px/48px, garis aksen hero.
   - [`dashboard/src/components/components.test.jsx`](file:///d:/content%20detection/dashboard/src/components/components.test.jsx): Tambah pengujian BrandMark (15 tests total).
   - [`dashboard/src/App.test.jsx`](file:///d:/content%20detection/dashboard/src/App.test.jsx): Uji kartu statis hero, metode cakupan, tanpa Aho-Corasick, uji bebas overflow horizontal (30 tests total).
2. **Berkas Dokumentasi & Visual Baru:**
   - [`audit-ui/screenshots/step-03b/`](file:///d:/content%20detection/audit-ui/screenshots/step-03b/):
     - `landing-1440.png` (Full page, footer utuh)
     - `landing-1024.png` (Full page, footer utuh)
     - `landing-768.png` (Full page, tabel bertumpuk, footer utuh)
     - `landing-390.png` (Full page, tabel bertumpuk, footer utuh)
     - `login-1440.png` (Default, posisi ~38% viewport)
     - `login-390.png` (Mobile)
     - `login-validation-error.png` (Alert submit kosong)
     - `login-server-error.png` (Alert error server)
   - [`audit-ui/step-03b-screens.pdf`](file:///d:/content%20detection/audit-ui/step-03b-screens.pdf): Booklet PDF kompilasi 8 halaman dengan rasio aspek terjaga (1.301,8 KB).
   - [`audit-ui/overflow-verification.json`](file:///d:/content%20detection/audit-ui/overflow-verification.json): Data verifikasi scrollWidth.
   - [`audit-ui/STEP-03B-REPORT.md`](file:///d:/content%20detection/audit-ui/STEP-03B-REPORT.md): Laporan lengkap ini.

---

## 6. Catatan Kelemahan Desain yang Masih Tersisa

Meskipun halaman publik kini telah memenuhi standar institusional yang ketat, terdapat beberapa aspek visual yang masih berpotensi ditingkatkan:
1. **Ketiadaan Berkas Logo Resmi Riil:** Komponen `BrandMark` saat ini menggunakan fallback monogram `"CD"`. Tampilan akan jauh lebih berwibawa dan meyakinkan apabila berkas vektor resmi `logo-pemkab.svg` (Lambang *Sabalong Samalewa*) dan `logo-diskominfo.svg` telah ditempatkan pada `dashboard/src/assets/brand/`.
2. **Kartu Hero Statis:** Penggantian kartu statistik dinamis dengan kartu statis non-numerik menyelesaikan masalah kebocoran data backend, namun secara visual kartu kanan terasa kurang hidup jika dibandingkan portal pemantauan yang menampilkan metrik riil teragregasi. Endpoint analitik publik terisolasi sangat disarankan untuk iterasi backend berikutnya.
3. **Penyajian Tabel 5 Kategori pada Tablet (768px):** Transisi tabel ke daftar bertumpuk pada 768px sangat aman terhadap overflow, namun pada orientasi tablet horizontal (1024px) daftar terasa agak renggang karena lebar kontainer 1120px. Pengaturan grid multi-kolom untuk tablet dapat dipertimbangkan pada tahap pemolesan akhir.
