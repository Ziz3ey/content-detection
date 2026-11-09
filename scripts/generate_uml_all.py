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

# =============================================================================
# GAMBAR 4.2: USE CASE DIAGRAM
# =============================================================================
def make_use_case_diagram():
    fig, ax = plt.subplots(figsize=(12, 10))
    ax.set_xlim(0, 120)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Title
    ax.text(60, 97, "Use Case Diagram Sistem Deteksi Indikasi Konten Negatif", ha='center', va='center', fontsize=13, fontweight='bold', color='#0F172A')

    # System boundary
    rect = FancyBboxPatch((28, 5), 64, 88, boxstyle="round,pad=0.8", fc='#F8FAFC', ec='#475569', lw=2, linestyle='-')
    ax.add_patch(rect)
    ax.text(60, 90.5, "Sistem Monitoring & Deteksi Indikasi Konten Negatif", ha='center', va='center', fontsize=10, fontweight='bold', color='#1E293B')

    # Actors
    def draw_actor(x, y, label, color='#1E3A8A'):
        # Head
        c = plt.Circle((x, y+3), 1.8, fc='white', ec=color, lw=1.8)
        ax.add_patch(c)
        # Body
        ax.plot([x, x], [y+1.2, y-2.5], color=color, lw=1.8)
        # Arms
        ax.plot([x-2.5, x+2.5], [y-0.2, y-0.2], color=color, lw=1.8)
        # Legs
        ax.plot([x, x-2], [y-2.5, y-6], color=color, lw=1.8)
        ax.plot([x, x+2], [y-2.5, y-6], color=color, lw=1.8)
        ax.text(x, y-8.5, label, ha='center', va='center', fontsize=8.5, fontweight='bold', color=color)

    draw_actor(12, 52, "Petugas CSIRT /\nAdministrator", color='#1D4ED8')
    draw_actor(108, 68, "Target Website\nPemerintah", color='#047857')
    draw_actor(108, 28, "SMTP Server\nGmail", color='#B91C1C')

    # Use cases
    use_cases = [
        (60, 84, "UC-01: Autentikasi & Login Administrator", [12], []),
        (60, 76, "UC-02: Memulai Pemindaian Mandiri & Email Petugas", [12], []),
        (60, 68, "UC-03: Menjalankan Perayapan Otomatis (Web Crawling)", [], [108]),
        (60, 60, "UC-04: Mendeteksi Indikasi Teks (Aho-Corasick)", [], []),
        (60, 52, "UC-05: Mendeteksi Tautan Mencurigakan & Berisiko", [], []),
        (60, 44, "UC-06: Mendeteksi Perubahan Halaman (Defacement)", [], []),
        (60, 36, "UC-07: Mengirimkan Notifikasi Email Hasil Pemindaian", [], [108]),
        (60, 28, "UC-08: Menampilkan & Memfilter Riwayat Pemindaian", [12], []),
        (60, 20, "UC-09: Mengelola Daftar Target Website Pemerintah", [12], []),
        (60, 12, "UC-10: Mengunduh Laporan Hasil Pemeriksaan (PDF/CSV)", [12], [])
    ]

    for (cx, cy, text, left_links, right_links) in use_cases:
        # Ellipse for use case
        el = Ellipse((cx, cy), 48, 6, fc='#EFF6FF', ec='#2563EB', lw=1.4)
        ax.add_patch(el)
        ax.text(cx, cy, text, ha='center', va='center', fontsize=8, fontweight='bold', color='#1E3A8A')

        if left_links:
            ax.plot([14.5, cx-24], [52, cy], color='#3B82F6', lw=1.2, linestyle='-')
        if right_links:
            target_y = 68 if cy >= 50 else 28
            ax.plot([cx+24, 105.5], [cy, target_y], color='#10B981' if target_y == 68 else '#EF4444', lw=1.2, linestyle='-')

    # Include relationships inside system
    def draw_include(p1, p2):
        ax.annotate('', xy=p2, xytext=p1,
                    arrowprops=dict(arrowstyle="->", color='#64748B', lw=1.2, linestyle='--'))
        mid = ((p1[0]+p2[0])/2, (p1[1]+p2[1])/2)
        ax.text(mid[0]-3, mid[1], "<<include>>", fontsize=6.5, color='#475569', ha='center', backgroundcolor='#F8FAFC')

    draw_include((48, 73), (48, 71)) # UC-02 -> UC-03
    draw_include((48, 65), (48, 63)) # UC-03 -> UC-04
    draw_include((48, 57), (48, 55)) # UC-04 -> UC-05
    draw_include((48, 49), (48, 47)) # UC-05 -> UC-06
    draw_include((48, 41), (48, 39)) # UC-06 -> UC-07

    save_diagram(fig, 'use-case/gambar-4.2-use-case-diagram.png')
    save_source("""@startuml
!theme plain
left to right direction
skinparam packageStyle rectangle

actor "Petugas CSIRT / Admin" as Admin
actor "Target Website Pemerintah" as Target
actor "SMTP Server Gmail" as SMTP

rectangle "Sistem Monitoring & Deteksi Indikasi Konten Negatif" {
  usecase "UC-01: Autentikasi & Login Administrator" as UC1
  usecase "UC-02: Memulai Pemindaian & Email Petugas" as UC2
  usecase "UC-03: Menjalankan Perayapan (Web Crawling)" as UC3
  usecase "UC-04: Mendeteksi Indikasi Teks (Aho-Corasick)" as UC4
  usecase "UC-05: Mendeteksi Tautan Mencurigakan" as UC5
  usecase "UC-06: Mendeteksi Defacement Baseline" as UC6
  usecase "UC-07: Mengirimkan Notifikasi Email" as UC7
  usecase "UC-08: Menampilkan Riwayat Pemindaian" as UC8
  usecase "UC-09: Mengelola Daftar Target Website" as UC9
  usecase "UC-10: Mengunduh Laporan (PDF / CSV)" as UC10

  UC2 ..> UC3 : <<include>>
  UC3 ..> UC4 : <<include>>
  UC3 ..> UC5 : <<include>>
  UC3 ..> UC6 : <<include>>
  UC2 ..> UC7 : <<include>>
}

Admin --> UC1
Admin --> UC2
Admin --> UC8
Admin --> UC9
Admin --> UC10

UC3 --> Target
UC7 --> SMTP
@enduml
""", 'use-case/gambar-4.2-use-case-diagram.puml')

