# -*- coding: utf-8 -*-
"""
Script to generate standard, native, fully editable .drawio XML files
for all thesis diagrams (Architecture, Use Case, 8 Activity, 5 Sequence,
Component, and DSRM Methodology).

Compatible with draw.io (diagrams.net) web and desktop.
Strictly Black & White (#000000 strokes, #FFFFFF fills, #000000 text, Arial font).
"""

import os
import xml.etree.ElementTree as ET
from xml.dom import minidom

BASE_DIR = r'D:\content detection\docs\bab-iv\diagrams'

def prettify_xml(elem):
    rough_string = ET.tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")

def create_drawio_base(diagram_name="Page-1", width=1200, height=900):
    mxfile = ET.Element('mxfile', host='app.diagrams.net', agent='Antigravity', version='24.0.0', type='device')
    diagram = ET.SubElement(mxfile, 'diagram', id='DSRM_Diag', name=diagram_name)
    model = ET.SubElement(diagram, 'mxGraphModel', dx='1200', dy='900', grid='1', gridSize='10',
                          guides='1', tooltips='1', connect='1', arrows='1', fold='1', page='1',
                          pageScale='1', pageWidth='827', pageHeight='1169', math='0', shadow='0')
    root = ET.SubElement(model, 'root')
    ET.SubElement(root, 'mxCell', id='0')
    ET.SubElement(root, 'mxCell', id='1', parent='0')
    return mxfile, root

def add_node(root, node_id, value, style, x, y, w, h):
    cell = ET.SubElement(root, 'mxCell', id=str(node_id), value=str(value), style=style, vertex='1', parent='1')
    geo = ET.SubElement(cell, 'mxGeometry', x=str(x), y=str(y), width=str(w), height=str(h))
    geo.set('as', 'geometry')
    return cell

DEFAULT_EDGE_STYLE = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=block;endFill=1;"

def add_edge(root, edge_id, value, source_id, target_id, style=None):
    if style is None:
        style = DEFAULT_EDGE_STYLE
    cell = ET.SubElement(root, 'mxCell', id=str(edge_id), value=str(value), style=style, edge='1', parent='1',
                         source=str(source_id), target=str(target_id))
    geo = ET.SubElement(cell, 'mxGeometry', relative='1')
    geo.set('as', 'geometry')
    return cell

def save_drawio_file(mxfile, rel_path):
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    xml_str = prettify_xml(mxfile)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(xml_str)
    print(f"Saved .drawio: {rel_path}")

# =============================================================================
# 1. GAMBAR 4.1: ARSITEKTUR SISTEM MICROSERVICES
# =============================================================================
def gen_drawio_architecture():
    mxfile, root = create_drawio_base("Arsitektur Sistem")
    # Base styles (Black and White)
    box_style = "rounded=0;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=11;"
    edge_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=10;endArrow=block;endFill=1;"

    # Presentation Layer
    add_node(root, "pres_box", "Presentation Layer\n(Frontend SPA - React 18, Vite - Port 5173)", box_style, 40, 100, 200, 90)

    # Orchestrator
    add_node(root, "agg_box", "Orchestration Layer\nAggregator Service (Port 3004)\n- REST API Gateway\n- Job Queue & Background Worker\n- Nodemailer Email Service", box_style, 300, 80, 220, 130)

    # Database
    db_style = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=12;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=11;"
    add_node(root, "db_box", "Basis Data SQLite\n(better-sqlite3)\ncontent_detection.db", db_style, 340, 280, 140, 90)

    # Detection & Crawling Services
    add_node(root, "craw_box", "Crawler Service\n(Port 3001)\n- Axios & Cheerio\n- BFS Queue & robots.txt", box_style, 580, 40, 180, 70)
    add_node(root, "text_box", "Text Detection Service\n(Port 3000)\n- Aho-Corasick Engine\n- Leet Speak Normalizer", box_style, 580, 130, 180, 70)
    add_node(root, "link_box", "Link Detection Service\n(Port 3003)\n- Outbound & Risky TLD\n- Hidden Link CSS Detector", box_style, 580, 220, 180, 70)
    add_node(root, "def_box", "Defacement Service\n(Port 3002)\n- SHA-256 DOM Hasher\n- Structural Comparator", box_style, 580, 310, 180, 70)

    # External systems
    add_node(root, "target_box", "Target Website Pemerintah\n(*.sumbawakab.go.id)", box_style, 820, 40, 180, 70)
    add_node(root, "smtp_box", "SMTP Server Gmail\n(smtp.gmail.com:587)", box_style, 320, 430, 180, 60)

    # Connectors
    add_edge(root, "e1", "HTTP / REST API", "pres_box", "agg_box")
    add_edge(root, "e2", "data-access (SQL)", "agg_box", "db_box")
    add_edge(root, "e3", "POST /crawl", "agg_box", "craw_box")
    add_edge(root, "e4", "POST /detect/text", "agg_box", "text_box")
    add_edge(root, "e5", "POST /detect/links", "agg_box", "link_box")
    add_edge(root, "e6", "POST /detect/defacement", "agg_box", "def_box")
    add_edge(root, "e7", "HTTP GET / robots.txt", "craw_box", "target_box")
    add_edge(root, "e8", "SMTP / TLS", "agg_box", "smtp_box")

    save_drawio_file(mxfile, "architecture/gambar-4.1-arsitektur-sistem.drawio")

