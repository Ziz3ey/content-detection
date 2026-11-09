# Laporan Langkah 5A — Perbaikan Keamanan: Endpoint `GET /api/v1/sites` Terbuka Tanpa Login

> **Tanggal**: 9 November 2026  
> **Status**: Selesai & Terverifikasi  
> **Ruang Lingkup**: `services/aggregator-service/src/routes/index.js`, `services/aggregator-service/tests/end-to-end.test.js`

---

## 1. Ringkasan Eksekutif

Pada audit keamanan Prompt 4b ditemukan bahwa endpoint `GET /api/v1/sites` diekspos secara publik tanpa verifikasi sesi autentikasi (`auth.authenticate(request)` dilewati). Respon endpoint tersebut memuat seluruh metadata situs yang dipantau, konfigurasi batas perayap crawler (`maxDepth`, `maxPages`), URL target, dan seluruh cuplikan HTML acuan (`baselineHtml`). Mengingat Landing Page telah diperbarui untuk tidak lagi memanggil endpoint ini (menggunakan kartu institusional statis), keterbukaan endpoint ini menimbulkan risiko kebocoran informasi (*information disclosure*).

Melalui pengerjaan **Langkah 5A**, endpoint `GET /api/v1/sites` telah dipindahkan sepenuhnya ke balik gerbang autentikasi admin. Permintaan tanpa cookie sesi yang valid kini secara konsisten ditolak dengan status HTTP `401 Unauthorized` (`code: "UNAUTHORIZED"`), sedangkan pengguna admin yang sudah login tetap dapat mengakses data situs secara normal via dashboard dengan `credentials: "include"`.

---

## 2. Diff Ringkas Perubahan

### A. Router Aggregator (`services/aggregator-service/src/routes/index.js`)
Menghapus deklarasi publik `GET /api/v1/sites` yang mendahului pemeriksaan sesi admin. Penanganan `GET /api/v1/sites` kini sepenuhnya dilayani oleh handler admin di baris 138.

```diff
--- a/services/aggregator-service/src/routes/index.js
+++ b/services/aggregator-service/src/routes/index.js
@@ -75,12 +75,6 @@ async function routeRequest(
     return;
   }
 
-  // Site collection read endpoint - public for Landing Page and Dashboard synchronization
-  if (pathname === "/api/v1/sites" && request.method === "GET") {
-    await listSitesController(request, response, sites);
-    return;
-  }
-
   // All routes below require admin authentication
   const session = auth.authenticate(request);
   if (!session) {
```

### B. Pengujian Integrasi (`services/aggregator-service/tests/end-to-end.test.js`)
Menambahkan skenario uji untuk memastikan penolakan 401 bagi permintaan tanpa sesi dan penerimaan 200 bagi sesi admin yang sah.

```diff
--- a/services/aggregator-service/tests/end-to-end.test.js
+++ b/services/aggregator-service/tests/end-to-end.test.js
@@ -158,6 +158,7 @@
 beforeEach(() => {
   dataAccess.database.exec("DELETE FROM scans");
+  dataAccess.database.exec("DELETE FROM sites");
 });
@@ -242,6 +243,47 @@
 });
 
+test("GET /api/v1/sites memerlukan autentikasi sesi Admin", async () => {
+  // 1. Tanpa sesi -> 401 UNAUTHORIZED
+  const unauthenticated = await fetch(`${aggregatorUrl}/api/v1/sites`);
+  assert.equal(unauthenticated.status, 401);
+  const unauthPayload = await unauthenticated.json();
+  assert.equal(unauthPayload.success, false);
+  assert.equal(unauthPayload.error.code, "UNAUTHORIZED");
+  assert.equal(unauthPayload.error.message, "Silakan login sebagai Admin.");
+
+  // Percobaan POST tanpa sesi juga ditolak 401
+  const unauthPost = await fetch(`${aggregatorUrl}/api/v1/sites`, {
+    method: "POST",
+    headers: { "Content-Type": "application/json" },
+    body: JSON.stringify({ name: "Situs Liar", url: "https://evil.example" }),
+  });
+  assert.equal(unauthPost.status, 401);
+
+  // 2. Buat data situs di database
+  const site = dataAccess.sites.create({
+    name: "Situs Uji Keamanan",
+    url: pageUrls.normal,
+    allowedHost: "127.0.0.1",
+    status: "active",
+    maxDepth: 1,
+    maxPages: 5,
+    baselineHtml: "<html>Acuan Rahasia</html>",
+  });
+
+  // 3. Login untuk mendapatkan sesi valid
+  const login = await fetch(`${aggregatorUrl}/api/v1/auth/login`, { ... });
+  const cookie = login.headers.get("set-cookie").split(";")[0];
+
+  // 4. Dengan sesi valid -> 200 OK dan mengembalikan daftar situs
+  const authenticated = await fetch(`${aggregatorUrl}/api/v1/sites`, {
+    headers: { Cookie: cookie },
+  });
+  assert.equal(authenticated.status, 200);
+  const authPayload = await authenticated.json();
+  assert.equal(authPayload.success, true);
+  assert.ok(Array.isArray(authPayload.data.sites));
+});
```

