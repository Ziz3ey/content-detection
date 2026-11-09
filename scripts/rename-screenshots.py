import os
import shutil

dst_dir = r'D:\content detection\docs\bab-iv\screenshots'

files = {
    'gambar-4.22-halaman-login.jpg': 'gambar-4.27-implementasi-halaman-login.jpg',
    'gambar-4.23-halaman-hasil-deteksi.jpg': 'gambar-4.28-implementasi-hasil-deteksi.jpg',
    'gambar-4.24-detail-hasil-pemindaian.png': 'gambar-4.29-implementasi-detail-hasil-pemindaian.png',
    'gambar-4.25-kotak-masuk-email-petugas.jpg': 'gambar-4.30-implementasi-kotak-masuk-email.jpg',
    'gambar-4.26-detail-email-notifikasi.png': 'gambar-4.31-implementasi-detail-pesan-email.png',
    'gambar-4.27-penanganan-error-crawling.jpg': 'gambar-4.32-implementasi-penanganan-error-crawling.jpg',
    'gambar-4.28-analisis-google-snippet.png': 'gambar-4.33-implementasi-analisis-google-snippet.png'
}

for old_name, new_name in files.items():
    old_p = os.path.join(dst_dir, old_name)
    new_p = os.path.join(dst_dir, new_name)
    if os.path.exists(old_p):
        os.rename(old_p, new_p)
        print(f'Renamed {old_name} -> {new_name}')

print('Screenshots renamed successfully.')
