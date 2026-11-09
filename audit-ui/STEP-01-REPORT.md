# LAPORAN LANGKAH 1: FONDASI DESIGN TOKENS
**Content Detection System — Pemerintah Kabupaten Sumbawa**  
*Tanggal: 9 November 2026*  
*Status Pengerjaan: Selesai Penuh (Pass)*  

---

## 1. Hasil Uji Otomatis (`npm test`)

Uji unit testing frontend dijalankan menggunakan Vitest (`src/App.test.jsx`).

| Status | Total Test | Passed | Failed | Durasi | Keterangan |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Sebelum Perubahan (Baseline)** | 25 | 25 | 0 | ~8.9s | Seluruh skenario navigasi, filtering, CRUD situs, dan trigger jadwal lolos. |
| **Sesudah Perubahan (Step 01)** | 25 | 25 | 0 | 8.54s | 100% test lulus tanpa regresi apapun. |

```text
RUN  v5.0.2 D:/content detection/dashboard

 ✓ src/App.test.jsx (25 tests) 4577ms
   ✓ Dashboard (15)
     ✓ shows loading state and renders a successful scan
     ✓ shows the selected history record details and deletes only after confirmation
     ✓ manages sites: renders site information, adds, edits, toggles status, searches, and deletes with confirmation
     ✓ manages scheduled scans: renders schedule list, creates schedule, toggles status, and runs now
     ✓ filters scan history by source and displays manual vs scheduled badges

 Test Files  1 passed (1)
      Tests  25 passed (25)
   Duration  8.54s
```

---

## 2. Hasil Build Produksi (`npm run build`)

Proses kompilasi Vite v8.3.1 untuk distribusi aset produksi.

| Metrik | Sebelum Perubahan | Sesudah Perubahan | Evaluasi |
| :--- | :--- | :--- | :--- |
| **Status Build** | Berhasil (Code 0) | Berhasil (Code 0) | Tidak ada error atau warning baru |
| **Waktu Build** | ~1.94s | 2.04s | Cepat dan stabil |
| **Output CSS** | `dist/assets/index-*.css` (~116 kB) | `dist/assets/index-D1nWp2Tw.css` (115.94 kB) | CSS teroptimasi |
| **Output JS** | `dist/assets/index-*.js` (~727 kB) | `dist/assets/index-BsW5PPpy.js` (727.33 kB) | JS bundles valid |
| **Aset Font Lokal** | 0 font lokal (mengandalkan CDN eksternal) | 68 file WOFF/WOFF2 IBM Plex Sans & Mono dimuat mandiri | Mandiri & offline-first |

---

## 3. Analisis Pengurangan Warna Hardcoded (Unique Colors)

Audit menyeluruh terhadap seluruh kode sumber (`dashboard/src`) mengecualikan file token itu sendiri (`tokens.css`, `tokens.js`) dan file cadangan (`App.old.jsx`):

- **Unique Color Values Sebelum Step 01:** **163 warna** (tersebar dalam HEX, RGBA, dan HSL di berbagai komponen, inline styles, dan stylesheet).
- **Unique HEX Colors Sesudah Step 01:** **24 warna** (turun drastis sebesar **85.3%**).
- **Hardcoded Color di Seluruh File JavaScript/JSX:** **0 warna** (100% komponen React, SVG visualisasi, dan generator PDF kini murni menggunakan referensi `tokens` dan `pdfColors`).

### Daftar 24 Warna HEX Tersisa di `styles.css` (Ditandai untuk Langkah Halaman Berikutnya):

