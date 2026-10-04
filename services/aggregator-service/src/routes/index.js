const { analyzeController } = require("../controllers/analyze-controller");
const { healthController } = require("../controllers/health-controller");
const { scanController } = require("../controllers/scan-controller");
const {
  recentScansController,
  scanByIdController,
} = require("../controllers/scans-controller");
const { HttpError } = require("../utils/http-error");

async function routeRequest(request, response, analyze, scan, scans) {
  const { pathname } = new URL(request.url, "http://localhost");

  if (pathname === "/health") {
    if (request.method !== "GET") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    healthController(request, response);
    return;
  }

  if (pathname === "/api/v1/analyze") {
    if (request.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    await analyzeController(request, response, analyze);
    return;
  }

  if (pathname === "/api/v1/scan") {
    if (request.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    await scanController(request, response, scan);
    return;
  }

  if (pathname === "/api/v1/scans/recent") {
    if (request.method !== "GET") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    recentScansController(request, response, scans);
    return;
  }

  const scanMatch = pathname.match(/^\/api\/v1\/scans\/([^/]+)$/);
  if (scanMatch) {
    if (request.method !== "GET") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    scanByIdController(request, response, scans, scanMatch[1]);
    return;
  }

  throw new HttpError(404, "NOT_FOUND", "Endpoint tidak ditemukan.");
}

module.exports = { routeRequest };