# =============================================================================
# HELPER UNTUK SEQUENCE DIAGRAM
# =============================================================================
def draw_sequence_lifelines(ax, participants, y_top=88, y_bottom=8):
    for name, x, role in participants:
        # Box header
        color = '#DBEAFE' if 'Admin' in name or 'UI' in name else '#DCFCE7' if 'Aggregator' in name or 'Worker' in name else '#FEF3C7'
        ec = '#2563EB' if 'Admin' in name or 'UI' in name else '#16A34A' if 'Aggregator' in name or 'Worker' in name else '#D97706'
        box = FancyBboxPatch((x-7, y_top-2.5), 14, 5, boxstyle="round,pad=0.2", fc=color, ec=ec, lw=1.4)
        ax.add_patch(box)
        ax.text(x, y_top, name, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#0F172A')
        # Dashed line
        ax.plot([x, x], [y_top-2.5, y_bottom], color='#94A3B8', linestyle='--', lw=1.2)

def draw_msg(ax, x1, x2, y, text, is_reply=False, is_async=False, note=None):
    ls = '--' if is_reply else '-'
    color = '#0284C7' if is_reply else '#0F172A'
    arr = '->' if not is_reply else '-->'
    ax.annotate('', xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(arrowstyle="->", color=color, lw=1.3, linestyle=ls))
    mid_x = (x1 + x2) / 2
    ax.text(mid_x, y+1.2, text, ha='center', va='bottom', fontsize=7, fontweight='bold', color=color, backgroundcolor='white')
    if note:
        ax.text(mid_x, y-1.8, note, ha='center', va='top', fontsize=6, style='italic', color='#64748B')

# =============================================================================
# GAMBAR 4.11: SEQUENCE DIAGRAM PEMINDAIAN WEBSITE
# =============================================================================
def make_seq_pemindaian():
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Sequence Diagram Pemindaian Website & Background Scanning", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    parts = [
        ("Petugas", 10, "actor"),
        ("Dashboard UI", 30, "frontend"),
        ("Aggregator", 52, "backend"),
        ("SQLite DB", 74, "db"),
        ("Scan Worker", 92, "worker")
    ]
    draw_sequence_lifelines(ax, parts, y_top=90, y_bottom=6)

    draw_msg(ax, 10, 30, 83, "1: Input URL & Email Petugas, Klik Mulai")
    draw_msg(ax, 30, 52, 76, "2: POST /api/scans {targetUrl, email, depth}")
    draw_msg(ax, 52, 74, 69, "3: INSERT scans (status='PENDING', email)")
    draw_msg(ax, 74, 52, 63, "4: Return scanId", is_reply=True)
    draw_msg(ax, 52, 30, 57, "5: HTTP 202 Accepted {scanId, status='RUNNING'}", is_reply=True)
    draw_msg(ax, 30, 10, 51, "6: Tampilkan Banner 'Pemindaian Berjalan'", is_reply=True)

    # Box background processing
    rect = FancyBboxPatch((40, 15), 56, 32, boxstyle="round,pad=0.4", fc='#F1F5F9', ec='#64748B', lw=1, linestyle=':')
    ax.add_patch(rect)
    ax.text(42, 45, "[Asynchronous / Background Process - Laptop/Browser Boleh Ditutup]", fontsize=6.5, color='#334155', fontweight='bold')

    draw_msg(ax, 52, 92, 41, "7: executeScan(scanId, config)")
    draw_msg(ax, 92, 92, 34, "8: Crawling & Analisis Paralel 3 Detektor")
    draw_msg(ax, 92, 74, 27, "9: UPDATE scans (status='COMPLETED', findings)")
    draw_msg(ax, 92, 92, 20, "10: Kirim Notifikasi Email ke Petugas")
    draw_msg(ax, 30, 52, 13, "11: GET /api/scans/:id (Polling Status)", is_reply=False)
    draw_msg(ax, 52, 30, 8, "12: Status COMPLETED & Render Hasil", is_reply=True)

    save_diagram(fig, 'sequence/gambar-4.11-sequence-diagram-pemindaian.png')
    save_source("""@startuml
!theme plain
autonumber
actor "Petugas CSIRT" as User
participant "Dashboard UI" as UI
participant "Aggregator Service (:3004)" as Agg
database "SQLite Database" as DB
participant "Background Worker" as Worker

User -> UI: Input Target URL & Email Petugas, Klik 'Mulai'
UI -> Agg: POST /api/scans { targetUrl, requestedByEmail, maxPages, maxDepth }
Agg -> DB: INSERT scans (status='PENDING', requested_by_email)
DB --> Agg: return scanId
Agg --> UI: HTTP 202 Accepted { scanId, status='RUNNING' }
UI --> User: Tampilkan Notifikasi Pemindaian Berjalan (Boleh Tutup Browser)

group Asynchronous Background Scanning
  Agg -> Worker: executeScan(scanId, requestedByEmail)
  Worker -> Worker: Perayapan & Deteksi Paralel 3 Layanan
  Worker -> DB: UPDATE scans SET status='COMPLETED', findings
  Worker -> Worker: Kirim Email Laporan ke requestedByEmail
end

UI -> Agg: GET /api/scans/:id (Periodic Polling)
Agg --> UI: Return Scan Status & Detail Indikasi
UI --> User: Tampilkan Laporan Hasil Pemindaian Lengkap
@enduml
""", 'sequence/gambar-4.11-sequence-diagram-pemindaian.puml')

