import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Ellipse, Rectangle, Polygon

BASE_DIR = r'D:\content detection\docs\bab-iv\diagrams'

def save_diagram(fig, rel_path, dpi=300):
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    fig.savefig(full_path, dpi=dpi, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close(fig)
    print(f"Generated: {rel_path}")

def save_source(puml_content, rel_path):
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(puml_content)

# Helper function to draw an activity node
def draw_act_node(ax, xy, w, h, text, color='#EFF6FF', ec='#2563EB', text_color='#1E3A8A', fs=8):
    box = FancyBboxPatch((xy[0]-w/2, xy[1]-h/2), w, h, boxstyle="round,pad=0.3", fc=color, ec=ec, lw=1.5)
    ax.add_patch(box)
    ax.text(xy[0], xy[1], text, ha='center', va='center', fontsize=fs, fontweight='bold', color=text_color)

def draw_act_decision(ax, xy, w, h, text, color='#FEF9C3', ec='#CA8A04', text_color='#854D0E', fs=7.5):
    pts = [[xy[0], xy[1]+h/2], [xy[0]+w/2, xy[1]], [xy[0], xy[1]-h/2], [xy[0]-w/2, xy[1]]]
    poly = Polygon(pts, closed=True, fc=color, ec=ec, lw=1.5)
    ax.add_patch(poly)
    ax.text(xy[0], xy[1], text, ha='center', va='center', fontsize=fs, fontweight='bold', color=text_color)

def draw_start_node(ax, xy, r=2):
    c = plt.Circle(xy, r, color='#0F172A', fill=True)
    ax.add_patch(c)

def draw_end_node(ax, xy, r=2.2):
    c1 = plt.Circle(xy, r, color='none', ec='#0F172A', lw=1.5)
    c2 = plt.Circle(xy, r*0.6, color='#0F172A', fill=True)
    ax.add_patch(c1)
    ax.add_patch(c2)

def draw_flow_arrow(ax, p1, p2, label=None, label_offset=(0, 1.5)):
    ax.annotate('', xy=p2, xytext=p1,
                arrowprops=dict(arrowstyle="->", color='#334155', lw=1.5, shrinkA=2, shrinkB=2))
    if label:
        mid = ((p1[0]+p2[0])/2 + label_offset[0], (p1[1]+p2[1])/2 + label_offset[1])
        ax.text(mid[0], mid[1], label, fontsize=7, ha='center', va='center', backgroundcolor='white', color='#334155', fontweight='bold')

# -----------------------------------------------------------------------------
# 3. ACTIVITY DIAGRAMS (Gambar 4.3 s/d 4.10)
# -----------------------------------------------------------------------------

# Gambar 4.3: Activity Diagram Login
def make_activity_login():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Activity Diagram Login Administrator", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    # Swimlanes
    ax.plot([50, 50], [5, 93], color='#CBD5E1', lw=1.5, linestyle='--')
    ax.text(25, 93, "Pengguna / Administrator", ha='center', va='center', fontsize=10, fontweight='bold', color='#2563EB')
    ax.text(75, 93, "Sistem (Dashboard & Aggregator)", ha='center', va='center', fontsize=10, fontweight='bold', color='#059669')

    draw_start_node(ax, (25, 88))
    draw_act_node(ax, (25, 78), 36, 8, "Membuka Halaman Login\n(http://localhost:5173/#/login)")
    draw_act_node(ax, (75, 78), 36, 8, "Menampilkan Form Login\n(Input User & Kata Sandi)")
    draw_act_node(ax, (25, 64), 36, 8, "Memasukkan Username\ndan Kata Sandi")
    draw_act_node(ax, (25, 52), 36, 7, "Menekan Tombol\n'Masuk ke Dashboard'")
    draw_act_node(ax, (75, 52), 38, 8, "Memeriksa Kredensial via API\n(Scrypt Hash Comparison)")
    draw_act_decision(ax, (75, 36), 26, 12, "Kredensial\nValid?")
    draw_act_node(ax, (75, 20), 38, 8, "Generate Session Token,\nSet HTTP-Only Cookie", color='#DCFCE7', ec='#16A34A', text_color='#14532D')
    draw_act_node(ax, (25, 20), 36, 8, "Mengalihkan ke Halaman\nDashboard Utama", color='#DCFCE7', ec='#16A34A', text_color='#14532D')
    draw_end_node(ax, (25, 9))

    # Flow arrows
    draw_flow_arrow(ax, (25, 86), (25, 82))
    draw_flow_arrow(ax, (43, 78), (57, 78))
    draw_flow_arrow(ax, (75, 74), (75, 68))
    draw_flow_arrow(ax, (75, 68), (43, 64))
    draw_flow_arrow(ax, (25, 60), (25, 55.5))
    draw_flow_arrow(ax, (43, 52), (56, 52))
    draw_flow_arrow(ax, (75, 48), (75, 42))
    draw_flow_arrow(ax, (75, 30), (75, 24), "[Ya]")
    draw_flow_arrow(ax, (56, 20), (43, 20))
    draw_flow_arrow(ax, (25, 16), (25, 11.5))
    
    # Reject loop
    ax.annotate('', xy=(75, 74), xytext=(88, 36),
                arrowprops=dict(arrowstyle="->", color='#E11D48', lw=1.5, connectionstyle="arc3,rad=-0.4"))
    ax.text(95, 55, "[Tidak]\nTampilkan\nAlert Error", fontsize=7.5, color='#BE123C', ha='center')

    save_diagram(fig, 'activity/gambar-4.3-activity-diagram-login.png')
    save_source("""@startuml
!theme plain
|Pengguna / Admin|
start
:Buka Halaman Login;
|Sistem|
:Tampilkan Form Login;
|Pengguna / Admin|
:Input Username & Password;
:Klik 'Masuk ke Dashboard';
|Sistem|
:Validasi Scrypt Hash;
if (Kredensial Valid?) then (Ya)
  :Generate Session Token & Cookie;
  |Pengguna / Admin|
  :Akses Dashboard Utama;
  stop
else (Tidak)
  |Sistem|
  :Tampilkan Pesan Kesalahan;
  detach
endif
@enduml
""", 'activity/gambar-4.3-activity-diagram-login.puml')

# Gambar 4.4: Activity Diagram Pemindaian Website
def make_activity_scan():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Activity Diagram Pemindaian Website (Background Scanning)", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    # Swimlanes
    ax.plot([50, 50], [5, 93], color='#CBD5E1', lw=1.5, linestyle='--')
    ax.text(25, 93, "Petugas CSIRT", ha='center', va='center', fontsize=10, fontweight='bold', color='#2563EB')
    ax.text(75, 93, "Sistem (Aggregator & Worker)", ha='center', va='center', fontsize=10, fontweight='bold', color='#059669')

    draw_start_node(ax, (25, 88))
    draw_act_node(ax, (25, 80), 38, 7, "Pilih Menu Pemindaian")
    draw_act_node(ax, (25, 70), 38, 8, "Input Target URL, Max Pages,\nMax Depth & Email Petugas")
    draw_act_node(ax, (25, 58), 38, 7, "Klik 'Mulai Pemindaian'")
    draw_act_node(ax, (75, 58), 38, 8, "Validasi Format Input\n& Email (RFC 5322)")
    draw_act_decision(ax, (75, 46), 26, 10, "Format\nValid?")
    draw_act_node(ax, (75, 33), 38, 9, "Buat Job ID di SQLite,\nJalankan Worker (HTTP 202)")
    draw_act_node(ax, (25, 33), 38, 9, "Tampilkan Banner Progress,\nBoleh Tutup Browser/Laptop", color='#FEF3C7', ec='#D97706', text_color='#92400E')
    draw_act_node(ax, (75, 19), 38, 8, "Proses Crawling, Deteksi,\n& Kirim Laporan ke Email", color='#DCFCE7', ec='#16A34A', text_color='#14532D')
    draw_end_node(ax, (75, 8))

    draw_flow_arrow(ax, (25, 86), (25, 83.5))
    draw_flow_arrow(ax, (25, 76.5), (25, 74))
    draw_flow_arrow(ax, (25, 66), (25, 61.5))
    draw_flow_arrow(ax, (44, 58), (56, 58))
    draw_flow_arrow(ax, (75, 54), (75, 51))
    draw_flow_arrow(ax, (75, 41), (75, 37.5), "[Ya]")
    draw_flow_arrow(ax, (56, 33), (44, 33))
    draw_flow_arrow(ax, (75, 28.5), (75, 23))
    draw_flow_arrow(ax, (75, 15), (75, 10.5))

    # Reject
    ax.annotate('', xy=(44, 70), xytext=(88, 46),
                arrowprops=dict(arrowstyle="->", color='#E11D48', lw=1.5, connectionstyle="arc3,rad=-0.4"))
    ax.text(94, 60, "[Tidak]\nTampilkan\nWarning", fontsize=7.5, color='#BE123C', ha='center')

    save_diagram(fig, 'activity/gambar-4.4-activity-diagram-pemindaian.png')
    save_source("""@startuml
!theme plain
|Petugas CSIRT|
start
:Buka Menu Pemindaian;
:Input URL, Kedalaman, Batas Halaman, & Email Petugas;
:Klik 'Mulai Pemindaian';
|Sistem|
:Validasi Input & Format Email;
if (Valid?) then (Ya)
  :Generate Job ID di Database;
  :Kirim Respon HTTP 202 Accepted;
  fork
    |Petugas CSIRT|
    :Terima Notifikasi Job Berjalan;
    :Dapat Menutup Browser/Laptop;
  fork again
    |Sistem|
    :Jalankan Background Worker;
    :Proses Crawling & Deteksi Paralel;
    :Simpan Hasil ke SQLite;
    :Kirim Email Laporan ke Petugas;
  end fork
  stop
else (Tidak)
  :Tampilkan Peringatan Validasi;
  detach
endif
@enduml
""", 'activity/gambar-4.4-activity-diagram-pemindaian.puml')

# Gambar 4.5: Activity Diagram Web Crawling
def make_activity_crawling():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Activity Diagram Proses Web Crawling", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    draw_start_node(ax, (50, 92))
    draw_act_node(ax, (50, 84), 44, 7, "Terima Request Crawling (Start URL, Limits)")
    draw_act_node(ax, (50, 74), 44, 7, "Inisialisasi Antrean URL & Visited Set")
    draw_act_decision(ax, (50, 63), 32, 9, "Host Masuk\nAllowedHosts?")
    draw_act_node(ax, (50, 50), 44, 8, "Periksa Robots.txt Target\n(Patuhi Direktif Disallow)")
    draw_act_node(ax, (50, 38), 44, 8, "Fetch Halaman via HTTP (Axios/Fetch)\nIkuti Redirect 301/302 Kanonikal")
    draw_act_node(ax, (50, 26), 46, 9, "Parser HTML (Cheerio):\nEkstrak Teks, Img Alt/Title, & Links")
    draw_act_node(ax, (50, 14), 44, 7, "Kembalikan Array Halaman ke Aggregator", color='#DCFCE7', ec='#16A34A', text_color='#14532D')
    draw_end_node(ax, (50, 6))

    draw_flow_arrow(ax, (50, 90), (50, 87.5))
    draw_flow_arrow(ax, (50, 80.5), (50, 77.5))
    draw_flow_arrow(ax, (50, 70.5), (50, 67.5))
    draw_flow_arrow(ax, (50, 58.5), (50, 54), "[Ya]")
    draw_flow_arrow(ax, (50, 46), (50, 42))
    draw_flow_arrow(ax, (50, 34), (50, 30.5))
    draw_flow_arrow(ax, (50, 21.5), (50, 17.5))
    draw_flow_arrow(ax, (50, 10.5), (50, 8.2))

    # Reject branch
    draw_act_node(ax, (85, 63), 24, 7, "Tolak Request\n(SSRF Block)", color='#FEE2E2', ec='#EF4444', text_color='#991B1B', fs=7)
    draw_flow_arrow(ax, (66, 63), (73, 63), "[Tidak]")
    draw_end_node(ax, (85, 52))
    draw_flow_arrow(ax, (85, 59.5), (85, 54.2))

    save_diagram(fig, 'activity/gambar-4.5-activity-diagram-web-crawling.png')
    save_source("""@startuml
!theme plain
start
:Terima Request Crawling;
:Inisialisasi Antrean URL;
if (Host Termasuk Whitelist?) then (Ya)
  :Cek Direktif Robots.txt;
  :Fetch Konten Halaman;
  :Normalisasi URL & Redirect;
  :Parse DOM (Teks, Tag Gambar, Link);
  :Kirim Hasil Halaman ke Aggregator;
  stop
else (Tidak)
  :Tolak Request (SSRF Protection);
  stop
endif
@enduml
""", 'activity/gambar-4.5-activity-diagram-web-crawling.puml')

# Gambar 4.6: Activity Diagram Deteksi Teks Aho-Corasick
def make_activity_text_detection():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Activity Diagram Deteksi Konten Negatif (Aho-Corasick)", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    draw_start_node(ax, (50, 92))
    draw_act_node(ax, (50, 84), 46, 7, "Terima Ekstraksi Teks Halaman")
    draw_act_node(ax, (50, 74), 46, 7, "Normalisasi Teks (Case Folding & Trim)")
    draw_act_node(ax, (50, 63), 46, 8, "Traverse Trie Tree Karakter per Karakter\n(Root Transitions)")
    draw_act_decision(ax, (50, 50), 30, 9, "Karakter Cocok?")
    draw_act_node(ax, (26, 37), 36, 7, "Ikuti Transisi Node Anak")
    draw_act_node(ax, (74, 37), 36, 7, "Ikuti Failure Link (BFS Link)")
    draw_act_node(ax, (50, 24), 46, 8, "Periksa Output Dictionary & Word Boundary\n(Cegah False Alarm Substring)")
    draw_act_node(ax, (50, 13), 46, 7, "Kelompokkan Temuan per Kategori (Judi, Phishing, Porno)", color='#DCFCE7', ec='#16A34A', text_color='#14532D')
    draw_end_node(ax, (50, 5))

    draw_flow_arrow(ax, (50, 90), (50, 87.5))
    draw_flow_arrow(ax, (50, 80.5), (50, 77.5))
    draw_flow_arrow(ax, (50, 70.5), (50, 67))
    draw_flow_arrow(ax, (50, 59), (50, 54.5))
    draw_flow_arrow(ax, (35, 50), (26, 40.5), "[Ya]")
    draw_flow_arrow(ax, (65, 50), (74, 40.5), "[Tidak]")
    draw_flow_arrow(ax, (26, 33.5), (42, 28))
    draw_flow_arrow(ax, (74, 33.5), (58, 28))
    draw_flow_arrow(ax, (50, 20), (50, 16.5))
    draw_flow_arrow(ax, (50, 9.5), (50, 7.2))

    save_diagram(fig, 'activity/gambar-4.6-activity-diagram-deteksi-teks.png')
    save_source("""@startuml
!theme plain
start
:Terima Teks Halaman;
:Normalisasi Teks (Lowercase, Trim);
:Bangun Trie & Failure Links;
:Iterasi Karakter Teks;
if (Karakter Cocok?) then (Ya)
  :Pindah ke Node Anak;
else (Tidak)
  :Lompat ke Failure Link;
endif
:Cek Output Dictionary;
if (Cocok & Word Boundary Valid?) then (Ya)
  :Catat Temuan Pola;
  :Kelompokkan Kategori (Judi, Penipuan, Pornografi);
endif
:Kirim Hasil Deteksi ke Aggregator;
stop
@enduml
""", 'activity/gambar-4.6-activity-diagram-deteksi-teks.puml')

# Gambar 4.7: Activity Diagram Deteksi Tautan
def make_activity_link():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Activity Diagram Deteksi Tautan Mencurigakan", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    draw_start_node(ax, (50, 92))
    draw_act_node(ax, (50, 84), 44, 7, "Terima Daftar Tautan (href) Halaman")
    draw_act_node(ax, (50, 73), 44, 7, "Parsing Komponen URL (Host, Path, Port)")
    draw_act_node(ax, (50, 61), 46, 8, "Uji Heuristik 1: Cek Format IP Mentah\n(Contoh: http://192.168.1.1)")
    draw_act_node(ax, (50, 49), 46, 8, "Uji Heuristik 2: Hitung Kedalaman Subdomain\n& Karakter Berulang (---)")
    draw_act_node(ax, (50, 37), 46, 8, "Uji Heuristik 3: Cek Sensitive Paths\n(Contoh: /wp-admin/, .env, /shell.php)")
    draw_act_decision(ax, (50, 24), 28, 9, "Anomali\nTerdeteksi?")
    draw_act_node(ax, (26, 12), 34, 7, "Beri Label 'SUSPICIOUS_LINK'\nSertakan Alasan Spesifik", color='#FEE2E2', ec='#EF4444', text_color='#991B1B')
    draw_act_node(ax, (74, 12), 34, 7, "Tandai Tautan Bersih\n(No Anomaly)", color='#DCFCE7', ec='#16A34A', text_color='#14532D')
    draw_end_node(ax, (50, 4))

    draw_flow_arrow(ax, (50, 90), (50, 87.5))
    draw_flow_arrow(ax, (50, 80.5), (50, 76.5))
    draw_flow_arrow(ax, (50, 69.5), (50, 65))
    draw_flow_arrow(ax, (50, 57), (50, 53))
    draw_flow_arrow(ax, (50, 45), (50, 41))
    draw_flow_arrow(ax, (50, 33), (50, 28.5))
    draw_flow_arrow(ax, (36, 24), (26, 15.5), "[Ya]")
    draw_flow_arrow(ax, (64, 24), (74, 15.5), "[Tidak]")
    draw_flow_arrow(ax, (26, 8.5), (46, 4))
    draw_flow_arrow(ax, (74, 8.5), (54, 4))

    save_diagram(fig, 'activity/gambar-4.7-activity-diagram-deteksi-tautan.png')
    save_source("""@startuml
!theme plain
start
:Terima Daftar URL Halaman;
:Parse Struktur URL;
:Periksa Format Host (IP Mentah vs Domain);
:Hitung Jumlah Label Subdomain;
:Pindai Sensitive Path (/wp-admin/, .env);
if (Terindikasi Anomali?) then (Ya)
  :Tandai SUSPICIOUS_LINK;
  :Catat Kode Alasan Heuristik;
else (Tidak)
  :Tandai Tautan Normal;
endif
:Kembalikan Hasil ke Aggregator;
stop
@enduml
""", 'activity/gambar-4.7-activity-diagram-deteksi-tautan.puml')

# Gambar 4.8: Activity Diagram Defacement
def make_activity_defacement():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Activity Diagram Deteksi Defacement & Baseline Diff", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    draw_start_node(ax, (50, 92))
    draw_act_node(ax, (50, 83), 44, 7, "Terima URL, Title, & HTML Halaman")
    draw_act_decision(ax, (50, 71), 28, 9, "Baseline\nTersedia?")
    draw_act_node(ax, (80, 59), 30, 7, "Kembalikan Status:\nSKIPPED (NO_BASELINE)", color='#FEF3C7', ec='#D97706', text_color='#92400E')
    draw_act_node(ax, (30, 59), 42, 8, "Ambil Hash Baseline & Hitung\nHash SHA-256 DOM Baru")
    draw_act_node(ax, (30, 46), 42, 8, "Periksa Kesamaan Judul (Title)\n& Struktur Elemen Tag")
    draw_act_decision(ax, (30, 32), 26, 9, "Hash/Title\nBerubah?")
    draw_act_node(ax, (14, 18), 24, 7, "Tandai Indikasi\nDefacement", color='#FEE2E2', ec='#EF4444', text_color='#991B1B')
    draw_act_node(ax, (46, 18), 24, 7, "Integritas Valid\n(Unchanged)", color='#DCFCE7', ec='#16A34A', text_color='#14532D')
    draw_end_node(ax, (50, 6))

    draw_flow_arrow(ax, (50, 90), (50, 86.5))
    draw_flow_arrow(ax, (50, 79.5), (50, 75.5))
    draw_flow_arrow(ax, (64, 71), (80, 62.5), "[Tidak]")
    draw_flow_arrow(ax, (36, 71), (30, 63), "[Ya]")
    draw_flow_arrow(ax, (30, 55), (30, 50))
    draw_flow_arrow(ax, (30, 42), (30, 36.5))
    draw_flow_arrow(ax, (17, 32), (14, 21.5), "[Ya]")
    draw_flow_arrow(ax, (43, 32), (46, 21.5), "[Tidak]")
    draw_flow_arrow(ax, (80, 55.5), (54, 7.5))
    draw_flow_arrow(ax, (14, 14.5), (46, 6))
    draw_flow_arrow(ax, (46, 14.5), (49, 7.5))

    save_diagram(fig, 'activity/gambar-4.8-activity-diagram-deteksi-defacement.png')
    save_source("""@startuml
!theme plain
start
:Terima Konten HTML & Title Halaman;
if (Baseline Tersedia di DB?) then (Ya)
  :Hitung Hash SHA-256 DOM Saat Ini;
  :Bandingkan Title & Struktur Tag;
  if (Hash atau Title Berubah Signifikan?) then (Ya)
    :Tandai Indikasi DEFACEMENT;
  else (Tidak)
    :Tandai Halaman UTUH (Unchanged);
  endif
else (Tidak)
  :Kembalikan Status SKIPPED (NO_BASELINE);
endif
:Kirim Hasil ke Aggregator;
stop
@enduml
""", 'activity/gambar-4.8-activity-diagram-deteksi-defacement.puml')

# Gambar 4.9: Activity Diagram Penyimpanan Hasil
def make_activity_storage():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Activity Diagram Penyimpanan dan Penampilan Hasil", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    draw_start_node(ax, (50, 92))
    draw_act_node(ax, (50, 83), 44, 7, "Aggregator Mengumpulkan Respon 3 Detektor")
    draw_act_node(ax, (50, 72), 44, 7, "Buka Transaksi Basis Data (better-sqlite3)")
    draw_act_node(ax, (50, 61), 46, 7, "Insert Record Scan ke Tabel 'scans'")
    draw_act_node(ax, (50, 50), 46, 7, "Insert Detail Halaman ke Tabel 'scan_pages'")
    draw_act_node(ax, (50, 39), 46, 7, "Insert Rincian Indikasi ke 'scan_findings'")
    draw_act_node(ax, (50, 28), 44, 7, "Commit Transaksi Database (ACID Safe)")
    draw_act_node(ax, (50, 17), 46, 7, "Dashboard Polling Menerima Status 'COMPLETED'", color='#DCFCE7', ec='#16A34A', text_color='#14532D')
    draw_end_node(ax, (50, 7))

    draw_flow_arrow(ax, (50, 90), (50, 86.5))
    draw_flow_arrow(ax, (50, 79.5), (50, 75.5))
    draw_flow_arrow(ax, (50, 68.5), (50, 64.5))
    draw_flow_arrow(ax, (50, 57.5), (50, 53.5))
    draw_flow_arrow(ax, (50, 46.5), (50, 42.5))
    draw_flow_arrow(ax, (50, 35.5), (50, 31.5))
    draw_flow_arrow(ax, (50, 24.5), (50, 20.5))
    draw_flow_arrow(ax, (50, 13.5), (50, 9.5))

    save_diagram(fig, 'activity/gambar-4.9-activity-diagram-penyimpanan-hasil.png')
    save_source("""@startuml
!theme plain
start
:Kumpulkan Hasil Seluruh Layanan Deteksi;
:Buka Transaksi SQLite;
:Simpan Ringkasan ke Tabel 'scans';
:Simpan Rincian ke Tabel 'scan_pages';
:Simpan Temuan ke Tabel 'scan_findings';
:Commit Transaksi (ACID);
:Update Status Job Menjadi 'COMPLETED';
:Kirim Data ke Dashboard via Polling API;
stop
@enduml
""", 'activity/gambar-4.9-activity-diagram-penyimpanan-hasil.puml')

# Gambar 4.10: Activity Diagram Notifikasi Email
def make_activity_email():
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Activity Diagram Notifikasi Email Per-Petugas", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    draw_start_node(ax, (50, 92))
    draw_act_node(ax, (50, 83), 44, 7, "Pemindaian Selesai di Aggregator")
    draw_act_decision(ax, (50, 71), 28, 9, "Email Petugas\nTersedia?")
    draw_act_node(ax, (26, 59), 34, 7, "Gunakan Alamat Email Petugas\n(Isolasi Penerima)")
    draw_act_node(ax, (74, 59), 34, 7, "Gunakan Fallback EMAIL_TO\n(Default .env)")
    draw_act_decision(ax, (50, 46), 28, 9, "Ditemukan\nIndikasi?")
    draw_act_node(ax, (26, 33), 36, 7, "Render Template MERAH\n[PERINGATAN] Rincian Temuan", color='#FEE2E2', ec='#EF4444', text_color='#991B1B')
    draw_act_node(ax, (74, 33), 36, 7, "Render Template HIJAU\n[LAPORAN BERSIH] 0 Indikasi", color='#DCFCE7', ec='#16A34A', text_color='#14532D')
    draw_act_node(ax, (50, 20), 46, 8, "Kirim via Nodemailer SMTP Gmail (Port 587)\nCatat Log di Tabel 'notifications'")
    draw_end_node(ax, (50, 8))

    draw_flow_arrow(ax, (50, 90), (50, 86.5))
    draw_flow_arrow(ax, (50, 79.5), (50, 75.5))
    draw_flow_arrow(ax, (36, 71), (26, 62.5), "[Ya]")
    draw_flow_arrow(ax, (64, 71), (74, 62.5), "[Tidak]")
    draw_flow_arrow(ax, (26, 55.5), (42, 50))
    draw_flow_arrow(ax, (74, 55.5), (58, 50))
    draw_flow_arrow(ax, (36, 46), (26, 36.5), "[Ya]")
    draw_flow_arrow(ax, (64, 46), (74, 36.5), "[Tidak]")
    draw_flow_arrow(ax, (26, 29.5), (42, 24))
    draw_flow_arrow(ax, (74, 29.5), (58, 24))
    draw_flow_arrow(ax, (50, 16), (50, 10.5))

    save_diagram(fig, 'activity/gambar-4.10-activity-diagram-notifikasi-email.png')
    save_source("""@startuml
!theme plain
start
:Pemindaian Selesai;
if (Email Petugas Terdaftar?) then (Ya)
  :Set Penerima = Email Petugas Pemrakarsa;
else (Tidak)
  :Set Penerima = Fallback EMAIL_TO (.env);
endif
if (Ditemukan Indikasi Konten Negatif?) then (Ya)
  :Pilih Template Merah [PERINGATAN];
  :Lampirkan Tabel Rincian Indikasi;
else (Tidak)
  :Pilih Template Hijau [LAPORAN BERSIH];
  :Lampirkan Ringkasan Status Aman;
endif
:Kirim Email via SMTP Gmail (Port 587);
:Simpan Status dan Message ID ke Database;
stop
@enduml
""", 'activity/gambar-4.10-activity-diagram-notifikasi-email.puml')

make_activity_login()
make_activity_scan()
make_activity_crawling()
make_activity_text_detection()
make_activity_link()
make_activity_defacement()
make_activity_storage()
make_activity_email()