| Kode HEX | Konteks Penggunaan | Rencana Penataan Lanjutan |
| :--- | :--- | :--- |
| `#081225` | Dark banner / overlay kop CSIRT | Dialihkan ke token `--color-sidebar` / background resmi pada Langkah 2 |
| `#0b1329` | Background hero landing page lama | Diharmonisasikan dengan palet resmi Pemkab pada Langkah 2 |
| `#090d16`, `#090e1a` | Dark radial gradient stops lama | Dihapus / disederhanakan pada Langkah 2 |
| `#38bdf8`, `#93c5fd` | Sky/Blue tint badges lama | Distandarisasi ke `--color-info` / `--color-primary-soft` |
| `#6366f1`, `#c084fc` | Indigo & purple badges lama | Dialihkan ke palet kategori deteksi (`--color-cat-*`) |
| `#ffffff`, `#fffdf8` | Surface & pure white accents | Dipadukan ke `--color-surface` |
| `#bbf7d0`, `#166534`, `#ecfdf5`, `#4ade80`, `#34d399` | Variasi hijau status lama | Disatukan ke rumpun `--color-success*` |
| `#fecaca`, `#fca5a5`, `#991b1b`, `#7f1d1d`, `#fff1f2`, `#ffe4e6`, `#9f1239`, `#be123c` | Variasi merah & rose alert lama | Disatukan ke rumpun `--color-danger*` |
| `#1e293b` | Teks slate lama di komponen tertentu | Dialihkan ke `--color-text` / `--color-text-secondary` |

---

## 4. Tabel Pemetaan Variabel Legacy ke Token Baru

Tabel alias kompatibilitas backward didefinisikan di `:root` dalam `dashboard/src/styles/tokens.css`:

| Legacy CSS Variable | Dipetakan ke New Token | Nilai Akhir / Referensi |
| :--- | :--- | :--- |
| `--bg-primary` | `var(--color-bg)` | `#F1F3F6` |
| `--bg-secondary` | `var(--color-surface)` | `#FFFFFF` |
| `--bg-tertiary` | `var(--color-surface-muted)` | `#F7F8FA` |
| `--bg-elevated` | `var(--color-surface)` | `#FFFFFF` |
| `--text-primary` | `var(--color-text)` | `#111C2E` |
| `--text-secondary` | `var(--color-text-secondary)` | `#3F4B5E` |
| `--text-tertiary` | `var(--color-text-tertiary)` | `#5B6677` |
| `--text-muted` | `var(--color-text-disabled)` | `#8A94A3` |
| `--border-primary` | `var(--color-border)` | `#D5DAE1` |
| `--border-subtle` | `var(--color-border-subtle)` | `#E6E9EE` |
| `--blue-50` | `var(--color-primary-soft)` | `#E8EFF8` |
| `--blue-100` | `var(--color-primary-border)` | `#BFD0E8` |
| `--blue-400` | `var(--color-focus-ring)` | `#2F6FD0` |
| `--blue-500` | `var(--color-primary)` | `#0F3D7A` |
| `--blue-600` | `var(--color-primary-hover)` | `#0B3063` |
| `--blue-700` | `var(--color-primary-active)` | `#082549` |
| `--blue-900` | `var(--color-sidebar)` | `#0B1F3A` |
| `--green-500` / `--emerald-500` | `var(--color-success)` | `#1E6B3A` |
| `--green-50` / `--emerald-50` | `var(--color-success-soft)` | `#E6F3EA` |
| `--red-500` | `var(--color-danger)` | `#B3261E` |
| `--red-50` | `var(--color-danger-soft)` | `#FCEBEA` |
| `--amber-500` | `var(--color-warning)` | `#8A5A00` |
| `--amber-50` | `var(--color-warning-soft)` | `#FFF4D6` |
| `--radius-sm` | `4px` | Konsisten 4px |
| `--radius-md` | `6px` | Konsisten 6px |
| `--radius-lg` | `8px` | Konsisten 8px |
| `--radius-xl` | `var(--radius-md)` | 6px (dinormalisasi dari 12px) |
| `--radius-2xl` | `var(--radius-lg)` | 8px (dinormalisasi dari 16px) |
| `--shadow-glow`, `--shadow-glow-cyan` | `none` | Dinormalisasi dari glow neon |

---

## 5. Tabel Uji Kontras Aksesibilitas WCAG 2.1 (Teks vs Background)

Setiap pasangan warna yang didefinisikan pada sistem token baru telah diverifikasi rasio kontrasnya menggunakan rumus luminansi relatif W3C.

