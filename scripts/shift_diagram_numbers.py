# -*- coding: utf-8 -*-
import os
import shutil

# Mockup directory: shift 4.17 -> 4.18 up to 4.26 -> 4.27
mockup_dir = r"D:\content detection\docs\bab-iv\mockups"
mockup_shifts = [
    ("gambar-4.17-mockup-halaman-login", "gambar-4.18-mockup-halaman-login"),
    ("gambar-4.18-mockup-dashboard-utama", "gambar-4.19-mockup-dashboard-utama"),
    ("gambar-4.19-mockup-pemindaian-website", "gambar-4.20-mockup-pemindaian-website"),
    ("gambar-4.20-mockup-riwayat-pemindaian", "gambar-4.21-mockup-riwayat-pemindaian"),
    ("gambar-4.21-mockup-detail-hasil-pemindaian", "gambar-4.22-mockup-detail-hasil-pemindaian"),
    ("gambar-4.22-mockup-deteksi-konten-negatif", "gambar-4.23-mockup-deteksi-konten-negatif"),
    ("gambar-4.23-mockup-deteksi-tautan-mencurigakan", "gambar-4.24-mockup-deteksi-tautan-mencurigakan"),
    ("gambar-4.24-mockup-deteksi-defacement", "gambar-4.25-mockup-deteksi-defacement"),
    ("gambar-4.25-mockup-pengelolaan-baseline", "gambar-4.26-mockup-pengelolaan-baseline"),
    ("gambar-4.26-mockup-notifikasi-email", "gambar-4.27-mockup-notifikasi-email"),
]

for old_base, new_base in mockup_shifts:
    for ext in [".png", ".svg"]:
        src = os.path.join(mockup_dir, f"{old_base}{ext}")
        dst = os.path.join(mockup_dir, f"{new_base}{ext}")
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"Copied mockup: {old_base}{ext} -> {new_base}{ext}")

# Screenshot directory: shift 4.27 -> 4.28 up to 4.33 -> 4.34
shot_dir = r"D:\content detection\docs\bab-iv\screenshots"
shot_shifts = [
    ("gambar-4.27-implementasi-halaman-login.jpg", "gambar-4.28-implementasi-halaman-login.jpg"),
    ("gambar-4.28-implementasi-hasil-deteksi.jpg", "gambar-4.29-implementasi-hasil-deteksi.jpg"),
    ("gambar-4.29-implementasi-detail-hasil-pemindaian.png", "gambar-4.30-implementasi-detail-hasil-pemindaian.png"),
    ("gambar-4.30-implementasi-kotak-masuk-email.jpg", "gambar-4.31-implementasi-kotak-masuk-email.jpg"),
    ("gambar-4.31-implementasi-detail-pesan-email.png", "gambar-4.32-implementasi-detail-pesan-email.png"),
    ("gambar-4.32-implementasi-penanganan-error-crawling.jpg", "gambar-4.33-implementasi-penanganan-error-crawling.jpg"),
    ("gambar-4.33-implementasi-analisis-google-snippet.png", "gambar-4.34-implementasi-analisis-google-snippet.png"),
]

for src_name, dst_name in shot_shifts:
    src = os.path.join(shot_dir, src_name)
    dst = os.path.join(shot_dir, dst_name)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"Copied screenshot: {src_name} -> {dst_name}")

print("Done shifting files for Class Diagram insertion!")
