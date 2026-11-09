# PROMPT 2 — Langkah 1: Fondasi Design Tokens (Tanpa Mengubah Halaman)

> Salin seluruh isi di bawah garis ini ke Antigravity (workspace: folder project, frontend di `dashboard/`).

---

## PERAN

Kamu adalah front-end engineer senior. Tugasmu pada langkah ini **hanya membangun fondasi design token** untuk redesign UI. Halaman, layout, dan komponen **belum** didesain ulang pada langkah ini. Langkah ini harus aman: setelah selesai, seluruh aplikasi harus tetap berjalan dan semua tes tetap lulus.

## KONTEKS

- Frontend: React 18 + Vite di `dashboard/`. Styling: satu file `dashboard/src/styles.css` (±6.800 baris, CSS murni, tanpa Tailwind). Font: IBM Plex Sans dan IBM Plex Mono.
- Hasil audit (`audit-ui/UI_AUDIT.md`) menemukan 163 nilai warna unik, 55 CSS variable di `:root` yang sering dilanggar dengan hardcode, radius dan spacing acak, serta font yang dimuat ganda (npm `@fontsource` di `main.jsx` dan Google Fonts di `index.html`).
- Arah desain baru: **institusional, tenang, informatif, berorientasi data**. Tema terang di seluruh aplikasi. Tanpa glow, tanpa gradient dekoratif, tanpa glassmorphism, tanpa neon. Border tipis lebih dipakai daripada shadow. Warna aksen hanya satu, dipakai hemat. Warna status (bahaya/peringatan/sukses) hanya untuk makna status, bukan dekorasi.

## ATURAN KETAT

1. **Jangan mengubah logika, API, routing, state, atau teks UI.** Jangan menyentuh `api.js`, `formatters.js`, dan logika di `reportExporter.js` (nilai warna di `reportExporter.js` boleh diganti ke token JS, bagian lain jangan).
2. **Jangan menghapus class CSS yang sudah ada.** Class lama harus tetap berfungsi lewat alias variable.
3. Jangan mendesain ulang layout/halaman/komponen. Perubahan tampilan yang muncul hanya boleh berasal dari nilai token yang baru.
4. Jangan menambah library baru. Jangan install Tailwind.
5. Jangan menghapus `App.old.jsx`. Cukup periksa apakah ada yang meng-import-nya dan laporkan.
6. Setelah setiap tahap kerja, pastikan `npm run build` di `dashboard/` tetap sukses.

## NILAI TOKEN YANG HARUS DIPAKAI

Gunakan nilai ini persis. Untuk setiap pasangan teks/latar, **hitung rasio kontras WCAG dengan skrip** (boleh skrip Node sekali pakai di luar folder `src`, jangan di-commit). Syarat: teks normal ≥ 4.5:1, teks besar dan elemen UI ≥ 3:1. Jika ada yang gagal, gelapkan nilainya secukupnya dan catat perubahannya di laporan.

**Warna netral**
| Token | Nilai | Peran |
|---|---|---|
| `--color-bg` | `#F1F3F6` | latar halaman |
| `--color-surface` | `#FFFFFF` | kartu, tabel, modal |
| `--color-surface-muted` | `#F7F8FA` | header tabel, area sekunder |
| `--color-border` | `#D5DAE1` | border standar |
| `--color-border-subtle` | `#E6E9EE` | pemisah baris tabel |
| `--color-text` | `#111C2E` | teks utama |
| `--color-text-secondary` | `#3F4B5E` | teks sekunder |
| `--color-text-tertiary` | `#5B6677` | meta, placeholder, caption |
| `--color-text-disabled` | `#8A94A3` | hanya untuk elemen disabled |

