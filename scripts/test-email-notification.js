#!/usr/bin/env node

/**
 * Skrip Pengujian Notifikasi Email Sistem Pemantauan Konten Negatif
 * Pemerintah Kabupaten Sumbawa
 *
 * Penggunaan:
 *   1. Uji Nyata (Real SMTP):
 *      npm run test:email
 *
 *   2. Uji Simulasi (Mock Transport):
 *      npm run test:email:mock
 */

const fs = require("node:fs");
const path = require("node:path");

let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch {
  nodemailer = require("../services/aggregator-service/node_modules/nodemailer");
}

const {
  buildScanAlertEmail,
  summarizeScanFindings,
} = require("../services/aggregator-service/src/services/email-template");
const {
  loadAggregatorConfig,
  loadAggregatorEnv,
} = require("../services/aggregator-service/src/config/aggregator-config");

// Tentukan path absolut ke file .env aggregator
const envPath = path.resolve(__dirname, "../services/aggregator-service/.env");

// Muat variabel .env dengan override: true agar tidak tertimpa nilai kosong/whitespace dari shell
if (fs.existsSync(envPath)) {
  loadAggregatorEnv(envPath, process.env, { override: true });
}

const isTestRunner = Boolean(process.env.NODE_TEST_CONTEXT);
const isMock = process.argv.includes("--mock") || isTestRunner;
const config = loadAggregatorConfig(process.env);
const smtp = config.smtp;

console.log("==================================================================");
console.log(" PENGUJIAN FITUR NOTIFIKASI EMAIL KONTEN NEGATIF");
console.log(" PEMERINTAH KABUPATEN SUMBAWA");
console.log("==================================================================\n");

// Contoh data deteksi nyata (Sample Scan Finding)
const sampleDetectionRecords = [
  {
    id: "scan-sample-sumbawa-01",
    url: "https://sumbawakab.go.id/layanan/pengumuman",
    title: "Portal Pengumuman Resmi Pemkab Sumbawa",
    scannedAt: new Date().toISOString(),
    scanSource: "MANUAL",
    textDetectionStatus: "success",
    textDetection: {
      success: true,
      data: {
        detected: true,
        categories: [
          {
            category: "gambling",
            matches: [
              { pattern: "slot gacor", start: 120, end: 130 },
              { pattern: "judi online resmi", start: 145, end: 162 },
            ],
          },
        ],
      },
    },
    defacementDetectionStatus: "skipped",
    defacementDetection: null,
    linkDetectionStatus: "success",
    linkDetection: {
      success: true,
      data: {
        detected: true,
        links: [
          {
            url: "http://185.220.101.5/login-portal",
            detected: true,
            indicators: [
              {
                type: "ip_hostname",
                description: "Tautan mencurigakan menggunakan alamat IP mentah publik",
              },
            ],
          },
        ],
      },
    },
  },
];

const summary = summarizeScanFindings(sampleDetectionRecords);
const email = buildScanAlertEmail({
  siteName: "Portal Resmi Pemerintah Kabupaten Sumbawa",
  startUrl: "https://sumbawakab.go.id",
  scannedAt: sampleDetectionRecords[0].scannedAt,
  scanSource: "MANUAL",
  summary,
});

console.log("[1] Analisis Temuan Sample:");
console.log(`    - Has Indication  : ${summary.hasIndication}`);
console.log(`    - Total Temuan    : ${summary.totalFindings} indikasi`);
console.log(`    - Kategori        : ${JSON.stringify(summary.categoryCounts)}`);
console.log(`    - Subjek Email    : ${email.subject}\n`);

if (isMock) {
  console.log("[2] Mode: SIMULASI MOCK TRANSPORT (--mock aktif)");
  console.log("------------------------------------------------------------------");
  console.log("Pratinjau Plain Text Email:\n");
  console.log(email.text);
  console.log("------------------------------------------------------------------");
  console.log("\n[OK] Format email berhasil divalidasi. Siap dikirim melalui SMTP.");
  process.exit(0);
}

