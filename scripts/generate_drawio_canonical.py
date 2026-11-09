# -*- coding: utf-8 -*-
"""
generate_drawio_canonical.py
Membuat seluruh berkas .drawio XML kanonikal sesuai standar akademik draw.io (diagrams.net).
Murni Hitam Putih (Black & White), latar putih, garis hitam, teks hitam, font Arial.
Konektor ortogonal (siku-siku), rute terpisah, tidak bertumpuk.
"""

import os
import xml.etree.ElementTree as ET
from xml.dom import minidom

OUTPUT_DIR = r"D:\content detection\docs\bab-iv\diagrams"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_drawio_xml(diagram_name, cells_data, page_width=1169, page_height=827):
    """
    Menghasilkan dokumen XML Draw.io lengkap yang valid dan dapat langsung diedit di draw.io.
    """
    mxfile = ET.Element("mxfile", host="app.diagrams.net", agent="Antigravity-Academic", version="24.0.0", type="device")
    diagram = ET.SubElement(mxfile, "diagram", id=f"diag_{diagram_name.replace('-', '_')}", name=diagram_name)
    mxGraphModel = ET.SubElement(
        diagram,
        "mxGraphModel",
        dx="1422",
        dy="794",
        grid="1",
        gridSize="10",
        guides="1",
        tooltips="1",
        connect="1",
        arrows="1",
        fold="1",
        page="1",
        pageScale="1",
        pageWidth=str(page_width),
        pageHeight=str(page_height),
        background="#ffffff",
        math="0",
        shadow="0",
    )
    root = ET.SubElement(mxGraphModel, "root")

    # Layer dasar 0 dan 1
    ET.SubElement(root, "mxCell", id="0")
    ET.SubElement(root, "mxCell", id="1", parent="0")

    for cell in cells_data:
        c_type = cell.get("type", "vertex")
        c_id = cell["id"]
        c_val = cell.get("value", "")
        c_style = cell.get("style", "")
        c_parent = cell.get("parent", "1")

        if c_type == "vertex":
            elm = ET.SubElement(root, "mxCell", id=c_id, value=c_val, style=c_style, vertex="1", parent=c_parent)
            geom = ET.SubElement(
                elm,
                "mxGeometry",
                x=str(cell.get("x", 0)),
                y=str(cell.get("y", 0)),
                width=str(cell.get("w", 100)),
                height=str(cell.get("h", 50)),
                as_="geometry",
            )
            geom.attrib["as"] = geom.attrib.pop("as_")
        elif c_type == "edge":
            elm = ET.SubElement(
                root,
                "mxCell",
                id=c_id,
                value=c_val,
                style=c_style,
                edge="1",
                parent=c_parent,
                source=cell["source"],
                target=cell["target"],
            )
            geom = ET.SubElement(elm, "mxGeometry", relative="1", as_="geometry")
            geom.attrib["as"] = geom.attrib.pop("as_")
            
            # Titik belok ortogonal opsional jika didefinisikan
            if "points" in cell and len(cell["points"]) > 0:
                pts = ET.SubElement(geom, "Array", as_="points")
                pts.attrib["as"] = pts.attrib.pop("as_")
                for px, py in cell["points"]:
                    ET.SubElement(pts, "mxPoint", x=str(px), y=str(py))

    rough_string = ET.tostring(mxfile, encoding="utf-8")
    reparsed = minidom.parseString(rough_string)
    pretty_xml = reparsed.toprettyxml(indent="  ", encoding="utf-8").decode("utf-8")
    return pretty_xml


