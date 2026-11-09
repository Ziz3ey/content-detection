const { randomUUID } = require("node:crypto");

const FREQUENCIES = new Set(["daily", "weekly", "monthly"]);
const TARGET_TYPES = new Set(["all_active", "custom"]);
const SCHEDULE_STATUSES = new Set(["active", "inactive"]);

class ScheduleDataValidationError extends TypeError {
  constructor(message) {
    super(message);
    this.name = "ScheduleDataValidationError";
  }
}

class ScheduleDataAccessError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "ScheduleDataAccessError";
  }
}

const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;

function toWitaDate(utcDate) {
  return new Date(utcDate.getTime() + WITA_OFFSET_MS);
}

function fromWitaComponents(year, month, date, hours, minutes) {
  return new Date(Date.UTC(year, month, date, hours, minutes) - WITA_OFFSET_MS);
}

function computeNextRunAt(
  frequency,
  timeOfDay = "02:00",
  dayOfWeek = 1,
  dayOfMonth = 1,
  timezone = "Asia/Makassar",
  fromDate = new Date(),
) {
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(timeOfDay).trim());
  if (!timeMatch) {
    throw new ScheduleDataValidationError("timeOfDay must be in HH:mm format (00:00 - 23:59).");
  }
  const targetHour = parseInt(timeMatch[1], 10);
  const targetMinute = parseInt(timeMatch[2], 10);

  const witaNow = toWitaDate(fromDate);
  const curYear = witaNow.getUTCFullYear();
  const curMonth = witaNow.getUTCMonth();
  const curDate = witaNow.getUTCDate();
  const curDay = witaNow.getUTCDay();

  if (frequency === "daily") {
    let candidate = fromWitaComponents(curYear, curMonth, curDate, targetHour, targetMinute);
    if (candidate.getTime() <= fromDate.getTime()) {
      candidate = fromWitaComponents(curYear, curMonth, curDate + 1, targetHour, targetMinute);
    }
    return candidate.toISOString();
  }

  if (frequency === "weekly") {
    const targetDay = Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6 ? dayOfWeek : 1;
    let daysAhead = targetDay - curDay;
    let candidate = fromWitaComponents(curYear, curMonth, curDate + daysAhead, targetHour, targetMinute);
    if (daysAhead < 0 || (daysAhead === 0 && candidate.getTime() <= fromDate.getTime())) {
      candidate = fromWitaComponents(curYear, curMonth, curDate + daysAhead + 7, targetHour, targetMinute);
    }
    return candidate.toISOString();
  }

  if (frequency === "monthly") {
    const targetDate = Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31 ? dayOfMonth : 1;
    function maxDays(y, m) {
      return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    }

    const clampedDateThisMonth = Math.min(targetDate, maxDays(curYear, curMonth));
    let candidate = fromWitaComponents(curYear, curMonth, clampedDateThisMonth, targetHour, targetMinute);

    if (candidate.getTime() <= fromDate.getTime()) {
      let nextMonthYear = curYear;
      let nextMonth = curMonth + 1;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextMonthYear += 1;
      }
      const clampedDateNextMonth = Math.min(targetDate, maxDays(nextMonthYear, nextMonth));
      candidate = fromWitaComponents(nextMonthYear, nextMonth, clampedDateNextMonth, targetHour, targetMinute);
    }
    return candidate.toISOString();
  }

  throw new ScheduleDataValidationError(`Unsupported frequency: ${frequency}`);
}

