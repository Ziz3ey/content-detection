# PROMPT 3 — Langkah 2: Perapihan Fondasi + Pustaka Komponen Dasar

> Salin seluruh isi di bawah garis ini ke Antigravity (workspace: folder project, frontend di `dashboard/`).

---

## PERAN

Kamu adalah front-end engineer senior dengan fokus design system. Langkah 1 (design tokens) sudah selesai. Pada langkah ini kamu mengerjakan dua hal: **(A) perapihan fondasi** dan **(B) membangun pustaka komponen dasar** yang akan dipakai seluruh halaman pada langkah berikutnya. **Halaman yang ada belum boleh dimigrasikan ke komponen baru** pada langkah ini.

## ARAH DESAIN (wajib diikuti)

Institusional, tenang, informatif, padat data. Tema terang. Border tipis daripada shadow. Radius maksimal 8px. Tanpa glow, gradient, glassmorphism, neon, atau efek mengambang saat hover. Warna status hanya untuk makna status. Semua teks menggunakan token tipografi. Semua warna, spasi, radius, dan shadow **hanya** dari token di `src/styles/tokens.css`. Dilarang hardcode hex/rgb di file komponen baru.

## ATURAN KETAT

1. Jangan mengubah logika, API, routing, state, atau teks UI pada halaman yang sudah ada. Jangan menyentuh `api.js`, `formatters.js`, `reportExporter.js`.
2. Jangan menambah library baru (tanpa Tailwind, tanpa Radix, tanpa headless UI, tanpa library animasi). Ikon tetap `lucide-react`.
3. Komponen baru berada di `dashboard/src/components/`. Semua class CSS komponen baru memakai awalan `ui-` agar tidak bentrok dengan `styles.css`. CSS komponen ditulis di `dashboard/src/components/components.css` dan diimpor di `main.jsx` setelah `styles.css`.
4. Pastikan `npm test` dan `npm run build` tetap sukses di setiap tahap.
5. Semua komponen harus bisa dioperasikan penuh dengan keyboard, punya fokus yang terlihat (gunakan gaya `:focus-visible` global dari tokens), dan memakai atribut ARIA yang benar.

## BAGIAN A — Perapihan Fondasi (kerjakan lebih dulu)

**A1. Periksa variable CSS yang tidak terdefinisi.** Build tetap lulus walau ada `var(--xxx)` yang tidak terdefinisi, sehingga ini berbahaya tanpa terlihat. Tulis skrip sekali pakai (di luar `src`, jangan di-commit) yang:
1. Mengumpulkan semua nama variable yang dipakai lewat `var(--...)` di `src/**/*.{css,jsx,js}`.
2. Mengumpulkan semua variable yang dideklarasikan (di `tokens.css`, `styles.css`, dan inline).
3. Melaporkan variable yang dipakai tapi tidak pernah dideklarasikan (abaikan yang punya fallback `var(--x, nilai)` namun tetap laporkan terpisah).
Terutama periksa nama lama dari audit seperti `--navy-*`, `--cyan-*`, `--ink`, `--line`, `--line-strong`, `--muted`, `--bg-soft`, `--surface`, `--font-sans`, `--font-mono`, `--space-*`, `--sidebar-width`, `--topbar-height`, `--main-gap`. Untuk setiap variable yang hilang, tambahkan alias ke token baru yang paling sesuai di blok `LEGACY ALIASES` pada `tokens.css`, lalu ulangi skrip sampai hasilnya nol.

**A2. Fokus pada ring yang berupa `box-shadow`.** Pada Langkah 1, deklarasi seperti `box-shadow: 0 0 0 3px rgba(...)` ditandai `TODO-REDESIGN`, padahal sebagian besar adalah ring fokus input, bukan dekorasi. Telusuri semua yang bertanda TODO-REDESIGN pada `styles.css`. Untuk yang berupa ring fokus (`0 0 0 Npx`), ganti dengan `box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-focus-ring)` dan hapus tanda TODO-nya. Untuk glow/gradient/radial/pulse yang benar-benar dekoratif, biarkan tetap bertanda TODO.