def build_arsitektur_microservices():
    name = "arsitektur-microservices"
    cells = []
    
    # 1. Judul Header
    cells.append({
        "type": "vertex", "id": "title",
        "value": "ARSITEKTUR SISTEM PEMANTAUAN DAN DETEKSI INDIKASI KONTEN NEGATIF\nBERBASIS MICROSERVICES",
        "style": "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontFamily=Arial;fontSize=14;fontStyle=1;fontColor=#000000;",
        "x": 200, "y": 20, "w": 700, "h": 40
    })

    # 2. Layer Presentation / Web Browser
    cells.append({
        "type": "vertex", "id": "group_user",
        "value": "User & Presentation Tier",
        "style": "swimlane;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#f8f8f8;fontColor=#000000;fontFamily=Arial;fontSize=11;fontStyle=1;startSize=25;",
        "x": 60, "y": 80, "w": 980, "h": 120
    })
    cells.append({
        "type": "vertex", "id": "actor_admin", "parent": "group_user",
        "value": "Administrator /\nPetugas CSIRT",
        "style": "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;",
        "x": 60, "y": 35, "w": 40, "h": 65
    })
    cells.append({
        "type": "vertex", "id": "dashboard", "parent": "group_user",
        "value": "Dashboard UI (React 18 + Vite)\n[Port: 5173]\nSingle Page Application (SPA), Tailwind CSS, Chart.js",
        "style": "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=11;fontStyle=1;",
        "x": 250, "y": 45, "w": 400, "h": 55
    })

    # 3. Layer Gateway & Orchestrator
    cells.append({
        "type": "vertex", "id": "group_gateway",
        "value": "API Gateway & Orchestration Tier",
        "style": "swimlane;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#f8f8f8;fontColor=#000000;fontFamily=Arial;fontSize=11;fontStyle=1;startSize=25;",
        "x": 60, "y": 230, "w": 980, "h": 140
    })
    cells.append({
        "type": "vertex", "id": "aggregator", "parent": "group_gateway",
        "value": "Aggregator Service (Node.js & Express)\n[Port: 3000]\n• API Gateway & Scrypt Auth Session\n• Asynchronous Background Scan Worker (RFC 5322)\n• Result Aggregator & Email Notification Coordinator",
        "style": "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=11;fontStyle=1;align=center;",
        "x": 200, "y": 35, "w": 580, "h": 90
    })

    # 4. Layer Microservices Deteksi
    cells.append({
        "type": "vertex", "id": "group_services",
        "value": "Microservices Detection Tier (Decoupled Services)",
        "style": "swimlane;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#f8f8f8;fontColor=#000000;fontFamily=Arial;fontSize=11;fontStyle=1;startSize=25;",
        "x": 60, "y": 400, "w": 980, "h": 150
    })
    cells.append({
        "type": "vertex", "id": "crawler_svc", "parent": "group_services",
        "value": "Crawler Service\n[Port: 3001]\nAxios, Cheerio Parser,\nBFS Queue, robots.txt",
        "style": "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;align=center;",
        "x": 30, "y": 45, "w": 210, "h": 85
    })
    cells.append({
        "type": "vertex", "id": "text_svc", "parent": "group_services",
        "value": "Text Detection Service\n[Port: 3002]\nAlgoritma Aho-Corasick,\nLeet-speak, Trie Matcher",
        "style": "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;align=center;",
        "x": 270, "y": 45, "w": 210, "h": 85
    })
    cells.append({
        "type": "vertex", "id": "link_svc", "parent": "group_services",
        "value": "Link Detection Service\n[Port: 3003]\nSuspicious URL Parser,\nExternal Domain Heuristics",
        "style": "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;align=center;",
        "x": 510, "y": 45, "w": 210, "h": 85
    })
    cells.append({
        "type": "vertex", "id": "defacement_svc", "parent": "group_services",
        "value": "Defacement Service\n[Port: 3004]\nDOM Structural Hash,\nBaseline Image Comparator",
        "style": "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;align=center;",
        "x": 750, "y": 45, "w": 200, "h": 85
    })

    # 5. Layer Data & Eksternal
    cells.append({
        "type": "vertex", "id": "group_external",
        "value": "Persistence & External Services Tier",
        "style": "swimlane;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#f8f8f8;fontColor=#000000;fontFamily=Arial;fontSize=11;fontStyle=1;startSize=25;",
        "x": 60, "y": 580, "w": 980, "h": 140
    })
    cells.append({
        "type": "vertex", "id": "target_web", "parent": "group_external",
        "value": "Situs Web Pemerintah\nKabupaten Sumbawa\n(*.sumbawakab.go.id)",
        "style": "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;align=center;",
        "x": 30, "y": 45, "w": 210, "h": 75
    })
    cells.append({
        "type": "vertex", "id": "data_pkg", "parent": "group_external",
        "value": "Data Access Package\n(@content-detection/data-access)\nScans, Jobs, Baselines",
        "style": "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;align=center;",
        "x": 360, "y": 45, "w": 230, "h": 75
    })
    cells.append({
        "type": "vertex", "id": "database", "parent": "group_external",
        "value": "Basis Data SQLite\n(scans.db)",
        "style": "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;align=center;",
        "x": 620, "y": 45, "w": 120, "h": 75
    })
    cells.append({
        "type": "vertex", "id": "smtp_server", "parent": "group_external",
        "value": "SMTP Server (Gmail)\n[smtp.gmail.com:587]\nTLS / RFC 2822 Mail",
        "style": "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;align=center;",
        "x": 770, "y": 45, "w": 180, "h": 75
    })

    # 6. Konektor Ortogonal & Panah
    # Admin -> Dashboard
    cells.append({
        "type": "edge", "id": "e_admin_dash", "source": "actor_admin", "target": "dashboard",
        "value": "HTTPS / Interaksi Web",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=classic;endFill=1;"
    })
    # Dashboard -> Aggregator
    cells.append({
        "type": "edge", "id": "e_dash_agg", "source": "dashboard", "target": "aggregator",
        "value": "REST API (JSON, Cookie HttpOnly) :3000",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=classic;endFill=1;"
    })
    # Aggregator -> Crawler
    cells.append({
        "type": "edge", "id": "e_agg_crawl", "source": "aggregator", "target": "crawler_svc",
        "value": "POST /api/v1/crawl",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=classic;endFill=1;",
        "points": [(400, 370), (165, 370)]
    })
    # Aggregator -> Text
    cells.append({
        "type": "edge", "id": "e_agg_text", "source": "aggregator", "target": "text_svc",
        "value": "POST /api/v1/detect",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=classic;endFill=1;"
    })
    # Aggregator -> Link
    cells.append({
        "type": "edge", "id": "e_agg_link", "source": "aggregator", "target": "link_svc",
        "value": "POST /api/v1/detect",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=classic;endFill=1;"
    })
    # Aggregator -> Defacement
    cells.append({
        "type": "edge", "id": "e_agg_def", "source": "aggregator", "target": "defacement_svc",
        "value": "POST /api/v1/detect",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=classic;endFill=1;",
        "points": [(680, 370), (850, 370)]
    })
    # Crawler -> Target Web
    cells.append({
        "type": "edge", "id": "e_crawl_target", "source": "crawler_svc", "target": "target_web",
        "value": "HTTP GET / Web Crawling",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=classic;endFill=1;"
    })
    # Aggregator -> Data Access
    cells.append({
        "type": "edge", "id": "e_agg_data", "source": "aggregator", "target": "data_pkg",
        "value": "Persist Scans & Jobs",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=classic;endFill=1;",
        "points": [(550, 370), (475, 370)]
    })
    # Data Access -> SQLite
    cells.append({
        "type": "edge", "id": "e_data_db", "source": "data_pkg", "target": "database",
        "value": "Read/Write SQL",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=classic;endFill=1;"
    })
    # Aggregator -> SMTP
    cells.append({
        "type": "edge", "id": "e_agg_smtp", "source": "aggregator", "target": "smtp_server",
        "value": "SMTP TLS Port 587",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=classic;endFill=1;",
        "points": [(750, 370), (860, 370)]
    })

    return name, cells, 1100, 760


