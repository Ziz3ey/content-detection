# -*- coding: utf-8 -*-
"""
Script to generate formal academic black-and-white diagrams matching draw.io style
and user's uploaded reference images:
- Pure black and white / grayscale.
- Zero decorative colors (no blue, green, red, orange, yellow).
- Crisp 300 DPI PNG and editable SVG.
- Standard UML shapes: stick figures, ovals, swimlanes, activation bars, cylinders, decision diamonds.
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon
from matplotlib.lines import Line2D

BASE_DIR = r'D:\content detection\docs\bab-iv\diagrams'

def save_fig(fig, rel_path, dpi=300):
    full_png = os.path.join(BASE_DIR, f"{rel_path}.png")
    full_svg = os.path.join(BASE_DIR, f"{rel_path}.svg")
    os.makedirs(os.path.dirname(full_png), exist_ok=True)
    fig.savefig(full_png, dpi=dpi, bbox_inches='tight', facecolor='white', edgecolor='none')
    fig.savefig(full_svg, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close(fig)
    print(f"Generated diagram: {rel_path} (.png & .svg)")

# -----------------------------------------------------------------------------
# DRAWING HELPERS FOR DRAW.IO FORMAL ACADEMIC STYLE
# -----------------------------------------------------------------------------
def draw_actor(ax, xy, label, scale=1.0):
    x, y = xy
    # Head
    c = Circle((x, y + 4*scale), 2.2*scale, fc='white', ec='black', lw=1.3)
    ax.add_patch(c)
    # Body
    ax.plot([x, x], [y + 1.8*scale, y - 3.5*scale], color='black', lw=1.4)
    # Arms
    ax.plot([x - 3.2*scale, x + 3.2*scale], [y - 0.2*scale, y - 0.2*scale], color='black', lw=1.4)
    # Legs
    ax.plot([x, x - 2.8*scale], [y - 3.5*scale, y - 8.5*scale], color='black', lw=1.4)
    ax.plot([x, x + 2.8*scale], [y - 3.5*scale, y - 8.5*scale], color='black', lw=1.4)
    # Label
    ax.text(x, y - 11.5*scale, label, ha='center', va='top', fontsize=8, color='black', fontfamily='Arial')

def draw_usecase_oval(ax, xy, w, h, text):
    el = patches.Ellipse(xy, w, h, fc='white', ec='black', lw=1.2)
    ax.add_patch(el)
    ax.text(xy[0], xy[1], text, ha='center', va='center', fontsize=7.5, color='black', fontfamily='Arial')

def draw_swimlanes(ax, lanes, top_y=95, bot_y=5, start_x=5, total_w=90):
    lane_w = total_w / len(lanes)
    # Outer frame
    frame = Rectangle((start_x, bot_y), total_w, top_y - bot_y, fc='none', ec='black', lw=1.3)
    ax.add_patch(frame)
    # Header bar
    hbar = Rectangle((start_x, top_y - 6), total_w, 6, fc='#F0F0F0', ec='black', lw=1.2)
    ax.add_patch(hbar)

    for i, lane_title in enumerate(lanes):
        lx = start_x + i * lane_w
        if i > 0:
            ax.plot([lx, lx], [bot_y, top_y], color='black', lw=1.1)
        ax.text(lx + lane_w/2, top_y - 3, lane_title, ha='center', va='center',
                fontsize=9, fontweight='bold', color='black', fontfamily='Arial')
    return lane_w

def draw_act_box(ax, xy, w, h, text, fs=7.5):
    bx = FancyBboxPatch((xy[0] - w/2, xy[1] - h/2), w, h, boxstyle="round,pad=0.2,rounding_size=1.5",
                        fc='white', ec='black', lw=1.2)
    ax.add_patch(bx)
    ax.text(xy[0], xy[1], text, ha='center', va='center', fontsize=fs, color='black', fontfamily='Arial')

def draw_decision_diamond(ax, xy, w, h, text="Valid?", fs=7.0):
    pts = [[xy[0], xy[1] + h/2], [xy[0] + w/2, xy[1]], [xy[0], xy[1] - h/2], [xy[0] - w/2, xy[1]]]
    poly = Polygon(pts, closed=True, fc='white', ec='black', lw=1.2)
    ax.add_patch(poly)
    ax.text(xy[0], xy[1], text, ha='center', va='center', fontsize=fs, color='black', fontfamily='Arial')

def draw_start_node(ax, xy, r=1.8):
    c = Circle(xy, r, fc='black', ec='black')
    ax.add_patch(c)

def draw_end_node(ax, xy, r=2.2):
    c1 = Circle(xy, r, fc='white', ec='black', lw=1.2)
    c2 = Circle(xy, r*0.6, fc='black', ec='black')
    ax.add_patch(c1); ax.add_patch(c2)

def draw_fork_bar(ax, p1, p2):
    ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color='black', lw=3.5)

def draw_arrow(ax, p1, p2, label=None, label_side='right'):
    ax.annotate('', xy=p2, xytext=p1,
                arrowprops=dict(arrowstyle="->", color='black', lw=1.2, shrinkA=1, shrinkB=1))
    if label:
        mx = (p1[0] + p2[0]) / 2
        my = (p1[1] + p2[1]) / 2
        offset_x = 1.8 if label_side == 'right' else -1.8
        ax.text(mx + offset_x, my, label, fontsize=6.8, color='black', fontfamily='Arial',
                ha='left' if label_side == 'right' else 'right', va='center', backgroundcolor='white')

def draw_orthogonal_arrow(ax, points, label=None, label_pos=None):
    for i in range(len(points)-1):
        if i == len(points)-2:
            ax.annotate('', xy=points[i+1], xytext=points[i],
                        arrowprops=dict(arrowstyle="->", color='black', lw=1.2, shrinkA=0, shrinkB=1))
        else:
            ax.plot([points[i][0], points[i+1][0]], [points[i][1], points[i+1][1]], color='black', lw=1.2)
    if label and label_pos:
        ax.text(label_pos[0], label_pos[1], label, fontsize=6.8, color='black', fontfamily='Arial',
                ha='center', va='center', backgroundcolor='white')

def draw_cylinder(ax, xy, w, h, text):
    x, y = xy
    rect = Rectangle((x - w/2, y - h/2 + h*0.15), w, h*0.7, fc='white', ec='black', lw=1.2)
    ax.add_patch(rect)
    el_top = patches.Ellipse((x, y + h/2 - h*0.15), w, h*0.3, fc='white', ec='black', lw=1.2)
    ax.add_patch(el_top)
    el_bot = patches.Arc((x, y - h/2 + h*0.15), w, h*0.3, theta1=180, theta2=360, color='black', lw=1.2)
    ax.add_patch(el_bot)
    ax.text(x, y - 0.5, text, ha='center', va='center', fontsize=7.2, color='black', fontfamily='Arial')

# =============================================================================
# 1. GAMBAR 4.1: ARSITEKTUR SISTEM MICROSERVICES (DRAW.IO B&W)
# =============================================================================
def make_architecture_diagram():
    fig, ax = plt.subplots(figsize=(10, 7.5))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')

    # Title box at top
    ax.text(50, 97, "Arsitektur Sistem Monitoring dan Deteksi Konten Negatif (Microservices)",
            ha='center', va='center', fontsize=11, fontweight='bold', color='black', fontfamily='Arial')

    # Presentation Layer (Left)
    pres_box = Rectangle((4, 52), 22, 38, fc='white', ec='black', lw=1.3)
    ax.add_patch(pres_box)
    ax.text(15, 86, "Presentation Layer", ha='center', va='center', fontsize=8.5, fontweight='bold', fontfamily='Arial')
    ax.plot([4, 26], [82, 82], color='black', lw=0.8)
    ax.text(15, 76, "Dashboard Frontend\n(React 18 / Vite)\nPort 5173", ha='center', va='center', fontsize=7.5, fontfamily='Arial')
    ax.text(15, 60, "- Visualisasi Hasil\n- Form Pemindaian\n- Manajemen Situs\n- Riwayat & Unduh", ha='center', va='center', fontsize=6.8, fontfamily='Arial')

    # Orchestration Layer (Middle)
    agg_box = Rectangle((33, 44), 26, 46, fc='white', ec='black', lw=1.3)
    ax.add_patch(agg_box)
    ax.text(46, 86, "Orchestration Layer", ha='center', va='center', fontsize=8.5, fontweight='bold', fontfamily='Arial')
    ax.plot([33, 59], [82, 82], color='black', lw=0.8)
    ax.text(46, 75, "Aggregator Service\n(Express.js / Port 3004)", ha='center', va='center', fontsize=7.8, fontweight='bold', fontfamily='Arial')
    ax.text(46, 60, "- REST API Gateway\n- Background Worker\n- Data-Access Client\n- Nodemailer SMTP", ha='center', va='center', fontsize=6.8, fontfamily='Arial')
    ax.text(46, 48, "[ HTTP 202 Accepted ]", ha='center', va='center', fontsize=6.5, fontfamily='monospace')

    # Database SQLite (Below Orchestration)
    draw_cylinder(ax, (46, 22), 22, 14, "Basis Data SQLite\n(better-sqlite3)\ncontent_detection.db")

    # Detection & Crawling Layer (Right Column)
    layer_r = Rectangle((66, 12), 30, 80, fc='white', ec='black', lw=1.3)
    ax.add_patch(layer_r)
    ax.text(81, 88, "Detection & Crawling Services", ha='center', va='center', fontsize=8.5, fontweight='bold', fontfamily='Arial')
    ax.plot([66, 96], [85, 85], color='black', lw=0.8)

    services = [
        ("Crawler Service", "Port 3001\nAxios, Cheerio, robots.txt", 74),
        ("Text Detection Service", "Port 3000\nAho-Corasick Multi-Pattern Trie", 56),
        ("Link Detection Service", "Port 3003\nOutbound, Risky TLD, Hidden CSS", 38),
        ("Defacement Service", "Port 3002\nSHA-256 Hasher & DOM SimHash", 20)
    ]
    for s_name, s_sub, y in services:
        s_box = Rectangle((69, y - 5), 24, 11, fc='white', ec='black', lw=1.0)
        ax.add_patch(s_box)
        ax.text(81, y + 2.5, s_name, ha='center', va='center', fontsize=7.2, fontweight='bold', fontfamily='Arial')
        ax.text(81, y - 1.8, s_sub, ha='center', va='center', fontsize=6.0, fontfamily='Arial')

    # External systems
    ext_mail = Rectangle((4, 14), 22, 16, fc='white', ec='black', lw=1.2, linestyle='--')
    ax.add_patch(ext_mail)
    ax.text(15, 24, "External Service", ha='center', va='center', fontsize=7, fontweight='bold', fontfamily='Arial')
    ax.text(15, 18, "SMTP Server Gmail\n(Port 587 TLS)", ha='center', va='center', fontsize=6.5, fontfamily='Arial')

    # Connectors
    # Frontend -> Aggregator
    draw_orthogonal_arrow(ax, [(26, 71), (33, 71)], "REST API\nHTTP/JSON", (29.5, 75))
    # Aggregator -> Database
    draw_orthogonal_arrow(ax, [(46, 44), (46, 29)], "data-access\n(SQL ACID)", (51, 36.5))
    # Aggregator -> External Mail
    draw_orthogonal_arrow(ax, [(33, 50), (15, 50), (15, 30)], "SMTP (Nodemailer)", (24, 52))

    # Aggregator -> 4 Services
    draw_orthogonal_arrow(ax, [(59, 74), (69, 74)], "POST /crawl", (64, 76.5))
    draw_orthogonal_arrow(ax, [(59, 66), (63, 66), (63, 56), (69, 56)], "POST /detect/text", (64, 61))
    draw_orthogonal_arrow(ax, [(59, 60), (63, 60), (63, 38), (69, 38)], "POST /detect/links", (64, 43))
    draw_orthogonal_arrow(ax, [(59, 54), (63, 54), (63, 20), (69, 20)], "POST /detect/deface", (64, 25))

    save_fig(fig, "architecture/gambar-4.1-arsitektur-sistem")

# =============================================================================
# 2. GAMBAR 4.2: USE CASE DIAGRAM (DRAW.IO B&W - EXACT MATCH TO IMAGE 1)
# =============================================================================
def make_usecase_diagram():
    fig, ax = plt.subplots(figsize=(10, 11))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')

    # System boundary box (Large rectangle in center, matching Image 1)
    boundary = Rectangle((26, 3), 48, 93, fc='white', ec='black', lw=1.4)
    ax.add_patch(boundary)
    ax.text(50, 93.5, "Sistem Pemantauan dan Deteksi Indikasi Konten Negatif",
            ha='center', va='center', fontsize=8.5, fontweight='bold', fontfamily='Arial')

    # Actors (matching Image 1 stick figures)
    # Left Actor: Petugas CSIRT / Administrator
    draw_actor(ax, (13, 50), "Petugas CSIRT /\nAdministrator", scale=1.1)

    # Right Actors: Target Website Pemerintah & SMTP Server Gmail
    draw_actor(ax, (87, 72), "Target Website\nPemerintah", scale=1.1)
    draw_actor(ax, (87, 28), "SMTP Server\nGmail", scale=1.1)

    # Use Case Ovals inside boundary (matching Image 1 ellipse style)
    usecases = [
        ("uc1", 50, 86, 38, 5.5, "Login Administrator"),
        ("uc2", 50, 77, 40, 6.0, "Memulai Pemindaian Website\n(Input Email Petugas)"),
        ("uc3", 50, 68, 38, 5.5, "Perayapan Web (Crawling)"),
        ("uc4", 50, 59, 40, 5.5, "Deteksi Teks (Aho-Corasick)"),
        ("uc5", 50, 50, 40, 5.5, "Deteksi Tautan Mencurigakan"),
        ("uc6", 50, 41, 40, 5.5, "Deteksi Defacement Baseline"),
        ("uc7", 50, 32, 38, 5.5, "Pengiriman Notifikasi Email"),
        ("uc8", 50, 23, 38, 5.5, "Melihat Riwayat Pemindaian"),
        ("uc9", 50, 14, 38, 5.5, "Pengelolaan Target Website"),
        ("uc10", 50, 6, 38, 5.0, "Ekspor Laporan (PDF / CSV)")
    ]
    for uid, x, y, w, h, text in usecases:
        draw_usecase_oval(ax, (x, y), w, h, text)

    # Solid lines connecting Actor to Use Cases (matching Image 1)
    actor_left_pt = (15, 50)
    for target_y in [86, 77, 23, 14, 6]:
        ax.plot([actor_left_pt[0], 31], [actor_left_pt[1], target_y], color='black', lw=1.1)

    # Right Actors connections
    ax.plot([69, 85], [68, 72], color='black', lw=1.1) # Crawling -> Target Website
    ax.plot([69, 85], [32, 28], color='black', lw=1.1) # Notifikasi Email -> SMTP Gmail

    # Dashed <<include>> arrows between use cases
    def draw_include_rel(y1, y2):
        ax.annotate('', xy=(50, y2+2.8), xytext=(50, y1-2.8),
                    arrowprops=dict(arrowstyle="->", color='black', lw=1.0, linestyle='--'))
        ax.text(50, (y1+y2)/2, "<<include>>", fontsize=6.2, ha='center', va='center',
                backgroundcolor='white', fontfamily='Arial')

    draw_include_rel(77, 68) # Scan -> Crawl
    draw_include_rel(68, 59) # Crawl -> Text
    draw_include_rel(59, 50) # Text -> Link
    draw_include_rel(50, 41) # Link -> Defacement
    draw_include_rel(41, 32) # Defacement -> Email

    save_fig(fig, "use-case/gambar-4.2-use-case-diagram")

# =============================================================================
# 3. ACTIVITY DIAGRAMS (8 DIAGRAMS - EXACT MATCH TO IMAGE 2 & IMAGE 3)
# =============================================================================

# Gambar 4.3: Activity Diagram Login Administrator (2 swimlanes, Image 2 style)
def make_act_login():
    fig, ax = plt.subplots(figsize=(8, 9.5))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    lw = draw_swimlanes(ax, ["Aktor (Petugas CSIRT)", "Sistem (Dashboard & Aggregator)"])

    c1 = 5 + lw/2       # X center lane 1 (~27.5)
    c2 = 5 + lw + lw/2  # X center lane 2 (~72.5)

    draw_start_node(ax, (c1, 88))
    draw_arrow(ax, (c1, 86.2), (c1, 81))

    draw_act_box(ax, (c1, 78), 34, 6, "Membuka Halaman Website Login")
    draw_orthogonal_arrow(ax, [(c1+17, 78), (c2-17, 78)])

    draw_act_box(ax, (c2, 78), 34, 6, "Menampilkan Halaman Login")
    draw_orthogonal_arrow(ax, [(c2, 75), (c2, 69), (c1+17, 69), (c1+17, 66)])

    draw_act_box(ax, (c1, 63), 34, 6, "Memasukkan Username dan Password")
    draw_orthogonal_arrow(ax, [(c1, 60), (c1, 54), (c2-17, 54)])

    draw_act_box(ax, (c2, 54), 34, 6, "Cek Kredensial via Scrypt Hash")
    draw_arrow(ax, (c2, 51), (c2, 45))

    draw_decision_diamond(ax, (c2, 41), 18, 8, "Valid?")
    draw_arrow(ax, (c2, 37), (c2, 29), "YA", label_side='right')

    draw_act_box(ax, (c2, 26), 34, 6, "Menampilkan Halaman Dashboard\n(Generate Session Token)")
    draw_arrow(ax, (c2, 23), (c2, 17))

    draw_end_node(ax, (c2, 15))

    # Reject loop
    draw_orthogonal_arrow(ax, [(c2-9, 41), (c1, 41), (c1, 60)], "TIDAK", (c1+6, 42.5))

    save_fig(fig, "activity/gambar-4.3-activity-diagram-login")

# Gambar 4.4: Activity Diagram Pemindaian Website (Background Scanning)
def make_act_scan():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    lw = draw_swimlanes(ax, ["Petugas CSIRT", "Sistem (Aggregator & Worker)"])
    c1 = 5 + lw/2; c2 = 5 + lw + lw/2

    draw_start_node(ax, (c1, 89))
    draw_arrow(ax, (c1, 87.2), (c1, 82))

    draw_act_box(ax, (c1, 79), 34, 6, "Membuka Menu Pemindaian")
    draw_arrow(ax, (c1, 76), (c1, 71))

    draw_act_box(ax, (c1, 68), 34, 6, "Input URL, Kedalaman,\n& Email Petugas")
    draw_arrow(ax, (c1, 65), (c1, 60))

    draw_act_box(ax, (c1, 57), 34, 6, "Klik 'Mulai Pemindaian'")
    draw_orthogonal_arrow(ax, [(c1+17, 57), (c2-17, 57)])

    draw_act_box(ax, (c2, 57), 34, 6, "Validasi Input & Format Email")
    draw_arrow(ax, (c2, 54), (c2, 48))

    draw_decision_diamond(ax, (c2, 44), 18, 8, "Valid?")
    draw_arrow(ax, (c2, 40), (c2, 34), "YA", label_side='right')

    draw_act_box(ax, (c2, 31), 34, 6, "Simpan Record Scan (PENDING)\n& Balas HTTP 202 Accepted")

    # Split: UI confirms, Worker processes
    draw_orthogonal_arrow(ax, [(c2-17, 31), (c1+17, 31)])
    draw_act_box(ax, (c1, 31), 34, 6, "Menerima Konfirmasi Job\n(Boleh Tutup Browser/Laptop)")
    draw_arrow(ax, (c1, 28), (c1, 22))
    draw_end_node(ax, (c1, 20))

    draw_arrow(ax, (c2, 28), (c2, 22))
    draw_act_box(ax, (c2, 19), 34, 6, "Worker Memproses Crawling,\nDeteksi, & Kirim Email Laporan")
    draw_arrow(ax, (c2, 16), (c2, 11))
    draw_end_node(ax, (c2, 9))

    # Reject
    draw_orthogonal_arrow(ax, [(c2+9, 44), (92, 44), (92, 68), (c1+17, 68)], "TIDAK", (92, 56))

    save_fig(fig, "activity/gambar-4.4-activity-diagram-pemindaian")

# Gambar 4.5: Activity Diagram Web Crawling
def make_act_crawling():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    lw = draw_swimlanes(ax, ["Aggregator Worker", "Crawler Service (Port 3001)"])
    c1 = 5 + lw/2; c2 = 5 + lw + lw/2

    draw_start_node(ax, (c1, 89))
    draw_arrow(ax, (c1, 87.2), (c1, 82))

    draw_act_box(ax, (c1, 79), 34, 6, "Kirim Request Crawl\n{targetUrl, maxPages, depth}")
    draw_orthogonal_arrow(ax, [(c1+17, 79), (c2-17, 79)])

    draw_act_box(ax, (c2, 79), 34, 6, "Unduh & Parse robots.txt")
    draw_arrow(ax, (c2, 76), (c2, 70))

    draw_act_box(ax, (c2, 67), 34, 6, "Inisialisasi Antrean BFS\ndengan Root URL")
    draw_arrow(ax, (c2, 64), (c2, 58))

    draw_act_box(ax, (c2, 55), 34, 6, "Unduh Dokumen HTML (Axios)")
    draw_arrow(ax, (c2, 52), (c2, 46))

    draw_act_box(ax, (c2, 43), 34, 6, "Cheerio Ekstrak Tautan Internal\n& Masukkan ke BFS Queue")
    draw_arrow(ax, (c2, 40), (c2, 34))

    draw_decision_diamond(ax, (c2, 30), 20, 8, "Batas Halaman\nTercapai?")
    draw_arrow(ax, (c2, 26), (c2, 20), "YA", label_side='right')

    draw_act_box(ax, (c2, 17), 34, 6, "Kompilasi Daftar Halaman\n& Kembalikan Response")
    draw_orthogonal_arrow(ax, [(c2-17, 17), (c1+17, 17)])

    draw_act_box(ax, (c1, 17), 34, 6, "Menerima Koleksi Halaman\nuntuk Tahap Deteksi")
    draw_arrow(ax, (c1, 14), (c1, 9))
    draw_end_node(ax, (c1, 7))

    # Loop back
    draw_orthogonal_arrow(ax, [(c2+10, 30), (92, 30), (92, 55), (c2+17, 55)], "TIDAK", (92, 42.5))

    save_fig(fig, "activity/gambar-4.5-activity-diagram-web-crawling")

# Gambar 4.6: Activity Diagram Deteksi Teks Aho-Corasick
def make_act_text():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    lw = draw_swimlanes(ax, ["Aggregator Worker", "Text Detection Service (Port 3000)"])
    c1 = 5 + lw/2; c2 = 5 + lw + lw/2

    draw_start_node(ax, (c1, 89))
    draw_arrow(ax, (c1, 87.2), (c1, 82))

    draw_act_box(ax, (c1, 79), 34, 6, "Kirim Payload HTML Halaman")
    draw_orthogonal_arrow(ax, [(c1+17, 79), (c2-17, 79)])

    draw_act_box(ax, (c2, 79), 34, 6, "Ekstraksi Teks Bersih,\nMeta Tag, & Alt Gambar")
    draw_arrow(ax, (c2, 76), (c2, 70))

    draw_act_box(ax, (c2, 67), 34, 6, "Normalisasi Karakter\n& Konversi Leet Speak")
    draw_arrow(ax, (c2, 64), (c2, 58))

    draw_act_box(ax, (c2, 55), 34, 6, "Pencocokan Multi-Pola\nTrie Aho-Corasick O(n+m)")
    draw_arrow(ax, (c2, 52), (c2, 46))

    draw_decision_diamond(ax, (c2, 42), 18, 8, "Pola Cocok?")
    draw_arrow(ax, (c2, 38), (c2, 31), "YA", label_side='right')

    draw_act_box(ax, (c2, 28), 34, 6, "Hitung Skor Keyakinan\n& Ekstrak Snippet Bukti")
    draw_arrow(ax, (c2, 25), (c2, 19))

    draw_act_box(ax, (c2, 16), 34, 6, "Kembalikan Hasil Temuan Teks")
    draw_orthogonal_arrow(ax, [(c2-17, 16), (c1+17, 16)])

    draw_act_box(ax, (c1, 16), 34, 6, "Simpan Hasil Analisis Teks")
    draw_arrow(ax, (c1, 13), (c1, 8))
    draw_end_node(ax, (c1, 6))

    # Bypass if no match
    draw_orthogonal_arrow(ax, [(c2+9, 42), (92, 42), (92, 16), (c2+17, 16)], "TIDAK", (92, 29))

    save_fig(fig, "activity/gambar-4.6-activity-diagram-deteksi-teks")

# Gambar 4.7: Activity Diagram Deteksi Tautan Mencurigakan
def make_act_link():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    lw = draw_swimlanes(ax, ["Aggregator Worker", "Link Detection Service (Port 3003)"])
    c1 = 5 + lw/2; c2 = 5 + lw + lw/2

    draw_start_node(ax, (c1, 89))
    draw_arrow(ax, (c1, 87.2), (c1, 82))

    draw_act_box(ax, (c1, 79), 34, 6, "Kirim Dokumen HTML Halaman")
    draw_orthogonal_arrow(ax, [(c1+17, 79), (c2-17, 79)])

    draw_act_box(ax, (c2, 79), 34, 6, "Ekstraksi Tag <a>, <iframe>,\n<script>, <form>")
    draw_arrow(ax, (c2, 76), (c2, 70))

    draw_act_box(ax, (c2, 67), 34, 6, "Filter Tautan Eksternal\n(Outbound Domain)")
    draw_arrow(ax, (c2, 64), (c2, 58))

    draw_act_box(ax, (c2, 55), 34, 6, "Evaluasi TLD Berisiko\n(.top, .xyz, .icu, dll.)")
    draw_arrow(ax, (c2, 52), (c2, 46))

    draw_act_box(ax, (c2, 43), 34, 6, "Deteksi CSS Tersembunyi\n(display:none, font-size:0)")
    draw_arrow(ax, (c2, 40), (c2, 34))

    draw_decision_diamond(ax, (c2, 30), 20, 8, "Ada Tautan\nAnomali?")
    draw_arrow(ax, (c2, 26), (c2, 19), "YA", label_side='right')

    draw_act_box(ax, (c2, 16), 34, 6, "Tandai Risiko & Kirim Hasil")
    draw_orthogonal_arrow(ax, [(c2-17, 16), (c1+17, 16)])

    draw_act_box(ax, (c1, 16), 34, 6, "Simpan Temuan Tautan")
    draw_arrow(ax, (c1, 13), (c1, 8))
    draw_end_node(ax, (c1, 6))

    # Bypass
    draw_orthogonal_arrow(ax, [(c2+10, 30), (92, 30), (92, 16), (c2+17, 16)], "TIDAK", (92, 23))

    save_fig(fig, "activity/gambar-4.7-activity-diagram-deteksi-tautan")

# Gambar 4.8: Activity Diagram Deteksi Defacement
def make_act_defacement():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    lw = draw_swimlanes(ax, ["Aggregator Worker", "Defacement Service (Port 3002)"])
    c1 = 5 + lw/2; c2 = 5 + lw + lw/2

    draw_start_node(ax, (c1, 89))
    draw_arrow(ax, (c1, 87.2), (c1, 82))

    draw_act_box(ax, (c1, 79), 34, 6, "Kirim URL & HTML Halaman")
    draw_orthogonal_arrow(ax, [(c1+17, 79), (c2-17, 79)])

    draw_act_box(ax, (c2, 79), 34, 6, "Periksa Baseline di Database")
    draw_arrow(ax, (c2, 76), (c2, 70))

    draw_decision_diamond(ax, (c2, 66), 20, 8, "Baseline Ada?")

    # No baseline branch
    draw_orthogonal_arrow(ax, [(c2-10, 66), (22, 66), (22, 54), (c2-17, 54)], "TIDAK", (22, 60))
    draw_act_box(ax, (c2, 54), 34, 6, "Simpan Baseline Awal\n(SHA-256 & SimHash)")

    # Baseline exists branch
    draw_arrow(ax, (c2, 62), (c2, 45), "YA", label_side='right')
    draw_act_box(ax, (c2, 42), 34, 6, "Bandingkan Struktur DOM,\nTag <title>, & Header")
    draw_arrow(ax, (c2, 39), (c2, 33))

    draw_decision_diamond(ax, (c2, 29), 20, 8, "Perubahan >\nAmbang?")
    draw_arrow(ax, (c2, 25), (c2, 19), "YA", label_side='right')

    draw_act_box(ax, (c2, 16), 34, 6, "Tandai Indikasi Defacement")
    draw_orthogonal_arrow(ax, [(c2-17, 16), (c1+17, 16)])

    draw_act_box(ax, (c1, 16), 34, 6, "Simpan Status Defacement")
    draw_arrow(ax, (c1, 13), (c1, 8))
    draw_end_node(ax, (c1, 6))

    # Normal bypass
    draw_orthogonal_arrow(ax, [(c2+10, 29), (92, 29), (92, 16), (c2+17, 16)], "TIDAK", (92, 22.5))

    save_fig(fig, "activity/gambar-4.8-activity-diagram-deteksi-defacement")

# Gambar 4.9: Activity Diagram Penyimpanan Hasil (3 swimlanes, Image 3 style)
def make_act_storage():
    fig, ax = plt.subplots(figsize=(9, 10))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    lw = draw_swimlanes(ax, ["Aggregator Service", "Database SQLite", "Dashboard Frontend"])
    c1 = 5 + lw/2       # Lane 1 (~20)
    c2 = 5 + lw + lw/2  # Lane 2 (~50)
    c3 = 5 + 2*lw + lw/2# Lane 3 (~80)

    draw_start_node(ax, (c1, 89))
    draw_arrow(ax, (c1, 87.2), (c1, 82))

    draw_act_box(ax, (c1, 79), 26, 6, "Kompilasi Hasil\n3 Layanan Deteksi", fs=6.8)
    draw_orthogonal_arrow(ax, [(c1+13, 79), (c2-13, 79)])

    draw_act_box(ax, (c2, 79), 26, 6, "Buka Transaksi Atomik\n(better-sqlite3)", fs=6.8)
    draw_arrow(ax, (c2, 76), (c2, 70))

    draw_act_box(ax, (c2, 67), 26, 6, "INSERT INTO scans\n(Ringkasan Hasil)", fs=6.8)
    draw_arrow(ax, (c2, 64), (c2, 58))

    draw_act_box(ax, (c2, 55), 26, 6, "INSERT INTO scan_pages\n(Detail Halaman)", fs=6.8)
    draw_arrow(ax, (c2, 52), (c2, 46))

    draw_act_box(ax, (c2, 43), 26, 6, "INSERT scan_findings\n(Kata Kunci & Tautan)", fs=6.8)
    draw_arrow(ax, (c2, 40), (c2, 34))

    draw_act_box(ax, (c2, 31), 26, 6, "Commit Transaksi ACID\nStatus COMPLETED", fs=6.8)

    draw_orthogonal_arrow(ax, [(c2+13, 31), (c3-13, 31)])
    draw_act_box(ax, (c3, 31), 26, 6, "Polling Menerima\nStatus COMPLETED", fs=6.8)
    draw_arrow(ax, (c3, 28), (c3, 22))

    draw_act_box(ax, (c3, 19), 26, 6, "Render Ringkasan Visual\n& Laporan Forensik", fs=6.8)
    draw_arrow(ax, (c3, 16), (c3, 10))
    draw_end_node(ax, (c3, 8))

    save_fig(fig, "activity/gambar-4.9-activity-diagram-penyimpanan-hasil")

# Gambar 4.10: Activity Diagram Notifikasi Email Per-Petugas
def make_act_email():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')
    lw = draw_swimlanes(ax, ["Aggregator Worker", "Layanan Email (Nodemailer / SMTP)"])
    c1 = 5 + lw/2; c2 = 5 + lw + lw/2

    draw_start_node(ax, (c1, 89))
    draw_arrow(ax, (c1, 87.2), (c1, 82))

    draw_act_box(ax, (c1, 79), 34, 6, "Pemindaian Selesai di Server")
    draw_arrow(ax, (c1, 76), (c1, 70))

    draw_decision_diamond(ax, (c1, 66), 20, 8, "Email Petugas\nTercatat?")
    draw_arrow(ax, (c1, 62), (c1, 54), "YA", label_side='right')

    draw_act_box(ax, (c1, 51), 34, 6, "Set Penerima = Email Petugas\n(Isolasi Notifikasi Mandiri)")
    draw_arrow(ax, (c1, 48), (c1, 42))

    draw_decision_diamond(ax, (c1, 38), 20, 8, "Ada Indikasi?")
    draw_orthogonal_arrow(ax, [(c1+10, 38), (c2-17, 38)], "YA", (54, 40))
    draw_act_box(ax, (c2, 38), 34, 6, "Pilih Templat [PERINGATAN]\n& Lampirkan Bukti Temuan")

    draw_arrow(ax, (c1, 34), (c1, 26), "TIDAK", label_side='right')
    draw_act_box(ax, (c1, 23), 34, 6, "Pilih Templat [LAPORAN BERSIH]\n(0 Indikasi)")
    draw_orthogonal_arrow(ax, [(c1+17, 23), (c2-17, 23)])

    draw_act_box(ax, (c2, 23), 34, 6, "Kirimkan Surel via SMTP Gmail\n(Port 587 TLS)")
    draw_arrow(ax, (c2, 20), (c2, 14))

    draw_act_box(ax, (c2, 11), 34, 6, "Catat Message-ID di Tabel Database")
    draw_arrow(ax, (c2, 8), (c2, 4.5))
    draw_end_node(ax, (c2, 3))

    save_fig(fig, "activity/gambar-4.10-activity-diagram-notifikasi-email")

# =============================================================================
# 4. SEQUENCE DIAGRAMS (5 DIAGRAMS - EXACT MATCH TO IMAGE 4)
# =============================================================================
def draw_seq_base(ax, participants):
    n = len(participants)
    gap = 88 / (n - 1) if n > 1 else 40
    xs = [6 + i * gap for i in range(n)]

    for x, (p_type, p_name) in zip(xs, participants):
        if p_type == 'actor':
            draw_actor(ax, (x, 90), p_name, scale=0.85)
        elif p_type == 'db':
            draw_cylinder(ax, (x, 90), 14, 8, p_name)
        else:
            # Rounded / standard box (Image 4 style)
            bx = Rectangle((x - 8, 86), 16, 8, fc='white', ec='black', lw=1.2)
            ax.add_patch(bx)
            ax.text(x, 90, p_name, ha='center', va='center', fontsize=7.2, fontweight='bold', fontfamily='Arial')

        # Lifeline (dashed vertical line)
        ax.plot([x, x], [82, 8], color='black', lw=1.0, linestyle='--')

        # Activation bar (Image 4 tall narrow white rectangle with black border)
        act = Rectangle((x - 1.2, 12), 2.4, 70, fc='white', ec='black', lw=1.0)
        ax.add_patch(act)

    return xs

def draw_seq_msg(ax, x1, x2, y, text, is_reply=False):
    ls = '--' if is_reply else '-'
    arr = '->'
    ax.annotate('', xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(arrowstyle=arr, color='black', lw=1.1, linestyle=ls))
    mx = (x1 + x2) / 2
    ax.text(mx, y + 1.2, text, ha='center', va='bottom', fontsize=6.8, color='black',
            fontfamily='Arial', backgroundcolor='white')

def draw_alt_box(ax, x1, x2, y1, y2, cond1, cond2, mid_y):
    # Alt combined fragment (Image 4 style)
    box = Rectangle((x1, y1), x2 - x1, y2 - y1, fc='none', ec='black', lw=1.1)
    ax.add_patch(box)
    tab = Rectangle((x1, y2 - 4.5), 9, 4.5, fc='white', ec='black', lw=1.1)
    ax.add_patch(tab)
    ax.text(x1 + 4.5, y2 - 2.2, "Alt", ha='center', va='center', fontsize=6.5, fontweight='bold', fontfamily='Arial')
    ax.text(x1 + 11, y2 - 2.2, f"[{cond1}]", ha='left', va='center', fontsize=6.2, fontfamily='Arial')

    # Divider line
    ax.plot([x1, x2], [mid_y, mid_y], color='black', lw=1.0, linestyle='--')
    ax.text(x1 + 2, mid_y - 2.2, f"[{cond2}]", ha='left', va='center', fontsize=6.2, fontfamily='Arial')

# Gambar 4.11: Sequence Diagram Pemindaian Website
def make_seq_pemindaian():
    fig, ax = plt.subplots(figsize=(10, 9.5))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')

    parts = [
        ("actor", "Petugas CSIRT"),
        ("box", "Dashboard UI"),
        ("box", "Aggregator Svc"),
        ("db", "SQLite DB"),
        ("box", "Scan Worker")
    ]
    xs = draw_seq_base(ax, parts)

    draw_seq_msg(ax, xs[0], xs[1], 78, "1: Input URL & Email, Klik Mulai")
    draw_seq_msg(ax, xs[1], xs[2], 72, "2: POST /api/scans {url, email, limits}")
    draw_seq_msg(ax, xs[2], xs[3], 66, "3: INSERT scans (status='PENDING')")
    draw_seq_msg(ax, xs[3], xs[2], 61, "4: Return scanId", is_reply=True)
    draw_seq_msg(ax, xs[2], xs[1], 56, "5: HTTP 202 Accepted {scanId}", is_reply=True)
    draw_seq_msg(ax, xs[1], xs[0], 51, "6: Tampilkan Konfirmasi (Boleh Tutup Laptop)", is_reply=True)

    # Async background execution
    draw_seq_msg(ax, xs[2], xs[4], 44, "7: executeScan(scanId, email)")
    draw_seq_msg(ax, xs[4], xs[4], 38, "8: Crawling & Deteksi Paralel 3 Layanan")
    draw_seq_msg(ax, xs[4], xs[3], 32, "9: UPDATE scans SET status='COMPLETED'")
    draw_seq_msg(ax, xs[4], xs[4], 26, "10: Kirim Email Laporan ke Petugas")

    draw_seq_msg(ax, xs[1], xs[2], 20, "11: GET /api/scans/:id (Polling Status)")
    draw_seq_msg(ax, xs[2], xs[1], 15, "12: Return Scan Status & Detail Indikasi", is_reply=True)

    save_fig(fig, "sequence/gambar-4.11-sequence-diagram-pemindaian")

# Gambar 4.12: Sequence Diagram Web Crawling
def make_seq_crawling():
    fig, ax = plt.subplots(figsize=(10, 9))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')

    parts = [
        ("box", "Scan Worker"),
        ("box", "Crawler Service"),
        ("box", "robots-parser"),
        ("box", "Target Server")
    ]
    xs = draw_seq_base(ax, parts)

    draw_seq_msg(ax, xs[0], xs[1], 78, "1: POST /crawl {targetUrl, maxPages, depth}")
    draw_seq_msg(ax, xs[1], xs[3], 72, "2: GET /robots.txt")
    draw_seq_msg(ax, xs[3], xs[1], 66, "3: HTTP 200 (File robots.txt)", is_reply=True)
    draw_seq_msg(ax, xs[1], xs[2], 60, "4: Parse Disallow & User-Agent Rules")
    draw_seq_msg(ax, xs[2], xs[1], 55, "5: Return isAllowed(url) validator", is_reply=True)

    # Loop BFS
    loop_box = Rectangle((xs[1] - 4, 30), xs[3] - xs[1] + 8, 22, fc='none', ec='black', lw=1.1)
    ax.add_patch(loop_box)
    tab = Rectangle((xs[1] - 4, 48), 11, 4, fc='white', ec='black', lw=1.1)
    ax.add_patch(tab)
    ax.text(xs[1] + 1.5, 50, "Loop", ha='center', va='center', fontsize=6.5, fontweight='bold', fontfamily='Arial')
    ax.text(xs[1] + 12, 50, "[Queue != empty && count < maxPages]", ha='left', va='center', fontsize=6.0, fontfamily='Arial')

    draw_seq_msg(ax, xs[1], xs[3], 44, "6: HTTP GET url (Timeout 10s)")
    draw_seq_msg(ax, xs[3], xs[1], 39, "7: HTTP 200 OK (HTML Document)", is_reply=True)
    draw_seq_msg(ax, xs[1], xs[1], 34, "8: Cheerio Ekstrak <a href> & Push ke Queue")

    draw_seq_msg(ax, xs[1], xs[0], 22, "9: HTTP 200 OK {pages: [{url, title, html}]}", is_reply=True)

    save_fig(fig, "sequence/gambar-4.12-sequence-diagram-web-crawling")

# Gambar 4.13: Sequence Diagram Deteksi Teks Aho-Corasick
def make_seq_text():
    fig, ax = plt.subplots(figsize=(10, 9))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')

    parts = [
        ("box", "Scan Worker"),
        ("box", "Text Service"),
        ("box", "DOM Parser"),
        ("box", "Aho-Corasick")
    ]
    xs = draw_seq_base(ax, parts)

    draw_seq_msg(ax, xs[0], xs[1], 78, "1: POST /detect/text {url, html, title}")
    draw_seq_msg(ax, xs[1], xs[2], 71, "2: Ekstrak Teks Terlihat, Meta, & Alt Gambar")
    draw_seq_msg(ax, xs[2], xs[1], 64, "3: Return Teks Bersih Hasil Ekstraksi", is_reply=True)
    draw_seq_msg(ax, xs[1], xs[1], 57, "4: Normalisasi Huruf & Leet Speak (g4c0r -> gacor)")
    draw_seq_msg(ax, xs[1], xs[3], 50, "5: searchPatterns(normalizedCorpus)")
    draw_seq_msg(ax, xs[3], xs[3], 43, "6: Traversal Trie Linier O(n + m)")
    draw_seq_msg(ax, xs[3], xs[1], 36, "7: Return Kata Kunci Cocok & Bobot", is_reply=True)
    draw_seq_msg(ax, xs[1], xs[1], 29, "8: Hitung Skor Keyakinan & Ekstrak Snippet")
    draw_seq_msg(ax, xs[1], xs[0], 21, "9: HTTP 200 OK {hasIndication, confidence, findings}", is_reply=True)

    save_fig(fig, "sequence/gambar-4.13-sequence-diagram-deteksi-teks")

# Gambar 4.14: Sequence Diagram Deteksi Tautan Mencurigakan
def make_seq_link():
    fig, ax = plt.subplots(figsize=(10, 9))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')

    parts = [
        ("box", "Scan Worker"),
        ("box", "Link Service"),
        ("box", "Cheerio Parser"),
        ("box", "Rule Engine")
    ]
    xs = draw_seq_base(ax, parts)

    draw_seq_msg(ax, xs[0], xs[1], 78, "1: POST /detect/links {url, html}")
    draw_seq_msg(ax, xs[1], xs[2], 71, "2: Ekstraksi Elemen <a>, <iframe>, <script>, <form>")
    draw_seq_msg(ax, xs[2], xs[1], 64, "3: Return Array Seluruh Hyperlink & Atribut", is_reply=True)
    draw_seq_msg(ax, xs[1], xs[3], 57, "4: evaluateLinks(links, baseDomain)")
    draw_seq_msg(ax, xs[3], xs[3], 50, "5: Filter Outbound & Evaluasi TLD Berisiko")
    draw_seq_msg(ax, xs[3], xs[3], 43, "6: Periksa CSS Tersembunyi (display:none)")
    draw_seq_msg(ax, xs[3], xs[1], 36, "7: Return Daftar Tautan Anomali & Risiko", is_reply=True)
    draw_seq_msg(ax, xs[1], xs[0], 25, "8: HTTP 200 OK {hasIndication, suspiciousLinks: [...]}", is_reply=True)

    save_fig(fig, "sequence/gambar-4.14-sequence-diagram-deteksi-tautan")

# Gambar 4.15: Sequence Diagram Deteksi Defacement
def make_seq_defacement():
    fig, ax = plt.subplots(figsize=(10, 9.5))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')

    parts = [
        ("box", "Scan Worker"),
        ("box", "Defacement Svc"),
        ("db", "Baseline Repo"),
        ("box", "DOM Comparator")
    ]
    xs = draw_seq_base(ax, parts)

    draw_seq_msg(ax, xs[0], xs[1], 80, "1: POST /detect/defacement {siteId, url, html, title}")
    draw_seq_msg(ax, xs[1], xs[2], 73, "2: getBaselineSnapshot(siteId, url)")
    draw_seq_msg(ax, xs[2], xs[1], 66, "3: Return Baseline Data / Null", is_reply=True)

    # Alt fragment
    draw_alt_box(ax, xs[1] - 4, xs[3] + 4, 28, 62, "Baseline Belum Ada", "Baseline Sudah Tersedia", 45)

    # Case 1: Baseline not found
    draw_seq_msg(ax, xs[1], xs[2], 56, "4a: INSERT baseline (SHA-256, SimHash)")
    draw_seq_msg(ax, xs[1], xs[0], 50, "5a: Return {status: BASELINE_CREATED}", is_reply=True)

    # Case 2: Baseline exists
    draw_seq_msg(ax, xs[1], xs[3], 39, "4b: compareStructuralSimilarity(html, baseline)")
    draw_seq_msg(ax, xs[3], xs[1], 33, "5b: Return {diffScore, titleChanged, anomaly}", is_reply=True)

    draw_seq_msg(ax, xs[1], xs[0], 20, "6: HTTP 200 OK {hasIndication, diffScore, changeType}", is_reply=True)

    save_fig(fig, "sequence/gambar-4.15-sequence-diagram-deteksi-defacement")

# =============================================================================
# 5. GAMBAR 4.16: COMPONENT DIAGRAM (DRAW.IO B&W - EXACT MATCH TO IMAGE 5)
# =============================================================================
def make_component_diagram():
    fig, ax = plt.subplots(figsize=(10, 8))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')

    ax.text(50, 96, "Component Diagram Arsitektur Microservices",
            ha='center', va='center', fontsize=11, fontweight='bold', fontfamily='Arial')

    def draw_uml_component(x, y, w, h, name, subtext):
        # Outer box
        box = Rectangle((x, y), w, h, fc='white', ec='black', lw=1.2)
        ax.add_patch(box)
        # Component icon in top-right corner
        ic_w, ic_h = 4, 3
        ic_x = x + w - ic_w - 1.5
        ic_y = y + h - ic_h - 1.5
        ic_main = Rectangle((ic_x, ic_y), ic_w, ic_h, fc='white', ec='black', lw=0.9)
        t1 = Rectangle((ic_x - 1.2, ic_y + ic_h*0.55), 2.4, ic_h*0.3, fc='white', ec='black', lw=0.8)
        t2 = Rectangle((ic_x - 1.2, ic_y + ic_h*0.15), 2.4, ic_h*0.3, fc='white', ec='black', lw=0.8)
        ax.add_patch(ic_main); ax.add_patch(t1); ax.add_patch(t2)

        ax.text(x + w/2 - 2, y + h - 3.5, f"<<component>>\n{name}",
                ha='center', va='center', fontsize=7.2, fontweight='bold', fontfamily='Arial')
        ax.text(x + w/2, y + h/2 - 2, subtext, ha='center', va='center', fontsize=6.2, fontfamily='Arial')

    # Dashboard Component
    draw_uml_component(4, 52, 24, 26, "Dashboard Frontend", "React 18 / Vite\nTailwindCSS / Axios\nPort 5173")

    # Aggregator Service Component
    draw_uml_component(36, 46, 26, 36, "Aggregator Service", "Express.js REST API\nScan Job Orchestrator\nNodemailer Transport\nPort 3004")

    # 4 Detection & Crawling Components
    draw_uml_component(70, 72, 26, 17, "Crawler Service", "Axios, Cheerio, robots.txt\nPort 3001")
    draw_uml_component(70, 50, 26, 17, "Text Detection", "Aho-Corasick Engine\nPort 3000")
    draw_uml_component(70, 28, 26, 17, "Link Detection", "Outbound & Hidden CSS\nPort 3003")
    draw_uml_component(70, 6, 26, 17, "Defacement Service", "SHA-256 Hasher & SimHash\nPort 3002")

    # Database Component
    draw_cylinder(ax, (49, 20), 22, 14, "Basis Data SQLite\n(content_detection.db)\nbetter-sqlite3")

    # SMTP Component
    draw_uml_component(4, 14, 24, 18, "SMTP Server Gmail", "smtp.gmail.com:587\nKoneksi TLS")

    # Connectors
    draw_orthogonal_arrow(ax, [(28, 65), (36, 65)], "HTTP REST", (32, 68))
    draw_orthogonal_arrow(ax, [(49, 46), (49, 27)], "data-access (SQL)", (55, 36))
    draw_orthogonal_arrow(ax, [(36, 52), (16, 52), (16, 32)], "SMTP TLS", (26, 54))

    draw_orthogonal_arrow(ax, [(62, 70), (70, 80)], "POST /crawl", (66, 82))
    draw_orthogonal_arrow(ax, [(62, 65), (70, 58)], "POST /detect/text", (66, 63))
    draw_orthogonal_arrow(ax, [(62, 58), (70, 36)], "POST /detect/links", (66, 44))
    draw_orthogonal_arrow(ax, [(62, 52), (66, 52), (66, 14), (70, 14)], "POST /detect/deface", (66, 22))

    save_fig(fig, "component/gambar-4.16-component-diagram")

# =============================================================================
# 6. GAMBAR 3.1: BAGAN ALUR DSRM (BAB III METODOLOGI PENELITIAN)
# =============================================================================
def make_dsrm_diagram():
    fig, ax = plt.subplots(figsize=(10, 12))
    ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.axis('off')

    ax.text(50, 98, "Bagan Alur Penelitian Design Science Research Methodology (DSRM)",
            ha='center', va='center', fontsize=10.5, fontweight='bold', fontfamily='Arial')

    # 4 Phases across the vertical flow
    def draw_dsrm_process(y, phase_title, proc_num, proc_name, inp, act, out):
        # Outer phase banner
        p_hdr = Rectangle((6, y + 8), 88, 4.5, fc='#F0F0F0', ec='black', lw=1.1)
        ax.add_patch(p_hdr)
        ax.text(10, y + 10.25, phase_title, ha='left', va='center', fontsize=7.5, fontweight='bold', fontfamily='Arial')

        # 3 Compartments: Input -> Process -> Output
        b_inp = Rectangle((6, y), 26, 8, fc='white', ec='black', lw=1.0)
        b_act = Rectangle((37, y), 26, 8, fc='white', ec='black', lw=1.1)
        b_out = Rectangle((68, y), 26, 8, fc='white', ec='black', lw=1.0)
        ax.add_patch(b_inp); ax.add_patch(b_act); ax.add_patch(b_out)

        ax.text(19, y + 5.5, f"Input {proc_num}:", ha='center', va='center', fontsize=6.2, fontweight='bold', fontfamily='Arial')
        ax.text(19, y + 2.5, inp, ha='center', va='center', fontsize=5.8, color='#333333', fontfamily='Arial')

        ax.text(50, y + 5.5, f"{proc_num}: {proc_name}", ha='center', va='center', fontsize=6.2, fontweight='bold', fontfamily='Arial')
        ax.text(50, y + 2.5, act, ha='center', va='center', fontsize=5.8, color='#333333', fontfamily='Arial')

        ax.text(81, y + 5.5, f"Output {proc_num}:", ha='center', va='center', fontsize=6.2, fontweight='bold', fontfamily='Arial')
        ax.text(81, y + 2.5, out, ha='center', va='center', fontsize=5.8, color='#333333', fontfamily='Arial')

        # Connectors
        draw_arrow(ax, (32, y + 4), (37, y + 4))
        draw_arrow(ax, (63, y + 4), (68, y + 4))

    # Phase 1
    draw_dsrm_process(82, "1. Fase Identifikasi Masalah dan Motivasi", "Proses 1", "Identifikasi Masalah & Motivasi",
                      "Wawancara, Observasi,\n& Dokumentasi", "Analisis Kebutuhan\nDiskominfotik Sumbawa", "Rumusan Masalah &\nRuang Lingkup")

    draw_dsrm_process(68, "1. Fase Identifikasi Masalah dan Motivasi", "Proses 2", "Analisis Kajian Pustaka",
                      "Studi Pustaka &\nPenelitian Terdahulu", "Kajian Crawling, Aho-Corasick,\nDefacement, Microservices", "Landasan Teori &\nTinjauan Pustaka")

    # Phase 2
    draw_dsrm_process(54, "2. Fase Penetapan Tujuan Solusi", "Proses 3", "Penetapan Tujuan Solusi",
                      "Rumusan Masalah &\nTinjauan Pustaka", "Spesifikasi Kebutuhan Fungsional,\nNon-Fungsional, & Batasan", "Kebutuhan Sistem &\nIndikator Evaluasi")

    # Phase 3
    draw_dsrm_process(40, "3. Fase Perancangan dan Pengembangan", "Proses 4", "Perancangan Arsitektur & UML",
                      "Kebutuhan & Batasan\nSistem", "Desain Microservices (6 Layanan),\nUse Case, Activity, Sequence", "Dokumen Perancangan\nArsitektur & UML")

    draw_dsrm_process(26, "3. Fase Perancangan dan Pengembangan", "Proses 5", "Pengembangan Layanan & Dasbor",
                      "Dokumen Perancangan\nArsitektur & UML", "Implementasi Node.js, Express,\nReact 18, better-sqlite3", "Sistem Pemantauan\n(Instansiasi Artefak)")

    # Phase 4
    draw_dsrm_process(12, "4. Fase Demonstrasi, Evaluasi, dan Komunikasi", "Proses 6 & 7", "Pengujian & Evaluasi Empiris",
                      "Sistem Pemantauan &\nDataset 50 Sampel", "Black-Box, Integration Test,\nConfusion Matrix (TP, FP, FN)", "Akurasi, Presisi, Recall,\n& F1-Score 100%")

    save_fig(fig, "methodology/gambar-3.1-alur-penelitian-dsrm")

if __name__ == '__main__':
    print("Generating formal academic black-and-white diagrams matching draw.io...")
    make_architecture_diagram()
    make_usecase_diagram()
    make_act_login()
    make_act_scan()
    make_act_crawling()
    make_act_text()
    make_act_link()
    make_act_defacement()
    make_act_storage()
    make_act_email()
    make_seq_pemindaian()
    make_seq_crawling()
    make_seq_text()
    make_seq_link()
    make_seq_defacement()
    make_component_diagram()
    make_dsrm_diagram()
    print("ALL 17 FORMAL BLACK-AND-WHITE DIAGRAMS SUCCESSFULLY GENERATED!")
