const { computeNextRunAt } = require("content-detection-data-access");

function createSchedulerService({
  dataAccess,
  scan,
  logger = console,
  pollIntervalMs = 15000,
  enabled = true,
}) {
  let timer = null;
  let running = false;

  async function executeSchedule(schedule) {
    const acquired = dataAccess.schedules.acquireLock(schedule.id);
    if (!acquired) {
      logger.info?.(`[Scheduler] Lock not acquired for schedule "${schedule.name}" (${schedule.id}), skipping.`);
      return null;
    }

    const startedAt = new Date().toISOString();
    logger.info?.(`[Scheduler] Starting execution for schedule "${schedule.name}" (${schedule.id}) at ${startedAt}`);

    let targetSites = [];
    try {
      if (schedule.targetType === "all_active") {
        targetSites = dataAccess.sites.findAll("active");
      } else {
        const ids = Array.isArray(schedule.siteIds) ? schedule.siteIds : [];
        targetSites = ids
          .map((id) => dataAccess.sites.findById(id))
          .filter((site) => site && site.status === "active");
      }
    } catch (err) {
      logger.error?.(`[Scheduler] Error retrieving sites for schedule "${schedule.name}":`, err);
    }

    if (targetSites.length === 0) {
      logger.warn?.(`[Scheduler] No active target sites found for schedule "${schedule.name}".`);
      const nextRunAt = computeNextRunAt(
        schedule.frequency,
        schedule.timeOfDay,
        schedule.dayOfWeek,
        schedule.dayOfMonth,
        schedule.timezone,
        new Date(),
      );
      dataAccess.schedules.releaseLock(schedule.id, {
        lastRunStatus: "partial",
        lastRunMessage: "Tidak ada website aktif yang dapat diperiksa.",
        nextRunAt,
        lastRunAt: startedAt,
      });
      return { scheduleId: schedule.id, status: "partial", results: [] };
    }

    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const site of targetSites) {
      const baselinesByUrl = site.baselineHtml ? { [site.url]: site.baselineHtml } : {};
      const crawlerInput = {
        crawler: {
          startUrl: site.url,
          allowedHosts: [site.allowedHost],
          maxDepth: site.maxDepth ?? 1,
          maxPages: site.maxPages ?? 20,
          requestDelayMs: 250,
          requestTimeoutMs: 10000,
        },
        baselinesByUrl,
        scanSource: "SCHEDULED",
      };

      try {
        const result = await scan(crawlerInput);
        const pages = result?.pages || [];
        const hasPages = pages.length > 0;
        const allSuccess = hasPages && pages.every((p) => p.crawl?.success === true);
        const allFailed = hasPages && pages.every((p) => p.crawl?.success === false);
        const scanOutcome = !hasPages || allFailed ? "failed" : allSuccess ? "success" : "partial";

        if (scanOutcome === "failed") {
          failedCount += 1;
        } else {
          successCount += 1;
        }

        results.push({
          siteId: site.id,
          siteName: site.name,
          url: site.url,
          status: "completed",
          scanOutcome,
          result,
        });
      } catch (error) {
        failedCount += 1;
        logger.error?.(`[Scheduler] Scan failed for site "${site.name}" (${site.url}):`, error.message);
        results.push({
          siteId: site.id,
          siteName: site.name,
          url: site.url,
          status: "failed",
          scanOutcome: "failed",
          error: {
            code: error?.code || "SCAN_FAILED",
            message: error?.message || "Pemeriksaan otomatis situs gagal.",
          },
        });
      }
    }

    const totalSites = targetSites.length;
    let overallOutcome = "success";
    if (successCount === 0) {
      overallOutcome = "failed";
    } else if (failedCount > 0) {
      overallOutcome = "partial";
    }

    const summaryMessage = `${successCount} dari ${totalSites} situs berhasil diperiksa${failedCount > 0 ? ` (${failedCount} gagal)` : ""}.`;

    const nextRunAt = computeNextRunAt(
      schedule.frequency,
      schedule.timeOfDay,
      schedule.dayOfWeek,
      schedule.dayOfMonth,
      schedule.timezone,
      new Date(),
    );

    dataAccess.schedules.releaseLock(schedule.id, {
      lastRunStatus: overallOutcome,
      lastRunMessage: summaryMessage,
      nextRunAt,
      lastRunAt: startedAt,
    });

    logger.info?.(`[Scheduler] Finished schedule "${schedule.name}" with outcome: ${overallOutcome}. Summary: ${summaryMessage}`);

    return {
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      status: overallOutcome,
      summary: summaryMessage,
      results,
    };
  }

  async function tick() {
    if (running) return;
    running = true;
    try {
      const nowIso = new Date().toISOString();
      const dueSchedules = dataAccess.schedules.findDue(nowIso);
      for (const schedule of dueSchedules) {
        await executeSchedule(schedule);
      }
    } catch (err) {
      logger.error?.("[Scheduler] Error in scheduler tick:", err);
    } finally {
      running = false;
    }
  }

  function start() {
    try {
      dataAccess.schedules.resetRunningLocks();
    } catch (e) {
      logger.warn?.("[Scheduler] Could not reset running locks on start:", e.message);
    }

    if (enabled && !timer) {
      timer = setInterval(tick, pollIntervalMs);
      logger.info?.(`[Scheduler] Scheduler service started with interval ${pollIntervalMs}ms.`);
      // Kick off an initial check shortly after startup
      setTimeout(tick, 1000);
    }
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
      logger.info?.("[Scheduler] Scheduler service stopped.");
    }
  }

  async function runScheduleNow(scheduleId) {
    const schedule = dataAccess.schedules.findById(scheduleId);
    if (!schedule) {
      throw new Error(`Jadwal dengan ID "${scheduleId}" tidak ditemukan.`);
    }
    return executeSchedule(schedule);
  }

  return {
    start,
    stop,
    tick,
    executeSchedule,
    runScheduleNow,
  };
}

module.exports = { createSchedulerService };
