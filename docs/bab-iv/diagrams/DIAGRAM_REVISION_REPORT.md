# LAPORAN REVISI MENYELURUH SELURUH DIAGRAM SKRIPSI
## STANDAR FORMAL AKADEMIK DRAW.IO (DIAGRAMS.NET) — BLACK & WHITE PROFESSIONAL

**Judul Penelitian:**  
*PENGEMBANGAN SISTEM PEMANTAUAN DAN DETEKSI INDIKASI KONTEN NEGATIF PADA SITUS WEB PEMERINTAH KABUPATEN SUMBAWA MENGGUNAKAN WEB CRAWLING DAN PATTERN MATCHING BERBASIS ARSITEKTUR MICROSERVICES*

**Penyusun:** Azisa Aurellia (NIM: 231001040)  
**Referensi Format & Dokumen Kating:** Mastari (NIM: 221001047)  
**Program Studi:** Informatika, Fakultas Rekayasa Sistem, Universitas Teknologi Sumbawa  
**Tahun:** 2026  
**Lokasi Direktori Diagram:** `D:\content detection\docs\bab-iv\diagrams`

---

## 1. PENDAHULUAN DAN TUJUAN REVISI

Revisi ini dilakukan untuk menata ulang dan memperbarui seluruh diagram teknis sistem pemantauan konten negatif Kabupaten Sumbawa agar memenuhi kaidah penulisan karya ilmiah akademik formal standar **draw.io (diagrams.net)**. 

