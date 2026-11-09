const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const { createDataAccess } = require("content-detection-data-access");
const { createNotificationService } = require("../src/services/notification-service");
const { createScanService } = require("../src/services/scan-service");
const { createApp } = require("../src/app");
const { loadAggregatorConfig } = require("../src/config/aggregator-config");

let tempDir;
let dbPath;
let dataAccess;
let sentMails = [];

function createMockTransporter(fail = false, errorMessage = "SMTP connection refused") {
  return {
    sendMail: async (mailOptions) => {
      if (fail) {
        throw new Error(errorMessage);
      }
      sentMails.push(mailOptions);
      return { messageId: `<mock-${Date.now()}@sumbawakab.go.id>` };
    },
  };
}

const mockConfig = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  user: "diskominfo.sumbawa@gmail.com",
  pass: "mock-app-password",
  from: '"Pemkab Sumbawa Security" <diskominfo.sumbawa@gmail.com>',
  to: "admin@sumbawakab.go.id",
  isConfigured: true,
};

function sampleScanRecord(overrides = {}) {
  const id = overrides.id || `scan-${Math.random().toString(36).substring(2, 9)}`;
  return {
    id,
    url: overrides.url || "https://sumbawakab.go.id/portal",
    scannedAt: overrides.scannedAt || new Date().toISOString(),
    crawlStatus: "success",
    httpStatus: 200,
    contentType: "text/html",
    title: "Portal Resmi Pemerintah Kabupaten Sumbawa",
    crawlMetadata: { depth: 0, links: [] },
    scanSource: "MANUAL",
    textDetectionStatus: "success",
    textDetection: {
      success: true,
      data: { detected: false, categories: [] },
    },
    defacementDetectionStatus: "skipped",
    defacementDetection: null,
    linkDetectionStatus: "success",
    linkDetection: {
      success: true,
      data: { detected: false, links: [] },
    },
    ...overrides,
  };
}

before(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aggregator-notification-test-"));
  dbPath = path.join(tempDir, "test-notification.sqlite");
  dataAccess = createDataAccess(dbPath);
});

beforeEach(() => {
  dataAccess.database.exec("DELETE FROM notifications");
  dataAccess.database.exec("DELETE FROM scans");
  dataAccess.database.exec("DELETE FROM sites");
  sentMails = [];
});

after(() => {
  dataAccess.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// SKENARIO 1: Sistem menemukan indikasi judi online
test("Skenario 1: Mengirim email peringatan ketika sistem mendeteksi indikasi judi online", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [
            {
              category: "gambling",
              matches: [
                { pattern: "slot gacor", start: 10, end: 20 },
                { pattern: "judi togel", start: 25, end: 35 },
              ],
            },
          ],
        },
      },
    }),
  );

  const mockTransporter = createMockTransporter();
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: mockTransporter,
  });

  const result = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });

  assert.equal(result.notified, true);
  assert.equal(result.status, "sent");
  assert.equal(sentMails.length, 1);
  assert.ok(sentMails[0].subject.includes("[PERINGATAN]"));
  assert.ok(sentMails[0].html.includes("Judi Online (Gambling)"));
  assert.ok(sentMails[0].html.includes("slot gacor"));
  assert.ok(sentMails[0].html.includes("judi togel"));
  assert.ok(sentMails[0].text.includes("slot gacor"));

  // Status tersimpan di SQLite
  const notif = dataAccess.notifications.findByScanId(scan.id);
  assert.equal(notif.status, "sent");
  assert.equal(notif.recipient, mockConfig.to);
  assert.ok(notif.sentAt !== null);
});