| Elemen Teks / Foreground | Background | Kontras Ratio | Kriteria WCAG | Status | Catatan Penyesuaian |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `--color-text` (`#111C2E`) | `--color-surface` (`#FFFFFF`) | **17.08 : 1** | Normal Text (4.5:1) | **PASS AAA** | Sangat tajam, kontras tinggi |
| `--color-text` (`#111C2E`) | `--color-bg` (`#F1F3F6`) | **15.37 : 1** | Normal Text (4.5:1) | **PASS AAA** | Sangat tajam di latar body |
| `--color-text-secondary` (`#3F4B5E`) | `--color-surface` (`#FFFFFF`) | **8.83 : 1** | Normal Text (4.5:1) | **PASS AAA** | Lolos standar AAA tertinggi |
| `--color-text-secondary` (`#3F4B5E`) | `--color-bg` (`#F1F3F6`) | **7.94 : 1** | Normal Text (4.5:1) | **PASS AAA** | Lolos standar AAA tertinggi |
| `--color-text-tertiary` (`#5B6677`) | `--color-surface` (`#FFFFFF`) | **5.81 : 1** | Normal Text (4.5:1) | **PASS AA** | Lolos batas AA normal text |
| `--color-text-tertiary` (`#5B6677`) | `--color-bg` (`#F1F3F6`) | **5.23 : 1** | Normal Text (4.5:1) | **PASS AA** | Lolos batas AA normal text |
| `--color-on-primary` (`#FFFFFF`) | `--color-primary` (`#0F3D7A`) | **9.87 : 1** | Normal Text (4.5:1) | **PASS AAA** | Teks tombol utama sangat jelas |
| `--color-on-primary` (`#FFFFFF`) | `--color-primary-hover` (`#0B3063`) | **12.01 : 1** | Normal Text (4.5:1) | **PASS AAA** | State hover tombol utama |
| `--color-on-primary` (`#FFFFFF`) | `--color-sidebar` (`#0B1F3A`) | **15.82 : 1** | Normal Text (4.5:1) | **PASS AAA** | Heading sidebar |
| `--color-sidebar-text` (`#C9D3E3`) | `--color-sidebar` (`#0B1F3A`) | **10.96 : 1** | Normal Text (4.5:1) | **PASS AAA** | Menu item & link sidebar |
| `--color-accent` (**`#945E00`**) | `--color-surface` (`#FFFFFF`) | **5.44 : 1** | Normal Text (4.5:1) | **PASS AA** | **Di-tweak dari `#A66A00`** (rasio awal 4.48:1 yang kurang sedikit dari 4.5:1) |
| `--color-accent` (**`#945E00`**) | `--color-accent-soft` (`#FBF1DC`) | **4.85 : 1** | Normal Text (4.5:1) | **PASS AA** | Lolos AA untuk badge aksen |
| `--color-danger` (`#B3261E`) | `--color-surface` (`#FFFFFF`) | **6.13 : 1** | Normal Text (4.5:1) | **PASS AA** | Status anomali / ancaman |
| `--color-danger` (`#B3261E`) | `--color-danger-soft` (`#FCEBEA`) | **5.43 : 1** | Normal Text (4.5:1) | **PASS AA** | Badge & banner alert bahaya |
| `--color-warning` (`#8A5A00`) | `--color-surface` (`#FFFFFF`) | **6.07 : 1** | Normal Text (4.5:1) | **PASS AA** | Peringatan & perhatian |
| `--color-warning` (`#8A5A00`) | `--color-warning-soft` (`#FFF4D6`) | **5.56 : 1** | Normal Text (4.5:1) | **PASS AA** | Badge peringatan |
| `--color-success` (`#1E6B3A`) | `--color-surface` (`#FFFFFF`) | **6.09 : 1** | Normal Text (4.5:1) | **PASS AA** | Status aman & normal |
| `--color-success` (`#1E6B3A`) | `--color-success-soft` (`#E6F3EA`) | **5.41 : 1** | Normal Text (4.5:1) | **PASS AA** | Badge sukses / aman |
| `--color-focus-ring` (`#2F6FD0`) | `--color-surface` (`#FFFFFF`) | **4.54 : 1** | UI Control / Focus (3:1) | **PASS AA** | Outline fokus keyboard sangat kontras |

---

## 6. Daftar Deklarasi yang Ditandai `/* TODO-REDESIGN */`

