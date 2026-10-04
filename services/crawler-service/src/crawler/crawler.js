const { validateCrawlerConfig } = require("../config/crawler-config");
const { loadTextDetectionConfig } = require("../config/text-detection-config");
const { TextDetectionClient } = require("../client/text-detection-client");
const { fetchResource } = require("../fetcher/http-fetcher");
const { createRateLimitedFetch } = require("../fetcher/rate-limited-fetch");
const { parseHtml } = require("../parser/html-parser");
const { CrawlerError } = require("../utils/crawler-error");
const {
  isAllowedUrl,
  normalizeUrl,
  sanitizeUrlForLog,
} = require("../utils/url");
const { isAllowedByRobots, parseRobotsTxt } = require("./robots-txt");

function errorDetails(error) {
  if (error.name === "TimeoutError" || error.name === "AbortError") {
    return { code: "REQUEST_TIMEOUT", message: "Request timeout." };
  }

  if (error instanceof CrawlerError) {
    return { code: error.code, message: error.message };
  }

  return { code: "REQUEST_FAILED", message: "Request failed." };
}

function createFailedPage(url, depth, error, status = null, contentType = "") {
  return {
    url,
    status,
    contentType,
    depth,
    success: false,
    error,
  };
}

function logFailure(logger, url, error) {
  if (typeof logger.error === "function") {
    logger.error(
      `Crawler could not process ${sanitizeUrlForLog(url)}: ${error.code}`,
    );
  }
}

function detectionFailure(error) {
  const messages = {
    TEXT_DETECTION_TIMEOUT: "Text Detection Service request timed out.",
    TEXT_DETECTION_HTTP_ERROR: "Text Detection Service returned an HTTP error.",
    TEXT_DETECTION_INVALID_RESPONSE:
      "Text Detection Service returned an invalid response.",
    TEXT_DETECTION_UNAVAILABLE: "Text Detection Service is unavailable.",
  };
  const code = Object.hasOwn(messages, error.code)
    ? error.code
    : "TEXT_DETECTION_UNAVAILABLE";

  return {
    success: false,
    error: { code, message: messages[code] },
  };
}

