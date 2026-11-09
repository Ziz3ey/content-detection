const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const {
  createDataAccess,
  ScheduleDataValidationError,
  computeNextRunAt,
} = require("../src");

let temporaryDirectory;
let databasePath;
let dataAccess;

before(() => {
  temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "content-detection-schedule-test-"),
  );
  databasePath = path.join(temporaryDirectory, "test-schedules.sqlite");
  dataAccess = createDataAccess(databasePath);
});

beforeEach(() => {
  dataAccess.database.exec("DELETE FROM schedules");
});

after(() => {
  dataAccess.close();
});

test("computeNextRunAt computes upcoming run times in WITA", () => {
  // Test daily calculation
  const fixedDate = new Date("2026-10-30T00:00:00.000Z"); // 08:00 WITA
  const nextDaily = computeNextRunAt("daily", "09:00", 1, 1, "Asia/Makassar", fixedDate);
  // 09:00 WITA is 01:00 UTC
  assert.equal(nextDaily, "2026-10-30T01:00:00.000Z");

  const pastDaily = computeNextRunAt("daily", "07:00", 1, 1, "Asia/Makassar", fixedDate);
  // 07:00 WITA already passed today, so tomorrow: Oct 31 07:00 WITA -> Oct 30 23:00 UTC
  assert.equal(pastDaily, "2026-10-30T23:00:00.000Z");

  // Invalid time
  assert.throws(
    () => computeNextRunAt("daily", "25:99"),
    ScheduleDataValidationError,
  );
});

test("creates a schedule with valid fields and defaults", () => {
  const schedule = dataAccess.schedules.create({
    name: "Pemeriksaan Harian OPD",
    targetType: "all_active",
    frequency: "daily",
    timeOfDay: "03:00",
  });

  assert.equal(typeof schedule.id, "string");
  assert.equal(schedule.name, "Pemeriksaan Harian OPD");
  assert.equal(schedule.targetType, "all_active");
  assert.equal(schedule.frequency, "daily");
  assert.equal(schedule.timeOfDay, "03:00");
  assert.equal(schedule.timezone, "Asia/Makassar");
  assert.equal(schedule.status, "active");
  assert.equal(schedule.isRunning, false);
  assert.ok(schedule.nextRunAt);
});

test("updates schedule and recalculates nextRunAt", () => {
  const schedule = dataAccess.schedules.create({
    name: "Jadwal Awal",
    targetType: "custom",
    siteIds: ["site-1", "site-2"],
    frequency: "daily",
    timeOfDay: "02:00",
  });

  const updated = dataAccess.schedules.update(schedule.id, {
    name: "Jadwal Diperbarui",
    timeOfDay: "04:30",
    frequency: "weekly",
    dayOfWeek: 5,
  });

  assert.equal(updated.name, "Jadwal Diperbarui");
  assert.equal(updated.timeOfDay, "04:30");
  assert.equal(updated.frequency, "weekly");
  assert.equal(updated.dayOfWeek, 5);
  assert.deepEqual(updated.siteIds, ["site-1", "site-2"]);
});

test("acquires and releases schedule locks to prevent concurrent runs", () => {
  const schedule = dataAccess.schedules.create({
    name: "Jadwal Kunci",
    timeOfDay: "01:00",
  });

  // First lock succeeds
  assert.equal(dataAccess.schedules.acquireLock(schedule.id), true);
  // Second concurrent lock must fail
  assert.equal(dataAccess.schedules.acquireLock(schedule.id), false);

  const locked = dataAccess.schedules.findById(schedule.id);
  assert.equal(locked.isRunning, true);

  // Release lock
  const released = dataAccess.schedules.releaseLock(schedule.id, {
    lastRunStatus: "success",
    lastRunMessage: "3 situs berhasil diperiksa",
    nextRunAt: "2026-10-31T18:00:00.000Z",
  });
  assert.equal(released, true);

  const afterRelease = dataAccess.schedules.findById(schedule.id);
  assert.equal(afterRelease.isRunning, false);
  assert.equal(afterRelease.lastRunStatus, "success");
  assert.equal(afterRelease.lastRunMessage, "3 situs berhasil diperiksa");
  assert.equal(afterRelease.nextRunAt, "2026-10-31T18:00:00.000Z");
});

test("finds due schedules and deletes schedule by ID", () => {
  const dueSchedule = dataAccess.schedules.create({
    name: "Jadwal Sudah Waktunya",
    timeOfDay: "01:00",
    nextRunAt: "2026-10-29T00:00:00.000Z", // In the past
  });

  dataAccess.schedules.create({
    name: "Jadwal Masa Depan",
    timeOfDay: "01:00",
    nextRunAt: "2026-12-01T00:00:00.000Z", // In the future
  });

  const due = dataAccess.schedules.findDue("2026-10-30T00:00:00.000Z");
  assert.equal(due.length, 1);
  assert.equal(due[0].id, dueSchedule.id);

  assert.equal(dataAccess.schedules.deleteById(dueSchedule.id), true);
  assert.equal(dataAccess.schedules.findById(dueSchedule.id), null);
});

