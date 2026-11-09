# PANDUAN DOKUMENTASI DAN ARTEFAK BAB IV SKRIPSI

**Judul Skripsi:**  
*Implementasi Web Crawling dan Pattern Matching untuk Deteksi Indikasi Konten Negatif pada Situs Web Pemerintah Kabupaten Sumbawa Berbasis Arsitektur Microservices*

**Penyusun:** Azisa Aurellia (NIM: 231001040)  
**Referensi Format:** Mastari (NIM: 221001047)  
**Program Studi:** Informatika, Fakultas Rekayasa Sistem, Universitas Teknologi Sumbawa  
**Tahun:** 2026  
**Direktori Dokumen:** `D:\content detection\docs\bab-iv`

---

## 1. STRUKTUR DIREKTORI DAN INVENTARIS BERKAS

```text
docs/bab-iv/
├── BAB_IV_HASIL_DAN_PEMBAHASAN.docx   # Dokumen Word Bab IV lengkap (Format Resmi 4-3-3-3 cm, TNR 12pt, 34 Gambar, 3 Tabel)
├── BAB_IV_HASIL_DAN_PEMBAHASAN.md     # Naskah lengkap Bab IV format Markdown (dengan KaTeX dan tabel evaluasi)
├── LAPORAN_AUDIT_BAB_IV.md            # Laporan audit komprehensif seluruh sistem, port, endpoint, dan inventaris fitur
├── README_BAB_IV.md                   # Petunjuk teknis dan daftar artefak Bab IV (berkas ini)
├── diagrams/                          # Diagram Arsitektur, Metodologi & UML Formal Draw.io (Hitam Putih: .drawio, .png, .svg)
│   ├── activity/                      # 8 Activity Diagram (Gambar 4.3 s/d 4.10)
│   ├── architecture/                  # 1 Architecture Diagram (Gambar 4.1)
│   ├── class/                         # 1 Class Diagram (Gambar 4.17)
│   ├── component/                     # 1 Component Diagram (Gambar 4.16)
│   ├── methodology/                   # 1 Diagram Alur Penelitian DSRM Bab III (Gambar 3.1)
│   ├── sequence/                      # 5 Sequence Diagram (Gambar 4.11 s/d 4.15)
│   └── use-case/                      # 1 Use Case Diagram (Gambar 4.2)
├── mockups/                           # 10 Mockup Wireframe Balsamiq Low-Fidelity (Gambar 4.18 s/d 4.27: .png, .svg)
├── reports/                           # Laporan audit dan metrik evaluasi tambahan
└── screenshots/                       # 7 Tangkapan Layar Nyata Sistem Berjalan (Gambar 4.28 s/d 4.34)
```

---

## 2. DAFTAR LENGKAP ARTEFAK GAMBAR (34 GAMBAR)

### A. Diagram Arsitektur, Metodologi, dan UML (Gaya Akademik Draw.io Hitam Putih — .drawio, .png, .svg)
1. **Gambar 4. 1** Arsitektur Sistem Monitoring dan Deteksi Konten Negatif Berbasis Microservices  
   `diagrams/architecture/gambar-4.1-arsitektur-sistem.drawio` | `.png` | `.svg`
2. **Gambar 4. 2** Use Case Diagram Sistem Monitoring dan Deteksi Indikasi Konten Negatif  
   `diagrams/use-case/gambar-4.2-use-case-diagram.drawio` | `.png` | `.svg`
3. **Gambar 4. 3** Activity Diagram Login Administrator  
   `diagrams/activity/gambar-4.3-activity-diagram-login.drawio` | `.png` | `.svg`
4. **Gambar 4. 4** Activity Diagram Pemindaian Website (Background Scanning)  
   `diagrams/activity/gambar-4.4-activity-diagram-pemindaian.drawio` | `.png` | `.svg`
5. **Gambar 4. 5** Activity Diagram Web Crawling  
   `diagrams/activity/gambar-4.5-activity-diagram-web-crawling.drawio` | `.png` | `.svg`
6. **Gambar 4. 6** Activity Diagram Deteksi Teks Aho-Corasick  
   `diagrams/activity/gambar-4.6-activity-diagram-deteksi-teks.drawio` | `.png` | `.svg`
7. **Gambar 4. 7** Activity Diagram Deteksi Tautan Mencurigakan  
   `diagrams/activity/gambar-4.7-activity-diagram-deteksi-tautan.drawio` | `.png` | `.svg`
8. **Gambar 4. 8** Activity Diagram Deteksi Defacement  
   `diagrams/activity/gambar-4.8-activity-diagram-deteksi-defacement.drawio` | `.png` | `.svg`
9. **Gambar 4. 9** Activity Diagram Penyimpanan dan Penampilan Hasil  
   `diagrams/activity/gambar-4.9-activity-diagram-penyimpanan-hasil.drawio` | `.png` | `.svg`