// SKENARIO 2: Sistem menemukan indikasi pornografi berbasis teks/HTML
test("Skenario 2: Mengirim email peringatan ketika sistem mendeteksi indikasi pornografi", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [
            {
              category: "pornography",
              matches: [{ pattern: "video bokep", start: 5, end: 16 }],
            },
          ],
        },
      },
    }),
  );

  const mockTransporter = createMockTransporter();
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: mockTransporter,
  });

  const result = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });

  assert.equal(result.notified, true);
  assert.equal(sentMails.length, 1);
  assert.ok(sentMails[0].html.includes("Pornografi"));
  assert.ok(sentMails[0].html.includes("video bokep"));
  assert.ok(sentMails[0].text.includes("video bokep"));

  const notif = dataAccess.notifications.findByScanId(scan.id);
  assert.equal(notif.status, "sent");
});

// SKENARIO 3: Sistem menemukan indikasi penipuan atau phishing
test("Skenario 3: Mengirim email peringatan ketika sistem mendeteksi indikasi penipuan / phishing", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [
            {
              category: "fraud",
              matches: [{ pattern: "klaim hadiah uang tunai", start: 0, end: 23 }],
            },
          ],
        },
      },
    }),
  );

  const mockTransporter = createMockTransporter();
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: mockTransporter,
  });

  const result = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });

  assert.equal(result.notified, true);
  assert.equal(sentMails.length, 1);
  assert.ok(sentMails[0].html.includes("Penipuan / Phishing (Fraud)"));
  assert.ok(sentMails[0].html.includes("klaim hadiah uang tunai"));

  const notif = dataAccess.notifications.findByScanId(scan.id);
  assert.equal(notif.status, "sent");
});

// SKENARIO 4: Sistem menemukan tautan mencurigakan
test("Skenario 4: Mengirim email peringatan ketika sistem mendeteksi tautan mencurigakan", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      linkDetection: {
        success: true,
        data: {
          detected: true,
          links: [
            {
              url: "http://192.168.1.100/phish",
              detected: true,
              indicators: [
                {
                  type: "ip_hostname",
                  description: "Tautan menggunakan alamat IP mentah alih-alih domain resmi",
                },
              ],
            },
          ],
        },
      },
    }),
  );

  const mockTransporter = createMockTransporter();
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: mockTransporter,
  });

  const result = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });

  assert.equal(result.notified, true);
  assert.equal(sentMails.length, 1);
  assert.ok(sentMails[0].html.includes("Tautan Mencurigakan"));
  assert.ok(sentMails[0].html.includes("http://192.168.1.100/phish"));
  assert.ok(sentMails[0].html.includes("ip_hostname"));

  const notif = dataAccess.notifications.findByScanId(scan.id);
  assert.equal(notif.status, "sent");
});

// SKENARIO 5: Sistem menemukan defacement
test("Skenario 5: Mengirim email peringatan ketika sistem mendeteksi indikasi defacement", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      defacementDetectionStatus: "success",
      defacementDetection: {
        success: true,
        data: {
          detected: true,
          indicators: [
            {
              type: "title_changed",
              description: "Judul halaman telah dimodifikasi secara drastis dari baseline",
            },
          ],
        },
      },
    }),
  );

  const mockTransporter = createMockTransporter();
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: mockTransporter,
  });

  const result = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });

  assert.equal(result.notified, true);
  assert.equal(sentMails.length, 1);
  assert.ok(sentMails[0].html.includes("Perubahan Halaman Tidak Sah (Defacement)"));
  assert.ok(sentMails[0].html.includes("title_changed"));

  const notif = dataAccess.notifications.findByScanId(scan.id);
  assert.equal(notif.status, "sent");
});

// SKENARIO 6: Sistem tidak menemukan indikasi (email TIDAK dikirim)
test("Skenario 6: Tidak mengirim email apabila tidak ditemukan indikasi konten negatif", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      textDetection: { success: true, data: { detected: false, categories: [] } },
      defacementDetectionStatus: "success",
      defacementDetection: { success: true, data: { detected: false, indicators: [] } },
      linkDetection: { success: true, data: { detected: false, links: [] } },
    }),
  );

  const mockTransporter = createMockTransporter();
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: mockTransporter,
  });

  const result = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });

  assert.equal(result.notified, false);
  assert.equal(result.reason, "NO_INDICATIONS");
  assert.equal(sentMails.length, 0); // Pastikan transporter tidak dipanggil
  assert.equal(dataAccess.notifications.findByScanId(scan.id), null);
});