# =============================================================================
# GAMBAR 4.12: SEQUENCE DIAGRAM WEB CRAWLING
# =============================================================================
def make_seq_crawling():
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Sequence Diagram Perayapan Web (Crawler Service)", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    parts = [
        ("Worker", 10, "agg"),
        ("Crawler Service", 36, "crawler"),
        ("Robots Parser", 64, "parser"),
        ("Target Server", 90, "target")
    ]
    draw_sequence_lifelines(ax, parts, y_top=90, y_bottom=8)

    draw_msg(ax, 10, 36, 82, "1: POST /crawl {targetUrl, maxPages, maxDepth}")
    draw_msg(ax, 36, 90, 75, "2: GET /robots.txt")
    draw_msg(ax, 90, 36, 68, "3: HTTP 200 OK (robots.txt raw content)", is_reply=True)
    draw_msg(ax, 36, 64, 61, "4: Parse Disallow & User-Agent Rules")
    draw_msg(ax, 64, 36, 55, "5: Return isAllowed(url) checker", is_reply=True)

    # Loop BFS
    rect = FancyBboxPatch((20, 20), 76, 31, boxstyle="round,pad=0.4", fc='#F8FAFC', ec='#64748B', lw=1, linestyle=':')
    ax.add_patch(rect)
    ax.text(22, 49, "loop [Antrean BFS: Selama Queue tidak kosong & total < maxPages]", fontsize=6.5, color='#334155', fontweight='bold')

    draw_msg(ax, 36, 90, 43, "6: HTTP GET url (Timeout 10s, Max Redirect 5)")
    draw_msg(ax, 90, 36, 36, "7: HTTP 200 OK (HTML Document)", is_reply=True)
    draw_msg(ax, 36, 36, 29, "8: Cheerio Ekstrak <a href>, Normalisasi & Filter Domain")
    draw_msg(ax, 36, 36, 23, "9: Push Tautan Internal Baru ke Antrean BFS")

    draw_msg(ax, 36, 10, 13, "10: HTTP 200 OK {pages: [{url, title, html, status}]}", is_reply=True)

    save_diagram(fig, 'sequence/gambar-4.12-sequence-diagram-web-crawling.png')
    save_source("""@startuml
!theme plain
autonumber
participant "Aggregator Worker" as Worker
participant "Crawler Service (:3001)" as Crawler
participant "Robots Parser" as Robots
participant "Target Web Server" as Target

Worker -> Crawler: POST /crawl { targetUrl, maxPages, maxDepth }
Crawler -> Target: GET /robots.txt
Target --> Crawler: HTTP 200 (File robots.txt)
Crawler -> Robots: Parse Disallow & Allow Rules
Robots --> Crawler: Validator Kepatuhan Aktif

loop Selama Queue Tidak Kosong && Count < maxPages
  Crawler -> Target: HTTP GET currentUrl (Axios, Timeout 10s)
  Target --> Crawler: HTTP 200 OK (HTML Document)
  Crawler -> Crawler: Ekstrak Tautan Internal (<a href>) via Cheerio
  Crawler -> Crawler: Normalisasi URL & Cek Batas maxDepth
  Crawler -> Crawler: Tambahkan URL Baru ke BFS Queue
end

Crawler --> Worker: HTTP 200 OK { totalPages, pages: [ { url, status, html, title } ] }
@enduml
""", 'sequence/gambar-4.12-sequence-diagram-web-crawling.puml')

