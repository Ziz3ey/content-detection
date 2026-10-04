# Data Access Layer

Package SQLite terisolasi untuk menyimpan hasil pemeriksaan. Tahap ini hanya menyediakan schema dan repository; service detector dan aggregator belum dihubungkan ke database.

## Database

Menggunakan SQLite melalui `better-sqlite3`: database lokal berbentuk satu file, tidak memerlukan server eksternal, dan cocok untuk pengembangan/testing lokal.

Path default adalah `data/scans.sqlite` di root workspace. Override dengan `DATABASE_PATH`; path relatif ditafsirkan dari root workspace, path absolut digunakan apa adanya. `.env.example` hanya contoh, tidak dimuat otomatis dan tidak berisi secret. File database development, WAL, dan sidecar DB di `data/` diabaikan Git.

## Initialization

Dari root workspace:

```powershell
npm --prefix packages/data-access run db:init
```

Perintah idempotent membuat direktori database bila belum ada, membuat tabel/index bila belum tersedia, dan menetapkan `user_version` schema ke `1`.

Untuk path lain:

```powershell
$env:DATABASE_PATH = "data/local-scans.sqlite"
npm --prefix packages/data-access run db:init
```

## Schema

Satu tabel `scans` menyimpan:

- `id`: UUID text sebagai primary key.
- `url`, `scanned_at`, `crawl_status`, `http_status`, `content_type`, `title`.
- Status dan result JSON text terpisah untuk Text Detection, Defacement Detection, dan Link Detection.

Status crawl adalah `success` atau `failed`. Status detector adalah `success`, `failed`, atau `skipped`. Result JSON disimpan apa adanya. Nilai `data.detected: false` dengan response `success: true` tetap berstatus service `success`; kegagalan service tidak pernah diubah menjadi hasil deteksi false. Field detector yang tidak diberikan disimpan sebagai status `skipped` dan result SQL `NULL`.

## Repository

Import API dari package `src`:

```js
const { createDataAccess } = require("./src");

const dataAccess = createDataAccess();
const scan = dataAccess.scans.create({
  url: "https://example.test/page",
  crawlStatus: "success",
  httpStatus: 200,
  contentType: "text/html",
  title: "Example",
  textDetection: { success: true, data: { detected: false, categories: [] } },
  defacementDetection: {
    success: true,
    data: { detected: false, indicators: [] },
  },
  linkDetection: { success: true, data: { detected: false, indicators: [] } },
});

const sameScan = dataAccess.scans.findById(scan.id);
const recentScans = dataAccess.scans.findRecent(20);
const scansForUrl = dataAccess.scans.findByUrl("https://example.test/page");
dataAccess.close();
```

Repository memakai prepared statements. Validasi URL/status/timestamp/result terjadi sebelum penyimpanan. Result harus berupa JSON object yang valid; nilai `undefined`, circular references, dan tipe non-JSON ditolak. Batas field berada di konfigurasi package. Error operasi database dibungkus sebagai `DataAccessError` dengan pesan aman; sebab asli tersedia hanya sebagai `cause` internal.

## Testing

```powershell
npm --prefix packages/data-access test
```

Test memakai file SQLite terpisah di direktori temporary dan membersihkannya setelah selesai. Database development tidak digunakan oleh test.

## Reset development database

Pastikan tidak ada proses yang sedang membuka database, lalu dari root:

```powershell
Remove-Item .\data\scans.sqlite, .\data\scans.sqlite-wal, .\data\scans.sqlite-shm -ErrorAction SilentlyContinue
npm --prefix packages/data-access run db:init
```
