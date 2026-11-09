import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  Database,
  Calendar,
  Lock,
} from "lucide-react";
import {
  Button,
  IconButton,
  Field,
  Input,
  Select,
  Textarea,
  Checkbox,
  Badge,
  StatusBadge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  StatCard,
  Table,
  TableRow,
  TableCell,
  TableEmpty,
  TableSkeleton,
  Pagination,
  Modal,
  ConfirmDialog,
  Alert,
  Spinner,
  EmptyState,
  PageHeader,
  SegmentedControl,
  Tabs,
} from "./index.js";

/**
 * COMPONENT GALLERY (MODE PENGEMBANGAN)
 *
 * Menampilkan seluruh varian dan state dari pustaka komponen dasar
 * Content Detection System — Pemerintah Kabupaten Sumbawa.
 * Hanya dimuat saat DEV mode pada URL hash #/_komponen.
 */

export function ComponentGallery() {
  // State untuk kontrol interaktif di galeri
  const [modalSize, setModalSize] = useState(null); // 'sm' | 'md' | 'lg' | null
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTone, setConfirmTone] = useState("danger");
  const [filterValue, setFilterValue] = useState("semua");
  const [activeTab, setActiveTab] = useState("tab-1");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [checkedState, setCheckedState] = useState(true);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 80px", fontFamily: "var(--font-sans)" }}>
      <PageHeader
        breadcrumb={
          <span>
            <a href="#landing" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
              Beranda
            </a>{" "}
            / Pustaka Komponen Sistem
          </span>
        }
        title="Galeri Komponen Institusional"
        description="Dokumentasi interaktif seluruh komponen dasar antarmuka pengguna berbasis design tokens (IBM Plex Sans, palet resmi Pemkab Sumbawa, WCAG 2.1 AA/AAA)."
        action={
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="secondary" size="sm" as="a" href="#landing">
              Ke Landing Page
            </Button>
            <Button variant="primary" size="sm" as="a" href="#login">
              Ke Login Page
            </Button>
          </div>
        }
      />

      {/* ── BAGIAN 1: BUTTON & ICON BUTTON ── */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          1. Tombol (Button &amp; IconButton)
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h4 style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
              Varian Standar (Ukuran MD):
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
              Ukuran Kecil (SM) dengan Ikon:
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <Button variant="primary" size="sm" icon={Plus}>
                Tambah Data
              </Button>
              <Button variant="secondary" size="sm" icon={ExternalLink}>
                Buka Tautan
              </Button>
              <Button variant="ghost" size="sm" icon={FileText}>
                Unduh PDF
              </Button>
              <Button variant="danger" size="sm" icon={Trash2}>
                Hapus Data
              </Button>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
              Status (Loading &amp; Disabled):
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <Button variant="primary" loading>
                Menyimpan Data...
              </Button>
              <Button variant="secondary" loading>
                Memuat...
              </Button>
              <Button variant="primary" disabled>
                Tombol Nonaktif
              </Button>
              <Button variant="secondary" disabled>
                Batal (Disabled)
              </Button>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
              IconButton (Wajib Accessible Label &amp; Area Klik Minimal 36×36px):
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <IconButton icon={Search} label="Cari data pemindaian" variant="secondary" />
              <IconButton icon={Edit} label="Sunting informasi situs" variant="secondary" />
              <IconButton icon={Trash2} label="Hapus situs terpilih" variant="danger" />
              <IconButton icon={Plus} label="Tambah situs baru" variant="primary" />
              <IconButton icon={Trash2} label="Hapus (Nonaktif)" variant="secondary" disabled />
            </div>
          </div>
        </div>
      </section>

      {/* ── BAGIAN 2: FORM (FIELD, INPUT, SELECT, TEXTAREA, CHECKBOX) ── */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          2. Kontrol Formulir (Form Controls)
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          <Field label="URL Situs Target" required hint="Gunakan URL lengkap dengan protokol https://">
            <Input icon={Search} placeholder="https://diskominfo.sumbawagab.go.id" />
          </Field>

          <Field label="Kata Sandi Administrator" required hint="Minimal 8 karakter kombinasi">
            <Input type="password" icon={Lock} showPasswordToggle placeholder="Masukkan kata sandi" />
          </Field>

          <Field label="Kategori Pemindaian" optional hint="Pilih cakupan modul pemindaian aktif">
            <Select
              options={[
                { value: "all", label: "Seluruh Modul (Teks, Defacement, Tautan)" },
                { value: "text", label: "Khusus Deteksi Teks Negatif" },
                { value: "defacement", label: "Khusus Integritas Halaman (Defacement)" },
              ]}
            />
          </Field>

          <Field label="Status Input Galat (Invalid State)" required error="URL situs tidak valid atau tidak dapat dijangkau server.">
            <Input defaultValue="http://situs-salah-format" invalid />
          </Field>

          <Field label="Input Nonaktif (Disabled)" hint="Field ini dikunci oleh kebijakan sistem">
            <Input defaultValue="Nilai Terkunci Otomatis" disabled />
          </Field>

          <Field label="Pola Kata Kunci Kustom (Monospace Textarea)" optional hint="Gunakan baris baru untuk memisahkan setiap pola regex">
            <Textarea mono rows={3} placeholder="^.*(slot|gacor|maxwin).*$" defaultValue={`pola_1: .*casino.*\npola_2: .*taruhan.*`} />
          </Field>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4 style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
            Checkbox Pilihan:
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Checkbox
              label="Kirimkan notifikasi email insiden ke Tim CSIRT Sumbawa"
              description="Laporan detail akan otomatis dikirimkan bila ditemukan indikasi konten negatif."
              checked={checkedState}
              onChange={(e) => setCheckedState(e.target.checked)}
            />
            <Checkbox
              label="Simpan snapshot DOM untuk pembanding baseline defacement berikutnya"
              defaultChecked
            />
            <Checkbox
              label="Opsi dinonaktifkan (Kepatuhan Kebijakan)"
              description="Fitur ini memerlukan hak akses Administrator Level 1."
              disabled
            />
          </div>
        </div>
      </section>

      {/* ── BAGIAN 3: BADGES & STATUS BADGES ── */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          3. Lencana &amp; Status (Badge &amp; StatusBadge)
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h4 style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
              Tone Standar (Kotak Radius 4px, Bukan Pill):
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <Badge tone="neutral">Neutral Badge</Badge>
              <Badge tone="info" dot>
                Info System
              </Badge>
              <Badge tone="success" dot>
                Aman / Terverifikasi
              </Badge>
              <Badge tone="warning" dot>
                Peringatan Dini
              </Badge>
              <Badge tone="danger" dot>
                Bahaya / Ancaman
              </Badge>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
              Kategori Deteksi Konten Negatif (`--color-cat-*`):
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <Badge tone="category" category="gambling">
                Judi Online (Gambling)
              </Badge>
              <Badge tone="category" category="fraud">
                Penipuan / Phishing
              </Badge>
              <Badge tone="category" category="pornography">
                Pornografi
              </Badge>
              <Badge tone="category" category="link">
                Tautan Mencurigakan
              </Badge>
              <Badge tone="category" category="defacement">
                Perubahan Defacement
              </Badge>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
              StatusBadge Domain (Selalu Teks + Ikon, Tidak Mengandalkan Warna Semata):
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <StatusBadge status="clean" />
              <StatusBadge status="indicated" />
              <StatusBadge status="failed" />
              <StatusBadge status="running" />
              <StatusBadge status="pending" />
              <StatusBadge status="active" />
              <StatusBadge status="inactive" />
            </div>
          </div>
        </div>
      </section>

      {/* ── BAGIAN 4: CARDS & STAT CARDS ── */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          4. Kartu (Card, CardHeader, CardBody, CardFooter &amp; StatCard)
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <StatCard
            label="Total Situs Dipantau"
            value="48"
            description="45 aktif dalam monitoring rutin"
            tone="default"
            icon={Database}
          />
          <StatCard
            label="Insiden Terindikasi"
            value="3"
            description="Perlu verifikasi analis CSIRT"
            tone="danger"
            icon={AlertTriangle}
          />
          <StatCard
            label="Situs Bebas Anomali"
            value="42"
            description="Status bersih dan aman"
            tone="success"
            icon={ShieldCheck}
          />
          <StatCard
            label="Pemeriksaan Terjadwal"
            value="12"
            description="Berjalan setiap 3 jam otomatis"
            tone="default"
            icon={Calendar}
          />
        </div>

        <Card>
          <CardHeader
            title="Konfigurasi Modul Pemindaian Otomatis"
            description="Atur preferensi inspeksi dokumen HTML dan ambang batas deteksi."
            action={<Button variant="secondary" size="sm">Ubah Pengaturan</Button>}
          />
          <CardBody>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: "var(--leading-normal)" }}>
              Sistem Content Detection melakukan perayapan asinkron mendalam hingga tingkat kedalaman 3 (depth 3).
              Setiap halaman dianalisis menggunakan algoritma pencocokan pola Aho-Corasick berkecepatan tinggi,
              ekstraksi URL tautan jangkar, serta perbandingan baseline struktur DOM.
            </p>
          </CardBody>
          <CardFooter>
            <Button variant="ghost" size="sm">Bantuan Konfigurasi</Button>
            <Button variant="primary" size="sm">Simpan Perubahan</Button>
          </CardFooter>
        </Card>
      </section>

      {/* ── BAGIAN 5: TABEL & PAGINASI ── */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          5. Tabel Data &amp; Paginasi (Table, Row, Cell &amp; Pagination)
        </h2>

        <Table caption="Daftar Contoh Pemantauan Situs Pemerintah Kabupaten Sumbawa" maxHeight="340px">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>No</th>
              <th>Nama Sasaran / Instansi</th>
              <th>URL Halaman</th>
              <th>Status Integritas</th>
              <th style={{ textAlign: "right" }}>Temuan</th>
              <th style={{ textAlign: "right" }}>Waktu Periksa</th>
            </tr>
          </thead>
          <tbody>
            <TableRow onRowClick={() => alert("Baris 1 diklik via mouse atau tombol Enter!")}>
              <TableCell numeric>1</TableCell>
              <TableCell>
                <strong>Dinas Komunikasi, Informatika dan Statistik</strong>
              </TableCell>
              <TableCell>https://diskominfo.sumbawakab.go.id</TableCell>
              <TableCell>
                <StatusBadge status="clean" />
              </TableCell>
              <TableCell numeric>0</TableCell>
              <TableCell numeric>14:20:10</TableCell>
            </TableRow>
            <TableRow onRowClick={() => alert("Baris 2 diklik!")}>
              <TableCell numeric>2</TableCell>
              <TableCell>
                <strong>Badan Pendapatan Daerah</strong>
              </TableCell>
              <TableCell>https://bapenda.sumbawakab.go.id</TableCell>
              <TableCell>
                <StatusBadge status="indicated">1 Terindikasi</StatusBadge>
              </TableCell>
              <TableCell numeric>2</TableCell>
              <TableCell numeric>14:18:05</TableCell>
            </TableRow>
            <TableRow onRowClick={() => alert("Baris 3 diklik!")}>
              <TableCell numeric>3</TableCell>
              <TableCell>
                <strong>Sekretariat Daerah Kabupaten Sumbawa</strong>
              </TableCell>
              <TableCell>https://setda.sumbawakab.go.id</TableCell>
              <TableCell>
                <StatusBadge status="running" />
              </TableCell>
              <TableCell numeric>-</TableCell>
              <TableCell numeric>Sedang proses</TableCell>
            </TableRow>
          </tbody>
        </Table>

        <div style={{ marginTop: "12px" }}>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={48}
            onChange={({ page: p, pageSize: ps }) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </div>

        <div style={{ marginTop: "24px" }}>
          <h4 style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
            State Tabel Kosong (TableEmpty):
          </h4>
          <Table caption="Tabel Kosong">
            <thead>
              <tr>
                <th>Kolom 1</th>
                <th>Kolom 2</th>
                <th>Kolom 3</th>
              </tr>
            </thead>
            <tbody>
              <TableEmpty
                title="Belum Ada Riwayat Pemindaian"
                description="Klik tombol di bawah untuk menjadwalkan pemindaian instansi pertama."
                colSpan={3}
                action={<Button variant="primary" size="sm" icon={Plus}>Mulai Pemindaian</Button>}
              />
            </tbody>
          </Table>
        </div>
      </section>

      {/* ── BAGIAN 6: MODAL & CONFIRM DIALOG ── */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          6. Dialog Modal &amp; Konfirmasi (Modal &amp; ConfirmDialog)
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <Button variant="secondary" onClick={() => setModalSize("sm")}>
            Buka Modal Kecil (SM 440px)
          </Button>
          <Button variant="secondary" onClick={() => setModalSize("md")}>
            Buka Modal Sedang (MD 600px)
          </Button>
          <Button variant="secondary" onClick={() => setModalSize("lg")}>
            Buka Modal Lebar (LG 800px)
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmTone("danger");
              setShowConfirm(true);
            }}
          >
            Buka ConfirmDialog (Bahaya / Hapus)
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setConfirmTone("default");
              setShowConfirm(true);
            }}
          >
            Buka ConfirmDialog (Default)
          </Button>
        </div>

        {/* Modal Interaktif */}
        <Modal
          open={Boolean(modalSize)}
          onClose={() => setModalSize(null)}
          title={`Modal Dialog Interaktif (${modalSize?.toUpperCase()})`}
          size={modalSize || "md"}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalSize(null)}>
                Tutup
              </Button>
              <Button variant="primary" onClick={() => setModalSize(null)}>
                Simpan Konfigurasi
              </Button>
            </>
          }
        >
          <p style={{ margin: "0 0 12px 0", fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: "var(--leading-normal)" }}>
            Dialog ini menggunakan React Portal ke <code>document.body</code> dengan atribut <code>role="dialog"</code>,
            focus trap otomatis (tekan Tab tidak akan keluar dari dialog), scroll lock pada body, serta dukungan tombol Esc untuk menutup.
          </p>
          <Field label="Contoh Input di Dalam Modal">
            <Input placeholder="Fokus berpindah ke elemen input ini" />
          </Field>
        </Modal>

        {/* ConfirmDialog Interaktif */}
        <ConfirmDialog
          open={showConfirm}
          tone={confirmTone}
          title={confirmTone === "danger" ? "Hapus Target Pemindaian?" : "Jalankan Pemeriksaan Rutin?"}
          description={
            confirmTone === "danger"
              ? "Tindakan ini akan menghapus riwayat log dan baseline situs yang bersangkutan secara permanen. Tindakan tidak dapat dibatalkan."
              : "Pemindaian seluruh instansi aktif akan dimulai di latar belakang. Proses memakan waktu 1–2 menit."
          }
          confirmLabel={confirmTone === "danger" ? "Hapus Sekarang" : "Mulai Pemindaian"}
          cancelLabel="Batal"
          onConfirm={() => {
            alert("Aksi dikonfirmasi!");
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      </section>

      {/* ── BAGIAN 7: UMPAN BALIK (ALERT, SPINNER, EMPTY_STATE) ── */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          7. Umpan Balik Visual (Alert, Spinner &amp; EmptyState)
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          <Alert tone="info" title="Informasi Pemeliharaan Terjadwal" onClose={() => {}}>
            Sistem Content Detection dijadwalkan melakukan backup basis data otomatis setiap hari Minggu pukul 02:00 WITA.
          </Alert>
          <Alert tone="success" title="Pemindaian Berhasil Selesai" onClose={() => {}}>
            Seluruh 24 halaman pada situs instansi sasaran telah diperiksa dan dinyatakan aman bebas dari anomali.
          </Alert>
          <Alert tone="warning" title="Peringatan Performa Perayapan" onClose={() => {}}>
            Waktu respons server target melebihi 3000ms. Perayapan diperlambat untuk menjaga stabilitas server instansi.
          </Alert>
          <Alert
            tone="danger"
            title="Indikasi Konten Negatif Terdeteksi"
            action={<Button variant="danger" size="sm">Tinjau Bukti</Button>}
            onClose={() => {}}
          >
            Ditemukan indikasi kata kunci judi online pada tautan eksternal halaman portal. Segera lakukan verifikasi.
          </Alert>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px", padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}>
          <Spinner size="sm" label="Memuat status singkat..." />
          <Spinner size="md" label="Memproses data pemindaian..." />
          <Spinner size="lg" label="Mengunduh laporan PDF..." />
        </div>
      </section>

      {/* ── BAGIAN 8: NAVIGASI KECIL (SEGMENTED CONTROL & TABS) ── */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          8. Navigasi Ringan (SegmentedControl &amp; Tabs)
        </h2>

        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
            SegmentedControl (Menggantikan Filter Pill, Mendukung Tombol Panah Kiri/Kanan Keyboard):
          </h4>
          <SegmentedControl
            value={filterValue}
            onChange={setFilterValue}
            items={[
              { value: "semua", label: "Semua Hasil", count: 48 },
              { value: "terindikasi", label: "Terindikasi", count: 3 },
              { value: "bersih", label: "Bebas Anomali", count: 42 },
              { value: "gagal", label: "Kendala Teknis", count: 3 },
            ]}
          />
        </div>

        <div>
          <h4 style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
            Underline Tabs (Pola ARIA Tabs Standar):
          </h4>
          <Tabs
            activeId={activeTab}
            onChange={setActiveTab}
            items={[
              { id: "tab-1", label: "Ringkasan Eksekutif", icon: FileText, count: 4 },
              { id: "tab-2", label: "Daftar Tautan Mencurigakan", icon: ExternalLink, count: 1 },
              { id: "tab-3", label: "Perubahan Struktur DOM", icon: ShieldCheck },
            ]}
          />
          <div style={{ padding: "16px 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Konten aktif panel: <strong>{activeTab}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ComponentGallery;
