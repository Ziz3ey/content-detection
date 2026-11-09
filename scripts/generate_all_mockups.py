# -*- coding: utf-8 -*-
"""
Generator Mockup Low-Fidelity Balsamiq Wireframe (1440x900)
Sistem Deteksi Indikasi Konten Negatif Situs Web Pemerintah Kabupaten Sumbawa
Berbasis Arsitektur Microservices
"""

import os
import subprocess
import json

BASE_DIR = r"D:\content detection\docs\mockups"
os.makedirs(BASE_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

COMMON_CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 1440px;
  height: 900px;
  background: #ffffff;
  color: #111111;
  font-family: 'Comic Sans MS', 'Comic Neue', 'Segoe UI', cursive, sans-serif;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}
.window {
  width: 1440px;
  height: 900px;
  border: 3px solid #222222;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}
.browser-header {
  height: 38px;
  background: #eeeeee;
  border-bottom: 2px solid #222222;
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 12px;
}
.dots { display: flex; gap: 6px; }
.dot { width: 11px; height: 11px; border: 1.5px solid #444444; border-radius: 50%; background: #ffffff; }
.address-bar {
  flex: 1;
  height: 24px;
  background: #ffffff;
  border: 1.5px solid #555555;
  border-radius: 4px;
  padding: 0 10px;
  font-family: monospace;
  font-size: 11.5px;
  line-height: 22px;
  color: #222222;
}
.win-controls { font-family: monospace; font-size: 12px; font-weight: bold; color: #444444; }

/* Topbar Header */
.topbar {
  height: 52px;
  background: #ffffff;
  border-bottom: 2px solid #222222;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.topbar-left { display: flex; align-items: center; gap: 16px; }
.brand-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
}
.brand-badge {
  border: 1.5px solid #222;
  padding: 2px 6px;
  border-radius: 3px;
  background: #eee;
  font-size: 10px;
}
.topbar-search {
  border: 1.5px solid #333;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 12px;
  background: #ffffff;
  width: 280px;
  color: #555;
}
.topbar-right { display: flex; align-items: center; gap: 14px; font-size: 12px; }
.live-pill {
  border: 1.5px solid #222;
  border-radius: 12px;
  padding: 3px 10px;
  background: #f2f2f2;
  font-size: 11px;
  font-weight: bold;
}
.notif-badge {
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 4px 8px;
  background: #ffffff;
  cursor: pointer;
  font-weight: bold;
}
.user-pill {
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 3px 10px;
  background: #eeeeee;
  font-weight: bold;
}
.btn-logout {
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 3px 8px;
  background: #ffffff;
  font-size: 11px;
}

/* Layout Body */
.app-body {
  height: calc(900px - 38px - 52px - 26px);
  display: flex;
}
.sidebar {
  width: 240px;
  height: 100%;
  background: #fafafa;
  border-right: 2px solid #222222;
  display: flex;
  flex-direction: column;
  padding: 14px 12px;
  gap: 12px;
}
.sidebar-group-title {
  font-size: 10px;
  font-weight: bold;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  padding-left: 6px;
}
.sidebar-menu { list-style: none; display: flex; flex-direction: column; gap: 4px; }
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1.5px solid transparent;
  border-radius: 4px;
  font-size: 12.5px;
  text-decoration: none;
  color: #222222;
}
.sidebar-item.active {
  background: #e2e2e2;
  border-color: #222222;
  font-weight: bold;
  color: #000000;
}
.sidebar-footer {
  margin-top: auto;
  border-top: 1.5px dashed #888;
  padding-top: 10px;
}

/* Main Content Area */
.main-content {
  flex: 1;
  height: 100%;
  overflow-y: hidden;
  padding: 16px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #ffffff;
}
.page-intro { display: flex; justify-content: space-between; align-items: flex-start; }
.eyebrow {
  font-size: 10.5px;
  font-weight: bold;
  letter-spacing: 0.5px;
  color: #444;
  margin-bottom: 2px;
}
.page-title { font-size: 20px; font-weight: bold; margin-bottom: 2px; }
.page-desc { font-size: 12px; color: #555555; max-width: 800px; line-height: 1.4; }
.endpoint-box {
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 6px 10px;
  background: #f8f8f8;
  font-size: 11px;
  text-align: right;
}

/* UI Widgets */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid #222222;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 12px;
  font-family: inherit;
  font-weight: bold;
  background: #f0f0f0;
  cursor: pointer;
  text-decoration: none;
  color: #000;
}
.btn-primary { background: #dcdcdc; border: 2px solid #000; }
.btn-sm { padding: 4px 10px; font-size: 11.5px; }

.badge {
  display: inline-block;
  border: 1.5px solid #222222;
  border-radius: 3px;
  padding: 2px 7px;
  font-size: 10.5px;
  font-weight: bold;
  background: #f2f2f2;
}

.card {
  border: 2px solid #222222;
  border-radius: 6px;
  background: #ffffff;
  padding: 12px 16px;
}

.table-wrap {
  border: 2px solid #222222;
  border-radius: 6px;
  overflow: hidden;
  background: #ffffff;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}
th {
  background: #eaeaea;
  border-bottom: 2px solid #222222;
  border-right: 1px solid #777777;
  padding: 7px 10px;
  font-weight: bold;
  text-align: left;
  color: #000000;
}
th:last-child { border-right: none; }
td {
  border-bottom: 1px solid #999999;
  border-right: 1px solid #cccccc;
  padding: 6px 10px;
  vertical-align: middle;
}
td:last-child { border-right: none; }
tr:last-child td { border-bottom: none; }

.app-footer {
  height: 26px;
  background: #f0f0f0;
  border-top: 1.5px solid #333333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 10.5px;
  color: #444444;
}
"""

def get_sidebar_html(active_name="Dashboard"):
    menus = [
        ("Menu Utama", [
            ("Dashboard", "ringkasan", "[#]"),
            ("Pemindaian", "pemeriksaan", "[>]"),
            ("Situs Web", "situs", "[W]"),
            ("Jadwal Pemindaian", "jadwal", "[C]")
        ]),
        ("Monitoring", [
            ("Hasil Deteksi", "hasil", "[?]"),
            ("Riwayat Pemindaian", "riwayat", "[H]")
        ])
    ]
    html = '<aside class="sidebar">\n'
    for grp_title, items in menus:
        html += f'  <div class="sidebar-group">\n    <div class="sidebar-group-title">{grp_title}</div>\n    <ul class="sidebar-menu">\n'
        for label, tab_id, icon in items:
            is_active = (label == active_name)
            cls = "sidebar-item active" if is_active else "sidebar-item"
            marker = "[>] " if is_active else "[ ] "
            html += f'      <li><div class="{cls}"><span>{icon}</span> <span>{marker}{label}</span></div></li>\n'
        html += '    </ul>\n  </div>\n'
    
    html += '''  <div class="sidebar-footer">
    <div class="sidebar-group-title">Sistem</div>
    <div class="sidebar-item"><span>[X]</span> <span>Keluar (Logout)</span></div>
  </div>
</aside>
'''
    return html

def get_topbar_html(title="Sistem Deteksi Konten Negatif", notif_count=3, active_notif=False):
    notif_style = 'border: 2px solid #000; background: #e5e5e5;' if active_notif else ''
    return f'''<header class="topbar">
  <div class="topbar-left">
    <div class="brand-box">
      <span class="brand-badge">[ CSIRT ]</span>
      <span>Content Detection &bull; Kab. Sumbawa</span>
    </div>
    <div class="topbar-search">[ Cari situs, hasil deteksi, atau URL... ]</div>
  </div>
  <div class="topbar-right">
    <span class="live-pill">&bull; SOC ENGINE AKTIF</span>
    <span class="notif-badge" style="{notif_style}">[ Lonceng: {notif_count} Notifikasi ]</span>
    <span class="user-pill">[ Admin: admin (ADMINISTRATOR) ]</span>
    <span class="btn-logout">[ Keluar ]</span>
  </div>
</header>
'''

def get_browser_header_html(url="http://localhost:5173/#/dashboard"):
    return f'''<div class="browser-header">
  <div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
  <div class="address-bar">{url}</div>
  <div class="win-controls">[-] [o] [X]</div>
</div>
'''

def get_footer_html():
    return '''<footer class="app-footer">
  <span><strong>CONTENT DETECTION CSIRT</strong> &bull; Pemkab Sumbawa (Dinas Kominfosandi)</span>
  <span>Hasil merupakan indikasi awal pencocokan pola otomatis &bull; Perlu verifikasi analis</span>
  <span>API: <code>http://localhost:3005</code> &bull; Arsitektur Microservices</span>
</footer>
'''

# -----------------------------------------------------------------------------
# BUILD INDIVIDUAL MOCKUP HTML PAGES
# -----------------------------------------------------------------------------

mockups_dict = {}

# 01 - LOGIN
mockups_dict["01-login"] = {
    "num": "01",
    "name": "Login Administrator/Petugas",
    "url": "http://localhost:5173/#/login",
    "desc": "Rancangan antarmuka autentikasi administrator sistem dengan split-screen layout, identitas CSIRT Kabupaten Sumbawa, input kredensial aman (scrypt), dan proteksi sesi.",
    "html": f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>01 - Login Administrator</title>
<style>
{COMMON_CSS}
.split-wrap {{
  flex: 1;
  display: flex;
  background: #ffffff;
  padding: 24px 32px;
  gap: 32px;
}}
.left-pane {{
  flex: 1.2;
  border: 2px solid #222222;
  border-radius: 8px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #fafafa;
}}
.right-pane {{
  flex: 1;
  border: 2px solid #222222;
  border-radius: 8px;
  padding: 32px 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #ffffff;
}}
.features-list {{
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}}
.feat-card {{
  border: 1.5px dashed #444444;
  border-radius: 6px;
  padding: 10px 14px;
  background: #ffffff;
}}
.soc-mini {{
  border: 2px solid #222222;
  border-radius: 6px;
  padding: 12px 14px;
  background: #eeeeee;
}}
.form-group {{ margin-bottom: 18px; }}
.form-label {{ font-weight: bold; font-size: 13px; margin-bottom: 6px; display: block; }}
.form-input {{
  width: 100%;
  height: 40px;
  border: 2px solid #222222;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 14px;
  font-family: inherit;
  background: #ffffff;
}}
.submit-btn {{
  width: 100%;
  height: 44px;
  border: 2px solid #000000;
  border-radius: 4px;
  background: #d8d8d8;
  font-size: 14.5px;
  font-weight: bold;
  font-family: inherit;
  cursor: pointer;
  margin-top: 8px;
}}
</style>
</head>
<body>
<div class="window">
  {get_browser_header_html("http://localhost:5173/#/login")}
  <div class="split-wrap">
    <div class="left-pane">
      <div>
        <span class="badge">[ CSIRT MONITORING ] RESMI KABUPATEN SUMBAWA</span>
        <h1 style="font-size: 24px; margin: 12px 0 6px; font-weight: bold; line-height: 1.3;">Sistem Deteksi Indikasi Konten Negatif</h1>
        <p style="font-size: 12.5px; color: #444;">Implementasi Web Crawling dan Pattern Matching pada Situs Web Pemerintah Kabupaten Sumbawa Berbasis Arsitektur Microservices.</p>
        
        <div class="features-list">
          <div class="feat-card">
            <div style="font-weight: bold; font-size: 13px;">[x] Web Crawling Otomatis (BFS Traversal)</div>
            <div style="font-size: 11.5px; color: #555;">Perayapan terstruktur dengan batas domain resmi sumbawakab.go.id & kepatuhan direktif robots.txt.</div>
          </div>
          <div class="feat-card">
            <div style="font-weight: bold; font-size: 13px;">[x] Pattern Matching Multi-Pola (Aho-Corasick)</div>
            <div style="font-size: 11.5px; color: #555;">Pencocokan linear kamus kata kunci negatif: Judi Online, Pornografi Teks/HTML, dan Penipuan.</div>
          </div>
          <div class="feat-card">
            <div style="font-weight: bold; font-size: 13px;">[x] Integritas Defacement & Analisis Tautan</div>
            <div style="font-size: 11.5px; color: #555;">Perbandingan hash SHA-256 baseline struktur DOM serta analisis heuristik tautan mencurigakan.</div>
          </div>
        </div>
      </div>

      <div class="soc-mini">
        <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">[ KONSOL MONITORING CSIRT KABUPATEN SUMBAWA ]</div>
        <div style="display: flex; gap: 16px; font-size: 11.5px; color: #333;">
          <span>&bull; Target: 14 Situs Web</span>
          <span>&bull; 3 Detektor Paralel</span>
          <span>&bull; Zona: WITA (UTC+8)</span>
          <span>&bull; Status: Siap Operasi</span>
        </div>
      </div>
    </div>

    <div class="right-pane">
      <span class="badge" style="align-self: flex-start;">[ OTENTIKASI SISTEM ]</span>
      <h2 style="font-size: 20px; font-weight: bold; margin: 10px 0 4px;">Login Administrator</h2>
      <p style="font-size: 12px; color: #555; margin-bottom: 22px;">Masukkan kredensial akun administrator untuk mengakses panel pemantauan dan kontrol.</p>
      
      <div class="form-group">
        <label class="form-label">Nama Pengguna (Username)</label>
        <input class="form-input" type="text" value="admin" readonly>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">Kredensial akun resmi administrator terdaftar</div>
      </div>

      <div class="form-group">
        <label class="form-label">Kata Sandi (Password)</label>
        <input class="form-input" type="text" value="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" readonly>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">Diverifikasi menggunakan algoritma scrypt dengan salt 16-byte</div>
      </div>

      <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 16px;">
        <span>[x]</span>
        <span>Ingat sesi login administrator (HttpOnly; SameSite=Strict)</span>
      </div>

      <button class="submit-btn">[ Masuk ke Dashboard ]</button>

      <div style="border: 1.5px dashed #222; background: #f4f4f4; padding: 10px 12px; font-size: 11.5px; margin-top: 18px; border-radius: 4px;">
        <strong>[ ! ] Akses Terbatas:</strong> Hak akses operasional hanya untuk personel CSIRT dan Dinas Kominfosandi Kabupaten Sumbawa.
      </div>
    </div>
  </div>
  {get_footer_html()}
</div>
</body>
</html>'''
}

# 02 - DASHBOARD ADMIN
mockups_dict["02-dashboard-admin"] = {
    "num": "02",
    "name": "Dashboard Administrator",
    "url": "http://localhost:5173/#/ringkasan",
    "desc": "Tampilan dashboard utama berisi metrik 4 kartu ringkasan, grafik visualisasi aktivitas pemindaian 7 hari, distribusi kategori temuan indikasi, dan tabel 5 pemindaian terbaru.",
    "html": f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>02 - Dashboard Administrator</title>
<style>
{COMMON_CSS}
.summary-grid {{
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}}
.sum-card {{
  border: 2px solid #222222;
  border-radius: 6px;
  padding: 10px 14px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}}
.sum-val {{ font-size: 24px; font-weight: bold; margin: 4px 0; }}
.sum-sub {{ font-size: 10.5px; color: #666; }}

.charts-grid {{
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
}}
.chart-box {{
  border: 2px solid #222222;
  border-radius: 6px;
  padding: 12px 14px;
  background: #ffffff;
}}
.chart-title {{ font-size: 13px; font-weight: bold; margin-bottom: 2px; }}
.chart-sub {{ font-size: 11px; color: #666; margin-bottom: 10px; }}

.bar-chart {{
  display: flex;
  align-items: flex-end;
  height: 90px;
  gap: 14px;
  border-bottom: 1.5px solid #333;
  padding-bottom: 6px;
}}
.bar-col {{
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}}
.bar-rect {{
  width: 100%;
  border: 1.5px solid #222;
  background: #eaeaea;
  border-radius: 3px 3px 0 0;
}}
.bar-lbl {{ font-size: 10.5px; color: #444; }}
.bar-num {{ font-size: 10px; font-weight: bold; }}

.cat-row {{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
  font-size: 11px;
}}
.cat-progress {{
  width: 130px;
  height: 12px;
  border: 1.5px solid #222;
  background: #fff;
  border-radius: 2px;
  overflow: hidden;
}}
.cat-fill {{ height: 100%; background: #999; }}
</style>
</head>
<body>
<div class="window">
  {get_browser_header_html("http://localhost:5173/#/ringkasan")}
  {get_topbar_html()}
  <div class="app-body">
    {get_sidebar_html("Dashboard")}
    <main class="main-content">
      <div class="page-intro">
        <div>
          <div class="eyebrow">&bull; PEMANTAUAN SITUS KABUPATEN SUMBAWA</div>
          <h1 class="page-title">Dashboard Monitoring</h1>
          <p class="page-desc">Pusat pemantauan dan deteksi otomatis indikasi konten negatif (Judi Online, Penipuan, Defacement, & Tautan Mencurigakan) pada portal web pemerintah daerah.</p>
        </div>
        <div class="endpoint-box">
          <div style="font-weight: bold;">[ SOC ENGINE AKTIF ]</div>
          <div style="font-family: monospace; font-size: 10px;">ENDPOINT: http://localhost:3005</div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="sum-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: bold;">TOTAL SITUS TERDAFTAR</span>
            <span class="badge">[ AKTIF ]</span>
          </div>
          <div class="sum-val">14 Situs</div>
          <div class="sum-sub">Domain resmi pemerintah daerah</div>
        </div>
        <div class="sum-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: bold;">TOTAL PEMINDAIAN</span>
            <span class="badge">[ HISTORI ]</span>
          </div>
          <div class="sum-val">10 Pemeriksaan</div>
          <div class="sum-sub">Catatan log pemindaian SQLite</div>
        </div>
        <div class="sum-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: bold;">SITUS DENGAN INDIKASI</span>
            <span class="badge">[ PERLU TINJAUAN ]</span>
          </div>
          <div class="sum-val">3 Situs</div>
          <div class="sum-sub">Potensi anomali terdeteksi detektor</div>
        </div>
        <div class="sum-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: bold;">SITUS KONDISI AMAN</span>
            <span class="badge">[ TERLINDUNGI ]</span>
          </div>
          <div class="sum-val">11 Situs</div>
          <div class="sum-sub">Bebas indikasi konten negatif</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-box">
          <div class="chart-title">Aktivitas Pemindaian (7 Hari Terakhir)</div>
          <div class="chart-sub">Frekuensi inspeksi situs per hari (WITA)</div>
          <div class="bar-chart">
            <div class="bar-col"><span class="bar-num">2</span><div class="bar-rect" style="height: 38px;"></div><span class="bar-lbl">Sen</span></div>
            <div class="bar-col"><span class="bar-num">1</span><div class="bar-rect" style="height: 20px;"></div><span class="bar-lbl">Sel</span></div>
            <div class="bar-col"><span class="bar-num">3</span><div class="bar-rect" style="height: 56px;"></div><span class="bar-lbl">Rab</span></div>
            <div class="bar-col"><span class="bar-num">1</span><div class="bar-rect" style="height: 20px;"></div><span class="bar-lbl">Kam</span></div>
            <div class="bar-col"><span class="bar-num">4</span><div class="bar-rect" style="height: 72px;"></div><span class="bar-lbl">Jum</span></div>
            <div class="bar-col"><span class="bar-num">2</span><div class="bar-rect" style="height: 38px;"></div><span class="bar-lbl">Sab</span></div>
            <div class="bar-col"><span class="bar-num">2</span><div class="bar-rect" style="height: 38px;"></div><span class="bar-lbl">Min</span></div>
          </div>
        </div>

        <div class="chart-box">
          <div class="chart-title">Distribusi Kategori Indikasi</div>
          <div class="chart-sub">Proporsi temuan detektor dari riwayat</div>
          <div>
            <div class="cat-row">
              <span>Judi Online (Gambling)</span>
              <div class="cat-progress"><div class="cat-fill" style="width: 55%;"></div></div>
              <span style="font-weight: bold; width: 35px; text-align: right;">55%</span>
            </div>
            <div class="cat-row">
              <span>Tautan Mencurigakan</span>
              <div class="cat-progress"><div class="cat-fill" style="width: 25%;"></div></div>
              <span style="font-weight: bold; width: 35px; text-align: right;">25%</span>
            </div>
            <div class="cat-row">
              <span>Penipuan (Phishing/Fraud)</span>
              <div class="cat-progress"><div class="cat-fill" style="width: 15%;"></div></div>
              <span style="font-weight: bold; width: 35px; text-align: right;">15%</span>
            </div>
            <div class="cat-row">
              <span>Pornografi Teks/HTML</span>
              <div class="cat-progress"><div class="cat-fill" style="width: 5%;"></div></div>
              <span style="font-weight: bold; width: 35px; text-align: right;">5%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width: 32%;">URL TARGET PEMERIKSAAN</th>
              <th style="width: 20%;">WAKTU PEMINDAIAN</th>
              <th style="width: 14%;">HALAMAN</th>
              <th style="width: 14%;">INDIKASI</th>
              <th style="width: 12%;">STATUS</th>
              <th style="width: 8%; text-align: right;">AKSI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>https://sumbawakab.go.id/</strong><br><span style="font-size: 10px; color: #555;">Portal Resmi Pemkab Sumbawa</span></td>
              <td>07/11/2026 14:30 WITA</td>
              <td>15 Halaman</td>
              <td>0 Indikasi</td>
              <td><span class="badge">[ AMAN ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span></td>
            </tr>
            <tr>
              <td><strong>https://esamsatkotasumbawa.org/</strong><br><span style="font-size: 10px; color: #555;">E-Samsat Kota Sumbawa (Target Riset)</span></td>
              <td>07/11/2026 13:10 WITA</td>
              <td>12 Halaman</td>
              <td>4 Indikasi</td>
              <td><span class="badge" style="border-width: 2px;">[ PERLU TINJAUAN ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span></td>
            </tr>
            <tr>
              <td><strong>https://bappeda.sumbawakab.go.id/</strong><br><span style="font-size: 10px; color: #555;">Bappeda Kabupaten Sumbawa</span></td>
              <td>06/11/2026 11:20 WITA</td>
              <td>10 Halaman</td>
              <td>0 Indikasi</td>
              <td><span class="badge">[ AMAN ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span></td>
            </tr>
            <tr>
              <td><strong>https://diskominfosandi.sumbawakab.go.id/</strong><br><span style="font-size: 10px; color: #555;">Dinas Kominfosandi Kab. Sumbawa</span></td>
              <td>05/11/2026 15:00 WITA</td>
              <td>18 Halaman</td>
              <td>0 Indikasi</td>
              <td><span class="badge">[ AMAN ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
  {get_footer_html()}
</div>
</body>
</html>'''
}

# 03 - DATA SITUS WEB
mockups_dict["03-data-situs-web"] = {
    "num": "03",
    "name": "Halaman Data Situs Web",
    "url": "http://localhost:5173/#/situs",
    "desc": "Daftar situs web resmi Pemerintah Kabupaten Sumbawa yang terdaftar dalam cakupan pemantauan, dilengkapi filter status (Semua, Aktif, Nonaktif), pencarian, dan tombol aksi CRUD.",
    "html": f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>03 - Data Situs Web</title>
<style>
{COMMON_CSS}
.toolbar-row {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}}
.search-input {{
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  font-family: inherit;
  width: 320px;
}}
.filter-pills {{
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 11.5px;
}}
.pill {{
  border: 1.5px solid #222;
  border-radius: 12px;
  padding: 4px 10px;
  background: #fff;
  cursor: pointer;
  font-weight: bold;
}}
.pill.active {{ background: #e0e0e0; border-width: 2px; }}
</style>
</head>
<body>
<div class="window">
  {get_browser_header_html("http://localhost:5173/#/situs")}
  {get_topbar_html()}
  <div class="app-body">
    {get_sidebar_html("Situs Web")}
    <main class="main-content">
      <div class="page-intro">
        <div>
          <div class="eyebrow">&bull; MANAJEMEN CAKUPAN PEMANTAUAN</div>
          <h1 class="page-title">Daftar Situs Web Pemantauan</h1>
          <p class="page-desc">Kelola daftar situs web Pemerintah Kabupaten Sumbawa yang terdaftar dalam basis data pemantauan dan konfigurasi crawler.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="btn">[ Muat Ulang ]</span>
          <span class="btn btn-primary">[ + Tambah Situs Baru ]</span>
        </div>
      </div>

      <div class="toolbar-row">
        <input class="search-input" type="text" placeholder="[ Cari nama instansi atau URL situs... ]" value="">
        <div class="filter-pills">
          <span style="color: #666;">Filter Status:</span>
          <span class="pill active">Semua (14)</span>
          <span class="pill">Aktif (12)</span>
          <span class="pill">Nonaktif (2)</span>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width: 26%;">NAMA INSTANSI & HOST</th>
              <th style="width: 28%;">URL SITUS SASARAN</th>
              <th style="width: 10%; text-align: center;">STATUS</th>
              <th style="width: 9%; text-align: center;">KEDALAMAN</th>
              <th style="width: 9%; text-align: center;">MAKS. HAL</th>
              <th style="width: 18%;">TANGGAL DAFTAR</th>
              <th style="width: 10%; text-align: right;">AKSI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Diskominfo Kab. Sumbawa</strong><br><span style="font-size: 10px; color: #555;">diskominfosandi.sumbawakab.go.id</span></td>
              <td><code>https://diskominfosandi.sumbawakab.go.id/</code></td>
              <td style="text-align: center;"><span class="badge">[ AKTIF ]</span></td>
              <td style="text-align: center;">2 tingkat</td>
              <td style="text-align: center;">20 hal</td>
              <td>01/10/2026 09:15 WITA</td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span> <span class="btn btn-sm">[ Edit ]</span></td>
            </tr>
            <tr>
              <td><strong>Portal Resmi Pemkab Sumbawa</strong><br><span style="font-size: 10px; color: #555;">sumbawakab.go.id</span></td>
              <td><code>https://sumbawakab.go.id/</code></td>
              <td style="text-align: center;"><span class="badge">[ AKTIF ]</span></td>
              <td style="text-align: center;">2 tingkat</td>
              <td style="text-align: center;">20 hal</td>
              <td>01/10/2026 09:20 WITA</td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span> <span class="btn btn-sm">[ Edit ]</span></td>
            </tr>
            <tr>
              <td><strong>Bappeda Kab. Sumbawa</strong><br><span style="font-size: 10px; color: #555;">bappeda.sumbawakab.go.id</span></td>
              <td><code>https://bappeda.sumbawakab.go.id/</code></td>
              <td style="text-align: center;"><span class="badge">[ AKTIF ]</span></td>
              <td style="text-align: center;">1 tingkat</td>
              <td style="text-align: center;">15 hal</td>
              <td>02/10/2026 10:00 WITA</td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span> <span class="btn btn-sm">[ Edit ]</span></td>
            </tr>
            <tr>
              <td><strong>BKPSDM Kab. Sumbawa</strong><br><span style="font-size: 10px; color: #555;">bkpsdm.sumbawakab.go.id</span></td>
              <td><code>https://bkpsdm.sumbawakab.go.id/</code></td>
              <td style="text-align: center;"><span class="badge">[ AKTIF ]</span></td>
              <td style="text-align: center;">1 tingkat</td>
              <td style="text-align: center;">20 hal</td>
              <td>02/10/2026 10:10 WITA</td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span> <span class="btn btn-sm">[ Edit ]</span></td>
            </tr>
            <tr>
              <td><strong>RSUD Kabupaten Sumbawa</strong><br><span style="font-size: 10px; color: #555;">rsud.sumbawakab.go.id</span></td>
              <td><code>https://rsud.sumbawakab.go.id/</code></td>
              <td style="text-align: center;"><span class="badge">[ AKTIF ]</span></td>
              <td style="text-align: center;">1 tingkat</td>
              <td style="text-align: center;">10 hal</td>
              <td>03/10/2026 11:30 WITA</td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span> <span class="btn btn-sm">[ Edit ]</span></td>
            </tr>
            <tr>
              <td><strong>DPMD Kab. Sumbawa</strong><br><span style="font-size: 10px; color: #555;">dpmd.sumbawakab.go.id</span></td>
              <td><code>https://dpmd.sumbawakab.go.id/</code></td>
              <td style="text-align: center;"><span class="badge" style="background: #fff; border-style: dashed;">[ NONAKTIF ]</span></td>
              <td style="text-align: center;">1 tingkat</td>
              <td style="text-align: center;">10 hal</td>
              <td>05/10/2026 14:00 WITA</td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span> <span class="btn btn-sm">[ Edit ]</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #555;">
        <span>Menampilkan 6 dari 14 situs terdaftar &bull; Tabel <code>sites</code> SQLite</span>
        <span>Halaman: [ < 1 > ] &bull; [ DATA DUMMY REPRESENTATIF ]</span>
      </div>
    </main>
  </div>
  {get_footer_html()}
</div>
</body>
</html>'''
}

# 04 - DETAIL SITUS WEB
mockups_dict["04-detail-situs-web"] = {
    "num": "04",
    "name": "Halaman Detail Situs Web",
    "url": "http://localhost:5173/#/situs/detail/site-01",
    "desc": "Informasi rinci konfigurasi situs tertentu, batasan crawling allowed host, status baseline hash integritas defacement, riwayat pemindaian domain terkait, dan tombol eksekusi pemindaian instan.",
    "html": f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>04 - Detail Situs Web</title>
<style>
{COMMON_CSS}
.detail-grid {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}}
.info-row {{
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed #ccc;
  font-size: 11.5px;
}}
.info-row:last-child {{ border-bottom: none; }}
.info-label {{ color: #555; font-weight: bold; }}
.info-val {{ text-align: right; }}
</style>
</head>
<body>
<div class="window">
  {get_browser_header_html("http://localhost:5173/#/situs/detail/site-01")}
  {get_topbar_html()}
  <div class="app-body">
    {get_sidebar_html("Situs Web")}
    <main class="main-content">
      <div style="font-size: 11px; color: #666; margin-bottom: 2px;">
        Situs Web &gt; Detail Situs &gt; Dinas Kominfosandi Kab. Sumbawa
      </div>
      <div class="page-intro">
        <div>
          <h1 class="page-title">Detail Konfigurasi Situs & Baseline</h1>
          <p class="page-desc">Informasi lengkap parameter perayapan, status integritas baseline defacement, dan log pemindaian domain.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="btn">[ &larr; Kembali ke Daftar ]</span>
          <span class="btn">[ Perbarui Baseline ]</span>
          <span class="btn btn-primary">[ &bull; Mulai Pemindaian Situs ]</span>
        </div>
      </div>

      <div class="card">
        <div style="font-size: 12.5px; font-weight: bold; margin-bottom: 8px; border-bottom: 1.5px solid #222; padding-bottom: 4px;">
          [ IDENTITAS SITUS & KONFIGURASI CRAWLER ]
        </div>
        <div class="detail-grid">
          <div>
            <div class="info-row"><span class="info-label">Nama Instansi</span><span class="info-val"><strong>Dinas Komunikasi Informatika Statistik & Persandian</strong></span></div>
            <div class="info-row"><span class="info-label">Alamat URL Resmi</span><span class="info-val"><code>https://diskominfosandi.sumbawakab.go.id/</code></span></div>
            <div class="info-row"><span class="info-label">Host Diizinkan (SSRF Scope)</span><span class="info-val"><code>diskominfosandi.sumbawakab.go.id</code></span></div>
            <div class="info-row"><span class="info-label">Status Operasional</span><span class="info-val"><span class="badge">[ AKTIF TERDAFTAR ]</span></span></div>
          </div>
          <div>
            <div class="info-row"><span class="info-label">Batas Kedalaman (maxDepth)</span><span class="info-val"><strong>2 Tingkat</strong> (Penelusuran Tautan BFS)</span></div>
            <div class="info-row"><span class="info-label">Batas Maksimum Halaman (maxPages)</span><span class="info-val"><strong>20 Halaman</strong> per sesi pemindaian</span></div>
            <div class="info-row"><span class="info-label">Status Baseline SHA-256</span><span class="info-val"><span class="badge">[ TERSEDIA ]</span> Hash: <code>7f83b165...</code></span></div>
            <div class="info-row"><span class="info-label">Waktu Pendaftaran</span><span class="info-val">01 Oktober 2026, 09:15 WITA</span></div>
          </div>
        </div>
      </div>

      <div class="card" style="flex: 1; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-size: 12.5px; font-weight: bold;">
            [ RIWAYAT PEMINDAIAN TERKAIT DOMAIN INI ]
          </div>
          <span style="font-size: 11px; color: #666;">Total: 3 Sesi Pemindaian Tersimpan</span>
        </div>
        <div class="table-wrap" style="flex: 1;">
          <table>
            <thead>
              <tr>
                <th style="width: 20%;">WAKTU PEMINDAIAN</th>
                <th style="width: 12%;">SUMBER</th>
                <th style="width: 24%;">PETUGAS PEMRAKARSA</th>
                <th style="width: 10%; text-align: center;">HALAMAN</th>
                <th style="width: 12%; text-align: center;">DETEKSI TEKS</th>
                <th style="width: 12%; text-align: center;">DEFACEMENT</th>
                <th style="width: 10%; text-align: right;">AKSI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>07/11/2026 14:30 WITA</td>
                <td><span class="badge">[ TERJADWAL ]</span></td>
                <td><code>petugas.csirt@sumbawakab.go.id</code></td>
                <td style="text-align: center;">15 hal</td>
                <td style="text-align: center;"><span class="badge">[ BERSIH ]</span></td>
                <td style="text-align: center;"><span class="badge">[ COCOK ]</span></td>
                <td style="text-align: right;"><span class="btn btn-sm">[ Lihat Hasil ]</span></td>
              </tr>
              <tr>
                <td>05/11/2026 15:00 WITA</td>
                <td><span class="badge">[ MANUAL ]</span></td>
                <td><code>admin@sumbawakab.go.id</code></td>
                <td style="text-align: center;">18 hal</td>
                <td style="text-align: center;"><span class="badge">[ BERSIH ]</span></td>
                <td style="text-align: center;"><span class="badge">[ COCOK ]</span></td>
                <td style="text-align: right;"><span class="btn btn-sm">[ Lihat Hasil ]</span></td>
              </tr>
              <tr>
                <td>01/11/2026 02:00 WITA</td>
                <td><span class="badge">[ TERJADWAL ]</span></td>
                <td><code>petugas.csirt@sumbawakab.go.id</code></td>
                <td style="text-align: center;">14 hal</td>
                <td style="text-align: center;"><span class="badge">[ BERSIH ]</span></td>
                <td style="text-align: center;"><span class="badge">[ COCOK ]</span></td>
                <td style="text-align: right;"><span class="btn btn-sm">[ Lihat Hasil ]</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
  {get_footer_html()}
</div>
</body>
</html>'''
}

# 05 - PEMINDAIAN WEB CRAWLING
mockups_dict["05-pemindaian-web-crawling"] = {
    "num": "05",
    "name": "Halaman Pemindaian / Web Crawling",
    "url": "http://localhost:5173/#/pemeriksaan",
    "desc": "Form konfigurasi pemindaian crawling, pemilihan checklist situs aktif atau URL manual, batas kedalaman (maxDepth), batas halaman (maxPages), input email petugas wajib (RFC 5322), dan status worker latar belakang.",
    "html": f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>05 - Pemindaian Web Crawling</title>
<style>
{COMMON_CSS}
.job-alert {{
  border: 2px solid #222;
  border-left: 6px solid #000;
  border-radius: 6px;
  padding: 10px 14px;
  background: #f4f4f4;
  margin-bottom: 8px;
}}
.form-card {{
  border: 2px solid #222;
  border-radius: 6px;
  background: #fff;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}}
.form-row-grid {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}}
.field-box {{ display: flex; flex-direction: column; gap: 4px; }}
.field-label {{ font-size: 11.5px; font-weight: bold; color: #222; }}
.field-input {{
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  font-family: inherit;
  background: #fff;
}}
.site-check-list {{
  border: 1.5px solid #333;
  border-radius: 4px;
  padding: 8px 12px;
  background: #fafafa;
  max-height: 85px;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11.5px;
}}
</style>
</head>
<body>
<div class="window">
  {get_browser_header_html("http://localhost:5173/#/pemeriksaan")}
  {get_topbar_html()}
  <div class="app-body">
    {get_sidebar_html("Pemindaian")}
    <main class="main-content">
      <div class="page-intro">
        <div>
          <div class="eyebrow">&bull; WORKBENCH PEMERIKSAAN KONTEN</div>
          <h1 class="page-title">Pemindaian Situs Web (Web Crawling)</h1>
          <p class="page-desc">Konfigurasi parameter perayapan situs, pemilihan target pemantauan, modul deteksi paralel, dan alamat email petugas penerima laporan.</p>
        </div>
      </div>

      <!-- Background Scan Active Card -->
      <div class="job-alert">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 12.5px;">[ LOADER ] Pemindaian Berjalan Mandiri di Latar Belakang (Job ID: job-scan-20261107-004)</strong>
          <span class="badge">[ STATUS: PROCESSING ]</span>
        </div>
        <div style="font-size: 11.5px; color: #333; margin-top: 4px;">
          Target: <strong>https://sumbawakab.go.id/</strong> &bull; Email Petugas: <strong>petugas.csirt@sumbawakab.go.id</strong> &bull; Kemajuan: <strong>6 / 15 Halaman Diperiksa</strong>
        </div>
        <div style="font-size: 10.5px; color: #666; margin-top: 2px;">
          Catatan: Dijalankan oleh worker Node.js secara asynchronous. Browser atau komputer petugas dapat ditutup tanpa menghentikan pemindaian di server.
        </div>
      </div>

      <div class="form-card">
        <!-- Field 1: Email Petugas Wajib -->
        <div class="field-box" style="border: 1.5px dashed #333; padding: 8px 12px; border-radius: 4px; background: #fafafa;">
          <label class="field-label">Alamat Email Petugas Pemrakarsa (Wajib untuk Notifikasi Mandiri) *</label>
          <input class="field-input" type="email" value="petugas.csirt@sumbawakab.go.id" placeholder="nama.petugas@sumbawakab.go.id">
          <span style="font-size: 10.5px; color: #666;">* Laporan hasil pemindaian dan notifikasi indikasi akan otomatis dikirimkan ke alamat email petugas ini setelah selesai.</span>
        </div>

        <!-- Field 2: Target Selection (Checklist & Manual) -->
        <div class="form-row-grid">
          <div class="field-box">
            <label class="field-label">Pilih dari Daftar Situs Aktif Terdaftar (Batch Mode)</label>
            <div class="site-check-list">
              <label><input type="checkbox" checked> <strong>Portal Resmi Pemkab Sumbawa</strong> (https://sumbawakab.go.id/) - Kedalaman: 2</label>
              <label><input type="checkbox" checked> <strong>Diskominfo Kab. Sumbawa</strong> (https://diskominfosandi.sumbawakab.go.id/) - Kedalaman: 2</label>
              <label><input type="checkbox"> <strong>Bappeda Kab. Sumbawa</strong> (https://bappeda.sumbawakab.go.id/) - Kedalaman: 1</label>
            </div>
            <span style="font-size: 10px; color: #666;">2 situs terpilih untuk diperiksa secara bersamaan.</span>
          </div>

          <div class="field-box">
            <label class="field-label">Atau Masukkan URL Sasaran Manual (Single Mode)</label>
            <input class="field-input" type="url" value="https://sumbawakab.go.id/" placeholder="https://contoh.sumbawakab.go.id/">
            <span style="font-size: 10.5px; color: #444;">Host yang diizinkan sistem: <code>sumbawakab.go.id</code> (SSRF Protection).</span>
          </div>
        </div>

        <!-- Field 3: Crawl Parameters -->
        <div class="form-row-grid">
          <div class="field-box">
            <label class="field-label">Batas Kedalaman Perayapan (maxDepth)</label>
            <select class="field-input">
              <option>0 (Halaman Awal Saja)</option>
              <option>1 (Tautan Langsung Tingkat 1)</option>
              <option selected>2 (Dua Tingkat Traversal BFS - Standar)</option>
            </select>
          </div>
          <div class="field-box">
            <label class="field-label">Batas Maksimum Halaman (maxPages)</label>
            <select class="field-input">
              <option>5 Halaman</option>
              <option>10 Halaman</option>
              <option selected>20 Halaman (Standar Pengujian)</option>
              <option>50 Halaman</option>
            </select>
          </div>
        </div>

        <!-- Baseline Accordion -->
        <div style="border: 1px dashed #777; padding: 6px 10px; border-radius: 4px; font-size: 11px;">
          [+] <strong>Baseline Perubahan Halaman (Defacement) [Opsional]:</strong> HTML baseline otomatis dimuat dari database situs jika tersedia.
        </div>

        <!-- Submit & Info -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid #333; padding-top: 10px;">
          <span style="font-size: 11px; color: #555;">[ Perisai ] Analisis didistribusikan secara paralel ke 3 detektor backend (Teks, Tautan, Defacement).</span>
          <button class="btn btn-primary" style="font-size: 13px; padding: 8px 20px;">[ &bull; Mulai Pemindaian Situs ]</button>
        </div>
      </div>
    </main>
  </div>
  {get_footer_html()}
</div>
</body>
</html>'''
}

# 06 - HASIL DETEKSI TEKS
mockups_dict["06-hasil-deteksi-teks"] = {
    "num": "06",
    "name": "Halaman Hasil Deteksi Teks (Aho-Corasick)",
    "url": "http://localhost:5173/#/hasil/teks/scan-105",
    "desc": "Hasil pemeriksaan pencocokan multi-pola kata kunci negatif berbasis algoritma Aho-Corasick, menampilkan ringkasan kategori (judi, pornografi, penipuan), cuplikan teks temuan (snippet bukti), dan skor keyakinan.",
    "html": f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>06 - Hasil Deteksi Teks</title>
<style>
{COMMON_CSS}
.meta-bar {{
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 8px 12px;
  background: #f8f8f8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11.5px;
}}
.cat-summary-strip {{
  display: flex;
  gap: 12px;
}}
.cat-box {{
  flex: 1;
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 8px 12px;
  background: #ffffff;
}}
.cat-box-title {{ font-size: 11px; font-weight: bold; color: #555; }}
.cat-box-val {{ font-size: 18px; font-weight: bold; margin-top: 2px; }}
.disclaimer-box {{
  border: 1.5px dashed #222;
  border-radius: 4px;
  padding: 8px 12px;
  background: #f4f4f4;
  font-size: 11px;
  line-height: 1.4;
}}
</style>
</head>
<body>
<div class="window">
  {get_browser_header_html("http://localhost:5173/#/hasil/teks/scan-105")}
  {get_topbar_html()}
  <div class="app-body">
    {get_sidebar_html("Hasil Deteksi")}
    <main class="main-content">
      <div class="page-intro">
        <div>
          <div class="eyebrow">&bull; SISTEM MONITORING CSIRT &bull; PEMERIKSAAN KONTEN TEKS</div>
          <h1 class="page-title">Hasil Deteksi Teks (Algoritma Aho-Corasick)</h1>
          <p class="page-desc">Pencocokan multi-pola linear kata kunci negatif dengan verifikasi batas kata (word boundary) untuk mencegah false positives.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="btn btn-sm">[ Ekspor PDF ]</span>
          <span class="btn btn-sm">[ Ekspor CSV ]</span>
        </div>
      </div>

      <div class="meta-bar">
        <span>Target: <strong>https://esamsatkotasumbawa.org/</strong></span>
        <span>Halaman Diperiksa: <strong>12 Halaman</strong></span>
        <span>Waktu: <strong>07/11/2026 13:10 WITA</strong></span>
        <span>Status Temuan: <span class="badge">[ TERINDIKASI KONTEN NEGATIF ]</span></span>
      </div>

      <div class="cat-summary-strip">
        <div class="cat-box">
          <div class="cat-box-title">JUDI ONLINE (GAMBLING)</div>
          <div class="cat-box-val">3 Indikasi</div>
          <span style="font-size: 10px; color: #666;">Pola: slot, gacor, maxwin</span>
        </div>
        <div class="cat-box">
          <div class="cat-box-title">PENIPUAN (FRAUD / PHISHING)</div>
          <div class="cat-box-val">1 Indikasi</div>
          <span style="font-size: 10px; color: #666;">Pola: klaim hadiah</span>
        </div>
        <div class="cat-box">
          <div class="cat-box-title">PORNOGRAFI TEKS/HTML</div>
          <div class="cat-box-val">1 Indikasi</div>
          <span style="font-size: 10px; color: #666;">Pola: kata sensor dewasa</span>
        </div>
      </div>

      <div class="table-wrap" style="flex: 1;">
        <table>
          <thead>
            <tr>
              <th style="width: 24%;">HALAMAN SUMBER SASARAN</th>
              <th style="width: 14%;">KATEGORI INDIKASI</th>
              <th style="width: 14%;">KATA KUNCI COCOK</th>
              <th style="width: 8%; text-align: center;">BOBOT</th>
              <th style="width: 30%;">CUPLIKAN SNIPPET BUKTI TEKS</th>
              <th style="width: 10%; text-align: center;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>/layanan/info-pajak</code></td>
              <td><strong>Judi Online</strong></td>
              <td><code>slot gacor</code></td>
              <td style="text-align: center;">0.95</td>
              <td><span style="font-family: monospace; font-size: 10.5px;">"...daftar akun di link [slot gacor] resmi deposit pulsa..."</span></td>
              <td style="text-align: center;"><span class="badge">[ TERINDIKASI ]</span></td>
            </tr>
            <tr>
              <td><code>/layanan/info-pajak</code></td>
              <td><strong>Judi Online</strong></td>
              <td><code>maxwin</code></td>
              <td style="text-align: center;">0.88</td>
              <td><span style="font-family: monospace; font-size: 10.5px;">"...garansi kemenangan jackpot [maxwin] live casino 500x..."</span></td>
              <td style="text-align: center;"><span class="badge">[ TERINDIKASI ]</span></td>
            </tr>
            <tr>
              <td><code>/kontak/pengaduan</code></td>
              <td><strong>Penipuan</strong></td>
              <td><code>klaim hadiah</code></td>
              <td style="text-align: center;">0.82</td>
              <td><span style="font-family: monospace; font-size: 10.5px;">"...segera verifikasi untuk [klaim hadiah] undian akhir tahun..."</span></td>
              <td style="text-align: center;"><span class="badge">[ TERINDIKASI ]</span></td>
            </tr>
            <tr>
              <td><code>/forum/diskusi</code></td>
              <td><strong>Pornografi</strong></td>
              <td><code>[kata sensor]</code></td>
              <td style="text-align: center;">0.90</td>
              <td><span style="font-family: monospace; font-size: 10.5px;">"...komentar disusupi spam berbau [istilah sensor] dewasa..."</span></td>
              <td style="text-align: center;"><span class="badge">[ TERINDIKASI ]</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="disclaimer-box">
        <strong>[ ! ] CATATAN VERIFIKASI ANALIS CSIRT:</strong> Seluruh temuan di atas merupakan <em>indikasi awal</em> berbasis pencocokan pola kata kunci otomatis dan belum menjadi vonis final hukum. Diperlukan tinjauan manual oleh personel berwenang sebelum tindakan penanganan insiden.
      </div>
    </main>
  </div>
  {get_footer_html()}
</div>
</body>
</html>'''
}

# 07 - DETEKSI TAUTAN MENCURIGAKAN
mockups_dict["07-deteksi-tautan"] = {
    "num": "07",
    "name": "Halaman Deteksi Tautan Mencurigakan",
    "url": "http://localhost:5173/#/hasil/tautan/scan-105",
    "desc": "Evaluasi heuristik terhadap hyperlink web sasaran, mendeteksi penggunaan IP mentah, subdomain abnormal, sensitive paths, dan backlink tersembunyi berisiko tinggi.",
    "html": f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>07 - Deteksi Tautan Mencurigakan</title>
<style>
{COMMON_CSS}
.stat-strip {{
  display: flex;
  gap: 12px;
}}
.stat-card {{
  flex: 1;
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 8px 12px;
  background: #f8f8f8;
}}
.stat-num {{ font-size: 18px; font-weight: bold; margin-top: 2px; }}
</style>
</head>
<body>
<div class="window">
  {get_browser_header_html("http://localhost:5173/#/hasil/tautan/scan-105")}
  {get_topbar_html()}
  <div class="app-body">
    {get_sidebar_html("Hasil Deteksi")}
    <main class="main-content">
      <div class="page-intro">
        <div>
          <div class="eyebrow">&bull; SISTEM MONITORING CSIRT &bull; EVALUASI HYPERLINK</div>
          <h1 class="page-title">Deteksi Tautan Mencurigakan (Link Heuristics)</h1>
          <p class="page-desc">Analisis heuristik outbound hyperlink untuk mendeteksi penyusupan IP mentah, subdomain tidak wajar, backlink tersembunyi (CSS injection), dan port anomali.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="btn btn-sm">[ Ekspor PDF ]</span>
          <span class="btn btn-sm">[ Ekspor CSV ]</span>
        </div>
      </div>

      <div class="stat-strip">
        <div class="stat-card">
          <div style="font-size: 11px; color: #555;">TOTAL TAUTAN DIPERIKSA</div>
          <div class="stat-num">84 Tautan</div>
          <span style="font-size: 10px; color: #666;">Ditemukan pada dokumen HTML</span>
        </div>
        <div class="stat-card">
          <div style="font-size: 11px; color: #555;">TAUTAN INTERNAL (SAME HOST)</div>
          <div class="stat-num">72 Tautan</div>
          <span style="font-size: 10px; color: #666;">Domain sah sumbawakab.go.id</span>
        </div>
        <div class="stat-card">
          <div style="font-size: 11px; color: #555;">TAUTAN KELUAR (OUTBOUND)</div>
          <div class="stat-num">12 Tautan</div>
          <span style="font-size: 10px; color: #666;">Mengarah ke domain eksternal</span>
        </div>
        <div class="stat-card">
          <div style="font-size: 11px; color: #555;">TAUTAN ANOMALI (MENCURIGAKAN)</div>
          <div class="stat-num">4 Indikasi</div>
          <span style="font-size: 10px; color: #666;">Memenuhi kriteria indikator risiko</span>
        </div>
      </div>

      <div class="table-wrap" style="flex: 1;">
        <table>
          <thead>
            <tr>
              <th style="width: 28%;">URL TAUTAN SASARAN</th>
              <th style="width: 18%;">HALAMAN SUMBER</th>
              <th style="width: 18%;">ATRIBUT / TIPE POLA</th>
              <th style="width: 24%;">ALASAN INDIKASI HEURISTIK</th>
              <th style="width: 12%; text-align: center;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>http://192.168.1.105/gate/login</code></td>
              <td><code>/berita/pengumuman</code></td>
              <td><strong>IP_RAW_FORMAT</strong></td>
              <td>Tautan menggunakan alamat IP numerik mentah tanpa domain</td>
              <td style="text-align: center;"><span class="badge">[ MENCURIGAKAN ]</span></td>
            </tr>
            <tr>
              <td><code>https://promo-resmi.slot-online.vip/ref</code></td>
              <td><code>/layanan/info-pajak</code></td>
              <td><strong>ABNORMAL_SUBDOMAIN</strong></td>
              <td>Subdomain bertingkat mengandung kata kunci judi luar</td>
              <td style="text-align: center;"><span class="badge">[ MENCURIGAKAN ]</span></td>
            </tr>
            <tr>
              <td><code>https://badlink.xyz/exec?sh=1</code></td>
              <td><code>/tentang-kami</code></td>
              <td><strong>HIDDEN_CSS_ATTR</strong></td>
              <td>Tautan disembunyikan atribut inline <code>display:none;</code></td>
              <td style="text-align: center;"><span class="badge">[ MENCURIGAKAN ]</span></td>
            </tr>
            <tr>
              <td><code>http://sumbawakab.go.id:8888/admin</code></td>
              <td><code>/portal/login</code></td>
              <td><strong>NON_STANDARD_PORT</strong></td>
              <td>Port koneksi non-standar (8888) rentan administrative exposure</td>
              <td style="text-align: center;"><span class="badge">[ MENCURIGAKAN ]</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="border: 1.5px dashed #222; background: #fafafa; padding: 8px 12px; font-size: 11px; border-radius: 4px;">
        <strong>[ ! ] ATURAN LINK DETECTION SERVICE:</strong> Deteksi berbasis heuristik format URL dan pola penyusupan backlink ilegal (injected link) yang umum ditanamkan peretas pada footer situs instansi.
      </div>
    </main>
  </div>
  {get_footer_html()}
</div>
</body>
</html>'''
}

# 08 - DETEKSI DEFACEMENT
mockups_dict["08-deteksi-defacement"] = {
    "num": "08",
    "name": "Halaman Deteksi Perubahan Tampilan (Defacement)",
    "url": "http://localhost:5173/#/hasil/defacement/scan-105",
    "desc": "Hasil evaluasi integritas tampilan website melalui perbandingan hash SHA-256 teks & tag semantik DOM saat ini terhadap data baseline resmi yang tersimpan.",
    "html": f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>08 - Deteksi Defacement</title>
<style>
{COMMON_CSS}
.diff-boxes {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}}
.box-col {{
  border: 2px solid #222;
  border-radius: 6px;
  padding: 10px 14px;
}}
.box-col.base {{ background: #fafafa; }}
.box-col.curr {{ background: #f0f0f0; border-width: 2px; }}
.hash-code {{
  font-family: monospace;
  font-size: 10px;
  background: #fff;
  border: 1px solid #777;
  padding: 3px 6px;
  border-radius: 3px;
  display: block;
  margin: 3px 0 6px;
  word-break: break-all;
}}
</style>
</head>
<body>
<div class="window">
  {get_browser_header_html("http://localhost:5173/#/hasil/defacement/scan-105")}
  {get_topbar_html()}
  <div class="app-body">
    {get_sidebar_html("Hasil Deteksi")}
    <main class="main-content">
      <div class="page-intro">
        <div>
          <div class="eyebrow">&bull; SISTEM MONITORING CSIRT &bull; INTEGRITAS HALAMAN</div>
          <h1 class="page-title">Deteksi Perubahan Halaman (Defacement Detection)</h1>
          <p class="page-desc">Komparasi integritas struktur semantik DOM, konsistensi tag judul, dan nilai hash SHA-256 dokumen terhadap baseline resmi tersimpan.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="btn btn-sm">[ Ekspor PDF ]</span>
          <span class="btn btn-sm">[ Perbarui Baseline Resmi ]</span>
        </div>
      </div>

      <div class="diff-boxes">
        <div class="box-col base">
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">[ DATA BASELINE RESMI TERSIMPAN ]</div>
          <div style="font-size: 11px; color: #555;">Hash SHA-256 Baseline:</div>
          <span class="hash-code">sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</span>
          <div style="font-size: 11.5px;">Waktu Rekam: <strong>01/10/2026, 09:15 WITA</strong></div>
          <div style="font-size: 11.5px;">Judul Dokumen: <em>"Portal Resmi Dinas Kominfosandi Kabupaten Sumbawa"</em></div>
        </div>

        <div class="box-col curr">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div style="font-size: 12px; font-weight: bold;">[ KONDISI HASIL PEMINDAIAN AKTUAL ]</div>
            <span class="badge" style="border-width: 2px;">[ HASH BERBEDA / ANOMALI ]</span>
          </div>
          <div style="font-size: 11px; color: #555;">Hash SHA-256 Saat Ini:</div>
          <span class="hash-code">sha256:a4c28e914bf459385bda043224b1f63d09a2588c1b3f7902d25086b9f48a58a7</span>
          <div style="font-size: 11.5px;">Waktu Periksa: <strong>07/11/2026, 13:10 WITA</strong></div>
          <div style="font-size: 11.5px;">Judul Dokumen: <strong>"Hacked by AnonSec - No System Is Safe"</strong></div>
        </div>
      </div>

      <div class="table-wrap" style="flex: 1;">
        <table>
          <thead>
            <tr>
              <th style="width: 20%;">ELEMEN / KOMPONEN</th>
              <th style="width: 28%;">KONDISI BASELINE RESMI</th>
              <th style="width: 28%;">KONDISI PEMINDAIAN AKTUAL</th>
              <th style="width: 14%;">INDIKASI PERUBAHAN</th>
              <th style="width: 10%; text-align: center;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Tag &lt;title&gt; Judul</strong></td>
              <td>"Portal Resmi Dinas Kominfosandi"</td>
              <td>"Hacked by AnonSec - No System Is Safe"</td>
              <td>Perubahan judul halaman drastis</td>
              <td style="text-align: center;"><span class="badge">[ ANOMALI ]</span></td>
            </tr>
            <tr>
              <td><strong>Hash Konten SHA-256</strong></td>
              <td><code>7f83b165...</code></td>
              <td><code>a4c28e91...</code></td>
              <td>Mismatch nilai integritas hash</td>
              <td style="text-align: center;"><span class="badge">[ BERUBAH ]</span></td>
            </tr>
            <tr>
              <td><strong>Elemen Semantik &lt;header&gt;</strong></td>
              <td>Menu navigasi dinas & logo resmi</td>
              <td>Elemen header hilang / dihapus</td>
              <td>Struktur DOM terpotong >75%</td>
              <td style="text-align: center;"><span class="badge">[ ANOMALI ]</span></td>
            </tr>
            <tr>
              <td><strong>Injeksi Skrip Eksternal</strong></td>
              <td>Skrip internal framework CMS</td>
              <td><code>&lt;script src="http://evil.top/x.js"&gt;</code></td>
              <td>Skrip pihak ketiga tidak terdaftar</td>
              <td style="text-align: center;"><span class="badge">[ SUSPICIOUS ]</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="border: 1.5px dashed #222; background: #fafafa; padding: 8px 12px; font-size: 11px; border-radius: 4px;">
        <strong>[ ! ] CATATAN INTEGRITAS:</strong> Perubahan hash konten dapat mengindikasikan serangan defacement atau pembaruan konten sah (maintenance) yang belum didaftarkan ke baseline. Verifikasi fisik situs disarankan.
      </div>
    </main>
  </div>
  {get_footer_html()}
</div>
</body>
</html>'''
}

# 09 - RIWAYAT PEMINDAIAN
mockups_dict["09-riwayat-pemindaian"] = {
    "num": "09",
    "name": "Halaman Riwayat Pemindaian",
    "url": "http://localhost:5173/#/riwayat",
    "desc": "Tabel riwayat seluruh sesi pemindaian historis dari basis data SQLite, filter sumber (Semua, Manual, Terjadwal), status (Berhasil, Gagal), hasil indikasi, dan ekspor CSV.",
    "html": f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>09 - Riwayat Pemindaian</title>
<style>
{COMMON_CSS}
.hist-cards {{
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}}
.hist-card {{
  border: 1.5px solid #222;
  border-radius: 6px;
  padding: 8px 12px;
  background: #fff;
}}
.hist-num {{ font-size: 20px; font-weight: bold; margin-top: 2px; }}

.filter-row {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}}
</style>
</head>
<body>
<div class="window">
  {get_browser_header_html("http://localhost:5173/#/riwayat")}
  {get_topbar_html()}
  <div class="app-body">
    {get_sidebar_html("Riwayat Pemindaian")}
    <main class="main-content">
      <div class="page-intro">
        <div>
          <div class="eyebrow">&bull; LOG PEMANTAUAN HISTORIS</div>
          <h1 class="page-title">Riwayat Pemindaian (Scan History)</h1>
          <p class="page-desc">Daftar rekaman inspeksi keamanan, deteksi konten, dan integritas web yang tersimpan dalam tabel SQLite <code>scans</code>.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="btn">[ Muat Ulang ]</span>
          <span class="btn btn-primary">[ Ekspor CSV Riwayat ]</span>
        </div>
      </div>

      <div class="hist-cards">
        <div class="hist-card">
          <div style="font-size: 11px; color: #555;">TOTAL PEMINDAIAN</div>
          <div class="hist-num">10 Sesi</div>
          <span style="font-size: 10px; color: #666;">Seluruh log database</span>
        </div>
        <div class="hist-card">
          <div style="font-size: 11px; color: #555;">PEMINDAIAN BERHASIL</div>
          <div class="hist-num">8 Sesi</div>
          <span style="font-size: 10px; color: #666;">Perayapan tuntas tanpa error</span>
        </div>
        <div class="hist-card">
          <div style="font-size: 11px; color: #555;">DENGAN INDIKASI</div>
          <div class="hist-num">3 Sesi</div>
          <span style="font-size: 10px; color: #666;">Ditemukan pola konten negatif</span>
        </div>
        <div class="hist-card">
          <div style="font-size: 11px; color: #555;">PEMINDAIAN GAGAL</div>
          <div class="hist-num">2 Sesi</div>
          <span style="font-size: 10px; color: #666;">Kendala akses / timeout / WAF</span>
        </div>
      </div>

      <div class="filter-row">
        <input style="border: 1.5px solid #222; border-radius: 4px; padding: 5px 10px; font-size: 12px; width: 280px; font-family: inherit;" type="text" placeholder="[ Cari situs, URL, atau petugas... ]">
        <div style="display: flex; gap: 8px; align-items: center; font-size: 11.5px;">
          <span>Sumber:</span>
          <span class="badge" style="background: #e0e0e0;">Semua</span>
          <span class="badge">Manual</span>
          <span class="badge">Terjadwal</span>
          <span style="margin-left: 10px;">Status:</span>
          <select style="border: 1.5px solid #222; border-radius: 3px; font-size: 11px; padding: 2px 6px;">
            <option>Semua Status</option>
            <option>Berhasil Saja</option>
            <option>Gagal Saja</option>
          </select>
        </div>
      </div>

      <div class="table-wrap" style="flex: 1;">
        <table>
          <thead>
            <tr>
              <th style="width: 4%; text-align: center;">NO</th>
              <th style="width: 24%;">WEBSITE / INSTANSI</th>
              <th style="width: 10%;">SUMBER</th>
              <th style="width: 18%;">EMAIL PETUGAS</th>
              <th style="width: 14%;">WAKTU SCAN</th>
              <th style="width: 8%; text-align: center;">CRAWL</th>
              <th style="width: 12%; text-align: center;">KESIMPULAN</th>
              <th style="width: 10%; text-align: right;">AKSI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1</td>
              <td><strong>Diskominfo Kab. Sumbawa</strong><br><span style="font-size: 10px; color: #555;">https://diskominfosandi.sumbawakab.go.id/</span></td>
              <td><span class="badge">[ TERJADWAL ]</span></td>
              <td><code>petugas.csirt@sumbawakab.go.id</code></td>
              <td>07/11/2026 14:30 WITA</td>
              <td style="text-align: center;"><span class="badge">[ BERHASIL ]</span></td>
              <td style="text-align: center;"><span class="badge">[ BEBAS INDIKASI ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Lihat ]</span> <span class="btn btn-sm">[ PDF ]</span></td>
            </tr>
            <tr>
              <td style="text-align: center;">2</td>
              <td><strong>E-Samsat Kota Sumbawa</strong><br><span style="font-size: 10px; color: #555;">https://esamsatkotasumbawa.org/</span></td>
              <td><span class="badge">[ MANUAL ]</span></td>
              <td><code>analis1@sumbawakab.go.id</code></td>
              <td>07/11/2026 13:10 WITA</td>
              <td style="text-align: center;"><span class="badge">[ BERHASIL ]</span></td>
              <td style="text-align: center;"><span class="badge" style="border-width: 2px;">[ 4 INDIKASI ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Lihat ]</span> <span class="btn btn-sm">[ PDF ]</span></td>
            </tr>
            <tr>
              <td style="text-align: center;">3</td>
              <td><strong>Portal Pemkab Sumbawa</strong><br><span style="font-size: 10px; color: #555;">https://sumbawakab.go.id/</span></td>
              <td><span class="badge">[ MANUAL ]</span></td>
              <td><code>admin@sumbawakab.go.id</code></td>
              <td>06/11/2026 21:00 WITA</td>
              <td style="text-align: center;"><span class="badge" style="border-style: dashed;">[ GAGAL ]</span></td>
              <td style="text-align: center;"><span class="badge" style="border-style: dashed;">[ GAGAL CRAWL ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Lihat ]</span> <span class="btn btn-sm">[ PDF ]</span></td>
            </tr>
            <tr>
              <td style="text-align: center;">4</td>
              <td><strong>Bappeda Kab. Sumbawa</strong><br><span style="font-size: 10px; color: #555;">https://bappeda.sumbawakab.go.id/</span></td>
              <td><span class="badge">[ TERJADWAL ]</span></td>
              <td><code>petugas.csirt@sumbawakab.go.id</code></td>
              <td>06/11/2026 02:00 WITA</td>
              <td style="text-align: center;"><span class="badge">[ BERHASIL ]</span></td>
              <td style="text-align: center;"><span class="badge">[ BEBAS INDIKASI ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Lihat ]</span> <span class="btn btn-sm">[ PDF ]</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="font-size: 10.5px; color: #666; text-align: right;">
        Menampilkan 4 dari 10 rekaman riwayat &bull; [ DATA DUMMY REPRESENTATIF ]
      </div>
    </main>
  </div>
  {get_footer_html()}
</div>
</body>
</html>'''
}

# 10 - DETAIL HASIL PEMINDAIAN
mockups_dict["10-detail-hasil-pemindaian"] = {
    "num": "10",
    "name": "Halaman Detail Hasil Pemindaian",
    "url": "http://localhost:5173/#/riwayat/detail/scan-105",
    "desc": "Detail drill-down sesi pemindaian tertentu, menampilkan ringkasan crawler (HTTP status), konfirmasi status email notifikasi petugas (Message-ID), status 3 detektor, serta rincian temuan per halaman.",
    "html": f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>10 - Detail Hasil Pemindaian</title>
<style>
{COMMON_CSS}
.session-info-card {{
  border: 2px solid #222;
  border-radius: 6px;
  padding: 10px 14px;
  background: #f8f8f8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}}
.notif-banner {{
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 7px 12px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11.5px;
}}
.tri-detector-grid {{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}}
.det-col {{
  border: 1.5px solid #222;
  border-radius: 4px;
  padding: 8px 12px;
  background: #fff;
}}
</style>
</head>
<body>
<div class="window">
  {get_browser_header_html("http://localhost:5173/#/riwayat/detail/scan-105")}
  {get_topbar_html()}
  <div class="app-body">
    {get_sidebar_html("Riwayat Pemindaian")}
    <main class="main-content">
      <div style="font-size: 11px; color: #666; margin-bottom: 2px;">
        Riwayat Pemindaian &gt; Detail Hasil Sesi #scan-20261107-1310
      </div>
      <div class="page-intro">
        <div>
          <h1 class="page-title">Detail Hasil Pemindaian Sesi</h1>
          <p class="page-desc">Informasi lengkap perayapan web crawler, status pengiriman email notifikasi, dan rincian indikasi ketiga microservice detektor.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="btn">[ &larr; Kembali ke Riwayat ]</span>
          <span class="btn">[ Ekspor CSV ]</span>
          <span class="btn btn-primary">[ Unduh Laporan PDF ]</span>
        </div>
      </div>

      <div class="session-info-card">
        <div>
          <div style="font-size: 13px; font-weight: bold;">TARGET: https://esamsatkotasumbawa.org/</div>
          <div style="font-size: 11px; color: #555; margin-top: 2px;">
            Waktu Scan: <strong>07/11/2026 13:10 WITA</strong> &bull; Sumber: <span class="badge">[ MANUAL ]</span> &bull; Status Crawl: <strong>HTTP 200 OK (text/html)</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge" style="font-size: 12px; border-width: 2px;">[ 4 INDIKASI DITEMUKAN ]</span>
        </div>
      </div>

      <!-- Email Notification Confirmation Banner -->
      <div class="notif-banner">
        <div>
          <strong>[ SURAT ] Status Notifikasi Email:</strong>
          <span class="badge" style="background: #e2e2e2;">[ TERKIRIM (250 OK) ]</span>
          <span>ke: <code>analis1@sumbawakab.go.id</code> (Message-ID: &lt;msg-20261107-001@smtp.gmail.com&gt;)</span>
        </div>
        <span class="btn btn-sm">[ Kirim Ulang Email ]</span>
      </div>

      <!-- 3 Detectors Status -->
      <div class="tri-detector-grid">
        <div class="det-col">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 12px;">[ 1 ] Deteksi Teks</strong>
            <span class="badge">[ TERINDIKASI ]</span>
          </div>
          <div style="font-size: 11px; color: #444; margin-top: 4px;">
            3 kata kunci pola cocok: <code>slot gacor</code>, <code>maxwin</code>, <code>judi online</code>.
          </div>
        </div>
        <div class="det-col">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 12px;">[ 2 ] Integritas Defacement</strong>
            <span class="badge" style="border-style: dashed;">[ DILEWATI ]</span>
          </div>
          <div style="font-size: 11px; color: #666; margin-top: 4px;">
            Pemeriksaan dilewati karena baseline belum dikonfigurasi untuk URL ini.
          </div>
        </div>
        <div class="det-col">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 12px;">[ 3 ] Deteksi Tautan</strong>
            <span class="badge">[ TERINDIKASI ]</span>
          </div>
          <div style="font-size: 11px; color: #444; margin-top: 4px;">
            1 tautan terindikasi format IP mentah (<code>http://192.168.1.105/gate/</code>).
          </div>
        </div>
      </div>

      <!-- Scanned Pages Breakdown -->
      <div class="table-wrap" style="flex: 1;">
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">KEDALAMAN</th>
              <th style="width: 38%;">URL HALAMAN YANG DIPERIKSA</th>
              <th style="width: 14%; text-align: center;">STATUS HTTP</th>
              <th style="width: 24%;">TEMUAN INDIKASI DETEKTOR</th>
              <th style="width: 14%; text-align: center;">KESIMPULAN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Depth 0</td>
              <td><code>https://esamsatkotasumbawa.org/</code></td>
              <td style="text-align: center;">HTTP 200 OK</td>
              <td>Teks: [ Bersih ] &bull; Link: [ Bersih ]</td>
              <td style="text-align: center;"><span class="badge">[ AMAN ]</span></td>
            </tr>
            <tr>
              <td>Depth 1</td>
              <td><code>https://esamsatkotasumbawa.org/layanan/pajak</code></td>
              <td style="text-align: center;">HTTP 200 OK</td>
              <td><strong>Judi Online (slot gacor, maxwin) & IP Link</strong></td>
              <td style="text-align: center;"><span class="badge" style="border-width: 2px;">[ TERINDIKASI ]</span></td>
            </tr>
            <tr>
              <td>Depth 1</td>
              <td><code>https://esamsatkotasumbawa.org/tentang-kami</code></td>
              <td style="text-align: center;">HTTP 200 OK</td>
              <td>Teks: [ Bersih ] &bull; Link: [ Bersih ]</td>
              <td style="text-align: center;"><span class="badge">[ AMAN ]</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
  {get_footer_html()}
</div>
</body>
</html>'''
}

# 12 - NOTIFIKASI
mockups_dict["12-notifikasi"] = {
    "num": "12",
    "name": "Halaman / Pusat Log Notifikasi Hasil Pemindaian",
    "url": "http://localhost:5173/#/notifikasi",
    "desc": "Pusat log pengiriman notifikasi pemindaian ke email petugas melalui SMTP Nodemailer, menampilkan daftar alert indikasi, status pengiriman (250 OK / Timeout), dan isolasi per-petugas.",
    "html": f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>12 - Pusat Log Notifikasi</title>
<style>
{COMMON_CSS}
.notif-top-grid {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}}
.notif-panel-box {{
  border: 2px solid #222;
  border-radius: 6px;
  padding: 10px 14px;
  background: #fafafa;
}}
.alert-item {{
  border: 1px solid #777;
  border-radius: 4px;
  padding: 6px 10px;
  background: #fff;
  margin-bottom: 6px;
  font-size: 11.5px;
}}
</style>
</head>
<body>
<div class="window">
  {get_browser_header_html("http://localhost:5173/#/notifikasi")}
  {get_topbar_html(active_notif=True)}
  <div class="app-body">
    {get_sidebar_html("Dashboard")}
    <main class="main-content">
      <div class="page-intro">
        <div>
          <div class="eyebrow">&bull; SISTEM MONITORING CSIRT &bull; LAYANAN NOTIFIKASI EMAIL PETUGAS</div>
          <h1 class="page-title">Pusat Log & Pengiriman Notifikasi Pemantauan</h1>
          <p class="page-desc">Riwayat notifikasi otomatis hasil pemindaian yang dikirimkan ke email petugas CSIRT melalui SMTP Nodemailer dengan isolasi per-petugas pemrakarsa.</p>
        </div>
        <div>
          <span class="badge" style="padding: 4px 10px; font-size: 11.5px;">[ KANAL AKTIF: SMTP GMAIL / NODEMAILER ]</span>
        </div>
      </div>

      <div class="notif-top-grid">
        <div class="notif-panel-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 12px;">[ LONCENG ] PANEL NOTIFIKASI AKTIF (TOPBAR)</strong>
            <span class="btn btn-sm">[ Tandai Semua Dibaca ]</span>
          </div>
          <div class="alert-item">
            <div style="display: flex; justify-content: space-between;">
              <strong>[ ! ] Indikasi judi online pada esamsatkotasumbawa.org</strong>
              <span style="font-size: 10px; color: #666;">13:10 WITA</span>
            </div>
            <div style="font-size: 10.5px; color: #444; margin-top: 2px;">Ditemukan 3 temuan kata kunci &bull; Email terkirim ke: analis1@sumbawakab.go.id</div>
          </div>
          <div class="alert-item">
            <div style="display: flex; justify-content: space-between;">
              <strong>[ ! ] Indikasi tautan mencurigakan pada injected-page</strong>
              <span style="font-size: 10px; color: #666;">05/11 16:45 WITA</span>
            </div>
            <div style="font-size: 10.5px; color: #444; margin-top: 2px;">Tautan format IP mentah &bull; Email terkirim ke: tester@sumbawakab.go.id</div>
          </div>
        </div>

        <div class="notif-panel-box">
          <strong style="font-size: 12px; display: block; margin-bottom: 6px;">[ RINGKASAN DISPATCH NOTIFIKASI ]</strong>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11.5px;">
            <div style="border: 1px solid #ccc; padding: 6px; background: #fff; border-radius: 3px;">
              Total Notifikasi Tercatat: <strong>10 Pengiriman</strong>
            </div>
            <div style="border: 1px solid #ccc; padding: 6px; background: #fff; border-radius: 3px;">
              Berhasil Terkirim (250 OK): <strong>8 Pengiriman</strong>
            </div>
            <div style="border: 1px solid #ccc; padding: 6px; background: #fff; border-radius: 3px;">
              Gagal Terkirim (Timeout): <strong>1 Pengiriman</strong>
            </div>
            <div style="border: 1px solid #ccc; padding: 6px; background: #fff; border-radius: 3px;">
              Antrean Background Job: <strong>1 Menunggu</strong>
            </div>
          </div>
          <div style="font-size: 10.5px; color: #555; margin-top: 8px;">
            * Pengiriman bersifat asinkron via <code>setImmediate</code> tanpa memblokir respons HTTP dashboard.
          </div>
        </div>
      </div>

      <div class="table-wrap" style="flex: 1;">
        <table>
          <thead>
            <tr>
              <th style="width: 12%;">ID NOTIFIKASI</th>
              <th style="width: 14%;">SESI SCAN ID</th>
              <th style="width: 12%;">KANAL</th>
              <th style="width: 22%;">EMAIL PENERIMA</th>
              <th style="width: 22%;">SUBJEK PESAN EMAIL</th>
              <th style="width: 10%; text-align: center;">STATUS</th>
              <th style="width: 8%; text-align: right;">AKSI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>notif-105</code></td>
              <td><code>scan-20261107-1310</code></td>
              <td>Email (SMTP)</td>
              <td><code>analis1@sumbawakab.go.id</code></td>
              <td>[PERINGATAN] Indikasi Konten Negatif: esamsatkotasumbawa.org</td>
              <td style="text-align: center;"><span class="badge">[ TERKIRIM (250 OK) ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span></td>
            </tr>
            <tr>
              <td><code>notif-104</code></td>
              <td><code>scan-20261107-1430</code></td>
              <td>Email (SMTP)</td>
              <td><code>petugas.csirt@sumbawakab.go.id</code></td>
              <td>[LAPORAN] Hasil Pemindaian Rutin: diskominfosandi.sumbawakab.go.id</td>
              <td style="text-align: center;"><span class="badge">[ TERKIRIM (250 OK) ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span></td>
            </tr>
            <tr>
              <td><code>notif-103</code></td>
              <td><code>scan-20261106-2100</code></td>
              <td>Email (SMTP)</td>
              <td><code>admin@sumbawakab.go.id</code></td>
              <td>[GAGAL CRAWL] Kendala Akses Situs: sumbawakab.go.id</td>
              <td style="text-align: center;"><span class="badge">[ TERKIRIM (250 OK) ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Detail ]</span></td>
            </tr>
            <tr>
              <td><code>notif-102</code></td>
              <td><code>scan-20261105-1645</code></td>
              <td>Email (SMTP)</td>
              <td><code>tester@sumbawakab.go.id</code></td>
              <td>[PERINGATAN] Indikasi Pola Negatif: localhost:8080</td>
              <td style="text-align: center;"><span class="badge" style="border-style: dashed;">[ GAGAL (TIMEOUT) ]</span></td>
              <td style="text-align: right;"><span class="btn btn-sm">[ Kirim Ulang ]</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="border: 1.5px dashed #222; background: #fafafa; padding: 6px 12px; font-size: 11px; border-radius: 4px;">
        <strong>[ i ] KETERANGAN FITUR:</strong> Pengiriman email diimplementasikan oleh <code>notification-service.js</code> dan dicatat pada tabel <code>notifications</code> SQLite. Gateway WhatsApp/Telegram/SMS sengaja tidak diaktifkan karena belum adanya API resmi Pemda.
      </div>
    </main>
  </div>
  {get_footer_html()}
</div>
</body>
</html>'''
}

# -----------------------------------------------------------------------------
# EXECUTION & EXPORT (HTML, SVG, PNG)
# -----------------------------------------------------------------------------
def build_all():
    print("="*70)
    print("GENERATING BALSAMIQ WIREFRAME MOCKUPS (1440x900) - MONOCHROME")
    print("="*70)

    generated_files = []

    for key, data in mockups_dict.items():
        html_filename = f"{key}.html"
        svg_filename = f"{key}.svg"
        png_filename = f"{key}.png"

        html_path = os.path.join(BASE_DIR, html_filename)
        svg_path = os.path.join(BASE_DIR, svg_filename)
        png_path = os.path.join(BASE_DIR, png_filename)

        # 1. Write HTML
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(data["html"])

        # 2. Write SVG wrapping the HTML
        svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <foreignObject width="1440" height="900">
{data["html"]}
  </foreignObject>
</svg>'''
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(svg_content)

        # 3. Render PNG using Headless Chrome
        file_url = f"file:///{html_path.replace(os.sep, '/')}"
        cmd = [
            CHROME_PATH,
            "--headless",
            "--disable-gpu",
            f"--screenshot={png_path}",
            "--window-size=1440,900",
            file_url
        ]
        result = subprocess.run(cmd, capture_output=True)
        if os.path.exists(png_path) and os.path.getsize(png_path) > 1000:
            print(f"[OK] {png_filename} ({os.path.getsize(png_path)} bytes) & {svg_filename}")
            generated_files.append((key, data, png_filename, svg_filename))
        else:
            print(f"[ERR] Failed to render {png_filename}: {result.stderr}")

    print(f"\\nTotal mockups generated: {len(generated_files)}")
    return generated_files

if __name__ == "__main__":
    build_all()
