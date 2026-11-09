const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const { createDataAccess } = require("content-detection-data-access");
const { createSchedulerService } = require("../src/services/scheduler-service");

let tempDir;
let dbPath;
let dataAccess;

before(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aggregator-scheduler-test-"));
  dbPath = path.join(tempDir, "test.sqlite");
  dataAccess = createDataAccess(dbPath);
});

beforeEach(() => {
  dataAccess.database.exec("DELETE FROM schedules");
  dataAccess.database.exec("DELETE FROM sites");
  dataAccess.database.exec("DELETE FROM scans");
});

after(() => {
  dataAccess.close();
});

test("scheduler executes due schedule and saves results with scanSource SCHEDULED", async () => {
  // Create site
  const site = dataAccess.sites.create({
    name: "Situs Uji Scheduler",
    url: "http://127.0.0.1:8080/index.html",
    status: "active",
  });

  // Create due schedule
  const schedule = dataAccess.schedules.create({
    name: "Jadwal Harian Otomatis",
    targetType: "all_active",
    frequency: "daily",
    timeOfDay: "02:00",
    nextRunAt: "2026-10-29T00:00:00.000Z", // In the past
  });

  const scannedInputs = [];
  const mockScan = async (input) => {
    scannedInputs.push(input);
    return {
      startUrl: input.crawler.startUrl,
      pages: [
        {
          url: input.crawler.startUrl,
          crawl: { success: true, status: 200 },
        },
      ],
    };
  };

  const scheduler = createSchedulerService({
    dataAccess,
    scan: mockScan,
    enabled: false, // Don't run background timer in test
  });

  await scheduler.tick();

  assert.equal(scannedInputs.length, 1);
  assert.equal(scannedInputs[0].scanSource, "SCHEDULED");
  assert.equal(scannedInputs[0].crawler.startUrl, site.url);

  const updatedSchedule = dataAccess.schedules.findById(schedule.id);
  assert.equal(updatedSchedule.isRunning, false);
  assert.equal(updatedSchedule.lastRunStatus, "success");
  assert.ok(updatedSchedule.lastRunAt);
  assert.ok(new Date(updatedSchedule.nextRunAt) > new Date());
});

test("scheduler isolates failing site and records partial status", async () => {
  dataAccess.sites.create({
    name: "Situs Berhasil",
    url: "http://127.0.0.1:8080/good.html",
    status: "active",
  });
  dataAccess.sites.create({
    name: "Situs Gagal",
    url: "http://127.0.0.1:8999/bad.html",
    status: "active",
  });

  const schedule = dataAccess.schedules.create({
    name: "Jadwal Uji Ketahanan",
    targetType: "all_active",
    nextRunAt: "2026-10-29T00:00:00.000Z",
  });

  const mockScan = async (input) => {
    if (input.crawler.startUrl.includes("8999")) {
      throw new Error("Connection refused to port 8999");
    }
    return {
      startUrl: input.crawler.startUrl,
      pages: [{ url: input.crawler.startUrl, crawl: { success: true } }],
    };
  };

  const scheduler = createSchedulerService({
    dataAccess,
    scan: mockScan,
    enabled: false,
  });

  const result = await scheduler.executeSchedule(schedule);

  assert.equal(result.status, "partial");
  assert.equal(result.results.length, 2);
  const goodResult = result.results.find((r) => r.url.includes("8080"));
  const badResult = result.results.find((r) => r.url.includes("8999"));
  assert.equal(goodResult.scanOutcome, "success");
  assert.equal(badResult.scanOutcome, "failed");

  const updated = dataAccess.schedules.findById(schedule.id);
  assert.equal(updated.lastRunStatus, "partial");
  assert.match(updated.lastRunMessage, /1 dari 2 situs berhasil diperiksa/);
});

test("scheduler prevents duplicate runs when lock cannot be acquired", async () => {
  const schedule = dataAccess.schedules.create({
    name: "Jadwal Terkunci",
    nextRunAt: "2026-10-29T00:00:00.000Z",
  });

  // Manually acquire lock
  dataAccess.schedules.acquireLock(schedule.id);

  let scanCalled = false;
  const mockScan = async () => {
    scanCalled = true;
  };

  const scheduler = createSchedulerService({
    dataAccess,
    scan: mockScan,
    enabled: false,
  });

  await scheduler.tick();

  assert.equal(scanCalled, false, "Scan should not be called when schedule is already running");
});
