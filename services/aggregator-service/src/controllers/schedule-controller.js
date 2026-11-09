const { readJsonBody } = require("../utils/read-json-body");
const { sendJson } = require("../utils/send-json");
const { HttpError } = require("../utils/http-error");

function normalizeSchedulePayload(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "INVALID_INPUT", "Body harus berupa object JSON.");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    throw new HttpError(400, "INVALID_INPUT", "Field 'name' (Nama jadwal) harus diisi.");
  }

  const targetType = body.targetType === "custom" ? "custom" : "all_active";
  const frequency = ["daily", "weekly", "monthly"].includes(body.frequency) ? body.frequency : "daily";

  const timeOfDay = typeof body.timeOfDay === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(body.timeOfDay.trim())
    ? body.timeOfDay.trim()
    : "02:00";

  let dayOfWeek = null;
  if (frequency === "weekly") {
    dayOfWeek = Number.isInteger(Number(body.dayOfWeek)) && Number(body.dayOfWeek) >= 0 && Number(body.dayOfWeek) <= 6
      ? Number(body.dayOfWeek)
      : 1;
  }

  let dayOfMonth = null;
  if (frequency === "monthly") {
    dayOfMonth = Number.isInteger(Number(body.dayOfMonth)) && Number(body.dayOfMonth) >= 1 && Number(body.dayOfMonth) <= 31
      ? Number(body.dayOfMonth)
      : 1;
  }

  const status = body.status === "inactive" ? "inactive" : "active";

  let siteIds = [];
  if (targetType === "custom") {
    if (Array.isArray(body.siteIds)) {
      siteIds = body.siteIds.map(String).filter(Boolean);
    }
    if (siteIds.length === 0) {
      throw new HttpError(400, "INVALID_INPUT", "Pilih setidaknya satu situs untuk jadwal dengan target situs tertentu.");
    }
  }

  return {
    name,
    targetType,
    siteIds,
    frequency,
    timeOfDay,
    dayOfWeek,
    dayOfMonth,
    timezone: "Asia/Makassar",
    status,
  };
}

async function listSchedulesController(request, response, schedules) {
  const all = schedules.findAll();
  sendJson(response, 200, { success: true, data: { schedules: all } });
}

async function getScheduleController(request, response, schedules, id) {
  let decodedId;
  try {
    decodedId = decodeURIComponent(id);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Schedule ID tidak valid.");
  }
  const schedule = schedules.findById(decodedId);
  if (!schedule) {
    throw new HttpError(404, "NOT_FOUND", "Jadwal pemeriksaan tidak ditemukan.");
  }
  sendJson(response, 200, { success: true, data: { schedule } });
}

async function createScheduleController(request, response, schedules) {
  const body = await readJsonBody(request);
  const payload = normalizeSchedulePayload(body);
  const schedule = schedules.create(payload);
  sendJson(response, 201, { success: true, data: { schedule } });
}

async function updateScheduleController(request, response, schedules, id) {
  let decodedId;
  try {
    decodedId = decodeURIComponent(id);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Schedule ID tidak valid.");
  }
  const body = await readJsonBody(request);

  // Partial update support for quick status toggle
  if (body.status !== undefined && Object.keys(body).length <= 2) {
    const status = body.status === "inactive" ? "inactive" : "active";
    const updated = schedules.update(decodedId, { status });
    if (!updated) {
      throw new HttpError(404, "NOT_FOUND", "Jadwal pemeriksaan tidak ditemukan.");
    }
    sendJson(response, 200, { success: true, data: { schedule: updated } });
    return;
  }

  const payload = normalizeSchedulePayload(body);
  const updated = schedules.update(decodedId, payload);
  if (!updated) {
    throw new HttpError(404, "NOT_FOUND", "Jadwal pemeriksaan tidak ditemukan.");
  }
  sendJson(response, 200, { success: true, data: { schedule: updated } });
}

async function deleteScheduleController(request, response, schedules, id) {
  let decodedId;
  try {
    decodedId = decodeURIComponent(id);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Schedule ID tidak valid.");
  }
  const deleted = schedules.deleteById(decodedId);
  if (!deleted) {
    throw new HttpError(404, "NOT_FOUND", "Jadwal pemeriksaan tidak ditemukan.");
  }
  sendJson(response, 200, { success: true, data: { deleted: true } });
}

async function runScheduleNowController(request, response, scheduler, id) {
  let decodedId;
  try {
    decodedId = decodeURIComponent(id);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Schedule ID tidak valid.");
  }
  try {
    const outcome = await scheduler.runScheduleNow(decodedId);
    sendJson(response, 200, { success: true, data: outcome });
  } catch (err) {
    throw new HttpError(400, "SCHEDULE_EXECUTION_FAILED", err.message);
  }
}

module.exports = {
  createScheduleController,
  deleteScheduleController,
  getScheduleController,
  listSchedulesController,
  runScheduleNowController,
  updateScheduleController,
};

