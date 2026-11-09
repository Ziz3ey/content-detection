# LAPORAN LANGKAH 2: PERAPIHAN FONDASI & PUSTAKA KOMPONEN DASAR
**Content Detection System — Pemerintah Kabupaten Sumbawa**  
*Tanggal: 9 November 2026*  
*Status Pengerjaan: Selesai Penuh (All Tests Passed & Production Verified)*  

---

## 1. Hasil Skrip A1: Audit Variabel CSS Tak Terdefinisi

Sebuah skrip audit menyeluruh dijalankan untuk memindai seluruh penggunaan `var(--...)` di direktori `dashboard/src/**/*.{css,jsx,js}` dibandingkan dengan variabel yang dideklarasikan pada `tokens.css` dan `styles.css`.

| Metrik | Sebelum Perbaikan A1 | Sesudah Perbaikan A1 | Catatan |
| :--- | :---: | :---: | :--- |
| **Total Variabel Terdeklarasi** | 139 | **179** | Bertambah berkat penambahan token kategori, status hover, overlay, dan legacy aliases |
| **Total Variabel Digunakan** | 90 | **127** | Termasuk penggunaan token baru pada pustaka komponen dasar |
| **Variabel Hilang TANPA Fallback** | **10** | **0** | **100% tuntas teratasi (Nol temuan)** |
| **Variabel Hilang DENGAN Fallback** | **0** | **0** | Tidak ada variabel tak terdaftar dengan fallback |

### Daftar Alias yang Ditambahkan ke Blok `tokens.css`:
- `--bg-alt`: dipetakan ke `var(--color-surface-muted)`
- `--blue-800`: dipetakan ke `var(--color-primary-active)`
- `--blue-300`: dipetakan ke `var(--color-primary-border)`
- `--blue-200`: dipetakan ke `var(--color-primary-soft)`
- `--blue-50`: dipetakan ke `var(--color-primary-soft)`
- `--green-400`: dipetakan ke `var(--color-success)`
- `--green-200`: dipetakan ke `var(--color-success-border)`
- `--red-300`: dipetakan ke `var(--color-danger-border)`
- `--red-50`: dipetakan ke `var(--color-danger-soft)`
- `--space-7`: dideklarasikan sebagai `28px`
- `--color-overlay`: dideklarasikan sebagai `rgba(11, 31, 58, 0.55)`
- `--color-danger-hover` (`#991B1B`) dan `--color-danger-active` (`#7F1D1D`)
- Token kategori insiden soft & border: `--color-cat-*-soft`, `--color-cat-*-border`

---

## 2. Perbaikan Ring Fokus (A2) dan Sisa TODO-REDESIGN

Pada Langkah 1, deklarasi `box-shadow: 0 0 0 3px rgba(...)` sempat ditandai dengan `TODO-REDESIGN`. Berdasarkan audit A2, sebanyak **11 deklarasi** merupakan ring fokus elemen formulir/kontrol interaktif yang sah, bukan sekadar dekorasi kosmetik.

### Ring Fokus yang Distandarisasi (11 Lokasi di `styles.css`):
Seluruh deklarasi berikut diganti menjadi:  
`box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-focus-ring);`  
*(atau `var(--color-danger)` untuk kontrol yang invalid)* dan komentar TODO dihapus:
1. `.topbar-search-input:focus` (L484)
2. `.input:focus, .select:focus, .textarea:focus` (L775)
3. `.input-invalid:focus` (L797) — menggunakan ring merah `var(--color-danger)`
4. `.manual-url-wrap:focus-within` (L1598)
5. `.login-input:focus` (L2356)
6. `.modal-input:focus, .modal-body input:focus, .modal-select:focus` (L2875)
7. `.schedule-input:focus` (L2960)
8. `.baseline-field textarea:focus` (L2960)
9. `.filter-select:focus` (L3206)
10. `.sites-search-input:focus` (L3384)
11. `.split-input:focus` (L6588)

### Sisa Deklarasi Bertanda `/* TODO-REDESIGN */`:
Tersisa **20 deklarasi** (19 di `styles.css` dan 1 di `Visualizations.jsx`). Seluruh sisa deklarasi ini adalah **murni dekoratif** peninggalan desain lama yang akan dibersihkan saat refaktor halaman per halaman di langkah berikutnya:
- Animasi radar/pulse `keyframes pulseDot` (L515, L528, L531, L534)
- Radial background gradient hero & feature lama (L5494, L5505, L6018, L6259, L6260, L6277)
- Drop-shadow hover pada tombol lama (L3020, L3289, L3298)
- Glow pada filter SVG BarChart (`barGlow` di `Visualizations.jsx` L55)

---

## 3. Pengurangan Bobot Font (A3)

