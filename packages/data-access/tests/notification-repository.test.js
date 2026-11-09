const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const {
  createDataAccess,
  NotificationDataAccessError,
  NotificationDataValidationError,
} = require("../src");

let temporaryDirectory;
let databasePath;
let dataAccess;

before(() => {
  temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "content-detection-notification-test-"),
  );
  databasePath = path.join(temporaryDirectory, "test-notifications.sqlite");
  dataAccess = createDataAccess(databasePath);
});

beforeEach(() => {
  dataAccess.database.exec("DELETE FROM notifications");
  dataAccess.database.exec("DELETE FROM scans");
});

after(() => {
  dataAccess.close();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("creates a notification record with default pending status and email channel", () => {
  const notif = dataAccess.notifications.create({
    scanId: "scan-test-1",
    recipient: "admin@sumbawakab.go.id",
    subject: "Peringatan Konten Negatif",
  });

  assert.equal(typeof notif.id, "string");
  assert.equal(notif.scanId, "scan-test-1");
  assert.equal(notif.channel, "email");
  assert.equal(notif.recipient, "admin@sumbawakab.go.id");
  assert.equal(notif.subject, "Peringatan Konten Negatif");
  assert.equal(notif.status, "pending");
  assert.equal(notif.sentAt, null);
  assert.equal(notif.errorMessage, null);
  assert.equal(typeof notif.createdAt, "string");
  assert.equal(typeof notif.updatedAt, "string");
});

test("finds notification by scanId and channel", () => {
  dataAccess.notifications.create({
    scanId: "scan-test-2",
    recipient: "test@example.com",
    status: "sent",
    sentAt: "2026-11-06T10:00:00.000Z",
  });

  const found = dataAccess.notifications.findByScanId("scan-test-2");
  assert.notEqual(found, null);
  assert.equal(found.scanId, "scan-test-2");
  assert.equal(found.status, "sent");
  assert.equal(found.sentAt, "2026-11-06T10:00:00.000Z");

  assert.equal(dataAccess.notifications.findByScanId("nonexistent"), null);
});

test("enforces uniqueness on (scan_id, channel) for idempotency", () => {
  dataAccess.notifications.create({
    scanId: "scan-idempotent",
    recipient: "admin@example.com",
    status: "pending",
  });

  // Attempting to insert duplicate scanId and channel must throw DataAccessError
  assert.throws(
    () =>
      dataAccess.notifications.create({
        scanId: "scan-idempotent",
        recipient: "admin@example.com",
      }),
    NotificationDataAccessError,
  );
});

test("updates status to sent with sentAt timestamp and clear error", () => {
  dataAccess.notifications.create({
    scanId: "scan-update-test",
    recipient: "admin@example.com",
    status: "failed",
    errorMessage: "Connection timeout",
  });

  const updated = dataAccess.notifications.updateByScanId("scan-update-test", {
    status: "sent",
    sentAt: "2026-11-06T10:05:00.000Z",
    errorMessage: null,
  });

  assert.equal(updated.status, "sent");
  assert.equal(updated.sentAt, "2026-11-06T10:05:00.000Z");
  assert.equal(updated.errorMessage, null);
});

test("updates status to not_configured when SMTP is absent", () => {
  const notif = dataAccess.notifications.updateByScanId("scan-not-cfg", {
    status: "not_configured",
    errorMessage: "SMTP host not provided",
  });

  assert.equal(notif.status, "not_configured");
  assert.equal(notif.errorMessage, "SMTP host not provided");
});

test("validates scanId and supported status values", () => {
  assert.throws(
    () => dataAccess.notifications.create({ scanId: "" }),
    NotificationDataValidationError,
  );
  assert.throws(
    () => dataAccess.notifications.create({ scanId: 123 }),
    NotificationDataValidationError,
  );
  assert.throws(
    () =>
      dataAccess.notifications.create({
        scanId: "valid",
        status: "invalid_status",
      }),
    NotificationDataValidationError,
  );
});

test("lists recent notifications in descending order", () => {
  dataAccess.notifications.create({ scanId: "s1", status: "sent" });
  dataAccess.notifications.create({ scanId: "s2", status: "failed" });

  const list = dataAccess.notifications.listRecent(10);
  assert.equal(list.length, 2);
  assert.equal(list[0].scanId, "s2");
  assert.equal(list[1].scanId, "s1");
});

test("deletes notification by scanId", () => {
  dataAccess.notifications.create({ scanId: "to-delete" });
  assert.equal(dataAccess.notifications.deleteByScanId("to-delete"), true);
  assert.equal(dataAccess.notifications.findByScanId("to-delete"), null);
  assert.equal(dataAccess.notifications.deleteByScanId("to-delete"), false);
});