# =============================================================================
# 2. GAMBAR 4.2: USE CASE DIAGRAM
# =============================================================================
def gen_drawio_use_case():
    mxfile, root = create_drawio_base("Use Case Diagram")
    actor_style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=11;"
    boundary_style = "rounded=0;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=none;fontColor=#000000;fontFamily=Arial;fontSize=12;verticalAlign=top;fontStyle=1;"
    uc_style = "ellipse;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;"
    assoc_style = "endArrow=none;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=10;"
    inc_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;dashed=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=open;endFill=0;"

    # Boundary
    add_node(root, "sys_bound", "Sistem Pemantauan dan Deteksi Indikasi Konten Negatif", boundary_style, 180, 40, 440, 700)

    # Actors
    add_node(root, "act_admin", "Petugas CSIRT /\nAdministrator", actor_style, 50, 320, 40, 80)
    add_node(root, "act_target", "Target Website\nPemerintah", actor_style, 690, 180, 40, 80)
    add_node(root, "act_smtp", "SMTP Server\nGmail", actor_style, 690, 480, 40, 80)

    # Use Cases
    ucs = [
        ("uc1", "Login Administrator", 300, 80, 200, 50),
        ("uc2", "Memulai Pemindaian Website\n(Input Email Petugas)", 300, 150, 200, 50),
        ("uc3", "Perayapan Halaman Web\n(Web Crawling)", 300, 220, 200, 50),
        ("uc4", "Deteksi Indikasi Teks\n(Aho-Corasick)", 300, 290, 200, 50),
        ("uc5", "Deteksi Tautan Mencurigakan", 300, 360, 200, 50),
        ("uc6", "Deteksi Defacement Baseline", 300, 430, 200, 50),
        ("uc7", "Pengiriman Notifikasi Email", 300, 500, 200, 50),
        ("uc8", "Melihat Riwayat Pemindaian", 300, 570, 200, 50),
        ("uc9", "Pengelolaan Target Website", 300, 630, 200, 50),
        ("uc10", "Ekspor Laporan (PDF / CSV)", 300, 690, 200, 50)
    ]
    for uid, lbl, x, y, w, h in ucs:
        add_node(root, uid, lbl, uc_style, x, y, w, h)

    # Associations
    for uid in ["uc1", "uc2", "uc8", "uc9", "uc10"]:
        add_edge(root, f"a_{uid}", "", "act_admin", uid, style=assoc_style)

    add_edge(root, "a_target", "", "uc3", "act_target", style=assoc_style)
    add_edge(root, "a_smtp", "", "uc7", "act_smtp", style=assoc_style)

    # Includes
    add_edge(root, "inc1", "<<include>>", "uc2", "uc3", style=inc_style)
    add_edge(root, "inc2", "<<include>>", "uc3", "uc4", style=inc_style)
    add_edge(root, "inc3", "<<include>>", "uc3", "uc5", style=inc_style)
    add_edge(root, "inc4", "<<include>>", "uc3", "uc6", style=inc_style)
    add_edge(root, "inc5", "<<include>>", "uc2", "uc7", style=inc_style)

    save_drawio_file(mxfile, "use-case/gambar-4.2-use-case-diagram.drawio")