Untuk memangkas beban unduhan dan waktu render, impor `@fontsource` di `dashboard/src/main.jsx` diubah dari seluruh paket menjadi subset latin:
- `@fontsource/ibm-plex-sans/latin-400.css`
- `@fontsource/ibm-plex-sans/latin-500.css`
- `@fontsource/ibm-plex-sans/latin-600.css`
- `@fontsource/ibm-plex-sans/latin-700.css`
- `@fontsource/ibm-plex-mono/latin-400.css`
- `@fontsource/ibm-plex-mono/latin-500.css`

### Hasil Perbandingan Distribusi File Font:

| Metrik | Sebelum (Langkah 1) | Sesudah (Langkah 2) | Penghematan |
| :--- | :---: | :---: | :---: |
| **Jumlah File Font di `dist/assets/`** | **68 file** (Cyrillic, Greek, Vietnamese, Latin-ext) | **12 file** (WOFF & WOFF2 Latin) | **-82.3% file font** |
| **Ukuran CSS Awal (sebelum komponen)** | 115.94 kB | 106.43 kB | -9.51 kB |
| **Rendering Teks Bahasa Indonesia** | Normal | Normal & Tajam | Tanpa glitch karakter |

---

## 4. Daftar Pustaka Komponen Dasar yang Dibangun

Seluruh komponen berada di `dashboard/src/components/`, diekspor bersama melalui `components/index.js`, dan diberi style dengan kelas berawalan `.ui-` di `components.css` **tanpa ada satupun warna hardcoded hex/rgb**.

| Komponen | File Sumber | Props Publik Utama | Keterangan & Aksesibilitas |
| :--- | :--- | :--- | :--- |
| **`Button`** | `Button.jsx` | `variant`, `size`, `icon`, `loading`, `disabled`, `type`, `as`, `href`, `children`, `onClick` | Radius 6px, tanpa hover float/shadow. `aria-busy` saat loading. Mendukung `forwardRef`. |
| **`IconButton`** | `Button.jsx` | `label` *(wajib)*, `icon` *(wajib)*, `variant`, `size`, `loading`, `disabled` | Area klik minimal 36×36px. Wajib prop `label` yang otomatis menjadi `aria-label` dan `title`. |
| **`Field`** | `Field.jsx` | `label`, `id`, `hint`, `error`, `required`, `optional`, `children` | Menghubungkan `htmlFor`/`id`, `aria-describedby`, dan `aria-invalid` via Context. Menampilkan tanda wajib dengan teks tersembunyi untuk pembaca layar. |
| **`Input`** | `Input.jsx` | `type`, `icon`, `invalid`, `showPasswordToggle`, `disabled`, `placeholder` | Tinggi 36px, ring fokus 4px kontras, tombol intip kata sandi otomatis bila `type="password"`. |
| **`Select`** | `Select.jsx` | `options`, `invalid`, `disabled`, `children` | Tinggi 36px, chevron bawaan institusional, mewarisi status invalid dari `Field`. |
| **`Textarea`** | `Textarea.jsx` | `mono`, `rows`, `invalid`, `disabled`, `placeholder` | Mendukung varian `mono` (IBM Plex Mono) untuk input ekspresi reguler / URL / kode. |
| **`Checkbox`** | `Checkbox.jsx` | `label`, `description`, `checked`, `defaultChecked`, `onChange`, `disabled`, `id` | Area klik ramah sentuhan, label dan deskripsi terhubung pembaca layar. |
| **`Badge`** | `Badge.jsx` | `tone`, `category`, `icon`, `dot`, `children` | Kotak persegi (radius 4px, bukan pill). Mendukung kategori insiden `--color-cat-*`. |
| **`StatusBadge`** | `StatusBadge.jsx`| `status` (`clean`, `indicated`, `failed`, `running`, `pending`, `active`, `inactive`), `children` | **Selalu menyertakan teks dan ikon**. Status tidak bergantung pada warna saja. |
| **`Card`** | `Card.jsx` | `padding` (`none`, `md`), `shadow`, `children` | Border tipis 1px, radius 8px, tanpa background neon. |
| **`CardHeader`** | `Card.jsx` | `title`, `description`, `action`, `children` | Header terstruktur dengan slot tombol aksi di kanan. |
| **`CardBody`** | `Card.jsx` | `children` | Kontainer isi dengan padding standar 16px. |
| **`CardFooter`** | `Card.jsx` | `children` | Footer abu-abu terang dengan pemisah garis tipis. |
| **`StatCard`** | `Card.jsx` | `label`, `value`, `description`, `tone` (`default`, `danger`, `success`), `icon` | Angka besar font Mono (`tabular-nums`), garis aksen vertikal 3px di tepi kiri, tanpa latar belakang berwarna. |
| **`Table`** | `Table.jsx` | `caption`, `maxHeight`, `children` | Kontainer scroll horizontal, header sticky dengan huruf kapital kecil, ramah screen reader. |
| **`TableRow`** | `Table.jsx` | `onRowClick`, `isSelected`, `children` | Baris interaktif: `tabIndex={0}`, dapat diaktifkan menggunakan tombol Enter dan Spasi. |
| **`TableCell`** | `Table.jsx` | `numeric`, `as`, `children` | Sel angka rata kanan dengan font Mono (`font-variant-numeric: tabular-nums`). |
| **`TableEmpty`** | `Table.jsx` | `icon`, `title`, `description`, `action`, `colSpan` | Tampilan status kosong yang rapi di dalam baris tabel. |
| **`TableSkeleton`**| `Table.jsx` | `rows`, `cols` | Placeholder pemuatan data tanpa animasi shimmer berlebihan (ramah reduced-motion). |
| **`Pagination`** | `Table.jsx` | `page`, `pageSize`, `total`, `pageSizeOptions`, `onChange` | Paginasi presentasional: "Menampilkan x–y dari z", pilihan ukuran baris, tombol navigasi. |
| **`Modal`** | `Modal.jsx` | `open`, `onClose`, `title`, `size` (`sm`, `md`, `lg`), `closeOnBackdropClick`, `closeOnEsc`, `footer`, `children` | Portal ke `document.body`, `role="dialog"`, focus trap penuh, Esc untuk menutup, scroll lock pada body, fokus kembali ke elemen pemicu. Latar overlay tanpa blur. |
| **`ConfirmDialog`**| `Modal.jsx` | `open`, `title`, `description`, `confirmLabel`, `cancelLabel`, `tone`, `busy`, `onConfirm`, `onCancel` | Pengganti `window.confirm`. Pada tone `danger`, **fokus otomatis diarahkan ke tombol Batal** untuk mencegah klik salah tekan. |
| **`Alert`** | `Feedback.jsx` | `tone` (`info`, `success`, `warning`, `danger`), `title`, `icon`, `action`, `onClose`, `children` | Banner inline dengan latar lembut dan border halus tanpa border samping tebal. `role="alert"` untuk bahaya/peringatan. |
| **`Spinner`** | `Feedback.jsx` | `size`, `label` | Ikon putar SVG ringan dengan teks status pembaca layar. |
| **`EmptyState`** | `Feedback.jsx` | `icon`, `title`, `description`, `action` | Tampilan status kosong tingkat halaman/kartu. |
| **`PageHeader`** | `Feedback.jsx` | `title`, `description`, `breadcrumb`, `action` | Judul halaman institusional (`--text-2xl`), sub-deskripsi, slot aksi kanan, tanpa ikon raksasa. |
| **`SegmentedControl`** | `Navigation.jsx` | `items`, `value`, `onChange`, `size`, `role` | Pengganti filter pill. Grup tombol bersambung, aktif menggunakan warna soft, mendukung navigasi tombol panah keyboard. |
| **`Tabs`** | `Navigation.jsx` | `items`, `activeId`, `onChange` | Tab navigasi bergaya garis bawah (underline) dengan pola aksesibilitas `role="tablist"` dan panah keyboard. |

