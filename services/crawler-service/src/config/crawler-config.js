const { CrawlerError } = require("../utils/crawler-error");
const {
  isAllowedUrl,
  normalizeAllowedHost,
  normalizeUrl,
} = require("../utils/url");

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const CRAWLER_USER_AGENT = "AcademicResearchCrawler/1.0";
const HTTP_PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const MAX_CRAWL_REQUEST_BYTES = 64 * 1024;

function requireInteger(value, name, minimum) {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new TypeError(
      `${name} must be an integer greater than or equal to ${minimum}.`,
    );
  }
}

function validateCrawlerConfig(config) {
  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    throw new TypeError("Crawler config must be an object.");
  }

  const startUrl = normalizeUrl(config.startUrl);
  if (!Array.isArray(config.allowedHosts) || config.allowedHosts.length === 0) {
    throw new TypeError("allowedHosts must contain at least one hostname.");
  }

  const allowedHosts = new Set(config.allowedHosts.map(normalizeAllowedHost));
  if (!isAllowedUrl(startUrl, allowedHosts)) {
    throw new CrawlerError(
      "START_HOST_NOT_ALLOWED",
      "startUrl host is not in allowedHosts.",
    );
  }

  requireInteger(config.maxDepth, "maxDepth", 0);
  requireInteger(config.maxPages, "maxPages", 1);
  requireInteger(config.requestDelayMs, "requestDelayMs", 0);
  requireInteger(config.requestTimeoutMs, "requestTimeoutMs", 1);

  return {
    startUrl,
    allowedHosts,
    maxDepth: config.maxDepth,
    maxPages: config.maxPages,
    requestDelayMs: config.requestDelayMs,
    requestTimeoutMs: config.requestTimeoutMs,
  };
}

module.exports = {
  CRAWLER_USER_AGENT,
  HTTP_PORT,
  MAX_CRAWL_REQUEST_BYTES,
  MAX_RESPONSE_BYTES,
  validateCrawlerConfig,
};
