const { readJsonBody } = require("../utils/read-json-body");
const { sendJson } = require("../utils/send-json");
const { HttpError } = require("../utils/http-error");

function normalizeSitePayload(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "INVALID_INPUT", "Body harus berupa object JSON.");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const status = body.status === undefined ? "active" : body.status;
  const maxDepth = body.maxDepth === undefined ? 1 : Number(body.maxDepth);
  const maxPages = body.maxPages === undefined ? 20 : Number(body.maxPages);
  const baselineHtml = body.baselineHtml === undefined ? null : body.baselineHtml;

  if (!name) {
    throw new HttpError(400, "INVALID_INPUT", "Field 'name' harus diisi.");
  }
  if (!url) {
    throw new HttpError(400, "INVALID_INPUT", "Field 'url' harus diisi.");
  }
  if (!/^(active|inactive)$/.test(String(status))) {
    throw new HttpError(400, "INVALID_INPUT", "Field 'status' harus 'active' atau 'inactive'.");
  }
  if (!Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 10) {
    throw new HttpError(400, "INVALID_INPUT", "Field 'maxDepth' harus bilangan bulat 0 sampai 10.");
  }
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 1000) {
    throw new HttpError(400, "INVALID_INPUT", "Field 'maxPages' harus bilangan bulat 1 sampai 1000.");
  }

  return {
    name,
    url,
    status,
    maxDepth,
    maxPages,
    baselineHtml,
  };
}

async function listSitesController(_request, response, sites) {
  sendJson(response, 200, { success: true, data: { sites: sites.findAll() } });
}

async function getSiteController(_request, response, sites, id) {
  let decodedId;
  try {
    decodedId = decodeURIComponent(id);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Site ID tidak valid.");
  }
  const site = sites.findById(decodedId);
  if (!site) {
    throw new HttpError(404, "NOT_FOUND", "Site tidak ditemukan.");
  }
  sendJson(response, 200, { success: true, data: { site } });
}

async function createSiteController(request, response, sites) {
  const body = await readJsonBody(request);
  const payload = normalizeSitePayload(body);
  const site = sites.create(payload);
  sendJson(response, 201, { success: true, data: { site } });
}

async function updateSiteController(request, response, sites, id) {
  let decodedId;
  try {
    decodedId = decodeURIComponent(id);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Site ID tidak valid.");
  }
  const body = await readJsonBody(request);
  const payload = normalizeSitePayload(body);
  const site = sites.update(decodedId, payload);
  if (!site) {
    throw new HttpError(404, "NOT_FOUND", "Site tidak ditemukan.");
  }
  sendJson(response, 200, { success: true, data: { site } });
}

async function deleteSiteController(_request, response, sites, id) {
  let decodedId;
  try {
    decodedId = decodeURIComponent(id);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Site ID tidak valid.");
  }
  if (!sites.deleteById(decodedId)) {
    throw new HttpError(404, "NOT_FOUND", "Site tidak ditemukan.");
  }
  sendJson(response, 200, { success: true, data: { deleted: true } });
}

async function scanSitesController(request, response, scan, sites, scanWorker) {
  const body = await readJsonBody(request);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "INVALID_INPUT", "Body harus berupa object JSON.");
  }

  const siteIds = Array.isArray(body.siteIds) ? body.siteIds : [];
  if (siteIds.length === 0) {
    throw new HttpError(400, "INVALID_INPUT", "Field 'siteIds' harus berisi setidaknya satu Site ID.");
  }

  const maxDepth = body.maxDepth === undefined ? 1 : Number(body.maxDepth);
  const maxPages = body.maxPages === undefined ? 20 : Number(body.maxPages);
  if (!Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 10) {
    throw new HttpError(400, "INVALID_INPUT", "Field 'maxDepth' harus bilangan bulat 0 sampai 10.");
  }
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 1000) {
    throw new HttpError(400, "INVALID_INPUT", "Field 'maxPages' harus bilangan bulat 1 sampai 1000.");
  }

  let officerEmail = null;
  if (body.officerEmail !== undefined && body.officerEmail !== null) {
    if (typeof body.officerEmail !== "string" || !body.officerEmail.trim()) {
      throw new HttpError(400, "INVALID_INPUT", "Email petugas tidak boleh kosong.");
    }
    const trimmed = body.officerEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new HttpError(400, "INVALID_INPUT", "Format email petugas tidak valid.");
    }
    officerEmail = trimmed;
  }

  if (body.background) {
    if (!scanWorker || typeof scanWorker.dispatchBatchScan !== "function") {
      throw new HttpError(503, "SERVICE_UNAVAILABLE", "Worker background scanning tidak aktif.");
    }
    if (!officerEmail) {
      throw new HttpError(400, "INVALID_INPUT", "Email petugas wajib diisi untuk pemindaian.");
    }
    const job = await scanWorker.dispatchBatchScan({
      siteIds,
      maxDepth,
      maxPages,
      officerEmail,
    });

    sendJson(response, 202, {
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        officerEmail: job.officerEmail,
        targetUrl: job.targetUrl,
        startedAt: job.startedAt,
        message: "Pemindaian situs massal telah dimulai di latar belakang. Anda dapat menutup browser.",
      },
    });
    return;
  }

  const selected = [];
  for (const siteId of siteIds) {
    const site = sites.findById(String(siteId));
    if (!site) continue;
    if (site.status !== "active") continue;
    selected.push(site);
  }

  if (selected.length === 0) {
    sendJson(response, 200, { success: true, data: { results: [], scanned: 0 } });
    return;
  }

  const results = [];
  for (const site of selected) {
    const baselinesByUrl = site.baselineHtml ? { [site.url]: site.baselineHtml } : {};
    const crawlerInput = {
      crawler: {
        startUrl: site.url,
        allowedHosts: [site.allowedHost],
        maxDepth,
        maxPages,
        requestDelayMs: 250,
        requestTimeoutMs: 10000,
      },
      baselinesByUrl,
      officerEmail,
    };
    const effectiveMaxDepth = body.maxDepth !== undefined ? Number(body.maxDepth) : (site.maxDepth ?? 1);
    const effectiveMaxPages = body.maxPages !== undefined ? Number(body.maxPages) : (site.maxPages ?? 20);
    crawlerInput.crawler.maxDepth = effectiveMaxDepth;
    crawlerInput.crawler.maxPages = effectiveMaxPages;
    try {
      const result = await scan(crawlerInput);
      const pages = result?.pages || [];
      const hasPages = pages.length > 0;
      const allSuccess = hasPages && pages.every((p) => p.crawl?.success === true);
      const allFailed = hasPages && pages.every((p) => p.crawl?.success === false);
      const scanOutcome = !hasPages || allFailed ? "failed" : allSuccess ? "success" : "partial";
      results.push({ siteId: site.id, siteName: site.name, url: site.url, status: "completed", scanOutcome, result });
    } catch (error) {
      results.push({
        siteId: site.id,
        siteName: site.name,
        url: site.url,
        status: "failed",
        scanOutcome: "failed",
        error: {
          code: error?.code || "SCAN_FAILED",
          message: error?.message || "Pemeriksaan situs gagal.",
        },
      });
    }
  }

  sendJson(response, 200, { success: true, data: { results, scanned: results.length } });
}

module.exports = {
  createSiteController,
  deleteSiteController,
  getSiteController,
  listSitesController,
  scanSitesController,
  updateSiteController,
};