def build_use_case_diagram():
    name = "use-case-diagram"
    cells = []

    # Judul
    cells.append({
        "type": "vertex", "id": "title",
        "value": "USE CASE DIAGRAM SISTEM PEMANTAUAN DAN DETEKSI KONTEN NEGATIF\nPEMERINTAH KABUPATEN SUMBAWA",
        "style": "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontFamily=Arial;fontSize=14;fontStyle=1;fontColor=#000000;",
        "x": 200, "y": 15, "w": 750, "h": 40
    })

    # System Boundary Box
    cells.append({
        "type": "vertex", "id": "system_boundary",
        "value": "Sistem Pemantauan dan Deteksi Konten Negatif Pemkab Sumbawa",
        "style": "swimlane;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=12;fontStyle=1;startSize=30;",
        "x": 220, "y": 65, "w": 680, "h": 850
    })

    # Aktor Kiri: Administrator / Petugas CSIRT
    cells.append({
        "type": "vertex", "id": "actor_admin",
        "value": "Petugas CSIRT /\nAdministrator",
        "style": "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=11;fontStyle=1;",
        "x": 60, "y": 380, "w": 50, "h": 90
    })

    # Aktor Kanan Atas: Website Target Pemerintah
    cells.append({
        "type": "vertex", "id": "actor_target",
        "value": "Website Target\nPemerintah",
        "style": "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=11;fontStyle=1;",
        "x": 970, "y": 280, "w": 50, "h": 90
    })

    # Aktor Kanan Bawah: SMTP Server (Gmail)
    cells.append({
        "type": "vertex", "id": "actor_smtp",
        "value": "SMTP Server\n(Gmail Notifier)",
        "style": "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=11;fontStyle=1;",
        "x": 970, "y": 620, "w": 50, "h": 90
    })

    # Use Cases (Ovals)
    use_cases = [
        ("uc_login", "Login Administrator\n(Autentikasi Scrypt)", 260, 110, 190, 50),
        ("uc_site", "Pengelolaan Target Website\n(CRUD Domain Terdaftar)", 260, 180, 190, 50),
        ("uc_baseline", "Pengelolaan Baseline Halaman\n(Struktur DOM Acuan)", 260, 250, 190, 50),
        ("uc_scan", "Melakukan Pemindaian Website\n(Mandiri & Asinkron)", 260, 330, 200, 55),
        ("uc_crawl", "Perayapan Web (Crawling)\n(BFS & robots.txt)", 560, 330, 190, 50),
        ("uc_text", "Deteksi Konten Teks\n(Algoritma Aho-Corasick)", 670, 410, 190, 50),
        ("uc_link", "Deteksi Tautan Mencurigakan\n(Eksternal & Phishing)", 670, 480, 190, 50),
        ("uc_def", "Deteksi Defacement\n(Visual & Structural Hash)", 670, 550, 190, 50),
        ("uc_email", "Pengiriman Notifikasi Email\n(RFC 2822 / Nodemailer)", 670, 630, 190, 50),
        ("uc_view", "Melihat Hasil Pemindaian &\nDetail Temuan", 260, 480, 190, 50),
        ("uc_history", "Melihat Riwayat Pemindaian\n(Daftar Log Riwayat)", 260, 570, 190, 50),
        ("uc_export", "Ekspor Laporan\n(Format PDF & CSV)", 260, 660, 190, 50),
    ]

    for uid, uval, ux, uy, uw, uh in use_cases:
        cells.append({
            "type": "vertex", "id": uid, "parent": "system_boundary",
            "value": uval,
            "style": "ellipse;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;align=center;",
            "x": ux - 220, "y": uy - 65, "w": uw, "h": uh
        })

    # Asosiasi Primer (Solid Lines): Admin -> UC
    cells.append({"type": "edge", "id": "e_a_login", "source": "actor_admin", "target": "uc_login", "value": "",
                  "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;endArrow=none;endFill=0;"})
    cells.append({"type": "edge", "id": "e_a_site", "source": "actor_admin", "target": "uc_site", "value": "",
                  "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;endArrow=none;endFill=0;"})
    cells.append({"type": "edge", "id": "e_a_base", "source": "actor_admin", "target": "uc_baseline", "value": "",
                  "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;endArrow=none;endFill=0;"})
    cells.append({"type": "edge", "id": "e_a_scan", "source": "actor_admin", "target": "uc_scan", "value": "",
                  "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;endArrow=none;endFill=0;"})
    cells.append({"type": "edge", "id": "e_a_view", "source": "actor_admin", "target": "uc_view", "value": "",
                  "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;endArrow=none;endFill=0;"})
    cells.append({"type": "edge", "id": "e_a_hist", "source": "actor_admin", "target": "uc_history", "value": "",
                  "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;endArrow=none;endFill=0;"})

    # Relasi <<include>> (Dashed with open arrow)
    cells.append({
        "type": "edge", "id": "e_inc_scan_crawl", "source": "uc_scan", "target": "uc_crawl",
        "value": "<<include>>",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=2;dashed=1;endArrow=open;endFill=0;"
    })
    cells.append({
        "type": "edge", "id": "e_inc_crawl_text", "source": "uc_crawl", "target": "uc_text",
        "value": "<<include>>",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=2;dashed=1;endArrow=open;endFill=0;",
        "points": [(750, 355), (765, 355)]
    })
    cells.append({
        "type": "edge", "id": "e_inc_crawl_link", "source": "uc_crawl", "target": "uc_link",
        "value": "<<include>>",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=2;dashed=1;endArrow=open;endFill=0;"
    })
    cells.append({
        "type": "edge", "id": "e_inc_crawl_def", "source": "uc_crawl", "target": "uc_def",
        "value": "<<include>>",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=2;dashed=1;endArrow=open;endFill=0;"
    })
    cells.append({
        "type": "edge", "id": "e_inc_crawl_mail", "source": "uc_crawl", "target": "uc_email",
        "value": "<<include>>",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=2;dashed=1;endArrow=open;endFill=0;"
    })
    cells.append({
        "type": "edge", "id": "e_inc_view_hist", "source": "uc_view", "target": "uc_history",
        "value": "<<include>>",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=2;dashed=1;endArrow=open;endFill=0;"
    })

    # Relasi <<extend>>: Export -> View
    cells.append({
        "type": "edge", "id": "e_ext_export_view", "source": "uc_export", "target": "uc_view",
        "value": "<<extend>>",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=2;dashed=1;endArrow=open;endFill=0;",
        "points": [(355, 660), (355, 530)]
    })

    # Asosiasi ke Sistem Eksternal (Solid Lines)
    cells.append({
        "type": "edge", "id": "e_crawl_target", "source": "uc_crawl", "target": "actor_target", "value": "",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;endArrow=none;endFill=0;"
    })
    cells.append({
        "type": "edge", "id": "e_mail_smtp", "source": "uc_email", "target": "actor_smtp", "value": "",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;endArrow=none;endFill=0;"
    })

    return name, cells, 1120, 940


