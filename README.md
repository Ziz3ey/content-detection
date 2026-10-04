# Content Detection

Proyek skripsi Program Studi Informatika.

## Judul

Implementasi Web Crawling dan Pattern Matching untuk Deteksi Indikasi Konten Negatif pada Situs Web Pemerintah Kabupaten Sumbawa Berbasis Arsitektur Microservices.

## Struktur Proyek

```text
.
|-- dashboard/
|-- data/
|-- services/
|   |-- aggregator-service/
|   |-- crawler-service/
|   |-- defacement-service/
|   |-- link-detection-service/
|   `-- text-detection-service/
|-- .gitignore
|-- package.json
`-- README.md
```

Folder-folder layanan dan pendukung telah disiapkan untuk pengembangan bertahap. Implementasi komponennya belum dimulai.

## Persyaratan

- Node.js 22 atau lebih baru
- npm

## Pemeriksaan

Jalankan dari direktori root proyek:

```bash
npm test
```

Perintah tersebut menggunakan test runner bawaan Node.js. Belum ada dependency eksternal yang diperlukan pada tahap inisialisasi.

## Status

Tahap 0: inisialisasi project. Tahap pengembangan layanan belum dimulai.