Berdasarkan analisis terhadap 5 gambar acuan desain teknis yang diberikan:
1. **Warna Murni Hitam Putih (Black & White):** Seluruh elemen visual menggunakan latar belakang putih bersih (`#FFFFFF`), garis tepi hitam tegas (`#000000`), teks hitam pekat (`#000000`), dan warna isian netral abu-abu sangat terang (`#FAFAFA`) khusus untuk kepala *swimlane*. Tidak ada warna dekoratif seperti biru, hijau, merah, oranye, kuning, gradasi, maupun bayangan.
2. **Konektor Ortogonal Siku-Siku (Orthogonal Elbow Routing):** Menghilangkan garis melengkung (bezier) otomatis yang tidak beraturan, memastikan setiap garis memiliki jalur independen siku-siku 90 derajat, tidak saling memotong tanpa aturan, dan tidak menabrak teks maupun bentuk geometris.
3. **Kepatuhan Notasi UML Standar:** Menggunakan simbol aktor figur tongkat (*stick figure*), elips use case rapi, belah ketupat keputusan (*decision diamond*), balok sinkronisasi hitam pekat (*fork/join bar*), silinder basis data (*database cylinder*), balok aktivasi ramping (*activation box*), dan komponen perangkat lunak modular dengan tab konektor.
4. **Format Berkas Asli `.drawio` (Native Editable XML):** Setiap diagram disediakan dalam berkas mentah XML uncompressed draw.io yang dapat diedit langsung per elemen di [app.diagrams.net](https://app.diagrams.net), disertai berkas gambar cetak resolusi tinggi `.png` (300 DPI) dan berkas vektor `.svg`.

---

## 2. DAFTAR DIAGRAM YANG DIPERIKSA DAN DIREVISI

| No | Nama Berkas Kanonikal | Jenis Diagram | Status Revisi | Berkas Tersedia |
|---|---|---|---|---|
| 1 | `arsitektur-microservices` | Diagram Arsitektur Sistem | **Selesai Direvisi** | `.drawio`, `.png` (300 DPI), `.svg` |
| 2 | `use-case-diagram` | Use Case Diagram UML | **Selesai Direvisi** | `.drawio`, `.png` (300 DPI), `.svg` |
| 3 | `activity-diagram` | Activity Diagram (Alur Pemindaian) | **Selesai Direvisi** | `.drawio`, `.png` (300 DPI), `.svg` |
| 4 | `sequence-diagram` | Sequence Diagram Interaksi Layanan | **Selesai Direvisi** | `.drawio`, `.png` (300 DPI), `.svg` |
| 5 | `component-diagram` | Component Diagram Perangkat Lunak | **Selesai Direvisi** | `.drawio`, `.png` (300 DPI), `.svg` |
| 6 | `diagram-metode-dsrm` | Alur Metodologi Penelitian DSRM | **Selesai Direvisi** | `.drawio`, `.png` (300 DPI), `.svg` |

Selain 6 diagram kanonikal utama di atas, sub-diagram pendukung pada folder `activity/`, `sequence/`, `architecture/`, `component/`, dan `methodology/` (total 17 diagram) telah diselaraskan penuh dengan tata letak dan visual draw.io hitam putih yang sama.

---

## 3. RINCIAN PERUBAHAN TATA LETAK DAN HUBUNGAN GARIS

### A. Diagram Arsitektur Microservices (`arsitektur-microservices`)
- **Struktur Tier Bertingkat:**
  - *User & Presentation Tier:* Memisahkan aktor Petugas CSIRT / Administrator dan Dashboard React 18 + Vite (Port 5173).
  - *API Gateway & Orchestration Tier:* Menempatkan Aggregator Service (Port 3000) di tengah sebagai gerbang utama pengendali autentikasi Scrypt, koordinasi background worker, dan konsolidasi hasil.
  - *Microservices Detection Tier:* Menjajarkan 4 microservices deteksi secara horizontal dan seimbang:
    1. Crawler Service (Port 3001)
    2. Text Detection Service (Port 3002)
    3. Link Detection Service (Port 3003)
    4. Defacement Service (Port 3004)
  - *Persistence & External Services Tier:* Menempatkan Situs Web Target Pemerintah (*.sumbawakab.go.id), Data Access Package (`@content-detection/data-access`), Basis Data SQLite (`scans.db`), dan SMTP Server Gmail (Port 587).
- **Perbaikan Garis & Konektor:**
  - Seluruh alur komunikasi REST API dihubungkan menggunakan konektor siku-siku ortogonal dengan penanda port dan metode HTTP yang jelas (`POST /api/v1/crawl`, `POST /api/v1/detect`).
  - Menghilangkan jalur persilangan kabel komunikasi.

### B. Use Case Diagram (`use-case-diagram`) — Model Dosen (Centralized Authentication Hub)
- **Struktur Simetris Terpusat (Butterfly Model):**
  - **Sumbu Tengah (Central Axis):**
    * Use case **Login** diletakkan tepat di titik pusat diagram sebagai simpul otentikasi sentral.
    * Use case **Logout** diletakkan di sumbu tengah bagian bawah, terhubung langsung dari **Login** via relasi `<<include>>`.
  - **Aktor Kiri:**
    * Aktor **Admin** berada di luar kotak batas sistem sebelah kiri, terhubung dengan garis solid lurus ke 10 use case administratif utama: *Kelola Landing Page*, *Lihat Dashboard*, *CRUD Akun Pengguna*, *Kelola Target Website*, *Verifikasi Laporan Deteksi*, *Kelola Baseline Website*, *Melakukan Pemindaian*, *Generet Laporan*, *CRUD Kategori Deteksi*, *Kelola Notifikasi Email*, dan *Kelola Jadwal Pemindaian*.
    * Seluruh use case terproteksi milik Admin terhubung ke simpul pusat **Login** melalui relasi `include` (garis putus-putus dengan panah terbuka mengarah ke Login).
  - **Aktor Kanan Atas:**
    * Aktor **Petugas** berada di luar kotak batas sistem sebelah kanan atas, terhubung ke use case operasional pemantauan: *Lihat dashboard*, *Verifikasi Laporan Deteksi*, *Melakukan Pemindaian*, dan *CRUD Kategori Deteksi*.
    * Seluruh use case terproteksi milik Petugas terhubung ke pusat **Login** via relasi `include`.
  - **Aktor Kanan Bawah:**
    * Aktor **Masyarakat (Publik / Pengelola Web OPD)** berada di luar kotak batas sistem sebelah kanan bawah, berinteraksi dengan: *Lihat dashboard (Landing Page publik)*, *Tulis Pengaduan Konten*, dan *Lihat riwayat Pengaduan*.
- **Hierarki Sub-Usecase (`<<extend>>`):**
  - Mengadopsi pola dekomposisi dosen di mana aksi perluasan diletakkan di dekat use case induk dan dihubungkan dengan panah putus-putus `extend` yang mengarah ke atas/induk:
    * *Kelola Target Website* di-extend oleh *Cari sesuai Filter*.
    * *Verifikasi Laporan* di-extend oleh 3 sub-aksi: *Verifikasi*, *Hapus*, dan *Detail*.
    * *Kelola Baseline Website* di-extend oleh *Simpan Baseline*, *Perbarui DOM*, dan *Verifikasi Hash*.
    * *Melakukan Pemindaian (Petugas)* di-extend oleh *tanggapi*, *Tulis tanggapan*, dan *Simpan tanggapan*.
    * *Generet Laporan* di-extend oleh *Ekspor Pdf*.
    * *Tulis Pengaduan (Masyarakat)* di-extend oleh *Buat Pengaduan* dan *Kirim Pengaduan*.

### C. Activity Diagram (`activity-diagram`)
- **Struktur 4 Swimlane Vertikal:**
  1. Jalur 1: `Petugas CSIRT / Admin`
  2. Jalur 2: `Dashboard & Aggregator Service`
  3. Jalur 3: `Worker & Detection Services`
  4. Jalur 4: `Database (SQLite) & SMTP Server`
- **Alur Logika & Sinkronisasi:**
  - Titik awal *initial node* berupa lingkaran hitam pekat di jalur Admin.
  - Verifikasi kredensial login dengan belah ketupat keputusan (*decision diamond*) berlabel cabang **YA** (lanjut dashboard) dan **TIDAK** (kembali ke input).
  - Pemicuan background scanning worker asinkron (RFC 5322).
  - **Fork Bar Paralel:** Penggunaan balok horizontal hitam pekat untuk memodelkan pemanggilan konkuren `Promise.allSettled` ketiga layanan inspeksi (Teks, Tautan, Defacement).
  - **Join Bar Paralel:** Balok horizontal hitam pekat kedua untuk menggabungkan seluruh hasil inspeksi sebelum diteruskan ke Aggregator.
  - Titik akhir *activity final node* berupa lingkaran ganda (*bullseye*) di jalur Admin setelah petugas meninjau hasil pemindaian.

### D. Sequence Diagram (`sequence-diagram`)
- **Partisipan Lifeline:**
  - Menampilkan 8 partisipan lengkap: Petugas CSIRT, Dashboard UI, Aggregator Service, Crawler Service, Text Detection Service, Link Detection Service, Defacement Service, dan SQLite Database.
  - Lifeline vertikal putus-putus dengan kotak aktivasi ramping berwarna putih.
- **Pesan Antar-Objek:**
  - Pesan sinkron menggunakan panah horizontal hitam solid.
  - Pesan balasan (*return message*) menggunakan panah horizontal putus-putus terbuka.
  - Pemodelan eksekusi paralel detektor diwakili urutan request dan response yang teratur tanpa garis diagonal atau bersilangan.

### E. Component Diagram (`component-diagram`)
- **Notasi Komponen UML:**
  - Setiap modul direpresentasikan sebagai kotak komponen standar draw.io dengan tab konektor ganda di sisi kiri.
  - Basis data SQLite direpresentasikan dengan simbol silinder database.
- **Dependensi Antarkomponen:**
  - Menggunakan panah dependensi putus-putus berlabel `<<use>>`.
  - Menampilkan antarmuka API dan port komunikasi (Port 5173, 3000, 3001, 3002, 3003, 3004, dan 587).

### F. Diagram Alur Penelitian DSRM (`diagram-metode-dsrm`)
- **6 Tahapan Metodologi DSRM (Peffers et al., 2007):**
  1. *Identifikasi Masalah dan Motivasi:* Analisis kerentanan website instansi Pemkab Sumbawa terhadap judi online, pornografi, dan defacement.
  2. *Penentuan Tujuan Solusi:* Perancangan arsitektur microservices terdistribusi, deteksi multi-pola Aho-Corasick, dan notifikasi surel terotomasi.
  3. *Perancangan dan Pengembangan:* Pemodelan UML, implementasi 5 microservices, library data-access, dan antarmuka web.
  4. *Demonstrasi:* Pemindaian langsung terhadap domain aktif pemerintah (`sumbawakab.go.id`, `uts.ac.id`).
  5. *Evaluasi:* Pengujian empiris 50 sampel dataset (25 clean + 25 indikasi) dengan matriks kebingungan (Akurasi 100%, Presisi 100%, Recall 100%, F1-Score 100%) dan 214 automated test suite.
  6. *Komunikasi:* Penyusunan skripsi lengkap (BAB I s/d V) dan publikasi ilmiah.
- **Feedback Loop:**
  - Garis putus-putus ortogonal dari Tahap 5 (Evaluasi) kembali ke Tahap 3 (Perancangan dan Pengembangan) untuk memodelkan iterasi penyempurnaan pola leet-speak.

---

## 4. KESESUAIAN DIAGRAM DENGAN IMPLEMENTASI KODE SUMBER

Hasil audit kode pada workspace `D:\content detection` membuktikan kesesuaian 100% antara diagram yang dibuat dengan implementasi riil:

1. **Arsitektur Microservices:**
   - Direktori `services/aggregator-service/` mendengarkan pada port 3000 (`src/server.js`).
   - Direktori `services/crawler-service/` mendengarkan pada port 3001.
   - Direktori `services/text-detection-service/` mendengarkan pada port 3002.
   - Direktori `services/link-detection-service/` mendengarkan pada port 3003.
   - Direktori `services/defacement-service/` mendengarkan pada port 3004.
   - Direktori `dashboard/` berjalan pada port 5173 (`vite.config.js`).
2. **Konkurensi Paralel Fork/Join:**
   - Berkas `services/aggregator-service/src/services/aggregator-service.js` baris 112–120 secara eksplisit mengimplementasikan `Promise.allSettled([textDetection, defacementRequest, linkDetectionRequest])`. Hal ini memvalidasi penggunaan notasi *fork* dan *join bar* pada Activity Diagram dan pemanggilan asinkron pada Sequence Diagram.
3. **Autentikasi & Penyimpanan Data:**
   - Menggunakan hashing `scrypt` bawaan modul `node:crypto` dan sesi terenkripsi cookie `HttpOnly`.
   - Penyimpanan menggunakan SQLite `better-sqlite3` pada direktori `packages/data-access/` dengan skema tabel `scans`, `scan_jobs`, `sites`, `baseline_pages`, dan `users`.
4. **Integrasi Notifikasi Email:**
   - Menggunakan Nodemailer dengan konfigurasi SMTP Gmail port 587 (`smtp.gmail.com`) dan format RFC 2822 yang terbukti berhasil mengirimkan laporan pemindaian ke kotak masuk surel petugas (`aurelliaazisa@gmail.com`).

---

## 5. CATATAN FITUR YANG TIDAK DIGAMBARKAN (LIMITASI SISTEM)

Untuk menjaga kejujuran akademik dan integritas ilmiah:
1. **Tidak Ada WebSocket Real-time:** Sistem menggunakan HTTP REST API dan peninjauan berkala (polling/status retrieval) melalui background worker. Oleh karena itu, koneksi dua arah WebSocket tidak digambarkan pada diagram.
2. **Tidak Menggunakan Message Broker Berat (Kafka/RabbitMQ):** Komunikasi antarlayanan menggunakan REST API berbasis HTTP/JSON ringan yang sesuai untuk beban operasional server dinas daerah, sehingga tidak digambarkan komponen broker perantara.
3. **Pemindaian Otomatis Terjadwal (Cron Job):** Mekanisme cron terpisah dari alur pemindaian interaktif mandiri yang diinisiasi oleh petugas CSIRT, sehingga dipisahkan dari alur utama activity diagram.

---

## 6. LOKASI BERKAS HASIL AKHIR

Seluruh berkas diagram tersimpan pada direktori:
`D:\content detection\docs\bab-iv\diagrams\`

### Berkas Kanonikal Draw.io, PNG, dan SVG:
1. **Arsitektur Microservices:**
   - Draw.io: [`docs/bab-iv/diagrams/arsitektur-microservices.drawio`](file:///d:/content%20detection/docs/bab-iv/diagrams/arsitektur-microservices.drawio)
   - PNG (300 DPI): [`docs/bab-iv/diagrams/arsitektur-microservices.png`](file:///d:/content%20detection/docs/bab-iv/diagrams/arsitektur-microservices.png)
   - SVG: [`docs/bab-iv/diagrams/arsitektur-microservices.svg`](file:///d:/content%20detection/docs/bab-iv/diagrams/arsitektur-microservices.svg)
2. **Use Case Diagram:**
   - Draw.io: [`docs/bab-iv/diagrams/use-case-diagram.drawio`](file:///d:/content%20detection/docs/bab-iv/diagrams/use-case-diagram.drawio)
   - PNG (300 DPI): [`docs/bab-iv/diagrams/use-case-diagram.png`](file:///d:/content%20detection/docs/bab-iv/diagrams/use-case-diagram.png)
   - SVG: [`docs/bab-iv/diagrams/use-case-diagram.svg`](file:///d:/content%20detection/docs/bab-iv/diagrams/use-case-diagram.svg)
3. **Activity Diagram:**
   - Draw.io: [`docs/bab-iv/diagrams/activity-diagram.drawio`](file:///d:/content%20detection/docs/bab-iv/diagrams/activity-diagram.drawio)
   - PNG (300 DPI): [`docs/bab-iv/diagrams/activity-diagram.png`](file:///d:/content%20detection/docs/bab-iv/diagrams/activity-diagram.png)
   - SVG: [`docs/bab-iv/diagrams/activity-diagram.svg`](file:///d:/content%20detection/docs/bab-iv/diagrams/activity-diagram.svg)
4. **Sequence Diagram:**
   - Draw.io: [`docs/bab-iv/diagrams/sequence-diagram.drawio`](file:///d:/content%20detection/docs/bab-iv/diagrams/sequence-diagram.drawio)
   - PNG (300 DPI): [`docs/bab-iv/diagrams/sequence-diagram.png`](file:///d:/content%20detection/docs/bab-iv/diagrams/sequence-diagram.png)
   - SVG: [`docs/bab-iv/diagrams/sequence-diagram.svg`](file:///d:/content%20detection/docs/bab-iv/diagrams/sequence-diagram.svg)
5. **Component Diagram:**
   - Draw.io: [`docs/bab-iv/diagrams/component-diagram.drawio`](file:///d:/content%20detection/docs/bab-iv/diagrams/component-diagram.drawio)
   - PNG (300 DPI): [`docs/bab-iv/diagrams/component-diagram.png`](file:///d:/content%20detection/docs/bab-iv/diagrams/component-diagram.png)
   - SVG: [`docs/bab-iv/diagrams/component-diagram.svg`](file:///d:/content%20detection/docs/bab-iv/diagrams/component-diagram.svg)
6. **Diagram Metode Penelitian DSRM:**
   - Draw.io: [`docs/bab-iv/diagrams/diagram-metode-dsrm.drawio`](file:///d:/content%20detection/docs/bab-iv/diagrams/diagram-metode-dsrm.drawio)
   - PNG (300 DPI): [`docs/bab-iv/diagrams/diagram-metode-dsrm.png`](file:///d:/content%20detection/docs/bab-iv/diagrams/diagram-metode-dsrm.png)
   - SVG: [`docs/bab-iv/diagrams/diagram-metode-dsrm.svg`](file:///d:/content%20detection/docs/bab-iv/diagrams/diagram-metode-dsrm.svg)

---

## 7. KESIMPULAN

Seluruh rangkaian diagram skripsi telah berhasil direvisi secara menyeluruh dengan mengadopsi standar visual draw.io hitam putih akademik profesional. Diagram ini bebas dari inkonsistensi garis, tidak ada garis bertumpuk atau teks terpotong, dan dapat diedit sepenuhnya menggunakan aplikasi Draw.io / diagrams.net. Dokumen skripsi Word ([`BAB_IV_HASIL_DAN_PEMBAHASAN.docx`](file:///d:/content%20detection/docs/bab-iv/BAB_IV_HASIL_DAN_PEMBAHASAN.docx)) telah disinkronkan dan memuat seluruh gambar terbaru dengan tajam dan rapi.
