# Aggregator Service

REST API terpusat yang memvalidasi request, memanggil microservice detector yang sudah ada, dan menggabungkan response tanpa mengimplementasikan ulang logic detector.

## Arsitektur

```text
Client
  |
  v
Aggregator API
  |----> Crawler Service
  |       `----> HTML/text extraction
  |----> Text Detection Service
  |----> Defacement Detection Service
  `----> Link Detection Service
          |
          v
       SQLite data-access repository
```

Crawler dan detector dipanggil melalui HTTP REST. Untuk setiap halaman crawl yang berhasil, ketiga detector berjalan paralel. Aggregator tidak mengimpor kode internal crawler/detector.

## API

### GET /health

Mengembalikan HTTP `200` selama aggregator berjalan. Endpoint ini tidak memanggil downstream sehingga status health tidak berubah saat service detector mati.

```json
{
  "success": true,
  "service": "aggregator-service",
  "status": "ok"
}
```

### POST /api/v1/analyze

Request mengirim data sesuai kontrak tiga downstream:

```json
{
  "url": "https://example.test/page",
  "text": "Visible text to analyze",
  "html": "<html><body>Current page</body></html>",
  "baseline": {
    "html": "<html><body>Baseline page</body></html>"
  }
}
```

Aggregator mengirim `text` ke Text Detection, `html` dan `baseline.html` ke Defacement Detection, serta `url` ke Link Detection. URL hanya divalidasi sebagai data; aggregator tidak membukanya.

Response sukses mempertahankan setiap response downstream:

```json
{
  "success": true,
  "data": {
    "url": "https://example.test/page",
    "textDetection": {
      "success": true,
      "data": { "detected": false, "categories": [] }
    },
    "defacementDetection": {
      "success": true,
      "data": { "detected": false, "indicators": [] }
    },
    "linkDetection": {
      "success": true,
      "data": { "detected": false, "indicators": [] }
    }
  }
}
```

Jika satu downstream gagal, field service tersebut menjadi `success: false` dengan `error.code` dan pesan aman; hasil dua service lain tetap tersedia. Error service tidak diubah menjadi `detected: false`. Request invalid menghasilkan HTTP `400`; kegagalan downstream menghasilkan HTTP `200` dengan status per-service; error internal aggregator menghasilkan HTTP `500` generik.

### POST /api/v1/scan

Entry point end-to-end yang menerima konfigurasi crawler dan baseline HTML opsional, dipetakan berdasarkan URL halaman:

```json
{
  "crawler": {
    "startUrl": "http://127.0.0.1:4173/",
    "allowedHosts": ["127.0.0.1"],
    "maxDepth": 1,
    "maxPages": 10,
    "requestDelayMs": 0,
    "requestTimeoutMs": 10000
  },
  "baselinesByUrl": {
    "http://127.0.0.1:4173/": "<html>known local baseline</html>"
  }
}
```

Aggregator memanggil `POST /api/v1/crawl`, lalu mengirim `text` ke Text Detection, `html` dan `baseline.html` ke Defacement, serta URL tiap halaman hasil crawl ke Link Detection. Baseline boleh tidak diberikan; Defacement kemudian ditandai `BASELINE_NOT_PROVIDED` pada response dan `skipped`/SQL `NULL` di database, bukan hasil false.

Response berisi hasil tiap halaman, status/error detector terpisah, serta record ID dan timestamp. Kegagalan database membatalkan penyimpanan batch dan menghasilkan HTTP `500`; tidak ada response scan sukses tanpa persistence. Error detector disimpan sebagai `failed`; crawl failure disimpan sebagai `crawlStatus: failed` dan detector yang tidak dijalankan berstatus `skipped`.

### GET /api/v1/scans/recent?limit=10

Mengambil riwayat melalui repository SQLite. `limit` opsional, default repository 20 dan maksimum API 100.

```json
{
  "success": true,
  "data": {
    "scans": []
  }
}
```

### GET /api/v1/scans/:id

Mengambil satu hasil tersimpan. Response menggunakan `{ "success": true, "data": { "scan": {} } }`; scan yang tidak ditemukan menghasilkan HTTP `404`.

## Konfigurasi

Semua URL dan timeout dapat diatur melalui environment variable. `.env.example` berisi nilai lokal; file ini tidak dimuat otomatis dan tidak menyimpan secret.

| Variable                            | Default                 |
| ----------------------------------- | ----------------------- |
| `PORT`                              | `3004`                  |
| `DASHBOARD_ORIGIN`                  | `http://localhost:5173` |
| `CRAWLER_SERVICE_URL`               | `http://localhost:3001` |
| `CRAWLER_TIMEOUT_MS`                | `120000`                |
| `TEXT_DETECTION_URL`                | `http://localhost:3000` |
| `TEXT_DETECTION_TIMEOUT_MS`         | `5000`                  |
| `DEFACEMENT_SERVICE_URL`            | `http://localhost:3002` |
| `DEFACEMENT_SERVICE_TIMEOUT_MS`     | `5000`                  |
| `LINK_DETECTION_SERVICE_URL`        | `http://localhost:3003` |
| `LINK_DETECTION_SERVICE_TIMEOUT_MS` | `5000`                  |
| `DATABASE_PATH`                     | `data/scans.sqlite`     |

Aggregator tidak melakukan retry. Setiap downstream request memiliki timeout tersendiri. Response non-JSON, malformed, HTTP error, connection failure, dan timeout dikonversi menjadi error service yang aman.

Browser dashboard hanya diizinkan dari origin yang ditetapkan oleh `DASHBOARD_ORIGIN`. Atur ke origin dashboard production (tanpa path) saat frontend dan aggregator berjalan pada origin berbeda.

`/api/v1/analyze` memerlukan URL HTTP/HTTPS, text, HTML, dan `baseline.html` non-kosong. `/api/v1/scan` menerima config crawler dan optional `baselinesByUrl`. URL maksimum 2048 karakter; text maksimum 10000; HTML dan baseline masing-masing maksimum 1 MiB. Body request memiliki batas ukuran terkonfigurasi.

## Menjalankan lokal

Jalankan setiap service di terminal tersendiri:

```powershell
cd services/crawler-service
npm run start:api
```

```powershell
cd services/text-detection-service
npm run start
```

```powershell
cd services/defacement-service
npm run start
```

```powershell
cd services/link-detection-service
npm run start
```

Lalu jalankan aggregator:

```powershell
cd services/aggregator-service
$env:CRAWLER_SERVICE_URL = "http://localhost:3001"
$env:TEXT_DETECTION_URL = "http://localhost:3000"
$env:DEFACEMENT_SERVICE_URL = "http://localhost:3002"
$env:LINK_DETECTION_SERVICE_URL = "http://localhost:3003"
$env:DATABASE_PATH = "data/scans.sqlite"
npm run start
```

Gunakan target lokal/fixture dan allowlist crawler yang sesuai. Jangan menjalankan scan terhadap situs pemerintah tanpa izin.

## Testing

Jalankan `npm test` dari direktori service. E2E memakai HTTP apps loopback, fixture sintetis, dan SQLite temporary. Root regression: `npm test -- --test-concurrency=1`.
