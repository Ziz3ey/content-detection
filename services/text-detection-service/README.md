# Text Detection Service

Service Node.js untuk menyiapkan text dan mencocokkan pattern guna mendeteksi **indikasi** konten negatif. Hasil pencocokan menunjukkan pattern yang ditemukan, bukan kepastian bahwa halaman mengandung konten negatif.

## Kategori

- `gambling` - judi online
- `fraud` - penipuan
- `pornography` - pornografi

Kategori tersebut digunakan untuk mengelompokkan pattern. Pattern `alpha`, `beta`, dan `gamma` di registry saat ini hanyalah fixture sederhana untuk pengembangan dan pengujian, bukan keyword atau dataset final penelitian.

## Batasan

- Tidak ada Machine Learning atau API AI eksternal.
- Text hanya divalidasi dan dinormalisasi dengan lowercase, trim, serta penyatuan whitespace.
- Aho-Corasick tersedia sebagai engine internal tanpa library matching eksternal.
- Tidak ada confidence score atau klaim evaluasi.
- Service belum menggunakan database atau keyword list eksternal.

## Aho-Corasick Pattern Matching

- Pattern berkategori dimasukkan ke Trie.
- Failure link dibangun menggunakan breadth-first traversal agar automaton dapat melanjutkan pencarian setelah mismatch.
- Text dinormalisasi menggunakan utility Tahap 1, lalu diproses karakter demi karakter.
- Saat transisi tidak tersedia, engine mengikuti failure link sampai transisi ditemukan atau kembali ke root.
- Output pada node, termasuk output dari failure link, menghasilkan seluruh pattern yang cocok, termasuk overlapping matches.
- Setiap match memuat `pattern`, `category`, serta indeks `start` dan `end` yang inklusif pada text ternormalisasi.
- Pattern duplikat yang sama setelah normalisasi dan memiliki kategori sama disimpan satu kali. Pattern sama dengan kategori berbeda tetap menghasilkan match untuk masing-masing kategori.

Engine dapat digunakan melalui `new AhoCorasick(patterns)` dan `matcher.search(text)`. `PATTERN_REGISTRY` berisi fixture sederhana untuk pengembangan; registry tersebut bukan dataset keyword final penelitian.

## Struktur

```text
text-detection-service/
|-- src/
|   |-- config/
|   |   |-- categories.js
|   |   |-- patterns.js
|   |   `-- server.js
|   |-- detectors/
|   |   |-- aho-corasick.js
|   |   `-- text-detector.js
|   |-- controllers/
|   |   |-- detection-controller.js
|   |   `-- health-controller.js
|   |-- middleware/
|   |   `-- error-handler.js
|   |-- routes/
|   |   `-- index.js
|   |-- services/
|   |   `-- detection-service.js
|   |-- utils/
|   |   |-- http-error.js
|   |   |-- normalize-text.js
|   |   |-- read-json-body.js
|   |   |-- send-json.js
|   |   |-- validate-detection-input.js
|   |   `-- validate-text.js
|   |-- app.js
|   |-- index.js
|   `-- server.js
|-- tests/
|   |-- aho-corasick.test.js
|   |-- api.test.js
|   |-- normalize-text.test.js
|   `-- text-detector.test.js
|-- package.json
`-- README.md
```

## API

Server berjalan pada port `3000` secara default. Atur environment variable `PORT` untuk menggunakan port lain.

### GET /health

Memeriksa bahwa service aktif. Response HTTP `200`:

```json
{
  "success": true,
  "service": "text-detection-service",
  "status": "ok"
}
```

### POST /api/v1/detect

Request harus menggunakan `Content-Type: application/json` dan mengirim object dengan field `text`:

```json
{
  "text": "alpha"
}
```

Text harus berupa string non-kosong dan paling panjang `10000` karakter. Text dinormalisasi oleh matcher Aho-Corasick Tahap 2. Response sukses mengelompokkan match aktual berdasarkan kategori; kategori tanpa match tidak disertakan. Pattern `alpha`, `beta`, dan `gamma` adalah fixture pengembangan, bukan keyword final penelitian.

Contoh response ketika fixture `alpha` ditemukan:

```json
{
  "success": true,
  "data": {
    "detected": true,
    "categories": [
      {
        "category": "gambling",
        "matches": [{ "pattern": "alpha", "start": 0, "end": 4 }]
      }
    ]
  }
}
```

Jika tidak ada pattern yang cocok, `detected` bernilai `false` dan `categories` berupa array kosong. Hasil ini menunjukkan indikasi berdasarkan pattern yang terdaftar; bukan kepastian tentang isi halaman.

Request invalid atau JSON malformed menghasilkan HTTP `400` dengan `success: false` dan object `error`. Text yang melewati batas karakter juga ditolak. Content-Type yang bukan JSON menghasilkan HTTP `415`; payload request yang terlalu besar menghasilkan HTTP `413`. Error internal menghasilkan HTTP `500` tanpa detail implementasi pada response.

### Menjalankan service

Dari direktori `services/text-detection-service`:

```powershell
npm run start
```

Contoh request dari PowerShell menggunakan `curl.exe`:

```powershell
curl.exe -X POST http://localhost:3000/api/v1/detect `
	-H "Content-Type: application/json" `
	-d '{"text":"alpha"}'
```

### Menjalankan test

Dari direktori service jalankan `npm test`. Dari root project, `npm test` menjalankan seluruh test workspace.