10. **Gambar 4. 10** Activity Diagram Notifikasi Email Per-Petugas  
    `diagrams/activity/gambar-4.10-activity-diagram-notifikasi-email.drawio` | `.png` | `.svg`
11. **Gambar 4. 11** Sequence Diagram Pemindaian Website  
    `diagrams/sequence/gambar-4.11-sequence-diagram-pemindaian.drawio` | `.png` | `.svg`
12. **Gambar 4. 12** Sequence Diagram Web Crawling  
    `diagrams/sequence/gambar-4.12-sequence-diagram-web-crawling.drawio` | `.png` | `.svg`
13. **Gambar 4. 13** Sequence Diagram Deteksi Teks Aho-Corasick  
    `diagrams/sequence/gambar-4.13-sequence-diagram-deteksi-teks.drawio` | `.png` | `.svg`
14. **Gambar 4. 14** Sequence Diagram Deteksi Tautan Mencurigakan  
    `diagrams/sequence/gambar-4.14-sequence-diagram-deteksi-tautan.drawio` | `.png` | `.svg`
15. **Gambar 4. 15** Sequence Diagram Deteksi Defacement  
    `diagrams/sequence/gambar-4.15-sequence-diagram-deteksi-defacement.drawio` | `.png` | `.svg`
16. **Gambar 4. 16** Component Diagram Arsitektur Microservices  
    `diagrams/component/gambar-4.16-component-diagram.drawio` | `.png` | `.svg`
17. **Gambar 4. 17** Class Diagram Sistem Pemantauan dan Deteksi Konten Negatif  
    `diagrams/class/gambar-4.17-class-diagram.drawio` | `.png` | `.svg`
18. **Gambar 3. 1** Alur Penelitian Metodologi Design Science Research (DSRM Bab III)  
    `diagrams/methodology/gambar-3.1-alur-penelitian-dsrm.drawio` | `.png` | `.svg`

### B. Low-Fidelity Wireframe Mockup Antarmuka Balsamiq (10 Gambar — Hitam Putih / Grayscale)
19. **Gambar 4. 18** Mockup Halaman Login Administrator  
    `mockups/gambar-4.18-mockup-halaman-login.png` | `.svg`
20. **Gambar 4. 19** Mockup Halaman Dashboard Utama  
    `mockups/gambar-4.19-mockup-dashboard-utama.png` | `.svg`
21. **Gambar 4. 20** Mockup Halaman Pemindaian Website  
    `mockups/gambar-4.20-mockup-pemindaian-website.png` | `.svg`
22. **Gambar 4. 21** Mockup Halaman Riwayat Pemindaian  
    `mockups/gambar-4.21-mockup-riwayat-pemindaian.png` | `.svg`
23. **Gambar 4. 22** Mockup Halaman Detail Hasil Pemindaian  
    `mockups/gambar-4.22-mockup-detail-hasil-pemindaian.png` | `.svg`
24. **Gambar 4. 23** Mockup Halaman Deteksi Konten Negatif  
    `mockups/gambar-4.23-mockup-deteksi-konten-negatif.png` | `.svg`
25. **Gambar 4. 24** Mockup Halaman Deteksi Tautan Mencurigakan  
    `mockups/gambar-4.24-mockup-deteksi-tautan-mencurigakan.png` | `.svg`
26. **Gambar 4. 25** Mockup Halaman Deteksi Defacement  
    `mockups/gambar-4.25-mockup-deteksi-defacement.png` | `.svg`
27. **Gambar 4. 26** Mockup Halaman Pengelolaan Baseline  
    `mockups/gambar-4.26-mockup-pengelolaan-baseline.png` | `.svg`
28. **Gambar 4. 27** Mockup Halaman Notifikasi Email  
    `mockups/gambar-4.27-mockup-notifikasi-email.png` | `.svg`

### C. Tangkapan Layar Implementasi Sistem Nyata (7 Gambar)
29. **Gambar 4. 28** Implementasi Halaman Login Administrator  
    `screenshots/gambar-4.28-implementasi-halaman-login.jpg`
30. **Gambar 4. 29** Implementasi Halaman Ringkasan Hasil Deteksi  
    `screenshots/gambar-4.29-implementasi-hasil-deteksi.jpg`
31. **Gambar 4. 30** Implementasi Halaman Detail Hasil Pemindaian dan Notifikasi Email  
    `screenshots/gambar-4.30-implementasi-detail-hasil-pemindaian.png`
32. **Gambar 4. 31** Implementasi Kotak Masuk Email Notifikasi Pemindaian  
    `screenshots/gambar-4.31-implementasi-kotak-masuk-email.jpg`
33. **Gambar 4. 32** Implementasi Detail Pesan Email Notifikasi Hasil Pemindaian  
    `screenshots/gambar-4.32-implementasi-detail-pesan-email.png`