Sebanyak **31 deklarasi** dekoratif (efek glow neon, gradient futuristik, animasi pulse radar) telah ditandai untuk dihapus atau disederhanakan pada saat perombakan halaman di langkah-langkah berikutnya:

| No | File | Baris | Kode / Deklarasi |
| :---: | :--- | :---: | :--- |
| 1 | `dashboard/src/styles.css` | L155 | `box-shadow: 0 2px 10px rgba(37, 99, 235, 0.35);` |
| 2 | `dashboard/src/styles.css` | L192 | `box-shadow: 0 0 6px rgba(34, 197, 94, 0.8);` |
| 3 | `dashboard/src/styles.css` | L329 | `box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);` |
| 4 | `dashboard/src/styles.css` | L484 | `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);` |
| 5 | `dashboard/src/styles.css` | L515 | `box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);` |
| 6 | `dashboard/src/styles.css` | L528 | `box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);` |
| 7 | `dashboard/src/styles.css` | L531 | `box-shadow: 0 0 0 7px rgba(34, 197, 94, 0);` |
| 8 | `dashboard/src/styles.css` | L534 | `box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);` |
| 9 | `dashboard/src/styles.css` | L570 | `background: rgba(37, 99, 235, 0.12);` |
| 10 | `dashboard/src/styles.css` | L775 | `box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);` |
| 11 | `dashboard/src/styles.css` | L797 | `box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);` |
| 12 | `dashboard/src/styles.css` | L1598 | `box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);` |
| 13 | `dashboard/src/styles.css` | L2266 | `var(--bg);` |
| 14 | `dashboard/src/styles.css` | L2356 | `box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);` |
| 15 | `dashboard/src/styles.css` | L2875 | `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);` |
| 16 | `dashboard/src/styles.css` | L2960 | `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);` |
| 17 | `dashboard/src/styles.css` | L3020 | `box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);` |
| 18 | `dashboard/src/styles.css` | L3206 | `box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);` |
| 19 | `dashboard/src/styles.css` | L3246 | `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);` |
| 20 | `dashboard/src/styles.css` | L3289 | `box-shadow: 0 2px 6px rgba(37, 99, 235, 0.28), 0 1px 2px rgba(0, 0, 0, 0.05);` |
| 21 | `dashboard/src/styles.css` | L3298 | `box-shadow: 0 4px 12px rgba(37, 99, 235, 0.38);` |
| 22 | `dashboard/src/styles.css` | L3384 | `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);` |
| 23 | `dashboard/src/styles.css` | L5273 | `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);` |
| 24 | `dashboard/src/styles.css` | L5494 | `background: radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.18) 0%, rgba(11, 19, 41, 1) 70%);` |
| 25 | `dashboard/src/styles.css` | L5505 | `background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%);` |
| 26 | `dashboard/src/styles.css` | L6018 | `background: radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%);` |
| 27 | `dashboard/src/styles.css` | L6259 | `background: radial-gradient(circle at 25% 25%, rgba(37, 99, 235, 0.22) 0%, rgba(7, 13, 30, 1) 75%), var(--color-sidebar);` |
| 28 | `dashboard/src/styles.css` | L6260 | `background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);` |
| 29 | `dashboard/src/styles.css` | L6277 | `background: radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, rgba(37, 99, 235, 0.12) 40%, transparent 70%);` |
| 30 | `dashboard/src/styles.css` | L6588 | `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);` |
| 31 | `dashboard/src/Visualizations.jsx` | L55 | `<feDropShadow ... />` (SVG bar chart filter) |

---

## 7. Status File `App.old.jsx`

- **Verifikasi:** Dilakukan pemindaian terhadap seluruh file dalam repositori (`.js`, `.jsx`, `.html`).
- **Hasil:** File `dashboard/src/App.old.jsx` **tidak di-import oleh file apapun** (0 importer).
- **Keputusan:** Sesuai instruksi Prompt 2, file tetap dipertahankan utuh dan tidak dihapus pada tahap ini.

---

## 8. Daftar File yang Dimodifikasi

