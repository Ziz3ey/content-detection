const { HttpError } = require("../utils/http-error");
const { sendJson } = require("../utils/send-json");

function recentScansController(request, response, scans) {
  const parsedUrl = new URL(request.url, "http://localhost");
  const limitValue = parsedUrl.searchParams.get("limit");
  const sourceValue = parsedUrl.searchParams.get("source")?.toUpperCase();
  const limit = limitValue === null ? undefined : Number(limitValue);
  if (
    limit !== undefined &&
    (!Number.isInteger(limit) || limit < 1 || limit > 100)
  ) {
    throw new HttpError(
      400,
      "INVALID_INPUT",
      "Query 'limit' harus berupa bilangan bulat 1 sampai 100.",
    );
  }

  const options = {};
  if (sourceValue === "MANUAL" || sourceValue === "SCHEDULED") {
    options.scanSource = sourceValue;
  }

  sendJson(response, 200, {
    success: true,
    data: { scans: scans.findRecent(limit, options) },
  });
}

function scanByIdController(_request, response, scans, id, notifications) {
  let decodedId;
  try {
    decodedId = decodeURIComponent(id);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Scan ID tidak valid.");
  }

  const scan = scans.findById(decodedId);
  if (!scan) {
    throw new HttpError(404, "NOT_FOUND", "Scan tidak ditemukan.");
  }

  const emailNotification =
    notifications && typeof notifications.findByScanId === "function"
      ? notifications.findByScanId(decodedId, "email")
      : null;

  sendJson(response, 200, {
    success: true,
    data: {
      scan,
      emailNotification,
    },
  });
}

function deleteScanController(_request, response, scans, id) {
  let decodedId;
  try {
    decodedId = decodeURIComponent(id);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Scan ID tidak valid.");
  }

  if (!/^[A-Za-z0-9_-]{1,128}$/.test(decodedId)) {
    throw new HttpError(400, "INVALID_INPUT", "Scan ID tidak valid.");
  }

  const deleted = scans.deleteById(decodedId);
  if (!deleted) {
    throw new HttpError(404, "NOT_FOUND", "Scan tidak ditemukan.");
  }

  sendJson(response, 200, { success: true, data: { deleted: true } });
}

async function resendEmailController(_request, response, notificationService, id) {
  if (!notificationService || typeof notificationService.retryScanNotification !== "function") {
    throw new HttpError(503, "SERVICE_UNAVAILABLE", "Layanan notifikasi email tidak aktif.");
  }

  let decodedId;
  try {
    decodedId = decodeURIComponent(id);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Scan ID tidak valid.");
  }

  try {
    const result = await notificationService.retryScanNotification(decodedId);
    sendJson(response, 200, { success: true, data: result });
  } catch (error) {
    if (error.code === "SCAN_NOT_FOUND") {
      throw new HttpError(404, "NOT_FOUND", "Scan tidak ditemukan.");
    }
    throw new HttpError(500, "NOTIFICATION_FAILED", error.message);
  }
}

function listScanJobsController(request, response, scanWorker) {
  if (!scanWorker || typeof scanWorker.listJobs !== "function") {
    sendJson(response, 200, { success: true, data: { jobs: [] } });
    return;
  }

  const parsedUrl = new URL(request.url, "http://localhost");
  const limitValue = parsedUrl.searchParams.get("limit");
  const status = parsedUrl.searchParams.get("status") || undefined;
  const officerEmail = parsedUrl.searchParams.get("officerEmail") || undefined;
  const limit = limitValue ? Number(limitValue) : 20;

  const jobs = scanWorker.listJobs(limit, { status, officerEmail });
  sendJson(response, 200, { success: true, data: { jobs } });
}

function getScanJobController(_request, response, scanWorker, jobId) {
  if (!scanWorker || typeof scanWorker.getJob !== "function") {
    throw new HttpError(503, "SERVICE_UNAVAILABLE", "Worker scan tidak tersedia.");
  }

  let decodedId;
  try {
    decodedId = decodeURIComponent(jobId);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Job ID tidak valid.");
  }

  const job = scanWorker.getJob(decodedId);
  if (!job) {
    throw new HttpError(404, "NOT_FOUND", "Pekerjaan pemindaian tidak ditemukan.");
  }

  sendJson(response, 200, { success: true, data: { job } });
}

module.exports = {
  deleteScanController,
  getScanJobController,
  listScanJobsController,
  recentScansController,
  resendEmailController,
  scanByIdController,
};
