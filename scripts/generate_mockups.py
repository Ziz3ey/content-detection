import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon

BASE_DIR = r'D:\content detection\docs\bab-iv\mockups'
os.makedirs(BASE_DIR, exist_ok=True)

def save_mockup(fig, name):
    png_path = os.path.join(BASE_DIR, f"{name}.png")
    svg_path = os.path.join(BASE_DIR, f"{name}.svg")
    fig.savefig(png_path, dpi=300, bbox_inches='tight', facecolor='white')
    fig.savefig(svg_path, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    print(f"Generated mockup: {name}")

def draw_browser_frame(ax, url):
    # Window border
    win = FancyBboxPatch((0, 0), 100, 100, boxstyle="round,pad=0.5", fc='#F8FAFC', ec='#475569', lw=1.5)
    ax.add_patch(win)
    # Header chrome bar
    bar = FancyBboxPatch((0, 93), 100, 7, boxstyle="square,pad=0", fc='#E2E8F0', ec='#94A3B8', lw=1)
    ax.add_patch(bar)
    # 3 dots
    c1 = Circle((2.5, 96.5), 1.1, fc='#EF4444', ec='none')
    c2 = Circle((5.5, 96.5), 1.1, fc='#F59E0B', ec='none')
    c3 = Circle((8.5, 96.5), 1.1, fc='#10B981', ec='none')
    ax.add_patch(c1); ax.add_patch(c2); ax.add_patch(c3)
    # Address bar
    addr = FancyBboxPatch((13, 94.2), 74, 4.6, boxstyle="round,pad=0.2", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(addr)
    ax.text(15, 96.5, f"[SEC] {url}", ha='left', va='center', fontsize=7.5, color='#334155', fontfamily='monospace')

def draw_sidebar(ax, active_menu="Dashboard"):
    side = FancyBboxPatch((0, 0), 22, 93, boxstyle="square,pad=0", fc='#0F172A', ec='#1E293B', lw=1)
    ax.add_patch(side)
    # Logo
    ax.text(11, 87, "[CSIRT] CSIRT Sumbawa", ha='center', va='center', fontsize=9, fontweight='bold', color='white')
    ax.text(11, 84, "Content Detection System", ha='center', va='center', fontsize=6, color='#94A3B8')
    ax.plot([2, 20], [81, 81], color='#334155', lw=1)

    menus = [
        ("Dashboard", 76),
        ("Pemindaian", 69),
        ("Situs Web", 62),
        ("Jadwal Pemindaian", 55),
        ("Hasil Deteksi", 48),
        ("Riwayat Pemindaian", 41),
        ("Keluar (Logout)", 10)
    ]
    for label, y in menus:
        is_act = (label == active_menu)
        bg_c = '#1E3A8A' if is_act else 'none'
        txt_c = '#60A5FA' if is_act else '#CBD5E1'
        if is_act:
            btn = FancyBboxPatch((2, y-2.5), 18, 5, boxstyle="round,pad=0.2", fc=bg_c, ec='#3B82F6', lw=1)
            ax.add_patch(btn)
        ax.text(4, y, f"* {label}", ha='left', va='center', fontsize=7.5, fontweight='bold' if is_act else 'normal', color=txt_c)

# -----------------------------------------------------------------------------
# 1. Gambar 4.17 Mockup Halaman Login
# -----------------------------------------------------------------------------
def make_mockup_login():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_browser_frame(ax, "http://localhost:5173/#/login")

    # Left Hero Panel
    hero = FancyBboxPatch((0, 0), 45, 93, boxstyle="square,pad=0", fc='#0F172A', ec='none')
    ax.add_patch(hero)
    badge = FancyBboxPatch((5, 84), 24, 4, boxstyle="round,pad=0.2", fc='#1E293B', ec='#3B82F6', lw=1)
    ax.add_patch(badge)
    ax.text(17, 86, "SISTEM MONITORING RESMI", ha='center', va='center', fontsize=6.5, color='#93C5FD', fontweight='bold')
    ax.text(5, 76, "Satu Langkah Menuju\nPemantauan Situs\nyang Lebih Aman", ha='left', va='center', fontsize=12, fontweight='bold', color='white')
    ax.text(5, 64, "Platform monitoring & deteksi indikasi\nkonten negatif pada situs web Pemerintah\nKabupaten Sumbawa.", ha='left', va='center', fontsize=7, color='#94A3B8')

    features = [
        ("Web Crawling Terjadwal", "Perayapan otomatis berizin domain & robots.txt", 52),
        ("Pattern Matching Aho-Corasick", "Deteksi multi-pola judi, penipuan, pornografi", 41),
        ("Deteksi Perubahan (Defacement)", "Integritas DOM & baseline halaman instansi", 30)
    ]
    for title, desc, y in features:
        bx = FancyBboxPatch((5, y-3.5), 35, 7.5, boxstyle="round,pad=0.2", fc='#1E293B', ec='#334155', lw=1)
        ax.add_patch(bx)
        ax.text(7, y+1.2, f"[OK] {title}", fontsize=7, fontweight='bold', color='#38BDF8')
        ax.text(7, y-1.5, desc, fontsize=5.8, color='#94A3B8')

    # Right Login Form
    ax.text(72, 80, "Selamat Datang Kembali", ha='center', va='center', fontsize=14, fontweight='bold', color='#0F172A')
    ax.text(72, 75, "Masuk menggunakan akun administrator untuk monitoring.", ha='center', va='center', fontsize=7.5, color='#64748B')

    # Input User
    ax.text(52, 67, "Nama Pengguna", fontsize=7.5, fontweight='bold', color='#334155')
    in1 = FancyBboxPatch((52, 58), 40, 6, boxstyle="round,pad=0.2", fc='white', ec='#CBD5E1', lw=1.2)
    ax.add_patch(in1)
    ax.text(54, 61, "admin", fontsize=8, color='#0F172A', fontfamily='monospace')

    # Input Pass
    ax.text(52, 53, "Kata Sandi", fontsize=7.5, fontweight='bold', color='#334155')
    in2 = FancyBboxPatch((52, 44), 40, 6, boxstyle="round,pad=0.2", fc='white', ec='#CBD5E1', lw=1.2)
    ax.add_patch(in2)
    ax.text(54, 47, "*************************", fontsize=8, color='#0F172A')

    # Status alert
    alert = FancyBboxPatch((52, 35), 40, 5, boxstyle="round,pad=0.2", fc='#ECFDF5', ec='#10B981', lw=1)
    ax.add_patch(alert)
    ax.text(72, 37.5, "[OK] Layanan Analisis & Database Aktif", ha='center', va='center', fontsize=7, fontweight='bold', color='#065F46')

    # Submit button
    btn = FancyBboxPatch((52, 24), 40, 7.5, boxstyle="round,pad=0.3", fc='#2563EB', ec='#1D4ED8', lw=1)
    ax.add_patch(btn)
    ax.text(72, 27.75, "Masuk ke Dashboard ->", ha='center', va='center', fontsize=9, fontweight='bold', color='white')

    ax.text(72, 14, "[SEC] Sesi terenkripsi & audit log aktif. Diskominfo Sumbawa.", ha='center', va='center', fontsize=6.5, color='#94A3B8')
    save_mockup(fig, "gambar-4.17-mockup-halaman-login")

# -----------------------------------------------------------------------------
# 2. Gambar 4.18 Mockup Halaman Dashboard Utama
# -----------------------------------------------------------------------------
def make_mockup_dashboard():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_browser_frame(ax, "http://localhost:5173/#/dashboard")
    draw_sidebar(ax, active_menu="Dashboard")

    # Header top bar
    ax.text(26, 88, "Ringkasan Pemantauan Konten", fontsize=11, fontweight='bold', color='#0F172A')
    ax.text(26, 85, "Pantau status keamanan dan indikasi konten negatif OPD Kabupaten Sumbawa.", fontsize=7, color='#64748B')
    status_pill = FancyBboxPatch((84, 85), 13, 4, boxstyle="round,pad=0.2", fc='#DCFCE7', ec='#16A34A', lw=1)
    ax.add_patch(status_pill)
    ax.text(90.5, 87, "* SISTEM AKTIF", ha='center', va='center', fontsize=6.5, fontweight='bold', color='#15803D')

    # 4 Stat Cards
    stats = [
        ("Target Terdaftar", "14 Situs", "#EFF6FF", "#2563EB", 26),
        ("Total Pemindaian", "150 Scan", "#F0FDF4", "#16A34A", 44),
        ("Indikasi Ditemukan", "3 Temuan", "#FEF2F2", "#DC2626", 62),
        ("Status Terakhir", "Aman (Normal)", "#FAF5FF", "#9333EA", 80)
    ]
    for label, val, fc, ec, x in stats:
        c = FancyBboxPatch((x, 70), 16, 12, boxstyle="round,pad=0.3", fc=fc, ec=ec, lw=1)
        ax.add_patch(c)
        ax.text(x+8, 79, label, ha='center', va='center', fontsize=6.5, color='#475569')
        ax.text(x+8, 74, val, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#0F172A')

    # Chart Card Left
    c_chart = FancyBboxPatch((26, 26), 42, 40, boxstyle="round,pad=0.3", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(c_chart)
    ax.text(28, 63, "Aktivitas Pemindaian 7 Hari Terakhir", fontsize=7.5, fontweight='bold', color='#0F172A')
    # Dummy bar chart
    days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    vals = [12, 18, 15, 25, 20, 32, 28]
    for i, (d, v) in enumerate(zip(days, vals)):
        bx = 29 + i * 5.6
        by = 33
        bh = (v / 35) * 24
        bar = Rectangle((bx, by), 3.8, bh, fc='#3B82F6', ec='#1D4ED8', lw=1)
        ax.add_patch(bar)
        ax.text(bx+1.9, 30.5, d, ha='center', va='center', fontsize=6, color='#64748B')
        ax.text(bx+1.9, by+bh+1.5, str(v), ha='center', va='center', fontsize=5.8, fontweight='bold')

    # Category Breakdown Card Right
    c_cat = FancyBboxPatch((71, 26), 26, 40, boxstyle="round,pad=0.3", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(c_cat)
    ax.text(73, 63, "Kategori Indikasi", fontsize=7.5, fontweight='bold', color='#0F172A')
    cats = [
        ("Judi Online", "66%", "#EF4444", 55),
        ("Tautan Mencurigakan", "24%", "#F59E0B", 45),
        ("Phishing / Penipuan", "10%", "#3B82F6", 35)
    ]
    for cat_name, pct, col, y in cats:
        ax.text(73, y+2, cat_name, fontsize=6.8, color='#334155')
        ax.text(94, y+2, pct, fontsize=6.8, fontweight='bold', color=col, ha='right')
        bg_bar = FancyBboxPatch((73, y-2), 22, 2.2, boxstyle="round,pad=0.1", fc='#F1F5F9', ec='none')
        ax.add_patch(bg_bar)
        w = 22 * (float(pct.replace('%','')) / 100)
        fg_bar = FancyBboxPatch((73, y-2), w, 2.2, boxstyle="round,pad=0.1", fc=col, ec='none')
        ax.add_patch(fg_bar)

    # Bottom Recent Table Card
    c_table = FancyBboxPatch((26, 4), 71, 19, boxstyle="round,pad=0.3", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(c_table)
    ax.text(28, 20, "Pemindaian Terbaru", fontsize=7.5, fontweight='bold', color='#0F172A')
    # Mini table rows
    rows = [
        ("https://sumbawakab.go.id", "Petugas CSIRT 1", "5 Halaman", "BERSIH", "#15803D", 15),
        ("https://esamsatkotasumbawa.org", "Petugas CSIRT 2", "1 Halaman", "TERINDIKASI (1 Tautan)", "#B91C1C", 9)
    ]
    for url, pet, hal, stat, col, y in rows:
        ax.text(28, y, url, fontsize=6.5, fontfamily='monospace', color='#1E40AF')
        ax.text(56, y, pet, fontsize=6.5, color='#475569')
        ax.text(70, y, hal, fontsize=6.5, color='#475569')
        pill = FancyBboxPatch((80, y-1.5), 15, 3.2, boxstyle="round,pad=0.1", fc='#FEF2F2' if 'INDIKASI' in stat else '#DCFCE7', ec=col, lw=0.8)
        ax.add_patch(pill)
        ax.text(87.5, y, stat, ha='center', va='center', fontsize=5.5, fontweight='bold', color=col)

    save_mockup(fig, "gambar-4.18-mockup-halaman-dashboard")

# -----------------------------------------------------------------------------
# 3. Gambar 4.19 Mockup Form Pemindaian Website
# -----------------------------------------------------------------------------
def make_mockup_scan_form():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_browser_frame(ax, "http://localhost:5173/#/pemindaian")
    draw_sidebar(ax, active_menu="Pemindaian")

    # Header
    ax.text(26, 88, "Konfigurasi Pemindaian Website", fontsize=11, fontweight='bold', color='#0F172A')
    ax.text(26, 85, "Jalankan inspeksi kepatuhan konten, perayapan berizin, dan deteksi multi-pola.", fontsize=7, color='#64748B')

    # Main Card
    card = FancyBboxPatch((26, 6), 71, 76, boxstyle="round,pad=0.4", fc='white', ec='#CBD5E1', lw=1.2)
    ax.add_patch(card)

    # Field 1: Target URL
    ax.text(29, 77, "Alamat Website Target (URL) *", fontsize=7.5, fontweight='bold', color='#334155')
    in_url = FancyBboxPatch((29, 70), 65, 5.5, boxstyle="round,pad=0.2", fc='#F8FAFC', ec='#94A3B8', lw=1)
    ax.add_patch(in_url)
    ax.text(31, 72.7, "https://uts.ac.id/en/welcome/", fontsize=7.5, fontfamily='monospace', color='#0F172A')

    # Field 2 & 3: Max Depth & Max Pages
    ax.text(29, 66, "Batas Halaman (maxPages)", fontsize=7, fontweight='bold', color='#334155')
    in_pages = FancyBboxPatch((29, 60), 30, 4.8, boxstyle="round,pad=0.2", fc='#F8FAFC', ec='#94A3B8', lw=1)
    ax.add_patch(in_pages)
    ax.text(31, 62.4, "10 halaman", fontsize=7, color='#0F172A')

    ax.text(64, 66, "Kedalaman Rayapan (maxDepth)", fontsize=7, fontweight='bold', color='#334155')
    in_depth = FancyBboxPatch((64, 60), 30, 4.8, boxstyle="round,pad=0.2", fc='#F8FAFC', ec='#94A3B8', lw=1)
    ax.add_patch(in_depth)
    ax.text(66, 62.4, "2 tingkat (internal)", fontsize=7, color='#0F172A')

    # Field 4: Email Petugas (Fitur Utama Skripsi)
    email_box = FancyBboxPatch((29, 44), 65, 12, boxstyle="round,pad=0.3", fc='#EFF6FF', ec='#3B82F6', lw=1.2)
    ax.add_patch(email_box)
    ax.text(31, 52.5, "[EMAIL] Email Petugas (Wajib untuk Notifikasi Mandiri) *", fontsize=7.5, fontweight='bold', color='#1E40AF')
    in_email = FancyBboxPatch((31, 46.5), 61, 4.8, boxstyle="round,pad=0.2", fc='white', ec='#2563EB', lw=1)
    ax.add_patch(in_email)
    ax.text(33, 48.9, "aurelliaazisa@gmail.com", fontsize=7.5, fontfamily='monospace', color='#1E3A8A', fontweight='bold')
    ax.text(31, 44.8, "ℹ Notifikasi hasil pemindaian dikirim khusus ke email petugas yang memulai pemindaian ini.", fontsize=5.8, color='#3B82F6')

    # Detector Options
    ax.text(29, 39, "Modul Deteksi Aktif:", fontsize=7, fontweight='bold', color='#334155')
    checks = ["[X] Deteksi Teks (Aho-Corasick)", "[X] Deteksi Tautan Mencurigakan", "[X] Deteksi Defacement Baseline"]
    for i, chk in enumerate(checks):
        ax.text(29 + i * 22, 35, chk, fontsize=6.5, color='#0F172A', fontweight='bold')

    # Background Scan Notice
    bg_notice = FancyBboxPatch((29, 23), 65, 8, boxstyle="round,pad=0.2", fc='#FEF3C7', ec='#F59E0B', lw=1)
    ax.add_patch(bg_notice)
    ax.text(31, 28, "[RUN] Pemindaian Berjalan di Latar Belakang (Background Scanning)", fontsize=7, fontweight='bold', color='#92400E')
    ax.text(31, 25, "Setelah menekan tombol 'Mulai Pemindaian', petugas dapat menutup peramban atau mematikan laptop.\nSistem akan tetap menyelesaikan pemindaian dan otomatis mengirimkan laporan ke email petugas.", fontsize=5.8, color='#B45309')

    # Action Button
    btn = FancyBboxPatch((29, 11), 65, 7.5, boxstyle="round,pad=0.3", fc='#2563EB', ec='#1D4ED8', lw=1.2)
    ax.add_patch(btn)
    ax.text(61.5, 14.75, "[GO] Mulai Pemindaian (Background Scan)", ha='center', va='center', fontsize=9, fontweight='bold', color='white')

    save_mockup(fig, "gambar-4.19-mockup-form-pemindaian")

# -----------------------------------------------------------------------------
# 4. Gambar 4.20 Mockup Ringkasan Hasil Pemindaian
# -----------------------------------------------------------------------------
def make_mockup_results_summary():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_browser_frame(ax, "http://localhost:5173/#/hasil")
    draw_sidebar(ax, active_menu="Hasil Deteksi")

    # Breadcrumb & Header
    ax.text(26, 89, "SISTEM MONITORING CSIRT * PEMERIKSAAN KONTEN", fontsize=6, fontweight='bold', color='#64748B')
    ax.text(26, 85, "Hasil Deteksi: https://uts.ac.id/en/welcome/", fontsize=11, fontweight='bold', color='#0F172A')

    # Export Buttons
    b_pdf = FancyBboxPatch((76, 85), 10, 4, boxstyle="round,pad=0.1", fc='white', ec='#CBD5E1', lw=1)
    b_csv = FancyBboxPatch((87, 85), 10, 4, boxstyle="round,pad=0.1", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(b_pdf); ax.add_patch(b_csv)
    ax.text(81, 87, "[PDF] Unduh PDF", ha='center', va='center', fontsize=6, fontweight='bold', color='#334155')
    ax.text(92, 87, "[CSV] Ekspor CSV", ha='center', va='center', fontsize=6, fontweight='bold', color='#334155')

    # Green Email Sent Banner
    banner = FancyBboxPatch((26, 75), 71, 7.5, boxstyle="round,pad=0.2", fc='#DCFCE7', ec='#16A34A', lw=1)
    ax.add_patch(banner)
    ax.text(28, 80, "[EMAIL] Laporan email berhasil dikirim ke: aurelliaazisa@gmail.com", fontsize=7.5, fontweight='bold', color='#15803D')
    ax.text(28, 77, "ID Pesan: <8cd81eef-a58e-4885-d575-5137076c4e4d@localhost> (Status: TERKIRIM)", fontsize=6, color='#166534', fontfamily='monospace')

    # 4 Cards Summary
    cards = [
        ("5", "Total Halaman Diperiksa", "Jangkauan crawling aktif", "#F8FAFC", "#94A3B8", 26),
        ("0", "Halaman Berindikasi", "Ditemukan pola konten negatif", "#FEF2F2", "#EF4444", 44),
        ("5", "Halaman Tanpa Indikasi", "Bersih & lolos uji detektor", "#F0FDF4", "#22C55E", 62),
        ("0", "Halaman Gagal Periksa", "Kendala koneksi atau host", "#FFFBEB", "#F59E0B", 80)
    ]
    for num, lbl, desc, fc, ec, x in cards:
        c = FancyBboxPatch((x, 56), 16, 16, boxstyle="round,pad=0.3", fc=fc, ec=ec, lw=1)
        ax.add_patch(c)
        ax.text(x+8, 67, num, ha='center', va='center', fontsize=14, fontweight='bold', color='#0F172A')
        ax.text(x+8, 61, lbl, ha='center', va='center', fontsize=6.5, fontweight='bold', color='#334155')
        ax.text(x+8, 58, desc, ha='center', va='center', fontsize=5.2, color='#64748B')

    # Clean Result Card
    res_card = FancyBboxPatch((26, 26), 71, 26, boxstyle="round,pad=0.3", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(res_card)
    ax.text(28, 48, "Rincian Evaluasi Pemindaian", fontsize=8, fontweight='bold', color='#0F172A')

    details = [
        ("Nama Website", "uts.ac.id"),
        ("URL Target", "https://uts.ac.id/en/welcome/"),
        ("Email Petugas", "aurelliaazisa@gmail.com"),
        ("Waktu Mulai", "Sabtu, 7 November 2026 pukul 16.19.47 WITA"),
        ("Waktu Selesai", "Sabtu, 7 November 2026 pukul 16.20.49 WITA"),
        ("Status Pemindaian", "SELESAI (BERSIH / TIDAK DITEMUKAN INDIKASI)")
    ]
    for i, (k, v) in enumerate(details):
        y = 44 - i * 3.4
        ax.text(28, y, k, fontsize=6.8, color='#64748B')
        ax.text(48, y, ":", fontsize=6.8, color='#64748B')
        is_clean = ("BERSIH" in v)
        col = '#15803D' if is_clean else '#0F172A'
        ax.text(50, y, v, fontsize=6.8, fontweight='bold' if is_clean else 'normal', color=col)

    # Mitigation note
    note = FancyBboxPatch((26, 6), 71, 16, boxstyle="round,pad=0.2", fc='#F8FAFC', ec='#E2E8F0', lw=1)
    ax.add_patch(note)
    ax.text(28, 18, "Catatan Kepatuhan & Keamanan:", fontsize=7, fontweight='bold', color='#334155')
    ax.text(28, 14, "* Seluruh halaman dalam domain telah diperiksa terhadap 3 detektor (Teks, Tautan, dan Defacement).", fontsize=6, color='#475569')
    ax.text(28, 10, "* Salinan laporan lengkap telah diarsipkan ke dalam database SQLite untuk audit trail berkala.", fontsize=6, color='#475569')

    save_mockup(fig, "gambar-4.20-mockup-ringkasan-hasil-pemindaian")

# -----------------------------------------------------------------------------
# 5. Gambar 4.21 Mockup Detail Temuan Indikasi Konten
# -----------------------------------------------------------------------------
def make_mockup_content_findings():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_browser_frame(ax, "http://localhost:5173/#/hasil/detail/102")
    draw_sidebar(ax, active_menu="Hasil Deteksi")

    ax.text(26, 88, "Detail Temuan Indikasi Konten Negatif", fontsize=11, fontweight='bold', color='#0F172A')
    ax.text(26, 85, "URL: http://127.0.0.1:8080/positive-judi-01.html (Halaman Uji Judi Online)", fontsize=7, color='#64748B')

    # Warning Card
    warn = FancyBboxPatch((26, 73), 71, 9, boxstyle="round,pad=0.2", fc='#FEF2F2', ec='#EF4444', lw=1.2)
    ax.add_patch(warn)
    ax.text(28, 79, "[WARN] TERINDIKASI POLA KONTEN NEGATIF (JUDI ONLINE / GAMBLING)", fontsize=8, fontweight='bold', color='#B91C1C')
    ax.text(28, 76, "Ditemukan 3 indikasi kata kunci perjudian dengan tingkat keyakinan (confidence) 92.5%.", fontsize=6.5, color='#991B1B')

    # Table of Matches Card
    c_tab = FancyBboxPatch((26, 22), 71, 48, boxstyle="round,pad=0.3", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(c_tab)
    ax.text(28, 66, "Daftar Kata Kunci & Snippet Terdeteksi (Aho-Corasick)", fontsize=7.5, fontweight='bold', color='#0F172A')

    # Table Header
    hdr = Rectangle((27, 59), 69, 4, fc='#F1F5F9', ec='none')
    ax.add_patch(hdr)
    ax.text(29, 61, "KATA KUNCI", fontsize=6, fontweight='bold', color='#475569')
    ax.text(44, 61, "KATEGORI", fontsize=6, fontweight='bold', color='#475569')
    ax.text(58, 61, "BOBOT", fontsize=6, fontweight='bold', color='#475569')
    ax.text(68, 61, "CUPLIKAN KALIMAT (SNIPPET BUKTI)", fontsize=6, fontweight='bold', color='#475569')

    rows = [
        ("slot gacor", "Judi Online", "0.95", "...daftar sekarang di situs slot gacor hari ini dan raih...", 53),
        ("maxwin", "Judi Online", "0.85", "...garansi maxwin perkalian 500x dengan rtp live tertinggi...", 45),
        ("deposit pulsa", "Judi Online", "0.75", "...layanan deposit pulsa tanpa potongan 24 jam nonstop...", 37),
        ("jackpot", "Judi Online", "0.80", "...menangkan jackpot sensational setiap putaran permainan...", 29)
    ]
    for kw, cat, w, snip, y in rows:
        ax.plot([27, 96], [y+5, y+5], color='#E2E8F0', lw=0.6)
        pill = FancyBboxPatch((28.5, y+0.5), 13, 3.2, boxstyle="round,pad=0.1", fc='#FEE2E2', ec='#EF4444', lw=0.7)
        ax.add_patch(pill)
        ax.text(35, y+2.1, kw, ha='center', va='center', fontsize=6, fontweight='bold', color='#991B1B')
        ax.text(44, y+2, cat, fontsize=6, color='#334155')
        ax.text(59, y+2, w, fontsize=6, color='#334155')
        ax.text(68, y+2, snip, fontsize=5.5, color='#475569', fontfamily='monospace')

    # Action Toolbar Bottom
    tool = FancyBboxPatch((26, 6), 71, 13, boxstyle="round,pad=0.2", fc='#F8FAFC', ec='#E2E8F0', lw=1)
    ax.add_patch(tool)
    ax.text(28, 15, "Tindakan Petugas CSIRT:", fontsize=7, fontweight='bold', color='#334155')
    b1 = FancyBboxPatch((28, 8.5), 18, 4.5, boxstyle="round,pad=0.1", fc='#2563EB', ec='none')
    b2 = FancyBboxPatch((48, 8.5), 18, 4.5, boxstyle="round,pad=0.1", fc='#059669', ec='none')
    b3 = FancyBboxPatch((68, 8.5), 18, 4.5, boxstyle="round,pad=0.1", fc='#DC2626', ec='none')
    ax.add_patch(b1); ax.add_patch(b2); ax.add_patch(b3)
    ax.text(37, 10.75, "[COPY] Salin Bukti Forensik", ha='center', va='center', fontsize=6, color='white', fontweight='bold')
    ax.text(57, 10.75, "[OK] Verifikasi Temuan", ha='center', va='center', fontsize=6, color='white', fontweight='bold')
    ax.text(77, 10.75, "[ALERT] Kirim Eskalasi Insiden", ha='center', va='center', fontsize=6, color='white', fontweight='bold')

    save_mockup(fig, "gambar-4.21-mockup-detail-temuan-konten")

# -----------------------------------------------------------------------------
# 6. Gambar 4.22 Mockup Detail Temuan Tautan Mencurigakan
# -----------------------------------------------------------------------------
def make_mockup_link_findings():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_browser_frame(ax, "http://localhost:5173/#/hasil/links/103")
    draw_sidebar(ax, active_menu="Hasil Deteksi")

    ax.text(26, 88, "Detail Temuan Tautan Mencurigakan (Suspicious Links)", fontsize=11, fontweight='bold', color='#0F172A')
    ax.text(26, 85, "URL Target: https://esamsatkotasumbawa.org/ (Homepage)", fontsize=7, color='#64748B')

    # Card Table
    card = FancyBboxPatch((26, 12), 71, 70, boxstyle="round,pad=0.3", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(card)
    ax.text(28, 78, "Hasil Evaluasi Hyperlink Outbound & Atribut Tersembunyi", fontsize=7.5, fontweight='bold', color='#0F172A')

    # Table Header
    hdr = Rectangle((27, 71), 69, 4, fc='#F1F5F9', ec='none')
    ax.add_patch(hdr)
    ax.text(29, 73, "ANCHOR TEXT", fontsize=6, fontweight='bold', color='#475569')
    ax.text(45, 73, "TARGET URL / DESTINATION", fontsize=6, fontweight='bold', color='#475569')
    ax.text(71, 73, "KONDISI ATRIBUT CSS", fontsize=6, fontweight='bold', color='#475569')
    ax.text(87, 73, "STATUS RISIKO", fontsize=6, fontweight='bold', color='#475569')

    links = [
        ("slot gacor", "https://lakegardamountainrace.com", "style='display: none;'", "BERISIKO TINGGI", "#DC2626", 62),
        ("daftar login", "http://login-member88.top/ref", "visibility: hidden;", "BERISIKO TINGGI", "#DC2626", 52),
        ("official link", "https://agenmaxwin.xyz/promo", "font-size: 0px;", "MENCURIGAKAN", "#D97706", 42),
        ("Hubungi Bapenda", "https://bapenda.ntbprov.go.id", "normal", "AMAN (LOLOS)", "#16A34A", 32)
    ]
    for anc, dst, css, risk, col, y in links:
        ax.plot([27, 96], [y+6, y+6], color='#E2E8F0', lw=0.6)
        ax.text(29, y+2, anc, fontsize=6.5, fontweight='bold', color='#0F172A')
        ax.text(45, y+2, dst, fontsize=6, fontfamily='monospace', color='#1D4ED8')
        ax.text(71, y+2, css, fontsize=6, fontfamily='monospace', color='#B91C1C' if 'display' in css or 'hidden' in css or '0px' in css else '#15803D')
        pill = FancyBboxPatch((86, y+0.5), 10, 3.2, boxstyle="round,pad=0.1", fc='#FEF2F2' if 'BERISIKO' in risk else '#FEF3C7' if 'MENCURIGAKAN' in risk else '#DCFCE7', ec=col, lw=0.8)
        ax.add_patch(pill)
        ax.text(91, y+2.1, risk, ha='center', va='center', fontsize=4.8, fontweight='bold', color=col)

    # Explanation Box
    exp = FancyBboxPatch((28, 14), 67, 14, boxstyle="round,pad=0.2", fc='#FEF2F2', ec='#EF4444', lw=1)
    ax.add_patch(exp)
    ax.text(30, 24, "Analisis Forensik Tautan Injeksi:", fontsize=6.8, fontweight='bold', color='#991B1B')
    ax.text(30, 20.5, "* Ditemukan teknik SEO Cloaking / Injected Hidden Link menggunakan CSS inline style='display: none;'.", fontsize=5.8, color='#7F1D1D')
    ax.text(30, 17, "* Tautan mengarah ke domain luar non-pemerintah dengan kata kunci perjudian untuk mendongkrak backlink.", fontsize=5.8, color='#7F1D1D')

    save_mockup(fig, "gambar-4.22-mockup-detail-temuan-tautan")

# -----------------------------------------------------------------------------
# 7. Gambar 4.23 Mockup Detail Deteksi Defacement
# -----------------------------------------------------------------------------
def make_mockup_defacement():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_browser_frame(ax, "http://localhost:5173/#/hasil/defacement/104")
    draw_sidebar(ax, active_menu="Hasil Deteksi")

    ax.text(26, 88, "Detail Deteksi Perubahan Halaman (Defacement)", fontsize=11, fontweight='bold', color='#0F172A')
    ax.text(26, 85, "Pemeriksaan integritas DOM dan komparasi terhadap baseline tersimpan.", fontsize=7, color='#64748B')

    # Hash Comparison Cards
    c1 = FancyBboxPatch((26, 68), 34, 14, boxstyle="round,pad=0.2", fc='#F8FAFC', ec='#94A3B8', lw=1)
    c2 = FancyBboxPatch((63, 68), 34, 14, boxstyle="round,pad=0.2", fc='#FEF2F2', ec='#EF4444', lw=1.2)
    ax.add_patch(c1); ax.add_patch(c2)

    ax.text(28, 79, "Baseline Tersimpan (SHA-256)", fontsize=6.5, fontweight='bold', color='#475569')
    ax.text(28, 75, "7f83b1657ff1fc53b92dc18148a1d65df...", fontsize=5.8, fontfamily='monospace', color='#0F172A')
    ax.text(28, 71, "Waktu Baseline: 1 Oktober 2026", fontsize=5.8, color='#64748B')

    ax.text(65, 79, "Hasil Pemindaian Saat Ini (SHA-256)", fontsize=6.5, fontweight='bold', color='#B91C1C')
    ax.text(65, 75, "a4c28e918b931d8e90ff01928bc94a123...", fontsize=5.8, fontfamily='monospace', color='#B91C1C')
    ax.text(65, 71, "Status: HASH TIDAK COCOK (Berubah)", fontsize=5.8, fontweight='bold', color='#B91C1C')

    # Structural Diff Viewer Card
    c_diff = FancyBboxPatch((26, 12), 71, 53, boxstyle="round,pad=0.3", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(c_diff)
    ax.text(28, 61, "Perbandingan Struktur DOM & Komponen Halaman", fontsize=7.5, fontweight='bold', color='#0F172A')

    diffs = [
        ("Tag <title>", "Portal Resmi Dinas - Kabupaten Sumbawa", "Hacked by IndoSec - No System Is Safe", "#DC2626", 52),
        ("Elemen Header", "<header class='header-gov'> Logo & Nav</header>", "[DIHAPUS / HILANG DARI DOM]", "#DC2626", 41),
        ("Elemen Body", "Informasi Layanan Publik Pemda...", "<div class='deface-msg'>Hacked</div>", "#DC2626", 30),
        ("Injeksi Script", "None (Baseline Bersih)", "<script src='https://malicious.club/x.js'>", "#DC2626", 19)
    ]
    for param, base, curr, col, y in diffs:
        ax.plot([27, 96], [y+8, y+8], color='#E2E8F0', lw=0.6)
        ax.text(28, y+4, param, fontsize=6.5, fontweight='bold', color='#334155')
        ax.text(42, y+4, f"Baseline: {base}", fontsize=5.8, color='#475569')
        ax.text(42, y+1, f"Saat Ini: {curr}", fontsize=5.8, fontweight='bold', color=col)

    save_mockup(fig, "gambar-4.23-mockup-detail-deteksi-defacement")

# -----------------------------------------------------------------------------
# 8. Gambar 4.24 Mockup Riwayat Pemindaian Website
# -----------------------------------------------------------------------------
def make_mockup_history():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_browser_frame(ax, "http://localhost:5173/#/riwayat")
    draw_sidebar(ax, active_menu="Riwayat Pemindaian")

    ax.text(26, 88, "Riwayat Pemindaian Website", fontsize=11, fontweight='bold', color='#0F172A')
    ax.text(26, 85, "Daftar seluruh riwayat inspeksi website beserta email petugas pemrakarsa.", fontsize=7, color='#64748B')

    # Filter Bar
    fbar = FancyBboxPatch((26, 74), 71, 8, boxstyle="round,pad=0.2", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(fbar)
    ax.text(28, 78, "Cari URL / Petugas:", fontsize=6.5, color='#475569')
    in_srch = FancyBboxPatch((40, 75.5), 24, 5, boxstyle="round,pad=0.1", fc='#F8FAFC', ec='#CBD5E1', lw=0.8)
    ax.add_patch(in_srch)
    ax.text(42, 78, "sumbawakab.go.id", fontsize=6.5, fontfamily='monospace')

    ax.text(67, 78, "Status:", fontsize=6.5, color='#475569')
    in_sel = FancyBboxPatch((72, 75.5), 14, 5, boxstyle="round,pad=0.1", fc='#F8FAFC', ec='#CBD5E1', lw=0.8)
    ax.add_patch(in_sel)
    ax.text(74, 78, "Semua Status v", fontsize=6.5)

    btn_f = FancyBboxPatch((88, 75.5), 8, 5, boxstyle="round,pad=0.1", fc='#2563EB', ec='none')
    ax.add_patch(btn_f)
    ax.text(92, 78, "Filter", ha='center', va='center', fontsize=6.5, fontweight='bold', color='white')

    # Table Card
    c_tab = FancyBboxPatch((26, 12), 71, 60, boxstyle="round,pad=0.3", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(c_tab)

    # Table Header
    hdr = Rectangle((27, 66), 69, 4, fc='#F1F5F9', ec='none')
    ax.add_patch(hdr)
    ax.text(28, 68, "ID", fontsize=6, fontweight='bold', color='#475569')
    ax.text(32, 68, "TARGET WEBSITE", fontsize=6, fontweight='bold', color='#475569')
    ax.text(54, 68, "EMAIL PETUGAS", fontsize=6, fontweight='bold', color='#475569')
    ax.text(72, 68, "WAKTU SCAN", fontsize=6, fontweight='bold', color='#475569')
    ax.text(82, 68, "STATUS", fontsize=6, fontweight='bold', color='#475569')
    ax.text(91, 68, "AKSI", fontsize=6, fontweight='bold', color='#475569')

    rows = [
        ("152", "https://sumbawakab.go.id", "aurelliaazisa@gmail.com", "07/11 16:19", "BERSIH", "#16A34A", 58),
        ("151", "https://esamsatkotasumbawa.org", "petugas.csirt@sumbawa.go.id", "07/11 15:30", "INDIKASI", "#DC2626", 49),
        ("150", "http://127.0.0.1:8080/positive-01", "azisaaurellia@gmail.com", "07/11 14:10", "INDIKASI", "#DC2626", 40),
        ("149", "https://kpu.go.id/sumbawa", "petugas.csirt@sumbawa.go.id", "07/11 12:45", "BERSIH", "#16A34A", 31),
        ("148", "https://uts.ac.id/en/welcome/", "aurelliaazisa@gmail.com", "07/11 10:15", "BERSIH", "#16A34A", 22)
    ]
    for sid, url, pet, wkt, stat, col, y in rows:
        ax.plot([27, 96], [y+6, y+6], color='#E2E8F0', lw=0.6)
        ax.text(28, y+2, sid, fontsize=6, color='#64748B')
        ax.text(32, y+2, url, fontsize=6, fontfamily='monospace', color='#1D4ED8')
        ax.text(54, y+2, pet, fontsize=5.8, color='#334155')
        ax.text(72, y+2, wkt, fontsize=6, color='#475569')
        pill = FancyBboxPatch((81, y+0.5), 8, 3.2, boxstyle="round,pad=0.1", fc='#DCFCE7' if 'BERSIH' in stat else '#FEF2F2', ec=col, lw=0.8)
        ax.add_patch(pill)
        ax.text(85, y+2.1, stat, ha='center', va='center', fontsize=5, fontweight='bold', color=col)
        ax.text(92.5, y+2, "[ Detail ]", fontsize=5.8, fontweight='bold', color='#2563EB')

    # Pagination bottom
    ax.text(50, 15, "Menampilkan 1 - 5 dari 152 data pemindaian", fontsize=6, color='#64748B')
    ax.text(85, 15, "<< 1  2  3  4 ... 31 >>", fontsize=6.5, color='#1E40AF', fontweight='bold')

    save_mockup(fig, "gambar-4.24-mockup-riwayat-pemindaian")

# -----------------------------------------------------------------------------
# 9. Gambar 4.25 Mockup Manajemen Target Website Pemerintah
# -----------------------------------------------------------------------------
def make_mockup_sites():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_browser_frame(ax, "http://localhost:5173/#/situs")
    draw_sidebar(ax, active_menu="Situs Web")

    ax.text(26, 88, "Manajemen Target Website Pemerintah", fontsize=11, fontweight='bold', color='#0F172A')
    ax.text(26, 85, "Daftar domain resmi OPD Pemerintah Kabupaten Sumbawa dalam lingkup monitoring.", fontsize=7, color='#64748B')

    # Add Site Button
    btn_add = FancyBboxPatch((79, 84), 18, 5.5, boxstyle="round,pad=0.2", fc='#2563EB', ec='none')
    ax.add_patch(btn_add)
    ax.text(88, 86.75, "+ Tambah Target Baru", ha='center', va='center', fontsize=6.5, fontweight='bold', color='white')

    # Table Card
    c_tab = FancyBboxPatch((26, 12), 71, 70, boxstyle="round,pad=0.3", fc='white', ec='#CBD5E1', lw=1)
    ax.add_patch(c_tab)

    # Header
    hdr = Rectangle((27, 76), 69, 4, fc='#F1F5F9', ec='none')
    ax.add_patch(hdr)
    ax.text(28, 78, "NO", fontsize=6, fontweight='bold', color='#475569')
    ax.text(32, 78, "NAMA INSTANSI / OPD", fontsize=6, fontweight='bold', color='#475569')
    ax.text(56, 78, "DOMAIN RESMI", fontsize=6, fontweight='bold', color='#475569')
    ax.text(76, 78, "STATUS HTTP", fontsize=6, fontweight='bold', color='#475569')
    ax.text(88, 78, "AKSI", fontsize=6, fontweight='bold', color='#475569')

    sites = [
        ("1", "Portal Resmi Pemkab Sumbawa", "https://sumbawakab.go.id", "403 (WAF)", "#D97706", 68),
        ("2", "Bappeda Kabupaten Sumbawa", "https://bappeda.sumbawakab.go.id", "403 (WAF)", "#D97706", 58),
        ("3", "BKPSDM Kabupaten Sumbawa", "https://bkpsdm.sumbawakab.go.id", "403 (WAF)", "#D97706", 48),
        ("4", "KPU Kabupaten Sumbawa", "https://kpu.go.id/sumbawa", "200 (OK)", "#16A34A", 38),
        ("5", "E-Samsat Kota Sumbawa", "https://esamsatkotasumbawa.org", "200 (OK)", "#16A34A", 28),
        ("6", "Universitas Teknologi Sumbawa", "https://uts.ac.id", "200 (OK)", "#16A34A", 18)
    ]
    for no, inst, dom, st, col, y in sites:
        ax.plot([27, 96], [y+7, y+7], color='#E2E8F0', lw=0.6)
        ax.text(28, y+2.5, no, fontsize=6.5, color='#64748B')
        ax.text(32, y+2.5, inst, fontsize=6.5, fontweight='bold', color='#0F172A')
        ax.text(56, y+2.5, dom, fontsize=6, fontfamily='monospace', color='#1D4ED8')
        pill = FancyBboxPatch((75, y+1), 10, 3.2, boxstyle="round,pad=0.1", fc='#FEF3C7' if 'WAF' in st else '#DCFCE7', ec=col, lw=0.8)
        ax.add_patch(pill)
        ax.text(80, y+2.6, st, ha='center', va='center', fontsize=5.5, fontweight='bold', color=col)
        ax.text(89, y+2.5, "Pindai | Edit", fontsize=6, color='#2563EB')

    save_mockup(fig, "gambar-4.25-mockup-manajemen-target-website")

# -----------------------------------------------------------------------------
# 10. Gambar 4.26 Mockup Notifikasi Email Hasil Pemindaian
# -----------------------------------------------------------------------------
def make_mockup_email():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_browser_frame(ax, "https://mail.google.com/mail/u/0/#inbox/FMfcgzQxT...")

    # Email Container Card
    c_mail = FancyBboxPatch((8, 4), 84, 86, boxstyle="round,pad=0.4", fc='white', ec='#CBD5E1', lw=1.2)
    ax.add_patch(c_mail)

    # Subject & Sender Header
    ax.text(12, 84, "[PERINGATAN] Indikasi Konten Negatif Terdeteksi pada Website Pemerintah", fontsize=9.5, fontweight='bold', color='#B91C1C')
    ax.text(12, 80, "Dari: Sistem Pemantauan Sumbawa <azisaaurellia@gmail.com>", fontsize=7, color='#334155')
    ax.text(12, 77, "Kepada: aurelliaazisa@gmail.com (Petugas Pemrakarsa Pemindaian)", fontsize=7, fontweight='bold', color='#1E40AF')
    ax.plot([12, 88], [75, 75], color='#E2E8F0', lw=1)

    # Email Body Content - Red Alert Banner
    ebanner = FancyBboxPatch((12, 64), 76, 9, boxstyle="round,pad=0.2", fc='#FEF2F2', ec='#DC2626', lw=1.2)
    ax.add_patch(ebanner)
    ax.text(14, 70, "[ALERT] PERINGATAN DINI CSIRT KABUPATEN SUMBAWA", fontsize=8, fontweight='bold', color='#991B1B')
    ax.text(14, 66.5, "Sistem mendeteksi adanya indikasi pola konten negatif pada salah satu halaman situs web yang Anda pindai.", fontsize=6.2, color='#7F1D1D')

    # Summary Table Inside Email
    ax.text(12, 59, "Rincian Pelaksanaan Pemindaian:", fontsize=7.5, fontweight='bold', color='#0F172A')

    edetails = [
        ("Nama Website", "Portal Resmi Dinas"),
        ("URL Target", "https://sumbawakab.go.id/page-test"),
        ("Email Petugas", "aurelliaazisa@gmail.com"),
        ("Waktu Mulai", "Sabtu, 7 November 2026 pukul 16.19 WITA"),
        ("Waktu Selesai", "Sabtu, 7 November 2026 pukul 16.20 WITA"),
        ("Metode Pemeriksaan", "Pemeriksaan Mandiri Petugas (Background Scanning)"),
        ("Halaman Diperiksa", "5 halaman"),
        ("Jumlah Indikasi", "3 indikasi (2 Judi Online, 1 Tautan Mencurigakan)"),
        ("Status Pemindaian", "SELESAI DENGAN INDIKASI")
    ]
    for i, (k, v) in enumerate(edetails):
        y = 54 - i * 3.3
        ax.text(14, y, k, fontsize=6.5, color='#475569')
        ax.text(38, y, ":", fontsize=6.5, color='#475569')
        col = '#B91C1C' if 'INDIKASI' in v or 'Judi' in v else '#0F172A'
        ax.text(40, y, v, fontsize=6.5, fontweight='bold' if col != '#0F172A' else 'normal', color=col)

    # Action Button in Email
    ebtn = FancyBboxPatch((28, 17), 44, 6, boxstyle="round,pad=0.2", fc='#2563EB', ec='none')
    ax.add_patch(ebtn)
    ax.text(50, 20, "Buka Dashboard untuk Detail Forensik Lengkap ->", ha='center', va='center', fontsize=7, fontweight='bold', color='white')

    ax.text(50, 10, "Email ini dikirim otomatis oleh Sistem Pemantauan Konten Negatif Diskominfo Sumbawa.\nHarap segera lakukan verifikasi dan eskalasi apabila indikasi terbukti valid.", ha='center', va='center', fontsize=5.8, color='#94A3B8')

    save_mockup(fig, "gambar-4.26-mockup-notifikasi-email")

if __name__ == '__main__':
    print("Generating all 10 Balsamiq-style wireframe mockups...")
    make_mockup_login()
    make_mockup_dashboard()
    make_mockup_scan_form()
    make_mockup_results_summary()
    make_mockup_content_findings()
    make_mockup_link_findings()
    make_mockup_defacement()
    make_mockup_history()
    make_mockup_sites()
    make_mockup_email()
    print("All mockups generated successfully!")