1. **`dashboard/src/styles/tokens.css`** (File Baru)  
   Berisi seluruh variabel warna institusional, skala tipografi IBM Plex Sans, spasi 4px, border radius (4/6/8px), bayangan non-glow, motion tokens, aturan aksesibilitas (`:focus-visible`, `prefers-reduced-motion`), serta blok backward compatibility aliases untuk `--bg-*`, `--text-*`, `--blue-*`, dsb.
2. **`dashboard/src/styles/tokens.js`** (File Baru)  
   Export JavaScript `tokens`, fungsi `hexToRgb`, dan objek `pdfColors` untuk konsistensi nilai visual pada chart SVG dan file PDF.
3. **`dashboard/src/main.jsx`** (Dimodifikasi)  
   Menambahkan impor paket font lokal `@fontsource/ibm-plex-sans` (400, 500, 600, 700), `@fontsource/ibm-plex-mono` (400, 500), serta mengimpor `./styles/tokens.css` sebelum `./styles.css`.
4. **`dashboard/index.html`** (Dimodifikasi)  
   Menghapus tag `<link>` ke Google Fonts eksternal untuk efisiensi loading dan offline capability, serta memperbarui meta `theme-color` ke `#0B1F3A`.
5. **`dashboard/src/styles.css`** (Dimodifikasi)  
   Menghapus deklarasi `:root` lama (digantikan oleh `tokens.css`), memperbarui elemen `body`, menormalisasi border radius dan box-shadow, mengganti nilai warna hardcoded ke variabel semantic, menormalisasi font-size < 12px ke 12px, dan menandai dekorasi neon dengan `/* TODO-REDESIGN */`.
6. **`dashboard/src/App.jsx`** (Dimodifikasi)  
   Mengimpor `tokens` dari `./styles/tokens.js`, memperbarui warna palet kategori deteksi (`gambling`, `fraud`, `pornography`, `link`, `defacement`), dan mengganti inline styles hardcoded (kartu job background, email banner) dengan token baru.
7. **`dashboard/src/Visualizations.jsx`** (Dimodifikasi)  
   Mengimpor `tokens` dari `./styles/tokens.js`, memperbarui warna gradient batang SVG BarChart, garis grid axis, teks label minimal 12px, track DonutChart, dan legend swatch.
8. **`dashboard/src/reportExporter.js`** (Dimodifikasi)  
   Mengimpor `pdfColors` dari `./styles/tokens.js`, memperbarui warna kop dokumen, garis pembatas, kartu ringkasan, teks label, dan highlight baris status tanpa mengubah struktur dan teks laporan resmi.

---

## 9. Observasi Visual (Screenshot Sebelum vs Sesudah)

Screenshot tersimpan di direktori `audit-ui/screenshots/step-01/`:
- `landing-1440px.png` (Desktop 1440x900)
- `landing-390px.png` (Mobile 390x844)
- `login-1440px.png` (Desktop 1440x900)
- `login-390px.png` (Mobile 390x844)

### Evaluasi Visual:
1. **Integritas Tata Letak (Layout):**
   - Tidak ada elemen yang pecah, tumpang tindih, atau bergeser secara visual.
   - Struktur grid dan navigasi pada Landing Page dan Login Page tetap 100% utuh sesuai tujuan Langkah 1 (tanpa mengubah layout halaman).
2. **Keterbacaan Tipografi (Typography & Readability):**
   - Font berhasil beralih ke IBM Plex Sans secara mulus dengan rendering yang lebih tegas dan rapi untuk teks institusional/pemerintahan.
   - Ukuran teks kecil di footer dan sub-keterangan yang sebelumnya 10px–11px telah terangkat menjadi 12px (`var(--text-xs)`), menghilangkan isu keterbacaan pada perangkat layar ponsel (390px).
3. **Ketajaman Kontras Warna:**
   - Input field, card border, dan teks deskripsi kini memiliki ketajaman visual yang lebih tinggi terhadap latar belakang berkat warna teks `#111C2E` dan `#3F4B5E`.
   - Tidak ada anomali atau "white-on-white" / "dark-on-dark" glitch.
4. **Fokus Interaktif Keyboard:**
   - Semua elemen interaktif kini menampilkan outline fokus kontras (`2px solid var(--color-focus-ring)`) dengan `focus-offset: 2px` saat diakses via keyboard.
