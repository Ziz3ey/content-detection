const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const { createDataAccess } = require("content-detection-data-access");
const { createNotificationService } = require("../src/services/notification-service");
const { createScanService } = require("../src/services/scan-service");
const { createScanWorkerService } = require("../src/services/scan-worker-service");
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
  pass: "mock-password-16char",
  from: '"Sistem Pemantauan Web Sumbawa" <diskominfo.sumbawa@gmail.com>',
  to: "default-admin@sumbawakab.go.id",
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
    officerEmail: overrides.officerEmail || null,
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
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "officer-scan-test-"));
  dbPath = path.join(tempDir, "test-officer.sqlite");
  dataAccess = createDataAccess(dbPath);
});

beforeEach(() => {
  dataAccess.database.exec("DELETE FROM notifications");
  dataAccess.database.exec("DELETE FROM scans");
  dataAccess.database.exec("DELETE FROM scan_jobs");
  dataAccess.database.exec("DELETE FROM sites");
  sentMails = [];
});

after(() => {
  dataAccess.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// TEST 1: Petugas A memasukkan email pribadinya, notifikasi dikirim HANYA ke Petugas A
test("Pengujian 1: Petugas A memasukkan email -> email terkirim khusus ke Petugas A", async () => {
  const emailA = "petugas.a@sumbawakab.go.id";
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      officerEmail: emailA,
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [{ category: "gambling", matches: [{ pattern: "slot gacor" }] }],
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
    officerEmail: emailA,
  });

  assert.equal(result.notified, true);
  assert.equal(result.status, "sent");
  assert.equal(result.recipient, emailA);
  assert.equal(sentMails.length, 1);
  assert.equal(sentMails[0].to, emailA);
  assert.ok(sentMails[0].text.includes(emailA));
});

// TEST 2: Petugas B memasukkan email pribadinya, notifikasi dikirim HANYA ke Petugas B
test("Pengujian 2: Petugas B memasukkan email -> email terkirim khusus ke Petugas B", async () => {
  const emailB = "petugas.b@sumbawakab.go.id";
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      officerEmail: emailB,
      textDetection: {
        success: true,
        data: {
          detected: true,
          categories: [{ category: "pornography", matches: [{ pattern: "konten asusila" }] }],
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
    officerEmail: emailB,
  });

  assert.equal(result.notified, true);
  assert.equal(result.status, "sent");
  assert.equal(result.recipient, emailB);
  assert.equal(sentMails.length, 1);
  assert.equal(sentMails[0].to, emailB);
  assert.ok(sentMails[0].text.includes(emailB));
});

