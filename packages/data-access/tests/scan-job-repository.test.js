const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const { createDataAccess } = require("../src/index");
const {
  ScanJobDataValidationError,
} = require("../src/repositories/scan-job-repository");

let tempDir;
let dbPath;
let dataAccess;

before(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "scan-job-repo-test-"));
  dbPath = path.join(tempDir, "test.sqlite");
  dataAccess = createDataAccess(dbPath);
});

beforeEach(() => {
  dataAccess.database.exec("DELETE FROM scan_jobs");
  dataAccess.database.exec("DELETE FROM scans");
});

after(() => {
  dataAccess.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("creates a scan job with valid officer email and defaults", () => {
  const job = dataAccess.scanJobs.create({
    targetUrl: "https://sumbawakab.go.id",
    officerEmail: "petugas.a@sumbawakab.go.id",
  });

  assert.ok(job.id);
  assert.equal(job.type, "single");
  assert.equal(job.targetUrl, "https://sumbawakab.go.id");
  assert.equal(job.officerEmail, "petugas.a@sumbawakab.go.id");
  assert.equal(job.status, "running");
  assert.equal(job.progressScanned, 0);
  assert.equal(job.progressTotal, 1);
  assert.ok(job.startedAt);
  assert.equal(job.completedAt, null);
});

test("rejects invalid officer email on scan job creation", () => {
  assert.throws(
    () =>
      dataAccess.scanJobs.create({
        targetUrl: "https://sumbawakab.go.id",
        officerEmail: "not-an-email",
      }),
    ScanJobDataValidationError,
  );

  assert.throws(
    () =>
      dataAccess.scanJobs.create({
        targetUrl: "https://sumbawakab.go.id",
        officerEmail: " ",
      }),
    ScanJobDataValidationError,
  );
});

test("updates scan job status, progress, and result summary upon completion", () => {
  const job = dataAccess.scanJobs.create({
    targetUrl: "https://sumbawakab.go.id",
    officerEmail: "petugas.b@sumbawakab.go.id",
  });

  const completedAt = new Date().toISOString();
  const updated = dataAccess.scanJobs.update(job.id, {
    status: "completed",
    progressScanned: 5,
    progressTotal: 5,
    resultSummary: { totalPages: 5, indicationsCount: 0 },
    completedAt,
  });

  assert.equal(updated.status, "completed");
  assert.equal(updated.progressScanned, 5);
  assert.equal(updated.progressTotal, 5);
  assert.deepEqual(updated.resultSummary, { totalPages: 5, indicationsCount: 0 });
  assert.equal(updated.completedAt, completedAt);
});

test("finds running scan jobs and recent jobs filtered by officer", () => {
  dataAccess.scanJobs.create({
    id: "job-a-1",
    targetUrl: "https://sumbawakab.go.id/a",
    officerEmail: "petugas.a@sumbawakab.go.id",
    status: "running",
  });

  dataAccess.scanJobs.create({
    id: "job-b-1",
    targetUrl: "https://sumbawakab.go.id/b",
    officerEmail: "petugas.b@sumbawakab.go.id",
    status: "completed",
  });

  const running = dataAccess.scanJobs.findRunning();
  assert.equal(running.length, 1);
  assert.equal(running[0].id, "job-a-1");

  const officerAJobs = dataAccess.scanJobs.findRecent(10, {
    officerEmail: "petugas.a@sumbawakab.go.id",
  });
  assert.equal(officerAJobs.length, 1);
  assert.equal(officerAJobs[0].officerEmail, "petugas.a@sumbawakab.go.id");

  const officerBJobs = dataAccess.scanJobs.findRecent(10, {
    officerEmail: "petugas.b@sumbawakab.go.id",
  });
  assert.equal(officerBJobs.length, 1);
  assert.equal(officerBJobs[0].officerEmail, "petugas.b@sumbawakab.go.id");
});

test("stores officerEmail in scan records", () => {
  const scan = dataAccess.scans.create({
    url: "https://sumbawakab.go.id/page1",
    crawlStatus: "success",
    officerEmail: "petugas.a@sumbawakab.go.id",
  });

  assert.equal(scan.officerEmail, "petugas.a@sumbawakab.go.id");

  const retrieved = dataAccess.scans.findById(scan.id);
  assert.equal(retrieved.officerEmail, "petugas.a@sumbawakab.go.id");
});