def build_activity_diagram():
    name = "activity-diagram"
    cells = []

    # Judul Header
    cells.append({
        "type": "vertex", "id": "title",
        "value": "ACTIVITY DIAGRAM ALUR PEMINDAIAN DAN DETEKSI INDIKASI KONTEN NEGATIF\n(PEMERINTAH KABUPATEN SUMBAWA)",
        "style": "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontFamily=Arial;fontSize=14;fontStyle=1;fontColor=#000000;",
        "x": 150, "y": 15, "w": 850, "h": 40
    })

    # 4 Swimlanes formal draw.io
    lanes = [
        ("lane1", "Petugas CSIRT / Admin", 50, 70, 240, 960),
        ("lane2", "Aggregator Service & Dashboard", 290, 70, 270, 960),
        ("lane3", "Worker & Detection Services", 560, 70, 310, 960),
        ("lane4", "Database (SQLite) & SMTP", 870, 70, 240, 960),
    ]

    for lid, ltitle, lx, ly, lw, lh in lanes:
        cells.append({
            "type": "vertex", "id": lid,
            "value": ltitle,
            "style": "swimlane;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#f8f8f8;fontColor=#000000;fontFamily=Arial;fontSize=11;fontStyle=1;startSize=30;",
            "x": lx, "y": ly, "w": lw, "h": lh
        })

    # Simbol Awal: Initial Node (Lingkaran Hitam)
    cells.append({
        "type": "vertex", "id": "init_node", "parent": "lane1",
        "value": "",
        "style": "ellipse;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;",
        "x": 105, "y": 45, "w": 30, "h": 30
    })

    # Aktivitas-aktivitas
    nodes = [
        # (id, parent, label, x, y, w, h, style_type)
        ("act_access", "lane1", "Mengakses Antarmuka\nSistem Pemantauan", 40, 100, 160, 45, "rounded"),
        ("act_show_login", "lane2", "Menampilkan Halaman\nLogin Administrator", 50, 100, 170, 45, "rounded"),
        ("act_input_cred", "lane1", "Memasukkan Nama Pengguna\ndan Kata Sandi", 40, 170, 160, 45, "rounded"),
        ("act_verify_cred", "lane2", "Verifikasi Hash Scrypt &\nValidasi Autentikasi", 50, 170, 170, 45, "rounded"),
        ("dec_auth", "lane2", "Kredensial\nValid?", 95, 235, 80, 50, "diamond"),
        ("act_auth_err", "lane2", "Tampilkan Kesalahan\nLogin", 185, 240, 80, 40, "rounded"),
        ("act_show_dash", "lane2", "Menampilkan Dashboard Utama\ndan Formulir Pemindaian", 45, 305, 180, 45, "rounded"),
        ("act_input_scan", "lane1", "Memasukkan URL Target,\nKedalaman, & Email Petugas", 35, 375, 170, 45, "rounded"),
        ("act_val_input", "lane2", "Validasi Parameter &\nSintaks Email (RFC 5322)", 45, 375, 180, 45, "rounded"),
        ("act_init_job", "lane4", "Buat Job Pemindaian\n(Status: running)", 35, 375, 170, 45, "rounded"),
        ("act_crawl", "lane3", "Crawler Service: Ambil robots.txt,\nUnduh HTML, Ekstraksi BFS", 40, 440, 230, 50, "rounded"),
        ("fork_bar", "lane3", "", 20, 515, 270, 8, "fork"),
        ("act_text", "lane3", "Deteksi Teks:\nAlgoritma Aho-Corasick\n(Trie Kata Kunci Judol/Porn)", 15, 545, 130, 60, "rounded"),
        ("act_link", "lane3", "Deteksi Tautan:\nAnalisis Heuristik\nDomain Eksternal", 155, 545, 135, 60, "rounded"),
        ("act_def", "lane3", "Deteksi Defacement:\nKomparasi DOM &\nVisual Hash Baseline", 85, 625, 140, 55, "rounded"),
        ("join_bar", "lane3", "", 20, 700, 270, 8, "fork"),
        ("act_aggregate", "lane2", "Aggregator: Mengumpulkan\n& Merekapitulasi Temuan", 45, 725, 180, 50, "rounded"),
        ("act_save_db", "lane4", "Simpan Hasil Pemindaian ke\nBasis Data SQLite (scans)", 35, 725, 170, 50, "rounded"),
        ("act_send_email", "lane4", "Kirim Laporan Email Hasil\nvia SMTP Server Gmail", 35, 800, 170, 50, "rounded"),
        ("act_update_ui", "lane2", "Perbarui Dashboard &\nSpanduk Konfirmasi Email", 45, 865, 180, 50, "rounded"),
        ("act_view_report", "lane1", "Melihat Detail Hasil &\nEkspor Laporan (PDF/CSV)", 35, 865, 170, 50, "rounded"),
        ("final_node", "lane1", "", 105, 940, 30, 30, "final"),
    ]

    for nid, nparent, nlabel, nx, ny, nw, nh, ntype in nodes:
        if ntype == "rounded":
            style = "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=1;align=center;"
        elif ntype == "diamond":
            style = "rhombus;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=1;align=center;"
        elif ntype == "fork":
            style = "rounded=0;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;"
        elif ntype == "final":
            style = "ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;"
        
        cells.append({
            "type": "vertex", "id": nid, "parent": nparent,
            "value": nlabel, "style": style,
            "x": nx, "y": ny, "w": nw, "h": nh
        })

    # Aliran Kontrol (Orthogonal Edges)
    edges = [
        ("init_node", "act_access", ""),
        ("act_access", "act_show_login", ""),
        ("act_show_login", "act_input_cred", ""),
        ("act_input_cred", "act_verify_cred", ""),
        ("act_verify_cred", "dec_auth", ""),
        ("dec_auth", "act_auth_err", "TIDAK"),
        ("act_auth_err", "act_input_cred", ""),
        ("dec_auth", "act_show_dash", "YA"),
        ("act_show_dash", "act_input_scan", ""),
        ("act_input_scan", "act_val_input", ""),
        ("act_val_input", "act_init_job", "Valid"),
        ("act_init_job", "act_crawl", "Trigger"),
        ("act_crawl", "fork_bar", ""),
        ("fork_bar", "act_text", ""),
        ("fork_bar", "act_link", ""),
        ("fork_bar", "act_def", ""),
        ("act_text", "join_bar", ""),
        ("act_link", "join_bar", ""),
        ("act_def", "join_bar", ""),
        ("join_bar", "act_aggregate", ""),
        ("act_aggregate", "act_save_db", ""),
        ("act_save_db", "act_send_email", "Selesai"),
        ("act_send_email", "act_update_ui", ""),
        ("act_update_ui", "act_view_report", ""),
        ("act_view_report", "final_node", ""),
    ]

    for idx, (esrc, etgt, elbl) in enumerate(edges):
        cells.append({
            "type": "edge", "id": f"e_act_{idx}", "source": esrc, "target": etgt, "value": elbl,
            "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=1;endArrow=classic;endFill=1;"
        })

    return name, cells, 1160, 1060