// SKENARIO 7: SMTP tidak dikonfigurasi
test("Skenario 7: Mencatat status not_configured saat konfigurasi SMTP belum lengkap", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [{ category: "gambling", matches: [{ pattern: "slot" }] }],
        },
      },
    }),
  );

  const unconfiguredConfig = {
    ...mockConfig,
    user: "",
    pass: "",
    isConfigured: false,
  };

  const service = createNotificationService({
    config: unconfiguredConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: null,
  });

  const result = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });

  assert.equal(result.notified, false);
  assert.equal(result.status, "not_configured");
  assert.equal(sentMails.length, 0);

  const notif = dataAccess.notifications.findByScanId(scan.id);
  assert.notEqual(notif, null);
  assert.equal(notif.status, "not_configured");
  assert.ok(notif.errorMessage.includes("SMTP"));
});

// SKENARIO 8: SMTP mengalami kegagalan
test("Skenario 8: Mencatat status failed saat pengiriman SMTP mengalami kegagalan", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [{ category: "gambling", matches: [{ pattern: "slot" }] }],
        },
      },
    }),
  );

  const failingTransporter = createMockTransporter(true, "SMTP connection timeout to 127.0.0.1:587");
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: failingTransporter,
  });

  const result = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });

  assert.equal(result.notified, false);
  assert.equal(result.status, "failed");
  assert.ok(result.error.includes("timeout"));

  const notif = dataAccess.notifications.findByScanId(scan.id);
  assert.equal(notif.status, "failed");
  assert.ok(notif.errorMessage.includes("timeout"));
});

// SKENARIO 9: Email berhasil dikirim
test("Skenario 9: Email berhasil dikirim dengan transport dan alamat penerima yang sesuai", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [{ category: "fraud", matches: [{ pattern: "penipuan undian" }] }],
        },
      },
    }),
  );

  const mockTransporter = createMockTransporter();
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: mockTransporter,
  });

  const result = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });

  assert.equal(result.notified, true);
  assert.equal(result.status, "sent");
  assert.equal(result.recipient, "admin@sumbawakab.go.id");
  assert.equal(sentMails.length, 1);
  assert.equal(sentMails[0].to, "admin@sumbawakab.go.id");
  assert.ok(sentMails[0].from.includes("Pemkab Sumbawa Security"));
});

// SKENARIO 10: Hasil pemindaian tetap tersimpan ketika email gagal
test("Skenario 10: Hasil pemindaian tetap tersimpan utuh di database SQLite meskipun pengiriman email gagal", async () => {
  const failingTransporter = createMockTransporter(true, "Autentikasi SMTP gagal (App Password salah)");

  const notificationService = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: failingTransporter,
  });

  const mockCrawler = {
    crawl: async () => ({
      data: {
        pages: [
          {
            url: "https://sumbawakab.go.id/halaman-uji",
            status: 200,
            contentType: "text/html",
            title: "Uji Kegagalan Notifikasi",
            depth: 0,
            success: true,
            text: "konten dengan kata kunci slot",
            html: "<p>konten dengan kata kunci slot</p>",
            links: [],
          },
        ],
      },
    }),
  };

  const mockAnalyze = async () => ({
    textDetection: {
      success: true,
      data: {
        detected: true,
        categories: [{ category: "gambling", matches: [{ pattern: "slot", start: 23, end: 27 }] }],
      },
    },
    defacementDetection: { success: true, data: { detected: false, indicators: [] } },
    linkDetection: { success: true, data: { detected: false, links: [] } },
  });

  const scan = createScanService({
    crawlerClient: mockCrawler,
    analyze: mockAnalyze,
    scans: dataAccess.scans,
    notificationService,
  });

  // Pemindaian harus selesai dan mengembalikan data tanpa throw error
  const scanResult = await scan({
    crawler: { startUrl: "https://sumbawakab.go.id/halaman-uji" },
    baselinesByUrl: {},
    scanSource: "MANUAL",
  });

  assert.equal(scanResult.pages.length, 1);
  const pageId = scanResult.pages[0].id;

  // Pastikan record pemindaian tersimpan dengan benar di tabel scans
  const savedScan = dataAccess.scans.findById(pageId);
  assert.notEqual(savedScan, null);
  assert.equal(savedScan.url, "https://sumbawakab.go.id/halaman-uji");
  assert.equal(savedScan.textDetectionStatus, "success");
  assert.equal(savedScan.textDetection.data.detected, true);

  // Pastikan status notifikasi tercatat sebagai failed tanpa merusak scan
  const notif = dataAccess.notifications.findByScanId(pageId);
  assert.notEqual(notif, null);
  assert.equal(notif.status, "failed");
  assert.ok(notif.errorMessage.includes("Autentikasi SMTP gagal"));
});