**Warna merek (primary)**
| Token | Nilai |
|---|---|
| `--color-primary` | `#0F3D7A` |
| `--color-primary-hover` | `#0B3063` |
| `--color-primary-active` | `#082549` |
| `--color-primary-soft` | `#E8EFF8` |
| `--color-primary-border` | `#BFD0E8` |
| `--color-on-primary` | `#FFFFFF` |
| `--color-sidebar` | `#0B1F3A` |
| `--color-sidebar-hover` | `#12294B` |
| `--color-sidebar-active` | `#1A3A66` |
| `--color-sidebar-text` | `#C9D3E3` |
| `--color-focus-ring` | `#2F6FD0` |

**Aksen (hemat, hanya untuk satu penanda khas instansi)**
| Token | Nilai |
|---|---|
| `--color-accent` | `#A66A00` |
| `--color-accent-soft` | `#FBF1DC` |

**Status (masing-masing punya foreground, background lembut, border)**
| Status | `--color-X` | `--color-X-soft` | `--color-X-border` |
|---|---|---|---|
| danger | `#B3261E` | `#FCEBEA` | `#F0B8B4` |
| warning | `#8A5A00` | `#FFF4D6` | `#EBD08A` |
| success | `#1E6B3A` | `#E6F3EA` | `#A9D3B6` |
| info | `#0F3D7A` | `#E8EFF8` | `#BFD0E8` |

**Warna kategori deteksi (untuk chart dan badge kategori)**
`--color-cat-gambling: #8F2D56`, `--color-cat-fraud: #A66A00`, `--color-cat-pornography: #5B3F8C`, `--color-cat-link: #0F6B7A`, `--color-cat-defacement: #B3261E`. Pastikan kelimanya mudah dibedakan satu sama lain dan tidak hanya bergantung pada warna (nanti selalu dipasangkan dengan label teks).

**Tipografi** (tetap IBM Plex Sans dan IBM Plex Mono)
- Skala ukuran: `--text-xs: 12px`, `--text-sm: 13px`, `--text-base: 14px`, `--text-md: 16px`, `--text-lg: 18px`, `--text-xl: 20px`, `--text-2xl: 24px`, `--text-3xl: 30px`.
- Berat: `--weight-regular: 400`, `--weight-medium: 500`, `--weight-semibold: 600`, `--weight-bold: 700`.
- Line-height: `--leading-tight: 1.25`, `--leading-snug: 1.4`, `--leading-normal: 1.55`.
- Tidak ada ukuran font di bawah 12px untuk teks UI.

**Spacing** (skala 4px): `--space-1: 4px` sampai `--space-12: 48px` dengan langkah 4, 8, 12, 16, 20, 24, 32, 40, 48. Beri nama `--space-1`, `-2`, `-3`, `-4`, `-5`, `-6`, `-8`, `-10`, `-12`.

**Radius**: `--radius-sm: 4px`, `--radius-md: 6px`, `--radius-lg: 8px`. Tidak ada radius lebih besar dari 8px untuk komponen. `--radius-full: 9999px` hanya untuk avatar dan indikator titik, bukan untuk badge.

**Shadow**: `--shadow-1: 0 1px 2px rgba(16, 24, 40, 0.06)` untuk kartu (opsional). `--shadow-overlay: 0 8px 24px rgba(16, 24, 40, 0.16)` hanya untuk modal dan dropdown.

**Layout**: `--sidebar-width: 248px`, `--sidebar-collapsed-width: 64px`, `--topbar-height: 56px`, `--content-max-width: 1280px`, `--control-height: 36px` (tinggi input dan tombol standar), `--control-height-sm: 30px`.

**Motion**: `--duration-fast: 120ms`, `--duration-base: 180ms`, `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`. Hormati `prefers-reduced-motion` (nonaktifkan transisi dan animasi non-esensial).

## LANGKAH KERJA

### Tahap 1 — Snapshot sebelum perubahan
1. Jalankan `npm test` dan `npm run build` di `dashboard/`. Catat hasilnya (jumlah tes lulus/gagal, status build). Jika ada tes yang sudah gagal sebelum perubahan, catat sebagai "gagal sejak awal" dan jangan diperbaiki.
2. Hitung dan catat jumlah nilai warna unik (hex + rgb/rgba/hsl) di `dashboard/src/**/*.{css,jsx,js}` dan `dashboard/index.html`. Simpan skripnya di luar `src` dan pakai lagi pada Tahap 6.

