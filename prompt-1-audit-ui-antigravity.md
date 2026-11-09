# PROMPT 1 — Audit Tampilan & UI (Read-Only)

> Salin seluruh isi di bawah garis ini ke Antigravity. Jalankan dengan folder project sebagai workspace.

---

## PERAN

Kamu adalah **UI/UX auditor dan front-end analyst senior**. Tugasmu adalah mengaudit **seluruh lapisan tampilan** dari project di dalam workspace ini dan menghasilkan dokumen audit yang sangat rinci. Dokumen ini akan diberikan kepada asisten lain yang **tidak punya akses ke kode maupun aplikasi**, sehingga ia harus bisa membangun ulang UI hanya dari dokumenmu. Karena itu, semua yang kamu tulis harus konkret, spesifik, dan berbasis bukti dari kode atau tampilan nyata. Jangan menulis hal umum.

## KONTEKS PROJECT

Project ini adalah **Sistem Pemantauan dan Deteksi Indikasi Konten Negatif pada Situs Web Pemerintah Kabupaten Sumbawa** (web crawling + pattern matching Aho-Corasick, arsitektur microservices). Ringkasan teknis yang sudah diketahui, **verifikasi sendiri terhadap kode**, jangan diasumsikan benar:

- Frontend: SPA React 18 + Vite (port 5173), memanggil Aggregator Service (Express.js, port 3004)
- Layanan lain: Crawler (3001), Text Detection (3000), Link Detection (3003), Defacement (3002); database SQLite
- Aktor: **Admin (Administrator CSIRT)**, **Petugas (Operator Monitoring CSIRT)**, **Masyarakat (publik / pengelola web OPD)**
- Fitur yang kemungkinan punya UI: landing page publik, login/logout, dashboard pemantauan (grafik metrik, ringkasan temuan), form konfigurasi/pemindaian mandiri (URL target, batas halaman, kedalaman, email petugas), tabel temuan beserta detail cuplikan bukti, verifikasi/hapus temuan, catatan tanggapan, CRUD akun pengguna, kelola target website OPD, kelola baseline halaman, kelola jadwal pemindaian otomatis (harian/mingguan/bulanan), kelola kategori deteksi, riwayat notifikasi email, ekspor/cetak laporan PDF, form pengaduan masyarakat dan riwayat pengaduan
- Template email: `[PERINGATAN]` (merah) dan `[LAPORAN BERSIH]` (hijau)

**Masalah yang ingin diselesaikan:** tampilan UI saat ini terasa sangat "AI-generated" (generik, template-ish). Tujuan akhirnya adalah mendesain ulang UI secara keseluruhan agar terlihat dirancang manusia, profesional, dan layak untuk instansi pemerintah. Tahap ini **hanya audit**.

## ATURAN KETAT

1. **READ-ONLY.** Jangan mengubah, membuat, atau menghapus file kode apa pun, jangan install dependency, dan jangan refactor. Satu-satunya file yang boleh kamu buat adalah dokumen output dan folder screenshot di bagian "OUTPUT".
2. Jangan menebak. Jika sesuatu tidak ditemukan atau tidak bisa diverifikasi, tulis `TIDAK DITEMUKAN` atau `TIDAK BISA DIVERIFIKASI` beserta alasannya.
3. Setiap temuan harus menyertakan **referensi file dan nomor baris** (contoh: `src/pages/Dashboard.jsx:42-88`).
4. Jangan menyalin kode panjang. Cukup kutip potongan pendek (maks. 5 baris) bila perlu sebagai bukti.
5. Jangan memberi rekomendasi desain final atau memilih gaya baru. Tugasmu mendeskripsikan kondisi sekarang dan mendiagnosis masalahnya. Keputusan desain akan dibuat pada tahap berikutnya. Pengecualian: bagian 12 (indikator "AI-generated") dan bagian 14 (urutan pengerjaan) boleh berisi penilaian.
5. Tulis dokumen dalam **Bahasa Indonesia**, istilah teknis boleh tetap dalam Inggris.

## LANGKAH KERJA

### Fase A — Pemetaan project
1. Telusuri struktur folder seluruh workspace. Identifikasi lokasi frontend (kemungkinan `apps/dashboard`, `frontend`, atau sejenisnya), file entry, router, konfigurasi build, dan konfigurasi styling.
2. Baca `package.json` frontend: daftar dependency UI (framework CSS, library komponen, ikon, chart, font, animasi, router, state management, HTTP client).
3. Identifikasi pendekatan styling: Tailwind, CSS Modules, styled-components, CSS biasa, inline style, atau campuran. Cari file konfigurasi tema (`tailwind.config.*`, `theme.*`, `:root` variables, `index.css`, dsb.).

### Fase B — Inventaris halaman, rute, dan komponen
1. Daftar **semua rute/halaman** beserta: path, file komponen, siapa yang boleh mengakses (Admin/Petugas/Masyarakat/publik), dan apakah dilindungi login.
2. Daftar **semua komponen UI** (layout, navigasi, tabel, kartu, form, modal, badge, chart, toast, empty state, loading, dll.) beserta lokasi file, di halaman mana dipakai, dan apakah dipakai berulang atau dibuat ad-hoc di tiap halaman.
3. Identifikasi **layout shell**: sidebar, topbar, footer, container, breakpoint responsif.