**A3. Kurangi bobot font.** Laporan Langkah 1 mencatat 68 file font dimuat. Ganti impor `@fontsource` di `main.jsx` menjadi subset latin saja, misalnya `@fontsource/ibm-plex-sans/latin-400.css`, `latin-500.css`, `latin-600.css`, `latin-700.css`, dan `@fontsource/ibm-plex-mono/latin-400.css`, `latin-500.css`. Periksa bahwa teks Indonesia tampil normal, lalu laporkan jumlah file font di `dist/` sebelum dan sesudah.

**A4. Sinkronisasi token.** Tulis tes kecil (Vitest) di `src/styles/tokens.test.js` yang membaca `tokens.css` dan membandingkan nilai warna dengan `tokens.js`, supaya keduanya tidak bisa menyimpang tanpa terdeteksi.

## BAGIAN B — Pustaka Komponen Dasar

Buat komponen berikut sebagai file terpisah di `dashboard/src/components/`, dengan ekspor bersama lewat `components/index.js`. Gunakan JSX biasa (proyek ini tidak memakai TypeScript), tambahkan komentar singkat berisi daftar props di bagian atas tiap file.

### B1. `Button`
- Varian: `primary` (latar `--color-primary`, teks `--color-on-primary`), `secondary` (latar surface, border `--color-border`, teks `--color-text`), `ghost` (tanpa border/latar, teks `--color-primary`), `danger` (latar `--color-danger`, teks putih).
- Ukuran: `md` (tinggi `--control-height`), `sm` (tinggi `--control-height-sm`). Radius `--radius-md`. Font `--text-base`, berat `--weight-medium`. Tanpa shadow, tanpa transform saat hover; hover hanya mengubah warna latar.
- Props: `variant`, `size`, `icon` (komponen lucide opsional di kiri), `loading` (menampilkan spinner dan menonaktifkan klik, `aria-busy`), `disabled`, `type` (default `"button"`), `as`/`href` opsional untuk dipakai sebagai tautan.
- Varian `IconButton` untuk tombol hanya-ikon: **wajib** prop `label` yang menjadi `aria-label` dan tooltip `title`; area klik minimal 36×36px.

### B2. Form: `Field`, `Input`, `Select`, `Textarea`, `Checkbox`
- `Field` membungkus label, kontrol, teks bantuan (`hint`), dan pesan galat (`error`). Menghubungkan `htmlFor`/`id`, `aria-describedby`, dan `aria-invalid` secara otomatis (gunakan `useId`). Tanda wajib diisi memakai teks "(wajib)" atau tanda bintang dengan `aria-hidden` plus teks tersembunyi untuk pembaca layar.
- Input/Select/Textarea: tinggi `--control-height` (textarea bebas), border `--color-border`, radius `--radius-md`, fokus memakai ring fokus dari A2, state error memakai `--color-danger` pada border, state disabled memakai `--color-surface-muted` dan `--color-text-disabled`. Placeholder memakai `--color-text-tertiary`. Dukung ikon awalan opsional pada `Input` dan tombol toggle sandi opsional.
- Textarea punya varian `mono` (font IBM Plex Mono) untuk input HTML/regex/URL.
- `Checkbox` dengan label yang bisa diklik dan area klik yang cukup.

### B3. `Badge` dan `StatusBadge`
- `Badge`: kotak kecil (radius `--radius-sm`, **bukan pill**), tinggi sekitar 22px, font `--text-xs`, berat `--weight-medium`. Tone: `neutral`, `info`, `success`, `warning`, `danger`, plus `category` dengan prop `category` (`gambling`, `fraud`, `pornography`, `link`, `defacement`) memakai token `--color-cat-*`. Gunakan latar `-soft`, teks warna status, border `-border`.
- Prop `icon` dan `dot` opsional. **Status tidak boleh hanya mengandalkan warna**: `StatusBadge` selalu memiliki label teks dan ikon.
- `StatusBadge` mengkodekan status domain: `clean` ("Bebas indikasi"), `indicated` ("Terindikasi"), `failed` ("Gagal"), `running` ("Berjalan"), `pending` ("Menunggu"), `active` ("Aktif"), `inactive` ("Nonaktif"). Teks default boleh diganti lewat `children`.