// TEST 3: Pemindaian bersamaan untuk Petugas A dan Petugas B tidak terjadi pertukaran alamat email
test("Pengujian 3: Dua pemindaian bersamaan tidak tertukar penerima email", async () => {
  const emailA = "petugas.a@sumbawakab.go.id";
  const emailB = "petugas.b@sumbawakab.go.id";

  const scanA = dataAccess.scans.create(
    sampleScanRecord({
      url: "https://sumbawakab.go.id/layanan-a",
      officerEmail: emailA,
      textDetection: {
        success: true,
        data: { detected: true, categories: [{ category: "gambling", matches: [{ pattern: "judi" }] }] },
      },
    }),
  );

  const scanB = dataAccess.scans.create(
    sampleScanRecord({
      url: "https://sumbawakab.go.id/layanan-b",
      officerEmail: emailB,
      textDetection: {
        success: true,
        data: { detected: true, categories: [{ category: "fraud", matches: [{ pattern: "hadiah uang tunai" }] }] },
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

  // Eksekusi secara paralel/bersamaan
  const [resultA, resultB] = await Promise.all([
    service.notifyScanResults({
      startUrl: scanA.url,
      records: [scanA],
      officerEmail: emailA,
    }),
    service.notifyScanResults({
      startUrl: scanB.url,
      records: [scanB],
      officerEmail: emailB,
    }),
  ]);

  assert.equal(resultA.recipient, emailA);
  assert.equal(resultB.recipient, emailB);

  assert.equal(sentMails.length, 2);
  const mailToA = sentMails.find((m) => m.to === emailA);
  const mailToB = sentMails.find((m) => m.to === emailB);

  assert.ok(mailToA);
  assert.ok(mailToB);
  assert.ok(mailToA.subject.includes("layanan-a") || mailToA.html.includes("layanan-a"));
  assert.ok(mailToB.subject.includes("layanan-b") || mailToB.html.includes("layanan-b"));
});

// TEST 4: Pemindaian tanpa indikasi (bersih) tetap mengirim email konfirmasi selesai
test("Pengujian 4: Pemindaian tanpa indikasi tetap mengirim email penyelesaian kepada petugas", async () => {
  const emailPetugas = "petugas.pemeriksa@sumbawakab.go.id";
  const cleanScan = dataAccess.scans.create(
    sampleScanRecord({
      url: "https://sumbawakab.go.id/berita-resmi",
      officerEmail: emailPetugas,
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
    startUrl: cleanScan.url,
    records: [cleanScan],
    officerEmail: emailPetugas,
    notifyOnClean: true,
  });

  assert.equal(result.notified, true);
  assert.equal(result.status, "sent");
  assert.equal(result.recipient, emailPetugas);
  assert.equal(sentMails.length, 1);
  assert.equal(sentMails[0].to, emailPetugas);
  assert.ok(sentMails[0].subject.includes("Telah Selesai"));
  assert.ok(sentMails[0].text.includes("TIDAK DITEMUKAN INDIKASI") || sentMails[0].text.includes("BERSIH"));
});

// TEST 5: Background Scan Worker mengeksekusi job mandiri, terlepas dari browser
test("Pengujian 5: Background scan worker menjalankan job secara asinkron di backend", async () => {
  const emailPetugas = "petugas.worker@sumbawakab.go.id";

  const mockScanService = async (input) => {
    // Simulasi crawling dan deteksi
    const record = dataAccess.scans.create({
      url: input.crawler.startUrl,
      crawlStatus: "success",
      officerEmail: input.officerEmail,
    });
    return {
      startUrl: input.crawler.startUrl,
      pages: [{ url: input.crawler.startUrl, id: record.id, crawl: { success: true } }],
    };
  };

  const worker = createScanWorkerService({
    scanJobs: dataAccess.scanJobs,
    scan: mockScanService,
    sites: dataAccess.sites,
    logger: console,
  });

  const job = await worker.dispatchSingleScan({
    input: {
      crawler: { startUrl: "https://sumbawakab.go.id", maxPages: 5 },
    },
    officerEmail: emailPetugas,
  });

  assert.ok(job.id);
  assert.equal(job.status, "running");
  assert.equal(job.officerEmail, emailPetugas);

  // Tunggu setImmediate selesai dieksekusi
  await new Promise((resolve) => setTimeout(resolve, 50));

  const finishedJob = worker.getJob(job.id);
  assert.equal(finishedJob.status, "completed");
  assert.equal(finishedJob.progressScanned, 1);
  assert.ok(finishedJob.completedAt);

  // Verifikasi record pemindaian tersimpan di SQLite dengan email petugas
  const scans = dataAccess.scans.findRecent(5);
  assert.equal(scans.length, 1);
  assert.equal(scans[0].officerEmail, emailPetugas);
});

// TEST 6: Validasi email petugas kosong atau format salah
test("Pengujian 6: Menolak input email petugas yang kosong atau format tidak valid", async () => {
  const { validateOfficerEmail } = require("../../../dashboard/src/api.js");

  assert.throws(() => validateOfficerEmail(""), /wajib diisi/);
  assert.throws(() => validateOfficerEmail(" "), /wajib diisi/);
  assert.throws(() => validateOfficerEmail("petugas-tanpa-domain"), /format alamat email yang valid/);
  assert.throws(() => validateOfficerEmail("@domain.com"), /format alamat email yang valid/);

  const valid = validateOfficerEmail("  PETUGAS@SumbawaKab.GO.ID  ");
  assert.equal(valid, "petugas@sumbawakab.go.id");
});

// TEST 7: Kegagalan SMTP tidak merusak atau menghapus hasil pemindaian di SQLite
test("Pengujian 7: Hasil scan tetap utuh tersimpan di SQLite saat SMTP gagal", async () => {
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      officerEmail: "petugas.fail@sumbawakab.go.id",
      textDetection: {
        success: true,
        data: { detected: true, categories: [{ category: "gambling", matches: [{ pattern: "judi" }] }] },
      },
    }),
  );

  const mockTransporterFail = createMockTransporter(true, "SMTP 535 Bad Credentials");
  const service = createNotificationService({
    config: mockConfig,
    notifications: dataAccess.notifications,
    sites: dataAccess.sites,
    scans: dataAccess.scans,
    transporter: mockTransporterFail,
  });

  const result = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
    officerEmail: "petugas.fail@sumbawakab.go.id",
  });

  assert.equal(result.notified, false);
  assert.equal(result.status, "failed");

  // Data scan utama tetap utuh di database
  const retrievedScan = dataAccess.scans.findById(scan.id);
  assert.ok(retrievedScan);
  assert.equal(retrievedScan.url, scan.url);
  assert.equal(retrievedScan.officerEmail, "petugas.fail@sumbawakab.go.id");

  // Status notifikasi tersimpan sebagai failed
  const notif = dataAccess.notifications.findByScanId(scan.id, "email");
  assert.equal(notif.status, "failed");
  assert.equal(notif.recipient, "petugas.fail@sumbawakab.go.id");
  assert.ok(notif.errorMessage.includes("535"));
});

