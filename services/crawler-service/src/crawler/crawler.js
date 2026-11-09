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
    return {
      code: "REQUEST_TIMEOUT",
      message: "Waktu permintaan habis (timeout). Server target tidak memberikan respons dalam batas waktu.",
    };
  }

  if (error instanceof CrawlerError) {
    if (error.code === "HOST_NOT_ALLOWED") {
      return {
        code: "HOST_NOT_ALLOWED",
        message: "Host URL berada di luar daftar domain yang diizinkan (allowed hosts).",
      };
    }
    if (error.code === "SSRF_BLOCKED") {
      return {
        code: "SSRF_BLOCKED",
        message: "Akses ke host diblokir oleh perlindungan SSRF (mengarah ke alamat IP privat/terbatas).",
      };
    }
    if (error.code === "RESPONSE_TOO_LARGE") {
      return {
        code: "RESPONSE_TOO_LARGE",
        message: "Ukuran respons halaman melebihi batas maksimum yang diizinkan.",
      };
    }
    return { code: error.code, message: error.message };
  }

  const causeCode = error.cause?.code || error.code;
  if (causeCode === "ECONNREFUSED") {
    return {
      code: "CONNECTION_REFUSED",
      message: "Koneksi ke host ditolak (connection refused). Server target sedang tidak aktif.",
    };
  }
  if (causeCode === "ENOTFOUND") {
    return {
      code: "HOST_UNREACHABLE",
      message: "Nama domain host tidak ditemukan pada DNS (host unreachable).",
    };
  }
  if (causeCode === "ETIMEDOUT" || causeCode === "ECONNRESET") {
    return {
      code: "REQUEST_TIMEOUT",
      message: "Koneksi terputus atau batas waktu permintaan habis (timeout).",
    };
  }
  if (causeCode === "EHOSTUNREACH" || causeCode === "ENETUNREACH") {
    return {
      code: "HOST_UNREACHABLE",
      message: "Jaringan atau host tujuan tidak dapat dijangkau.",
    };
  }

  return {
    code: "REQUEST_FAILED",
    message:
      error.message && error.message !== "fetch failed"
        ? error.message
        : "Gagal melakukan permintaan HTTP ke server target.",
  };
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
        const isAccessDenied = response.status === 403 || response.status === 401;
        policy = {
          available: false,
          rules: [],
          status: response.status,
          error: {
            code: "ROBOTS_UNAVAILABLE",
            reason: isAccessDenied ? "ACCESS_DENIED" : "HTTP_ERROR",
            status: response.status,
            message: isAccessDenied
              ? `Akses ke robots.txt ditolak oleh server target (HTTP ${response.status}).`
              : `Pemeriksaan robots.txt gagal karena server mengembalikan HTTP ${response.status}.`,
          },
        };
      } else {
        policy = {
          available: true,
          rules: parseRobotsTxt(response.body),
        };
      }
    } catch (error) {
      const details = errorDetails(error);
      logFailure(logger, `${new URL(pageUrl).origin}/robots.txt`, details);
      let robotsMsg = `Pemeriksaan robots.txt gagal: ${details.message}`;
      if (details.code === "CONNECTION_REFUSED") {
        robotsMsg =
          "Host target tidak dapat dijangkau (koneksi ditolak saat memeriksa robots.txt). Server target mungkin tidak aktif.";
      } else if (details.code === "HOST_UNREACHABLE") {
        robotsMsg =
          "Host target tidak ditemukan pada DNS saat memeriksa robots.txt (host unreachable).";
      } else if (details.code === "REQUEST_TIMEOUT") {
        robotsMsg =
          "Waktu permintaan robots.txt habis (timeout). Server target tidak memberikan respons.";
      } else if (details.code === "SSRF_BLOCKED") {
        robotsMsg =
          "Pemeriksaan robots.txt diblokir oleh perlindungan SSRF (mengarah ke IP privat/terbatas).";
      } else if (details.code === "HOST_NOT_ALLOWED") {
        robotsMsg =
          "Host robots.txt berada di luar daftar domain yang diizinkan (allowed hosts).";
      }
      policy = {
        available: false,
        rules: [],
        error: {
          code: "ROBOTS_UNAVAILABLE",
          reason: details.code,
          message: robotsMsg,
        },
      };
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
      const error = robotsPolicy.error || {
        code: "ROBOTS_UNAVAILABLE",
        message: "Pemeriksaan robots.txt gagal; perayapan dihentikan demi kepatuhan aturan situs.",
      };
      logFailure(logger, current.url, error);
      results.push(
        createFailedPage(
          current.url,
          current.depth,
          error,
          robotsPolicy.status || null,
        ),
      );
      completedUrls.add(current.url);
      continue;
    }

    if (!isAllowedByRobots(current.url, robotsPolicy.rules)) {
      const error = {
        code: "ROBOTS_DISALLOWED",
        reason: "ACCESS_DENIED",
        message: "Akses ke URL ini dilarang oleh aturan robots.txt situs target.",
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