### B4. `Card`
- `Card`, `CardHeader` (judul, deskripsi, slot aksi di kanan), `CardBody`, `CardFooter`. Latar `--color-surface`, border `--color-border`, radius `--radius-lg`, tanpa shadow (atau `--shadow-1` bila dibutuhkan). Prop `padding` (`none`, `md`).
- `StatCard` untuk angka ringkasan: label kecil, nilai besar (`--text-2xl`, font Mono untuk angka), keterangan di bawah, prop `tone` (`default`, `danger`, `success`) yang hanya mengubah warna teks nilai dan sebuah garis aksen vertikal 3px di tepi kiri, tanpa latar berwarna.

### B5. `Table`
- Pembungkus `Table` dengan `overflow-x: auto` dan `role` yang benar. Header (`th`) memakai `--color-surface-muted`, `--text-xs`, huruf kapital kecil dengan `letter-spacing` ringan, berat `--weight-semibold`, teks `--color-text-secondary`; `position: sticky` pada header ketika tinggi dibatasi.
- Baris: tinggi nyaman (padding vertikal `--space-3`), pemisah `--color-border-subtle`, hover `--color-surface-muted`, tanpa zebra. Sel angka rata kanan memakai font Mono dengan `font-variant-numeric: tabular-nums`.
- Dukungan `caption` tersembunyi secara visual untuk aksesibilitas, prop `onRowClick` yang membuat baris dapat difokus dan diaktifkan dengan Enter.
- Buat `TableEmpty` (ikon, judul, deskripsi, aksi opsional) dan `TableSkeleton` (baris placeholder sederhana tanpa animasi shimmer berlebihan; gunakan `prefers-reduced-motion`).
- Buat `Pagination` (info "Menampilkan x–y dari z", tombol sebelumnya/berikutnya, pilihan ukuran halaman) yang murni presentasional, menerima `page`, `pageSize`, `total`, `onChange`.

### B6. `Modal` dan `ConfirmDialog`
- `Modal`: render lewat portal ke `document.body`, `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. Fokus berpindah ke dialog saat dibuka, **terkurung (focus trap)** selama terbuka, kembali ke elemen pemicu saat ditutup. Tutup dengan tombol Esc, klik backdrop (dapat dimatikan lewat prop untuk form yang sedang diisi), dan tombol tutup. Kunci scroll body saat terbuka.
- Backdrop: `rgba` gelap polos dari token (tambahkan `--color-overlay` ke `tokens.css`, mis. `rgba(11, 31, 58, 0.55)`), **tanpa blur**. Ukuran: `sm` (440px), `md` (600px), `lg` (800px). Header (judul + tombol tutup), body yang dapat scroll sendiri, footer aksi rata kanan. Tinggi maksimal `calc(100vh - 48px)`. Di layar ≤ 480px modal memenuhi lebar layar dengan margin kecil.
- `ConfirmDialog`: pengganti `window.confirm`. Props: `open`, `title`, `description`, `confirmLabel`, `cancelLabel`, `tone` (`danger` atau `default`), `busy`, `onConfirm`, `onCancel`. Fokus awal pada tombol batal untuk tone `danger`.

### B7. Umpan balik: `Alert`, `Spinner`, `EmptyState`, `PageHeader`
- `Alert` (inline banner): tone `info/success/warning/danger`, ikon, judul opsional, isi, aksi opsional, tombol tutup opsional. `role="alert"` untuk danger/warning, `role="status"` untuk lainnya. Latar `-soft`, border `-border`, tanpa border-left tebal berwarna.
- `Spinner` ringan (SVG putar, hormati reduced-motion dengan menggantinya jadi teks "Memuat…" yang terlihat).
- `EmptyState` generik (ikon, judul, deskripsi, aksi).
- `PageHeader`: judul halaman (`--text-2xl`, `--weight-semibold`), deskripsi satu baris (`--color-text-secondary`), slot aksi di kanan, breadcrumb opsional. Tidak ada ikon dekoratif besar.

### B8. Navigasi kecil: `SegmentedControl` dan `Tabs`
- `SegmentedControl` untuk filter (mis. Semua/Aktif/Nonaktif, Semua/Manual/Terjadwal): menggantikan "filter pill". Grup tombol bersambung, radius `--radius-md`, item aktif memakai `--color-primary-soft` dengan teks `--color-primary` dan border `--color-primary-border`. Dukungan `role="radiogroup"` atau `tablist` sesuai pemakaian, navigasi panah keyboard, dan jumlah (`count`) opsional per item.
- `Tabs` bergaya garis bawah (underline) dengan pola ARIA tabs.

## BAGIAN C — Galeri Komponen (hanya mode pengembangan)

Buat `dashboard/src/components/ComponentGallery.jsx` yang menampilkan **setiap komponen dengan semua varian dan state-nya** (default, hover tidak perlu, disabled, loading, error, kosong, terisi) dalam satu halaman yang tertata per bagian. Muat halaman ini **hanya** ketika `import.meta.env.DEV` bernilai true dan hash URL adalah `#/_komponen`. Lakukan dengan perubahan sekecil mungkin pada router hash di `App.jsx` (satu cabang kondisi di awal). Pastikan galeri tidak ikut ter-bundle pada build produksi (gunakan `React.lazy` + impor dinamis di balik kondisi `DEV`) dan verifikasi dengan memeriksa isi `dist/`.

