# -*- coding: utf-8 -*-
path = r"D:\content detection\docs\bab-iv\BAB_IV_HASIL_DAN_PEMBAHASAN.md"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Insert Class Diagram right after Component Diagram
target_comp = """![Gambar 4. 16 Component Diagram Arsitektur Microservices](diagrams/component/gambar-4.16-component-diagram.png)

**Gambar 4. 16 Component Diagram Arsitektur Microservices**

Berdasarkan Gambar 4. 16, arsitektur sistem tersusun atas komponen-komponen mandiri mencakup Dashboard Component (React 18 / Port 5173), Aggregator Service Component (Express.js / Port 3004), Crawler Service Component (Port 3001), Text Detection Component (Port 3000), Link Detection Component (Port 3003), Defacement Service Component (Port 3002), basis data SQLite (`content_detection.db`), dan peladen eksternal SMTP Gmail (Port 587).

---

### 4.1.6 Perancangan Antarmuka Sistem (Low-Fidelity Balsamiq Wireframes)"""

replacement_comp = """![Gambar 4. 16 Component Diagram Arsitektur Microservices](diagrams/component/gambar-4.16-component-diagram.png)

**Gambar 4. 16 Component Diagram Arsitektur Microservices**

Berdasarkan Gambar 4. 16, arsitektur sistem tersusun atas komponen-komponen mandiri mencakup Dashboard Component (React 18 / Port 5173), Aggregator Service Component (Express.js / Port 3004), Crawler Service Component (Port 3001), Text Detection Component (Port 3000), Link Detection Component (Port 3003), Defacement Service Component (Port 3002), basis data SQLite (`content_detection.db`), dan peladen eksternal SMTP Gmail (Port 587).

---

### 4.1.6 Perancangan Class Diagram

*Class Diagram* mendeskripsikan struktur statis sistem perangkat lunak dengan memvisualisasikan entitas-entitas data (*classes*), atribut beserta tipe data, operasi (*methods*), serta relasi kardinalitas antarkelas yang mendasari repositori data access dan basis data SQLite (`scans.db`). Rancangan diagram kelas disajikan pada Gambar 4. 17.

![Gambar 4. 17 Class Diagram Sistem Pemantauan dan Deteksi Konten Negatif](diagrams/class/gambar-4.17-class-diagram.png)

**Gambar 4. 17 Class Diagram Sistem Pemantauan dan Deteksi Konten Negatif**

Berdasarkan Gambar 4. 17, struktur kelas sistem terdiri atas tujuh kelas entitas utama:
1. **User:** Merepresentasikan akun administrator dan petugas CSIRT. Memuat atribut `id`, `username`, `password_hash`, `role`, `created_at`, dan `updated_at`. Menyediakan operasi `verifyPassword()` untuk pencocokan hash derivasi Scrypt, `createSession()` untuk penerbitan token sesi HttpOnly, serta `validateRole()` untuk kontrol hak akses.
2. **Site:** Merepresentasikan situs web instansi/OPD di lingkungan Pemerintah Kabupaten Sumbawa yang didaftarkan ke sistem pemantauan. Memuat atribut `id`, `name`, `url`, `allowed_host`, `status`, `max_depth`, `max_pages`, `baseline_html`, `created_at`, dan `updated_at`. Menyediakan operasi manajemen data situs seperti `create()`, `update()`, `delete()`, `findByUrl()`, dan `listActive()`.
3. **Scan:** Merepresentasikan rekaman detail hasil pemindaian dan pemeriksaan forensik per halaman web. Memuat atribut `id`, `url`, `scanned_at`, `crawl_status`, `http_status`, `title`, `scan_source`, `officer_email`, serta status dan muatan payload hasil dari ketiga detektor (`text_detection_result`, `defacement_detection_result`, `link_detection_result`). Menyediakan operasi `create()`, `createMany()`, `findById()`, `findRecent()`, dan `deleteById()`.
4. **ScanJob:** Merepresentasikan pekerjaan pemindaian latar belakang (*asynchronous background worker*) yang diinisiasi oleh petugas. Memuat atribut `id`, `type`, `target_url`, `officer_email`, `status`, `progress_scanned`, `progress_total`, `started_at`, dan `completed_at`. Menyediakan operasi `create()`, `updateProgress()`, `findRunning()`, dan `markFailed()`.
5. **Schedule:** Merepresentasikan konfigurasi jadwal pemindaian berkala otomatis (*daily*, *weekly*, *monthly*). Memuat atribut `id`, `name`, `target_type`, `site_ids`, `frequency`, `time_of_day`, `timezone`, `status`, `is_running`, dan `next_run_at`. Menyediakan operasi `create()`, `update()`, `findDue()`, dan `toggleStatus()`.
6. **Notification:** Merepresentasikan status riwayat transmisi surat elektronik hasil pemindaian melalui protokol SMTP Gmail port 587. Memuat atribut `id`, `scan_id`, `channel`, `recipient`, `subject`, `status`, `error_message`, dan `sent_at`. Menyediakan operasi `create()`, `updateStatus()`, `findByScanId()`, dan `listRecent()`.
7. **BaselinePage:** Merepresentasikan struktur dokumen HTML acuan untuk mendeteksi perubahan visual dan anomali *defacement*. Memuat atribut `id`, `site_url`, `html_content`, `dom_structure_hash`, `visual_hash`, dan `captured_at`. Menyediakan operasi `saveBaseline()`, `getBaseline()`, dan `compareHash()`.

Relasi kardinalitas antarkelas pada Gambar 4. 17 mencerminkan integritas hubungan data: setiap `Site` dapat memiliki banyak rekaman riwayat `Scan` (1 to 0..*), memiliki maksimal satu `BaselinePage` acuan (1 to 0..1), serta dapat didaftarkan ke dalam jadwal `Schedule` (1 to 0..*). Setiap sesi `Scan` menghasilkan maksimal satu rekaman status `Notification` (1 to 0..1). Sementara itu, satu `User` petugas dapat memprakarsai banyak antrean `ScanJob` (1 to 0..*), di mana setiap `ScanJob` mengkoordinasikan eksekusi dari satu atau lebih rekaman `Scan` halaman target (1 to 1..*).

---

### 4.1.7 Perancangan Antarmuka Sistem (Low-Fidelity Balsamiq Wireframes)"""