34. **Gambar 4. 33** Implementasi Penanganan Error Perayapan (Crawling Failure Handling)  
    `screenshots/gambar-4.33-implementasi-penanganan-error-crawling.jpg`
35. **Gambar 4. 34** Implementasi Analisis Google Snippet vs Konten Asli Website  
    `screenshots/gambar-4.34-implementasi-analisis-google-snippet.png`

---

## 3. HASIL EVALUASI EMPIRIS DATASET (50 SAMPEL)

Dataset evaluasi disimpan pada direktori `evaluation/datasets/v1/` dan telah divalidasi dengan checksum SHA-256:
- **Sampel Normal (Clean):** 25 halaman resmi instansi publik Kabupaten Sumbawa (KPU, Bawaslu, KPP Pratama, Kejari, UTS, E-Samsat).
- **Sampel Positif (Indikasi):** 25 halaman sintetis (9 Judi Online, 8 Phishing/Penipuan, 8 Pornografi Teks/HTML).

**Matriks Kebingungan (Confusion Matrix):**
- True Positive (TP): **25**
- True Negative (TN): **25**
- False Positive (FP): **0**
- False Negative (FN): **0**

**Metrik Performa:**
- **Akurasi:** 100.00%
- **Presisi:** 100.00%
- **Recall (Sensitivitas):** 100.00%
- **F1-Score:** 100.00%
- **False Positive Rate (FPR):** 0.00%

---

## 4. INSTRUKSI RE-GENERASI ARTEFAK

Apabila terdapat perubahan pada kode sumber atau diagram, seluruh artefak dapat dibuat ulang menggunakan perintah berikut:

1. **Membuat Ulang Diagram Draw.io XML dan Render Formal Hitam Putih (.png & .svg):**
   ```powershell
   python scripts/generate_drawio_xml.py
   python scripts/generate_formal_bw_diagrams.py
   ```
2. **Membuat Ulang Wireframe Mockup Balsamiq (Hitam Putih):**
   ```powershell
   python scripts/generate_balsamiq_mockups.py
   ```
3. **Menjalankan Ulang Evaluasi Dataset 50 Sampel:**
   ```powershell
   node evaluation/validate-dataset.js
   node evaluation/run-evaluation.js
   ```
4. **Mengompilasi Ulang Naskah Markdown dan Dokumen Word:**
   ```powershell
   python scripts/write_bab4_md.py
   python scripts/build_bab4_docx.py
   ```
31. **Gambar 4. 31** Implementasi Detail Pesan Email Notifikasi Hasil Pemindaian  
    `screenshots/gambar-4.31-implementasi-detail-pesan-email.png`
32. **Gambar 4. 32** Implementasi Penanganan Error Perayapan (Crawling Failure Handling)  
    `screenshots/gambar-4.32-implementasi-penanganan-error-crawling.jpg`
33. **Gambar 4. 33** Implementasi Analisis Google Snippet vs Konten Asli Website  
    `screenshots/gambar-4.33-implementasi-analisis-google-snippet.png`

---

## 3. HASIL EVALUASI EMPIRIS DATASET (50 SAMPEL)

Dataset evaluasi disimpan pada direktori `evaluation/datasets/v1/` dan telah divalidasi dengan checksum SHA-256:
- **Sampel Normal (Clean):** 25 halaman resmi instansi publik Kabupaten Sumbawa (KPU, Bawaslu, KPP Pratama, Kejari, UTS, E-Samsat).
- **Sampel Positif (Indikasi):** 25 halaman sintetis (9 Judi Online, 8 Phishing/Penipuan, 8 Pornografi Teks/HTML).

**Matriks Kebingungan (Confusion Matrix):**
- True Positive (TP): **25**
- True Negative (TN): **25**
- False Positive (FP): **0**
- False Negative (FN): **0**

**Metrik Performa:**
- **Akurasi:** 100.00%
- **Presisi:** 100.00%
- **Recall (Sensitivitas):** 100.00%
- **F1-Score:** 100.00%
- **False Positive Rate (FPR):** 0.00%

---

## 4. INSTRUKSI RE-GENERASI ARTEFAK

Apabila terdapat perubahan pada kode sumber atau diagram, seluruh artefak dapat dibuat ulang menggunakan perintah berikut:

1. **Membuat Ulang Diagram UML:**
   ```powershell
   python scripts/generate_diagrams.py
   python scripts/generate_uml_all.py
   ```
2. **Membuat Ulang Wireframe Mockup Balsamiq (Hitam Putih):**
   ```powershell
   python scripts/generate_balsamiq_mockups.py
   ```
3. **Menjalankan Ulang Evaluasi Dataset 50 Sampel:**
   ```powershell
   node evaluation/validate-dataset.js
   node evaluation/run-evaluation.js
   ```
4. **Mengompilasi Ulang Naskah Markdown dan Dokumen Word:**
   ```powershell
   python scripts/write_bab4_md.py
   python scripts/build_bab4_docx.py
   ```
