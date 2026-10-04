# Crawler Service

Crawler HTML sederhana dan sequential untuk mengambil halaman dalam scope host yang secara eksplisit diizinkan. Text hasil parsing dapat dikirim ke Text Detection Service melalui REST API; kedua service tidak berbagi import runtime.

## Arsitektur

`crawl(config)` memvalidasi konfigurasi, mengambil dan memeriksa `robots.txt`, lalu memproses URL dalam antrean secara berurutan. Fetcher memeriksa timeout, status, content type, redirect, dan ukuran response. Parser Cheerio mengekstrak title, text, dan link tanpa menjalankan JavaScript halaman.

## Konfigurasi

Semua field berikut wajib diberikan:

```js
const config = {
  startUrl: "http://127.0.0.1:4173/",
  allowedHosts: ["127.0.0.1"],
  maxDepth: 2,
  maxPages: 20,
  requestDelayMs: 1000,
  requestTimeoutMs: 10000,
};
```

- `startUrl`: URL HTTP/HTTPS awal dan harus berada dalam allowlist.
- `allowedHosts`: hostname yang diizinkan. Pencocokan bersifat exact; subdomain harus ditulis terpisah. Port tidak digunakan sebagai bagian dari allowlist.
- `maxDepth`: halaman awal berada di depth `0`; link darinya depth `1`.
- `maxPages`: maksimum URL crawl yang diproses, termasuk URL yang gagal atau diblokir robots. Request `robots.txt` tidak dihitung sebagai halaman.
- `requestDelayMs`: jeda minimum antar HTTP request, termasuk robots dan tiap hop redirect. Fetch dilakukan sequential, tidak concurrent.
- `requestTimeoutMs`: timeout untuk tiap HTTP request.

Response body dibatasi hingga 2 MiB. Konfigurasi tidak boleh memakai URL dengan username/password, dan hanya skema HTTP/HTTPS yang diterima.

## Allowed hosts dan URL

URL awal, link, dan setiap tujuan redirect diperiksa sebelum di-fetch. Host di luar `allowedHosts` tidak pernah diikuti; subdomain tidak otomatis diizinkan. Redirect menggunakan mode manual agar tujuan berikutnya dapat diperiksa sebelum request.

URL relative diselesaikan terhadap halaman sumber. Fragment dibuang dan trailing slash pada path non-root dihapus, sehingga URL yang ekuivalen dapat dideduplikasi. Link hasil disajikan sebagai URL absolute yang telah dinormalisasi dan lolos allowlist; link external atau skema non-HTTP(S) tidak dimasukkan maupun diikuti.

## robots.txt

Crawler mengambil `/robots.txt` sekali per hostname sebelum crawl halaman pada host tersebut. Aturan user-agent yang spesifik untuk `AcademicResearchCrawler/1.0` dipilih bila ada; jika tidak, grup `User-agent: *` digunakan. `Allow`, `Disallow`, wildcard `*`, dan end-anchor `$` didukung dengan aturan yang paling spesifik menang; `Allow` menang pada specificity yang sama.

HTTP `404`/`410` diperlakukan sebagai tidak adanya kebijakan robots yang dipublikasikan. Jika robots tidak dapat diperiksa karena timeout, error HTTP lain, atau redirect yang tidak diizinkan, crawler **fail closed** untuk host tersebut dan mencatat URL sebagai gagal. Path yang dilarang tidak di-fetch.

## Hasil

`crawl(config)` mengembalikan array hasil per URL yang diproses. Halaman HTML sukses memiliki bentuk:

```json
{
  "url": "http://127.0.0.1:4173/page",
  "status": 200,
  "contentType": "text/html",
  "title": "Example page",
  "text": "Visible page text",
  "links": ["http://127.0.0.1:4173/next"],
  "depth": 0,
  "success": true
}
```

URL gagal memiliki `success: false` dan object `error` dengan `code` serta `message`; timeout, status HTTP gagal, robots block, non-HTML, dan redirect ke host yang tidak diizinkan dapat dibedakan. Kegagalan sebuah URL tidak menghentikan pemrosesan antrean.