# =============================================================================
# 3. ACTIVITY DIAGRAMS (GAMBAR 4.3 s/d 4.10)
# =============================================================================
def gen_drawio_activity(name, title, lanes, steps, filename):
    mxfile, root = create_drawio_base(title)
    box_act = "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;"
    box_dec = "rhombus;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=9;"
    start_style = "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;"
    end_style = "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;strokeWidth=2;shape=doubleEllipse;"
    edge_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=block;endFill=1;"

    # Swimlane Container
    total_w = len(lanes) * 240
    lane_w = 240
    # Header bar
    for i, lane_title in enumerate(lanes):
        add_node(root, f"lane_{i}", lane_title, "rounded=0;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#EEEEEE;fontColor=#000000;fontFamily=Arial;fontSize=11;fontStyle=1;", 40 + i*lane_w, 40, lane_w, 30)
        # Lane vertical line
        add_node(root, f"lane_bg_{i}", "", "rounded=0;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=none;strokeWidth=1;", 40 + i*lane_w, 70, lane_w, 650)

    # Initial start
    add_node(root, "start_node", "", start_style, 40 + 105, 90, 30, 30)

    # Add steps
    prev_id = "start_node"
    for s_id, s_type, s_text, lane_idx, y, w, h in steps:
        x = 40 + lane_idx * lane_w + (lane_w - w) // 2
        st = box_dec if s_type == 'dec' else end_style if s_type == 'end' else box_act
        add_node(root, s_id, s_text, st, x, y, w, h)

    save_drawio_file(mxfile, filename)