# =============================================================================
# GAMBAR 4.13: SEQUENCE DIAGRAM DETEKSI TEKS (AHO-CORASICK)
# =============================================================================
def make_seq_text_detection():
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Sequence Diagram Deteksi Teks (Aho-Corasick Service)", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    parts = [
        ("Worker", 12, "agg"),
        ("Text Service", 40, "svc"),
        ("Cheerio DOM Parser", 68, "dom"),
        ("Aho-Corasick Engine", 90, "engine")
    ]
    draw_sequence_lifelines(ax, parts, y_top=90, y_bottom=8)

    draw_msg(ax, 12, 40, 82, "1: POST /detect/text {url, html, title}")
    draw_msg(ax, 40, 68, 74, "2: Ekstraksi Teks Bersih, Meta & Alt/Title Gambar")
    draw_msg(ax, 68, 40, 66, "3: Return corpus teks representatif", is_reply=True)
    draw_msg(ax, 40, 40, 58, "4: Normalisasi Huruf & Leet Speak (g4c0r -> gacor)")
    draw_msg(ax, 40, 90, 50, "5: searchPatterns(normalizedCorpus)")
    draw_msg(ax, 90, 90, 42, "6: Linear Time Multi-Pattern Trie Traversal O(n+m)")
    draw_msg(ax, 90, 40, 34, "7: Return daftar matches [kata, kategori, bobot]", is_reply=True)
    draw_msg(ax, 40, 40, 26, "8: Hitung Total Skor, Ambang Batas & Cuplikan Snippet")
    draw_msg(ax, 40, 12, 16, "9: HTTP 200 OK {hasIndication, score, findings: [...]}", is_reply=True)

    save_diagram(fig, 'sequence/gambar-4.13-sequence-diagram-deteksi-teks.png')
    save_source("""@startuml
!theme plain
autonumber
participant "Aggregator Worker" as Worker
participant "Text Detection Service (:3000)" as TextSvc
participant "Cheerio DOM Parser" as Parser
participant "Aho-Corasick Trie Engine" as ACTrie

Worker -> TextSvc: POST /detect/text { url, html, title }
TextSvc -> Parser: Ekstrak Teks Terlihat, Meta Tag, & Alt/Title Gambar
Parser --> TextSvc: Corpus Teks Hasil Ekstraksi
TextSvc -> TextSvc: Normalisasi Huruf Kecil & Dekode Leet Speak
TextSvc -> ACTrie: searchPatterns(normalizedText)
ACTrie -> ACTrie: Traversal Multi-Pattern Tree Linier O(n + m)
ACTrie --> TextSvc: Daftar Kata Kunci Cocok, Kategori, & Posisi Karakter
TextSvc -> TextSvc: Hitung Akumulasi Bobot & Ambil Snippet Konteks
TextSvc --> Worker: HTTP 200 OK { hasIndication, confidence, findings: [ ... ] }
@enduml
""", 'sequence/gambar-4.13-sequence-diagram-deteksi-teks.puml')