// Verifikasi Konfigurasi SMTP
console.log("[2] Verifikasi Konfigurasi SMTP (.env):");
console.log(`    - Lokasi File  : ${envPath}`);
console.log(`    - SMTP_HOST    : ${smtp.host || "(belum diisi)"}`);
console.log(`    - SMTP_PORT    : ${smtp.port}`);
console.log(`    - SMTP_SECURE  : ${smtp.secure}`);
console.log(`    - SMTP_USER    : ${smtp.user || "(belum diisi)"}`);
console.log(`    - SMTP_PASS    : ${smtp.pass ? `****** (Tersedia, panjang: ${smtp.pass.length} karakter)` : "(belum diisi)"}`);
console.log(`    - EMAIL_FROM   : ${smtp.from || "(belum diisi)"}`);
console.log(`    - EMAIL_TO     : ${smtp.to || "(belum diisi)"}`);
console.log("------------------------------------------------------------------");

if (smtp.isConfigured) {
  console.log(" STATUS: SMTP CONFIGURATION: COMPLETE");
} else {
  console.log(" STATUS: SMTP CONFIGURATION: INCOMPLETE");
  console.log(` Variabel yang belum diisi: ${(smtp.missing || []).join(", ")}`);
}
console.log("------------------------------------------------------------------\n");

if (!smtp.isConfigured) {
  console.log("PERHATIAN: Konfigurasi SMTP belum lengkap di file .env.");
  console.log(`Silakan lengkapi variabel berikut: ${(smtp.missing || []).join(", ")}`);
  console.log("File konfigurasi: " + envPath);
  process.exit(1);
}

// Jika konfigurasi lengkap, lakukan koneksi dan pengujian pengiriman email sungguhan
console.log("[3] Melakukan Koneksi ke SMTP Server & Menguji Autentikasi...");

const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: smtp.port,
  secure: smtp.secure,
  auth: {
    user: smtp.user,
    pass: smtp.pass,
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

transporter
  .verify()
  .then(() => {
    console.log("    [OK] Koneksi SMTP dan autentikasi berhasil diverifikasi!");
    console.log("\n[4] Mengirim Email Pengujian ke " + smtp.to + "...");
    return transporter.sendMail({
      from: smtp.from || smtp.user,
      to: smtp.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  })
  .then((info) => {
    console.log("\n==================================================================");
    console.log(" [SUKSES] EMAIL PENGUJIAN BERHASIL DIKIRIM KE SERVER TUJUAN!");
    console.log("==================================================================");
    console.log(`  Penerima        : ${smtp.to}`);
    console.log(`  Message ID      : ${info.messageId}`);
    console.log(`  Server Response : ${info.response}`);
    console.log("==================================================================");
    console.log("\nPEMBERITAHUAN:");
    console.log("Silakan periksa kotak masuk (Inbox) atau folder Spam pada:");
    console.log(`  ${smtp.to}`);
    console.log("untuk memastikan email telah berhasil diterima oleh penyedia email.");
    console.log("==================================================================\n");
  })
  .catch((err) => {
    console.error("\n==================================================================");
    console.error(" [GAGAL] PENGIRIMAN EMAIL GAGAL");
    console.error("==================================================================");
    console.error(`  Pesan Error : ${err.message}`);
    console.error(`  Kode Error  : ${err.code || "N/A"}`);

    if (err.code === "EAUTH" || (err.message && err.message.includes("535"))) {
      console.error("\n  Penyebab : Autentikasi ditolak oleh server Gmail (Error 535-5.7.8).");
      console.error("             Kata sandi akun Google biasa TIDAK dapat digunakan untuk SMTP.");
      console.error("\n  PANDUAN PENYELESAIAN (Google App Password):");
      console.error("  1. Buka Akun Google -> Keamanan -> Verifikasi 2 Langkah (Aktifkan).");
      console.error("  2. Buka tautan: https://myaccount.google.com/apppasswords");
      console.error("  3. Buat Sandi Aplikasi baru (misal: 'Content Detection Sumbawa').");
      console.error("  4. Salin 16 karakter Sandi Aplikasi yang dihasilkan (tanpa spasi).");
      console.error("  5. Simpan 16 karakter tersebut pada SMTP_PASS di file:");
      console.error(`     ${envPath}`);
      console.error("  6. Jalankan kembali perintah: npm run test:email");
    }
    console.error("==================================================================\n");
    process.exit(1);
  });