async function crawl(config, dependencies = {}) {
  const crawlerConfig = validateCrawlerConfig(config);
  const logger = dependencies.logger || console;
  const fetchImpl = dependencies.fetchImpl || globalThis.fetch;
  const textDetectionClient = dependencies.skipTextDetection
    ? null
    : dependencies.textDetectionClient ||
      new TextDetectionClient(
        dependencies.textDetectionConfig ||
          loadTextDetectionConfig(dependencies.environment),
        { fetchImpl: dependencies.textDetectionFetchImpl, logger },
      );
  const fetchWithDelay = createRateLimitedFetch(
    fetchImpl,
    crawlerConfig.requestDelayMs,
    dependencies.now,
    dependencies.sleep,
  );
  const queue = [{ url: crawlerConfig.startUrl, depth: 0 }];
  const visitedUrls = new Set([crawlerConfig.startUrl]);
  const completedUrls = new Set();
  const robotsCache = new Map();
  const results = [];
  let processedPages = 0;

  async function robotsPolicyFor(pageUrl) {
    const hostname = new URL(pageUrl).hostname;
    if (robotsCache.has(hostname)) {
      return robotsCache.get(hostname);
    }

    let policy;
    try {
      const robotsUrl = normalizeUrl("/robots.txt", pageUrl);
      const response = await fetchResource(robotsUrl, {
        allowedHosts: crawlerConfig.allowedHosts,
        timeoutMs: crawlerConfig.requestTimeoutMs,
        fetchImpl: fetchWithDelay,
      });

      if (response.status === 404 || response.status === 410) {
        policy = { available: true, rules: [] };
      } else if (!response.ok) {
        policy = { available: false, rules: [] };
      } else {
        policy = {
          available: true,
          rules: parseRobotsTxt(response.body),
        };
      }
    } catch (error) {
      const details = errorDetails(error);
      logFailure(logger, `${new URL(pageUrl).origin}/robots.txt`, details);
      policy = { available: false, rules: [] };
    }

    robotsCache.set(hostname, policy);
    return policy;
  }

  while (queue.length > 0 && processedPages < crawlerConfig.maxPages) {
    const current = queue.shift();
    if (completedUrls.has(current.url)) {
      continue;
    }
    processedPages += 1;
    logger.info?.(`Crawling URL: ${sanitizeUrlForLog(current.url)}`);

    const robotsPolicy = await robotsPolicyFor(current.url);
    if (!robotsPolicy.available) {
      const error = {
        code: "ROBOTS_UNAVAILABLE",
        message: "robots.txt could not be checked; the host was blocked.",
      };
      logFailure(logger, current.url, error);
      results.push(createFailedPage(current.url, current.depth, error));
      completedUrls.add(current.url);
      continue;
    }

    if (!isAllowedByRobots(current.url, robotsPolicy.rules)) {
      const error = {
        code: "ROBOTS_DISALLOWED",
        message: "The requested path is disallowed by robots.txt.",
      };
      results.push(createFailedPage(current.url, current.depth, error));
      completedUrls.add(current.url);
      continue;
    }

    let response;
    try {
      response = await fetchResource(current.url, {
        allowedHosts: crawlerConfig.allowedHosts,
        timeoutMs: crawlerConfig.requestTimeoutMs,
        fetchImpl: fetchWithDelay,
        expectedContentType: "text/html",
      });
    } catch (error) {
      const details = errorDetails(error);
      logFailure(logger, current.url, details);
      results.push(createFailedPage(current.url, current.depth, details));
      completedUrls.add(current.url);
      continue;
    }

    if (!response.ok) {
      logFailure(logger, current.url, response.error);
      results.push(
        createFailedPage(
          current.url,
          current.depth,
          response.error,
          response.status,
          response.contentType,
        ),
      );
      completedUrls.add(current.url);
      continue;
    }

    let page;
    try {
      page = parseHtml(response.body);
    } catch (error) {
      const details = {
        code: "HTML_PARSE_FAILED",
        message: "HTML could not be parsed.",
      };
      logFailure(logger, current.url, details);
      results.push(
        createFailedPage(
          current.url,
          current.depth,
          details,
          response.status,
          response.contentType,
        ),
      );
      completedUrls.add(current.url);
      continue;
    }

    const pageLinks = [];
    const pageLinkSet = new Set();
    for (const rawLink of page.links) {
      let link;
      try {
        link = normalizeUrl(rawLink, response.finalUrl);
      } catch {
        continue;
      }

      if (pageLinkSet.has(link)) {
        continue;
      }

      pageLinkSet.add(link);
      pageLinks.push(link);

      if (!isAllowedUrl(link, crawlerConfig.allowedHosts)) {
        continue;
      }

      const nextDepth = current.depth + 1;
      if (
        current.depth < crawlerConfig.maxDepth &&
        !visitedUrls.has(link) &&
        !completedUrls.has(link)
      ) {
        visitedUrls.add(link);
        queue.push({ url: link, depth: nextDepth });
      }
    }

    completedUrls.add(current.url);
    completedUrls.add(response.finalUrl);
    visitedUrls.add(response.finalUrl);

    let detection;
    if (textDetectionClient) {
      logger.info?.(
        `Sending extracted text for ${sanitizeUrlForLog(response.finalUrl)} to Text Detection Service.`,
      );
      try {
        detection = await textDetectionClient.detect(page.text);
      } catch (error) {
        detection = detectionFailure(error);
        logFailure(logger, response.finalUrl, detection.error);
      }
    }

    if (
      !results.some(
        (result) => result.success && result.url === response.finalUrl,
      )
    ) {
      results.push({
        url: response.finalUrl,
        status: response.status,
        contentType: response.contentType,
        title: page.title,
        text: page.text,
        html: response.body,
        links: pageLinks,
        depth: current.depth,
        success: true,
        crawl: {
          status: response.status,
          contentType: response.contentType,
          title: page.title,
        },
        ...(detection ? { detection } : {}),
      });
    }
  }

  return results;
}

module.exports = { crawl };