---

## 3. Tabel Audit Seluruh Route di Aggregator Service

Audit menyeluruh terhadap setiap endpoint yang terdaftar di `services/aggregator-service/src/routes/index.js`:

| No | Metode | Path / Pola URL | Data yang Dikembalikan | Akses Sebelum 5A | Akses Setelah 5A | Status & Justifikasi |
|:---|:---|:---|:---|:---|:---|:---|
| 1 | `GET` | `/health` | `{ status: "ok", success: true }` | Publik | Publik | **Tetap Publik**: Pemeriksaan kesiapan service & orkestrasi internal/reverse proxy. |
| 2 | `POST` | `/api/v1/auth/login` | `{ authenticated: true, username }` + Set-Cookie | Publik | Publik | **Tetap Publik**: Pintu masuk autentikasi bagi admin memasukkan kredensial. |
| 3 | `GET` | `/api/v1/auth/session` | `{ authenticated: boolean, username?: string }` | Publik | Publik | **Tetap Publik**: Pengecekan status login di frontend tanpa membocorkan data sensitif. |
| 4 | `GET` | `/api/v1/sites` | Daftar seluruh situs, URL target, kuota crawl, dan `baselineHtml` | **Publik (Bocor)** | **Admin (401 jika unauth)** | **DIPERBAIKI**: Tidak boleh diakses tanpa login. |
| 5 | `POST` | `/api/v1/auth/logout` | `{ authenticated: false }` + Clear Cookie | Admin | Admin | **Tepat**: Mengakhiri sesi aktif admin. |
| 6 | `POST` | `/api/v1/analyze` | Hasil deteksi instan 3 modul (text, link, defacement) | Admin | Admin | **Tepat**: Pemanggilan langsung detector engine. |
| 7 | `POST` | `/api/v1/scan` | Pemicu pemindaian tunggal (sinkron / background) | Admin | Admin | **Tepat**: Inisiasi crawling & deteksi situs. |
| 8 | `POST` | `/api/v1/scan-sites` | Pemicu pemindaian batch beberapa situs | Admin | Admin | **Tepat**: Operasi operasional massal crawler. |
| 9 | `GET` | `/api/v1/scans/jobs` | Daftar antrean background scan job | Admin | Admin | **Tepat**: Pemantauan job aktif di dashboard. |
| 10 | `GET` | `/api/v1/scans/jobs/:id` | Status progress & rincian background scan job | Admin | Admin | **Tepat**: Detail progress job pemindaian. |
| 11 | `POST` | `/api/v1/sites` | Konfirmasi pendaftaran situs baru | Admin | Admin | **Tepat**: Penambahan target monitoring. |
| 12 | `GET` | `/api/v1/sites/:id` | Detail 1 situs termasuk snapshot acuan | Admin | Admin | **Tepat**: Pengambilan konfigurasi situs. |
| 13 | `PUT` | `/api/v1/sites/:id` | Konfirmasi pembaruan konfigurasi/baseline situs | Admin | Admin | **Tepat**: Modifikasi konfigurasi target. |
| 14 | `DELETE` | `/api/v1/sites/:id` | Konfirmasi penghapusan situs | Admin | Admin | **Tepat**: Penghapusan target monitoring. |
| 15 | `GET` | `/api/v1/schedules` | Daftar seluruh jadwal pemindaian otomatis | Admin | Admin | **Tepat**: Konfigurasi otomatisasi pemantauan. |
| 16 | `POST` | `/api/v1/schedules` | Konfirmasi pembuatan jadwal baru | Admin | Admin | **Tepat**: Registrasi jadwal baru. |
| 17 | `GET` | `/api/v1/schedules/:id` | Detail satu jadwal pemindaian | Admin | Admin | **Tepat**: Pembacaan konfigurasi jadwal. |
| 18 | `PUT` | `/api/v1/schedules/:id` | Konfirmasi pembaruan jadwal | Admin | Admin | **Tepat**: Modifikasi konfigurasi jadwal. |
| 19 | `DELETE` | `/api/v1/schedules/:id` | Konfirmasi penghapusan jadwal | Admin | Admin | **Tepat**: Penghapusan jadwal. |
| 20 | `POST` | `/api/v1/schedules/:id/run-now` | Pemicu eksekusi jadwal segera | Admin | Admin | **Tepat**: Eksekusi langsung scheduler. |
| 21 | `GET` | `/api/v1/scans/recent` | Riwayat pemindaian terakhir (manual & terjadwal) | Admin | Admin | **Tepat**: Log riwayat hasil deteksi. |
| 22 | `GET` | `/api/v1/scans/:id` | Rincian lengkap temuan halaman & indikator scan | Admin | Admin | **Tepat**: Investigasi temuan keamanan. |
| 23 | `DELETE` | `/api/v1/scans/:id` | Konfirmasi penghapusan riwayat scan terpilih | Admin | Admin | **Tepat**: Penghapusan record hasil audit. |
| 24 | `POST` | `/api/v1/scans/:id/resend-email` | Pengiriman ulang email laporan kepada petugas | Admin | Admin | **Tepat**: Pengiriman notifikasi email. |
| 25 | `GET` | `/api/v1/notifications` | Daftar 50 log riwayat notifikasi email terakhir | Admin | Admin | **Tepat**: Audit jejak pengiriman email. |