# =============================================================================
# GAMBAR 4.14: SEQUENCE DIAGRAM DETEKSI TAUTAN MENCURIGAKAN
# =============================================================================
def make_seq_link_detection():
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Sequence Diagram Deteksi Tautan Mencurigakan", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    parts = [
        ("Worker", 12, "agg"),
        ("Link Service", 40, "svc"),
        ("Cheerio Extractor", 68, "dom"),
        ("Suspicious Rule Engine", 90, "engine")
    ]
    draw_sequence_lifelines(ax, parts, y_top=90, y_bottom=8)

    draw_msg(ax, 12, 40, 82, "1: POST /detect/links {url, html}")
    draw_msg(ax, 40, 68, 74, "2: Parse tag <a>, <iframe>, <script src>, <form action>")
    draw_msg(ax, 68, 40, 66, "3: Return array seluruh hyperlink ekstrak", is_reply=True)
    draw_msg(ax, 40, 90, 58, "4: evaluateLinks(links, targetDomain)")
    draw_msg(ax, 90, 90, 48, "5: Cek Outbound Domain, TLD Berisiko & Keyword URL")
    draw_msg(ax, 90, 90, 38, "6: Periksa CSS Tersembunyi (display:none, font-size:0)")
    draw_msg(ax, 90, 40, 30, "7: Return daftar tautan anomali & skor risiko", is_reply=True)
    draw_msg(ax, 40, 12, 18, "8: HTTP 200 OK {hasIndication, suspiciousLinks: [...]}", is_reply=True)

    save_diagram(fig, 'sequence/gambar-4.14-sequence-diagram-deteksi-tautan.png')
    save_source("""@startuml
!theme plain
autonumber
participant "Aggregator Worker" as Worker
participant "Link Detection Service (:3003)" as LinkSvc
participant "Cheerio HTML Parser" as Parser
participant "Rule & Domain Engine" as Engine

Worker -> LinkSvc: POST /detect/links { url, html }
LinkSvc -> Parser: Ekstrak seluruh elemen <a>, <iframe>, <form>, <script>
Parser --> LinkSvc: Array Hyperlink beserta Atribut & Inline Style
LinkSvc -> Engine: evaluateLinks(links, baseDomain)
Engine -> Engine: Filter Tautan Eksternal (Outbound Non-Government)
Engine -> Engine: Periksa TLD Berisiko (.top, .xyz, .icu, .vip, .tk)
Engine -> Engine: Deteksi Hidden Link (display:none, visibility:hidden)
Engine --> LinkSvc: Daftar Temuan Tautan Mencurigakan
LinkSvc --> Worker: HTTP 200 OK { hasIndication, totalLinks, suspiciousLinks: [ ... ] }
@enduml
""", 'sequence/gambar-4.14-sequence-diagram-deteksi-tautan.puml')