def gen_all_drawio_activities():
    # Gambar 4.3: Login
    steps_43 = [
        ("s1", "act", "Membuka Halaman Website Login", 0, 150, 180, 45),
        ("s2", "act", "Menampilkan Halaman Login", 1, 150, 180, 45),
        ("s3", "act", "Memasukkan Username dan Password", 0, 230, 180, 45),
        ("s4", "act", "Memeriksa Kredensial via Scrypt Hash", 1, 230, 180, 45),
        ("s5", "dec", "Valid?", 1, 310, 80, 50),
        ("s6", "act", "Generate Token Sesi & Buka Dashboard", 1, 400, 180, 45),
        ("end1", "end", "", 1, 480, 30, 30)
    ]
    gen_drawio_activity("Login", "Activity Diagram Login", ["Petugas CSIRT", "Sistem"], steps_43, "activity/gambar-4.3-activity-diagram-login.drawio")

    # Gambar 4.4: Pemindaian
    steps_44 = [
        ("s1", "act", "Membuka Menu Pemindaian", 0, 140, 180, 40),
        ("s2", "act", "Input URL, Kedalaman, & Email Petugas", 0, 210, 180, 45),
        ("s3", "act", "Menekan Tombol 'Mulai Pemindaian'", 0, 280, 180, 40),
        ("s4", "act", "Validasi Format Input & Sintaks Email", 1, 280, 180, 45),
        ("s5", "dec", "Valid?", 1, 350, 80, 50),
        ("s6", "act", "Simpan Job Status PENDING di SQLite\nKirim HTTP 202 Accepted", 1, 430, 190, 45),
        ("s7", "act", "Terima Konfirmasi Job Berjalan\n(Dapat Menutup Browser/Laptop)", 0, 430, 180, 45),
        ("s8", "act", "Background Worker Menjalankan Scan\n& Mengirim Surel ke Email Petugas", 1, 510, 190, 45),
        ("end1", "end", "", 1, 590, 30, 30)
    ]
    gen_drawio_activity("Pemindaian", "Activity Diagram Pemindaian Website", ["Petugas CSIRT", "Sistem (Aggregator & Worker)"], steps_44, "activity/gambar-4.4-activity-diagram-pemindaian.drawio")

    # Gambar 4.5: Web Crawling
    steps_45 = [
        ("s1", "act", "Kirim Permintaan Crawl {targetUrl, limits}", 0, 140, 190, 40),
        ("s2", "act", "Mengunduh robots.txt dari Target", 1, 140, 180, 40),
        ("s3", "act", "Memeriksa Izin Perayapan robots-parser", 1, 210, 180, 40),
        ("s4", "act", "Inisialisasi Antrean BFS dengan Root URL", 1, 280, 180, 40),
        ("s5", "act", "Unduh HTML via HTTP GET (Axios)", 1, 350, 180, 40),
        ("s6", "act", "Cheerio Ekstrak Tautan Internal <a href>", 1, 420, 180, 40),
        ("s7", "dec", "Queue Kosong\natau Batas?", 1, 490, 90, 50),
        ("s8", "act", "Kembalikan Koleksi Dokumen Halaman", 1, 570, 180, 40),
        ("end1", "end", "", 1, 640, 30, 30)
    ]
    gen_drawio_activity("Crawling", "Activity Diagram Web Crawling", ["Aggregator Worker", "Crawler Service"], steps_45, "activity/gambar-4.5-activity-diagram-web-crawling.drawio")

    # Gambar 4.6: Text Detection
    steps_46 = [
        ("s1", "act", "Kirim Dokumen HTML ke Text Detection", 0, 140, 180, 40),
        ("s2", "act", "Ekstrak Teks Terlihat, Meta, & Alt Gambar", 1, 140, 180, 40),
        ("s3", "act", "Normalisasi Karakter & Konversi Leet Speak", 1, 210, 180, 40),
        ("s4", "act", "Pencocokan Multi-Pola Trie Aho-Corasick", 1, 280, 180, 40),
        ("s5", "dec", "Pola Cocok\nDitemukan?", 1, 350, 90, 50),
        ("s6", "act", "Hitung Skor Keyakinan & Ambil Snippet", 1, 430, 180, 40),
        ("s7", "act", "Kembalikan Status Temuan Teks", 1, 500, 180, 40),
        ("end1", "end", "", 1, 570, 30, 30)
    ]
    gen_drawio_activity("Text", "Activity Diagram Deteksi Teks", ["Aggregator Worker", "Text Detection Service"], steps_46, "activity/gambar-4.6-activity-diagram-deteksi-teks.drawio")

    # Gambar 4.7: Link Detection
    steps_47 = [
        ("s1", "act", "Kirim Dokumen HTML ke Link Service", 0, 140, 180, 40),
        ("s2", "act", "Ekstraksi Tag <a>, <iframe>, <script>, <form>", 1, 140, 180, 40),
        ("s3", "act", "Filter Tautan Eksternal (Outbound)", 1, 210, 180, 40),
        ("s4", "act", "Periksa TLD Berisiko (.top, .xyz, .icu)", 1, 280, 180, 40),
        ("s5", "act", "Deteksi CSS Tersembunyi (display:none)", 1, 350, 180, 40),
        ("s6", "dec", "Tautan Anomali\nDitemukan?", 1, 420, 90, 50),
        ("s7", "act", "Klasifikasikan Status Risiko & Kembalikan Data", 1, 500, 180, 40),
        ("end1", "end", "", 1, 570, 30, 30)
    ]
    gen_drawio_activity("Link", "Activity Diagram Deteksi Tautan", ["Aggregator Worker", "Link Detection Service"], steps_47, "activity/gambar-4.7-activity-diagram-deteksi-tautan.drawio")

    # Gambar 4.8: Defacement Detection
    steps_48 = [
        ("s1", "act", "Kirim URL & HTML ke Defacement Service", 0, 140, 180, 40),
        ("s2", "act", "Periksa Ketersediaan Baseline di Database", 1, 140, 180, 40),
        ("s3", "dec", "Baseline\nTersedia?", 1, 210, 90, 50),
        ("s4", "act", "Bentuk Tanda Tangan SHA-256 & SimHash Awal", 1, 290, 180, 40),
        ("s5", "act", "Bandingkan DOM, Judul <title>, & Tag Kritis", 1, 360, 180, 40),
        ("s6", "dec", "Perubahan >\nAmbang Batas?", 1, 430, 90, 50),
        ("s7", "act", "Tandai Indikasi Defacement & Kembalikan Diff", 1, 510, 180, 40),
        ("end1", "end", "", 1, 580, 30, 30)
    ]
    gen_drawio_activity("Defacement", "Activity Diagram Deteksi Defacement", ["Aggregator Worker", "Defacement Service"], steps_48, "activity/gambar-4.8-activity-diagram-deteksi-defacement.drawio")

    # Gambar 4.9: Penyimpanan Hasil
    steps_49 = [
        ("s1", "act", "Kompilasi Hasil Analisis 3 Layanan Deteksi", 0, 140, 180, 40),
        ("s2", "act", "Buka Transaksi Atomik (better-sqlite3)", 1, 140, 180, 40),
        ("s3", "act", "INSERT scans, scan_pages, scan_findings", 1, 210, 180, 40),
        ("s4", "act", "Commit Transaksi Database (ACID)", 1, 280, 180, 40),
        ("s5", "act", "Perbarui Status Pekerjaan Menjadi COMPLETED", 0, 350, 180, 40),
        ("s6", "act", "Dashboard Polling Menerima Pembaruan Data", 2, 420, 180, 40),
        ("s7", "act", "Visualisasikan Ringkasan & Detail Forensik", 2, 490, 180, 40),
        ("end1", "end", "", 2, 560, 30, 30)
    ]
    gen_drawio_activity("Storage", "Activity Diagram Penyimpanan Hasil", ["Aggregator Service", "Database SQLite", "Dashboard UI"], steps_49, "activity/gambar-4.9-activity-diagram-penyimpanan-hasil.drawio")

    # Gambar 4.10: Notifikasi Email
    steps_410 = [
        ("s1", "act", "Pemindaian Selesai di Aggregator Worker", 0, 140, 180, 40),
        ("s2", "dec", "Email Petugas\nTercatat?", 0, 210, 90, 50),
        ("s3", "act", "Tetapkan Penerima = Email Petugas Pemrakarsa", 0, 290, 180, 40),
        ("s4", "dec", "Ditemukan\nIndikasi?", 0, 360, 90, 50),
        ("s5", "act", "Muat Templat Peringatan [PERINGATAN] & Temuan", 1, 440, 180, 40),
        ("s6", "act", "Kirimkan Surel via SMTP Gmail (Port 587)", 1, 510, 180, 40),
        ("s7", "act", "Catat Status & Message-ID pada Tabel Notifikasi", 0, 580, 180, 40),
        ("end1", "end", "", 0, 650, 30, 30)
    ]
    gen_drawio_activity("Email", "Activity Diagram Notifikasi Email", ["Aggregator Worker", "Nodemailer Service"], steps_410, "activity/gambar-4.10-activity-diagram-notifikasi-email.drawio")