> [!NOTE]
> Setelah perbaikan, **hanya ada 3 endpoint publik**: `/health`, `/api/v1/auth/login`, dan `/api/v1/auth/session`. Seluruh 22 endpoint operasional lainnya terlindungi 100% di balik gerbang autentikasi admin.

---

## 4. Hasil Pemeriksaan Keamanan Tambahan

### A. Konfigurasi CORS
- **Temuan di Kode (`services/aggregator-service/src/app.js`, baris 87–121)**:
  - Header `Origin` diperiksa terhadap `config.dashboardOrigin` (`DASHBOARD_ORIGIN` atau fallback `http://localhost:5173`).
  - Bila request memuat header `Origin` yang **tidak cocok** dengan asal dashboard terdaftar (dan bukan endpoint `/health`), server langsung merespons dengan HTTP `403 Forbidden` dan menghentikan request.
  - Header `Access-Control-Allow-Origin` hanya dipasang tepat pada nilai `config.dashboardOrigin` spesifik bersama `Access-Control-Allow-Credentials: true`. Tidak pernah menggunakan wildcard `*`.
  - Request preflight `OPTIONS` juga memverifikasi origin dan mengembalikan header preflight hanya untuk origin yang diizinkan.
- **Kesimpulan**: **Sangat Baik & Aman**. Tidak rentan terhadap cross-origin abuse dengan credentials.

### B. Atribut Cookie Sesi
- **Temuan di Kode (`services/aggregator-service/src/services/auth-service.js`, baris 40–49)**:
  - Nama cookie: `content_detection_session`.
  - Token: Dibuat menggunakan `randomBytes(32).toString("hex")` (256-bit cryptographically secure pseudorandom token).
  - `HttpOnly`: **Aktif**. Cookie tidak dapat dibaca atau dimanipulasi oleh JavaScript browser (`document.cookie`), melindungi dari pencurian sesi via XSS.
  - `SameSite`: **Strict**. Mencegah pengiriman cookie pada request lintas situs (*cross-site*), memberikan perlindungan menyeluruh terhadap serangan CSRF.
  - `Secure`: Dikonfigurasi kondisional `secureCookie = environment.NODE_ENV === "production" || environment.AUTH_COOKIE_SECURE === "true"`. Pada lingkungan pengembangan lokal bernilai `false` (mendukung HTTP lokal), dan pada produksi otomatis bernilai `true` (mengharuskan kanal HTTPS terenkripsi).
  - Durasi / Masa Berlaku: 8 jam (`Max-Age=28800` detik / 28.800.000 ms). Server juga melakukan pembersihan token usang di memori (`pruneExpiredSessions`).
- **Kesimpulan**: **Memenuhi Standar Industri OWASP Session Management**.

