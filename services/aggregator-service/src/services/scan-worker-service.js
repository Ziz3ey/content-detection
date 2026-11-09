const { randomUUID } = require("node:crypto");

function createScanWorkerService({
  scanJobs,
  scan,
  sites,
  notificationService,
  logger = console,
}) {
  // Pulihkan job yang menggantung jika server sempat restart/mati
  if (scanJobs && typeof scanJobs.findRunning === "function") {
    try {
      const dangling = scanJobs.findRunning();
      for (const job of dangling) {
        logger.warn?.(`[ScanWorker] Menandai job menggantung ${job.id} sebagai failed (server restart).`);
        scanJobs.update(job.id, {
          status: "failed",
          errorMessage: "Proses pemindaian terhenti karena server/backend mengalami restart.",
          completedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      logger.error?.("[ScanWorker] Gagal memulihkan status job running:", err.message);
    }
  }

  /**
   * Menjalankan pemindaian single URL secara asinkron di latar belakang.
   */
  async function dispatchSingleScan({ input, officerEmail }) {
    const jobId = `job-${randomUUID().substring(0, 12)}`;
    const startUrl = input.crawler.startUrl;
    const startedAt = new Date().toISOString();

    const job = scanJobs.create({
      id: jobId,
      type: "single",
      targetUrl: startUrl,
      officerEmail,
      status: "running",
      progressScanned: 0,
      progressTotal: input.crawler.maxPages || 1,
      startedAt,
    });

    logger.info?.(`[ScanWorker] Background single scan job dibuat: ${jobId} untuk ${startUrl} [Petugas: ${officerEmail}]`);

    // Jalankan secara asinkron terlepas dari request HTTP
    setImmediate(async () => {
      try {
        const scanResult = await scan({
          ...input,
          officerEmail,
          startedAt,
        });

        const pages = scanResult?.pages || [];
        const indicationsCount = pages.filter((p) => {
          const textDet = p.textDetection?.data?.detected === true;
          const linkDet = p.linkDetection?.data?.detected === true;
          const defDet = p.defacementDetection?.data?.detected === true;
          return textDet || linkDet || defDet;
        }).length;

        scanJobs.update(jobId, {
          status: "completed",
          progressScanned: pages.length,
          progressTotal: pages.length,
          resultSummary: {
            startUrl,
            totalPages: pages.length,
            indicationsCount,
            pages,
            emailNotification: scanResult?.emailNotification || null,
          },
          completedAt: new Date().toISOString(),
        });

        logger.info?.(`[ScanWorker] Job ${jobId} selesai. ${pages.length} halaman dipindai, ${indicationsCount} terindikasi.`);
      } catch (error) {
        logger.error?.(`[ScanWorker] Job ${jobId} gagal:`, error.message);
        scanJobs.update(jobId, {
          status: "failed",
          errorMessage: error.message || "Pemindaian latar belakang gagal.",
          completedAt: new Date().toISOString(),
        });
      }
    });

    return job;
  }

  /**
   * Menjalankan pemindaian beberapa situs terdaftar secara asinkron di latar belakang.
   */
  async function dispatchBatchScan({ siteIds, maxDepth, maxPages, officerEmail }) {
    const jobId = `job-batch-${randomUUID().substring(0, 12)}`;
    const startedAt = new Date().toISOString();

    const selectedSites = [];
    for (const siteId of siteIds) {
      const site = sites.findById(String(siteId));
      if (site && site.status === "active") {
        selectedSites.push(site);
      }
    }

    const job = scanJobs.create({
      id: jobId,
      type: "batch",
      targetUrl: selectedSites.map((s) => s.name).join(", ") || "Batch Sites",
      officerEmail,
      status: "running",
      progressScanned: 0,
      progressTotal: selectedSites.length,
      startedAt,
    });

    logger.info?.(`[ScanWorker] Background batch scan job dibuat: ${jobId} untuk ${selectedSites.length} situs [Petugas: ${officerEmail}]`);

    setImmediate(async () => {
      const results = [];
      let totalPagesAllSites = 0;
      let totalIndicationsAllSites = 0;

      for (let i = 0; i < selectedSites.length; i++) {
        const site = selectedSites[i];
        const baselinesByUrl = site.baselineHtml ? { [site.url]: site.baselineHtml } : {};
        const effectiveMaxDepth = maxDepth !== undefined ? Number(maxDepth) : (site.maxDepth ?? 1);
        const effectiveMaxPages = maxPages !== undefined ? Number(maxPages) : (site.maxPages ?? 20);

        const crawlerInput = {
          crawler: {
            startUrl: site.url,
            allowedHosts: [site.allowedHost],
            maxDepth: effectiveMaxDepth,
            maxPages: effectiveMaxPages,
            requestDelayMs: 250,
            requestTimeoutMs: 10000,
          },
          baselinesByUrl,
          officerEmail,
          startedAt,
        };

        try {
          const scanResult = await scan(crawlerInput);
          const pages = scanResult?.pages || [];
          totalPagesAllSites += pages.length;

          const hasPages = pages.length > 0;
          const allSuccess = hasPages && pages.every((p) => p.crawl?.success === true);
          const allFailed = hasPages && pages.every((p) => p.crawl?.success === false);
          const scanOutcome = !hasPages || allFailed ? "failed" : allSuccess ? "success" : "partial";

          const siteIndications = pages.filter((p) => {
            const textDet = p.textDetection?.data?.detected === true;
            const linkDet = p.linkDetection?.data?.detected === true;
            const defDet = p.defacementDetection?.data?.detected === true;
            return textDet || linkDet || defDet;
          }).length;
          totalIndicationsAllSites += siteIndications;

          results.push({
            siteId: site.id,
            siteName: site.name,
            url: site.url,
            status: "completed",
            scanOutcome,
            result: scanResult,
          });
        } catch (err) {
          logger.error?.(`[ScanWorker] Batch scan error untuk site ${site.name}:`, err.message);
          results.push({
            siteId: site.id,
            siteName: site.name,
            url: site.url,
            status: "failed",
            scanOutcome: "failed",
            error: { code: err.code || "SCAN_FAILED", message: err.message },
          });
        }

        scanJobs.update(jobId, {
          progressScanned: i + 1,
        });
      }

      scanJobs.update(jobId, {
        status: "completed",
        progressScanned: selectedSites.length,
        progressTotal: selectedSites.length,
        resultSummary: {
          results,
          scanned: results.length,
          totalPages: totalPagesAllSites,
          indicationsCount: totalIndicationsAllSites,
        },
        completedAt: new Date().toISOString(),
      });

      logger.info?.(`[ScanWorker] Batch job ${jobId} selesai. ${results.length} situs diproses.`);
    });

    return job;
  }

  function getJob(jobId) {
    return scanJobs.findById(jobId);
  }

  function listJobs(limit = 20, options = {}) {
    return scanJobs.findRecent(limit, options);
  }

  function getActiveJobs() {
    return scanJobs.findRunning();
  }

  return {
    dispatchSingleScan,
    dispatchBatchScan,
    getJob,
    listJobs,
    getActiveJobs,
  };
}

module.exports = { createScanWorkerService };
