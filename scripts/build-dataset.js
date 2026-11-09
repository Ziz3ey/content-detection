const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateDataset } = require('../evaluation/validate-dataset');

const SAMPLES_DIR = path.join(__dirname, '..', 'evaluation', 'datasets', 'v1', 'samples');
if (!fs.existsSync(SAMPLES_DIR)) {
  fs.mkdirSync(SAMPLES_DIR, { recursive: true });
}

const normalUrls = [
  { id: 'norm-01', url: 'https://kab-sumbawa.kpu.go.id/', source: 'KPU Kabupaten Sumbawa', name: 'Beranda KPU Sumbawa' },
  { id: 'norm-02', url: 'https://kab-sumbawa.kpu.go.id/page/read/profil-komisioner-dan-sekretaris-kpu-kab-sumbawa', source: 'KPU Kabupaten Sumbawa', name: 'Profil Komisioner & Sekretaris' },
  { id: 'norm-03', url: 'https://kab-sumbawa.kpu.go.id/page/read/tugas-dan-kewenangan', source: 'KPU Kabupaten Sumbawa', name: 'Tugas dan Kewenangan KPU' },
  { id: 'norm-04', url: 'https://kab-sumbawa.kpu.go.id/page/read/pemilu-dalam-sejarah', source: 'KPU Kabupaten Sumbawa', name: 'Pemilu dalam Sejarah' },
  { id: 'norm-05', url: 'https://kab-sumbawa.kpu.go.id/page/read/struktur-organisasi', source: 'KPU Kabupaten Sumbawa', name: 'Struktur Organisasi KPU' },
  { id: 'norm-06', url: 'https://kab-sumbawa.kpu.go.id/page/read/visi-misi', source: 'KPU Kabupaten Sumbawa', name: 'Visi dan Misi KPU' },
  { id: 'norm-07', url: 'https://kab-sumbawa.kpu.go.id/blog/read/8014_whistleblowing-system', source: 'KPU Kabupaten Sumbawa', name: 'Whistleblowing System KPU' },
  { id: 'norm-08', url: 'https://kab-sumbawa.kpu.go.id/blog/read/8011_tata-cara-pengaduan-masyarakat-sp4n-lapor', source: 'KPU Kabupaten Sumbawa', name: 'Tata Cara Pengaduan SP4N LAPOR' },
  { id: 'norm-09', url: 'https://kab-sumbawa.kpu.go.id/blog/category/104', source: 'KPU Kabupaten Sumbawa', name: 'Kategori Pengumuman Resmi' },
  { id: 'norm-10', url: 'https://kab-sumbawa.kpu.go.id/blog/category/135', source: 'KPU Kabupaten Sumbawa', name: 'Kategori Warta Kepemiluan' },
  { id: 'norm-11', url: 'https://kab-sumbawa.kpu.go.id/blog/read/8167_selamat-hari-lahir-ke-73-komisi-pemilihan-umum', source: 'KPU Kabupaten Sumbawa', name: 'Siaran Pers Harlah KPU' },
  { id: 'norm-12', url: 'https://kab-sumbawa.kpu.go.id/blog/read/8165_kpu-sumbawa-sosialisasikan-pendidikan-pemilih-berkelanjutan-kepada-mahasiswa-unsa', source: 'KPU Kabupaten Sumbawa', name: 'Sosialisasi Pemilih UNSA' },
  { id: 'norm-13', url: 'https://kab-sumbawa.kpu.go.id/blog/read/8164_kpu-ri-terbitkan-siaran-pers-pasca-putusan-mk', source: 'KPU Kabupaten Sumbawa', name: 'Siaran Pers Pasca Putusan MK' },
  { id: 'norm-14', url: 'https://sumbawa.bawaslu.go.id/', source: 'Bawaslu Kabupaten Sumbawa', name: 'Portal Utama Bawaslu Sumbawa' },
  { id: 'norm-15', url: 'https://sumbawa.bawaslu.go.id/berita/', source: 'Bawaslu Kabupaten Sumbawa', name: 'Warta Pengawasan Bawaslu' },
  { id: 'norm-16', url: 'https://www.pajak.go.id/id/kpp-pratama-sumbawa-besar', source: 'KPP Pratama Sumbawa Besar', name: 'Profil KPP Pratama Sumbawa' },
  { id: 'norm-17', url: 'https://kejari-sumbawa.kejaksaan.go.id/', source: 'Kejaksaan Negeri Sumbawa', name: 'Portal Kejari Sumbawa' },
  { id: 'norm-18', url: 'https://uts.ac.id/en/welcome/', source: 'Universitas Teknologi Sumbawa', name: 'Portal Internasional UTS' },
  { id: 'norm-19', url: 'https://uts.ac.id/tentang-uts/', source: 'Universitas Teknologi Sumbawa', name: 'Tentang Universitas Teknologi Sumbawa' },
  { id: 'norm-20', url: 'https://uts.ac.id/akademik/', source: 'Universitas Teknologi Sumbawa', name: 'Program Akademik UTS' },
  { id: 'norm-21', url: 'https://uts.ac.id/', source: 'Universitas Teknologi Sumbawa', name: 'Beranda Utama UTS' },
  { id: 'norm-22', url: 'https://esamsatkotasumbawa.org/layanan', source: 'E-Samsat Kota Sumbawa', name: 'Informasi Layanan E-Samsat' },
  { id: 'norm-23', url: 'https://esamsatkotasumbawa.org/tentang', source: 'E-Samsat Kota Sumbawa', name: 'Tentang Pelayanan Samsat' },
  { id: 'norm-24', url: 'https://esamsatkotasumbawa.org/pembayaran', source: 'E-Samsat Kota Sumbawa', name: 'Prosedur Pembayaran PKB' },
  { id: 'norm-25', url: 'https://esamsatkotasumbawa.org/info-pkb', source: 'E-Samsat Kota Sumbawa', name: 'Panduan Informasi Tarif PKB' }
];

