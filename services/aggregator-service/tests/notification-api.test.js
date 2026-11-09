const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const { once } = require("node:events");
const { createDataAccess } = require("content-detection-data-access");
const { createApp } = require("../src/app");
const { loadAggregatorConfig } = require("../src/config/aggregator-config");

let tempDir;
let dbPath;
let dataAccess;
let server;
let baseUrl;
let sentMails = [];

const mockTransporter = {
  sendMail: async (options) => {
    sentMails.push(options);
    return { messageId: `<api-test-${Date.now()}@sumbawakab.go.id>` };
  },
};

const testAuth = {
  authenticate: () => ({ username: "test-admin" }),
  authenticateCredentials: () => true,
  createSession: () => ({ token: "x".repeat(64), cookie: "test" }),
  revokeSession() {},
};

before(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aggregator-notif-api-test-"));
  dbPath = path.join(tempDir, "test-api.sqlite");
  dataAccess = createDataAccess(dbPath);

  const config = loadAggregatorConfig({
    ADMIN_USERNAME: "test-admin",
    ADMIN_PASSWORD_HASH: `scrypt$${"a".repeat(32)}$${"b".repeat(128)}`,
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: "587",
    SMTP_USER: "diskominfo.sumbawa@gmail.com",
    SMTP_PASS: "mock-pass",
    EMAIL_FROM: "Sistem Pemantauan <diskominfo.sumbawa@gmail.com>",
    EMAIL_TO: "admin@sumbawakab.go.id",
  });

  server = createApp({
    config,
    dataAccess,
    auth: testAuth,
    transporter: mockTransporter,
    enableScheduler: false,
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
  dataAccess.database.exec("DELETE FROM notifications");
  dataAccess.database.exec("DELETE FROM scans");
  sentMails = [];
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve) => server.close(resolve));
  }
  dataAccess.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("GET /api/v1/scans/:id mengembalikan data scan beserta status notifikasi email", async () => {
  const scan = dataAccess.scans.create({
    url: "https://sumbawakab.go.id/berita",
    crawlStatus: "success",
    textDetection: {
      success: true,
      data: { detected: true, categories: [{ category: "gambling", matches: [{ pattern: "slot" }] }] },
    },
    defacementDetectionStatus: "skipped",
    linkDetection: { success: true, data: { detected: false, links: [] } },
  });

  dataAccess.notifications.create({
    scanId: scan.id,
    recipient: "admin@sumbawakab.go.id",
    subject: "[PERINGATAN] Konten Negatif",
    status: "sent",
    sentAt: "2026-11-06T12:00:00.000Z",
  });

  const response = await fetch(`${baseUrl}/api/v1/scans/${scan.id}`);
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.scan.id, scan.id);
  assert.notEqual(payload.data.emailNotification, null);
  assert.equal(payload.data.emailNotification.status, "sent");
  assert.equal(payload.data.emailNotification.recipient, "admin@sumbawakab.go.id");
});

test("POST /api/v1/scans/:id/resend-email mengirim ulang email jika sebelumnya gagal", async () => {
  const scan = dataAccess.scans.create({
    url: "https://sumbawakab.go.id/layanan",
    crawlStatus: "success",
    textDetection: {
      success: true,
      data: { detected: true, categories: [{ category: "fraud", matches: [{ pattern: "phishing" }] }] },
    },
    defacementDetectionStatus: "skipped",
    linkDetection: { success: true, data: { detected: false, links: [] } },
  });

  // Sebelumnya gagal
  dataAccess.notifications.create({
    scanId: scan.id,
    recipient: "admin@sumbawakab.go.id",
    status: "failed",
    errorMessage: "Connection timeout",
  });

  const resendResponse = await fetch(`${baseUrl}/api/v1/scans/${scan.id}/resend-email`, {
    method: "POST",
  });
  assert.equal(resendResponse.status, 200);

  const resendPayload = await resendResponse.json();
  assert.equal(resendPayload.success, true);
  assert.equal(resendPayload.data.status, "sent");
  assert.equal(sentMails.length, 1);

  // Status sekarang menjadi sent di database
  const notif = dataAccess.notifications.findByScanId(scan.id);
  assert.equal(notif.status, "sent");
  assert.equal(notif.errorMessage, null);
});

test("POST /api/v1/scans/:id/resend-email menolak pengiriman ulang jika email sudah terkirim sebelumnya", async () => {
  const scan = dataAccess.scans.create({
    url: "https://sumbawakab.go.id/layanan-2",
    crawlStatus: "success",
    textDetection: {
      success: true,
      data: { detected: true, categories: [{ category: "fraud", matches: [{ pattern: "phishing" }] }] },
    },
    defacementDetectionStatus: "skipped",
    linkDetection: { success: true, data: { detected: false, links: [] } },
  });

  // Sudah terkirim
  dataAccess.notifications.create({
    scanId: scan.id,
    recipient: "admin@sumbawakab.go.id",
    status: "sent",
    sentAt: "2026-11-06T12:00:00.000Z",
  });

  const resendResponse = await fetch(`${baseUrl}/api/v1/scans/${scan.id}/resend-email`, {
    method: "POST",
  });
  assert.equal(resendResponse.status, 200);

  const resendPayload = await resendResponse.json();
  assert.equal(resendPayload.data.success, false);
  assert.equal(resendPayload.data.status, "sent");
  assert.equal(resendPayload.data.reason, "ALREADY_SENT");
  assert.equal(sentMails.length, 0); // Tidak mengirim email baru
});

test("GET /api/v1/notifications menampilkan daftar riwayat notifikasi email", async () => {
  dataAccess.notifications.create({
    scanId: "scan-n1",
    recipient: "admin@sumbawakab.go.id",
    status: "sent",
  });
  dataAccess.notifications.create({
    scanId: "scan-n2",
    recipient: "admin@sumbawakab.go.id",
    status: "failed",
    errorMessage: "Invalid recipient",
  });

  const response = await fetch(`${baseUrl}/api/v1/notifications`);
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.notifications.length, 2);
});