### Tahap 2 — Buat file token
1. Buat `dashboard/src/styles/tokens.css` berisi semua token di atas pada `:root`.
2. Buat `dashboard/src/styles/tokens.js` yang meng-export nilai warna yang sama sebagai objek JS (untuk SVG chart dan PDF). Nilai harus identik dengan `tokens.css`. Beri komentar bahwa kedua file harus disinkronkan.
3. Import `tokens.css` di `main.jsx` **sebelum** `styles.css`.

### Tahap 3 — Alias untuk variable lama
Di `tokens.css` (atau blok khusus bertanda `/* LEGACY ALIASES — hapus bertahap */`), petakan **setiap variable lama** di `:root` `styles.css` (mis. `--navy-900`, `--blue-500`, `--ink`, `--line`, `--bg`, `--surface`, `--green-600`, `--red-600`, `--amber-500`, `--radius-xl`, `--shadow-lg`, dst.) ke token baru terdekat, lalu hapus deklarasi lamanya dari `:root` di `styles.css`. Class lama otomatis memakai nilai baru. Buat tabel pemetaan lama → baru di laporan. Untuk variable lama yang tidak punya padanan wajar (mis. `--cyan-*`), arahkan ke `--color-primary` atau `--color-info` dan catat.

### Tahap 4 — Ganti warna hardcode
1. Di `styles.css`, ganti nilai hex/rgb hardcode yang **punya padanan jelas** dengan token, menurut tabel ini:
   - Slate/Gray gelap (`#0f172a`, `#111827`, `#1f2937`) → `var(--color-text)`
   - `#334155`, `#374151`, `#475569`, `#4b5563` → `var(--color-text-secondary)`
   - `#64748b`, `#6b7280` → `var(--color-text-tertiary)`
   - `#94a3b8`, `#9ca3af` → `var(--color-text-tertiary)` untuk teks, `var(--color-text-disabled)` hanya jika elemennya disabled
   - `#cbd5e1`, `#d1d5db` → `var(--color-border)`
   - `#e2e8f0`, `#e5e7eb` → `var(--color-border-subtle)` (border baris) atau `var(--color-border)` (border kontainer)
   - `#f1f5f9`, `#f3f4f6` → `var(--color-bg)` atau `var(--color-surface-muted)`
   - `#f8fafc`, `#f9fafb` → `var(--color-surface-muted)`
   - `#fff`, `#ffffff` → `var(--color-surface)` atau `var(--color-on-primary)` sesuai konteks
   - Biru aksi (`#2563eb`, `#1d4ed8`, `#1e40af`, `#3b82f6`) → `var(--color-primary)` / `-hover` / `-active`
   - Biru muda tint (`#eff6ff`, `#dbeafe`) → `var(--color-primary-soft)`
   - Merah/hijau/kuning (`#dc2626`, `#b91c1c`, `#ef4444`, `#16a34a`, `#15803d`, `#22c55e`, `#10b981`, `#f59e0b`, `#b45309`) → token status yang sesuai
   - Navy gelap (`#070d1e`, `#0a1628`, `#0f1d35`, `#14284a`, `#1b365c`) → `--color-sidebar*`
2. Nilai `rgba(...)` untuk **glow, backdrop, dan grid dot** (mis. `rgba(6,182,212,0.16)`, `rgba(37,99,235,0.22)`, `rgba(255,255,255,0.07)`) **jangan diganti dulu**. Cukup beri komentar `/* TODO-REDESIGN: dekoratif, dihapus di langkah halaman */` pada deklarasi tersebut. Elemen itu akan dibuang saat halaman terkait didesain ulang.
3. Di `Visualizations.jsx`, `App.jsx`, `LandingPage.jsx`, `SiteManagement.jsx`, `ScheduleManagement.jsx`: ganti warna hardcode pada atribut SVG/inline style dengan nilai dari `tokens.js` (atau `var(--...)` bila berada dalam atribut `style`). Warna chart mengikuti token kategori.
4. Di `reportExporter.js`: ganti **hanya literal warna** dengan nilai dari `tokens.js` (konversi ke RGB sesuai kebutuhan jsPDF). Jangan ubah struktur, tata letak, atau teks dokumen.
5. Template email (`services/aggregator-service/src/services/email-template.js`) **jangan disentuh** pada langkah ini.