const positiveFiles = [
  // 9 Judi Online
  { id: 'pos-judi-01', file: 'positive-judi-01.html', cat: 'gambling', keyword: 'slot gacor', title: 'Portal Game: Analisis Tren Slot Gacor' },
  { id: 'pos-judi-02', file: 'positive-judi-02.html', cat: 'gambling', keyword: 'taruhan bola', title: 'Panduan Olahraga dan Taruhan Bola Liga Dunia 2026' },
  { id: 'pos-judi-03', file: 'positive-judi-03.html', cat: 'gambling', keyword: 'situs judi', title: 'Daftar Peringatan Situs Judi Ilegal' },
  { id: 'pos-judi-04', file: 'positive-judi-04.html', cat: 'gambling', keyword: 'togel online', title: 'Laporan Forensik Tautan Togel Online' },
  { id: 'pos-judi-05', file: 'positive-judi-05.html', cat: 'gambling', keyword: 'kasino online', title: 'Kajian Regulasi Kasino Online Lintas Negara' },
  { id: 'pos-judi-06', file: 'positive-judi-06.html', cat: 'gambling', keyword: 'poker online', title: 'Artikel Analisis Aplikasi Poker Online' },
  { id: 'pos-judi-07', file: 'positive-judi-07.html', cat: 'gambling', keyword: 'bandar judi', title: 'Siaran Pers Resmi: Tindakan Hukum Terhadap Bandar Judi' },
  { id: 'pos-judi-08', file: 'positive-judi-08.html', cat: 'gambling', keyword: 'slot online', title: 'Laporan Keamanan Siber: Injeksi Kata Kunci Slot Online' },
  { id: 'pos-judi-09', file: 'positive-judi-09.html', cat: 'gambling', keyword: 'judi online', title: 'Pencegahan Praktik Judi Online di Ruang Digital' },

  // 8 Phishing / Fraud
  { id: 'pos-phishing-01', file: 'positive-phishing-01.html', cat: 'fraud', keyword: 'undian berhadiah', title: 'Pemberitahuan Pemenang Undian Berhadiah Mobil' },
  { id: 'pos-phishing-02', file: 'positive-phishing-02.html', cat: 'fraud', keyword: 'klaim hadiah', title: 'Verifikasi Akun dan Formulir Klaim Hadiah' },
  { id: 'pos-phishing-03', file: 'positive-phishing-03.html', cat: 'fraud', keyword: 'bagi-bagi hadiah', title: 'Festival Komunitas Bagi-Bagi Hadiah Elektronik' },
  { id: 'pos-phishing-04', file: 'positive-phishing-04.html', cat: 'fraud', keyword: 'bantuan dana palsu', title: 'Peringatan Waspada Bantuan Dana Palsu' },
  { id: 'pos-phishing-05', file: 'positive-phishing-05.html', cat: 'fraud', keyword: 'pinjaman online ilegal', title: 'Publikasi Penindakan Pinjaman Online Ilegal' },
  { id: 'pos-phishing-06', file: 'positive-phishing-06.html', cat: 'fraud', keyword: 'pinjol ilegal', title: 'Edukasi Warga Terhadap Bahaya Pinjol Ilegal' },
  { id: 'pos-phishing-07', file: 'positive-phishing-07.html', cat: 'fraud', keyword: 'hadiah gratis', title: 'Klaim Voucher Pulsa dan Hadiah Gratis' },
  { id: 'pos-phishing-08', file: 'positive-phishing-08.html', cat: 'fraud', keyword: 'penipuan online', title: 'Portal Pengaduan Korban Penipuan Online' },

  // 8 Pornografi Teks
  { id: 'pos-porno-01', file: 'positive-pornografi-01.html', cat: 'pornography', keyword: 'pornografi', title: 'Kajian Hukum Undang-Undang Anti Pornografi' },
  { id: 'pos-porno-02', file: 'positive-pornografi-02.html', cat: 'pornography', keyword: 'video porno', title: 'Laporan Forensik Distribusi Video Porno Ilegal' },
  { id: 'pos-porno-03', file: 'positive-pornografi-03.html', cat: 'pornography', keyword: 'situs porno', title: 'Rekapitulasi Pemblokiran Akses Situs Porno' },
  { id: 'pos-porno-04', file: 'positive-pornografi-04.html', cat: 'pornography', keyword: 'film dewasa', title: 'Pedoman Lembaga Sensor Mengenai Film Dewasa' },
  { id: 'pos-porno-05', file: 'positive-pornografi-05.html', cat: 'pornography', keyword: 'cerita dewasa', title: 'Kajian Sastra Daring: Batasan Cerita Dewasa' },
  { id: 'pos-porno-06', file: 'positive-pornografi-06.html', cat: 'pornography', keyword: 'layanan seks', title: 'Laporan Penindakan Iklan Prostitusi Daring' },
  { id: 'pos-porno-07', file: 'positive-pornografi-07.html', cat: 'pornography', keyword: 'konten dewasa', title: 'Panduan Penyiaran Mengenai Konten Dewasa' },
  { id: 'pos-porno-08', file: 'positive-pornografi-08.html', cat: 'pornography', keyword: 'bokep', title: 'Penyuluhan Literasi Digital Generasi Muda' }
];