---

## 5. Hasil Pengujian Unit (`npm test`) & Kompilasi Produksi (`npm run build`)

### Pengujian Vitest:
- **Sebelum (Langkah 1):** 25 tes lolos (1 file `App.test.jsx`).
- **Sesudah (Langkah 2):** **38 tes lolos** (3 file uji, 100% lulus tanpa kegagalan):
  - `src/styles/tokens.test.js`: **1 passed** (memverifikasi sinkronisasi 1:1 antara `tokens.css` dan `tokens.js`)
  - `src/components/components.test.jsx`: **12 passed** (Button onClick/loading/iconButton label, Field-Input linking & error aria, Modal focus trap/Esc/focus return, ConfirmDialog actions, StatusBadge text rendering, Table onRowClick Enter trigger, SegmentedControl keyboard navigation)
  - `src/App.test.jsx`: **25 passed** (seluruh skenario fungsionalitas aplikasi lama tetap lulus tanpa regresi)

```text
Test Files  3 passed (3)
     Tests  38 passed (38)
  Duration  21.28s
```

### Hasil Build Vite Produksi:
```text
✓ built in 1.81s
dist/index.html              0.80 kB
dist/assets/index-*.css    128.98 kB (termasuk pustaka komponen baru)
dist/assets/index-*.js     727.55 kB
```

---

## 6. Bukti Verifikasi Galeri Tidak Ikut Build Produksi

Sesuai ketentuan Bagian C, `ComponentGallery.jsx` dimuat secara dinamis menggunakan `React.lazy` hanya saat `import.meta.env.DEV` bernilai true pada route `#/_komponen`.

