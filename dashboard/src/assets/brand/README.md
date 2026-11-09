# Brand Assets — Content Detection System

Direktori ini digunakan untuk menyimpan aset identitas visual resmi Pemerintah Kabupaten Sumbawa dan Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Sumbawa.

## Petunjuk Penempatan Logo:
1. **Lambang Pemerintah Kabupaten Sumbawa:**
   - Nama file: `logo-pemkab.svg` (atau `.png`, `.webp`)
   - Rekomendasi format: SVG (Scalable Vector Graphics)
   - Tinggi tampilan pada antarmuka: `40px`

2. **Logo Dinas Kominfosandi:**
   - Nama file: `logo-diskominfo.svg` (atau `.png`, `.webp`)
   - Rekomendasi format: SVG
   - Tinggi tampilan pada antarmuka: `40px`

## Perilaku Komponen `BrandMark`:
Komponen `BrandMark.jsx` membaca file di direktori ini secara otomatis menggunakan `import.meta.glob('../assets/brand/logo-*.{svg,png,webp}', { eager: true })`.
- Bila `logo-pemkab` tersedia, logo resmi akan ditampilkan secara otomatis.
- Bila belum tersedia, komponen akan menampilkan monogram institusional netral (kotak 36×36px, radius 6px, latar `--color-primary` dengan teks "CD").
