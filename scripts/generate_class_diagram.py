# -*- coding: utf-8 -*-
"""
generate_class_diagram.py
Membuat Class Diagram sistem Content Detection Pemerintah Kabupaten Sumbawa:
- Gaya Academic Draw.io Pure Black & White (latar putih, garis hitam, teks hitam, font Arial).
- Kotak kelas 3 kompartemen (Nama Kelas, Atribut tipe data, Metode/Operasi).
- Relasi asosiasi lengkap dengan kardinalitas (1, 0..*, 0..1, 1..*).
- Menghasilkan berkas .drawio XML (editable), .png (300 DPI), dan .svg.
"""

import os
import xml.etree.ElementTree as ET
from xml.dom import minidom
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Rectangle

OUTPUT_DIR = r"D:\content detection\docs\bab-iv\diagrams"
CLASS_DIR = os.path.join(OUTPUT_DIR, "class")
os.makedirs(CLASS_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# 1. DRAW.IO XML GENERATOR
# -----------------------------------------------------------------------------
def build_class_drawio_xml():
    mxfile = ET.Element("mxfile", host="app.diagrams.net", agent="Antigravity", version="24.0.0", type="device")
    diagram = ET.SubElement(mxfile, "diagram", id="diag_class_diagram", name="Class Diagram")
    model = ET.SubElement(
        diagram, "mxGraphModel",
        dx="1422", dy="1000", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1",
        fold="1", page="1", pageScale="1", pageWidth="1400", pageHeight="1100", background="#ffffff"
    )
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", id="0")
    ET.SubElement(root, "mxCell", id="1", parent="0")

    def add_v(cid, val, style, x, y, w, h):
        c = ET.SubElement(root, "mxCell", id=cid, value=val, style=style, vertex="1", parent="1")
        g = ET.SubElement(c, "mxGeometry", x=str(x), y=str(y), width=str(w), height=str(h))
        g.attrib["as"] = "geometry"
        return c

    def add_e(cid, val, style, src, tgt, points=None):
        c = ET.SubElement(root, "mxCell", id=cid, value=val, style=style, edge="1", parent="1", source=src, target=tgt)
        g = ET.SubElement(c, "mxGeometry", relative="1")
        g.attrib["as"] = "geometry"
        if points:
            pts = ET.SubElement(g, "Array")
            pts.attrib["as"] = "points"
            for px, py in points:
                ET.SubElement(pts, "mxPoint", x=str(px), y=str(py))
        return c

    # Title
    add_v("title", "CLASS DIAGRAM SISTEM PEMANTAUAN DAN DETEKSI KONTEN NEGATIF\nPEMERINTAH KABUPATEN SUMBAWA",
          "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontFamily=Arial;fontSize=14;fontStyle=1;fontColor=#000000;",
          250, 20, 800, 40)

    # Style Class Box UML Draw.io
    style_cls = "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=11;"
    style_item = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontFamily=Arial;fontSize=9;fontColor=#000000;"
    style_line = "line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;strokeColor=#000000;"

    classes_data = [
        # (id, name, x, y, w, h, attrs, methods)
        ("cls_user", "User", 60, 90, 230, 190,
         ["- id: String", "- username: String", "- password_hash: String", "- role: String", "- created_at: DateTime", "- updated_at: DateTime"],
         ["+ verifyPassword(pass: String): Boolean", "+ createSession(): String", "+ validateRole(role: String): Boolean"]),

        ("cls_scanjob", "ScanJob", 360, 90, 250, 210,
         ["- id: String", "- type: String", "- target_url: String", "- officer_email: String", "- status: String", "- progress_scanned: Integer", "- progress_total: Integer", "- started_at: DateTime", "- completed_at: DateTime"],
         ["+ create(job: Object): ScanJob", "+ updateProgress(id: String, cur: Int): Boolean", "+ findRunning(): ScanJob[]", "+ markFailed(id: String, err: String): Boolean"]),

        ("cls_notification", "Notification", 680, 90, 240, 190,
         ["- id: String", "- scan_id: String", "- channel: String", "- recipient: String", "- subject: String", "- status: String", "- error_message: String", "- sent_at: DateTime"],
         ["+ create(notif: Object): Notification", "+ updateStatus(id: String, st: String): Boolean", "+ findByScanId(scanId: String): Notification", "+ listRecent(): Notification[]"]),

        ("cls_site", "Site", 60, 390, 240, 240,
         ["- id: String", "- name: String", "- url: String", "- allowed_host: String", "- status: String", "- max_depth: Integer", "- max_pages: Integer", "- baseline_html: Text", "- created_at: DateTime", "- updated_at: DateTime"],
         ["+ create(data: Object): Site", "+ update(id: String, data: Object): Boolean", "+ delete(id: String): Boolean", "+ findByUrl(url: String): Site", "+ listActive(): Site[]"]),

        ("cls_scan", "Scan", 360, 380, 260, 310,
         ["- id: String", "- url: String", "- scanned_at: DateTime", "- crawl_status: String", "- http_status: Integer", "- title: String", "- scan_source: String", "- officer_email: String", "- text_detection_status: String", "- text_detection_result: JSON", "- defacement_detection_status: String", "- defacement_detection_result: JSON", "- link_detection_status: String", "- link_detection_result: JSON"],
         ["+ create(record: Object): Scan", "+ createMany(records: Object[]): Scan[]", "+ findById(id: String): Scan", "+ findRecent(limit: Integer): Scan[]", "+ deleteById(id: String): Boolean"]),

        ("cls_baseline", "BaselinePage", 690, 420, 240, 180,
         ["- id: String", "- site_url: String", "- html_content: Text", "- dom_structure_hash: String", "- visual_hash: String", "- captured_at: DateTime"],
         ["+ saveBaseline(url: String, html: Text): Boolean", "+ getBaseline(url: String): BaselinePage", "+ compareHash(hash: String): Float"]),

        ("cls_schedule", "Schedule", 60, 710, 240, 220,
         ["- id: String", "- name: String", "- target_type: String", "- site_ids: JSON", "- frequency: String", "- time_of_day: String", "- timezone: String", "- status: String", "- is_running: Integer", "- next_run_at: DateTime"],
         ["+ create(sched: Object): Schedule", "+ update(id: String, data: Object): Boolean", "+ findDue(now: DateTime): Schedule[]", "+ toggleStatus(id: String): Boolean"]),
    ]

    for cid, cname, cx, cy, cw, ch, attrs, methods in classes_data:
        add_v(cid, cname, style_cls, cx, cy, cw, ch)
        attr_text = "\n".join(attrs)
        add_v(f"{cid}_attrs", attr_text, style_item, cx, cy + 26, cw, len(attrs) * 14 + 10)
        # Separator line
        sep_y = cy + 26 + len(attrs) * 14 + 10
        add_v(f"{cid}_sep", "", style_line, cx, sep_y, cw, 8)
        method_text = "\n".join(methods)
        add_v(f"{cid}_methods", method_text, style_item, cx, sep_y + 8, cw, len(methods) * 14 + 10)

    # Style Asosiasi Garis Lurus Ortogonal
    style_edge = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=10;fontStyle=1;endArrow=none;endFill=0;"

    # Relationships:
    # User 1 --- 0..* ScanJob
    add_e("rel_user_scanjob", "1                        0..*", style_edge, "cls_user", "cls_scanjob")

    # ScanJob 1 --- 1..* Scan
    add_e("rel_scanjob_scan", "1\n\n1..*", style_edge, "cls_scanjob", "cls_scan")

    # Scan 1 --- 0..1 Notification
    add_e("rel_scan_notif", "1\n\n0..1", style_edge, "cls_scan", "cls_notification", points=[(620, 480), (800, 480), (800, 280)])

    # Site 1 --- 0..* Scan
    add_e("rel_site_scan", "1                        0..*", style_edge, "cls_site", "cls_scan")

    # Site 1 --- 0..1 BaselinePage
    add_e("rel_site_baseline", "1\n\n0..1", style_edge, "cls_site", "cls_baseline", points=[(180, 630), (180, 670), (810, 670), (810, 600)])

    # Site 1 --- 0..* Schedule
    add_e("rel_site_schedule", "1\n\n0..*", style_edge, "cls_site", "cls_schedule")

    rough = ET.tostring(mxfile, encoding="utf-8")
    reparsed = minidom.parseString(rough)
    return reparsed.toprettyxml(indent="  ", encoding="utf-8").decode("utf-8")


# -----------------------------------------------------------------------------
# 2. RENDER HIGH-RES PNG (300 DPI) & SVG
# -----------------------------------------------------------------------------
def render_class_diagram_image():
    fig, ax = plt.subplots(figsize=(13, 11), dpi=300)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    ax.set_xlim(0, 1300)
    ax.set_ylim(0, 1100)
    ax.axis('off')

    # Title
    ax.text(650, 1070, "CLASS DIAGRAM SISTEM PEMANTAUAN DAN DETEKSI KONTEN NEGATIF\nPEMERINTAH KABUPATEN SUMBAWA",
            ha='center', va='center', fontsize=11, fontweight='bold', fontfamily='Arial')

    def draw_class_box(x, y, w, h, class_name, attrs, methods):
        # Outer box
        rect = Rectangle((x, y), w, h, facecolor='#FFFFFF', edgecolor='#000000', linewidth=1.3, zorder=3)
        ax.add_patch(rect)
        # Header box
        h_h = 28
        h_rect = Rectangle((x, y + h - h_h), w, h_h, facecolor='#FAFAFA', edgecolor='#000000', linewidth=1.1, zorder=4)
        ax.add_patch(h_rect)
        ax.text(x + w/2, y + h - 14, class_name, ha='center', va='center', fontsize=9.5, fontweight='bold', fontfamily='Arial', color='#000000', zorder=5)

        # Attributes section
        attr_y_start = y + h - h_h - 12
        line_spacing = 13.5
        for idx, attr in enumerate(attrs):
            ax.text(x + 10, attr_y_start - idx * line_spacing, attr, ha='left', va='center', fontsize=7.2, fontfamily='Arial', color='#000000', zorder=5)

        # Separator line
        sep_y = attr_y_start - len(attrs) * line_spacing + 4
        ax.plot([x, x + w], [sep_y, sep_y], color='#000000', lw=1.1, zorder=4)

        # Methods section
        method_y_start = sep_y - 12
        for idx, method in enumerate(methods):
            ax.text(x + 10, method_y_start - idx * line_spacing, method, ha='left', va='center', fontsize=7.2, fontfamily='Arial', color='#000000', zorder=5)

    # Class Definitions
    # Top Row
    # User
    draw_class_box(60, 770, 240, 240, "User",
                   ["- id: String", "- username: String", "- password_hash: String", "- role: String", "- created_at: DateTime", "- updated_at: DateTime"],
                   ["+ verifyPassword(pass: String): Boolean", "+ createSession(): String", "+ validateRole(role: String): Boolean"])

    # ScanJob
    draw_class_box(390, 750, 260, 260, "ScanJob",
                   ["- id: String", "- type: String", "- target_url: String", "- officer_email: String", "- status: String", "- progress_scanned: Integer", "- progress_total: Integer", "- started_at: DateTime", "- completed_at: DateTime"],
                   ["+ create(job: Object): ScanJob", "+ updateProgress(id: String, cur: Int): Boolean", "+ findRunning(): ScanJob[]", "+ markFailed(id: String, err: String): Boolean"])

    # Notification
    draw_class_box(740, 770, 250, 240, "Notification",
                   ["- id: String", "- scan_id: String", "- channel: String", "- recipient: String", "- subject: String", "- status: String", "- error_message: String", "- sent_at: DateTime"],
                   ["+ create(notif: Object): Notification", "+ updateStatus(id: String, st: String): Boolean", "+ findByScanId(scanId: String): Notification", "+ listRecent(): Notification[]"])

    # Middle / Bottom Row
    # Site
    draw_class_box(60, 420, 240, 260, "Site",
                   ["- id: String", "- name: String", "- url: String", "- allowed_host: String", "- status: String", "- max_depth: Integer", "- max_pages: Integer", "- baseline_html: Text", "- created_at: DateTime", "- updated_at: DateTime"],
                   ["+ create(data: Object): Site", "+ update(id: String, data: Object): Boolean", "+ delete(id: String): Boolean", "+ findByUrl(url: String): Site", "+ listActive(): Site[]"])

    # Scan
    draw_class_box(390, 360, 260, 320, "Scan",
                   ["- id: String", "- url: String", "- scanned_at: DateTime", "- crawl_status: String", "- http_status: Integer", "- title: String", "- scan_source: String", "- officer_email: String", "- text_detection_status: String", "- text_detection_result: JSON", "- defacement_detection_status: String", "- defacement_detection_result: JSON", "- link_detection_status: String", "- link_detection_result: JSON"],
                   ["+ create(record: Object): Scan", "+ createMany(records: Object[]): Scan[]", "+ findById(id: String): Scan", "+ findRecent(limit: Integer): Scan[]", "+ deleteById(id: String): Boolean"])

    # BaselinePage
    draw_class_box(740, 440, 250, 230, "BaselinePage",
                   ["- id: String", "- site_url: String", "- html_content: Text", "- dom_structure_hash: String", "- visual_hash: String", "- captured_at: DateTime"],
                   ["+ saveBaseline(url: String, html: Text): Boolean", "+ getBaseline(url: String): BaselinePage", "+ compareHash(hash: String): Float"])

    # Schedule
    draw_class_box(60, 80, 240, 250, "Schedule",
                   ["- id: String", "- name: String", "- target_type: String", "- site_ids: JSON", "- frequency: String", "- time_of_day: String", "- timezone: String", "- status: String", "- is_running: Integer", "- next_run_at: DateTime"],
                   ["+ create(sched: Object): Schedule", "+ update(id: String, data: Object): Boolean", "+ findDue(now: DateTime): Schedule[]", "+ toggleStatus(id: String): Boolean"])

    # Helper Orthogonal Association Line with Multiplicity
    def draw_assoc_multi(points, mult_start="", mult_end="", label=""):
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        ax.plot(xs, ys, color='#000000', lw=1.2, zorder=2)
        if mult_start:
            p0 = points[0]
            p1 = points[1]
            dx = p1[0] - p0[0]
            dy = p1[1] - p0[1]
            ox = 10 if dx > 0 else (-18 if dx < 0 else 8)
            oy = 10 if dy > 0 else (-10 if dy < 0 else 8)
            ax.text(p0[0] + ox, p0[1] + oy, mult_start, fontsize=8, fontweight='bold', fontfamily='Arial', color='#000000', zorder=6)
        if mult_end:
            pn_1 = points[-2]
            pn = points[-1]
            dx = pn[0] - pn_1[0]
            dy = pn[1] - pn_1[1]
            ox = -18 if dx > 0 else (10 if dx < 0 else 8)
            oy = -10 if dy > 0 else (10 if dy < 0 else 8)
            ax.text(pn[0] + ox, pn[1] + oy, mult_end, fontsize=8, fontweight='bold', fontfamily='Arial', color='#000000', zorder=6)
        if label:
            mid = points[len(points)//2]
            ax.text(mid[0], mid[1] + 10, label, fontsize=7.5, fontfamily='Arial', color='#000000', ha='center', bbox=dict(boxstyle='square,pad=0.1', facecolor='#FFFFFF', edgecolor='none'), zorder=6)

    # 1. User 1 --- 0..* ScanJob
    draw_assoc_multi([(300, 890), (390, 890)], mult_start="1", mult_end="0..*")

    # 2. ScanJob 1 --- 1..* Scan
    draw_assoc_multi([(520, 750), (520, 680)], mult_start="1", mult_end="1..*")

    # 3. Site 1 --- 0..* Scan
    draw_assoc_multi([(300, 520), (390, 520)], mult_start="1", mult_end="0..*")

    # 4. Scan 1 --- 0..1 Notification
    draw_assoc_multi([(650, 520), (700, 520), (700, 890), (740, 890)], mult_start="1", mult_end="0..1")

    # 5. Site 1 --- 0..1 BaselinePage
    draw_assoc_multi([(180, 420), (180, 360), (865, 360), (865, 440)], mult_start="1", mult_end="0..1")

    # 6. Site 1 --- 0..* Schedule
    draw_assoc_multi([(180, 420), (180, 330)], mult_start="1", mult_end="0..*")

    # Save
    png_path_canonical = os.path.join(OUTPUT_DIR, "class-diagram.png")
    svg_path_canonical = os.path.join(OUTPUT_DIR, "class-diagram.svg")
    png_path_class = os.path.join(CLASS_DIR, "gambar-4.17-class-diagram.png")
    svg_path_class = os.path.join(CLASS_DIR, "gambar-4.17-class-diagram.svg")

    fig.savefig(png_path_canonical, dpi=300, bbox_inches='tight', facecolor='#FFFFFF')
    fig.savefig(svg_path_canonical, format='svg', bbox_inches='tight', facecolor='#FFFFFF')
    fig.savefig(png_path_class, dpi=300, bbox_inches='tight', facecolor='#FFFFFF')
    fig.savefig(svg_path_class, format='svg', bbox_inches='tight', facecolor='#FFFFFF')
    plt.close(fig)
    print("Class Diagram PNG & SVG berhasil dirender!")


def main():
    print("Membangun Class Diagram sistem...")
    xml_str = build_class_drawio_xml()
    drawio_canonical = os.path.join(OUTPUT_DIR, "class-diagram.drawio")
    drawio_class = os.path.join(CLASS_DIR, "gambar-4.17-class-diagram.drawio")

    with open(drawio_canonical, "w", encoding="utf-8") as f:
        f.write(xml_str)
    with open(drawio_class, "w", encoding="utf-8") as f:
        f.write(xml_str)
    print(f"Draw.io XML disimpan di: {drawio_canonical}")

    render_class_diagram_image()
    print("SELESAI! Seluruh berkas Class Diagram berhasil dibuat.")

if __name__ == "__main__":
    main()
