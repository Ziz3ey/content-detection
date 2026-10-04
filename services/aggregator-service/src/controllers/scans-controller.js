const { HttpError } = require("../utils/http-error");
const { sendJson } = require("../utils/send-json");

function recentScansController(request, response, scans) {
  const limitValue = new URL(request.url, "http://localhost").searchParams.get(
    "limit",
  );
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

  sendJson(response, 200, {
    success: true,
    data: { scans: scans.findRecent(limit) },
  });
}

function scanByIdController(_request, response, scans, id) {
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

  sendJson(response, 200, { success: true, data: { scan } });
}

module.exports = { recentScansController, scanByIdController };
