# Link Detection Service

REST service untuk menghasilkan **indikasi tautan mencurigakan** dari karakteristik URL yang dapat dijelaskan. Service hanya menganalisis string URL; tidak membuka URL, melakukan DNS lookup, scanning, atau memastikan URL benar-benar malicious.

## Rule dan indikator

Rule terpisah mengembalikan indikator, bukan keputusan absolut:

- `long_url`: URL melewati 75% dari `MAX_URL_LENGTH` (2048 karakter). URL yang melebihi batas ditolak saat validasi.
- `many_subdomains`: jumlah label sebelum dua label terakhir melebihi `MAX_SUBDOMAIN_COUNT` (2). Ini hitungan sederhana dan tidak menggunakan Public Suffix List.
- `ip_hostname`: hostname berupa literal IPv4 atau IPv6.
- `unusual_hostname`: hostname berisi label punycode (`xn--`) atau label dengan minimal tiga tanda hubung.
- `encoded_url_structure`: path/query meng-encode karakter URL struktural seperti titik, slash, backslash, query, fragment, atau `@`; encoding yang valid tetap hanya indikator.
- `url_credentials`: URL mencantumkan username/password sebelum hostname.
- `suspicious_path`: path cocok dengan rule konfigurasi untuk `/.env`, `/.git`, atau `wp-config.php`.
- `external_redirect_parameter`: parameter redirect yang dikonfigurasi (`next`, `redirect`, `return`, dan beberapa variasi) memuat URL absolut dengan origin berbeda.

Threshold, pola path, nama parameter redirect, batas URL, dan port service berada di `src/config/link-detection-config.js`. Port URL sengaja tidak dijadikan rule: port non-default saja terlalu kontekstual untuk menjadi indikator yang berguna. Satu atau beberapa indikator tidak membuktikan URL berbahaya.

## API

Service mendengarkan port `3003` secara default; environment variable `PORT` dapat menggantinya.

### GET /health

Response HTTP `200`:

```json
{
  "success": true,
  "service": "link-detection-service",
  "status": "ok"
}
```

### POST /api/v1/detect

Request harus berupa JSON dengan URL absolut berskema `http` atau `https`:

```json
{
  "url": "https://192.0.2.10/page"
}
```

URL valid tanpa indikator:

```json
{
  "success": true,
  "data": {
    "detected": false,
    "indicators": []
  }
}
```

Contoh response dengan indikator:

```json
{
  "success": true,
  "data": {
    "detected": true,
    "indicators": [
      {
        "type": "ip_hostname",
        "description": "Hostname menggunakan alamat IP; ini merupakan indikator untuk ditinjau."
      }
    ]
  }
}
```

Field `url` wajib berupa string non-kosong dan maksimum 2048 karakter. `javascript:`, `data:`, `file:`, dan skema lain ditolak dengan HTTP `400`. JSON malformed menghasilkan HTTP `400`, request body terlalu besar `413`, dan content type non-JSON `415`. Error internal mengembalikan HTTP `500` generik tanpa stack trace atau detail filesystem.

## Menjalankan service dan test

```powershell
npm run start
npm test
```

Test menggunakan URL sintetis dan server API loopback; test tidak mengunjungi URL yang dianalisis atau mengakses internet.

## Batasan dan posisi arsitektur

Service ini bukan vulnerability scanner dan bukan pemeriksa reputasi/domain. Tidak ada crawling, browsing otomatis, DNS/port scanning, ML, atau integrasi crawler pada tahap ini. Hasil hanya indikasi berdasarkan rule tersedia, dapat memiliki false positive, dan belum dievaluasi menggunakan accuracy, precision, recall, atau F1-score.