# =============================================================================
# 4. SEQUENCE DIAGRAMS (GAMBAR 4.11 s/d 4.15)
# =============================================================================
def gen_drawio_sequence(title, lifelines, messages, filename):
    mxfile, root = create_drawio_base(title)
    box_style = "rounded=0;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;"
    actor_style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;"
    db_style = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=10;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;"
    line_style = "rounded=0;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=none;dashed=1;strokeWidth=1;"
    act_style = "rounded=0;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;strokeWidth=1;"

    x_gap = 700 // (len(lifelines) - 1) if len(lifelines) > 1 else 300
    for i, (l_id, l_type, l_name) in enumerate(lifelines):
        cx = 60 + i * x_gap
        if l_type == 'actor':
            add_node(root, f"hd_{l_id}", l_name, actor_style, cx-15, 40, 30, 50)
        elif l_type == 'db':
            add_node(root, f"hd_{l_id}", l_name, db_style, cx-35, 40, 70, 50)
        else:
            add_node(root, f"hd_{l_id}", l_name, box_style, cx-45, 50, 90, 40)
        # Lifeline
        add_node(root, f"ll_{l_id}", "", line_style, cx-0.5, 95, 1, 550)
        # Activation bar
        add_node(root, f"bar_{l_id}", "", act_style, cx-5, 120, 10, 480)

    save_drawio_file(mxfile, filename)