### Tahap 5 — Normalisasi radius, shadow, font, dan aksesibilitas dasar
1. Di `styles.css`, ganti `border-radius` hardcode: nilai 2–5px → `var(--radius-sm)`, 6–9px → `var(--radius-md)`, ≥10px (kecuali `50%` dan `9999px` pada avatar/titik) → `var(--radius-lg)`. Pada badge/pill yang memakai `999px`/`9999px`, turunkan menjadi `var(--radius-sm)`.
2. Ganti `box-shadow` hardcode dengan `--shadow-1` atau `--shadow-overlay`. Shadow berwarna/glow tetap ditandai TODO seperti Tahap 4 butir 2.
3. Hapus pemuatan font ganda: hapus tag `<link>` Google Fonts di `dashboard/index.html`, pertahankan impor `@fontsource` di `main.jsx`. Pastikan bobot yang diimpor mencakup 400, 500, 600, 700 untuk Sans dan 400, 500 untuk Mono (sesuaikan hanya bobot yang benar-benar dipakai). Tambahkan `font-display: swap` bila belum ada.
4. Di `styles.css`, pastikan `body` memakai `--color-bg`, `--color-text`, `--font-sans`, `--text-base`, `--leading-normal`.
5. Tambahkan gaya fokus global yang terlihat: `:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }`, dan jangan ada `outline: none` tanpa pengganti. Periksa dan perbaiki kemunculan `outline: none` yang menghilangkan fokus.
6. Tambahkan `@media (prefers-reduced-motion: reduce)` yang mematikan animasi/transisi non-esensial.
7. Naikkan semua `font-size` di bawah 12px menjadi `var(--text-xs)`.

### Tahap 6 — Verifikasi
1. Jalankan `npm test` dan `npm run build` lagi. Bandingkan dengan Tahap 1. Jika ada tes yang baru gagal karena perubahan ini, perbaiki penyebabnya tanpa mengubah perilaku fungsional.
2. Jalankan lagi skrip hitung warna unik. Target: warna di luar `tokens.css` dan `tokens.js` turun drastis; sisa yang boleh ada hanya `rgba` dekoratif bertanda TODO-REDESIGN dan nilai di `email-template.js`. Laporkan angkanya.
3. Jalankan aplikasi, ambil screenshot Landing, Login, dan jika bisa masuk, setiap tab dashboard, pada 1440px dan 390px. Simpan di `audit-ui/screenshots/step-01/`. Periksa bahwa tidak ada teks yang hilang, tidak ada elemen yang tak terbaca, dan tidak ada layout yang rusak akibat perubahan token.

## OUTPUT

Buat `audit-ui/STEP-01-REPORT.md` berisi:
1. Hasil tes dan build sebelum dan sesudah.
2. Jumlah warna unik sebelum dan sesudah, plus daftar sisa warna di luar token beserta lokasinya.
3. Tabel pemetaan variable lama → token baru.
4. Daftar penyesuaian nilai token akibat hasil uji kontras (jika ada) beserta rasio akhirnya untuk setiap pasangan teks/latar utama.
5. Daftar semua deklarasi bertanda `TODO-REDESIGN` (file:baris).
6. Apakah `App.old.jsx` di-import oleh file lain.
7. Daftar file yang diubah.
8. Masalah visual yang terlihat setelah perubahan token (jika ada) dan yang tidak sempat diperbaiki.

Setelah selesai, ringkas di chat: status tes/build, jumlah warna unik sebelum dan sesudah, dan lokasi laporan.
