const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const {
  createDataAccess,
  DataAccessError,
  DataValidationError,
  initializeDatabase,
} = require("../src");
const { SCHEMA_SQL } = require("../src/db/schema");

let temporaryDirectory;
let databasePath;
let dataAccess;

function sampleScan(overrides = {}) {
  return {
    url: "https://example.test/page",
    scannedAt: "2026-09-29T12:00:00.000Z",
    crawlStatus: "success",
    httpStatus: 200,
    contentType: "text/html",
    title: "Local fixture",
    textDetection: {
      success: true,
      data: { detected: false, categories: [] },
    },
    defacementDetection: {
      success: false,
      error: { code: "SERVICE_UNAVAILABLE" },
    },
    linkDetection: {
      success: true,
      data: {
        detected: true,
        indicators: [{ type: "ip_hostname" }],
      },
    },
    crawlMetadata: { depth: 1, links: ["https://example.test/next"] },
    ...overrides,
  };
}

before(() => {
  temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "content-detection-data-test-"),
  );
  databasePath = path.join(temporaryDirectory, "test-scans.sqlite");
  dataAccess = createDataAccess(databasePath);
});

beforeEach(() => {
  dataAccess.database.exec("DELETE FROM scans");
});

after(() => {
  dataAccess.close();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("initializes the test database and creates the scans schema", () => {
  assert.equal(fs.existsSync(databasePath), true);
  assert.equal(dataAccess.database.pragma("user_version", { simple: true }), 2);
  const table = dataAccess.database
    .prepare("SELECT name FROM sqlite_master WHERE type = ? AND name = ?")
    .get("table", "scans");
  assert.deepEqual(table, { name: "scans" });
});

test("creates a scan with a unique ID, timestamp, and independent detector results", () => {
  const created = dataAccess.scans.create(sampleScan());

  assert.equal(typeof created.id, "string");
  assert.equal(created.url, "https://example.test/page");
  assert.equal(created.scannedAt, "2026-09-29T12:00:00.000Z");
  assert.equal(created.crawlStatus, "success");
  assert.equal(created.textDetectionStatus, "success");
  assert.deepEqual(created.textDetection.data, {
    detected: false,
    categories: [],
  });
  assert.equal(created.defacementDetectionStatus, "failed");
  assert.deepEqual(created.defacementDetection.error, {
    code: "SERVICE_UNAVAILABLE",
  });
  assert.equal(created.linkDetectionStatus, "success");
  assert.deepEqual(created.linkDetection.data.indicators, [
    { type: "ip_hostname" },
  ]);
  assert.deepEqual(created.crawlMetadata, {
    depth: 1,
    links: ["https://example.test/next"],
  });

  const another = dataAccess.scans.create(
    sampleScan({ url: "https://example.test/other" }),
  );
  assert.notEqual(another.id, created.id);
});

test("finds a scan by ID and returns null when it does not exist", () => {
  const created = dataAccess.scans.create(sampleScan());

  assert.deepEqual(dataAccess.scans.findById(created.id), created);
  assert.equal(dataAccess.scans.findById("missing-id"), null);
});

test("finds recent scans in descending timestamp order", () => {
  dataAccess.scans.create(
    sampleScan({
      url: "https://example.test/old",
      scannedAt: "2026-09-28T12:00:00Z",
    }),
  );
  dataAccess.scans.create(
    sampleScan({
      url: "https://example.test/new",
      scannedAt: "2026-09-29T12:00:00Z",
    }),
  );

  assert.deepEqual(
    dataAccess.scans.findRecent(1).map((scan) => scan.url),
    ["https://example.test/new"],
  );
  assert.deepEqual(
    dataAccess.scans.findRecent().map((scan) => scan.url),
    ["https://example.test/new", "https://example.test/old"],
  );
});

test("finds scans by normalized URL", () => {
  dataAccess.scans.create(sampleScan({ url: "https://example.test/page" }));

  assert.equal(
    dataAccess.scans.findByUrl("https://example.test/page").length,
    1,
  );
  assert.equal(
    dataAccess.scans.findByUrl("https://example.test/other").length,
    0,
  );
});

test("rejects invalid URL and crawl status before writing", () => {
  assert.throws(
    () => dataAccess.scans.create(sampleScan({ url: "javascript:alert(1)" })),
    DataValidationError,
  );
  assert.throws(
    () => dataAccess.scans.create(sampleScan({ url: "not a URL" })),
    DataValidationError,
  );
  assert.throws(
    () => dataAccess.scans.create(sampleScan({ crawlStatus: "unknown" })),
    DataValidationError,
  );
  assert.equal(dataAccess.scans.findRecent().length, 0);
});

test("rejects invalid timestamps, statuses, and undefined JSON fields", () => {
  assert.throws(
    () => dataAccess.scans.create(sampleScan({ scannedAt: "not a date" })),
    DataValidationError,
  );
  assert.throws(
    () =>
      dataAccess.scans.create(sampleScan({ textDetectionStatus: "unknown" })),
    DataValidationError,
  );
  assert.throws(
    () =>
      dataAccess.scans.create(
        sampleScan({
          linkDetection: {
            success: true,
            data: { detected: true, missing: undefined },
          },
        }),
      ),
    DataValidationError,
  );
});

test("does not convert detector detected=false into a failed service status", () => {
  const created = dataAccess.scans.create(
    sampleScan({
      textDetection: {
        success: true,
        data: { detected: false, categories: [] },
      },
    }),
  );

  assert.equal(created.textDetectionStatus, "success");
  assert.equal(created.textDetection.data.detected, false);
});

test("wraps database failures with a safe data-access message", () => {
  dataAccess.scans.create(sampleScan({ id: "duplicate-id" }));

  assert.throws(
    () =>
      dataAccess.scans.create(
        sampleScan({
          id: "duplicate-id",
          url: "https://example.test/duplicate",
        }),
      ),
    (error) =>
      error instanceof DataAccessError &&
      error.message === "Could not create scan record." &&
      error.cause !== undefined,
  );
});

test("initializes idempotently and allows a test database file to be cleaned", () => {
  const secondaryPath = path.join(temporaryDirectory, "cleanup.sqlite");
  const secondaryDatabase = initializeDatabase(secondaryPath);
  secondaryDatabase.close();
  assert.equal(fs.existsSync(secondaryPath), true);
  fs.rmSync(secondaryPath);
  assert.equal(fs.existsSync(secondaryPath), false);

  const reopened = initializeDatabase(databasePath);
  assert.equal(reopened.pragma("user_version", { simple: true }), 2);
  reopened.close();
});

test("migrates a version 1 database without dropping existing scan rows", () => {
  const legacyPath = path.join(temporaryDirectory, "legacy-v1.sqlite");
  const legacyDatabase = new Database(legacyPath);
  legacyDatabase.exec(SCHEMA_SQL.replace("  crawl_metadata TEXT,\n", ""));
  legacyDatabase
    .prepare(
      `
    INSERT INTO scans (
      id, url, scanned_at, crawl_status, http_status, content_type, title,
      text_detection_status, text_detection_result,
      defacement_detection_status, defacement_detection_result,
      link_detection_status, link_detection_result
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      "legacy-id",
      "https://example.test/legacy",
      "2026-09-28T12:00:00.000Z",
      "success",
      200,
      "text/html",
      "Legacy",
      "success",
      JSON.stringify({
        success: true,
        data: { detected: false, categories: [] },
      }),
      "skipped",
      null,
      "skipped",
      null,
    );
  legacyDatabase.pragma("user_version = 1");
  legacyDatabase.close();

  const migrated = initializeDatabase(legacyPath);
  const legacyScan = migrated
    .prepare("SELECT * FROM scans WHERE id = ?")
    .get("legacy-id");

  assert.equal(migrated.pragma("user_version", { simple: true }), 2);
  assert.equal(legacyScan.url, "https://example.test/legacy");
  assert.equal(legacyScan.crawl_metadata, null);
  migrated.close();
  fs.rmSync(legacyPath);
});

test("createMany rolls back the entire batch when one record fails", () => {
  assert.throws(
    () =>
      dataAccess.scans.createMany([
        sampleScan({ id: "batch-duplicate" }),
        sampleScan({
          id: "batch-duplicate",
          url: "https://example.test/duplicate",
        }),
      ]),
    DataAccessError,
  );

  assert.equal(dataAccess.scans.findRecent().length, 0);
});