// TEST 8: Pencegahan pengiriman email ganda (Idempotensi)
test("Pengujian 8: Tidak terjadi pengiriman email duplikat untuk scan yang sama", async () => {
  const email = "petugas.idempotent@sumbawakab.go.id";
  const scan = dataAccess.scans.create(
    sampleScanRecord({
      officerEmail: email,
      textDetection: {
        success: true,
        data: { detected: true, categories: [{ category: "gambling", matches: [{ pattern: "togel" }] }] },
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

  // Pengiriman pertama: berhasil
  const res1 = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
    officerEmail: email,
  });
  assert.equal(res1.status, "sent");
  assert.equal(sentMails.length, 1);

  // Pengiriman kedua (duplikat): ditolak
  const res2 = await service.notifyScanResults({
    startUrl: scan.url,
    records: [scan],
    officerEmail: email,
  });
  assert.equal(res2.notified, false);
  assert.equal(res2.reason, "DUPLICATE_PREVENTED");
  assert.equal(sentMails.length, 1); // Tidak ada email baru yang dikirim
});

// TEST 9: HTTP Endpoint API untuk background scan dan status job
test("Pengujian 9: Endpoint POST /api/v1/scan dengan background:true mengembalikan HTTP 202 dan jobId", async () => {
  const testAuth = {
    authenticate: () => ({ username: "test-admin" }),
    authenticateCredentials: () => true,
    createSession: () => ({
      token: "a".repeat(64),
      cookie: "content_detection_session=test",
    }),
    revokeSession() {},
    clearCookie: "content_detection_session=; Max-Age=0",
  };

  const server = createApp({
    dataAccess,
    auth: testAuth,
    enableScheduler: false,
    transporter: createMockTransporter(),
    scan: async (input) => {
      const record = dataAccess.scans.create({
        url: input.crawler.startUrl,
        crawlStatus: "success",
        officerEmail: input.officerEmail,
      });
      return {
        startUrl: input.crawler.startUrl,
        pages: [{ url: input.crawler.startUrl, id: record.id, crawl: { success: true } }],
      };
    },
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Login sebagai Admin untuk mendapatkan cookie session
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "Password123!" }),
    });
    assert.equal(loginRes.status, 200);
    const cookie = loginRes.headers.get("set-cookie");

    // 2. Submit background scan
    const scanRes = await fetch(`${baseUrl}/api/v1/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        crawler: {
          startUrl: "https://sumbawakab.go.id/diskominfo",
          allowedHosts: ["sumbawakab.go.id"],
          maxDepth: 1,
          maxPages: 5,
        },
        officerEmail: "petugas.api@sumbawakab.go.id",
        background: true,
      }),
    });

    assert.equal(scanRes.status, 202);
    const scanData = await scanRes.json();
    assert.equal(scanData.success, true);
    assert.ok(scanData.data.jobId);
    assert.equal(scanData.data.status, "running");
    assert.equal(scanData.data.officerEmail, "petugas.api@sumbawakab.go.id");

    const jobId = scanData.data.jobId;

    // 3. Ambil status job via GET /api/v1/scans/jobs/:id
    const jobRes = await fetch(`${baseUrl}/api/v1/scans/jobs/${jobId}`, {
      headers: { Cookie: cookie },
    });
    assert.equal(jobRes.status, 200);
    const jobData = await jobRes.json();
    assert.equal(jobData.success, true);
    assert.equal(jobData.data.job.id, jobId);
    assert.equal(jobData.data.job.officerEmail, "petugas.api@sumbawakab.go.id");

    // 4. Ambil daftar job via GET /api/v1/scans/jobs
    const listRes = await fetch(`${baseUrl}/api/v1/scans/jobs`, {
      headers: { Cookie: cookie },
    });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.success, true);
    assert.ok(listData.data.jobs.length >= 1);
  } finally {
    server.close();
  }
});
