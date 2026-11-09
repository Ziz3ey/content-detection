# -*- coding: utf-8 -*-
path = r"D:\content detection\docs\bab-iv\BAB_IV_HASIL_DAN_PEMBAHASAN.md"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.strip() == "### 4.1.2 Use Case Diagram":
        skip = True
        new_lines.append("### 4.1.2 Use Case Diagram\n\n")
        new_lines.append("*Use Case Diagram* mendeskripsikan interaksi antara aktor pengguna dengan fungsionalitas yang disediakan oleh sistem. Rancangan *Use Case Diagram* pada penelitian ini dimodelkan mengadopsi pola simetris terpusat (*centralized authentication hub model*) sesuai standar arahan dosen pembimbing sebagaimana disajikan pada Gambar 4. 2.\n\n")
        new_lines.append("![Gambar 4. 2 Use Case Diagram Sistem Monitoring dan Deteksi Indikasi Konten Negatif](diagrams/use-case/gambar-4.2-use-case-diagram.png)\n\n")
        new_lines.append("**Gambar 4. 2 Use Case Diagram Sistem Monitoring dan Deteksi Indikasi Konten Negatif**\n\n")
        new_lines.append("Berdasarkan Gambar 4. 2, pemodelan *use case* mengorganisasikan fungsionalitas sistem berdasarkan hak akses tiga aktor utama:\n")
        new_lines.append("1. **Admin (Administrator CSIRT):** Berada pada sisi kiri batas sistem, memiliki wewenang penuh dalam mengelola *landing page* publik, mengakses *dashboard* pemantauan, melakukan CRUD akun pengguna, mengelola target *website* instansi Pemkab Sumbawa, memverifikasi laporan deteksi temuan konten negatif, mengelola *baseline* halaman web acuan, menginisiasi pemindaian mandiri, mengelola jadwal pemindaian otomatis, mengelola notifikasi email, mencetak laporan hasil pemeriksaan, serta mengelola kategori deteksi.\n")
        new_lines.append("2. **Petugas (Operator Monitoring CSIRT):** Berada pada sisi kanan atas batas sistem, bertanggung jawab dalam aktivitas operasional harian mencakup peninjauan *dashboard* pemantauan, verifikasi laporan hasil deteksi insiden (verifikasi, hapus log temuan, detail cuplikan bukti), melakukan pemindaian mandiri dengan penyertaan email petugas, memberikan catatan tanggapan hasil pemeriksaan, serta mengelola kategori deteksi.\n")
        new_lines.append("3. **Masyarakat (Publik / Pengelola Web OPD):** Berada pada sisi kanan bawah batas sistem, dapat mengakses *landing page* *dashboard* publik untuk mengetahui alur dan status pemantauan CSIRT, menuliskan laporan pengaduan indikasi konten negatif pada domain OPD, serta memantau riwayat pengaduan yang diajukan.\n\n")
        new_lines.append("Model diagram pada Gambar 4. 2 menempatkan *use case* **Login** pada sumbu tengah sebagai pusat kendali autentikasi sesi, di mana seluruh *use case* yang mensyaratkan hak akses terproteksi dihubungkan menggunakan relasi `<<include>>` yang mengarah ke *use case* Login. Di bagian bawah sumbu tengah, *use case* **Logout** dihubungkan dari *use case* Login melalui relasi `<<include>>` untuk mengakhiri sesi otentikasi. Sementara itu, fungsionalitas perluasan seperti pencarian sesuai filter, aksi sub-laporan (verifikasi, hapus, detail), penyimpanan catatan tanggapan, pengunggahan aduan, serta ekspor dokumen PDF laporan dimodelkan melalui relasi `<<extend>>` yang mengarah ke *use case* induknya.\n\n")
        new_lines.append("---\n\n")
        continue
    
    if skip and line.strip() == "### 4.1.3 Activity Diagram":
        skip = False
    
    if not skip:
        new_lines.append(line)

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Updated BAB_IV_HASIL_DAN_PEMBAHASAN.md successfully!")