## BAGIAN D — Pengujian

Tambahkan tes Vitest + Testing Library di `dashboard/src/components/components.test.jsx` minimal untuk:
- `Button`: klik memanggil handler; `loading` memblokir klik dan memasang `aria-busy`; `IconButton` tanpa `label` memunculkan peringatan atau error pengembangan.
- `Field`+`Input`: label terhubung ke kontrol, pesan galat terhubung lewat `aria-describedby`, `aria-invalid` terpasang.
- `Modal`: terbuka → fokus masuk ke dalam; Tab tidak keluar dari dialog; Esc menutup; fokus kembali ke pemicu; `ConfirmDialog` memanggil `onConfirm`/`onCancel` yang tepat.
- `StatusBadge`: selalu merender teks, bukan hanya warna.
- `SegmentedControl`: panah kiri/kanan memindahkan pilihan.
- `Table` dengan `onRowClick`: Enter pada baris memicu handler.
Semua tes lama (25 tes) harus tetap lulus.

## BAGIAN E — Verifikasi

1. `npm test` dan `npm run build` sukses; bandingkan jumlah tes dan ukuran bundle dengan hasil Langkah 1.
2. Jalankan aplikasi dalam mode dev, buka `#/_komponen`, ambil screenshot galeri pada 1440px dan 390px, simpan di `audit-ui/screenshots/step-02/` (satu gambar per bagian komponen bila halaman panjang).
3. Jalankan ulang skrip variable tak terdefinisi (A1) dan skrip hitung warna: tidak boleh ada nilai hex/rgb di `components.css` dan file komponen selain lewat token.
4. Cek manual keyboard: Tab melalui seluruh galeri dan pastikan setiap kontrol punya fokus yang terlihat dan urutan yang masuk akal.

## OUTPUT

Buat `audit-ui/STEP-02-REPORT.md` berisi:
1. Hasil skrip A1 (variable tak terdefinisi sebelum dan sesudah, dan alias yang ditambahkan).
2. Daftar ring-fokus yang diperbaiki di A2 dan sisa TODO-REDESIGN.
3. Jumlah file font sebelum dan sesudah (A3).
4. Daftar komponen yang dibuat dengan props publiknya (tabel ringkas).
5. Hasil tes (jumlah lulus/gagal) dan hasil build.
6. Bukti galeri tidak ikut ke build produksi.
7. Keputusan desain yang kamu ambil di luar spesifikasi ini beserta alasannya, dan hal-hal yang menurutmu sebaiknya diubah.
8. Daftar file baru dan file yang diubah.

Setelah selesai, ringkas di chat: status tes/build, jumlah komponen, dan lokasi laporan serta screenshot.