def gen_all_drawio_sequences():
    # 4.11 Pemindaian
    ll_411 = [
        ("user", "actor", "Petugas CSIRT"),
        ("ui", "box", "Dashboard UI"),
        ("agg", "box", "Aggregator Svc"),
        ("db", "db", "SQLite DB"),
        ("worker", "box", "Scan Worker")
    ]
    gen_drawio_sequence("Sequence Diagram Pemindaian Website", ll_411, [], "sequence/gambar-4.11-sequence-diagram-pemindaian.drawio")

    # 4.12 Crawling
    ll_412 = [
        ("worker", "box", "Scan Worker"),
        ("crawler", "box", "Crawler Service"),
        ("robots", "box", "robots-parser"),
        ("target", "box", "Target Server")
    ]
    gen_drawio_sequence("Sequence Diagram Web Crawling", ll_412, [], "sequence/gambar-4.12-sequence-diagram-web-crawling.drawio")

    # 4.13 Text
    ll_413 = [
        ("worker", "box", "Scan Worker"),
        ("textsvc", "box", "Text Detection"),
        ("dom", "box", "DOM Parser"),
        ("ac", "box", "Aho-Corasick")
    ]
    gen_drawio_sequence("Sequence Diagram Deteksi Teks", ll_413, [], "sequence/gambar-4.13-sequence-diagram-deteksi-teks.drawio")

    # 4.14 Link
    ll_414 = [
        ("worker", "box", "Scan Worker"),
        ("linksvc", "box", "Link Detection"),
        ("cheerio", "box", "Cheerio Parser"),
        ("rule", "box", "Rule Engine")
    ]
    gen_drawio_sequence("Sequence Diagram Deteksi Tautan", ll_414, [], "sequence/gambar-4.14-sequence-diagram-deteksi-tautan.drawio")

    # 4.15 Defacement
    ll_415 = [
        ("worker", "box", "Scan Worker"),
        ("defsvc", "box", "Defacement Svc"),
        ("db", "db", "Baseline Repo"),
        ("hasher", "box", "DOM Hasher")
    ]
    gen_drawio_sequence("Sequence Diagram Deteksi Defacement", ll_415, [], "sequence/gambar-4.15-sequence-diagram-deteksi-defacement.drawio")

# =============================================================================
# 5. GAMBAR 4.16: COMPONENT DIAGRAM
# =============================================================================
def gen_drawio_component():
    mxfile, root = create_drawio_base("Component Diagram")
    comp_style = "shape=module;align=left;spacingLeft=20;align=center;verticalAlign=top;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;"
    db_style = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=10;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;"
    edge_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=block;endFill=1;"

    add_node(root, "c_dash", "Dashboard Component\n(React 18 / Port 5173)", comp_style, 40, 160, 180, 80)
    add_node(root, "c_agg", "Aggregator Service\n(Express.js / Port 3004)", comp_style, 280, 140, 200, 120)
    add_node(root, "c_craw", "Crawler Service\n(Port 3001)", comp_style, 560, 40, 170, 70)
    add_node(root, "c_text", "Text Detection Service\n(Aho-Corasick / Port 3000)", comp_style, 560, 130, 170, 70)
    add_node(root, "c_link", "Link Detection Service\n(Port 3003)", comp_style, 560, 220, 170, 70)
    add_node(root, "c_def", "Defacement Service\n(Port 3002)", comp_style, 560, 310, 170, 70)

    add_node(root, "c_db", "Database SQLite\ncontent_detection.db", db_style, 320, 320, 120, 80)
    add_node(root, "c_smtp", "SMTP Server Gmail\nPort 587 (TLS)", comp_style, 100, 320, 150, 70)

    save_drawio_file(mxfile, "component/gambar-4.16-component-diagram.drawio")