def build_sequence_diagram():
    name = "sequence-diagram"
    cells = []

    # Judul
    cells.append({
        "type": "vertex", "id": "title",
        "value": "SEQUENCE DIAGRAM INTERAKSI KOMPREHENSIF PEMINDAIAN SITUS WEB\nPEMERINTAH KABUPATEN SUMBAWA",
        "style": "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontFamily=Arial;fontSize=14;fontStyle=1;fontColor=#000000;",
        "x": 150, "y": 15, "w": 850, "h": 40
    })

    # Partisipan Lifelines (Horizontal Header)
    participants = [
        ("p_admin", "Petugas CSIRT\n(Admin)", 60, 70, 90, 45, "actor"),
        ("p_dash", "Dashboard UI\n(React :5173)", 180, 70, 100, 45, "rect"),
        ("p_agg", "Aggregator Svc\n(Orchestrator :3000)", 310, 70, 110, 45, "rect"),
        ("p_crawl", "Crawler Svc\n(Port :3001)", 450, 70, 95, 45, "rect"),
        ("p_text", "Text Det Svc\n(Aho-Corasick :3002)", 570, 70, 110, 45, "rect"),
        ("p_link", "Link Det Svc\n(Port :3003)", 705, 70, 95, 45, "rect"),
        ("p_def", "Defacement Svc\n(Port :3004)", 825, 70, 105, 45, "rect"),
        ("p_db", "SQLite DB\n(scans.db)", 955, 70, 85, 45, "cylinder"),
        ("p_smtp", "SMTP Server\n(Gmail :587)", 1065, 70, 95, 45, "rect"),
    ]

    for pid, plbl, px, py, pw, ph, pkind in participants:
        if pkind == "actor":
            style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;"
            cells.append({"type": "vertex", "id": pid, "value": plbl, "style": style, "x": px + 25, "y": py, "w": 35, "h": 50})
        elif pkind == "cylinder":
            style = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=10;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=1;align=center;"
            cells.append({"type": "vertex", "id": pid, "value": plbl, "style": style, "x": px, "y": py, "w": pw, "h": ph})
        else:
            style = "rounded=0;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=1;align=center;"
            cells.append({"type": "vertex", "id": pid, "value": plbl, "style": style, "x": px, "y": py, "w": pw, "h": ph})

        # Lifeline vertikal putus-putus
        line_x = px + pw // 2 if pkind != "actor" else px + 42
        cells.append({
            "type": "vertex", "id": f"ll_{pid}",
            "value": "",
            "style": "edgeStyle=none;html=1;dashed=1;strokeColor=#000000;fillColor=none;",
            "x": line_x, "y": 125, "w": 2, "h": 680
        })

    # Messages (Horisontal)
    seq_msgs = [
        ("p_admin", "p_dash", "1: Input URL Target & Email Petugas", 150, "solid"),
        ("p_dash", "p_agg", "2: POST /api/v1/scan (maxPages, depth)", 185, "solid"),
        ("p_agg", "p_db", "3: createScanJob(status='running')", 220, "solid"),
        ("p_db", "p_agg", "4: 201 Created (jobId: 'job-xxxx')", 250, "dashed"),
        ("p_agg", "p_dash", "5: 202 Accepted (Background Worker Dispatched)", 280, "dashed"),
        ("p_agg", "p_crawl", "6: POST /api/v1/crawl (startUrl, robots.txt)", 320, "solid"),
        ("p_crawl", "p_agg", "7: 200 OK (pages: [{url, html, text, links}])", 360, "dashed"),
        ("p_agg", "p_text", "8: POST /api/v1/detect (text, leet-speak)", 410, "solid"),
        ("p_text", "p_agg", "9: 200 OK (matches, confidence, categories)", 445, "dashed"),
        ("p_agg", "p_link", "10: POST /api/v1/detect (extracted links)", 480, "solid"),
        ("p_link", "p_agg", "11: 200 OK (suspiciousDomain, indicators)", 515, "dashed"),
        ("p_agg", "p_def", "12: POST /api/v1/detect (DOM structure, hash)", 550, "solid"),
        ("p_def", "p_agg", "13: 200 OK (defaced: bool, visualRatio)", 585, "dashed"),
        ("p_agg", "p_db", "14: createMany(scanRecords) & updateJob(completed)", 630, "solid"),
        ("p_db", "p_agg", "15: Success (Persisted in scans.db)", 660, "dashed"),
        ("p_agg", "p_smtp", "16: sendMail(Notifikasi Hasil Pemindaian)", 700, "solid"),
        ("p_smtp", "p_agg", "17: 250 OK (RFC 2822 Message-ID)", 730, "dashed"),
        ("p_dash", "p_agg", "18: GET /api/v1/scans/recent", 760, "solid"),
        ("p_agg", "p_dash", "19: 200 OK (scanSummary & emailStatus)", 785, "dashed"),
        ("p_dash", "p_admin", "20: Tampilkan Ringkasan Hasil & Notifikasi Email", 810, "solid"),
    ]

    for idx, (msrc, mtgt, mlbl, my, mstyle) in enumerate(seq_msgs):
        dash_val = "1" if mstyle == "dashed" else "0"
        arrow_val = "open" if mstyle == "dashed" else "classic"
        cells.append({
            "type": "edge", "id": f"e_seq_{idx}", "source": msrc, "target": mtgt, "value": mlbl,
            "style": f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=1;dashed={dash_val};endArrow={arrow_val};endFill=1;",
            "points": [(100, my), (1100, my)]
        })

    return name, cells, 1200, 880