// SKENARIO 11: Tidak terjadi pengiriman email duplikat (Idempotensi)
test("Skenario 11: Mencegah pengiriman email duplikat untuk hasil scan yang sama", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [{ category: "gambling", matches: [{ pattern: "slot" }] }],
        },
      },
    }),
  );

  const mockTransporter = createMockTransporter();
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: mockTransporter,
  });

  // Pengiriman pertama
  const res1 = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });
  assert.equal(res1.notified, true);
  assert.equal(sentMails.length, 1);

  // Pengiriman kedua untuk scan yang sama
  const res2 = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });
  assert.equal(res2.notified, false);
  assert.equal(res2.reason, "DUPLICATE_PREVENTED");
  assert.equal(res2.status, "sent");
  assert.equal(sentMails.length, 1); // Transporter TIDAK dipanggil ulang
});

// SKENARIO 12: Status pengiriman tersimpan dengan benar di database
test("Skenario 12: Status pengiriman notifikasi email tersimpan dengan benar di SQLite", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [{ category: "fraud", matches: [{ pattern: "phishing bank" }] }],
        },
      },
    }),
  );

  const mockTransporter = createMockTransporter();
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: mockTransporter,
  });

  await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
  });

  const record = dataAccess.notifications.findByScanId(scan.id);
  assert.notEqual(record, null);
  assert.equal(record.scanId, scan.id);
  assert.equal(record.channel, "email");
  assert.equal(record.status, "sent");
  assert.equal(record.recipient, mockConfig.to);
  assert.ok(record.subject.includes("[PERINGATAN]"));
  assert.ok(record.sentAt !== null);
  assert.equal(record.errorMessage, null);
});

// PENGUJIAN TAMBAHAN: Mekanisme percobaan ulang (Retry) yang aman
test("Pengujian Tambahan: Percobaan ulang (retry) berhasil memperbarui status gagal menjadi sent", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [{ category: "gambling", matches: [{ pattern: "slot" }] }],
        },
      },
    }),
  );

  // Awalnya gagal
  dataAccess.notifications.create({
    scanId: scan.id,
    recipient: mockConfig.to,
    status: "failed",
    errorMessage: "Connection refused",
  });

  // Transporter yang sekarang sehat
  const mockTransporter = createMockTransporter();
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: mockTransporter,
  });

  const retryResult = await service.retryScanNotification(scan.id);
  assert.equal(retryResult.success, true);
  assert.equal(retryResult.status, "sent");
  assert.equal(sentMails.length, 1);

  const updatedNotif = dataAccess.notifications.findByScanId(scan.id);
  assert.equal(updatedNotif.status, "sent");
  assert.equal(updatedNotif.errorMessage, null);

  // Percobaan ulang ketika sudah sent harus ditolak (duplikasi dicegah)
  const retryAgain = await service.retryScanNotification(scan.id);
  assert.equal(retryAgain.success, false);
  assert.equal(retryAgain.status, "sent");
  assert.equal(retryAgain.reason, "ALREADY_SENT");
  assert.equal(sentMails.length, 1); // Tetap 1, tidak mengirim ulang
});
