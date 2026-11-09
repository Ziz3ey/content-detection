# -*- coding: utf-8 -*-
"""
generate_lecturer_use_case.py
Membuat Use Case Diagram yang mengikuti MODEL DOSEN (media_1794093919994_1bc18810.jpg):
- Gaya Butterfly / Central Hub: Oval 'Login' di pusat tengah, 'Logout' di pusat bawah.
- Aktor kiri: Admin (figur tongkat di luar batas sistem).
- Aktor kanan atas: Petugas (figur tongkat di luar batas sistem).
- Aktor kanan bawah: Masyarakat (figur tongkat di luar batas sistem).
- Seluruh use case yang membutuhkan autentikasi memiliki garis putus-putus 'include' menuju oval 'Login'.
- Sub-usecase memiliki relasi putus-putus 'extend' mengarah ke usecase induknya.
- Garis asosiasi aktor menggunakan garis solid lurus.
- Dihasilkan dalam berkas .drawio (XML uncompressed editable), .png (300 DPI), dan .svg.
"""

import os
import xml.etree.ElementTree as ET
from xml.dom import minidom
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Polygon, Circle, Rectangle

OUTPUT_DIR = r"D:\content detection\docs\bab-iv\diagrams"
USE_CASE_DIR = os.path.join(OUTPUT_DIR, "use-case")
os.makedirs(USE_CASE_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# 1. BUILD DRAW.IO XML
# -----------------------------------------------------------------------------
def build_drawio_xml():
    mxfile = ET.Element("mxfile", host="app.diagrams.net", agent="Antigravity", version="24.0.0", type="device")
    diagram = ET.SubElement(mxfile, "diagram", id="diag_use_case_dosen", name="Use Case Diagram (Model Dosen)")
    model = ET.SubElement(
        diagram, "mxGraphModel",
        dx="1422", dy="1200", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1",
        fold="1", page="1", pageScale="1", pageWidth="1400", pageHeight="1600", background="#ffffff"
    )
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", id="0")
    ET.SubElement(root, "mxCell", id="1", parent="0")

    def add_v(cid, val, style, x, y, w, h, parent="1"):
        c = ET.SubElement(root, "mxCell", id=cid, value=val, style=style, vertex="1", parent=parent)
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

    # System boundary box
    add_v("boundary", "", "rounded=0;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=none;strokeWidth=1.5;", 180, 20, 960, 1480)

    # Actors
    style_actor = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=12;fontStyle=1;"
    add_v("actor_admin", "Admin", style_actor, 60, 680, 50, 90)
    add_v("actor_petugas", "Petugas", style_actor, 1200, 380, 50, 90)
    add_v("actor_masyarakat", "Masyarakat", style_actor, 1200, 1140, 50, 90)

    # Style Use Case Ovals
    style_oval = "ellipse;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=11;strokeWidth=1.2;"
    style_sub_oval = "ellipse;whiteSpace=wrap;html=1;strokeColor=#000000;fillColor=#ffffff;fontColor=#000000;fontFamily=Arial;fontSize=10;strokeWidth=1;"

    # Center Hub
    add_v("uc_login", "Login", style_oval, 610, 700, 100, 50)
    add_v("uc_logout", "Logout", style_oval, 610, 1400, 100, 50)

    # Edge Login -> Logout (include)
    style_include = "edgeStyle=straight;html=1;dashed=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=open;endFill=0;endSize=8;"
    style_extend = "edgeStyle=straight;html=1;dashed=1;strokeColor=#000000;fontColor=#000000;fontFamily=Arial;fontSize=9;endArrow=open;endFill=0;endSize=8;"
    style_solid = "edgeStyle=straight;html=1;strokeColor=#000000;endArrow=none;endFill=0;strokeWidth=1.2;"

    add_e("e_login_logout", "include", style_include, "uc_login", "uc_logout")

    # LEFT SIDE USE CASES (Admin)
    left_ucs = [
        ("uc_l_landing", "Kelola Landing\nPage", 300, 50, 130, 48),
        ("uc_l_dash", "Lihat Dashboard", 300, 130, 130, 48),
        ("uc_l_user", "CRUD Akun\nPengguna", 300, 210, 130, 48),
        ("uc_l_target", "Kelola Target\nWebsite", 300, 290, 130, 48),
        ("uc_l_filter", "Cari sesuai\nFilter", 250, 360, 110, 40), # extend
        ("uc_l_verif", "Verifikasi Laporan\nDeteksi", 300, 430, 135, 50),
        ("uc_l_sub_verif", "Verifikasi", 220, 510, 90, 38), # extend
        ("uc_l_sub_hapus", "Hapus", 320, 530, 85, 38),    # extend
        ("uc_l_sub_detail", "Detail", 420, 510, 85, 38),   # extend
        ("uc_l_base", "Kelola Baseline\nWebsite", 300, 600, 130, 48),
        ("uc_l_scan", "Melakukan\nPemindaian", 300, 680, 130, 48),
        ("uc_l_sub_single", "Pindai\nTunggal", 230, 755, 95, 38),  # extend
        ("uc_l_sub_batch", "Pindai\nMassal", 370, 755, 95, 38),   # extend
        ("uc_l_sub_simpan", "Simpan\nHasil", 300, 810, 95, 38),   # extend
        ("uc_l_jadwal", "Kelola Jadwal\nPemindaian", 300, 880, 130, 48),
        ("uc_l_notif", "Kelola Notifikasi\nEmail", 300, 960, 130, 48),
        ("uc_l_report", "Generate Laporan", 300, 1040, 130, 48),
        ("uc_l_sub_pdf", "Ekspor Pdf", 300, 1120, 100, 40),       # extend
        ("uc_l_kategori", "CRUD Kategori\nDeteksi", 300, 1200, 130, 48),
    ]

    for uid, uval, ux, uy, uw, uh in left_ucs:
        st = style_sub_oval if "sub" in uid or "filter" in uid else style_oval
        add_v(uid, uval, st, ux, uy, uw, uh)

    # Connections Left Side:
    # Admin -> Primary UCs (solid)
    prim_left = ["uc_l_landing", "uc_l_dash", "uc_l_user", "uc_l_target", "uc_l_verif", "uc_l_base", "uc_l_scan", "uc_l_jadwal", "uc_l_notif", "uc_l_report", "uc_l_kategori"]
    for idx, p_id in enumerate(prim_left):
        add_e(f"e_adm_{idx}", "", style_solid, "actor_admin", p_id)
        # Each primary UC -> Login (include)
        add_e(f"e_inc_l_{idx}", "include", style_include, p_id, "uc_login")

    # Sub-usecases Left (extend)
    add_e("e_ext_l_filter", "extend", style_extend, "uc_l_filter", "uc_l_target")
    add_e("e_ext_l_verif", "extend", style_extend, "uc_l_sub_verif", "uc_l_verif")
    add_e("e_ext_l_hapus", "extend", style_extend, "uc_l_sub_hapus", "uc_l_verif")
    add_e("e_ext_l_detail", "extend", style_extend, "uc_l_sub_detail", "uc_l_verif")
    add_e("e_ext_l_single", "extend", style_extend, "uc_l_sub_single", "uc_l_scan")
    add_e("e_ext_l_batch", "extend", style_extend, "uc_l_sub_batch", "uc_l_scan")
    add_e("e_ext_l_simpan", "extend", style_extend, "uc_l_sub_simpan", "uc_l_scan")
    add_e("e_ext_l_pdf", "extend", style_extend, "uc_l_sub_pdf", "uc_l_report")

    # RIGHT SIDE USE CASES (Petugas & Masyarakat)
    right_ucs = [
        # Petugas (Top Right)
        ("uc_r_dash", "Lihat dashboard", 860, 130, 130, 48),
        ("uc_r_verif", "Verifikasi Laporan\nDeteksi", 860, 220, 135, 50),
        ("uc_r_sub_verif", "Verifikasi", 780, 300, 90, 38),  # extend
        ("uc_r_sub_hapus", "Hapus", 880, 320, 85, 38),     # extend
        ("uc_r_sub_detail", "Detail", 980, 300, 85, 38),    # extend
        ("uc_r_scan", "Melakukan\nPemindaian", 860, 390, 130, 48),
        ("uc_r_sub_mandiri", "Pindai Mandiri", 770, 465, 95, 38), # extend
        ("uc_r_sub_simpan", "Simpan tanggapan", 950, 465, 105, 38), # extend
        ("uc_r_sub_tulis", "Tulis catatan", 860, 520, 95, 38), # extend
        ("uc_r_kategori", "CRUD Kategori\nDeteksi", 860, 590, 130, 48),

        # Masyarakat / Pengelola Web OPD (Bottom Right)
        ("uc_m_dash", "Lihat dashboard", 860, 770, 130, 48),
        ("uc_m_tulis", "Tulis Pengaduan\nKonten", 860, 860, 135, 50),
        ("uc_m_sub_buat", "Buat Pengaduan", 770, 940, 105, 38), # extend
        ("uc_m_sub_kirim", "Kirim Pengaduan", 950, 940, 105, 38), # extend
        ("uc_m_riwayat", "Lihat riwayat\nPengaduan", 860, 1030, 130, 48),
    ]

    for uid, uval, ux, uy, uw, uh in right_ucs:
        st = style_sub_oval if "sub" in uid else style_oval
        add_v(uid, uval, st, ux, uy, uw, uh)

    # Connections Petugas (solid)
    petugas_prim = ["uc_r_dash", "uc_r_verif", "uc_r_scan", "uc_r_kategori"]
    for idx, p_id in enumerate(petugas_prim):
        add_e(f"e_pet_{idx}", "", style_solid, "actor_petugas", p_id)
        # include to Login
        add_e(f"e_inc_pet_{idx}", "include", style_include, p_id, "uc_login")

    # Sub-usecases Petugas (extend)
    add_e("e_ext_r_verif", "extend", style_extend, "uc_r_sub_verif", "uc_r_verif")
    add_e("e_ext_r_hapus", "extend", style_extend, "uc_r_sub_hapus", "uc_r_verif")
    add_e("e_ext_r_detail", "extend", style_extend, "uc_r_sub_detail", "uc_r_verif")
    add_e("e_ext_r_mandiri", "extend", style_extend, "uc_r_sub_mandiri", "uc_r_scan")
    add_e("e_ext_r_simpan", "extend", style_extend, "uc_r_sub_simpan", "uc_r_scan")
    add_e("e_ext_r_tulis", "extend", style_extend, "uc_r_sub_tulis", "uc_r_scan")

    # Connections Masyarakat (solid)
    masyarakat_prim = ["uc_m_dash", "uc_m_tulis", "uc_m_riwayat"]
    for idx, p_id in enumerate(masyarakat_prim):
        add_e(f"e_masy_{idx}", "", style_solid, "actor_masyarakat", p_id)

    # Sub-usecases Masyarakat (extend)
    add_e("e_ext_m_buat", "extend", style_extend, "uc_m_sub_buat", "uc_m_tulis")
    add_e("e_ext_m_kirim", "extend", style_extend, "uc_m_sub_kirim", "uc_m_tulis")

    # Pretty print XML
    rough = ET.tostring(mxfile, encoding="utf-8")
    reparsed = minidom.parseString(rough)
    return reparsed.toprettyxml(indent="  ", encoding="utf-8").decode("utf-8")


# -----------------------------------------------------------------------------
# 2. RENDER HIGH-RES PNG & SVG DENGAN MATPLOTLIB
# -----------------------------------------------------------------------------
def render_lecturer_use_case_image():
    # Canvas setup
    fig, ax = plt.subplots(figsize=(12, 14), dpi=300)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    ax.set_xlim(0, 1200)
    ax.set_ylim(0, 1400)
    ax.axis('off')

    # System boundary box
    # Rect from x=140 to 1060, y=30 to 1370
    rect_box = Rectangle((140, 30), 920, 1340, facecolor='#FFFFFF', edgecolor='#000000', linewidth=1.4, zorder=1)
    ax.add_patch(rect_box)

    # Helper stick figure
    def draw_actor(cx, cy, h=75, label=""):
        r = h * 0.16
        head = Circle((cx, cy + h * 0.32), r, facecolor='#FFFFFF', edgecolor='#000000', linewidth=1.3, zorder=5)
        ax.add_patch(head)
        ax.plot([cx, cx], [cy + h * 0.16, cy - h * 0.15], color='#000000', lw=1.3, zorder=5)
        ax.plot([cx - h * 0.28, cx + h * 0.28], [cy + h * 0.05, cy + h * 0.05], color='#000000', lw=1.3, zorder=5)
        ax.plot([cx, cx - h * 0.22], [cy - h * 0.15, cy - h * 0.45], color='#000000', lw=1.3, zorder=5)
        ax.plot([cx, cx + h * 0.22], [cy - h * 0.15, cy - h * 0.45], color='#000000', lw=1.3, zorder=5)
        if label:
            ax.text(cx, cy - h * 0.55, label, ha='center', va='top', fontsize=9.5, fontweight='bold', fontfamily='Arial', color='#000000', zorder=6)

    # Actors
    draw_actor(70, 700, h=80, label="Admin")
    draw_actor(1130, 1020, h=80, label="Petugas")
    draw_actor(1130, 350, h=80, label="Masyarakat")

    # Helper oval
    def draw_oval(cx, cy, rx, ry, text, fontsize=7.5):
        el = patches.Ellipse((cx, cy), rx * 2, ry * 2, facecolor='#FFFFFF', edgecolor='#000000', linewidth=1.1, zorder=4)
        ax.add_patch(el)
        ax.text(cx, cy, text, ha='center', va='center', fontsize=fontsize, fontfamily='Arial', color='#000000', zorder=5)

    # Center Hub
    draw_oval(600, 700, 48, 26, "Login", fontsize=9.5)
    draw_oval(600, 80, 45, 22, "Logout", fontsize=8.5)

    # Arrow Login -> Logout (vertical dashed line with open arrow)
    ax.plot([600, 600], [674, 102], color='#000000', linestyle='--', lw=1.0, zorder=3)
    # Open arrow at bottom pointing to Logout
    ax.plot([595, 600, 605], [112, 102, 112], color='#000000', lw=1.0, zorder=4)
    ax.text(600, 390, "include", ha='center', va='center', fontsize=7, fontfamily='Arial', color='#000000', bbox=dict(boxstyle='square,pad=0.1', facecolor='#FFFFFF', edgecolor='none'), zorder=5)

    # Helper solid line (Actor to Use Case)
    def draw_assoc(ax1, ay1, cx, cy, rx):
        # find border point on oval left or right
        if ax1 < cx: # actor on left
            tx = cx - rx
        else:
            tx = cx + rx
        ax.plot([ax1, tx], [ay1, cy], color='#000000', lw=1.1, zorder=3)

    # Helper dashed line with open arrow (extend or include)
    def draw_dashed_arrow(x1, y1, x2, y2, label=""):
        ax.plot([x1, x2], [y1, y2], color='#000000', linestyle='--', lw=0.9, zorder=3)
        # arrow head at (x2, y2)
        import math
        angle = math.atan2(y2 - y1, x2 - x1)
        al = 8
        aw = math.pi / 6
        x_a1 = x2 - al * math.cos(angle - aw)
        y_a1 = y2 - al * math.sin(angle - aw)
        x_a2 = x2 - al * math.cos(angle + aw)
        y_a2 = y2 - al * math.sin(angle + aw)
        ax.plot([x_a1, x2, x_a2], [y_a1, y2, y_a2], color='#000000', lw=0.9, zorder=4)
        if label:
            mx = (x1 + x2) / 2
            my = (y1 + y2) / 2
            ax.text(mx, my, label, ha='center', va='center', fontsize=6.5, fontfamily='Arial', color='#000000', bbox=dict(boxstyle='square,pad=0.1', facecolor='#FFFFFF', edgecolor='none'), zorder=6)

    # -------------------------------------------------------------------------
    # LEFT USE CASES (Admin)
    # -------------------------------------------------------------------------
    admin_pos = (70, 700)

    # 1. Kelola Landing Page
    draw_oval(320, 1320, 52, 22, "Kelola Landing\nPage")
    draw_assoc(admin_pos[0], admin_pos[1], 320, 1320, 52)
    draw_dashed_arrow(368, 1310, 575, 720, "include")

    # 2. Lihat Dashboard
    draw_oval(320, 1250, 50, 20, "Lihat Dashboard")
    draw_assoc(admin_pos[0], admin_pos[1], 320, 1250, 50)
    draw_dashed_arrow(368, 1240, 575, 715, "include")

    # 3. CRUD Akun Pengguna
    draw_oval(320, 1175, 52, 22, "CRUD Akun\nPengguna")
    draw_assoc(admin_pos[0], admin_pos[1], 320, 1175, 52)
    draw_dashed_arrow(368, 1165, 580, 710, "include")

    # 4. Lihat data Pengaduan (Kelola Target Website)
    draw_oval(320, 1100, 52, 22, "Kelola Target\nWebsite")
    draw_assoc(admin_pos[0], admin_pos[1], 320, 1100, 52)
    draw_dashed_arrow(368, 1090, 580, 705, "include")
    # Sub: Cari sesuai Filter
    draw_oval(250, 1030, 42, 17, "Cari sesuai Filter", fontsize=6.5)
    draw_dashed_arrow(275, 1045, 305, 1080, "extend")

    # 5. Verifikasi Laporan Deteksi
    draw_oval(320, 960, 55, 23, "Verifikasi Laporan")
    draw_assoc(admin_pos[0], admin_pos[1], 320, 960, 55)
    draw_dashed_arrow(370, 950, 580, 702, "include")
    # Sub: Verifikasi, Hapus, Detail
    draw_oval(215, 890, 36, 17, "Verifikasi", fontsize=6.5)
    draw_oval(300, 875, 32, 16, "Hapus", fontsize=6.5)
    draw_oval(385, 890, 32, 16, "Detail", fontsize=6.5)
    draw_dashed_arrow(230, 907, 285, 942, "extend")
    draw_dashed_arrow(300, 891, 315, 937, "extend")
    draw_dashed_arrow(370, 907, 345, 940, "extend")

    # 6. Beri Tanggapan (Baseline & Hasil)
    draw_oval(320, 790, 52, 22, "Kelola Baseline\nWebsite")
    draw_assoc(admin_pos[0], admin_pos[1], 320, 790, 52)
    draw_dashed_arrow(370, 785, 570, 700, "include")
    # Sub: Simpan tanggapan / Perbarui DOM
    draw_oval(225, 730, 38, 17, "Simpan Baseline", fontsize=6.5)
    draw_oval(385, 730, 40, 17, "Perbarui DOM", fontsize=6.5)
    draw_oval(305, 680, 42, 17, "Verifikasi Hash", fontsize=6.5)
    draw_dashed_arrow(240, 747, 285, 775, "extend")
    draw_dashed_arrow(370, 747, 345, 775, "extend")
    draw_dashed_arrow(305, 697, 315, 768, "extend")

    # 7. Melakukan Pemindaian (CRUD Edukasi / Scan)
    draw_oval(320, 600, 55, 22, "Melakukan\nPemindaian")
    draw_assoc(admin_pos[0], admin_pos[1], 320, 600, 55)
    draw_dashed_arrow(370, 605, 570, 698, "include")

    # 8. Generet Laporan
    draw_oval(320, 500, 52, 22, "Generet Laporan")
    draw_assoc(admin_pos[0], admin_pos[1], 320, 500, 52)
    draw_dashed_arrow(368, 510, 575, 695, "include")
    # Sub: Ekspor Pdf
    draw_oval(320, 420, 42, 18, "Ekspor Pdf", fontsize=7.0)
    draw_dashed_arrow(320, 438, 320, 478, "extend")

    # 9. CRUD Kategori Deteksi
    draw_oval(320, 340, 52, 22, "CRUD Kategori\nDeteksi")
    draw_assoc(admin_pos[0], admin_pos[1], 320, 340, 52)
    draw_dashed_arrow(368, 350, 580, 690, "include")

    # 10. Kelola Notifikasi Email
    draw_oval(320, 240, 52, 22, "Kelola Notifikasi\nEmail")
    draw_assoc(admin_pos[0], admin_pos[1], 320, 240, 52)
    draw_dashed_arrow(368, 250, 585, 685, "include")

    # 11. Kelola Jadwal Pemindaian
    draw_oval(320, 150, 52, 22, "Kelola Jadwal\nPemindaian")
    draw_assoc(admin_pos[0], admin_pos[1], 320, 150, 52)
    draw_dashed_arrow(368, 160, 590, 680, "include")


    # -------------------------------------------------------------------------
    # RIGHT TOP USE CASES (Petugas)
    # -------------------------------------------------------------------------
    petugas_pos = (1130, 1020)

    # 1. Lihat dashboard
    draw_oval(880, 1260, 50, 20, "Lihat dashboard")
    draw_assoc(petugas_pos[0], petugas_pos[1], 880, 1260, 50)
    draw_dashed_arrow(830, 1250, 625, 720, "include")

    # 2. Verifikasi Laporan
    draw_oval(880, 1180, 55, 23, "Verifikasi Laporan")
    draw_assoc(petugas_pos[0], petugas_pos[1], 880, 1180, 55)
    draw_dashed_arrow(828, 1170, 625, 715, "include")
    # Sub: Verifikasi, Hapus, Detail
    draw_oval(785, 1110, 36, 17, "Verifikasi", fontsize=6.5)
    draw_oval(870, 1095, 32, 16, "Hapus", fontsize=6.5)
    draw_oval(955, 1110, 32, 16, "Detail", fontsize=6.5)
    draw_dashed_arrow(800, 1127, 855, 1160, "extend")
    draw_dashed_arrow(870, 1111, 875, 1157, "extend")
    draw_dashed_arrow(940, 1127, 895, 1160, "extend")

    # 3. Beri tanggapan / Melakukan Pemindaian
    draw_oval(880, 1010, 52, 22, "Melakukan\nPemindaian")
    draw_assoc(petugas_pos[0], petugas_pos[1], 880, 1010, 52)
    draw_dashed_arrow(828, 1005, 625, 710, "include")
    # Sub: tanggapi, Tulis tanggapan, Simpan tanggapan
    draw_oval(785, 940, 36, 17, "tanggapi", fontsize=6.5)
    draw_oval(965, 940, 42, 17, "Simpan\ntanggapan", fontsize=6.0)
    draw_oval(875, 890, 42, 17, "Tulis\ntanggapan", fontsize=6.5)
    draw_dashed_arrow(800, 955, 855, 992, "extend")
    draw_dashed_arrow(945, 955, 905, 992, "extend")
    draw_dashed_arrow(875, 907, 875, 988, "extend")

    # 4. CRUD Kategori / Riwayat
    draw_oval(880, 810, 52, 22, "CRUD Kategori\nDeteksi")
    draw_assoc(petugas_pos[0], petugas_pos[1], 880, 810, 52)
    draw_dashed_arrow(828, 805, 625, 705, "include")


    # -------------------------------------------------------------------------
    # RIGHT BOTTOM USE CASES (Masyarakat)
    # -------------------------------------------------------------------------
    masyarakat_pos = (1130, 350)

    # 1. Lihat dashboard
    draw_oval(880, 630, 50, 20, "Lihat dashboard")
    draw_assoc(masyarakat_pos[0], masyarakat_pos[1], 880, 630, 50)

    # 2. Tulis Pengaduan
    draw_oval(880, 530, 55, 23, "Tulis Pengaduan")
    draw_assoc(masyarakat_pos[0], masyarakat_pos[1], 880, 530, 55)
    # Sub: Buat Pengaduan, Kirim Pengaduan
    draw_oval(780, 450, 46, 18, "Buat Pengaduan", fontsize=6.5)
    draw_oval(970, 450, 46, 18, "Kirim Pengaduan", fontsize=6.5)
    draw_dashed_arrow(810, 465, 855, 510, "extend")
    draw_dashed_arrow(940, 465, 895, 510, "extend")

    # 3. Lihat riwayat Pengaduan
    draw_oval(880, 330, 55, 22, "Lihat riwayat\nPengaduan")
    draw_assoc(masyarakat_pos[0], masyarakat_pos[1], 880, 330, 55)

    # Save outputs
    png_path_canonical = os.path.join(OUTPUT_DIR, "use-case-diagram.png")
    svg_path_canonical = os.path.join(OUTPUT_DIR, "use-case-diagram.svg")
    png_path_sub = os.path.join(USE_CASE_DIR, "gambar-4.2-use-case-diagram.png")
    svg_path_sub = os.path.join(USE_CASE_DIR, "gambar-4.2-use-case-diagram.svg")

    fig.savefig(png_path_canonical, dpi=300, bbox_inches='tight', facecolor='#FFFFFF')
    fig.savefig(svg_path_canonical, format='svg', bbox_inches='tight', facecolor='#FFFFFF')
    fig.savefig(png_path_sub, dpi=300, bbox_inches='tight', facecolor='#FFFFFF')
    fig.savefig(svg_path_sub, format='svg', bbox_inches='tight', facecolor='#FFFFFF')
    plt.close(fig)
    print("PNG & SVG (Model Dosen) berhasil dirender!")


def main():
    print("Membuat Use Case Diagram Model Dosen...")
    xml_str = build_drawio_xml()
    drawio_canonical = os.path.join(OUTPUT_DIR, "use-case-diagram.drawio")
    drawio_sub = os.path.join(USE_CASE_DIR, "gambar-4.2-use-case-diagram.drawio")

    with open(drawio_canonical, "w", encoding="utf-8") as f:
        f.write(xml_str)
    with open(drawio_sub, "w", encoding="utf-8") as f:
        f.write(xml_str)
    print(f"Draw.io XML disimpan di: {drawio_canonical}")

    render_lecturer_use_case_image()
    print("SELESAI! Seluruh berkas Use Case Diagram Model Dosen berhasil dibuat.")

if __name__ == "__main__":
    main()
