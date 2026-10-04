const { DownstreamError } = require("../clients/json-service-client");

function detectorFailure(code, message) {
  return { success: false, error: { code, message } };
}

function detectorStatus(result) {
  if (result === null) {
    return "skipped";
  }
  return result.success === true ? "success" : "failed";
}

function createScanService({
  crawlerClient,
  analyze,
  scans,
  logger = console,
}) {
  return async function scan(input) {
    logger.info?.("Scan started.");
    const crawlResponse = await crawlerClient.crawl(input.crawler);
    const pages = crawlResponse.data.pages;
    logger.info?.(`Crawler returned ${pages.length} page result(s).`);

    const responsePages = [];
    const records = [];

    for (const page of pages) {
      let detections;
      const baselineHtml = input.baselinesByUrl[page.url];

      if (!page.success) {
        const failure = detectorFailure(
          "CRAWL_FAILED",
          "Detectors were not run because crawling failed.",
        );
        detections = {
          textDetection: failure,
          defacementDetection: failure,
          linkDetection: failure,
        };
      } else {
        try {
          detections = await analyze({
            url: page.url,
            text: page.text,
            html: page.html,
            links: Array.isArray(page.links) ? page.links : [],
            ...(baselineHtml === undefined
              ? { skipDefacement: true }
              : { baseline: { html: baselineHtml } }),
          });
        } catch (error) {
          const message =
            error instanceof DownstreamError
              ? error.message
              : "Detector orchestration failed.";
          const failure = detectorFailure(
            error.code || "DETECTOR_ORCHESTRATION_FAILED",
            message,
          );
          detections = {
            textDetection: failure,
            defacementDetection: failure,
            linkDetection: failure,
          };
        }
      }

      if (baselineHtml === undefined && page.success) {
        detections.defacementDetection = detectorFailure(
          "BASELINE_NOT_PROVIDED",
          "Defacement indication was skipped because no baseline was supplied for this URL.",
        );
      }

      const crawlStatus = page.success ? "success" : "failed";
      const textResult = page.success ? detections.textDetection : null;
      const defacementResult =
        page.success && baselineHtml !== undefined
          ? detections.defacementDetection
          : null;
      const linkResult = page.success ? detections.linkDetection : null;
      const record = {
        url: page.url,
        scannedAt: new Date().toISOString(),
        crawlStatus,
        httpStatus: page.status,
        contentType: page.contentType,
        title: page.title,
        crawlMetadata: {
          depth: page.depth,
          links: page.links || [],
          error: page.error || null,
        },
        textDetection: textResult,
        defacementDetection: defacementResult,
        defacementDetectionStatus:
          baselineHtml === undefined
            ? "skipped"
            : detectorStatus(defacementResult),
        linkDetection: linkResult,
      };
      records.push(record);
      responsePages.push({
        url: page.url,
        crawl: {
          status: page.status,
          contentType: page.contentType,
          title: page.title,
          depth: page.depth,
          success: page.success,
          ...(page.error ? { error: page.error } : {}),
        },
        textDetection: detections.textDetection,
        defacementDetection: detections.defacementDetection,
        linkDetection: detections.linkDetection,
      });
    }

    logger.info?.(`Persisting ${records.length} scan record(s).`);
    const savedRecords = scans.createMany(records);
    logger.info?.(`Scan completed: ${savedRecords.length} record(s) saved.`);

    return {
      startUrl: input.crawler.startUrl,
      pages: responsePages.map((page, index) => ({
        ...page,
        id: savedRecords[index].id,
        scannedAt: savedRecords[index].scannedAt,
      })),
    };
  };
}

module.exports = { createScanService };
