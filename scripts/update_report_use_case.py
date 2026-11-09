# -*- coding: utf-8 -*-
path = r"D:\content detection\docs\bab-iv\diagrams\DIAGRAM_REVISION_REPORT.md"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_b = """### B. Use Case Diagram (`use-case-diagram`)
- **Pemisahan Aktor & Batas Sistem:**
  - Aktor primer (Petugas CSIRT / Administrator) berada di luar batas sistem sebelah kiri.
  - Aktor sekunder eksternal (Website Target Pemerintah dan SMTP Server Gmail) berada di luar batas sistem sebelah kanan.
  - Kotak batas sistem (*system boundary*) membingkai 12 *use case* utama.
- **Perbaikan Relasi UML:**
  - Garis asosiasi aktor ke use case menggunakan garis solid hitam tanpa panah.
  - Relasi `<<include>>` menggunakan garis putus-putus dengan panah terbuka ke use case fungsional wajib:
    * Use case *Melakukan Pemindaian Website* meng-*include* *Perayapan Web (Crawling)*.
    * Use case *Perayapan Web (Crawling)* meng-*include* *Deteksi Konten Teks (Aho-Corasick)*, *Deteksi Tautan Mencurigakan*, *Deteksi Defacement*, dan *Pengiriman Notifikasi Email*.
    * Use case *Melihat Hasil Pemindaian* meng-*include* *Melihat Riwayat Pemindaian*.
  - Relasi `<<extend>>` menggunakan garis putus-putus dengan panah terbuka dari use case *Ekspor Laporan (PDF/CSV)* ke *Melihat Hasil Pemindaian*.
  - Setiap garis memiliki jalur fisik tersendiri dan tidak ada garis yang menyatu ke satu titik percabangan sembarangan."""

new_b = """### B. Use Case Diagram (`use-case-diagram`) — Model Dosen (Centralized Authentication Hub)
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
    * *Tulis Pengaduan (Masyarakat)* di-extend oleh *Buat Pengaduan* dan *Kirim Pengaduan*."""

if old_b in content:
    content = content.replace(old_b, new_b)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated DIAGRAM_REVISION_REPORT.md successfully!")
else:
    print("Old B text not matched exactly, trying loose match...")
    # fallback replace
    import re
    content = re.sub(r"### B\. Use Case Diagram \(`use-case-diagram`\).*?(?=### C\. Activity Diagram)", new_b + "\n\n", content, flags=re.DOTALL)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated DIAGRAM_REVISION_REPORT.md via regex successfully!")