function normalizeSchedule(schedule) {
  if (schedule === null || typeof schedule !== "object" || Array.isArray(schedule)) {
    throw new ScheduleDataValidationError("schedule must be an object.");
  }

  const id = typeof schedule.id === "string" && schedule.id.trim().length > 0
    ? schedule.id.trim()
    : randomUUID();

  const name = typeof schedule.name === "string" ? schedule.name.trim() : "";
  if (!name) {
    throw new ScheduleDataValidationError("name must be a non-empty string.");
  }
  if (name.length > 255) {
    throw new ScheduleDataValidationError("name exceeds the maximum length of 255 characters.");
  }

  const targetType = TARGET_TYPES.has(schedule.targetType) ? schedule.targetType : "all_active";

  let siteIds = null;
  if (targetType === "custom") {
    if (Array.isArray(schedule.siteIds)) {
      siteIds = JSON.stringify(schedule.siteIds.map(String).filter(Boolean));
    } else if (typeof schedule.siteIds === "string") {
      try {
        const parsed = JSON.parse(schedule.siteIds);
        siteIds = Array.isArray(parsed) ? JSON.stringify(parsed) : "[]";
      } catch {
        siteIds = "[]";
      }
    } else {
      siteIds = "[]";
    }
  }

  const frequency = FREQUENCIES.has(schedule.frequency) ? schedule.frequency : "daily";

  const timeOfDay = typeof schedule.timeOfDay === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(schedule.timeOfDay.trim())
    ? schedule.timeOfDay.trim()
    : "02:00";

  let dayOfWeek = null;
  if (frequency === "weekly") {
    dayOfWeek = Number.isInteger(schedule.dayOfWeek) && schedule.dayOfWeek >= 0 && schedule.dayOfWeek <= 6
      ? schedule.dayOfWeek
      : 1;
  }

  let dayOfMonth = null;
  if (frequency === "monthly") {
    dayOfMonth = Number.isInteger(schedule.dayOfMonth) && schedule.dayOfMonth >= 1 && schedule.dayOfMonth <= 31
      ? schedule.dayOfMonth
      : 1;
  }

  const timezone = typeof schedule.timezone === "string" && schedule.timezone.trim().length > 0
    ? schedule.timezone.trim()
    : "Asia/Makassar";

  const status = SCHEDULE_STATUSES.has(schedule.status) ? schedule.status : "active";
  const nowIso = new Date().toISOString();

  let nextRunAt = schedule.nextRunAt;
  if (!nextRunAt || Number.isNaN(Date.parse(nextRunAt))) {
    nextRunAt = computeNextRunAt(frequency, timeOfDay, dayOfWeek, dayOfMonth, timezone, new Date());
  }

  return {
    id,
    name,
    targetType,
    siteIds,
    frequency,
    timeOfDay,
    dayOfWeek,
    dayOfMonth,
    timezone,
    status,
    isRunning: schedule.isRunning ? 1 : 0,
    lastRunAt: schedule.lastRunAt || null,
    lastRunStatus: schedule.lastRunStatus || null,
    lastRunMessage: schedule.lastRunMessage || null,
    nextRunAt,
    createdAt: schedule.createdAt || nowIso,
    updatedAt: schedule.updatedAt || nowIso,
  };
}