### Fase C — Audit visual dari kode
Ekstrak fakta berikut dari kode (bukan opini):
- **Warna:** semua nilai warna yang dipakai (hex/rgb/hsl/class Tailwind), dikelompokkan menurut peran (primary, background, surface, border, teks, status sukses/peringatan/bahaya/info, warna kategori deteksi). Tandai warna yang di-hardcode vs yang memakai token/variabel. Catat jumlah total warna unik.
- **Tipografi:** font family, sumber font, skala ukuran, weight, line-height, letter-spacing, dan di mana tiap gaya dipakai.
- **Spacing & ukuran:** pola padding/margin/gap, lebar container, lebar sidebar, tinggi header, border-radius, shadow, ketebalan border. Apakah ada skala yang konsisten atau acak?
- **Ikon:** library, ukuran, gaya (outline/filled), dan apakah ada emoji yang dipakai sebagai ikon.
- **Efek:** gradient, glassmorphism, blur, glow, animasi, transisi, hover effect, dark mode (ada/tidak, bagaimana diimplementasikan).
- **Aset:** logo, ilustrasi, gambar, favicon, gambar latar. Apakah ada logo/identitas Pemkab Sumbawa atau Diskominfotiksandi?
- **Copywriting UI:** judul, label tombol, placeholder, pesan error, empty state, teks landing page. Catat gaya bahasa dan apakah terdengar generik (contoh: "Welcome back!", "Unlock the power of...").

### Fase D — Audit per halaman
Untuk **setiap halaman**, tulis spesifikasi lengkap dengan format di bagian "FORMAT OUTPUT" di bawah. Deskripsikan tata letak dari atas ke bawah dan kiri ke kanan secara cukup rinci sehingga orang lain bisa membayangkannya tanpa melihat layar.

### Fase E — Audit visual dari aplikasi yang berjalan
1. Cari cara menjalankan frontend (script di `package.json`, README, `.env.example`). Jalankan **hanya** perintah yang diperlukan untuk menjalankan aplikasi. Jika butuh backend/seed data, coba jalankan sesuai dokumentasi project. Jika gagal, catat penyebabnya dan lanjutkan audit dari kode saja.
2. Jika aplikasi berhasil berjalan, gunakan browser untuk membuka **setiap halaman** dan ambil screenshot pada tiga ukuran: desktop 1440px, tablet 768px, mobile 390px. Simpan di `audit-ui/screenshots/` dengan nama `<nomor>-<nama-halaman>-<ukuran>.png`.
3. Untuk halaman yang bergantung data, ambil juga kondisi: loading, kosong (empty), error, dan berisi data, bila memungkinkan.
4. Catat perbedaan antara yang kamu simpulkan dari kode dan yang tampil di layar.
5. Jangan memasukkan kredensial, token, atau isi `.env` ke dalam dokumen output.

### Fase F — Audit UX, aksesibilitas, dan konsistensi
- Alur pengguna per aktor (mulai dari landing/login sampai tugas utama selesai): berapa klik, di mana membingungkan, di mana tidak ada umpan balik.
- Konsistensi: apakah tombol, tabel, form, badge, dan kartu tampil seragam antarhalaman, atau tiap halaman berbeda?
- Aksesibilitas dasar: kontras warna teks, ukuran font minimum, label form, fokus keyboard, alt text, penggunaan warna sebagai satu-satunya penanda status, ukuran target sentuh.
- Responsivitas: apa yang rusak atau terpotong di tablet dan mobile (terutama tabel temuan dan sidebar).
- Penyajian data keamanan: apakah tingkat keparahan, kategori deteksi, dan bukti temuan mudah dipindai? Apakah ada kepadatan informasi yang berlebihan atau terlalu kosong?
- Kesesuaian konteks: apakah tampilan layak untuk instansi pemerintah dan sistem CSIRT, atau lebih mirip template SaaS generik?

### Fase G — Audit template email dan dokumen cetak
Temukan template email (`[PERINGATAN]`, `[LAPORAN BERSIH]`) dan template laporan PDF/cetak. Dokumentasikan struktur, warna, tipografi, dan isi datanya, karena ini juga bagian dari identitas visual yang harus dirancang ulang.

## FORMAT OUTPUT

Buat satu file: **`audit-ui/UI_AUDIT.md`** (dan folder `audit-ui/screenshots/` bila screenshot berhasil diambil). Gunakan struktur persis berikut.