### C. Pembatasan Percobaan Login (Rate Limiting / Brute Force Protection)
- **Temuan di Kode (`services/aggregator-service/src/controllers/auth-controller.js`)**:
  - Validasi input membatasi panjang teks: username $\le 128$ karakter, kata sandi $\le 1024$ karakter.
  - Verifikasi kata sandi menggunakan fungsi hash `scrypt` dengan salt acak 16-byte dan perbandingan waktu konstan `timingSafeEqual`.
  - **Kekurangan**: Belum tersedia middleware pembatasan frekuensi percobaan (*rate limiter*) atau penundaan eksponensial (*exponential backoff / account lockout*) jika terjadi kegagalan login berulang dari alamat IP yang sama.
- **Rekomendasi Hardening**: Pada penerapan produksi internet terbuka, tambahkan rate limiter in-memory sederhana (misalnya maksimal 5 percobaan login gagal per 5 menit per IP) untuk meredam serangan *brute force*.

### D. Penanganan Galat & Kebocoran Respons (Error Response Leakage)
- **Temuan di Kode (`services/aggregator-service/src/middleware/error-handler.js`)**:
  - Galat operasional (`HttpError`) menghasilkan respon JSON terstruktur: `{ success: false, error: { code, message } }`.
  - Galat tak terduga (*unhandled 500 error*) dicatat pada logger internal (`logger.error(...)`), sedangkan respon yang dikirimkan ke klien disanitasi menjadi `{ success: false, error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal." } }`.
  - Terverifikasi pada pengujian `end-to-end.test.js` baris 588: simulasi kegagalan database dengan path rahasia (`/private/database/path`) terbukti tidak bocor ke respon klien.
- **Kesimpulan**: **Sangat Baik & Aman**. Jejak *stack trace*, path berkas OS, dan query database terisolasi di sisi server.

---

## 5. Hasil Pengujian Otomatis

Seluruh suite pengujian di backend dan frontend berhasil dieksekusi dengan status **100% LULUS**:

### A. Aggregator Service (`services/aggregator-service`)
- **Perintah**: `npm test` (`node --test`)
- **Hasil**: **53 tests passed (0 fail, 0 skipped)**
- **Waktu Eksekusi**: ~7.5 detik
- **Status Uji Kunci**:
  - `ok 16 - API membutuhkan sesi Admin dan cookie sesi tidak dapat dibaca JavaScript`
  - `ok 17 - GET /api/v1/sites memerlukan autentikasi sesi Admin` **(BARU)**
  - `ok 18 - DELETE scan riwayat dilindungi autentikasi dan menghapus record terpilih`
  - `ok 19 - end-to-end scan crawls fixtures, calls detectors, aggregates, and persists each page`
  - `ok 51 - scheduler executes due schedule and saves results with scanSource SCHEDULED`

### B. Frontend Dashboard (`dashboard`)
- **Perintah**: `npm test` (`vitest run`)
- **Hasil**: **46 tests passed (0 fail, 0 skipped)** dari 3 test files:
  - `src/styles/tokens.test.js`: **1 passed**
  - `src/components/components.test.jsx`: **15 passed**
  - `src/App.test.jsx`: **30 passed** (termasuk verifikasi isolasi unauthenticated Landing Page, navigasi login, dan manajemen situs terautentikasi)
- **Waktu Eksekusi**: ~10.0 detik

---

## 6. Rekomendasi yang Belum Dikerjakan (Untuk Tahap Berikutnya)

1. **Endpoint Agregasi Publik Minimal (`GET /api/v1/public/stats`)**:
   - Jika di masa mendatang halaman publik (Landing Page) membutuhkan tampilan metrik ringkasan (misalnya: jumlah situs aktif yang dilindungi oleh Pemkab Sumbawa), jangan membuka kembali `GET /api/v1/sites`.
   - Buat endpoint baru khusus yang hanya menghitung dan mengembalikan agregasi numerik:
     ```json
     {
       "success": true,
       "data": {
         "totalActiveSites": 12
       }
     }
     ```
   - Sesuai aturan Prompt 5A, fitur ini **tidak dikerjakan sekarang** dan dicatat sebagai rekomendasi rancangan arsitektur masa depan.

2. **Rate Limiting pada `/api/v1/auth/login`**:
   - Menambahkan pembatasan percobaan login (maksimal 5 kali salah per jendela 5 menit per alamat IP) sebelum sistem dideploy ke infrastruktur internet publik dinas.
