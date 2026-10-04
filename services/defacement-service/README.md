# Defacement Detection Service

Functional prototype Node.js untuk menghasilkan **indikasi perubahan/ketidaksesuaian** halaman dengan membandingkan halaman saat ini terhadap baseline yang diberikan. Service ini tidak memastikan bahwa suatu website telah mengalami defacement dan tidak memiliki klaim accuracy, precision, recall, atau F1-score.

## Mekanisme

1. Cheerio membaca HTML sebagai data dan mengambil title serta visible text dari body. Script, style, noscript, dan template tidak dimasukkan ke text; JavaScript halaman tidak dijalankan.
2. Text dinormalisasi dengan Unicode NFC, penyamaan line ending, penyatuan semua whitespace menjadi satu spasi, dan trim. Perbedaan format whitespace saja tidak menghasilkan perubahan hash. Konten dinamis lain tidak otomatis diabaikan.
3. SHA-256 membandingkan visible text halaman sekarang dengan visible text baseline. Hash adalah indikator perubahan, bukan satu-satunya bukti dan bukan klaim defacement.
4. Detector terpisah memeriksa perubahan title dan pola text yang dikonfigurasi. Semua indikator yang cocok dikembalikan; `detected` bernilai true jika sedikitnya satu indikator ditemukan.

Pola bawaan `hacked by` dan `site has been defaced` adalah heuristik prototype yang dapat diubah di `src/config/defacement-config.js`, bukan dataset penelitian atau daftar yang mendeteksi seluruh jenis defacement. Indikator tidak menghasilkan confidence atau risk score.

## API

Service berjalan pada port `3002` secara default. Override dengan environment variable `PORT`.

### GET /health

Mengembalikan HTTP `200`:

```json
{
  "success": true,
  "service": "defacement-service",
  "status": "ok"
}
```

### POST /api/v1/detect

Kirim `Content-Type: application/json` dengan HTML sekarang serta baseline HTML:

```json
{
  "html": "<html><head><title>Local Portal</title></head><body><p>Service information.</p></body></html>",
  "baseline": {
    "html": "<html><head><title>Local Portal</title></head><body><p>Service information.</p></body></html>"
  }
}
```

Response tanpa indikasi:

```json
{
  "success": true,
  "data": {
    "detected": false,
    "indicators": []
  }
}
```

Jika ada perbedaan baseline atau pola yang cocok, response memuat indikator terkait, misalnya:

```json
{
  "success": true,
  "data": {
    "detected": true,
    "indicators": [
      {
        "type": "content_change",
        "detected": true,
        "description": "Representasi text halaman berbeda dari baseline."
      }
    ]
  }
}
```

`html` dan `baseline.html` harus berupa string non-kosong, masing-masing maksimum 1 MiB. Request body juga dibatasi. Input invalid mengembalikan HTTP `400`; JSON malformed `400`; body terlalu besar `413`; content type selain JSON `415`. Error internal mengembalikan HTTP `500` dengan JSON generik tanpa stack trace/path.

## Menjalankan service

```powershell
npm run start
```

Contoh request PowerShell lokal:

```powershell
curl.exe -X POST http://localhost:3002/api/v1/detect `
  -H "Content-Type: application/json" `
  -d '{"html":"<title>Local Portal</title><p>Service information.</p>","baseline":{"html":"<title>Local Portal</title><p>Service information.</p>"}}'
```

## Testing

Jalankan `npm test` dari direktori service. Test memakai fixture HTML sintetis di `tests/fixtures/` dan server loopback; tidak mengakses website internet.

## Posisi arsitektur dan batasan

Pada tahap berikutnya crawler dapat mengirim hasil halaman ke Defacement Detection Service. Integrasi tersebut belum dibuat. Belum ada database, dashboard, aggregator, ML, evaluasi metrik, atau mekanisme untuk memastikan defacement.