Hanya response `text/html` yang diparse. Response non-HTML tidak menghasilkan title/text/links. Isi `script`, `style`, `noscript`, dan `template` tidak disertakan dalam text. Tidak ada JavaScript halaman yang dieksekusi.

## Menjalankan crawler

Crawler menyediakan fungsi `crawl(config)` dan CLI. CLI mewajibkan file konfigurasi agar tidak ada target crawl default.

Contoh `crawler-config.json` untuk server fixture lokal:

```json
{
  "startUrl": "http://127.0.0.1:4173/",
  "allowedHosts": ["127.0.0.1"],
  "maxDepth": 2,
  "maxPages": 20,
  "requestDelayMs": 1000,
  "requestTimeoutMs": 10000
}
```

Jalankan dari direktori service dengan `npm run start -- .\crawler-config.json`. Untuk penggunaan sebagai library, import `crawl` dari `src` dan berikan object konfigurasi yang sama.

Crawler juga menyediakan HTTP API untuk orkestrasi tahap integrasi:

- `GET /health`
- `POST /api/v1/crawl`, body berisi object config crawler yang sama dengan contoh di atas; response `data.pages` menyertakan raw `html` untuk aggregator.

Jalankan API dengan `npm run start:api`. Port default `3001`, dapat diubah melalui environment variable `PORT`. Endpoint ini tidak memanggil Text Detection internal; detector dipanggil aggregator melalui REST API masing-masing.

## Text Detection Integration

Untuk setiap halaman HTML yang berhasil diambil, crawler mengirim **text hasil ekstraksi**, bukan HTML, melalui `POST /api/v1/detect` dengan `Content-Type: application/json`. Response Text Detection yang valid diteruskan tanpa mengubah `detected`, kategori, atau matches.

Hasil halaman mempertahankan field crawl flat yang tersedia sebelumnya dan menambahkan `crawl` (ringkasan `status`, `contentType`, `title`) serta `detection`. Jika Text Detection gagal, crawl halaman tetap sukses dan `detection` berisi `success: false` dengan error terkontrol; proses berlanjut ke halaman berikutnya.

Konfigurasi dibaca dari environment. [.env.example](.env.example) mencantumkan nilai awal, tetapi tidak dimuat otomatis karena crawler tidak memakai dotenv:

- `TEXT_DETECTION_URL`: base URL service, default `http://localhost:3000`.
- `TEXT_DETECTION_TIMEOUT_MS`: timeout per request, default `5000`.
- `TEXT_DETECTION_MAX_RETRIES`: retry tambahan, default `1`, rentang `0` sampai `3`. Hanya timeout/koneksi dan HTTP 5xx yang dicoba ulang; response malformed dan HTTP 4xx tidak di-retry.

Request dimulai, response diterima, timeout, retry, dan error dicatat tanpa mencatat text/HTML atau query URL. URL yang ditulis ke log dibersihkan dari credentials dan query string.

### Menjalankan dua service secara lokal

Siapkan file konfigurasi crawler dengan target server fixture lokal yang Anda jalankan sendiri. Dari root workspace, jalankan Text Detection di terminal pertama:

```powershell
cd services/text-detection-service
$env:PORT = "3000"
npm run start
```

Jalankan crawler di terminal kedua; `.\crawler-config.json` harus berisi URL fixture lokal dan allowlist host yang sesuai:

```powershell
cd services/crawler-service
$env:TEXT_DETECTION_URL = "http://localhost:3000"
$env:TEXT_DETECTION_TIMEOUT_MS = "5000"
$env:TEXT_DETECTION_MAX_RETRIES = "1"
npm run start -- .\crawler-config.json
```

Integration tests menjalankan web fixture dan mock Text Detection pada loopback. Satu E2E test menjalankan proses Text Detection lokal yang sebenarnya dan membuktikan pattern fixture `alpha` ditemukan. Tidak ada test yang mengakses website publik. Jangan menjalankan crawl ke situs Pemerintah Kabupaten Sumbawa tanpa izin.

## Testing

Dari direktori service:

```powershell
npm test
```

Test memakai HTTP server loopback dan fixture HTML; tidak memerlukan akses internet. Dari root workspace, `npm test` menjalankan seluruh test project.