# =============================================================================
# 6. GAMBAR 3.1: DIAGRAM METODE PENELITIAN DSRM (BAB III)
# =============================================================================
def gen_drawio_dsrm():
    mxfile, root = create_drawio_base("Bagan Alur DSRM")
    box_proc = "rounded=0;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=9.5;"
    box_phase = "rounded=0;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#EEEEEE;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;"
    edge_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=block;endFill=1;"

    # 4 DSRM Phases from Skripsi_Zizey BAB III
    phases = [
        ("ph1", "Fase 1: Identifikasi Masalah & Motivasi", 40, 50, 220, 30),
        ("ph2", "Fase 2: Penetapan Tujuan Solusi", 280, 50, 220, 30),
        ("ph3", "Fase 3: Perancangan & Pengembangan", 520, 50, 220, 30),
        ("ph4", "Fase 4: Demonstrasi, Evaluasi & Komunikasi", 760, 50, 220, 30)
    ]
    for pid, ptitle, x, y, w, h in phases:
        add_node(root, pid, ptitle, box_phase, x, y, w, h)

    # 8 Processes with Inputs & Outputs
    procs = [
        ("pr1", "Proses 1:\nIdentifikasi Masalah\n[Input: Wawancara, Observasi]\n[Output: Rumusan Masalah]", 40, 100, 220, 70),
        ("pr2", "Proses 2:\nAnalisis Kajian Pustaka\n[Input: Studi Pustaka]\n[Output: Tinjauan Pustaka]", 40, 190, 220, 70),
        ("pr3", "Proses 3:\nPenetapan Tujuan Solusi\n[Input: Masalah & Pustaka]\n[Output: Kebutuhan Sistem]", 280, 140, 220, 70),
        ("pr4", "Proses 4:\nPerancangan Arsitektur & UML\n[Input: Kebutuhan Sistem]\n[Output: Desain Sistem]", 520, 100, 220, 70),
        ("pr5", "Proses 5:\nPengembangan Microservices\n[Input: Desain Sistem]\n[Output: Sistem Pemantauan]", 520, 190, 220, 70),
        ("pr6", "Proses 6:\nDemonstrasi Web Pemkab\n[Input: Sistem Pemantauan]\n[Output: Hasil Demonstrasi]", 760, 100, 220, 70),
        ("pr7", "Proses 7:\nPengujian & Evaluasi 50 Sampel\n[Input: Skenario & Data Uji]\n[Output: Evaluasi TP, FP, FN, F1]", 760, 190, 220, 70),
        ("pr8", "Proses 8:\nKomunikasi Hasil\n[Input: Hasil Demonstrasi & Uji]\n[Output: Laporan Skripsi]", 760, 280, 220, 70)
    ]
    for prid, prtitle, x, y, w, h in procs:
        add_node(root, prid, prtitle, box_proc, x, y, w, h)

    save_drawio_file(mxfile, "methodology/gambar-3.1-alur-penelitian-dsrm.drawio")

if __name__ == '__main__':
    print("Generating native editable .drawio XML files...")
    gen_drawio_architecture()
    gen_drawio_use_case()
    gen_all_drawio_activities()
    gen_all_drawio_sequences()
    gen_drawio_component()
    gen_drawio_dsrm()
    print("ALL .DRAWIO XML FILES GENERATED SUCCESSFULLY!")