```
# Audit UI — Sistem Pemantauan Konten Negatif (Pemkab Sumbawa)

## 0. Ringkasan Eksekutif
(10 poin teratas yang paling membuat UI terasa "AI-generated" atau tidak profesional, urut dari yang paling berdampak)

## 1. Peta Project Frontend
- Lokasi folder frontend, entry point, struktur folder (pohon ringkas)
- Cara menjalankan, dan hasil percobaan menjalankan (berhasil/gagal + alasan)

## 2. Tech Stack UI
(tabel: kategori | library/versi | digunakan untuk | catatan)

## 3. Inventaris Rute & Halaman
(tabel: no | path | file | aktor yang boleh akses | dilindungi login | tujuan halaman)

## 4. Design Tokens Saat Ini
### 4.1 Warna   (tabel: peran | nilai | lokasi pemakaian | token atau hardcode)
### 4.2 Tipografi
### 4.3 Spacing, Radius, Shadow, Border
### 4.4 Ikon & Ilustrasi
### 4.5 Efek, Animasi, Dark Mode
### 4.6 Aset & Identitas (logo, favicon, branding Pemkab)
### 4.7 Temuan: konsistensi token (apa yang konsisten, apa yang acak)

## 5. Layout Shell & Navigasi
(sidebar, topbar, footer, container, breakpoint, perilaku responsif, item menu per aktor)

## 6. Inventaris Komponen
(tabel: komponen | file | dipakai di | reusable atau ad-hoc | varian | masalah)

## 7. Spesifikasi Per Halaman
Untuk SETIAP halaman, gunakan template:
### 7.x <Nama Halaman> — `<path>`
- **File:** ...
- **Aktor:** ...
- **Tujuan halaman:** ...
- **Tata letak (atas ke bawah):** deskripsi blok demi blok, termasuk grid/kolom
- **Elemen & data yang ditampilkan:** daftar komponen, label, kolom tabel, jenis chart, field form (nama, tipe, validasi, placeholder)
- **Aksi pengguna:** tombol/link, apa yang terjadi, endpoint API yang dipanggil
- **State:** loading / kosong / error / sukses — bagaimana tampilannya sekarang
- **Responsif:** perilaku di tablet & mobile
- **Copywriting yang dipakai:** judul, subjudul, label tombol, pesan
- **Masalah visual & UX:** daftar spesifik dengan referensi file:baris
- **Screenshot:** nama file (jika ada)

## 8. Alur Pengguna per Aktor
(Admin, Petugas, Masyarakat: langkah demi langkah, jumlah klik, titik hambatan)

## 9. Template Email & Dokumen Cetak
(struktur, warna, tipografi, data, masalah)

## 10. Aksesibilitas & Responsivitas
(temuan terukur: kontras, ukuran font, label, fokus keyboard, target sentuh, bagian yang rusak di mobile)

## 11. Konsistensi & Utang UI
(duplikasi komponen, gaya inline, class yang dipakai berulang, komponen yang seharusnya dibuat reusable)

## 12. Indikator "AI-Generated"
Daftar pola yang membuat tampilan terasa dihasilkan AI, masing-masing dengan bukti (file:baris atau screenshot). Cek minimal:
- Gradient ungu/biru/indigo, glow, glassmorphism berlebihan
- Kartu dengan rounded besar + shadow lembut seragam di mana-mana
- Emoji sebagai ikon atau penghias judul
- Hero section generik dan copywriting klise
- Statistik/angka dekoratif tanpa makna
- Semua elemen berukuran dan berjarak sama, hierarki visual lemah
- Palet warna default framework (Tailwind slate/indigo/blue-600, dsb.)
- Font default (Inter/Roboto/system) tanpa karakter
- Ikon library yang dipakai tanpa pertimbangan
- Layout "sidebar + kartu metrik 4 kolom + tabel" tanpa penyesuaian pada konteks CSIRT
- Badge/pill berwarna di semua tempat
- Teks placeholder atau data dummy yang terlihat palsu
Beri tingkat keparahan (Tinggi/Sedang/Rendah) untuk tiap temuan.

## 13. Hal yang Layak Dipertahankan
(elemen UI/UX yang sudah baik atau fungsional dan sebaiknya tidak hilang saat redesign, termasuk fitur yang wajib ada)

## 14. Urutan Pengerjaan Redesign yang Disarankan
(urutan langkah dari fondasi ke halaman: design tokens → layout shell → komponen dasar → halaman per halaman → email/PDF. Untuk tiap langkah: file yang terdampak, ketergantungan, dan perkiraan risiko regresi. Berikan 8–15 langkah, tiap langkah cukup kecil untuk dikerjakan dalam satu sesi.)

## 15. Pertanyaan Terbuka & Hal yang Tidak Bisa Diverifikasi
```

## KRITERIA SELESAI

Sebelum menyatakan selesai, periksa:
- [ ] Semua rute di router sudah masuk bagian 3 dan punya spesifikasi di bagian 7
- [ ] Semua komponen di folder komponen sudah masuk bagian 6
- [ ] Setiap warna unik yang ditemukan sudah tercatat di bagian 4.1
- [ ] Setiap temuan punya referensi file:baris atau screenshot
- [ ] Tidak ada file kode yang diubah (verifikasi dengan `git status` bila project memakai git)
- [ ] Tidak ada kredensial, token, atau isi `.env` di dokumen output
- [ ] Dokumen bisa dipahami oleh orang yang tidak pernah melihat project ini

Setelah selesai, berikan ringkasan singkat di chat: jumlah halaman, jumlah komponen, jumlah warna unik, 5 masalah terbesar, dan lokasi file output.