function mapRow(row) {
  if (!row) return null;
  let parsedSiteIds = [];
  if (row.site_ids) {
    try {
      parsedSiteIds = JSON.parse(row.site_ids);
    } catch {
      parsedSiteIds = [];
    }
  }

  return {
    id: row.id,
    name: row.name,
    targetType: row.target_type,
    siteIds: parsedSiteIds,
    frequency: row.frequency,
    timeOfDay: row.time_of_day,
    dayOfWeek: row.day_of_week,
    dayOfMonth: row.day_of_month,
    timezone: row.timezone,
    status: row.status,
    isRunning: Boolean(row.is_running),
    lastRunAt: row.last_run_at,
    lastRunStatus: row.last_run_status,
    lastRunMessage: row.last_run_message,
    nextRunAt: row.next_run_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class ScheduleRepository {
  constructor(database) {
    this.database = database;
    this.insertStatement = database.prepare(`
      INSERT INTO schedules (
        id, name, target_type, site_ids, frequency, time_of_day,
        day_of_week, day_of_month, timezone, status, is_running,
        last_run_at, last_run_status, last_run_message, next_run_at,
        created_at, updated_at
      ) VALUES (
        @id, @name, @targetType, @siteIds, @frequency, @timeOfDay,
        @dayOfWeek, @dayOfMonth, @timezone, @status, @isRunning,
        @lastRunAt, @lastRunStatus, @lastRunMessage, @nextRunAt,
        @createdAt, @updatedAt
      )
    `);

    this.updateStatement = database.prepare(`
      UPDATE schedules
      SET name = @name,
          target_type = @targetType,
          site_ids = @siteIds,
          frequency = @frequency,
          time_of_day = @timeOfDay,
          day_of_week = @dayOfWeek,
          day_of_month = @dayOfMonth,
          timezone = @timezone,
          status = @status,
          next_run_at = @nextRunAt,
          updated_at = @updatedAt
      WHERE id = @id
    `);

    this.findByIdStatement = database.prepare("SELECT * FROM schedules WHERE id = ?");
    this.findAllStatement = database.prepare("SELECT * FROM schedules ORDER BY created_at DESC, id DESC");
    this.findActiveStatement = database.prepare("SELECT * FROM schedules WHERE status = 'active' ORDER BY next_run_at ASC");
    this.findDueStatement = database.prepare("SELECT * FROM schedules WHERE status = 'active' AND is_running = 0 AND next_run_at <= ? ORDER BY next_run_at ASC");
    this.deleteByIdStatement = database.prepare("DELETE FROM schedules WHERE id = ?");

    this.acquireLockStatement = database.prepare(`
      UPDATE schedules
      SET is_running = 1, updated_at = ?
      WHERE id = ? AND is_running = 0 AND status = 'active'
    `);

    this.releaseLockStatement = database.prepare(`
      UPDATE schedules
      SET is_running = 0,
          last_run_at = ?,
          last_run_status = ?,
          last_run_message = ?,
          next_run_at = ?,
          updated_at = ?
      WHERE id = ?
    `);

    this.resetLocksStatement = database.prepare(`
      UPDATE schedules SET is_running = 0 WHERE is_running = 1
    `);
  }

  create(schedule) {
    const record = normalizeSchedule(schedule);
    try {
      this.insertStatement.run(record);
      return mapRow(this.findByIdStatement.get(record.id));
    } catch (error) {
      if (error instanceof ScheduleDataAccessError) throw error;
      throw new ScheduleDataAccessError("Could not create schedule record.", error);
    }
  }

  update(id, updates) {
    if (typeof id !== "string" || id.trim().length === 0) {
      throw new ScheduleDataValidationError("id must be a non-empty string.");
    }
    const existing = this.findByIdStatement.get(id);
    if (!existing) return null;

    const currentMapped = mapRow(existing);
    const shouldRecomputeNextRun =
      (updates.frequency && updates.frequency !== currentMapped.frequency) ||
      (updates.timeOfDay && updates.timeOfDay !== currentMapped.timeOfDay) ||
      (updates.dayOfWeek !== undefined && updates.dayOfWeek !== currentMapped.dayOfWeek) ||
      (updates.dayOfMonth !== undefined && updates.dayOfMonth !== currentMapped.dayOfMonth);

    const merged = {
      ...currentMapped,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    if (shouldRecomputeNextRun && !updates.nextRunAt) {
      merged.nextRunAt = computeNextRunAt(
        merged.frequency,
        merged.timeOfDay,
        merged.dayOfWeek,
        merged.dayOfMonth,
        merged.timezone,
        new Date(),
      );
    }

    const record = normalizeSchedule(merged);
    try {
      this.updateStatement.run(record);
      return mapRow(this.findByIdStatement.get(id));
    } catch (error) {
      if (error instanceof ScheduleDataAccessError) throw error;
      throw new ScheduleDataAccessError("Could not update schedule record.", error);
    }
  }

  findById(id) {
    if (typeof id !== "string" || id.trim().length === 0) {
      throw new ScheduleDataValidationError("id must be a non-empty string.");
    }
    try {
      return mapRow(this.findByIdStatement.get(id));
    } catch (error) {
      throw new ScheduleDataAccessError("Could not read schedule record.", error);
    }
  }

  findAll() {
    try {
      return this.findAllStatement.all().map(mapRow);
    } catch (error) {
      throw new ScheduleDataAccessError("Could not read schedule records.", error);
    }
  }

  findActive() {
    try {
      return this.findActiveStatement.all().map(mapRow);
    } catch (error) {
      throw new ScheduleDataAccessError("Could not read active schedule records.", error);
    }
  }

  findDue(nowIso = new Date().toISOString()) {
    try {
      return this.findDueStatement.all(nowIso).map(mapRow);
    } catch (error) {
      throw new ScheduleDataAccessError("Could not read due schedule records.", error);
    }
  }

  deleteById(id) {
    if (typeof id !== "string" || id.trim().length === 0) {
      throw new ScheduleDataValidationError("id must be a non-empty string.");
    }
    try {
      return this.deleteByIdStatement.run(id).changes > 0;
    } catch (error) {
      throw new ScheduleDataAccessError("Could not delete schedule record.", error);
    }
  }

  acquireLock(id) {
    try {
      const now = new Date().toISOString();
      const res = this.acquireLockStatement.run(now, id);
      return res.changes > 0;
    } catch (error) {
      throw new ScheduleDataAccessError("Could not acquire schedule lock.", error);
    }
  }

  releaseLock(id, { lastRunStatus = "success", lastRunMessage = "", nextRunAt, lastRunAt = new Date().toISOString() }) {
    try {
      const now = new Date().toISOString();
      const res = this.releaseLockStatement.run(
        lastRunAt,
        lastRunStatus,
        lastRunMessage,
        nextRunAt,
        now,
        id,
      );
      return res.changes > 0;
    } catch (error) {
      throw new ScheduleDataAccessError("Could not release schedule lock.", error);
    }
  }

  resetRunningLocks() {
    try {
      return this.resetLocksStatement.run().changes;
    } catch (error) {
      throw new ScheduleDataAccessError("Could not reset schedule locks.", error);
    }
  }
}

module.exports = {
  ScheduleDataAccessError,
  ScheduleDataValidationError,
  ScheduleRepository,
  computeNextRunAt,
  normalizeSchedule,
};