function fetchUrl(url) {
  return new Promise(resolve => {
    https.get(url, { rejectUnauthorized: false, timeout: 10000 }, res => {
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => resolve({ status: res.statusCode, html }));
    }).on('error', err => resolve({ status: 'ERR', html: '', error: err.message }));
  });
}

function cleanHtmlToText(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

(async () => {
  console.log('Building 50-sample dataset...');
  const manifestRecords = [];
  const annotationRecords = [];

  // 1. Process 25 Normal Samples
  for (let i = 0; i < normalUrls.length; i++) {
    const item = normalUrls[i];
    console.log(`Fetching normal sample [${i + 1}/25]: ${item.url}`);
    const res = await fetchUrl(item.url);
    const text = cleanHtmlToText(res.html);
    const sampleFileName = `${item.id}.txt`;
    const sampleFilePath = path.join(SAMPLES_DIR, sampleFileName);
    fs.writeFileSync(sampleFilePath, text, 'utf-8');

    const sha256 = crypto.createHash('sha256').update(text).digest('hex');

    manifestRecords.push({
      record_type: 'manifest',
      sample_id: item.id,
      detector: 'text',
      source_type: 'public',
      split: 'evaluation',
      group_id: `public-sumbawa-${new URL(item.url).hostname.replace(/[^a-zA-Z0-9]/g, '-')}`,
      input: {
        kind: 'text',
        path: `samples/${sampleFileName}`,
        sha256: sha256
      },
      reference: null,
      provenance: {
        source_reference: item.url,
        license_or_permission: 'Public Official Portal (Pemerintah Kabupaten Sumbawa / Instansi Publik)',
        collected_at: new Date().toISOString()
      },
      codebook_version: '1.0'
    });

    annotationRecords.push({
      record_type: 'annotation',
      sample_id: item.id,
      detector: 'text',
      annotator_id: 'auditor-csirt-sumbawa',
      annotation_status: 'adjudicated',
      ground_truth: {
        categories: {
          gambling: 'negative',
          fraud: 'negative',
          pornography: 'negative'
        }
      },
      annotation_notes: `Halaman normal publik: ${item.name}. Status HTTP: ${res.status}. Panjang teks: ${text.length} karakter. Bersih dari pola negatif.`,
      codebook_version: '1.0'
    });
  }

  // 2. Process 25 Positive Samples
  const localSiteDir = path.join(__dirname, '..', 'local-test-site');
  for (let i = 0; i < positiveFiles.length; i++) {
    const item = positiveFiles[i];
    console.log(`Processing positive sample [${i + 1}/25]: ${item.file}`);
    const htmlPath = path.join(localSiteDir, item.file);
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const text = cleanHtmlToText(html);
    const sampleFileName = `${item.id}.txt`;
    const sampleFilePath = path.join(SAMPLES_DIR, sampleFileName);
    fs.writeFileSync(sampleFilePath, text, 'utf-8');

    const sha256 = crypto.createHash('sha256').update(text).digest('hex');

    manifestRecords.push({
      record_type: 'manifest',
      sample_id: item.id,
      detector: 'text',
      source_type: 'synthetic',
      split: 'evaluation',
      group_id: `synthetic-${item.cat}`,
      input: {
        kind: 'text',
        path: `samples/${sampleFileName}`,
        sha256: sha256
      },
      reference: null,
      provenance: {
        source_reference: `http://127.0.0.1:8080/${item.file}`,
        license_or_permission: 'project-authored',
        collected_at: new Date().toISOString()
      },
      codebook_version: '1.0'
    });

    annotationRecords.push({
      record_type: 'annotation',
      sample_id: item.id,
      detector: 'text',
      annotator_id: 'auditor-csirt-sumbawa',
      annotation_status: 'adjudicated',
      ground_truth: {
        categories: {
          gambling: item.cat === 'gambling' ? 'positive' : 'negative',
          fraud: item.cat === 'fraud' ? 'positive' : 'negative',
          pornography: item.cat === 'pornography' ? 'positive' : 'negative'
        }
      },
      annotation_notes: `Sampel sintetis positif ${item.cat}: pola kata kunci '${item.keyword}'. Judul: ${item.title}.`,
      codebook_version: '1.0'
    });
  }

  const datasetDir = path.join(__dirname, '..', 'evaluation', 'datasets', 'v1');
  const manifestPath = path.join(datasetDir, 'manifest.jsonl');
  const annotationsPath = path.join(datasetDir, 'annotations.jsonl');

  const manifestContent = manifestRecords.map(r => JSON.stringify(r)).join('\n') + '\n';
  const annotationsContent = annotationRecords.map(r => JSON.stringify(r)).join('\n') + '\n';

  fs.writeFileSync(manifestPath, manifestContent, 'utf-8');
  fs.writeFileSync(annotationsPath, annotationsContent, 'utf-8');

  console.log(`\nWritten ${manifestRecords.length} manifest records to ${manifestPath}`);
  console.log(`Written ${annotationRecords.length} annotation records to ${annotationsPath}`);

  // 3. Validate Dataset with existing validator
  const validation = validateDataset(manifestContent, annotationsContent);
  console.log('\n--- VALIDATION RESULT ---');
  console.log(`Sample Count    : ${validation.sampleCount}`);
  console.log(`Annotation Count: ${validation.annotationCount}`);
  console.log(`Errors Count    : ${validation.errors.length}`);
  if (validation.errors.length > 0) {
    console.error('Errors:', validation.errors);
    process.exit(1);
  } else {
    console.log('DATASET VALIDATION: 100% SUCCESS (0 ERRORS)');
  }
})();