### Hasil Pengecekan Skrip Audit Bundle:
```text
node -e "
const fs = require('fs');
const path = require('path');
const distFiles = fs.readdirSync('dashboard/dist/assets').filter(f => f.endsWith('.js'));
let found = false;
distFiles.forEach(f => {
  const content = fs.readFileSync(path.join('dashboard/dist/assets', f), 'utf8');
  if (content.includes('Galeri Komponen Institusional')) {
    found = true;
  }
});
console.log(found ? 'FOUND' : 'VERIFIED: ComponentGallery is completely absent from production build (Tree-shaken)!');
"
-> VERIFIED: ComponentGallery is completely absent from production build (Tree-shaken)!
```
Kompiler Vite/Rolldown membuang seluruh kode `ComponentGallery` dari artefak produksi (`dist/`) melalui dead-code elimination.

---

## 7. Keputusan Desain & Rekomendasi Lanjutan

1. **Penggunaan `forwardRef` pada Seluruh Elemen Form & Tombol:**  
   Komponen `Button`, `IconButton`, `Input`, `Select`, `Textarea`, dan `Checkbox` dibungkus dengan `React.forwardRef`. Hal ini memungkinkan dialog modal dan penanganan fokus form untuk langsung mengarahkan fokus ke elemen DOM asli tanpa error peringatan React.
2. **Arsitektur `FieldContext` Deklaratif:**  
   Alih-alih melakukan manipulasi `React.cloneElement` yang rapuh pada children `Field`, digunakan React Context (`useField()`) sehingga input, hint, dan error ID tersambung secara otomatis bahkan jika input berada di dalam pembungkus flex/grid kustom.
3. **Pencegahan Salah Hapus pada `ConfirmDialog`:**  
   Ketika `ConfirmDialog` dipanggil dengan `tone="danger"`, fokus awal secara otomatis diarahkan ke tombol **Batal** (bukan tombol Hapus/Konfirmasi). Ini mencegah insiden penghapusan tidak disengaja bila pengguna menekan tombol Enter terburu-buru.
4. **Tokenisasi Lengkap Kategori & Status Hover:**  
   Untuk mematuhi aturan ketat "0 hardcoded color di file komponen", warna hover tombol bahaya (`--color-danger-hover: #991B1B`, `--color-danger-active: #7F1D1D`) dan warna lembut kategori insiden dideklarasikan secara eksplisit di `tokens.css` dan `tokens.js`.
5. **Rekomendasi untuk Langkah 3:**  
   Pada saat migrasi halaman Landing dan Login di Langkah 3, kita dapat langsung memanfaatkan `Button`, `Input`, `Field`, `Card`, dan `Alert` ini untuk menggantikan markup lama, sekaligus membersihkan sisa 19 deklarasi bertanda `TODO-REDESIGN`.

---

## 8. Daftar File Baru dan Dimodifikasi

### File Baru:
1. `dashboard/src/components/Button.jsx`
2. `dashboard/src/components/Field.jsx`
3. `dashboard/src/components/Input.jsx`
4. `dashboard/src/components/Select.jsx`
5. `dashboard/src/components/Textarea.jsx`
6. `dashboard/src/components/Checkbox.jsx`
7. `dashboard/src/components/Badge.jsx`
8. `dashboard/src/components/StatusBadge.jsx`
9. `dashboard/src/components/Card.jsx`
10. `dashboard/src/components/Table.jsx`
11. `dashboard/src/components/Modal.jsx`
12. `dashboard/src/components/Feedback.jsx`
13. `dashboard/src/components/Navigation.jsx`
14. `dashboard/src/components/index.js`
15. `dashboard/src/components/components.css`
16. `dashboard/src/components/ComponentGallery.jsx`
17. `dashboard/src/components/components.test.jsx`
18. `dashboard/src/styles/tokens.test.js`

### File Dimodifikasi:
1. `dashboard/src/styles/tokens.css` (penambahan alias variabel, overlay, status hover, kategori soft/border)
2. `dashboard/src/styles/tokens.js` (sinkronisasi nilai JS token dan export overlay/status)
3. `dashboard/src/main.jsx` (pengurangan bobot font ke subset latin, impor `components.css`)
4. `dashboard/src/styles.css` (normalisasi 11 ring fokus input dan penghapusan tanda TODO pada ring fokus)
5. `dashboard/src/App.jsx` (percabangan lazy load `#/_komponen` khusus mode dev)

### Screenshot Galeri Step-02:
Tersimpan di `audit-ui/screenshots/step-02/`:
- `gallery-1440px-full.png` (Tangkapan utuh desktop seluruh 8 seksi komponen)
- `gallery-1440px-top.png` (Tangkapan layar atas desktop 1440×900)
- `gallery-390px-full.png` (Tangkapan utuh perangkat ponsel 390px)
- `gallery-390px-top.png` (Tangkapan layar atas ponsel 390×844)
