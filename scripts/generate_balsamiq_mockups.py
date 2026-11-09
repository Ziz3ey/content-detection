# -*- coding: utf-8 -*-
"""
Script to generate 10 Balsamiq-Style Low-Fidelity Wireframe Mockups
for BAB IV Skripsi:
"Implementasi Web Crawling dan Pattern Matching untuk Deteksi Indikasi Konten Negatif
pada Situs Web Pemerintah Kabupaten Sumbawa Berbasis Arsitektur Microservices"

Style Guidelines:
- Strictly Black and White / Grayscale (#FFFFFF, #F4F4F4, #E5E5E5, #CCCCCC, #666666, #000000).
- ZERO decorative colors (no blue, green, red, orange, purple, etc.).
- White background, black/dark-gray strokes and text.
- Clean wireframe lines, rounded/squared boxes, hand-drawn wireframe feel.
- Standard Balsamiq conventions: [ Button ], [ Input Field ], [X] / [ ] Checkbox, (o) / ( ) Radio, [ Table ], [ Placeholder ].
- High-res PNG (300 DPI) and editable SVG outputs in docs/bab-iv/mockups/.
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon
from matplotlib.lines import Line2D

BASE_DIR = r'D:\content detection\docs\bab-iv\mockups'
os.makedirs(BASE_DIR, exist_ok=True)

def save_wireframe(fig, filename_base):
    png_path = os.path.join(BASE_DIR, f"{filename_base}.png")
    svg_path = os.path.join(BASE_DIR, f"{filename_base}.svg")
    fig.savefig(png_path, dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
    fig.savefig(svg_path, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close(fig)
    print(f"Generated wireframe: {filename_base} (.png & .svg)")

# -----------------------------------------------------------------------------
# WIREFRAME UI HELPER FUNCTIONS
# -----------------------------------------------------------------------------
def draw_window_chrome(ax, url="http://localhost:5173/#/dashboard", title="Content Detection System - Wireframe"):
    # Main outer window frame
    outer = FancyBboxPatch((0, 0), 100, 100, boxstyle="round,pad=0.2", fc='white', ec='#222222', lw=1.5)
    ax.add_patch(outer)
    # Header bar
    hbar = FancyBboxPatch((0, 93), 100, 7, boxstyle="square,pad=0", fc='#EEEEEE', ec='#222222', lw=1.2)
    ax.add_patch(hbar)
    # 3 wireframe window dots
    c1 = Circle((2.5, 96.5), 1.0, fc='white', ec='#444444', lw=1.2)
    c2 = Circle((5.2, 96.5), 1.0, fc='white', ec='#444444', lw=1.2)
    c3 = Circle((7.9, 96.5), 1.0, fc='white', ec='#444444', lw=1.2)
    ax.add_patch(c1); ax.add_patch(c2); ax.add_patch(c3)
    # Address bar
    addr = FancyBboxPatch((12, 94.2), 74, 4.6, boxstyle="round,pad=0.2", fc='white', ec='#666666', lw=1.0)
    ax.add_patch(addr)
    ax.text(14, 96.5, f"[URL] {url}", ha='left', va='center', fontsize=7.5, color='#222222', fontfamily='monospace')
    # Window controls on right
    ax.text(95, 96.5, "[-] [o] [X]", ha='center', va='center', fontsize=7, color='#444444', fontfamily='monospace')

def draw_wireframe_sidebar(ax, active_item="Dashboard"):
    # Sidebar container
    side = FancyBboxPatch((0, 0), 22, 93, boxstyle="square,pad=0", fc='#FAFAFA', ec='#333333', lw=1.2)
    ax.add_patch(side)

    # Logo / Header Box
    logo_box = Rectangle((2, 83), 18, 8, fc='#EEEEEE', ec='#444444', lw=1.0)
    ax.add_patch(logo_box)
    ax.text(11, 88, "[ CSIRT ]", ha='center', va='center', fontsize=8, fontweight='bold', color='#111111')
    ax.text(11, 85, "Kab. Sumbawa", ha='center', va='center', fontsize=6.5, color='#444444')
    ax.plot([2, 20], [80.5, 80.5], color='#888888', lw=0.8, linestyle='--')

    # Menu items based on actual dashboard tabs
    menus = [
        ("Dashboard", 74),
        ("Pemindaian", 67),
        ("Riwayat", 60),
        ("Hasil Terbaru", 53),
        ("Manajemen Situs", 46),
        ("Jadwal", 39),
        ("Keluar (Logout)", 8)
    ]
    for label, y in menus:
        is_active = (label == active_item)
        if is_active:
            # Active tab highlighted with light gray and solid border
            act_box = FancyBboxPatch((2, y-2.5), 18, 5, boxstyle="round,pad=0.1", fc='#D8D8D8', ec='#111111', lw=1.2)
            ax.add_patch(act_box)
            ax.text(4, y, f"[>] {label}", ha='left', va='center', fontsize=7, fontweight='bold', color='#000000')
        else:
            ax.text(4, y, f"[ ] {label}", ha='left', va='center', fontsize=7, color='#444444')

def draw_wireframe_topbar(ax, title="Ringkasan Sistem"):
    ax.text(25, 88.5, title, fontsize=10, fontweight='bold', color='#111111')
    # Search box placeholder
    srch = FancyBboxPatch((62, 86.5), 22, 4.5, boxstyle="round,pad=0.1", fc='white', ec='#888888', lw=0.8)
    ax.add_patch(srch)
    ax.text(64, 88.75, "Cari... [?]", fontsize=6.5, color='#777777')
    # User badge
    usr = FancyBboxPatch((86, 86.5), 11, 4.5, boxstyle="round,pad=0.1", fc='#EEEEEE', ec='#444444', lw=0.8)
    ax.add_patch(usr)
    ax.text(91.5, 88.75, "[ Petugas v ]", ha='center', va='center', fontsize=6.5, color='#111111')
    # Separator line
    ax.plot([22, 98], [84, 84], color='#CCCCCC', lw=0.8)

def draw_wireframe_button(ax, xy, w, h, text, is_primary=False):
    fc = '#E0E0E0' if is_primary else 'white'
    ec = '#000000' if is_primary else '#444444'
    btn = FancyBboxPatch(xy, w, h, boxstyle="round,pad=0.15", fc=fc, ec=ec, lw=1.2 if is_primary else 0.9)
    ax.add_patch(btn)
    ax.text(xy[0] + w/2, xy[1] + h/2, f"[ {text} ]", ha='center', va='center',
            fontsize=7, fontweight='bold' if is_primary else 'normal', color='#000000')

def draw_wireframe_input(ax, xy, w, h, label, value=""):
    ax.text(xy[0], xy[1] + h + 1.2, label, fontsize=6.8, fontweight='bold', color='#222222')
    inp = FancyBboxPatch(xy, w, h, boxstyle="round,pad=0.1", fc='white', ec='#444444', lw=1.0)
    ax.add_patch(inp)
    if value:
        ax.text(xy[0] + 1.5, xy[1] + h/2, value, ha='left', va='center', fontsize=6.8, color='#333333', fontfamily='monospace')

def draw_placeholder_box(ax, xy, w, h, label="[ Placeholder Area ]"):
    box = Rectangle(xy, w, h, fc='#F9F9F9', ec='#888888', lw=1.0, linestyle='--')
    ax.add_patch(box)
    # Diagonal wireframe cross
    ax.plot([xy[0], xy[0]+w], [xy[1], xy[1]+h], color='#D0D0D0', lw=0.7)
    ax.plot([xy[0], xy[0]+w], [xy[1]+h, xy[1]], color='#D0D0D0', lw=0.7)
    ax.text(xy[0]+w/2, xy[1]+h/2, label, ha='center', va='center', fontsize=7, color='#555555', backgroundcolor='white')

# =============================================================================
# 1. GAMBAR 4.17: MOCKUP HALAMAN LOGIN
# =============================================================================
def make_mockup_login():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_window_chrome(ax, "http://localhost:5173/#/login", "Login Administrator - Wireframe")

    # Split panel left: System identity wireframe box
    p_left = Rectangle((6, 8), 40, 78, fc='#FAFAFA', ec='#333333', lw=1.2)
    ax.add_patch(p_left)

    # Logo placeholder box
    draw_placeholder_box(ax, (16, 68), 20, 12, "[ Logo CSIRT ]")

    ax.text(26, 62, "SISTEM MONITORING DAN DETEKSI\nINDIKASI KONTEN NEGATIF", ha='center', va='center',
            fontsize=8.5, fontweight='bold', color='#111111')
    ax.text(26, 56, "Pemerintah Kabupaten Sumbawa", ha='center', va='center', fontsize=7.5, color='#444444')
    ax.plot([10, 42], [53, 53], color='#CCCCCC', lw=0.8)

    # Wireframe bullet feature list
    features = [
        "[ ] Web Crawling Terjadwal (BFS)",
        "[ ] Pattern Matching Aho-Corasick",
        "[ ] Deteksi Tautan & Defacement",
        "[ ] Notifikasi Email & Background Scan"
    ]
    for i, feat in enumerate(features):
        ax.text(10, 47 - i * 6.5, feat, fontsize=6.8, color='#333333')

    ax.text(26, 16, "[ Status Peladen: Aktif ]", ha='center', va='center', fontsize=6.5, color='#555555')
    ax.text(26, 12, "Diskominfo Kabupaten Sumbawa", ha='center', va='center', fontsize=6, color='#777777')

    # Split panel right: Login form wireframe box
    p_right = Rectangle((52, 8), 42, 78, fc='white', ec='#333333', lw=1.2)
    ax.add_patch(p_right)

    ax.text(73, 76, "Login Administrator", ha='center', va='center', fontsize=11, fontweight='bold', color='#111111')
    ax.text(73, 72, "Masukkan kredensial akun untuk mengakses sistem.", ha='center', va='center', fontsize=6.5, color='#666666')
    ax.plot([56, 90], [69, 69], color='#CCCCCC', lw=0.8)

    # Input fields
    draw_wireframe_input(ax, (56, 57), 34, 5.5, "Nama Pengguna (Username)", "[ input: admin ]")
    draw_wireframe_input(ax, (56, 44), 34, 5.5, "Kata Sandi (Password)", "[ input: **************** ]")

    # Checkbox
    ax.text(56, 39, "[x] Ingat sesi login administrator", fontsize=6.5, color='#333333')

    # Submit button
    draw_wireframe_button(ax, (56, 28), 34, 7, "Masuk ke Dashboard", is_primary=True)

    # Note
    ax.text(73, 20, "[ ! ] Akses terbatas hanya untuk petugas CSIRT.", ha='center', va='center', fontsize=6.2, color='#666666')
    ax.text(73, 14, "Protokol keamanan sesi aktif & audit log.", ha='center', va='center', fontsize=6, color='#888888')

    save_wireframe(fig, "gambar-4.17-mockup-halaman-login")

# =============================================================================
# 2. GAMBAR 4.18: MOCKUP DASHBOARD UTAMA
# =============================================================================
def make_mockup_dashboard():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_window_chrome(ax, "http://localhost:5173/#/ringkasan", "Dashboard Utama - Wireframe")
    draw_wireframe_sidebar(ax, active_item="Dashboard")
    draw_wireframe_topbar(ax, "Dashboard Ringkasan Pemantauan")

    # 4 Metric Summary Cards (Wireframe outline boxes)
    cards = [
        ("Target Website", "[ Total: 14 Situs ]", 25),
        ("Total Pemindaian", "[ Total: [X] Scan ]", 43),
        ("Halaman Normal", "[ [Y] Halaman ]", 61),
        ("Halaman Terindikasi", "[ [Z] Temuan ]", 79)
    ]
    for lbl, val, x in cards:
        box = Rectangle((x, 70), 17, 11, fc='white', ec='#333333', lw=1.0)
        ax.add_patch(box)
        ax.text(x+8.5, 78, lbl, ha='center', va='center', fontsize=6.5, color='#555555')
        ax.text(x+8.5, 73.5, val, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#111111')

    # Middle row Left: Weekly Scan Activity Chart Placeholder
    c_chart = Rectangle((25, 27), 41, 39, fc='white', ec='#333333', lw=1.0)
    ax.add_patch(c_chart)
    ax.text(27, 63, "Aktivitas Pemindaian 7 Hari Terakhir", fontsize=7.5, fontweight='bold', color='#111111')

    # Wireframe bar chart sketch
    days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    for i, d in enumerate(days):
        bx = 28 + i * 5.4
        by = 35
        bh = 10 + (i % 3) * 6
        b_bar = Rectangle((bx, by), 3.5, bh, fc='#EEEEEE', ec='#333333', lw=1.0)
        ax.add_patch(b_bar)
        ax.text(bx+1.75, 32, d, ha='center', va='center', fontsize=5.8, color='#444444')
        ax.text(bx+1.75, by+bh+1.5, "[n]", ha='center', va='center', fontsize=5.5, color='#666666')
    ax.plot([27, 64], [34.5, 34.5], color='#444444', lw=0.8)

    # Middle row Right: Category Breakdown Wireframe
    c_cat = Rectangle((68, 27), 29, 39, fc='white', ec='#333333', lw=1.0)
    ax.add_patch(c_cat)
    ax.text(70, 63, "Ringkasan Kategori Temuan", fontsize=7.5, fontweight='bold', color='#111111')

    categories = [
        ("Judi Online (Gambling)", 55, "[=====     ]"),
        ("Tautan Mencurigakan", 46, "[====      ]"),
        ("Penipuan (Phishing)", 37, "[==        ]"),
        ("Pornografi Teks", 28, "[=         ]")
    ]
    for cat_name, y, bar_sketch in categories:
        ax.text(70, y+2, cat_name, fontsize=6.5, color='#222222')
        ax.text(70, y-1.5, f"{bar_sketch} [..%]", fontsize=6, fontfamily='monospace', color='#555555')

    # Bottom Recent Scans Table Wireframe
    c_tab = Rectangle((25, 4), 72, 20, fc='white', ec='#333333', lw=1.0)
    ax.add_patch(c_tab)
    ax.text(27, 21.5, "Tabel Aktivitas Pemindaian Terbaru", fontsize=7.5, fontweight='bold', color='#111111')

    # Table Header
    hdr = Rectangle((26, 16.5), 70, 3.5, fc='#EEEEEE', ec='#444444', lw=0.8)
    ax.add_patch(hdr)
    ax.text(28, 18.25, "URL TARGET", fontsize=6, fontweight='bold', color='#222222')
    ax.text(56, 18.25, "WAKTU", fontsize=6, fontweight='bold', color='#222222')
    ax.text(70, 18.25, "HALAMAN", fontsize=6, fontweight='bold', color='#222222')
    ax.text(80, 18.25, "STATUS", fontsize=6, fontweight='bold', color='#222222')
    ax.text(91, 18.25, "AKSI", fontsize=6, fontweight='bold', color='#222222')

    rows = [
        ("https://sumbawakab.go.id", "[DD/MM HH:mm]", "[X] hal", "Selesai (Bersih)", 12),
        ("https://esamsatkotasumbawa.org", "[DD/MM HH:mm]", "[Y] hal", "Terindikasi", 6.5)
    ]
    for url, wkt, hal, stat, y in rows:
        ax.plot([26, 96], [y+3.8, y+3.8], color='#CCCCCC', lw=0.6)
        ax.text(28, y+1.5, url, fontsize=6, fontfamily='monospace', color='#111111')
        ax.text(56, y+1.5, wkt, fontsize=6, color='#555555')
        ax.text(70, y+1.5, hal, fontsize=6, color='#555555')
        ax.text(80, y+1.5, f"[{stat}]", fontsize=5.8, color='#222222')
        ax.text(91, y+1.5, "[ Detail ]", fontsize=5.8, color='#111111')

    save_wireframe(fig, "gambar-4.18-mockup-dashboard-utama")

# =============================================================================
# 3. GAMBAR 4.19: MOCKUP HALAMAN PEMINDAIAN WEBSITE
# =============================================================================
def make_mockup_scan_page():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_window_chrome(ax, "http://localhost:5173/#/pemeriksaan", "Form Pemindaian - Wireframe")
    draw_wireframe_sidebar(ax, active_item="Pemindaian")
    draw_wireframe_topbar(ax, "Konfigurasi Pemindaian Website")

    # Main Form Box
    card = Rectangle((25, 5), 72, 77, fc='white', ec='#333333', lw=1.2)
    ax.add_patch(card)

    ax.text(27, 78.5, "Formulir Pemeriksaan Konten Website", fontsize=8.5, fontweight='bold', color='#111111')
    ax.text(27, 75.5, "Konfigurasi parameter perayapan, modul deteksi, dan alamat email notifikasi.", fontsize=6.5, color='#666666')
    ax.plot([27, 95], [73.5, 73.5], color='#CCCCCC', lw=0.8)

    # 1. Target URL
    draw_wireframe_input(ax, (27, 65), 68, 5.5, "Alamat Website Target (URL) *", "[ https://target-website.sumbawakab.go.id/ ]")

    # 2 & 3. Max Pages & Max Depth
    draw_wireframe_input(ax, (27, 53), 32, 5.5, "Batas Halaman (maxPages)", "[ input: 10 ]")
    draw_wireframe_input(ax, (63, 53), 32, 5.5, "Batas Kedalaman (maxDepth)", "[ input: 2 ]")

    # 4. Officer Email (Fitur Utama)
    email_box = Rectangle((27, 35), 68, 14, fc='#F9F9F9', ec='#555555', lw=1.0, linestyle='--')
    ax.add_patch(email_box)
    ax.text(29, 46, "Alamat Email Petugas Pemrakarsa (Wajib untuk Notifikasi Mandiri) *", fontsize=6.8, fontweight='bold', color='#111111')
    inp_e = Rectangle((29, 39.5), 64, 4.8, fc='white', ec='#333333', lw=1.0)
    ax.add_patch(inp_e)
    ax.text(31, 41.9, "[ input: petugas.csirt@sumbawakab.go.id ]", fontsize=6.8, fontfamily='monospace', color='#222222')
    ax.text(29, 36.8, "* Hasil pemindaian hanya dikirim ke email petugas yang memulai pemindaian ini.", fontsize=5.8, color='#666666')

    # 5. Checkboxes Detector Modules
    ax.text(27, 30.5, "Pilihan Modul Detektor Aktif:", fontsize=6.8, fontweight='bold', color='#222222')
    ax.text(27, 26.5, "[x] Deteksi Teks Multi-Pola (Aho-Corasick)", fontsize=6.5, color='#222222')
    ax.text(54, 26.5, "[x] Deteksi Tautan Mencurigakan", fontsize=6.5, color='#222222')
    ax.text(78, 26.5, "[x] Deteksi Defacement", fontsize=6.5, color='#222222')

    # 6. Background Scan Information Box
    bg_box = Rectangle((27, 14), 68, 9, fc='#EEEEEE', ec='#666666', lw=0.9)
    ax.add_patch(bg_box)
    ax.text(29, 20.5, "[ ! ] Informasi Pemindaian Latar Belakang (Background Scanning):", fontsize=6.5, fontweight='bold', color='#111111')
    ax.text(29, 16.5, "Setelah menekan tombol 'Mulai', petugas diizinkan menutup peramban atau mematikan laptop.\nSistem tetap memproses perayapan dan otomatis mengirimkan laporan lengkap ke email petugas.", fontsize=5.8, color='#444444')

    # 7. Action Buttons
    draw_wireframe_button(ax, (27, 7), 30, 5.5, "Mulai Pemindaian (Scan)", is_primary=True)
    draw_wireframe_button(ax, (59, 7), 18, 5.5, "Batal", is_primary=False)

    save_wireframe(fig, "gambar-4.19-mockup-pemindaian-website")

# =============================================================================
# 4. GAMBAR 4.20: MOCKUP HALAMAN RIWAYAT PEMINDAIAN
# =============================================================================
def make_mockup_history():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_window_chrome(ax, "http://localhost:5173/#/riwayat", "Riwayat Pemindaian - Wireframe")
    draw_wireframe_sidebar(ax, active_item="Riwayat")
    draw_wireframe_topbar(ax, "Riwayat Pemindaian Website")

    # Filter toolbar box
    f_box = Rectangle((25, 72), 72, 10, fc='white', ec='#333333', lw=1.0)
    ax.add_patch(f_box)
    ax.text(27, 78.5, "Filter & Pencarian Riwayat:", fontsize=6.8, fontweight='bold', color='#222222')

    # Filter inputs
    draw_wireframe_input(ax, (27, 73.5), 26, 4.2, "", "[ input: cari URL / petugas... ]")
    draw_wireframe_input(ax, (55, 73.5), 18, 4.2, "", "[ Status: Semua v ]")
    draw_wireframe_button(ax, (75, 73.5), 10, 4.2, "Filter", is_primary=True)
    draw_wireframe_button(ax, (86, 73.5), 9, 4.2, "Reset", is_primary=False)

    # Main Table Box
    t_box = Rectangle((25, 6), 72, 64, fc='white', ec='#333333', lw=1.2)
    ax.add_patch(t_box)

    # Table Header
    hdr = Rectangle((26, 64), 70, 4.2, fc='#EEEEEE', ec='#333333', lw=0.9)
    ax.add_patch(hdr)
    ax.text(27, 66.1, "ID", fontsize=6, fontweight='bold', color='#111111')
    ax.text(32, 66.1, "URL WEBSITE", fontsize=6, fontweight='bold', color='#111111')
    ax.text(54, 66.1, "EMAIL PETUGAS", fontsize=6, fontweight='bold', color='#111111')
    ax.text(71, 66.1, "WAKTU", fontsize=6, fontweight='bold', color='#111111')
    ax.text(80, 66.1, "STATUS", fontsize=6, fontweight='bold', color='#111111')
    ax.text(89, 66.1, "TEMUAN", fontsize=6, fontweight='bold', color='#111111')
    ax.text(94, 66.1, "AKSI", fontsize=6, fontweight='bold', color='#111111')

    rows = [
        ("#105", "https://sumbawakab.go.id", "petugas1@email.com", "DD/MM HH:mm", "[Selesai]", "0", "[Detail]", 56),
        ("#104", "https://esamsatkotasumbawa.org", "petugas2@email.com", "DD/MM HH:mm", "[Terindikasi]", "1 link", "[Detail]", 48),
        ("#103", "https://bappeda.sumbawakab.go.id", "petugas1@email.com", "DD/MM HH:mm", "[Gagal-WAF]", "-", "[Detail]", 40),
        ("#102", "https://uts.ac.id/en/welcome", "petugas3@email.com", "DD/MM HH:mm", "[Selesai]", "0", "[Detail]", 32),
        ("#101", "https://disketapang.sumbawakab.go.id", "petugas2@email.com", "DD/MM HH:mm", "[Selesai]", "0", "[Detail]", 24),
        ("#100", "http://127.0.0.1:8080/positive-01", "petugas1@email.com", "DD/MM HH:mm", "[Terindikasi]", "3 kata", "[Detail]", 16)
    ]
    for sid, url, pet, wkt, stat, ind, act, y in rows:
        ax.plot([26, 96], [y+5.5, y+5.5], color='#CCCCCC', lw=0.6)
        ax.text(27, y+2, sid, fontsize=5.8, color='#555555')
        ax.text(32, y+2, url, fontsize=5.8, fontfamily='monospace', color='#111111')
        ax.text(54, y+2, pet, fontsize=5.5, color='#444444')
        ax.text(71, y+2, wkt, fontsize=5.5, color='#555555')
        ax.text(80, y+2, stat, fontsize=5.5, fontweight='bold' if 'Terindikasi' in stat else 'normal', color='#111111')
        ax.text(89, y+2, ind, fontsize=5.5, color='#222222')
        ax.text(94, y+2, act, fontsize=5.5, color='#111111')

    # Pagination footer
    ax.plot([26, 96], [12, 12], color='#CCCCCC', lw=0.8)
    ax.text(27, 9, "Menampilkan 1 - 6 dari [Total] data riwayat", fontsize=6, color='#666666')
    ax.text(85, 9, "[<<] [ 1 ] [ 2 ] [ 3 ] [>>]", fontsize=6, color='#222222')

    save_wireframe(fig, "gambar-4.20-mockup-riwayat-pemindaian")

# =============================================================================
# 5. GAMBAR 4.21: MOCKUP HALAMAN DETAIL HASIL PEMINDAIAN
# =============================================================================
def make_mockup_scan_detail():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_window_chrome(ax, "http://localhost:5173/#/hasil/detail/105", "Detail Hasil Pemindaian - Wireframe")
    draw_wireframe_sidebar(ax, active_item="Hasil Terbaru")
    draw_wireframe_topbar(ax, "Detail Hasil Pemindaian Website")

    # Action bar
    ax.text(26, 81.5, "[ <- Kembali ke Riwayat ]", fontsize=6.5, color='#222222')
    draw_wireframe_button(ax, (68, 79.5), 14, 4.2, "Unduh PDF", is_primary=False)
    draw_wireframe_button(ax, (83, 79.5), 13, 4.2, "Ekspor CSV", is_primary=False)

    # Email sent notice wireframe banner
    mail_b = Rectangle((25, 73), 72, 5.5, fc='#EEEEEE', ec='#444444', lw=0.9)
    ax.add_patch(mail_b)
    ax.text(27, 75.75, "[ Email Sent ] Laporan hasil dikirim ke: [email.petugas@domain.com] (ID: <msg-id@host>)", fontsize=6.2, fontfamily='monospace', color='#111111')

    # Summary Info Card
    c_info = Rectangle((25, 46), 72, 25, fc='white', ec='#333333', lw=1.0)
    ax.add_patch(c_info)
    ax.text(27, 67.5, "Informasi Pelaksanaan Pemindaian", fontsize=7.5, fontweight='bold', color='#111111')

    details = [
        ("Nama Website", ": [ Nama Website Target ]", 27, 63),
        ("URL Target", ": [ https://target-website.sumbawakab.go.id/ ]", 27, 59.5),
        ("Email Petugas", ": [ email.petugas@sumbawakab.go.id ]", 27, 56),
        ("Status Pemindaian", ": [ SELESAI (BERSIH / TERINDIKASI) ]", 27, 52.5),
        ("Waktu Mulai", ": [ DD/MM/YYYY HH:mm:ss ]", 62, 63),
        ("Waktu Selesai", ": [ DD/MM/YYYY HH:mm:ss ]", 62, 59.5),
        ("Total Halaman", ": [ X Halaman Diperiksa ]", 62, 56),
        ("Jumlah Indikasi", ": [ Y Indikasi Ditemukan ]", 62, 52.5)
    ]
    for lbl, val, x, y in details:
        ax.text(x, y, lbl, fontsize=6.2, color='#555555')
        ax.text(x + 14, y, val, fontsize=6.2, fontweight='bold' if 'Status' in lbl else 'normal', color='#111111')

    # Tab selectors for detector details
    ax.plot([25, 97], [43, 43], color='#CCCCCC', lw=0.8)
    tabs = [
        ("[x] Ringkasan Halaman", 27),
        ("[ ] Deteksi Teks", 48),
        ("[ ] Deteksi Tautan", 65),
        ("[ ] Defacement", 82)
    ]
    for t_lbl, x in tabs:
        ax.text(x, 44.5, t_lbl, fontsize=6.5, fontweight='bold' if '[x]' in t_lbl else 'normal', color='#111111')

    # Scanned pages table
    t_pages = Rectangle((25, 5), 72, 36, fc='white', ec='#333333', lw=1.0)
    ax.add_patch(t_pages)

    hdr = Rectangle((26, 36), 70, 4, fc='#EEEEEE', ec='#444444', lw=0.8)
    ax.add_patch(hdr)
    ax.text(28, 38, "KEDALAMAN", fontsize=6, fontweight='bold', color='#222222')
    ax.text(42, 38, "URL HALAMAN DIPERIKSA", fontsize=6, fontweight='bold', color='#222222')
    ax.text(72, 38, "STATUS HTTP", fontsize=6, fontweight='bold', color='#222222')
    ax.text(83, 38, "HASIL DETEKTOR", fontsize=6, fontweight='bold', color='#222222')

    p_rows = [
        ("Depth 0", "https://website.go.id/", "200 OK", "Teks: [x] | Link: [-] | Deface: [-]", 30),
        ("Depth 1", "https://website.go.id/profil", "200 OK", "Teks: [-] | Link: [-] | Deface: [-]", 23),
        ("Depth 1", "https://website.go.id/layanan", "200 OK", "Teks: [-] | Link: [-] | Deface: [-]", 16),
        ("Depth 2", "https://website.go.id/berita/1", "200 OK", "Teks: [-] | Link: [-] | Deface: [-]", 9)
    ]
    for d, u, st, det, y in p_rows:
        ax.plot([26, 96], [y+5, y+5], color='#CCCCCC', lw=0.5)
        ax.text(28, y+1.8, d, fontsize=5.8, color='#555555')
        ax.text(42, y+1.8, u, fontsize=5.8, fontfamily='monospace', color='#111111')
        ax.text(72, y+1.8, st, fontsize=5.8, color='#222222')
        ax.text(83, y+1.8, det, fontsize=5.5, color='#444444')

    save_wireframe(fig, "gambar-4.21-mockup-detail-hasil-pemindaian")

# =============================================================================
# 6. GAMBAR 4.22: MOCKUP HALAMAN DETEKSI KONTEN NEGATIF
# =============================================================================
def make_mockup_text_detection():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_window_chrome(ax, "http://localhost:5173/#/hasil/teks/105", "Deteksi Teks Konten Negatif - Wireframe")
    draw_wireframe_sidebar(ax, active_item="Hasil Terbaru")
    draw_wireframe_topbar(ax, "Hasil Deteksi Konten Negatif (Teks)")

    # Overview Alert Box
    alert_box = Rectangle((25, 71), 72, 10, fc='#EEEEEE', ec='#333333', lw=1.0)
    ax.add_patch(alert_box)
    ax.text(27, 77.5, "[ ! ] INDIKASI KONTEN NEGATIF DITEMUKAN", fontsize=7.5, fontweight='bold', color='#111111')
    ax.text(27, 74, "Ditemukan [N] kata kunci yang cocok dengan kamus pola Aho-Corasick pada teks dokumen.", fontsize=6.2, color='#444444')

    # Main Findings Table Box
    c_tab = Rectangle((25, 14), 72, 54, fc='white', ec='#333333', lw=1.2)
    ax.add_patch(c_tab)
    ax.text(27, 64, "Daftar Kata Kunci Cocok & Snippet Kalimat Bukti", fontsize=7.5, fontweight='bold', color='#111111')

    # Table Header
    hdr = Rectangle((26, 58), 70, 4, fc='#EEEEEE', ec='#444444', lw=0.8)
    ax.add_patch(hdr)
    ax.text(28, 60.1, "KATA KUNCI", fontsize=6, fontweight='bold', color='#111111')
    ax.text(43, 60.1, "KATEGORI", fontsize=6, fontweight='bold', color='#111111')
    ax.text(56, 60.1, "BOBOT", fontsize=6, fontweight='bold', color='#111111')
    ax.text(66, 60.1, "CUPLIKAN SNIPPET BUKTI", fontsize=6, fontweight='bold', color='#111111')

    findings = [
        ("slot gacor", "Judi Online", "0.95", "...daftar sekarang di situs [slot gacor] resmi...", 50),
        ("maxwin", "Judi Online", "0.85", "...garansi perkalian [maxwin] hingga 500x live...", 42),
        ("deposit pulsa", "Judi Online", "0.75", "...layanan [deposit pulsa] tanpa potongan 24 jam...", 34),
        ("verifikasi rek", "Penipuan", "0.80", "...segera lakukan [verifikasi rekening] hadiah...", 26),
        ("[kata sensor]", "Pornografi", "0.90", "...konten dewasa [istilah sensor] terdeteksi...", 18)
    ]
    for kw, cat, w, snip, y in findings:
        ax.plot([26, 96], [y+6, y+6], color='#CCCCCC', lw=0.6)
        ax.text(28, y+2, f"[{kw}]", fontsize=6, fontweight='bold', color='#111111')
        ax.text(43, y+2, cat, fontsize=6, color='#333333')
        ax.text(56, y+2, w, fontsize=6, color='#555555')
        ax.text(66, y+2, snip, fontsize=5.8, fontfamily='monospace', color='#222222')

    # Actions Toolbar Bottom
    b_box = Rectangle((25, 4), 72, 8, fc='#FAFAFA', ec='#444444', lw=0.8)
    ax.add_patch(b_box)
    ax.text(27, 8, "Tindakan:", fontsize=6.5, fontweight='bold', color='#222222')
    draw_wireframe_button(ax, (36, 5.5), 18, 5, "Salin Bukti", is_primary=False)
    draw_wireframe_button(ax, (56, 5.5), 18, 5, "Verifikasi", is_primary=True)
    draw_wireframe_button(ax, (76, 5.5), 19, 5, "Eskalasi CSIRT", is_primary=False)

    save_wireframe(fig, "gambar-4.22-mockup-deteksi-konten-negatif")

# =============================================================================
# 7. GAMBAR 4.23: MOCKUP HALAMAN DETEKSI TAUTAN MENCURIGAKAN
# =============================================================================
def make_mockup_link_detection():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_window_chrome(ax, "http://localhost:5173/#/hasil/tautan/105", "Deteksi Tautan Mencurigakan - Wireframe")
    draw_wireframe_sidebar(ax, active_item="Hasil Terbaru")
    draw_wireframe_topbar(ax, "Hasil Deteksi Tautan Mencurigakan")

    # Overview Stats Box
    stat_box = Rectangle((25, 71), 72, 10, fc='#EEEEEE', ec='#333333', lw=1.0)
    ax.add_patch(stat_box)
    ax.text(27, 77.5, "Ringkasan Pemeriksaan Hyperlink:", fontsize=7.2, fontweight='bold', color='#111111')
    ax.text(27, 74, "Total Tautan: [X] | Internal: [Y] | Outbound (Luar): [Z] | Tautan Anomali: [N]", fontsize=6.2, fontfamily='monospace', color='#333333')

    # Table Box
    c_tab = Rectangle((25, 17), 72, 51, fc='white', ec='#333333', lw=1.2)
    ax.add_patch(c_tab)
    ax.text(27, 64.5, "Tabel Evaluasi Tautan Outbound & Atribut Tersembunyi", fontsize=7.5, fontweight='bold', color='#111111')

    # Table Header
    hdr = Rectangle((26, 58.5), 70, 4, fc='#EEEEEE', ec='#444444', lw=0.8)
    ax.add_patch(hdr)
    ax.text(28, 60.5, "TEKS JANGKAR", fontsize=6, fontweight='bold', color='#111111')
    ax.text(44, 60.5, "URL TUJUAN (DESTINATION)", fontsize=6, fontweight='bold', color='#111111')
    ax.text(70, 60.5, "ATRIBUT CSS", fontsize=6, fontweight='bold', color='#111111')
    ax.text(86, 60.5, "STATUS RISIKO", fontsize=6, fontweight='bold', color='#111111')

    links = [
        ("slot gacor", "https://lakegardamountainrace.com", "style='display: none;'", "[Berisiko Tinggi]", 50),
        ("daftar akun", "http://login-member88.top/ref", "visibility: hidden;", "[Berisiko Tinggi]", 41),
        ("official link", "https://agenmaxwin.xyz/promo", "font-size: 0px;", "[Mencurigakan]", 32),
        ("Portal NTB", "https://ntbprov.go.id", "normal", "[Aman / Lolos]", 23)
    ]
    for anc, dst, css, rsk, y in links:
        ax.plot([26, 96], [y+7, y+7], color='#CCCCCC', lw=0.6)
        ax.text(28, y+2.5, anc, fontsize=6, color='#111111')
        ax.text(44, y+2.5, dst, fontsize=5.8, fontfamily='monospace', color='#222222')
        ax.text(70, y+2.5, css, fontsize=5.8, fontfamily='monospace', color='#444444')
        ax.text(86, y+2.5, rsk, fontsize=5.8, fontweight='bold' if 'Berisiko' in rsk else 'normal', color='#111111')

    # Explanation note at bottom
    exp_box = Rectangle((25, 4), 72, 11, fc='#FAFAFA', ec='#555555', lw=0.9, linestyle='--')
    ax.add_patch(exp_box)
    ax.text(27, 11.5, "Catatan Forensik Tautan Injeksi:", fontsize=6.5, fontweight='bold', color='#222222')
    ax.text(27, 8, "Teknik penyembunyian tautan (display:none) sering digunakan peretas untuk menyusupkan backlink\nilegal ke situs judi tanpa terlihat oleh pembaca resmi instansi pemerintah.", fontsize=5.8, color='#555555')

    save_wireframe(fig, "gambar-4.23-mockup-deteksi-tautan-mencurigakan")

# =============================================================================
# 8. GAMBAR 4.24: MOCKUP HALAMAN DETEKSI DEFACEMENT
# =============================================================================
def make_mockup_defacement():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_window_chrome(ax, "http://localhost:5173/#/hasil/defacement/105", "Deteksi Defacement - Wireframe")
    draw_wireframe_sidebar(ax, active_item="Hasil Terbaru")
    draw_wireframe_topbar(ax, "Hasil Deteksi Perubahan Halaman (Defacement)")

    # Comparison Grid Boxes (Left: Baseline, Right: Current)
    b_left = Rectangle((25, 63), 35, 18, fc='white', ec='#333333', lw=1.0)
    b_right = Rectangle((62, 63), 35, 18, fc='#EEEEEE', ec='#333333', lw=1.2)
    ax.add_patch(b_left); ax.add_patch(b_right)

    ax.text(27, 77.5, "Data Baseline Tersimpan:", fontsize=7, fontweight='bold', color='#111111')
    ax.text(27, 73.5, "Hash SHA-256: [ 7f83b165... ]", fontsize=6, fontfamily='monospace', color='#444444')
    ax.text(27, 69.5, "Waktu Baseline: [ Tanggal Baseline ]", fontsize=6, color='#555555')
    ax.text(27, 65.5, "Status Judul: [ Judul Asli OPD ]", fontsize=6, color='#555555')

    ax.text(64, 77.5, "Dokumen Pemindaian Saat Ini:", fontsize=7, fontweight='bold', color='#111111')
    ax.text(64, 73.5, "Hash SHA-256: [ a4c28e91... ]", fontsize=6, fontfamily='monospace', color='#111111')
    ax.text(64, 69.5, "Status Komparasi: [ HASH BERBEDA ]", fontsize=6, fontweight='bold', color='#111111')
    ax.text(64, 65.5, "Indikasi: [ PERUBAHAN ANOMALI ]", fontsize=6, fontweight='bold', color='#111111')

    # Structural Diff Table
    c_tab = Rectangle((25, 6), 72, 54, fc='white', ec='#333333', lw=1.2)
    ax.add_patch(c_tab)
    ax.text(27, 56.5, "Komparasi Struktur DOM & Elemen Dokumen Web", fontsize=7.5, fontweight='bold', color='#111111')

    # Table Header
    hdr = Rectangle((26, 50.5), 70, 4, fc='#EEEEEE', ec='#444444', lw=0.8)
    ax.add_patch(hdr)
    ax.text(28, 52.5, "ELEMEN", fontsize=6, fontweight='bold', color='#111111')
    ax.text(40, 52.5, "KONDISI BASELINE", fontsize=6, fontweight='bold', color='#111111')
    ax.text(64, 52.5, "KONDISI SAAT INI", fontsize=6, fontweight='bold', color='#111111')
    ax.text(88, 52.5, "STATUS", fontsize=6, fontweight='bold', color='#111111')

    diffs = [
        ("Tag <title>", "\"Portal Resmi Dinas Sumbawa\"", "\"Hacked by AnonSec\"", "[Berubah]", 42),
        ("Tag <header>", "<header class='gov'> Navigasi", "[Dihapus / Hilang]", "[Anomali]", 33),
        ("Tag <body>", "Layanan Publik & Berita Pemda", "Teks & Gambar Defacement", "[Berubah]", 24),
        ("Skrip Eksternal", "Skrip resmi bawaan CMS", "<script src='http://.../x.js'>", "[Injeksi]", 15)
    ]
    for el, base, curr, st, y in diffs:
        ax.plot([26, 96], [y+7, y+7], color='#CCCCCC', lw=0.6)
        ax.text(28, y+2.5, el, fontsize=6, color='#111111')
        ax.text(40, y+2.5, base, fontsize=5.8, color='#555555')
        ax.text(64, y+2.5, curr, fontsize=5.8, fontfamily='monospace', color='#111111')
        ax.text(88, y+2.5, st, fontsize=5.8, fontweight='bold', color='#111111')

    save_wireframe(fig, "gambar-4.24-mockup-deteksi-defacement")

# =============================================================================
# 9. GAMBAR 4.25: MOCKUP HALAMAN PENGELOLAAN BASELINE
# =============================================================================
def make_mockup_baseline():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_window_chrome(ax, "http://localhost:5173/#/situs", "Pengelolaan Baseline & Situs - Wireframe")
    draw_wireframe_sidebar(ax, active_item="Manajemen Situs")
    draw_wireframe_topbar(ax, "Pengelolaan Baseline dan Target Website")

    # Action Toolbar
    draw_wireframe_button(ax, (25, 78), 24, 4.5, "+ Tambah Target Website", is_primary=True)
    draw_wireframe_button(ax, (51, 78), 24, 4.5, "Perbarui Seluruh Baseline", is_primary=False)

    # Main Table Box
    c_tab = Rectangle((25, 8), 72, 67, fc='white', ec='#333333', lw=1.2)
    ax.add_patch(c_tab)
    ax.text(27, 71.5, "Daftar Website Resmi & Status Baseline", fontsize=7.5, fontweight='bold', color='#111111')

    # Table Header
    hdr = Rectangle((26, 65.5), 70, 4.2, fc='#EEEEEE', ec='#444444', lw=0.9)
    ax.add_patch(hdr)
    ax.text(28, 67.5, "NO", fontsize=6, fontweight='bold', color='#111111')
    ax.text(32, 67.5, "NAMA INSTANSI / OPD", fontsize=6, fontweight='bold', color='#111111')
    ax.text(55, 67.5, "URL TARGET", fontsize=6, fontweight='bold', color='#111111')
    ax.text(75, 67.5, "AKSES", fontsize=6, fontweight='bold', color='#111111')
    ax.text(82, 67.5, "HASH BASELINE", fontsize=6, fontweight='bold', color='#111111')
    ax.text(92, 67.5, "AKSI", fontsize=6, fontweight='bold', color='#111111')

    sites = [
        ("1", "Portal Resmi Pemkab", "https://sumbawakab.go.id", "[403-WAF]", "sha256:7f83b1...", "[Pindai] [Edit]", 57),
        ("2", "Bappeda Sumbawa", "https://bappeda.sumbawakab.go.id", "[403-WAF]", "sha256:8a1b2c...", "[Pindai] [Edit]", 48),
        ("3", "KPU Kabupaten Sumbawa", "https://kpu.go.id/sumbawa", "[200-OK]", "sha256:3c4d5e...", "[Pindai] [Edit]", 39),
        ("4", "E-Samsat Kota Sumbawa", "https://esamsatkotasumbawa.org", "[200-OK]", "sha256:9f0a1b...", "[Pindai] [Edit]", 30),
        ("5", "Univ. Teknologi Sumbawa", "https://uts.ac.id/en/welcome", "[200-OK]", "sha256:2d3e4f...", "[Pindai] [Edit]", 21),
        ("6", "Disketapang Sumbawa", "https://disketapang.sumbawakab...", "[200-OK]", "sha256:5e6f7a...", "[Pindai] [Edit]", 12)
    ]
    for no, inst, url, st, hsh, act, y in sites:
        ax.plot([26, 96], [y+6.5, y+6.5], color='#CCCCCC', lw=0.6)
        ax.text(28, y+2, no, fontsize=5.8, color='#555555')
        ax.text(32, y+2, inst, fontsize=5.8, color='#111111')
        ax.text(55, y+2, url, fontsize=5.5, fontfamily='monospace', color='#222222')
        ax.text(75, y+2, st, fontsize=5.5, color='#444444')
        ax.text(82, y+2, hsh, fontsize=5.2, fontfamily='monospace', color='#555555')
        ax.text(92, y+2, act, fontsize=5.2, color='#111111')

    save_wireframe(fig, "gambar-4.25-mockup-pengelolaan-baseline")

# =============================================================================
# 10. GAMBAR 4.26: MOCKUP HALAMAN NOTIFIKASI EMAIL
# =============================================================================
def make_mockup_notification():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    draw_window_chrome(ax, "https://mail.sumbawakab.go.id/inbox/msg-105", "Notifikasi Email Petugas - Wireframe")

    # Email Container Wireframe Box
    mail_card = Rectangle((8, 4), 84, 86, fc='white', ec='#333333', lw=1.2)
    ax.add_patch(mail_card)

    # Email header metadata
    ax.text(12, 85, "Subjek: [PERINGATAN] Indikasi Konten Negatif Terdeteksi: [Nama Website]", fontsize=8.5, fontweight='bold', color='#111111')
    ax.text(12, 81.5, "Dari: Sistem Pemantauan Konten Sumbawa <notifikasi@sumbawakab.go.id>", fontsize=6.8, color='#444444')
    ax.text(12, 78.5, "Kepada: [email.petugas@domain.com] (Petugas Pemrakarsa Pemindaian)", fontsize=6.8, fontweight='bold', color='#111111')
    ax.text(12, 75.5, "Waktu: [Hari, DD Bulan YYYY HH:mm WITA]", fontsize=6.5, color='#666666')
    ax.plot([12, 88], [73.5, 73.5], color='#444444', lw=1.0)

    # Email Body Content - Alert Wireframe Banner
    ebanner = Rectangle((12, 63), 76, 8.5, fc='#EEEEEE', ec='#333333', lw=1.0)
    ax.add_patch(ebanner)
    ax.text(14, 68.5, "[ ! ] PERINGATAN DINI CSIRT KABUPATEN SUMBAWA", fontsize=7.5, fontweight='bold', color='#111111')
    ax.text(14, 65, "Sistem mendeteksi indikasi pola konten negatif pada situs yang Anda periksa.", fontsize=6.2, color='#333333')

    # Summary Details Table inside email
    ax.text(12, 58.5, "Rincian Pelaksanaan Pemindaian:", fontsize=7.2, fontweight='bold', color='#111111')

    edetails = [
        ("Nama Website", ": [ Portal Resmi Instansi ]"),
        ("URL Target", ": [ https://website-target.sumbawakab.go.id/ ]"),
        ("Email Petugas", ": [ email.petugas@domain.com ]"),
        ("Waktu Mulai", ": [ Waktu Mulai Pemindaian ]"),
        ("Waktu Selesai", ": [ Waktu Selesai Pemindaian ]"),
        ("Metode", ": Pemeriksaan Mandiri Petugas (Background Scanning)"),
        ("Halaman Diperiksa", ": [X] Halaman"),
        ("Jumlah Indikasi", ": [N] Indikasi Ditemukan"),
        ("Status Pemindaian", ": [ SELESAI DENGAN INDIKASI ]")
    ]
    for i, (k, v) in enumerate(edetails):
        y = 53.5 - i * 3.4
        ax.text(14, y, k, fontsize=6.2, color='#555555')
        ax.text(36, y, v, fontsize=6.2, fontweight='bold' if 'Status' in k or 'Indikasi' in k else 'normal', color='#111111')

    # Action Button in email
    draw_wireframe_button(ax, (28, 17), 44, 5.5, "Buka Dashboard untuk Rincian Forensik Lengkap", is_primary=True)

    ax.text(50, 11, "Surel ini dikirimkan otomatis oleh Sistem Pemantauan Konten Negatif Diskominfo Sumbawa.", ha='center', va='center', fontsize=5.8, color='#777777')
    ax.text(50, 7.5, "Jejak audit transmisi tersimpan di peladen.", ha='center', va='center', fontsize=5.5, color='#999999')

    save_wireframe(fig, "gambar-4.26-mockup-notifikasi-email")

if __name__ == '__main__':
    print("Generating 10 Balsamiq-Style Low-Fidelity Wireframe Mockups...")
    make_mockup_login()
    make_mockup_dashboard()
    make_mockup_scan_page()
    make_mockup_history()
    make_mockup_scan_detail()
    make_mockup_text_detection()
    make_mockup_link_detection()
    make_mockup_defacement()
    make_mockup_baseline()
    make_mockup_notification()
    print("ALL 10 BALSAMIQ WIREFRAME MOCKUPS SUCCESSFULLY GENERATED!")
