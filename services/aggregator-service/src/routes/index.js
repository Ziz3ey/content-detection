const { analyzeController } = require("../controllers/analyze-controller");
const { healthController } = require("../controllers/health-controller");
const { scanController } = require("../controllers/scan-controller");
const {
  deleteScanController,
  getScanJobController,
  listScanJobsController,
  recentScansController,
  resendEmailController,
  scanByIdController,
} = require("../controllers/scans-controller");
const {
  createSiteController,
  deleteSiteController,
  getSiteController,
  listSitesController,
  scanSitesController,
  updateSiteController,
} = require("../controllers/site-controller");
const {
  createScheduleController,
  deleteScheduleController,
  getScheduleController,
  listSchedulesController,
  runScheduleNowController,
  updateScheduleController,
} = require("../controllers/schedule-controller");
const {
  loginController,
  logoutController,
  sessionController,
} = require("../controllers/auth-controller");
const { HttpError } = require("../utils/http-error");
const { sendJson } = require("../utils/send-json");

async function routeRequest(
  request,
  response,
  analyze,
  scan,
  scans,
  sites,
  auth,
  schedules,
  scheduler,
  notificationService,
  notifications,
  scanWorker,
) {
  const { pathname } = new URL(request.url, "http://localhost");

  // Health check - public endpoint
  if (pathname === "/health") {
    if (request.method !== "GET") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    healthController(request, response);
    return;
  }

  // Authentication endpoints
  if (pathname === "/api/v1/auth/login") {
    if (request.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    await loginController(request, response, auth);
    return;
  }

  if (pathname === "/api/v1/auth/session") {
    if (request.method !== "GET") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    sessionController(request, response, auth);
    return;
  }

  // All routes below require admin authentication
  const session = auth.authenticate(request);
  if (!session) {
    throw new HttpError(401, "UNAUTHORIZED", "Silakan login sebagai Admin.");
  }

  if (pathname === "/api/v1/auth/logout") {
    if (request.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    logoutController(request, response, auth);
    return;
  }

  // Analyze endpoint (direct detector invocation)
  if (pathname === "/api/v1/analyze") {
    if (request.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    await analyzeController(request, response, analyze);
    return;
  }

  // Single URL Scan endpoint (with baselines & background worker support)
  if (pathname === "/api/v1/scan") {
    if (request.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    await scanController(request, response, scan, scanWorker);
    return;
  }

  // Batch Site Scan endpoint (scans multiple registered sites with site-specific baselines)
  if (pathname === "/api/v1/scan-sites") {
    if (request.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    await scanSitesController(request, response, scan, sites, scanWorker);
    return;
  }

  // Background Scan Jobs endpoints
  if (pathname === "/api/v1/scans/jobs") {
    if (request.method !== "GET") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    listScanJobsController(request, response, scanWorker);
    return;
  }

  const jobMatch = pathname.match(/^\/api\/v1\/scans\/jobs\/([^/]+)$/);
  if (jobMatch) {
    if (request.method !== "GET") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    getScanJobController(request, response, scanWorker, jobMatch[1]);
    return;
  }

  // Site Management endpoints
  if (pathname === "/api/v1/sites") {
    if (request.method === "GET") {
      await listSitesController(request, response, sites);
      return;
    }
    if (request.method === "POST") {
      await createSiteController(request, response, sites);
      return;
    }
    throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
  }

  // Schedule Management collection endpoints
  if (pathname === "/api/v1/schedules") {
    if (request.method === "GET") {
      await listSchedulesController(request, response, schedules);
      return;
    }
    if (request.method === "POST") {
      await createScheduleController(request, response, schedules);
      return;
    }
    throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
  }

  // Recent Scans history endpoint
  if (pathname === "/api/v1/scans/recent") {
    if (request.method !== "GET") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    recentScansController(request, response, scans);
    return;
  }

  // Notifications history endpoint
  if (pathname === "/api/v1/notifications") {
    if (request.method !== "GET") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    const list =
      notifications && typeof notifications.listRecent === "function"
        ? notifications.listRecent(50)
        : [];
    sendJson(response, 200, { success: true, data: { notifications: list } });
    return;
  }

  // Run schedule immediately endpoint: /api/v1/schedules/:id/run-now
  const scheduleRunMatch = pathname.match(/^\/api\/v1\/schedules\/([^/]+)\/run-now$/);
  if (scheduleRunMatch) {
    if (request.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    await runScheduleNowController(request, response, scheduler, scheduleRunMatch[1]);
    return;
  }

  // Resend email notification endpoint: /api/v1/scans/:id/resend-email
  const resendMatch = pathname.match(/^\/api\/v1\/scans\/([^/]+)\/resend-email$/);
  if (resendMatch) {
    if (request.method !== "POST") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    await resendEmailController(request, response, notificationService, resendMatch[1]);
    return;
  }

  // Single Schedule item endpoints: /api/v1/schedules/:id
  const scheduleMatch = pathname.match(/^\/api\/v1\/schedules\/([^/]+)$/);
  if (scheduleMatch) {
    if (request.method === "GET") {
      await getScheduleController(request, response, schedules, scheduleMatch[1]);
      return;
    }
    if (request.method === "PUT") {
      await updateScheduleController(request, response, schedules, scheduleMatch[1]);
      return;
    }
    if (request.method === "DELETE") {
      await deleteScheduleController(request, response, schedules, scheduleMatch[1]);
      return;
    }
    throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
  }

  // Single Site item endpoints: /api/v1/sites/:id (includes baselineHtml update)
  const siteMatch = pathname.match(/^\/api\/v1\/sites\/([^/]+)$/);
  if (siteMatch) {
    if (request.method === "GET") {
      await getSiteController(request, response, sites, siteMatch[1]);
      return;
    }
    if (request.method === "PUT") {
      await updateSiteController(request, response, sites, siteMatch[1]);
      return;
    }
    if (request.method === "DELETE") {
      await deleteSiteController(request, response, sites, siteMatch[1]);
      return;
    }
    throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
  }

  // Single Scan item endpoints: /api/v1/scans/:id
  const scanMatch = pathname.match(/^\/api\/v1\/scans\/([^/]+)$/);
  if (scanMatch) {
    if (request.method === "DELETE") {
      deleteScanController(request, response, scans, scanMatch[1]);
      return;
    }
    if (request.method !== "GET") {
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method tidak diizinkan.");
    }
    scanByIdController(request, response, scans, scanMatch[1], notifications);
    return;
  }

  throw new HttpError(404, "NOT_FOUND", "Endpoint tidak ditemukan.");
}

module.exports = { routeRequest };