def build_component_diagram():
    name = "component-diagram"
    cells = []

    # Judul
    cells.append({
        "type": "vertex", "id": "title",
        "value": "COMPONENT DIAGRAM ARSITEKTUR PERANGKAT LUNAK SISTEM PEMANTAUAN\nDAN DETEKSI KONTEN NEGATIF BERBASIS MICROSERVICES",
        "style": "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontFamily=Arial;fontSize=14;fontStyle=1;fontColor=#000000;",
        "x": 150, "y": 15, "w": 850, "h": 40
    })

    # Komponen-komponen UML Standar
    components = [
        ("cmp_dash", "«component»\nDashboard UI\n(React 18 / Vite)", 80, 80, 220, 80),
        ("cmp_agg", "«component»\nAggregator Service\n(Express API Gateway)", 420, 80, 260, 90),
        ("cmp_crawl", "«component»\nCrawler Service\n(Axios / Cheerio)", 80, 240, 220, 80),
        ("cmp_text", "«component»\nText Detection Service\n(Algoritma Aho-Corasick)", 350, 240, 220, 80),
        ("cmp_link", "«component»\nLink Detection Service\n(Heuristic Parser)", 620, 240, 220, 80),
        ("cmp_def", "«component»\nDefacement Service\n(DOM & Visual Hash)", 880, 240, 220, 80),
        ("cmp_data", "«component»\nData Access Package\n(@content-detection/data-access)", 420, 390, 260, 80),
        ("cmp_db", "«database»\nSQLite Database\n(scans.db)", 750, 390, 180, 80),
        ("cmp_smtp", "«external»\nSMTP Mail Server\n(smtp.gmail.com)", 880, 80, 200, 80),
        ("cmp_target", "«external»\nSitus Web Pemerintah\n(*.sumbawakab.go.id)", 80, 390, 220, 80),
    ]

    for cid, clbl, cx, cy, cw, ch in components:
        style = "shape=module;align=left;spacingLeft=20;align=center;verticalAlign=middle;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;"
        if "database" in clbl:
            style = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=12;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;align=center;"
        cells.append({"type": "vertex", "id": cid, "value": clbl, "style": style, "x": cx, "y": cy, "w": cw, "h": ch})

    # Dependensi «use» antarkomponen
    comp_deps = [
        ("cmp_dash", "cmp_agg", "«use» REST API :3000"),
        ("cmp_agg", "cmp_crawl", "«use» POST :3001"),
        ("cmp_agg", "cmp_text", "«use» POST :3002"),
        ("cmp_agg", "cmp_link", "«use» POST :3003"),
        ("cmp_agg", "cmp_def", "«use» POST :3004"),
        ("cmp_agg", "cmp_data", "«use» Repository Interface"),
        ("cmp_data", "cmp_db", "better-sqlite3"),
        ("cmp_agg", "cmp_smtp", "«use» SMTP TLS :587"),
        ("cmp_crawl", "cmp_target", "«use» HTTP GET"),
    ]

    for idx, (csrc, ctgt, clbl) in enumerate(comp_deps):
        cells.append({
            "type": "edge", "id": f"e_cmp_{idx}", "source": csrc, "target": ctgt, "value": clbl,
            "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=2;dashed=1;endArrow=open;endFill=0;"
        })

    return name, cells, 1150, 520


