const { detectionController } = require("../controllers/detection-controller");
const { healthController } = require("../controllers/health-controller");
const { HttpError } = require("../utils/http-error");

async function routeRequest(request, response, detectionService) {
  const { pathname } = new URL(request.url, "http://localhost");

  if (pathname === "/health") {
    if (request.method !== "GET") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }

    healthController(request, response);
    return;
  }

  if (pathname === "/api/v1/detect") {
    if (request.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }

    await detectionController(request, response, detectionService);
    return;
  }

  throw new HttpError(404, "NOT_FOUND", "Endpoint tidak ditemukan.");
}

module.exports = { routeRequest };
