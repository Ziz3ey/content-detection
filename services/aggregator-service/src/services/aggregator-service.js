const { DownstreamError } = require("../clients/json-service-client");

const LINK_DETECTION_CONCURRENCY = 5;

function serviceResult(result, serviceName, logger) {
  if (result.status === "fulfilled") {
    return result.value;
  }

  const error =
    result.reason instanceof DownstreamError
      ? result.reason
      : new DownstreamError(
          "SERVICE_UNAVAILABLE",
          "Downstream service is unavailable.",
        );
  logger.warn?.(`${serviceName} request failed: ${error.code}.`);

  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
  };
}

async function callDetector(serviceName, operation, logger) {
  logger.info?.(`Detector request started: ${serviceName}.`);
  try {
    const result = await operation();
    logger.info?.(`Detector response received: ${serviceName}.`);
    return result;
  } catch (error) {
    logger.warn?.(
      `Detector request failed: ${serviceName} (${error.code || "INTERNAL_ERROR"}).`,
    );
    throw error;
  }
}

async function settleWithConcurrency(values, concurrency, operation) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      try {
        results[index] = {
          status: "fulfilled",
          value: await operation(values[index]),
        };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  const workerCount = Math.min(concurrency, values.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

function createAggregatorService(clients, logger = console) {
  return async function analyze(input) {
    const links = Array.isArray(input.links) ? input.links : [];
    const defacementRequest = input.skipDefacement
      ? Promise.resolve(null)
      : callDetector(
          "defacement",
          () => clients.defacement.detect(input.html, input.baseline),
          logger,
        );
    const linkDetectionRequest = (async () => {
      const results = await settleWithConcurrency(
        links,
        LINK_DETECTION_CONCURRENCY,
        (url) =>
          callDetector(
            "linkDetection",
            () => clients.linkDetection.detect(url),
            logger,
          ),
      );
      const linkResults = results.map((result, index) => {
        if (result.status === "fulfilled") {
          const detection = result.value.data;
          return {
            url: links[index],
            detected: detection.detected,
            indicators: detection.indicators,
          };
        }

        return {
          url: links[index],
          ...serviceResult(result, "linkDetection", logger),
        };
      });

      return {
        success: true,
        data: {
          detected: linkResults.some(
            (link) => Array.isArray(link.indicators) && link.indicators.length > 0,
          ),
          links: linkResults,
        },
      };
    })();
    const results = await Promise.allSettled([
      callDetector(
        "textDetection",
        () => clients.textDetection.detect(input.text),
        logger,
      ),
      defacementRequest,
      linkDetectionRequest,
    ]);

    return {
      url: input.url,
      textDetection: serviceResult(results[0], "textDetection", logger),
      defacementDetection: serviceResult(
        results[1],
        "defacementDetection",
        logger,
      ),
      linkDetection: serviceResult(results[2], "linkDetection", logger),
    };
  };
}

module.exports = { createAggregatorService };