def build_diagram_metode_dsrm():
    name = "diagram-metode-dsrm"
    cells = []

    # Judul
    cells.append({
        "type": "vertex", "id": "title",
        "value": "ALUR PENELITIAN DESIGN SCIENCE RESEARCH METHODOLOGY (DSRM)\nSISTEM PEMANTAUAN DAN DETEKSI KONTEN NEGATIF PEMKAB SUMBAWA",
        "style": "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontFamily=Arial;fontSize=14;fontStyle=1;fontColor=#000000;",
        "x": 100, "y": 15, "w": 900, "h": 40
    })

    # 6 Tahapan DSRM formal draw.io (Peffers et al., 2007)
    stages = [
        ("dsrm_1", "Tahap 1: Identifikasi Masalah & Motivasi (Problem Identification & Motivation)\n"
                   "• Maraknya sisipan judi online, konten pornografi, dan defacement pada situs resmi Pemkab Sumbawa.\n"
                   "• Kebutuhan mekanisme inspeksi otomatis berbasis microservices dan pencocokan pola kata kunci Aho-Corasick.",
         150, 80, 780, 75),

        ("dsrm_2", "Tahap 2: Penentuan Tujuan Solusi (Define Objectives of a Solution)\n"
                   "• Merancang arsitektur sistem mandiri berbasis decoupled microservices (REST API Node.js).\n"
                   "• Menyediakan fitur deteksi teks multi-pola, deteksi tautan tersembunyi, verifikasi hash baseline defacement,\n"
                   "  serta pengiriman notifikasi surel terotomasi kepada petugas CSIRT pengelola.",
         150, 185, 780, 80),

        ("dsrm_3", "Tahap 3: Perancangan dan Pengembangan (Design and Development)\n"
                   "• Perancangan diagram Unified Modeling Language (UML): Use Case, Activity, Sequence, Component.\n"
                   "• Pengembangan 5 microservices: Aggregator, Crawler (BFS), Text Detection (Aho-Corasick Trie),\n"
                   "  Link Detection (Heuristik), Defacement Detection, SQLite Persistence, dan Dashboard React UI.",
         150, 295, 780, 85),

        ("dsrm_4", "Tahap 4: Demonstrasi (Demonstration)\n"
                   "• Pengujian pemindaian mandiri terhadap situs aktif instansi Kabupaten Sumbawa (sumbawakab.go.id, uts.ac.id).\n"
                   "• Verifikasi operasional background scanning worker dan validasi pengiriman notifikasi email via SMTP Gmail.",
         150, 410, 780, 75),

        ("dsrm_5", "Tahap 5: Evaluasi (Evaluation)\n"
                   "• Pengujian empiris 50 sampel dataset (25 situs normal Pemkab Sumbawa + 25 sampel indikasi negatif).\n"
                   "• Evaluasi metrik performa Confusion Matrix: True Positive (25), True Negative (25), False Positive (0),\n"
                   "  False Negative (0), Akurasi 100%, Presisi 100%, Recall 100%, dan F1-Score 100%.\n"
                   "• Pengujian otomatis unit & integrasi (214 test case).",
         150, 515, 780, 95),

        ("dsrm_6", "Tahap 6: Komunikasi (Communication)\n"
                   "• Penyusunan naskah skripsi lengkap (BAB I s/d BAB V) sesuai format akademik Universitas Teknologi Sumbawa.\n"
                   "• Dokumentasi laporan audit teknis, penyusunan artikel publikasi ilmiah, dan presentasi hasil penelitian.",
         150, 640, 780, 75),
    ]

    for sid, slbl, sx, sy, sw, sh in stages:
        style = "rounded=1;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;align=left;spacingLeft=15;"
        cells.append({"type": "vertex", "id": sid, "value": slbl, "style": style, "x": sx, "y": sy, "w": sw, "h": sh})

    # Panah Alur Berurutan (Sequential Downward Connectors)
    for i in range(len(stages) - 1):
        cells.append({
            "type": "edge", "id": f"e_dsrm_{i}", "source": stages[i][0], "target": stages[i+1][0], "value": "",
            "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=10;endArrow=classic;endFill=1;"
        })

    # Feedback Loop / Iterasi Umpan Balik: Tahap 5 (Evaluasi) -> Tahap 3 (Perancangan)
    cells.append({
        "type": "edge", "id": "e_dsrm_feedback", "source": "dsrm_5", "target": "dsrm_3",
        "value": "Iterasi Perbaikan & Optimasi Pola (Feedback Loop)",
        "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;fontStyle=2;dashed=1;endArrow=classic;endFill=1;",
        "points": [(150, 560), (70, 560), (70, 335), (150, 335)]
    })

    return name, cells, 1080, 760


def main():
    print("Membangun seluruh berkas XML .drawio kanonikal...")
    builders = [
        build_arsitektur_microservices,
        build_use_case_diagram,
        build_activity_diagram,
        build_sequence_diagram,
        build_component_diagram,
        build_diagram_metode_dsrm,
    ]

    for builder in builders:
        name, cells, w, h = builder()
        xml_content = create_drawio_xml(name, cells, w, h)
        file_path = os.path.join(OUTPUT_DIR, f"{name}.drawio")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(xml_content)
        print(f"Berhasil membuat: {file_path} ({len(cells)} cells)")

if __name__ == "__main__":
    main()