# =============================================================================
# GAMBAR 4.15: SEQUENCE DIAGRAM DETEKSI DEFACEMENT
# =============================================================================
def make_seq_defacement():
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(50, 97, "Sequence Diagram Deteksi Perubahan Halaman (Defacement)", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    parts = [
        ("Worker", 10, "agg"),
        ("Defacement Svc", 36, "svc"),
        ("Baseline DB", 64, "db"),
        ("DOM Hash Engine", 90, "engine")
    ]
    draw_sequence_lifelines(ax, parts, y_top=90, y_bottom=8)

    draw_msg(ax, 10, 36, 82, "1: POST /detect/defacement {siteId, url, html, title}")
    draw_msg(ax, 36, 64, 74, "2: getBaselineSnapshot(siteId, url)")
    draw_msg(ax, 64, 36, 66, "3: Return baseline record / null", is_reply=True)

    # Condition
    rect = FancyBboxPatch((20, 24), 76, 38, boxstyle="round,pad=0.4", fc='#F8FAFC', ec='#64748B', lw=1, linestyle=':')
    ax.add_patch(rect)
    ax.text(22, 59, "alt [Kondisi Baseline]", fontsize=6.5, color='#334155', fontweight='bold')

    ax.text(24, 54, "[Belum ada Baseline Sebelumnya]", fontsize=6, color='#2563EB', fontweight='bold')
    draw_msg(ax, 36, 64, 48, "4a: saveInitialBaseline(siteId, url, domHash, title)")

    ax.text(24, 41, "[Sudah ada Baseline]", fontsize=6, color='#D97706', fontweight='bold')
    draw_msg(ax, 36, 90, 36, "4b: compareStructuralSimilarity(currentHtml, baselineHtml)")
    draw_msg(ax, 90, 36, 29, "5: Return {diffRatio, titleChanged, structuralAnomaly}", is_reply=True)

    draw_msg(ax, 36, 10, 15, "6: HTTP 200 OK {hasIndication, diffScore, details}", is_reply=True)

    save_diagram(fig, 'sequence/gambar-4.15-sequence-diagram-deteksi-defacement.png')
    save_source("""@startuml
!theme plain
autonumber
participant "Aggregator Worker" as Worker
participant "Defacement Service (:3002)" as DefSvc
database "Baseline Repository" as DB
participant "Structural Hash Engine" as Hasher

Worker -> DefSvc: POST /detect/defacement { siteId, url, html, title }
DefSvc -> DB: Cari Snapshot Baseline Tersimpan (siteId, url)
DB --> DefSvc: Return Baseline Data / Null

alt Baseline Belum Ada
  DefSvc -> Hasher: Hitung SHA-256 DOM & Struktur SimHash
  Hasher --> DefSvc: Initial Signature
  DefSvc -> DB: INSERT INTO baselines (site_id, url, dom_hash, title)
  DefSvc --> Worker: HTTP 200 OK { status: 'BASELINE_CREATED', hasIndication: false }
else Baseline Sudah Tersedia
  DefSvc -> Hasher: Bandingkan DOM, Struktur Tag, & Judul Halaman
  Hasher --> DefSvc: Similarity Ratio & Indikasi Perubahan Signifikan
  DefSvc --> Worker: HTTP 200 OK { hasIndication, diffScore, changeType }
end
@enduml
""", 'sequence/gambar-4.15-sequence-diagram-deteksi-defacement.puml')

# =============================================================================
# GAMBAR 4.16: COMPONENT DIAGRAM
# =============================================================================
def make_component_diagram():
    fig, ax = plt.subplots(figsize=(12, 10))
    ax.set_xlim(0, 120)
    ax.set_ylim(0, 100)
    ax.axis('off')
    ax.text(60, 97, "Component Diagram Arsitektur Microservices Sistem Deteksi Konten", ha='center', va='center', fontsize=12, fontweight='bold', color='#0F172A')

    def draw_component(x, y, w, h, name, subtext, port, color='#EFF6FF', ec='#2563EB'):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4", fc=color, ec=ec, lw=1.5)
        ax.add_patch(box)
        # Tab kecil khas komponen UML
        t1 = Rectangle((x-1.5, y+h-4), 3, 2, fc='white', ec=ec, lw=1.2)
        t2 = Rectangle((x-1.5, y+h-8), 3, 2, fc='white', ec=ec, lw=1.2)
        ax.add_patch(t1)
        ax.add_patch(t2)
        ax.text(x+w/2, y+h-3.5, f"<<component>>\n{name}", ha='center', va='center', fontsize=8, fontweight='bold', color='#1E293B')
        ax.text(x+w/2, y+h/2-2, subtext, ha='center', va='center', fontsize=6.5, color='#475569')
        ax.text(x+w/2, y+3, f"Port: {port}", ha='center', va='center', fontsize=7, fontweight='bold', color='#1D4ED8')

    # 1. Dashboard
    draw_component(10, 62, 30, 24, "Dashboard Frontend", "React 18, Vite, TailwindCSS\nAxios Client, Chart.js\nState & Hash Router", "5173", color='#EFF6FF', ec='#2563EB')

    # 2. Aggregator
    draw_component(50, 56, 32, 34, "Aggregator Service", "Express.js REST API\nScan Job Coordinator\nWorker Queue & Nodemailer\nData-Access SQLite Client", "3004", color='#DCFCE7', ec='#16A34A')

    # 3. Crawler
    draw_component(90, 72, 26, 20, "Crawler Service", "Axios, Cheerio\nrobots-parser\nBFS Queue Manager", "3001", color='#FEF3C7', ec='#D97706')

    # 4. Text Detector
    draw_component(90, 48, 26, 20, "Text Detection", "Aho-Corasick Multi-Pattern\nLeet Speak Normalizer\nKeyword Dictionaries", "3000", color='#FCE7F3', ec='#DB2777')

    # 5. Link Detector
    draw_component(90, 24, 26, 20, "Link Detection", "Cheerio URL Extractor\nRisky TLD Evaluator\nHidden Link Inspector", "3003", color='#E0E7FF', ec='#4F46E5')

    # 6. Defacement Detector
    draw_component(90, 0, 26, 20, "Defacement Service", "SHA-256 DOM Hasher\nStructural Comparator\nBaseline Checker", "3002", color='#FEE2E2', ec='#DC2626')

    # SQLite Database
    db_box = FancyBboxPatch((10, 16), 30, 22, boxstyle="round,pad=0.4", fc='#F1F5F9', ec='#475569', lw=1.5)
    ax.add_patch(db_box)
    ax.text(25, 32, "<<database>>\nSQLite (better-sqlite3)", ha='center', va='center', fontsize=8, fontweight='bold', color='#0F172A')
    ax.text(25, 23, "content_detection.db\n- scans, scan_pages\n- scan_findings, sites\n- users, notifications", ha='center', va='center', fontsize=6.5, color='#475569')

    # SMTP Server
    smtp_box = FancyBboxPatch((50, 16), 32, 14, boxstyle="round,pad=0.4", fc='#FFF1F2', ec='#BE123C', lw=1.5)
    ax.add_patch(smtp_box)
    ax.text(66, 25, "<<external system>>\nSMTP Server Gmail", ha='center', va='center', fontsize=7.5, fontweight='bold', color='#9F1239')
    ax.text(66, 19, "Port 587 (TLS/STARTTLS)", ha='center', va='center', fontsize=6.5, color='#881337')

    # Arrows
    def draw_arrow(p1, p2, label):
        ax.annotate('', xy=p2, xytext=p1,
                    arrowprops=dict(arrowstyle="->", color='#334155', lw=1.3))
        mid = ((p1[0]+p2[0])/2, (p1[1]+p2[1])/2)
        ax.text(mid[0], mid[1], label, ha='center', va='center', fontsize=6.5, fontweight='bold', color='#1E293B', backgroundcolor='white')

    draw_arrow((40, 74), (50, 74), "HTTP REST")
    draw_arrow((66, 56), (25, 38), "Data-Access (IPC)")
    draw_arrow((66, 56), (66, 30), "Nodemailer (SMTP)")
    draw_arrow((82, 80), (90, 80), "POST /crawl")
    draw_arrow((82, 68), (90, 58), "POST /detect/text")
    draw_arrow((82, 64), (90, 34), "POST /detect/links")
    draw_arrow((82, 60), (90, 10), "POST /detect/defacement")

    save_diagram(fig, 'component/gambar-4.16-component-diagram.png')
    save_source("""@startuml
!theme plain
skinparam componentStyle uml2

package "Presentation Layer" {
  component [Dashboard React Frontend\n(Port 5173)] as Dashboard
}

package "Orchestration & Business Layer" {
  component [Aggregator Service\n(Port 3004)] as Aggregator
  component [Data-Access Layer\n(better-sqlite3)] as DataAccess
}

package "Detection & Crawling Services" {
  component [Crawler Service\n(Port 3001)] as Crawler
  component [Text Detection Service\n(Port 3000 / Aho-Corasick)] as TextDet
  component [Link Detection Service\n(Port 3003)] as LinkDet
  component [Defacement Service\n(Port 3002)] as DefDet
}

database "SQLite Database\n(content_detection.db)" as DB
cloud "External SMTP Server\n(smtp.gmail.com:587)" as SMTP

Dashboard ..> Aggregator : REST API (JSON)
Aggregator --> DataAccess : Method Calls
DataAccess --> DB : SQL Queries
Aggregator --> SMTP : Nodemailer (TLS)

Aggregator ..> Crawler : HTTP POST /crawl
Aggregator ..> TextDet : HTTP POST /detect/text
Aggregator ..> LinkDet : HTTP POST /detect/links
Aggregator ..> DefDet : HTTP POST /detect/defacement
@enduml
""", 'component/gambar-4.16-component-diagram.puml')

if __name__ == '__main__':
    print("Generating UML diagrams...")
    make_use_case_diagram()
    make_seq_pemindaian()
    make_seq_crawling()
    make_seq_text_detection()
    make_seq_link_detection()
    make_seq_defacement()
    make_component_diagram()
    print("All UML diagrams generated successfully!")