text = text.replace(target_comp, replacement_comp)

# 2. Shift mockups numbers from 4.17 - 4.26 down to 4.18 - 4.27 (in reverse order so we don't double replace)
for i in range(26, 16, -1):
    old_fig = f"Gambar 4. {i}"
    new_fig = f"Gambar 4. {i+1}"
    text = text.replace(old_fig, new_fig)

# Update mockup file paths in markdown
for i in range(26, 16, -1):
    old_p = f"mockups/gambar-4.{i}-mockup-"
    new_p = f"mockups/gambar-4.{i+1}-mockup-"
    text = text.replace(old_p, new_p)

# 3. Shift screenshot numbers from 4.27 - 4.33 down to 4.28 - 4.34
for i in range(33, 26, -1):
    old_fig = f"Gambar 4. {i}"
    new_fig = f"Gambar 4. {i+1}"
    text = text.replace(old_fig, new_fig)

for i in range(33, 26, -1):
    old_p = f"screenshots/gambar-4.{i}-implementasi-"
    new_p = f"screenshots/gambar-4.{i+1}-implementasi-"
    text = text.replace(old_p, new_p)

# Fix screenshot introduction text: "Gambar 4. 27 sampai dengan Gambar 4. 33" -> "Gambar 4. 28 sampai dengan Gambar 4. 34"
text = text.replace("Gambar 4. 27 sampai dengan Gambar 4. 33", "Gambar 4. 28 sampai dengan Gambar 4. 34")

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("BAB_IV_HASIL_DAN_PEMBAHASAN.md updated successfully with Class Diagram!")
