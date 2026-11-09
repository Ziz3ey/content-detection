# -*- coding: utf-8 -*-
"""
render_canonical_drawio_diagrams.py
Merender 6 diagram kanonikal utama draw.io menjadi PNG resolusi tinggi (300 DPI) dan SVG.
Gaya: Academic Draw.io Pure Black & White (latar putih, garis hitam, teks hitam, font Arial).
Konektor siku-siku (ortogonal), rute rapi terpisah, tidak bertumpuk.
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon
from PIL import Image

OUTPUT_DIR = r"D:\content detection\docs\bab-iv\diagrams"
DPI = 300

def setup_canvas(width_in=10, height_in=7):
    fig, ax = plt.subplots(figsize=(width_in, height_in), dpi=DPI)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    ax.set_xlim(0, 1000)
    ax.set_ylim(0, 1000)
    ax.axis('off')
    return fig, ax

def save_fig(fig, base_name):
    png_path = os.path.join(OUTPUT_DIR, f"{base_name}.png")
    svg_path = os.path.join(OUTPUT_DIR, f"{base_name}.svg")
    fig.savefig(png_path, dpi=DPI, bbox_inches='tight', facecolor='#FFFFFF', edgecolor='none')
    fig.savefig(svg_path, format='svg', bbox_inches='tight', facecolor='#FFFFFF', edgecolor='none')
    plt.close(fig)
    print(f"Rendered: {base_name}.png & {base_name}.svg")

def draw_stick_figure(ax, cx, cy, height=70, label=""):
    # Head
    r = height * 0.16
    head = Circle((cx, cy + height * 0.32), r, facecolor='#FFFFFF', edgecolor='#000000', linewidth=1.4, zorder=5)
    ax.add_patch(head)
    # Body
    ax.plot([cx, cx], [cy + height * 0.16, cy - height * 0.15], color='#000000', linewidth=1.4, zorder=5)
    # Arms
    ax.plot([cx - height * 0.28, cx + height * 0.28], [cy + height * 0.05, cy + height * 0.05], color='#000000', linewidth=1.4, zorder=5)
    # Left Leg
    ax.plot([cx, cx - height * 0.22], [cy - height * 0.15, cy - height * 0.45], color='#000000', linewidth=1.4, zorder=5)
    # Right Leg
    ax.plot([cx, cx + height * 0.22], [cy - height * 0.15, cy - height * 0.45], color='#000000', linewidth=1.4, zorder=5)
    if label:
        ax.text(cx, cy - height * 0.55, label, ha='center', va='top', fontsize=8.5, fontweight='bold', fontfamily='Arial', color='#000000', zorder=6)

def draw_cylinder(ax, x, y, w, h, label=""):
    # Silinder Database Draw.io
    hr = h * 0.2
    # Body
    rect = Rectangle((x, y + hr/2), w, h - hr, facecolor='#FFFFFF', edgecolor='#000000', linewidth=1.2, zorder=3)
    ax.add_patch(rect)
    # Top ellipse
    top_el = patches.Ellipse((x + w/2, y + h - hr/2), w, hr, facecolor='#FFFFFF', edgecolor='#000000', linewidth=1.2, zorder=4)
    ax.add_patch(top_el)
    # Bottom ellipse arc
    bot_el = patches.Arc((x + w/2, y + hr/2), w, hr, theta1=180, theta2=360, edgecolor='#000000', linewidth=1.2, zorder=4)
    ax.add_patch(bot_el)
    if label:
        ax.text(x + w/2, y + h*0.4, label, ha='center', va='center', fontsize=8, fontweight='bold', fontfamily='Arial', color='#000000', zorder=5)

def draw_box(ax, x, y, w, h, text="", header="", rounded=True, fill='#FFFFFF', lw=1.2, zorder=3):
    if rounded:
        p = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2,rounding_size=4", facecolor=fill, edgecolor='#000000', linewidth=lw, zorder=zorder)
    else:
        p = Rectangle((x, y), w, h, facecolor=fill, edgecolor='#000000', linewidth=lw, zorder=zorder)
    ax.add_patch(p)
    if header:
        ax.text(x + 10, y + h - 16, header, ha='left', va='top', fontsize=8.5, fontweight='bold', fontfamily='Arial', color='#000000', zorder=zorder+1)
    if text:
        ty = y + h/2 if not header else y + (h - 20)/2
        ax.text(x + w/2, ty, text, ha='center', va='center', fontsize=8, fontweight='bold', fontfamily='Arial', color='#000000', zorder=zorder+1)

def draw_ortho_arrow(ax, points, label="", dashed=False, lw=1.2, label_offset=(0, 10), open_arrow=False):
    # points: [(x1, y1), (x2, y2), ...]
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    ls = '--' if dashed else '-'
    ax.plot(xs, ys, color='#000000', linestyle=ls, linewidth=lw, zorder=4)
    # Draw arrow at the last segment
    p_last2 = points[-2]
    p_last1 = points[-1]
    dx = p_last1[0] - p_last2[0]
    dy = p_last1[1] - p_last2[1]
    head_l = 10
    head_w = 6
    if dx > 0: # pointing right
        if open_arrow:
            ax.plot([p_last1[0] - head_l, p_last1[0]], [p_last1[1] + head_w, p_last1[1]], color='#000000', lw=lw, zorder=5)
            ax.plot([p_last1[0] - head_l, p_last1[0]], [p_last1[1] - head_w, p_last1[1]], color='#000000', lw=lw, zorder=5)
        else:
            poly = Polygon([[p_last1[0], p_last1[1]], [p_last1[0] - head_l, p_last1[1] + head_w], [p_last1[0] - head_l, p_last1[1] - head_w]], closed=True, facecolor='#000000', edgecolor='#000000', zorder=5)
            ax.add_patch(poly)
    elif dx < 0: # pointing left
        if open_arrow:
            ax.plot([p_last1[0] + head_l, p_last1[0]], [p_last1[1] + head_w, p_last1[1]], color='#000000', lw=lw, zorder=5)
            ax.plot([p_last1[0] + head_l, p_last1[0]], [p_last1[1] - head_w, p_last1[1]], color='#000000', lw=lw, zorder=5)
        else:
            poly = Polygon([[p_last1[0], p_last1[1]], [p_last1[0] + head_l, p_last1[1] + head_w], [p_last1[0] + head_l, p_last1[1] - head_w]], closed=True, facecolor='#000000', edgecolor='#000000', zorder=5)
            ax.add_patch(poly)
    elif dy < 0: # pointing down
        if open_arrow:
            ax.plot([p_last1[0] - head_w, p_last1[0]], [p_last1[1] + head_l, p_last1[1]], color='#000000', lw=lw, zorder=5)
            ax.plot([p_last1[0] + head_w, p_last1[0]], [p_last1[1] + head_l, p_last1[1]], color='#000000', lw=lw, zorder=5)
        else:
            poly = Polygon([[p_last1[0], p_last1[1]], [p_last1[0] - head_w, p_last1[1] + head_l], [p_last1[0] + head_w, p_last1[1] + head_l]], closed=True, facecolor='#000000', edgecolor='#000000', zorder=5)
            ax.add_patch(poly)
    elif dy > 0: # pointing up
        if open_arrow:
            ax.plot([p_last1[0] - head_w, p_last1[0]], [p_last1[1] - head_l, p_last1[1]], color='#000000', lw=lw, zorder=5)
            ax.plot([p_last1[0] + head_w, p_last1[0]], [p_last1[1] - head_l, p_last1[1]], color='#000000', lw=lw, zorder=5)
        else:
            poly = Polygon([[p_last1[0], p_last1[1]], [p_last1[0] - head_w, p_last1[1] - head_l], [p_last1[0] + head_w, p_last1[1] - head_l]], closed=True, facecolor='#000000', edgecolor='#000000', zorder=5)
            ax.add_patch(poly)

    if label:
        mid_idx = len(points) // 2
        mid_p = points[mid_idx]
        ax.text(mid_p[0] + label_offset[0], mid_p[1] + label_offset[1], label, ha='center', va='center', fontsize=7.5, fontweight='bold', fontfamily='Arial', color='#000000', bbox=dict(boxstyle='square,pad=0.2', facecolor='#FFFFFF', edgecolor='none'), zorder=6)


# ==============================================================================
# 1. ARSITEKTUR MICROSERVICES
# ==============================================================================
def render_arsitektur_microservices():
    fig, ax = setup_canvas(10, 7.5)
    # Title
    ax.text(500, 965, "ARSITEKTUR SISTEM MONITORING DAN DETEKSI INDIKASI KONTEN NEGATIF\nBERBASIS ARSITEKTUR MICROSERVICES", ha='center', va='center', fontsize=11, fontweight='bold', fontfamily='Arial')

    # Tier 1: User & Presentation Tier
    draw_box(ax, 50, 780, 900, 140, header="User & Presentation Tier", rounded=False, fill='#FAFAFA', zorder=1)
    draw_stick_figure(ax, 160, 830, height=55, label="Administrator /\nPetugas CSIRT")
    draw_box(ax, 350, 805, 450, 80, text="Dashboard Web Interface (React 18 + Vite)\n[Port: 5173]\nSPA, Responsive UI (Tailwind CSS), Chart.js Monitoring", rounded=True)
    draw_ortho_arrow(ax, [(210, 845), (350, 845)], label="Interaksi Web / HTTPS", label_offset=(0, 10))

    # Tier 2: API Gateway & Orchestrator Tier
    draw_box(ax, 50, 560, 900, 180, header="API Gateway & Orchestration Tier", rounded=False, fill='#FAFAFA', zorder=1)
    draw_box(ax, 280, 580, 580, 125, text="Aggregator Service (Node.js & Express) [Port: 3000]\n• Autentikasi Admin (Scrypt Hash Session Cookie HttpOnly)\n• Scan Coordinator & Background Worker (RFC 5322)\n• Konsolidasi Hasil Inspeksi Detektor & Notifikasi Email", rounded=True)
    draw_ortho_arrow(ax, [(575, 805), (575, 705)], label="REST API (JSON, Cookie Auth) Port 3000", label_offset=(110, 0))

    # Tier 3: Microservices Detection Tier
    draw_box(ax, 50, 310, 900, 210, header="Microservices Detection Tier (Decoupled Services)", rounded=False, fill='#FAFAFA', zorder=1)
    draw_box(ax, 70, 335, 195, 145, text="Crawler Service\n[Port: 3001]\n• Breadth-First Search (BFS)\n• Unduh robots.txt\n• Ekstraksi DOM Cheerio\n• Normalisasi URL Kanonikal", rounded=True)
    draw_box(ax, 290, 335, 195, 145, text="Text Detection Service\n[Port: 3002]\n• Algoritma Aho-Corasick\n• Trie Multi-pola Judol/Porn\n• Konversi Leet-speak\n• Ekstraksi Kalimat Bukti", rounded=True)
    draw_box(ax, 510, 335, 195, 145, text="Link Detection Service\n[Port: 3003]\n• Analisis Heuristik URL\n• Tautan Domain Eksternal\n• Deteksi Form Phishing\n• Concurrency Worker (5)", rounded=True)
    draw_box(ax, 730, 335, 200, 145, text="Defacement Service\n[Port: 3004]\n• DOM Structural Hash\n• Komparasi Similiaritas (dHash)\n• Pembanding Baseline Acuan\n• Deteksi Perubahan Anomali", rounded=True)

    # Arrows from Aggregator to Services
    draw_ortho_arrow(ax, [(380, 580), (380, 530), (170, 530), (170, 480)], label="POST /api/v1/crawl", label_offset=(0, 8))
    draw_ortho_arrow(ax, [(480, 580), (480, 510), (390, 510), (390, 480)], label="POST /api/v1/detect", label_offset=(0, 8))
    draw_ortho_arrow(ax, [(650, 580), (650, 510), (610, 510), (610, 480)], label="POST /api/v1/detect", label_offset=(0, 8))
    draw_ortho_arrow(ax, [(760, 580), (760, 530), (830, 530), (830, 480)], label="POST /api/v1/detect", label_offset=(0, 8))

    # Tier 4: Persistence & External Tier
    draw_box(ax, 50, 60, 900, 210, header="Persistence & External Services Tier", rounded=False, fill='#FAFAFA', zorder=1)
    draw_box(ax, 70, 90, 195, 135, text="Situs Web Target\nPemerintah Kab. Sumbawa\n(*.sumbawakab.go.id)\nInspeksi HTTP/HTTPS", rounded=True)
    draw_box(ax, 340, 90, 210, 135, text="Data Access Package\n(@content-detection/data-access)\n• Scans Repository\n• Scan Jobs Repository\n• Sites & Baselines", rounded=True)
    draw_cylinder(ax, 610, 90, 130, 135, label="Basis Data SQLite\n(scans.db)\nWrite-Ahead Logging")
    draw_box(ax, 780, 90, 150, 135, text="SMTP Server (Gmail)\n[smtp.gmail.com:587]\nTLS / RFC 2822\nNotifikasi Email", rounded=True)

    # Arrows to external & persistence
    draw_ortho_arrow(ax, [(170, 335), (170, 225)], label="HTTP GET (Crawling)", label_offset=(0, 8))
    draw_ortho_arrow(ax, [(575, 580), (575, 270), (445, 270), (445, 225)], label="SQL Operations", label_offset=(0, 8))
    draw_ortho_arrow(ax, [(550, 157), (610, 157)], label="better-sqlite3", label_offset=(0, 10))
    draw_ortho_arrow(ax, [(860, 580), (860, 225)], label="SMTP Port 587", label_offset=(0, 8))

    save_fig(fig, "arsitektur-microservices")


# ==============================================================================
# 2. USE CASE DIAGRAM
# ==============================================================================
def render_use_case_diagram():
    fig, ax = setup_canvas(10.5, 9.5)
    # Title
    ax.text(500, 970, "USE CASE DIAGRAM SISTEM MONITORING DAN DETEKSI INDIKASI KONTEN NEGATIF\nPADA WEBSITE PEMERINTAH KABUPATEN SUMBAWA", ha='center', va='center', fontsize=10.5, fontweight='bold', fontfamily='Arial')

    # System Boundary Box
    draw_box(ax, 230, 40, 540, 900, header="Sistem Monitoring & Deteksi Konten Negatif Pemkab Sumbawa", rounded=False, fill='#FFFFFF', zorder=1)

    # Actors
    draw_stick_figure(ax, 110, 500, height=75, label="Petugas CSIRT /\nAdministrator")
    draw_stick_figure(ax, 890, 710, height=75, label="Website Target\nPemerintah")
    draw_stick_figure(ax, 890, 240, height=75, label="SMTP Server\n(Gmail Notifier)")

    # Use Cases Ovals inside boundary
    def draw_uc_oval(x, y, w, h, text):
        el = patches.Ellipse((x + w/2, y + h/2), w, h, facecolor='#FFFFFF', edgecolor='#000000', linewidth=1.2, zorder=3)
        ax.add_patch(el)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=7.5, fontweight='bold', fontfamily='Arial', color='#000000', zorder=4)

    # Left column UCs (Actor Admin directly accesses)
    draw_uc_oval(260, 820, 190, 50, "Login Administrator\n(Autentikasi Scrypt)")
    draw_uc_oval(260, 740, 190, 50, "Pengelolaan Target Website\n(Registrasi Domain)")
    draw_uc_oval(260, 660, 190, 50, "Pengelolaan Baseline\n(Struktur DOM Acuan)")
    draw_uc_oval(260, 560, 200, 55, "Melakukan Pemindaian Website\n(Mandiri & Asinkron)")
    draw_uc_oval(260, 450, 190, 50, "Melihat Hasil Pemindaian &\nDetail Temuan Indikasi")
    draw_uc_oval(260, 360, 190, 50, "Melihat Riwayat Pemindaian\n(Audit Trail)")
    draw_uc_oval(260, 260, 190, 50, "Ekspor Laporan Pemeriksaan\n(Format PDF & CSV)")

    # Right column UCs (Triggered / Included)
    draw_uc_oval(540, 670, 190, 52, "Perayapan Web (Crawling)\n(BFS & Unduh robots.txt)")
    draw_uc_oval(540, 570, 190, 50, "Deteksi Konten Teks\n(Algoritma Aho-Corasick)")
    draw_uc_oval(540, 480, 190, 50, "Deteksi Tautan Mencurigakan\n(Domain Eksternal)")
    draw_uc_oval(540, 390, 190, 50, "Deteksi Defacement\n(Visual Hash Comparison)")
    draw_uc_oval(540, 290, 190, 50, "Pengiriman Notifikasi Email\n(RFC 2822 / Nodemailer)")

    # Primary Associations (Solid lines, no arrow): Admin -> UCs
    ax.plot([145, 260], [530, 845], color='#000000', lw=1.2, zorder=2) # Login
    ax.plot([145, 260], [520, 765], color='#000000', lw=1.2, zorder=2) # Site
    ax.plot([145, 260], [510, 685], color='#000000', lw=1.2, zorder=2) # Baseline
    ax.plot([145, 260], [500, 587], color='#000000', lw=1.2, zorder=2) # Scan
    ax.plot([145, 260], [490, 475], color='#000000', lw=1.2, zorder=2) # View
    ax.plot([145, 260], [480, 385], color='#000000', lw=1.2, zorder=2) # History

    # Extend: Export -> View
    draw_ortho_arrow(ax, [(355, 310), (355, 450)], label="<<extend>>", dashed=True, open_arrow=True, label_offset=(35, 0))

    # Include: View -> History
    draw_ortho_arrow(ax, [(355, 450), (355, 410)], label="<<include>>", dashed=True, open_arrow=True, label_offset=(35, 0))

    # Include: Scan -> Crawling
    draw_ortho_arrow(ax, [(460, 595), (500, 595), (500, 695), (540, 695)], label="<<include>>", dashed=True, open_arrow=True, label_offset=(0, 10))

    # Includes from Crawling to Detectors & Mail
    draw_ortho_arrow(ax, [(635, 670), (635, 620)], label="<<include>>", dashed=True, open_arrow=True, label_offset=(35, 0))
    draw_ortho_arrow(ax, [(635, 570), (635, 530)], label="<<include>>", dashed=True, open_arrow=True, label_offset=(35, 0))
    draw_ortho_arrow(ax, [(635, 480), (635, 440)], label="<<include>>", dashed=True, open_arrow=True, label_offset=(35, 0))
    draw_ortho_arrow(ax, [(635, 390), (635, 340)], label="<<include>>", dashed=True, open_arrow=True, label_offset=(35, 0))

    # Association to External Actors
    ax.plot([730, 840], [695, 710], color='#000000', lw=1.2, zorder=2) # Crawl -> Target Web
    ax.plot([730, 840], [315, 250], color='#000000', lw=1.2, zorder=2) # Email -> SMTP Server

    save_fig(fig, "use-case-diagram")


# ==============================================================================
# 3. ACTIVITY DIAGRAM (ALUR PEMINDAIAN LENGKAP)
# ==============================================================================
def render_activity_diagram():
    fig, ax = setup_canvas(10.5, 11)
    # Title
    ax.text(500, 975, "ACTIVITY DIAGRAM ALUR PEMINDAIAN DAN DETEKSI INDIKASI KONTEN NEGATIF\n(SISTEM PEMANTAUAN WEBSITE PEMKAB SUMBAWA)", ha='center', va='center', fontsize=10.5, fontweight='bold', fontfamily='Arial')

    # 4 Swimlanes
    lanes = [
        ("Petugas CSIRT / Admin", 40, 220),
        ("Dashboard & Aggregator", 260, 240),
        ("Worker & Detection Services", 500, 260),
        ("Database (SQLite) & SMTP", 760, 200),
    ]
    for ltitle, lx, lw in lanes:
        draw_box(ax, lx, 40, lw, 910, header=ltitle, rounded=False, fill='#FAFAFA', zorder=1)

    # Helper for action boxes
    def act(x, y, w, h, text):
        draw_box(ax, x, y, w, h, text=text, rounded=True, fill='#FFFFFF', zorder=3)

    # Initial Node
    c_init = Circle((150, 905), 12, facecolor='#000000', edgecolor='#000000', zorder=4)
    ax.add_patch(c_init)

    # Nodes
    act(60, 835, 180, 42, "Mengakses Antarmuka\nSistem Pemantauan")
    act(280, 835, 200, 42, "Menampilkan Halaman\nLogin Administrator")
    act(60, 755, 180, 42, "Memasukkan Nama Pengguna\ndan Kata Sandi")
    act(280, 755, 200, 42, "Verifikasi Hash Scrypt &\nValidasi Autentikasi")

    # Diamond Auth
    poly_auth = Polygon([[380, 725], [420, 695], [380, 665], [340, 695]], closed=True, facecolor='#FFFFFF', edgecolor='#000000', lw=1.2, zorder=3)
    ax.add_patch(poly_auth)
    ax.text(380, 695, "Valid?", ha='center', va='center', fontsize=8, fontweight='bold', fontfamily='Arial')

    act(280, 595, 200, 42, "Menampilkan Dashboard Utama\ndan Formulir Pemindaian")
    act(60, 515, 180, 42, "Memasukkan URL Target,\nKedalaman, & Email Petugas")
    act(280, 515, 200, 42, "Validasi Parameter &\nSintaks Email (RFC 5322)")

    # Job Creation in Database
    act(780, 515, 160, 42, "Catat Scan Job Baru\n(Status: running)")

    # Crawling in Detection Services
    act(520, 440, 220, 45, "Crawler Service: Unduh robots.txt,\nUnduh HTML, Ekstraksi BFS")

    # Parallel Fork Bar
    rect_fork = Rectangle((510, 395), 240, 6, facecolor='#000000', edgecolor='#000000', zorder=4)
    ax.add_patch(rect_fork)

    # 3 Parallel Detection branches
    act(515, 310, 72, 65, "Deteksi Teks:\nAho-Corasick\n(Trie Kata\nKunci Judol)")
    act(595, 310, 70, 65, "Deteksi Tautan:\nAnalisis Link\n& Heuristik\nDomain")
    act(672, 310, 72, 65, "Defacement:\nKomparasi\nDOM & Hash\nBaseline")

    # Parallel Join Bar
    rect_join = Rectangle((510, 275), 240, 6, facecolor='#000000', edgecolor='#000000', zorder=4)
    ax.add_patch(rect_join)

    act(280, 205, 200, 42, "Aggregator Service:\nRekapitulasi Seluruh Temuan")
    act(780, 205, 160, 42, "Simpan Rekaman ke SQLite\n(Tabel scans & Update Job)")
    act(780, 135, 160, 42, "Kirim Email Notifikasi Petugas\nvia SMTP Gmail Port 587")
    act(280, 135, 200, 42, "Perbarui Dashboard &\nTampilkan Konfirmasi Email")
    act(60, 135, 180, 42, "Melihat Hasil Deteksi &\nEkspor Laporan (PDF/CSV)")

    # Final Node (Bullseye)
    c_out = Circle((150, 75), 14, facecolor='#FFFFFF', edgecolor='#000000', lw=1.2, zorder=4)
    c_in = Circle((150, 75), 9, facecolor='#000000', edgecolor='#000000', zorder=5)
    ax.add_patch(c_out)
    ax.add_patch(c_in)

    # Orthogonal Arrows
    draw_ortho_arrow(ax, [(150, 893), (150, 877)])
    draw_ortho_arrow(ax, [(240, 856), (280, 856)])
    draw_ortho_arrow(ax, [(380, 835), (380, 805), (150, 805), (150, 797)])
    draw_ortho_arrow(ax, [(240, 776), (280, 776)])
    draw_ortho_arrow(ax, [(380, 755), (380, 725)])
    
    # Auth decision branches
    draw_ortho_arrow(ax, [(420, 695), (460, 695), (460, 776), (480, 776)], label="TIDAK", label_offset=(0, 8))
    draw_ortho_arrow(ax, [(380, 665), (380, 637)], label="YA", label_offset=(15, 0))

    draw_ortho_arrow(ax, [(380, 595), (380, 565), (150, 565), (150, 557)])
    draw_ortho_arrow(ax, [(240, 536), (280, 536)])
    draw_ortho_arrow(ax, [(480, 536), (780, 536)], label="Input Valid", label_offset=(0, 8))
    draw_ortho_arrow(ax, [(860, 515), (860, 462), (740, 462)], label="Dispatch", label_offset=(0, 8))

    # Fork connections
    draw_ortho_arrow(ax, [(630, 440), (630, 401)])
    draw_ortho_arrow(ax, [(551, 395), (551, 375)])
    draw_ortho_arrow(ax, [(630, 395), (630, 375)])
    draw_ortho_arrow(ax, [(708, 395), (708, 375)])

    # Join connections
    draw_ortho_arrow(ax, [(551, 310), (551, 281)])
    draw_ortho_arrow(ax, [(630, 310), (630, 281)])
    draw_ortho_arrow(ax, [(708, 310), (708, 281)])

    draw_ortho_arrow(ax, [(630, 275), (630, 226), (480, 226)])
    draw_ortho_arrow(ax, [(480, 226), (780, 226)], label="Simpan", label_offset=(0, 8))
    draw_ortho_arrow(ax, [(860, 205), (860, 177)], label="Selesai", label_offset=(15, 0))
    draw_ortho_arrow(ax, [(780, 156), (480, 156)], label="Notified", label_offset=(0, 8))
    draw_ortho_arrow(ax, [(280, 156), (240, 156)])
    draw_ortho_arrow(ax, [(150, 135), (150, 89)])

    save_fig(fig, "activity-diagram")


# ==============================================================================
# 4. SEQUENCE DIAGRAM
# ==============================================================================
def render_sequence_diagram():
    fig, ax = setup_canvas(11, 8.5)
    # Title
    ax.text(500, 970, "SEQUENCE DIAGRAM INTERAKSI KOMPREHENSIF PEMINDAIAN SITUS WEB\nPADA ARSITEKTUR MICROSERVICES PEMKAB SUMBAWA", ha='center', va='center', fontsize=10.5, fontweight='bold', fontfamily='Arial')

    participants = [
        ("Petugas\nCSIRT", 80, "actor"),
        ("Dashboard\n(React :5173)", 200, "rect"),
        ("Aggregator\n(Core :3000)", 330, "rect"),
        ("Crawler\nSvc (:3001)", 460, "rect"),
        ("Text Det\nSvc (:3002)", 590, "rect"),
        ("Link Det\nSvc (:3003)", 710, "rect"),
        ("Defacement\nSvc (:3004)", 830, "rect"),
        ("SQLite DB\n(scans.db)", 940, "cylinder"),
    ]

    # Draw header and lifelines
    for lbl, x, kind in participants:
        if kind == "actor":
            draw_stick_figure(ax, x, 905, height=45, label=lbl)
            top_y = 875
        elif kind == "cylinder":
            draw_cylinder(ax, x - 35, 880, 70, 50, label=lbl)
            top_y = 880
        else:
            draw_box(ax, x - 45, 880, 90, 50, text=lbl, rounded=False)
            top_y = 880

        # Lifeline
        ax.plot([x, x], [top_y, 70], color='#000000', linestyle='--', linewidth=1, zorder=2)

    # Messages
    msgs = [
        (80, 200, 830, "1: Input URL & Klik Pindai", False),
        (200, 330, 790, "2: POST /api/v1/scan (url, email)", False),
        (330, 940, 750, "3: createScanJob(status='running')", False),
        (940, 330, 720, "4: 201 Created (jobId)", True),
        (330, 200, 690, "5: 202 Accepted (Background Worker)", True),
        (330, 460, 650, "6: POST /api/v1/crawl (startUrl, BFS)", False),
        (460, 330, 610, "7: 200 OK (pages: [{html, text, links}])", True),
        # Parallel calls
        (330, 590, 560, "8: POST /api/v1/detect (text, leet)", False),
        (330, 710, 530, "9: POST /api/v1/detect (links)", False),
        (330, 830, 500, "10: POST /api/v1/detect (DOM hash)", False),
        (590, 330, 460, "11: 200 OK (Aho-Corasick matches)", True),
        (710, 330, 430, "12: 200 OK (suspiciousDomain)", True),
        (830, 330, 400, "13: 200 OK (visualDiffRatio)", True),
        (330, 940, 350, "14: createMany(records) & updateJob(completed)", False),
        (940, 330, 320, "15: Persisted in SQLite", True),
        (330, 200, 270, "16: Push Event / Polling Response", True),
        (200, 80, 230, "17: Tampilkan Hasil & Spanduk Email", False),
    ]

    for x1, x2, y, txt, is_dash in msgs:
        draw_ortho_arrow(ax, [(x1, y), (x2, y)], label=txt, dashed=is_dash, label_offset=(0, 8), open_arrow=is_dash)

    save_fig(fig, "sequence-diagram")


# ==============================================================================
# 5. COMPONENT DIAGRAM
# ==============================================================================
def render_component_diagram():
    fig, ax = setup_canvas(10.5, 7.5)
    ax.text(500, 965, "COMPONENT DIAGRAM ARSITEKTUR PERANGKAT LUNAK SISTEM PEMANTAUAN\nDAN DETEKSI KONTEN NEGATIF BERBASIS MICROSERVICES", ha='center', va='center', fontsize=10.5, fontweight='bold', fontfamily='Arial')

    def draw_component(x, y, w, h, title, sub=""):
        p = Rectangle((x, y), w, h, facecolor='#FFFFFF', edgecolor='#000000', linewidth=1.2, zorder=3)
        ax.add_patch(p)
        # Small component tabs on top left
        t1 = Rectangle((x - 8, y + h - 18), 16, 7, facecolor='#FFFFFF', edgecolor='#000000', linewidth=1, zorder=4)
        t2 = Rectangle((x - 8, y + h - 32), 16, 7, facecolor='#FFFFFF', edgecolor='#000000', linewidth=1, zorder=4)
        ax.add_patch(t1)
        ax.add_patch(t2)
        ax.text(x + w/2, y + h*0.62, f"«component»\n{title}", ha='center', va='center', fontsize=8.5, fontweight='bold', fontfamily='Arial', zorder=5)
        if sub:
            ax.text(x + w/2, y + h*0.25, sub, ha='center', va='center', fontsize=7.5, fontfamily='Arial', color='#333333', zorder=5)

    # Components
    draw_component(50, 770, 220, 80, "Dashboard UI", "React 18 + Vite [Port 5173]")
    draw_component(420, 770, 250, 85, "Aggregator Service", "Express Core Gateway [Port 3000]")
    draw_component(770, 770, 180, 80, "SMTP Mailer", "Nodemailer Client [Port 587]")

    draw_component(50, 520, 200, 80, "Crawler Service", "Axios / Cheerio [Port 3001]")
    draw_component(280, 520, 200, 80, "Text Detection Service", "Aho-Corasick Engine [Port 3002]")
    draw_component(510, 520, 200, 80, "Link Detection Service", "Heuristic Parser [Port 3003]")
    draw_component(740, 520, 210, 80, "Defacement Service", "DOM Structure Hash [Port 3004]")

    draw_component(350, 280, 280, 80, "Data Access Package", "@content-detection/data-access")
    draw_cylinder(ax, 720, 280, 150, 80, label="Basis Data SQLite\n(scans.db)")
    draw_component(50, 280, 200, 80, "Situs Web Pemerintah", "*.sumbawakab.go.id (Target)")

    # Dependencies (Dashed with open arrows)
    draw_ortho_arrow(ax, [(270, 810), (420, 810)], label="«use» REST API", dashed=True, open_arrow=True, label_offset=(0, 10))
    draw_ortho_arrow(ax, [(670, 810), (770, 810)], label="«use» SMTP TLS", dashed=True, open_arrow=True, label_offset=(0, 10))

    draw_ortho_arrow(ax, [(470, 770), (470, 680), (150, 680), (150, 600)], label="«use» :3001", dashed=True, open_arrow=True, label_offset=(0, 8))
    draw_ortho_arrow(ax, [(510, 770), (510, 650), (380, 650), (380, 600)], label="«use» :3002", dashed=True, open_arrow=True, label_offset=(0, 8))
    draw_ortho_arrow(ax, [(570, 770), (570, 650), (610, 650), (610, 600)], label="«use» :3003", dashed=True, open_arrow=True, label_offset=(0, 8))
    draw_ortho_arrow(ax, [(620, 770), (620, 680), (845, 680), (845, 600)], label="«use» :3004", dashed=True, open_arrow=True, label_offset=(0, 8))

    draw_ortho_arrow(ax, [(545, 770), (545, 360)], label="«use» Repository Interface", dashed=True, open_arrow=True, label_offset=(40, 0))
    draw_ortho_arrow(ax, [(630, 320), (720, 320)], label="better-sqlite3", dashed=True, open_arrow=True, label_offset=(0, 10))
    draw_ortho_arrow(ax, [(150, 520), (150, 360)], label="«use» HTTP GET", dashed=True, open_arrow=True, label_offset=(0, 10))

    save_fig(fig, "component-diagram")


# ==============================================================================
# 6. DIAGRAM METODE DSRM
# ==============================================================================
def render_diagram_metode_dsrm():
    fig, ax = setup_canvas(10.5, 9.5)
    ax.text(500, 970, "ALUR PENELITIAN DESIGN SCIENCE RESEARCH METHODOLOGY (DSRM)\nSISTEM PEMANTAUAN DAN DETEKSI KONTEN NEGATIF PEMKAB SUMBAWA", ha='center', va='center', fontsize=10.5, fontweight='bold', fontfamily='Arial')

    stages = [
        (850, "Fase 1: Identifikasi Masalah dan Motivasi (Problem Identification and Motivation)",
         "• Maraknya penyusupan konten judi online, pornografi teks, dan defacement pada website resmi Pemkab Sumbawa.\n• Ketiadaan sistem pemantauan otomatis terdistribusi dengan algoritma pencocokan multi-pola akurat."),

        (710, "Fase 2: Penentuan Tujuan Solusi (Define the Objectives of a Solution)",
         "• Merancang sistem inspeksi berbasis arsitektur microservices independen (Crawler, Text, Link, Defacement, Aggregator).\n• Mengintegrasikan algoritma Aho-Corasick, normalisasi leet-speak, deteksi tautan heuristik, dan notifikasi email petugas."),

        (560, "Fase 3: Perancangan dan Pengembangan (Design and Development)",
         "• Pemodelan diagram Unified Modeling Language (UML): Use Case, Activity, Sequence, dan Component Diagram.\n• Implementasi 5 microservices Node.js, pustaka data-access SQLite, dan Dashboard React UI."),

        (420, "Fase 4: Demonstrasi (Demonstration)",
         "• Uji pemindaian langsung pada situs riil Pemerintah Kabupaten Sumbawa (sumbawakab.go.id, uts.ac.id, dll.).\n• Verifikasi fungsionalitas background scanning worker dan pengiriman notifikasi surel terotomasi."),

        (270, "Fase 5: Evaluasi (Evaluation)",
         "• Pengujian empiris 50 sampel dataset (25 normal resmi Pemkab Sumbawa + 25 sampel indikasi konten negatif).\n• Analisis Confusion Matrix: TP=25, TN=25, FP=0, FN=0, Akurasi 100%, Presisi 100%, Recall 100%, F1-Score 100%.\n• Pengujian kehandalan seluruh unit melalui 214 automated test suite."),

        (120, "Fase 6: Komunikasi (Communication)",
         "• Penyusunan dokumen laporan skripsi lengkap (BAB I s/d BAB V) sesuai standar Universitas Teknologi Sumbawa.\n• Pelaporan hasil penelitian dan rekomendasi keamanan siber bagi pengelola domain publik Kabupaten Sumbawa."),
    ]

    for y, title, desc in stages:
        draw_box(ax, 160, y, 780, 95, header=title, rounded=True, fill='#FFFFFF')
        ax.text(180, y + 42, desc, ha='left', va='center', fontsize=7.5, fontfamily='Arial', color='#222222', zorder=5)

    # Sequential arrows
    draw_ortho_arrow(ax, [(550, 850), (550, 805)])
    draw_ortho_arrow(ax, [(550, 710), (550, 655)])
    draw_ortho_arrow(ax, [(550, 560), (550, 515)])
    draw_ortho_arrow(ax, [(550, 420), (550, 365)])
    draw_ortho_arrow(ax, [(550, 270), (550, 215)])

    # Feedback Loop: Fase 5 (Evaluasi) -> Fase 3 (Perancangan & Pengembangan)
    draw_ortho_arrow(ax, [(160, 317), (90, 317), (90, 607), (160, 607)],
                     label="Iterasi Perbaikan Pola Deteksi (Feedback Loop)",
                     dashed=True, open_arrow=True, label_offset=(65, 0))

    save_fig(fig, "diagram-metode-dsrm")


def main():
    print("Memulai render 6 diagram kanonikal utama draw.io...")
    render_arsitektur_microservices()
    render_use_case_diagram()
    render_activity_diagram()
    render_sequence_diagram()
    render_component_diagram()
    render_diagram_metode_dsrm()
    print("SELESAI! Seluruh 6 diagram kanonikal berhasil dirender ke PNG (300 DPI) dan SVG.")

if __name__ == "__main__":
    main()
