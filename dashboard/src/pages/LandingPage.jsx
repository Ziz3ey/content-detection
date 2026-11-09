import React, { useEffect } from "react";
import { ArrowRight, LogIn, FileText, ExternalLink, GitCompare } from "lucide-react";
import {
  Button,
  Card,
  BrandMark,
} from "../components/index.js";

/**
 * LANDING PAGE (`#/`, `#/landing`, `#/beranda`)
 *
 * Portal publik resmi Sistem Pemantauan dan Deteksi Konten Negatif
 * Pemerintah Kabupaten Sumbawa.
 *
 * Props:
 * - onEnterDashboard: function (navigasi ke login/dashboard)
 */

export default function LandingPage({ onEnterDashboard }) {
  useEffect(() => {
    document.title = "Content Detection — Pemantauan Konten Negatif Situs Web Pemkab Sumbawa";
  }, []);

  function handleLoginClick(e) {
    if (onEnterDashboard) {
      e.preventDefault();
      onEnterDashboard();
    }
  }

  const SCOPE_ITEMS = [
    {
      id: "gambling",
      category: "Judi online",
      description:
        "Mencocokkan teks, judul, dan atribut dokumen halaman dengan daftar kata kunci promosi perjudian, taruhan daring, togel, dan slot.",
      method: "Pencocokan kata kunci",
    },
    {
      id: "pornography",
      category: "Pornografi",
      description:
        "Mencocokkan teks dan elemen dokumen halaman dengan daftar kata kunci dan istilah vulgar konten pornografi (analisis berbasis teks, tidak memproses citra atau video).",
      method: "Pencocokan kata kunci",
    },
    {
      id: "fraud",
      category: "Penipuan",
      description:
        "Mencocokkan teks halaman dengan pola klaim hadiah palsu, undian tanpa izin, bantuan dana fiktif, dan tawaran pinjaman online ilegal.",
      method: "Pencocokan kata kunci",
    },
    {
      id: "link",
      category: "Tautan atau elemen mencurigakan",
      description:
        "Memeriksa tautan keluar terhadap aturan anomali struktur URL, penggunaan alamat IP langsung, penyematan kredensial, dan domain berisiko.",
      method: "Aturan URL dan HTML",
    },
    {
      id: "defacement",
      category: "Perubahan halaman (indikasi defacement)",
      description:
        "Membandingkan nilai hash SHA-256 dan judul halaman terhadap data acuan baseline yang tersimpan, serta mendeteksi kata kunci umum peretasan.",
      method: "Perbandingan dengan kondisi acuan",
    },
  ];

  const WORKFLOW_STEPS = [
    {
      number: "01",
      title: "Penelusuran Halaman",
      description:
        "Perayap web (crawler) menelusuri halaman situs web OPD terdaftar dengan mematuhi batasan domain resmi dan berkas robots.txt.",
    },
    {
      number: "02",
      title: "Pemeriksaan",
      description:
        "Modul analisis memeriksa kecocokan pola kata kunci, mengekstrak tautan keluar, dan membandingkan struktur baseline secara simultan.",
    },
    {
      number: "03",
      title: "Hasil pada Dasbor",
      description:
        "Temuan dikelompokkan berdasarkan kategori indikasi dan tingkat kedalaman halaman pada antarmuka dasbor petugas CSIRT.",
    },
    {
      number: "04",
      title: "Laporan dan Notifikasi",
      description:
        "Sistem mengirimkan notifikasi email insiden serta menyediakan dokumen ekspor resmi berformat PDF dan CSV.",
    },
  ];

  return (
    <div className="pub-landing">
      {/* Aksesibilitas: Tautan Lewati ke Konten Utama */}
      <a href="#main-content" className="pub-skip-link">
        Lewati ke konten utama
      </a>

      {/* 1. Header (Sticky) */}
      <header className="pub-navbar">
        <div className="pub-container pub-navbar__inner">
          <div className="pub-navbar__brand">
            <BrandMark variant="full" className="pub-hide-mobile" />
            <BrandMark variant="compact" className="pub-show-mobile" />
          </div>

          <nav className="pub-nav-links pub-hide-mobile" aria-label="Navigasi Halaman">
            <a href="#fitur" className="pub-nav-link">
              Cakupan pemeriksaan
            </a>
            <a href="#alur-kerja" className="pub-nav-link">
              Cara kerja
            </a>
            <a href="#tentang" className="pub-nav-link">
              Catatan
            </a>
          </nav>

          <div className="pub-navbar__actions">
            <Button
              variant="primary"
              size="sm"
              icon={LogIn}
              as="a"
              href="#login"
              onClick={handleLoginClick}
            >
              Masuk
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* 2. Hero Section (Latar Surface Putih) */}
        <section className="pub-hero">
          <div className="pub-container pub-hero__grid">
            <div className="pub-hero__content">
              {/* Garis Aksen Emas Tipis (B4a) */}
              <div className="pub-hero__accent-line" aria-hidden="true" />
              <span className="pub-hero__label">
                Sistem Pemantauan Konten Negatif
              </span>
              <h1 className="pub-hero__title">
                Pemantauan dan Deteksi Indikasi Konten Negatif pada Situs Web Pemerintah Kabupaten Sumbawa
              </h1>
              <p className="pub-hero__desc">
                Menelusuri halaman situs web OPD, mencocokkan isi halaman dengan pola kata kunci terlarang, serta membandingkan struktur halaman dengan kondisi acuan baseline. Seluruh hasil berupa indikasi awal yang ditinjau oleh petugas CSIRT.
              </p>
              <div className="pub-hero__actions">
                <Button
                  variant="primary"
                  size="md"
                  as="a"
                  href="#login"
                  onClick={handleLoginClick}
                >
                  Masuk
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  as="a"
                  href="#fitur"
                >
                  Lihat cakupan pemeriksaan
                </Button>
              </div>
            </div>

            {/* Kartu Statis Hero Kanan: Ruang Lingkup Pemeriksaan (A4 & B5) */}
            <div className="pub-hero__card-col">
              <Card className="pub-hero-card">
                <div className="pub-hero-card__header">
                  <h2 className="pub-hero-card__heading">Ruang lingkup pemeriksaan</h2>
                </div>
                <div className="pub-hero-card__body">
                  <div className="pub-hero-scope-list">
                    <div className="pub-hero-scope-item">
                      <FileText size={16} className="pub-hero-scope-icon" aria-hidden="true" />
                      <span className="pub-hero-scope-text">Teks dan elemen HTML halaman</span>
                    </div>
                    <div className="pub-hero-scope-item">
                      <ExternalLink size={16} className="pub-hero-scope-icon" aria-hidden="true" />
                      <span className="pub-hero-scope-text">Tautan dan pengalihan</span>
                    </div>
                    <div className="pub-hero-scope-item">
                      <GitCompare size={16} className="pub-hero-scope-icon" aria-hidden="true" />
                      <span className="pub-hero-scope-text">Perubahan halaman terhadap kondisi acuan</span>
                    </div>
                  </div>
                  <div className="pub-hero-card__footer">
                    <span className="pub-hero-card__note">
                      Pemeriksaan berpedoman pada daftar pola dan aturan yang ditetapkan.
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 3. Cakupan Pemeriksaan (#fitur) — Latar Abu-abu (B4b) */}
        <section id="fitur" className="pub-section pub-section--grey">
          <div className="pub-container">
            <div className="pub-section__header">
              <h2 className="pub-section__title">Cakupan Pemeriksaan</h2>
              <p className="pub-section__desc">
                Sistem melakukan inspeksi otomatis terhadap lima kategori anomali dan potensi ancaman integritas situs web.
              </p>
            </div>

            <div className="pub-scope-wrap">
              <table className="pub-scope-table">
                <thead>
                  <tr>
                    <th className="pub-scope-col-cat">Kategori</th>
                    <th className="pub-scope-col-desc">Hal yang diperiksa</th>
                    <th className="pub-scope-col-method">Metode</th>
                  </tr>
                </thead>
                <tbody>
                  {SCOPE_ITEMS.map((item) => (
                    <tr key={item.id} className="pub-scope-row">
                      <td className="pub-scope-cell-cat">
                        <span className="pub-scope-cat-title">{item.category}</span>
                      </td>
                      <td className="pub-scope-cell-desc">
                        <p className="pub-scope-desc-text">{item.description}</p>
                      </td>
                      <td className="pub-scope-cell-method">
                        <span className="pub-scope-method-text">{item.method}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. Cara Kerja (#alur-kerja) — Latar Putih */}
        <section id="alur-kerja" className="pub-section">
          <div className="pub-container">
            <div className="pub-section__header">
              <h2 className="pub-section__title">Cara Kerja</h2>
              <p className="pub-section__desc">
                Tahapan pemeriksaan otomatis mulai dari perayapan hingga penyampaian laporan.
              </p>
            </div>

            <div className="pub-steps-grid">
              {WORKFLOW_STEPS.map((step) => (
                <div key={step.number} className="pub-step-item">
                  <div className="pub-step-number" aria-hidden="true">
                    {step.number}
                  </div>
                  <h3 className="pub-step-title">{step.title}</h3>
                  <p className="pub-step-desc">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Catatan (#tentang) — Latar Putih */}
        <section id="tentang" className="pub-section pub-section--bordered-top">
          <div className="pub-container">
            <div className="pub-section__header">
              <h2 className="pub-section__title">Catatan dan Batasan Sistem</h2>
              <p className="pub-section__desc">
                Informasi faktual mengenai batasan teknis dan kewenangan operasional sistem pemantauan.
              </p>
            </div>

            <Card className="pub-about-card">
              <ul className="pub-about-list">
                <li>
                  <strong>Hasil berupa indikasi:</strong> Seluruh temuan pemindaian merupakan indikasi teknis berdasarkan pencocokan pola dan aturan, bukan penetapan pelanggaran hukum.
                </li>
                <li>
                  <strong>Batasan deteksi pornografi:</strong> Pemeriksaan pornografi terbatas pada analisis kata kunci teks dan atribut dokumen HTML, tidak mencakup pengenalan gambar atau video (computer vision).
                </li>
                <li>
                  <strong>Batasan analisis tautan:</strong> Pemeriksaan tautan mencurigakan menganalisis karakteristik URL, domain, dan layanan pemendek tanpa menelusuri isi situs pihak ketiga.
                </li>
                <li>
                  <strong>Kewajiban tinjauan manual:</strong> Seluruh indikasi wajib ditinjau dan diverifikasi secara kontekstual oleh analis CSIRT sebelum langkah penanganan diambil.
                </li>
              </ul>

              <div className="pub-about-footer">
                <p className="pub-about-manager">
                  Sistem ini dikelola oleh <strong>Dinas Komunikasi, Informatika, Statistik dan Persandian Pemerintah Kabupaten Sumbawa</strong>.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  as="a"
                  href="#login"
                  onClick={handleLoginClick}
                >
                  Masuk ke Sistem
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* 6. Footer (Lengkap Sesuai A2) */}
      <footer className="pub-footer">
        <div className="pub-container pub-footer__grid">
          <div className="pub-footer__col-left">
            <BrandMark variant="full" />
            <p className="pub-footer__address">
              Jalan Garuda No. 1, Sumbawa Besar, Nusa Tenggara Barat
            </p>
            <p className="pub-footer__org">
              Dinas Komunikasi, Informatika, Statistik dan Persandian Pemerintah Kabupaten Sumbawa
            </p>
          </div>

          <div className="pub-footer__col-right">
            <p className="pub-footer__legal">
              &copy; {new Date().getFullYear()} Pemerintah Kabupaten Sumbawa &bull; Dinas Komunikasi, Informatika, Statistik dan Persandian. Hak cipta dilindungi undang-undang.
            </p>
            <p className="pub-footer__research">
              <strong>Prototipe Penelitian</strong> &mdash; Dikembangkan untuk mendukung CSIRT Kabupaten Sumbawa dalam pemantauan integritas dan deteksi dini insiden siber pada situs web instansi daerah. Seluruh hasil pemindaian bersifat indikasi awal yang memerlukan verifikasi analis.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
